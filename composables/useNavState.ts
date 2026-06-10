// Estado compartido de la navegación: sidebar colapsada (desktop) y
// sheet "Más" (móvil). Persistencia ligera en localStorage solo para el
// colapso, que es preferencia del usuario.
export function useSidebarCollapsed() {
  return useState<boolean>('hibi.sidebar.collapsed', () => {
    if (import.meta.client) {
      const v = localStorage.getItem('hibi.sidebar.collapsed')
      if (v === '1') return true
      if (v === '0') return false
    }
    return false
  })
}

export function toggleSidebar() {
  const c = useSidebarCollapsed()
  c.value = !c.value
  if (import.meta.client) {
    localStorage.setItem('hibi.sidebar.collapsed', c.value ? '1' : '0')
  }
}

export function useMoreSheetOpen() {
  return useState<boolean>('hibi.moresheet.open', () => false)
}
