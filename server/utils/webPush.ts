// Push real (Web Push + VAPID). A diferencia de useNotifications.ts (client-side,
// solo con la app abierta), esto sí llega con la app cerrada: el navegador
// despierta el Service Worker cuando llega el push y este muestra la notificación.
import webpush from 'web-push'
import { eq, and, count, isNull, lte, gte, or, sql as dsql } from 'drizzle-orm'

// "Ahora" en hora Colombia (UTC-5). Hibi no guarda zona por usuario y el
// usuario está en Colombia; mismo criterio que Sprout. Devuelve fecha
// (YYYY-MM-DD) y hora (HH:MM) para comparar contra remind_date/time.
function nowCO() {
  const co = new Date(Date.now() - 5 * 3600 * 1000)
  const today = co.toISOString().slice(0, 10)
  const hh = String(co.getUTCHours()).padStart(2, '0')
  const mm = String(co.getUTCMinutes()).padStart(2, '0')
  return { co, today, hhmm: `${hh}:${mm}`, hour: co.getUTCHours() }
}

function pushEnabled(): boolean {
  return !!(process.env.VAPID_PUBLIC_KEY || (useRuntimeConfig().public as any).vapidPublicKey)
}
export { pushEnabled }

// OJO: leer siempre de process.env primero (con useRuntimeConfig como
// respaldo), nunca solo del runtimeConfig — en prod el env_file se aplica al
// ARRANCAR el contenedor, no durante el build, así que el valor "horneado"
// en el build queda vacío. Mismo patrón que server/utils/mailer.ts.
let configured = false
function ensureConfigured() {
  if (configured) return
  const cfg = useRuntimeConfig()
  const publicKey = process.env.VAPID_PUBLIC_KEY || (cfg.public as any).vapidPublicKey as string
  const privateKey = process.env.VAPID_PRIVATE_KEY || cfg.vapidPrivateKey as string
  const subject = process.env.VAPID_SUBJECT || cfg.vapidSubject as string
  if (!publicKey || !privateKey) throw new Error('Faltan VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY')
  webpush.setVapidDetails(subject, publicKey, privateKey)
  configured = true
}

// Manda un push a TODOS los dispositivos suscritos de un usuario. Si el
// navegador confirma que una suscripción ya no existe (404/410), la borramos.
export async function sendPushToUser(userId: number, payload: { title: string; body: string }) {
  ensureConfigured()
  const subs = await useDb().select().from(schema.pushSubscriptions).where(eq(schema.pushSubscriptions.userId, userId))
  const results = await Promise.allSettled(subs.map(async (s) => {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify(payload),
      )
    } catch (err: any) {
      if (err?.statusCode === 404 || err?.statusCode === 410) {
        await useDb().delete(schema.pushSubscriptions).where(eq(schema.pushSubscriptions.id, s.id))
      }
      throw err
    }
  }))
  return { sent: results.filter((r) => r.status === 'fulfilled').length, failed: results.filter((r) => r.status === 'rejected').length }
}

// ¿El usuario tiene activado este tipo de aviso? (guardado en user_settings.
// notifications = { desktop, reminders, summary }). Ausente = activado.
async function typeOn(userId: number, type: 'reminders' | 'summary'): Promise<boolean> {
  const [row] = await useDb().select({ n: schema.userSettings.notifications }).from(schema.userSettings)
    .where(eq(schema.userSettings.userId, userId)).limit(1)
  const n = (row?.n || {}) as Record<string, boolean>
  return n[type] !== false
}

// Recordatorios que vencen HOY con hora ya cumplida, sin enviar aún. Ventana de
// 3h para que un reinicio del servidor no dispare de golpe recordatorios muy
// viejos. Solo se marca pushed_at cuando el push SE ENTREGÓ (sent>0): si falla
// (p. ej. ningún dispositivo alcanzable en ese momento) se reintenta el próximo
// minuto mientras siga dentro de la ventana. Si el tipo está apagado, se marca
// igual para no reprocesarlo.
export async function sendDueReminders(): Promise<{ sent: number; matched: number }> {
  ensureConfigured()
  const { co, today, hhmm } = nowCO()
  const lb = new Date(co.getTime() - 3 * 3600 * 1000)
  const lowerBound = lb.toISOString().slice(0, 10) < today ? '00:00' : lb.toISOString().slice(11, 16)

  const due = await useDb().select().from(schema.reminders).where(and(
    eq(schema.reminders.remindDate, today),
    isNull(schema.reminders.pushedAt),
    or(eq(schema.reminders.done, false), isNull(schema.reminders.done)),
    dsql`${schema.reminders.time} is not null`,
    lte(schema.reminders.time, hhmm),
    gte(schema.reminders.time, lowerBound),
  ))

  const mark = (id: string) => useDb().update(schema.reminders).set({ pushedAt: new Date() }).where(eq(schema.reminders.id, id))
  let sent = 0
  for (const r of due) {
    if (!(await typeOn(r.userId, 'reminders'))) { await mark(r.id); continue } // apagado: marcar y saltar
    const res = await sendPushToUser(r.userId, { title: 'Hibi · Recordatorio', body: r.title })
    if (res.sent > 0) { await mark(r.id); sent++ } // solo se marca si de verdad se envió; si no, reintenta
  }
  return { sent, matched: due.length }
}

// Resumen diario por push, después de las 8:00, una vez al día por usuario
// (con suscripción y el tipo activado). Cuenta tareas/eventos/recordatorios de hoy.
export async function sendDailySummaries(): Promise<{ sent: number }> {
  ensureConfigured()
  const { today, hour } = nowCO()
  if (hour < 8) return { sent: 0 }
  const db = useDb()

  // Usuarios con al menos una suscripción push y resumen no enviado hoy.
  const users = await db.selectDistinct({ userId: schema.pushSubscriptions.userId })
    .from(schema.pushSubscriptions)
  // Marca el resumen del día como procesado (upsert por si no hay fila de settings).
  const markToday = (userId: number) => db.insert(schema.userSettings).values({ userId, summaryPushedOn: today })
    .onConflictDoUpdate({ target: schema.userSettings.userId, set: { summaryPushedOn: today } })
  let sent = 0
  for (const { userId } of users) {
    const [st] = await db.select().from(schema.userSettings).where(eq(schema.userSettings.userId, userId)).limit(1)
    if (st?.summaryPushedOn === today) continue
    if (!(await typeOn(userId, 'summary'))) { await markToday(userId); continue } // apagado: marcar y saltar
    const [tk] = await db.select({ n: count() }).from(schema.tasks)
      .where(and(eq(schema.tasks.userId, userId), eq(schema.tasks.status, 'pending'), eq(schema.tasks.dueDate, today)))
    const [ev] = await db.select({ n: count() }).from(schema.events)
      .where(and(eq(schema.events.userId, userId), eq(schema.events.eventDate, today)))
    const [rm] = await db.select({ n: count() }).from(schema.reminders)
      .where(and(eq(schema.reminders.userId, userId), eq(schema.reminders.remindDate, today), eq(schema.reminders.done, false)))
    const tasks = tk?.n ?? 0, events = ev?.n ?? 0, rems = rm?.n ?? 0
    const body = `Hoy tienes ${tasks} tareas, ${events} eventos y ${rems} recordatorios.`
    const res = await sendPushToUser(userId, { title: 'Hibi', body })
    // Solo se marca si de verdad se entregó; si falla, se reintenta el próximo minuto.
    if (res.sent > 0) { await markToday(userId); sent++ }
  }
  return { sent }
}

// Corre un ciclo completo del programador. Segura de llamar en cualquier momento.
export async function runScheduler(): Promise<{ reminders: number; summaries: number }> {
  if (!pushEnabled()) return { reminders: 0, summaries: 0 }
  const rem = await sendDueReminders().catch(() => ({ sent: 0 }))
  const sum = await sendDailySummaries().catch(() => ({ sent: 0 }))
  return { reminders: rem.sent, summaries: sum.sent }
}
