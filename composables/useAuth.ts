// Estado de sesión del cliente + acciones contra /api/auth/*.
export interface AuthUser {
  id: number
  email: string
  name: string | null
  avatar?: string | null
  locale?: string
  theme?: string
  emailVerified?: boolean
}

export function useAuth() {
  const user = useState<AuthUser | null>('auth-user', () => null)
  const ready = useState<boolean>('auth-ready', () => false)

  // Reenvía las cookies en SSR; en cliente es un $fetch normal.
  async function fetchMe() {
    const req = useRequestFetch()
    try {
      const { user: u } = await req<{ user: AuthUser | null }>('/api/auth/me')
      user.value = u
    } catch {
      user.value = null
    }
    ready.value = true
    return user.value
  }

  async function login(identifier: string, password: string) {
    const { user: u } = await $fetch<{ user: AuthUser }>('/api/auth/login', { method: 'POST', body: { identifier, password } })
    user.value = u
    ready.value = true
    return u
  }

  async function register(data: { name?: string; email: string; password: string }) {
    const { user: u } = await $fetch<{ user: AuthUser }>('/api/auth/register', { method: 'POST', body: data })
    user.value = u
    ready.value = true
    return u
  }

  async function logout() {
    // Apaga el reproductor de Spotify (si estaba sonando) para que no siga
    // reproduciendo tras cerrar sesión. No desvincula la cuenta.
    try { await useSpotify().teardown() } catch { /* ignore */ }
    await $fetch('/api/auth/logout', { method: 'POST' })
    user.value = null
    await navigateTo('/login')
  }

  function forgot(email: string) {
    return $fetch<{ ok: true }>('/api/auth/forgot', { method: 'POST', body: { email } })
  }

  async function reset(token: string, password: string) {
    const r = await $fetch<{ ok: true }>('/api/auth/reset', { method: 'POST', body: { token, password } })
    await fetchMe()
    return r
  }

  function loginWithGoogle() {
    if (import.meta.client) window.location.href = '/auth/google'
  }

  return { user, ready, fetchMe, login, register, logout, forgot, reset, loginWithGoogle }
}
