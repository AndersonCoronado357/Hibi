// Las vistas de regalo (día de amor y amistad, cumpleaños) son personales: solo
// deben salirle a ella, no a cualquiera que entre a Hibi.
//
// Se compara por ID de usuario y no por correo a propósito: el componente se
// compila en el JS público del sitio, así que un correo ahí dentro quedaría a la
// vista de cualquiera que abra las herramientas del navegador. El ID no dice
// nada de nadie.
const ID_DESTINATARIA = 2

export function useSaludoPersonal() {
  const { user, ready, fetchMe } = useAuth()

  /** Espera a que la sesión esté resuelta antes de decidir. */
  async function esDestinataria(): Promise<boolean> {
    if (!ready.value) await fetchMe()
    return user.value?.id === ID_DESTINATARIA
  }

  return { esDestinataria, ID_DESTINATARIA }
}
