// Dispara manualmente un ciclo del programador (recordatorios + resumen).
// Protegido con CRON_SECRET (header x-cron-secret o ?secret=). Sirve para
// pruebas y como respaldo si se quiere disparar por cron externo.
export default defineEventHandler(async (event) => {
  const secret = process.env.CRON_SECRET || useRuntimeConfig().cronSecret
  const given = getHeader(event, 'x-cron-secret') || String(getQuery(event).secret || '')
  if (!secret || given !== secret) throw createError({ statusCode: 401, message: 'No autorizado' })
  return runScheduler()
})
