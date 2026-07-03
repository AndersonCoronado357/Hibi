// Playlists del usuario (nombre, nº de canciones, portada, uri para reproducir).
export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const data = await spotifyApi(userId, '/me/playlists?limit=50')
  const items = (data?.items || []).filter(Boolean).map((p: any) => ({
    id: p.id,
    name: p.name,
    tracks: p.tracks?.total ?? 0,
    image: p.images?.[0]?.url || null,
    uri: p.uri,
  }))
  return { items }
})
