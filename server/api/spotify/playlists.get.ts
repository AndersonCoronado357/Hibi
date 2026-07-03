// Playlists del usuario (nombre, nº de canciones si Spotify lo da, portada, uri).
// OJO: apps en modo Development de Spotify reciben tracks:null (no dan el conteo
// por playlist); en ese caso devolvemos null y la UI oculta el número.
export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const data = await spotifyApi(userId, '/me/playlists?limit=50')
  const items = (data?.items || []).filter(Boolean).map((p: any) => ({
    id: p.id,
    name: p.name,
    tracks: typeof p.tracks?.total === 'number' ? p.tracks.total : null,
    image: p.images?.[0]?.url || null,
    uri: p.uri,
  }))
  return { items }
})
