// Inicia el login de Spotify: guarda un state anti-CSRF y redirige a Spotify.
export default defineEventHandler(async (event) => {
  await requireUserId(event)
  const state = randomToken(16)
  setCookie(event, 'sp_state', state, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 600 })
  await sendRedirect(event, spotifyAuthorizeUrl(state))
})
