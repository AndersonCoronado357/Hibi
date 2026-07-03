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
    try { new Notification('Hibi', { body: r.title }); markNotified(r.id) } catch { /* ignore */ }
  }

  // Muestra una notificación AHORA (para probar/confirmar). No deduplica.
  function notify(title: string, body?: string): boolean {
    if (!supported() || Notification.permission !== 'granted') return false
    try { new Notification(title, body ? { body } : undefined); return true } catch { return false }
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
    const fireIt = () => { try { new Notification('Hibi', { body: text }); localStorage.setItem(key, '1') } catch { /* ignore */ } }
    if (delay <= 0) fireIt()
    else summaryTimer = setTimeout(fireIt, Math.min(delay, 2_147_483_000))
  }

  return { supported, permission, requestPermission, isEnabled, setEnabled, typeOn, setType, scheduleToday, scheduleDailySummary, clearTimers, notify }
}
