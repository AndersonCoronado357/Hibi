// Entrega un access_token válido al cliente (para el Web Playback SDK y llamadas
// puntuales). El refresh_token nunca sale del servidor.
export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const token = await getValidAccessToken(userId)
  if (!token) throw createError({ statusCode: 401, message: 'Spotify no conectado' })
  return { accessToken: token }
})
