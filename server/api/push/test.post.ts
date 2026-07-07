// Manda un push de prueba real (llega aunque la app esté cerrada) al usuario actual.
export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const result = await sendPushToUser(userId, { title: 'Hibi', body: '¡Listo! Así se verán tus recordatorios.' })
  if (result.sent === 0) throw createError({ statusCode: 400, message: 'No hay ningún dispositivo suscrito todavía' })
  return result
})
