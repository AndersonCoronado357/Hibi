// Cola real de reproducción (pista actual + próximas). El SDK solo expone una
// ventana chica; este endpoint (/me/player/queue) trae la cola completa.
export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const d = await spotifyApi(userId, '/me/player/queue')
  const map = (tr: any) => tr ? {
    name: tr.name || '',
    artists: (tr.artists || []).map((a: any) => a.name).join(', '),
    image: tr.album?.images?.[0]?.url || null,
    uri: tr.uri || '',
    durationMs: tr.duration_ms || 0,
  } : null
  return {
    current: map(d?.currently_playing),
    queue: (d?.queue || []).map(map).filter(Boolean),
  }
})
