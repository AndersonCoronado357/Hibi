// Integración con Spotify: OAuth (Authorization Code), guardado y renovación del
// token por usuario, y proxy a la Web API. El refresh_token vive SOLO en el
// servidor; el access_token se renueva solo y se entrega al cliente para el SDK.
import { eq } from 'drizzle-orm'

export const SPOTIFY_SCOPES = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-read-playback-state',
  'user-modify-playback-state',
  'playlist-read-private',
  'playlist-read-collaborative',
  'user-library-read',
].join(' ')

function creds() {
  const cfg = useRuntimeConfig()
  const id = process.env.SPOTIFY_CLIENT_ID || (cfg.spotifyClientId as string) || ''
  const secret = process.env.SPOTIFY_CLIENT_SECRET || (cfg.spotifyClientSecret as string) || ''
  if (!id || !secret) throw createError({ statusCode: 500, message: 'Spotify no está configurado (faltan SPOTIFY_CLIENT_ID/SECRET)' })
  return { id, secret }
}

export function spotifyRedirectUri(): string {
  const cfg = useRuntimeConfig()
  const origin = (process.env.ORIGIN || (cfg.origin as string) || 'http://localhost:3100').replace(/\/+$/, '')
  return `${origin}/api/spotify/callback`
}

export function spotifyAuthorizeUrl(state: string): string {
  const { id } = creds()
  const p = new URLSearchParams({
    response_type: 'code',
    client_id: id,
    scope: SPOTIFY_SCOPES,
    redirect_uri: spotifyRedirectUri(),
    state,
  })
  return `https://accounts.spotify.com/authorize?${p.toString()}`
}

async function tokenRequest(body: Record<string, string>) {
  const { id, secret } = creds()
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64'),
    },
    body: new URLSearchParams(body).toString(),
  })
  const j: any = await res.json().catch(() => ({}))
  if (!res.ok) throw createError({ statusCode: 400, message: 'Spotify token: ' + (j.error_description || j.error || res.status) })
  return j as { access_token: string; refresh_token?: string; expires_in: number; scope?: string }
}

async function saveTokens(userId: number, t: { access_token: string; refresh_token?: string; expires_in: number; scope?: string }, keepRefresh?: string) {
  const db = useDb()
  const expiresAt = new Date(Date.now() + Math.max(60, t.expires_in - 30) * 1000)
  const set = { accessToken: t.access_token, refreshToken: (t.refresh_token || keepRefresh)!, expiresAt, scope: t.scope ?? '', updatedAt: new Date() }
  await db.insert(schema.spotifyAccounts).values({ userId, ...set })
    .onConflictDoUpdate({ target: schema.spotifyAccounts.userId, set })
}

export async function getSpotifyAccount(userId: number) {
  const db = useDb()
  const [a] = await db.select().from(schema.spotifyAccounts).where(eq(schema.spotifyAccounts.userId, userId)).limit(1)
  return a || null
}

// Access token válido (renueva si está por vencer).
export async function getValidAccessToken(userId: number): Promise<string | null> {
  const a = await getSpotifyAccount(userId)
  if (!a) return null
  if (new Date(a.expiresAt).getTime() > Date.now() + 5000) return a.accessToken
  const t = await tokenRequest({ grant_type: 'refresh_token', refresh_token: a.refreshToken })
  await saveTokens(userId, t, a.refreshToken)
  return t.access_token
}

// Intercambia el code del callback, guarda tokens y perfil (para saber si es premium).
export async function spotifyConnect(userId: number, code: string) {
  const t = await tokenRequest({ grant_type: 'authorization_code', code, redirect_uri: spotifyRedirectUri() })
  await saveTokens(userId, t)
  try {
    const me = await spotifyApi(userId, '/me')
    const db = useDb()
    await db.update(schema.spotifyAccounts)
      .set({ spotifyUserId: me?.id ?? null, displayName: me?.display_name || me?.id || null, product: me?.product ?? null })
      .where(eq(schema.spotifyAccounts.userId, userId))
  } catch { /* el perfil es opcional */ }
}

// Llama a la Web API con el token del usuario (refresca una vez si da 401).
export async function spotifyApi(userId: number, path: string, init: RequestInit = {}): Promise<any> {
  const token = await getValidAccessToken(userId)
  if (!token) throw createError({ statusCode: 401, message: 'Spotify no conectado' })
  const call = (tk: string) => fetch('https://api.spotify.com/v1' + path, {
    ...init,
    headers: { Authorization: `Bearer ${tk}`, 'Content-Type': 'application/json', ...(init.headers as Record<string, string> || {}) },
  })
  let res = await call(token)
  if (res.status === 401) {
    const a = await getSpotifyAccount(userId)
    if (a) { const t = await tokenRequest({ grant_type: 'refresh_token', refresh_token: a.refreshToken }); await saveTokens(userId, t, a.refreshToken); res = await call(t.access_token) }
  }
  if (res.status === 204) return null
  const j = await res.json().catch(() => ({}))
  if (!res.ok) throw createError({ statusCode: res.status, message: j?.error?.message || ('Spotify ' + res.status) })
  return j
}
