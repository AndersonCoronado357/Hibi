// Enfoque (pomodoro) del usuario: presets configurables + sesiones registradas.
// Envuelve el patrón CRUD genérico (dos recursos).
export interface FocusPreset {
  id: string
  label: string
  focus: number
  short: number
  long: number
  color: string
  ringColor: string
  position: number
}
export interface FocusSession {
  id: string
  task: string | null
  minutes: number
  finishedAt: string
}

// Clave de fecha local 'yyyy-MM-dd' (sin desfase de zona horaria).
function localDayKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function useFocus() {
  const presetsR = useResource<FocusPreset>('focus-presets', {
    prepend: false,
    optimistic: (i) => ({ focus: 25, short: 5, long: 15, color: 'bg-sky-soft', ringColor: '#5aa6d2', position: 0, ...i }),
  })
  const sessionsR = useResource<FocusSession>('focus-sessions', {
    optimistic: (i) => ({ task: null, minutes: 0, finishedAt: new Date().toISOString(), ...i }),
  })

  // Sesiones cuya fecha (local) es hoy — para la lista "Sesiones de hoy".
  const todaySessions = computed<FocusSession[]>(() => {
    const today = localDayKey(new Date())
    return sessionsR.items.value.filter((s) => s.finishedAt && localDayKey(new Date(s.finishedAt)) === today)
  })

  return {
    presets: presetsR.items,
    presetsLoading: presetsR.isLoading,
    createPreset: (input: { label: string; focus?: number; short?: number; long?: number; color?: string; ringColor?: string }) => presetsR.create(input),
    updatePreset: (id: string, patch: Partial<Pick<FocusPreset, 'label' | 'focus' | 'short' | 'long' | 'color' | 'ringColor' | 'position'>>) => presetsR.update(id, patch),
    removePreset: (id: string) => presetsR.remove(id),

    sessions: sessionsR.items,
    sessionsLoading: sessionsR.isLoading,
    todaySessions,
    logSession: (input: { task?: string | null; minutes: number }) => sessionsR.create(input),
    removeSession: (id: string) => sessionsR.remove(id),
  }
}
