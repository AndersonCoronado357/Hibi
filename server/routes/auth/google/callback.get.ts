// Callback de Google: valida el state, intercambia el código, deduplica por correo
// (Google + contraseña = misma cuenta), abre sesión y vuelve a la app.
export default defineEventHandler(async (event) => {
  const cfg = useRuntimeConfig()
  const clientId = process.env.GOOGLE_CLIENT_ID || cfg.googleClientId
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || cfg.googleClientSecret
  const origin = process.env.ORIGIN || cfg.origin || 'http://localhost:3100'
  const q = getQuery(event)

  const savedState = getCookie(event, 'g_state')
  deleteCookie(event, 'g_state', { path: '/' })
  if (q.error) return sendRedirect(event, '/login?error=google')
  if (!q.code || !q.state || !savedState || q.state !== savedState) return sendRedirect(event, '/login?error=google-state')
  if (!clientId || !clientSecret) return sendRedirect(event, '/login?error=google-off')

  try {
    const tokens = await googleExchangeCode({ code: String(q.code), clientId, clientSecret, redirectUri: `${origin}/auth/google/callback` })
    const profile = await googleFetchProfile(tokens.access_token)
    if (!profile.email) return sendRedirect(event, '/login?error=google-email')

    const existing = await findUserByEmail(profile.email)
    let user
    if (existing) {
      if (!existing.googleId) await linkGoogle(existing.id, profile.googleId, profile.name)
      user = existing
    } else {
      user = await createUser({ email: profile.email, name: profile.name, googleId: profile.googleId, emailVerified: profile.emailVerified })
    }

    setSession(event, user.id)
    await recordLogin(user.id, 'google')
    return sendRedirect(event, '/inicio')
  } catch (err) {
    console.error('[google callback]', err)
    return sendRedirect(event, '/login?error=google')
  }
})
