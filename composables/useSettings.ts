// Ajustes del usuario (perfil, avatar, idioma, tema, avisos). Guarda con
// debounce y refleja el nombre/avatar en la barra al instante.
export function useSettings() {
  const { user } = useAuth()
  const rfetch = useRequestFetch()

  async function load() {
    try { return await rfetch<any>('/api/settings') } catch { return null }
  }

  const push = async (patch: Record<string, any>) => {
    try {
      await $fetch('/api/settings', { method: 'PATCH', body: patch })
      if (user.value) {
        if (patch.displayName !== undefined) user.value.name = patch.displayName || user.value.email
        if (patch.avatar !== undefined) user.value.avatar = patch.avatar
        if (patch.locale !== undefined) user.value.locale = patch.locale
        if (patch.theme !== undefined) user.value.theme = patch.theme
      }
    } catch { /* offline */ }
  }

  const debounced = useDebounceFn(push, 500)
  return { load, save: (patch: Record<string, any>) => debounced(patch) }
}
