// Guarda global: sin sesión → /login. Con sesión en /login → /inicio.
const PUBLIC = new Set(['/login', '/reset'])

export default defineNuxtRouteMiddleware(async (to) => {
  const { user, ready, fetchMe } = useAuth()
  if (!ready.value) await fetchMe()

  const isPublic = PUBLIC.has(to.path)
  if (!user.value && !isPublic) return navigateTo('/login')
  if (user.value && to.path === '/login') return navigateTo('/inicio')
})
