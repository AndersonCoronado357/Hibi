// Notificaciones del navegador (client-side, sin push). Modelo:
//  · MAESTRO  = "Avisos del escritorio" (permiso + on/off global) → isEnabled/setEnabled.
//  · TIPOS    = "Recordatorios" y "Resumen diario" → typeOn/setType.
// Un tipo solo se dispara si el maestro está activo y hay permiso concedido.
interface NotiReminder { id: string; title: string; remindDate: string; time: string | null; done: boolean }

function localDay(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function useNotifications() {
  const supported = () => import.meta.client && typeof window !== 'undefined' && 'Notification' in window
  const permission = (): NotificationPermission => (supported() ? Notification.permission : 'denied')

  async function requestPermission(): Promise<NotificationPermission> {
    if (!supported()) return 'denied'
    try { return await Notification.requestPermission() } catch { return 'denied' }
  }

  // Interruptor MAESTRO (toggle "Avisos del escritorio").
  const ENABLED_KEY = 'hibi.notif.on'
  function isEnabled(): boolean { try { return localStorage.getItem(ENABLED_KEY) !== 'false' } catch { return true } }
  function setEnabled(on: boolean) { try { localStorage.setItem(ENABLED_KEY, on ? 'true' : 'false') } catch { /* ignore */ } ; if (!on) clearTimers() }

  // TIPOS activos (toggles "Recordatorios" / "Resumen diario"). Default: on.
  const TYPE_KEY = (t: string) => 'hibi.notif.type.' + t
  function typeOn(t: string): boolean { try { return localStorage.getItem(TYPE_KEY(t)) !== 'false' } catch { return true } }
  function setType(t: string, on: boolean) { try { localStorage.setItem(TYPE_KEY(t), on ? 'true' : 'false') } catch { /* ignore */ } }

  const canNotify = () => supported() && Notification.permission === 'granted' && isEnabled()

  // En Chrome/navegadores de celular, `new Notification(...)` desde la página
  // está prohibido (lanza "Illegal constructor") y hay que mostrarla vía el
  // Service Worker. En desktop ambos caminos funcionan, así que probamos
  // primero el del Service Worker (con timeout de seguridad) y si no hay uno
  // disponible caemos al constructor directo.
  async function showNotification(title: string, options?: NotificationOptions): Promise<boolean> {
    if (!supported()) return false
    // Icono SIEMPRE: en Android una notificación sin icono se descarta en
    // silencio. Mismo icono que usa el push del servidor (sw.js).
    const opts: NotificationOptions = { icon: '/icon-512-v3.png', badge: '/icon-512-v3.png', tag: 'hibi', ...options }
    if ('serviceWorker' in navigator) {
      try {
        const reg = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000)),
        ])
        if (reg) { await reg.showNotification(title, opts); return true }
      } catch { /* cae al constructor directo */ }
    }
    try { new Notification(title, opts); return true } catch { return false }
  }

  const NOTIFIED_KEY = () => 'hibi.notified.' + localDay()
  function notifiedIds(): string[] {
    try { return JSON.parse(localStorage.getItem(NOTIFIED_KEY()) || '[]') as string[] } catch { return [] }
  }
  function markNotified(id: string) {
    try {
      const arr = notifiedIds()
      if (!arr.includes(id)) { arr.push(id); localStorage.setItem(NOTIFIED_KEY(), JSON.stringify(arr)) }
    } catch { /* ignore */ }
  }

  let timers: ReturnType<typeof setTimeout>[] = []
  let summaryTimer: ReturnType<typeof setTimeout> | undefined
  function clearReminderTimers() { timers.forEach((t) => clearTimeout(t)); timers = [] }
  function clearSummaryTimer() { if (summaryTimer) { clearTimeout(summaryTimer); summaryTimer = undefined } }
  function clearTimers() { clearReminderTimers(); clearSummaryTimer() }

  function fire(r: NotiReminder) {
    if (!canNotify() || !typeOn('reminders')) return
    if (notifiedIds().includes(r.id)) return
    showNotification('Hibi', { body: r.title }).then((ok) => { if (ok) markNotified(r.id) })
  }

  // Muestra una notificación AHORA (para probar/confirmar). No deduplica.
  function notify(title: string, body?: string): Promise<boolean> {
    if (!supported() || Notification.permission !== 'granted') return Promise.resolve(false)
    return showNotification(title, body ? { body } : undefined)
  }

  // Tipo "Recordatorios": reprograma los recordatorios de HOY con hora futura.
  function scheduleToday(reminders: NotiReminder[]) {
    clearReminderTimers()
    if (!canNotify() || !typeOn('reminders')) return
    const today = localDay()
    const now = Date.now()
    for (const r of reminders || []) {
      if (!r || r.done || r.remindDate !== today || !r.time) continue
      if (notifiedIds().includes(r.id)) continue
      const [h, m] = String(r.time).split(':').map(Number)
      if (Number.isNaN(h)) continue
      const at = new Date(); at.setHours(h, m || 0, 0, 0)
      const delay = at.getTime() - now
      if (delay <= 0) continue // ya pasó hoy: no molestar retroactivamente
      timers.push(setTimeout(() => fire(r), Math.min(delay, 2_147_483_000)))
    }
  }

  // Tipo "Resumen diario": una notificación con el resumen del día, a las 8:00
  // (o al abrir si ya pasó). Una sola vez por día.
  function scheduleDailySummary(text: string) {
    clearSummaryTimer()
    if (!canNotify() || !typeOn('summary') || !text) return
    const key = 'hibi.summary.' + localDay()
    try { if (localStorage.getItem(key)) return } catch { /* ignore */ }
    const at = new Date(); at.setHours(8, 0, 0, 0)
    const delay = at.getTime() - Date.now()
    const fireIt = () => { showNotification('Hibi', { body: text }).then((ok) => { if (ok) localStorage.setItem(key, '1') }) }
    if (delay <= 0) fireIt()
    else summaryTimer = setTimeout(fireIt, Math.min(delay, 2_147_483_000))
  }

  // ─────────── Web Push real (llega con la app cerrada) ───────────
  const pushSupported = () => import.meta.client && 'serviceWorker' in navigator && 'PushManager' in window

  function urlBase64ToUint8Array(base64: string): Uint8Array {
    const padding = '='.repeat((4 - (base64.length % 4)) % 4)
    const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
    const raw = atob(b64)
    return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
  }

  // Suscribe este navegador/dispositivo y guarda la suscripción en el servidor.
  // Devuelve { ok, error } en vez de tragarse el motivo del fallo — hace falta
  // poder mostrárselo al usuario cuando algo falla en un dispositivo que no
  // podemos inspeccionar directamente.
  async function subscribePush(vapidPublicKey: string): Promise<{ ok: boolean; error?: string }> {
    if (!pushSupported()) return { ok: false, error: 'pushSupported=false (falta serviceWorker o PushManager)' }
    if (!vapidPublicKey) return { ok: false, error: 'vapidPublicKey vacío' }
    try {
      const reg = await navigator.serviceWorker.ready
      let sub = await reg.pushManager.getSubscription()
      if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) })
      const json = sub.toJSON()
      await $fetch('/api/push/subscribe', { method: 'POST', body: { endpoint: json.endpoint, keys: json.keys } })
      return { ok: true }
    } catch (err: any) { return { ok: false, error: String(err?.message || err) } }
  }

  // Da de baja este navegador (se llama al apagar el maestro de notificaciones).
  async function unsubscribePush(): Promise<void> {
    if (!pushSupported()) return
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await $fetch('/api/push/unsubscribe', { method: 'POST', body: { endpoint: sub.endpoint } }).catch(() => {})
        await sub.unsubscribe()
      }
    } catch { /* ignore */ }
  }

  // ¿Este dispositivo está suscrito a push real? Si lo está, el SERVIDOR manda
  // los recordatorios/resumen, así que el agendado client-side (setTimeout) NO
  // debe correr o llegaría el aviso DOS veces (push al estar cerrada + local al
  // abrir). El client-side queda solo como respaldo para dispositivos sin push.
  async function hasPushSubscription(): Promise<boolean> {
    if (!pushSupported()) return false
    try {
      const reg = await navigator.serviceWorker.ready
      return !!(await reg.pushManager.getSubscription())
    } catch { return false }
  }

  return { supported, permission, requestPermission, isEnabled, setEnabled, typeOn, setType, scheduleToday, scheduleDailySummary, clearTimers, notify, pushSupported, subscribePush, unsubscribePush, hasPushSubscription }
}
