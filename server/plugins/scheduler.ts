// Programador interno (corre dentro del proceso Nitro, sin cron externo).
// Cada minuto revisa recordatorios que vencen y, después de las 8:00, el
// resumen diario, y los manda como PUSH real (llegan con la app cerrada).
// Ver server/utils/webPush.ts. Un solo contenedor → una sola instancia.
export default defineNitroPlugin(() => {
  // En dev con HMR esto puede montarse varias veces; el guard evita timers duplicados.
  const g = globalThis as any
  if (g.__hibiSchedulerStarted) return
  g.__hibiSchedulerStarted = true

  const TICK_MS = 60 * 1000
  const tick = async () => {
    try { await runScheduler() } catch { /* nunca tumbar el server por un fallo de push */ }
  }
  // Primer ciclo a los 15s (deja que la BD/conexión estén listas), luego cada minuto.
  setTimeout(() => { void tick(); setInterval(tick, TICK_MS) }, 15_000)
})
