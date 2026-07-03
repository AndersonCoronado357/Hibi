// ¿La cuenta tiene Spotify conectado? Devuelve nombre y si es premium.
export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const a = await getSpotifyAccount(userId)
  if (!a) return { connected: false }
  return { connected: true, displayName: a.displayName, product: a.product, premium: a.product === 'premium' }
})
