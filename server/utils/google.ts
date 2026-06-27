// "Entrar con Google" (OAuth 2.0) — portado de acmsy shared/auth/google.js.
// Cliente único "acmsy web"; claves desde el entorno. Callback: <ORIGIN>/auth/google/callback.
export function googleAuthUrl(opts: { clientId: string; redirectUri: string; state: string }): string {
  const p = new URLSearchParams({
    client_id: opts.clientId,
    redirect_uri: opts.redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'online',
    prompt: 'select_account',
    state: opts.state,
  })
  return 'https://accounts.google.com/o/oauth2/v2/auth?' + p.toString()
}

export async function googleExchangeCode(opts: { code: string; clientId: string; clientSecret: string; redirectUri: string }) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code: opts.code,
      client_id: opts.clientId,
      client_secret: opts.clientSecret,
      redirect_uri: opts.redirectUri,
      grant_type: 'authorization_code',
    }),
  })
  const data = await res.json().catch(() => ({})) as Record<string, unknown>
  if (!res.ok) throw new Error('Google rechazó el intercambio de código: ' + (data.error_description || res.status))
  return data as { access_token: string; id_token?: string }
}

export async function googleFetchProfile(accessToken: string) {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: 'Bearer ' + accessToken },
  })
  const data = await res.json().catch(() => ({})) as Record<string, unknown>
  if (!res.ok) throw new Error('No se pudo leer el perfil de Google: ' + res.status)
  return {
    googleId: String(data.sub),
    email: String(data.email || ''),
    emailVerified: !!data.email_verified,
    name: (data.name as string) || null,
  }
}
