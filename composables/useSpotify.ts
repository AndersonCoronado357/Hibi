// Cliente de Spotify: estado de conexión, playlists reales y reproductor con el
// Web Playback SDK (requiere Premium). El token lo entrega el servidor.
export interface SpotifyStatus { connected: boolean; displayName?: string | null; premium?: boolean }
export interface SpotifyPlaylist { id: string; name: string; tracks: number; image: string | null; uri: string }
export interface SpotifyTrack { name: string; artists: string; image: string | null; uri: string; durationMs: number }

let player: any = null
let posTimer: ReturnType<typeof setInterval> | undefined

function mapTrack(tr: any): SpotifyTrack {
  return {
    name: tr?.name || '',
    artists: (tr?.artists || []).map((a: any) => a.name).join(', '),
    image: tr?.album?.images?.[0]?.url || null,
    uri: tr?.uri || '',
    durationMs: tr?.duration_ms || 0,
  }
}

export function useSpotify() {
  const status = useState<SpotifyStatus>('spotify.status', () => ({ connected: false }))
  const playlists = useState<SpotifyPlaylist[]>('spotify.playlists', () => [])
  const queue = useState<SpotifyTrack[]>('spotify.queue', () => [])
  const ready = useState<boolean>('spotify.ready', () => false)
  const deviceId = useState<string>('spotify.device', () => '')
  const current = useState<SpotifyTrack | null>('spotify.current', () => null)
  const paused = useState<boolean>('spotify.paused', () => true)
  const position = useState<number>('spotify.position', () => 0)
  const duration = useState<number>('spotify.duration', () => 0)

  async function fetchStatus() {
    try { status.value = await $fetch<SpotifyStatus>('/api/spotify/status') } catch { status.value = { connected: false } }
    return status.value
  }
  async function fetchPlaylists() {
    try { const r = await $fetch<{ items: SpotifyPlaylist[] }>('/api/spotify/playlists'); playlists.value = r.items || [] } catch { playlists.value = [] }
  }
  function connect() { if (import.meta.client) window.location.href = '/api/spotify/login' }
  async function disconnect() {
    try { await $fetch('/api/spotify/disconnect', { method: 'POST' }) } catch { /* ignore */ }
    try { player?.disconnect?.() } catch { /* ignore */ }
    player = null; ready.value = false; deviceId.value = ''; current.value = null; queue.value = []; playlists.value = []
    status.value = { connected: false }
  }

  function loadSdk(): Promise<any> {
    return new Promise((resolve) => {
      const w = window as any
      if (w.Spotify) return resolve(w.Spotify)
      w.onSpotifyWebPlaybackSDKReady = () => resolve(w.Spotify)
      if (!document.getElementById('spotify-sdk')) {
        const s = document.createElement('script'); s.id = 'spotify-sdk'; s.src = 'https://sdk.scdn.co/spotify-player.js'; s.async = true
        document.body.appendChild(s)
      }
    })
  }

  function startPosTimer() {
    if (posTimer) return
    posTimer = setInterval(() => { if (!paused.value && duration.value) position.value = Math.min(position.value + 1000, duration.value) }, 1000)
  }

  // Crea (una vez) el reproductor del SDK y espera a que quede "ready". Solo Premium.
  async function ensurePlayer(): Promise<boolean> {
    if (!import.meta.client || !status.value.premium) return false
    if (player) return !!deviceId.value
    const Spotify = await loadSdk()
    player = new Spotify.Player({
      name: 'Hibi',
      getOAuthToken: (cb: (t: string) => void) => { $fetch<{ accessToken: string }>('/api/spotify/token').then((r) => cb(r.accessToken)).catch(() => { /* ignore */ }) },
      volume: 0.8,
    })
    player.addListener('ready', ({ device_id }: any) => { deviceId.value = device_id; ready.value = true })
    player.addListener('not_ready', () => { ready.value = false })
    player.addListener('player_state_changed', (st: any) => {
      if (!st) return
      paused.value = !!st.paused
      position.value = st.position || 0
      duration.value = st.duration || 0
      current.value = st.track_window?.current_track ? mapTrack(st.track_window.current_track) : null
      queue.value = (st.track_window?.next_tracks || []).map(mapTrack)
    })
    startPosTimer()
    try { await player.connect() } catch { /* ignore */ }
    for (let i = 0; i < 40 && !deviceId.value; i++) await new Promise((r) => setTimeout(r, 100))
    return !!deviceId.value
  }

  async function playContext(uri: string): Promise<boolean> {
    const ok = await ensurePlayer()
    if (!ok || !deviceId.value) return false
    try { await $fetch('/api/spotify/play', { method: 'PUT', body: { deviceId: deviceId.value, contextUri: uri } }); return true } catch { return false }
  }
  async function playUris(uris: string[]): Promise<boolean> {
    const ok = await ensurePlayer()
    if (!ok || !deviceId.value || !uris.length) return false
    try { await $fetch('/api/spotify/play', { method: 'PUT', body: { deviceId: deviceId.value, uris } }); return true } catch { return false }
  }
  async function togglePlay() { try { await player?.togglePlay() } catch { /* ignore */ } }
  async function next() { try { await player?.nextTrack() } catch { /* ignore */ } }
  async function prev() { try { await player?.previousTrack() } catch { /* ignore */ } }
  async function seek(ms: number) { try { await player?.seek(ms); position.value = ms } catch { /* ignore */ } }

  return { status, playlists, queue, ready, deviceId, current, paused, position, duration, fetchStatus, fetchPlaylists, connect, disconnect, ensurePlayer, playContext, playUris, togglePlay, next, prev, seek }
}
