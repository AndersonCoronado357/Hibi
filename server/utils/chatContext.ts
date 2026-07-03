// Contexto de datos REALES para el chat. Cuando el usuario pide un resumen (los
// chips del chat o preguntas tipo "¿qué tengo hoy?"), leemos sus datos de la BD
// y se los pasamos a la IA como contexto para que responda con información real
// en vez de genérica. Se usa SOLO si el mensaje no creó nada (no es un comando).
import { and, eq, gte, asc, desc } from 'drizzle-orm'

export type SummaryIntent = 'today' | 'tomorrow' | 'habits' | 'reminders' | 'tasks'

// ¿El mensaje pide un resumen de datos? (bilingüe ES/EN). Se llama DESPUÉS del
// intérprete de comandos, así que crear algo siempre tiene prioridad.
export function detectSummaryIntent(text: string): SummaryIntent | null {
  const s = (text || '').toLowerCase()
  if (/(h[aá]bito|\bhabits?\b)/.test(s)) return 'habits'
  if (/(ma[ñn]ana|tomorrow)/.test(s)) return 'tomorrow'
  if (/(recordatorio|reminder)/.test(s)) return 'reminders'
  if (/(hoy|today|mi d[ií]a|my day|resumen|summary|agenda)/.test(s)) return 'today'
  if (/(\btareas?\b|\btasks?\b)/.test(s)) return 'tasks'
  return null
}

function bullets(items: string[]): string {
  return items.length ? items.map((x) => '- ' + x).join('\n') : '(nada)'
}

const HEADER = (today: string) =>
  `Fecha de hoy: ${today}. Estos son los datos REALES del usuario en su app Hibi. ` +
  'Responde SOLO con base en estos datos, en español, con tono cálido y BREVE, usando viñetas. ' +
  'Si una sección está vacía, dilo con naturalidad y anima con cariño. No inventes nada que no esté aquí.'

// Construye el bloque de contexto con los datos reales del usuario según la intención.
export async function buildSummaryContext(userId: number, intent: SummaryIntent): Promise<string> {
  const db = useDb()
  const today = localDay(0)

  if (intent === 'today' || intent === 'tomorrow') {
    const day = intent === 'today' ? today : localDay(1)
    const label = intent === 'today' ? 'HOY' : 'MAÑANA'
    const evs = await db.select({ t: schema.events.title, s: schema.events.startTime }).from(schema.events)
      .where(and(eq(schema.events.userId, userId), eq(schema.events.eventDate, day))).orderBy(asc(schema.events.startTime))
    const tks = await db.select({ t: schema.tasks.title }).from(schema.tasks)
      .where(and(eq(schema.tasks.userId, userId), eq(schema.tasks.status, 'pending'), eq(schema.tasks.dueDate, day)))
    const rms = await db.select({ t: schema.reminders.title, h: schema.reminders.time }).from(schema.reminders)
      .where(and(eq(schema.reminders.userId, userId), eq(schema.reminders.remindDate, day), eq(schema.reminders.done, false))).orderBy(asc(schema.reminders.time))
    const parts = [
      HEADER(today),
      `EVENTOS ${label} (calendario):`, bullets(evs.map((e) => e.t + (e.s ? ` a las ${e.s}` : ''))),
      `TAREAS ${label}:`, bullets(tks.map((t) => t.t)),
      `RECORDATORIOS ${label}:`, bullets(rms.map((r) => r.t + (r.h ? ` a las ${r.h}` : ''))),
    ]
    if (intent === 'today') {
      const nts = await db.select({ t: schema.notes.title }).from(schema.notes)
        .where(eq(schema.notes.userId, userId)).orderBy(desc(schema.notes.updatedAt)).limit(5)
      parts.push('NOTAS RECIENTES:', bullets(nts.map((n) => n.t || '(sin título)')))
    }
    return parts.join('\n')
  }

  if (intent === 'habits') {
    const habits = await db.select({ id: schema.habits.id, name: schema.habits.name }).from(schema.habits)
      .where(eq(schema.habits.userId, userId)).orderBy(asc(schema.habits.position))
    if (!habits.length) return `${HEADER(today)}\nHÁBITOS: el usuario aún no tiene hábitos creados.`
    const comps = await db.select({ habitId: schema.habitCompletions.habitId, day: schema.habitCompletions.day }).from(schema.habitCompletions)
      .where(and(eq(schema.habitCompletions.userId, userId), gte(schema.habitCompletions.day, localDay(-6))))
    const doneToday = new Set(comps.filter((c) => c.day === today).map((c) => c.habitId))
    const week: Record<string, number> = {}
    for (const c of comps) week[c.habitId] = (week[c.habitId] || 0) + 1
    const lines = habits.map((h) => `${h.name}: ${doneToday.has(h.id) ? 'hecho hoy ✓' : 'pendiente hoy'} · ${week[h.id] || 0}/7 en la última semana`)
    return `${HEADER(today)}\nHÁBITOS (hoy ${doneToday.size}/${habits.length} completados):\n${bullets(lines)}`
  }

  if (intent === 'reminders') {
    const rms = await db.select({ t: schema.reminders.title, d: schema.reminders.remindDate, h: schema.reminders.time }).from(schema.reminders)
      .where(and(eq(schema.reminders.userId, userId), eq(schema.reminders.done, false), gte(schema.reminders.remindDate, today)))
      .orderBy(asc(schema.reminders.remindDate), asc(schema.reminders.time)).limit(25)
    return `${HEADER(today)}\nPRÓXIMOS RECORDATORIOS:\n${bullets(rms.map((r) => `${r.d}${r.h ? ' ' + r.h : ''} — ${r.t}`))}`
  }

  // tasks
  const tks = await db.select({ t: schema.tasks.title, d: schema.tasks.dueDate }).from(schema.tasks)
    .where(and(eq(schema.tasks.userId, userId), eq(schema.tasks.status, 'pending')))
    .orderBy(asc(schema.tasks.dueDate)).limit(30)
  return `${HEADER(today)}\nTAREAS PENDIENTES (${tks.length}):\n${bullets(tks.map((t) => `${t.t}${t.d ? ` (para ${t.d})` : ''}`))}`
}
