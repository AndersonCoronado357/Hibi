// Playlists del usuario (nombre, nº de canciones, portada, uri).
// /me/playlists NO da el conteo (tracks:null en modo Development), así que lo
// pedimos por playlist con /items?limit=1 → total, en tandas de 5 para no chocar
// con el 429.
export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const data = await spotifyApi(userId, '/me/playlists?limit=50')
  const base = (data?.items || []).filter(Boolean).map((p: any) => ({
    id: p.id as string,
    name: p.name as string,
    tracks: typeof p.tracks?.total === 'number' ? (p.tracks.total as number) : null,
    image: p.images?.[0]?.url || null,
    uri: p.uri as string,
  }))

  // Rellena el conteo faltante (barato: limit=1) en tandas de 5.
  const missing = base.filter((p) => p.tracks == null && p.id)
  const CHUNK = 5
  for (let i = 0; i < missing.length; i += CHUNK) {
    const slice = missing.slice(i, i + CHUNK)
    const counts = await Promise.all(slice.map((p) => getPlaylistCount(userId, p.id)))
    slice.forEach((p, j) => { p.tracks = counts[j] })
    if (i + CHUNK < missing.length) await new Promise((r) => setTimeout(r, 200))
  }

  return { items: base }
})
