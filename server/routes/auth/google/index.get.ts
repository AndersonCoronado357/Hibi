// Inicia "Entrar con Google": guarda un state anti-CSRF en cookie y redirige.
export default defineEventHandler((event) => {
  const cfg = useRuntimeConfig()
  const clientId = process.env.GOOGLE_CLIENT_ID || cfg.googleClientId
  const origin = process.env.ORIGIN || cfg.origin || 'http://localhost:3100'
  if (!clientId) return sendRedirect(event, '/login?error=google-off')

  const state = randomToken(16)
  setCookie(event, 'g_state', state, { httpOnly: true, secure: origin.startsWith('https'), sameSite: 'lax', path: '/', maxAge: 600 })

  const url = googleAuthUrl({ clientId, redirectUri: `${origin}/auth/google/callback`, state })
  return sendRedirect(event, url)
})
