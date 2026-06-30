// Estado compartido de la nube de chat flotante (MascotFab). Persiste el
// descarte en localStorage y lo expone reactivo para que Ajustes pueda
// volver a mostrarla si el usuario la descartó por accidente.
export function useFab() {
  const dismissed = useState<boolean>('hibi.fab.dismissed', () => false)
  const ready = useState<boolean>('hibi.fab.ready', () => false)

  function init() {
    if (ready.value || !import.meta.client) return
    dismissed.value = localStorage.getItem('hibi.fab.dismissed') === '1'
    ready.value = true
  }
  function setDismissed(v: boolean) {
    dismissed.value = v
    if (import.meta.client) {
      if (v) localStorage.setItem('hibi.fab.dismissed', '1')
      else localStorage.removeItem('hibi.fab.dismissed')
    }
  }
  return { dismissed, init, setDismissed }
}
