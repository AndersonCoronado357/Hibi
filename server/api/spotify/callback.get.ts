// Vuelta de Spotify: valida el state, intercambia el code por tokens y redirige.
export default defineEventHandler(async (event) => {
  const cfg = useRuntimeConfig()
  const base = (process.env.ORIGIN || (cfg.origin as string) || '').replace(/\/+$/, '')
  const back = (s: string) => sendRedirect(event, `${base}/spotify?spotify=${s}`)

  let userId: number
  try { userId = await requireUserId(event) } catch { return sendRedirect(event, `${base}/login`) }

  const q = getQuery(event)
  const code = String(q.code || '')
  const state = String(q.state || '')
  const saved = getCookie(event, 'sp_state')
  deleteCookie(event, 'sp_state', { path: '/' })
  if (q.error || !code || !state || !saved || state !== saved) return back('error')

  try { await spotifyConnect(userId, code) } catch { return back('error') }
  return back('connected')
})
