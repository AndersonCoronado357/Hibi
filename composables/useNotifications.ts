// Notificaciones simples del navegador para los recordatorios de HOY, mientras
// la app está abierta (sin service worker ni push). Todo client-side y a prueba
// de fallos: si no hay soporte o permiso, no hace nada.
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
  function clearTimers() { timers.forEach((t) => clearTimeout(t)); timers = [] }

  // Interruptor global de las notificaciones (lo maneja el toggle "Recordatorios").
  const ENABLED_KEY = 'hibi.notif.on'
  function isEnabled(): boolean { try { return localStorage.getItem(ENABLED_KEY) !== 'false' } catch { return true } }
  function setEnabled(on: boolean) { try { localStorage.setItem(ENABLED_KEY, on ? 'true' : 'false') } catch { /* ignore */ } ; if (!on) clearTimers() }

  function fire(r: NotiReminder) {
    if (!supported() || Notification.permission !== 'granted' || !isEnabled()) return
    if (notifiedIds().includes(r.id)) return
    try { new Notification('Hibi', { body: r.title }); markNotified(r.id) } catch { /* ignore */ }
  }

  // Muestra una notificación AHORA (para probar/confirmar). No deduplica.
  function notify(title: string, body?: string): boolean {
    if (!supported() || Notification.permission !== 'granted') return false
    try { new Notification(title, body ? { body } : undefined); return true } catch { return false }
  }

  // Reprograma desde cero los recordatorios de HOY con hora futura. Los ya
  // vencidos no se disparan retroactivamente (solo cuentan como notificados).
  function scheduleToday(reminders: NotiReminder[]) {
    if (!supported() || Notification.permission !== 'granted' || !isEnabled()) return
    clearTimers()
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

  return { supported, permission, requestPermission, scheduleToday, clearTimers, notify, isEnabled, setEnabled }
}
