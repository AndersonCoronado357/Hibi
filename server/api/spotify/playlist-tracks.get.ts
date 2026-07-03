// Todas las canciones de una playlist (paginadas). ?id=<playlistId>.
// Si Spotify bloquea el endpoint (403 en modo Development), devuelve lista vacía.
export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = String(getQuery(event).id || '')
  if (!id) throw createError({ statusCode: 400, message: 'Falta id de playlist' })
  let raw: any[] = []
  try { raw = await getAllPlaylistTracks(userId, id) } catch { raw = [] } // 403/limitación → vacío
  const items = raw
    .map((it: any) => it?.item || it?.track) // el endpoint /items usa it.item
    .filter((tr: any) => tr && tr.uri && tr.type !== 'episode')
    .map((tr: any) => ({
      name: tr.name || '',
      artists: (tr.artists || []).map((a: any) => a.name).join(', '),
      image: tr.album?.images?.[0]?.url || null,
      uri: tr.uri,
      durationMs: tr.duration_ms || 0,
    }))
  return { items, total: items.length }
})
