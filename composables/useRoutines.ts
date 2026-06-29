// Rutinas del usuario. Cada rutina es un documento (pasos + subpasos). La
// página edita una copia reactiva local y aquí persistimos el documento
// completo con debounce (el servidor reemplaza sus pasos de golpe).
export interface Substep { title: string; done: boolean }
export interface Step { title: string; mins: number; done: boolean; substeps: Substep[] }
export interface Routine {
  id: string
  name: string
  time: 'morning' | 'midday' | 'night'
  days: string[]
  steps: Step[]
  minutes: number
}

function normalize(r: any): Routine {
  const steps: Step[] = (r.steps ?? []).map((s: any) => ({
    title: s.title, mins: s.mins ?? 0, done: !!s.done,
    substeps: (s.substeps ?? []).map((ss: any) => ({ title: ss.title, done: !!ss.done })),
  }))
  return {
    id: r.id, name: r.name, time: r.time, days: r.days ?? [], steps,
    minutes: steps.reduce((a, s) => a + s.mins, 0),
  }
}
function serialize(r: Routine) {
  return {
    name: r.name, time: r.time, days: r.days,
    steps: r.steps.map((s) => ({ title: s.title, mins: s.mins, done: s.done, substeps: s.substeps.map((ss) => ({ title: ss.title, done: ss.done })) })),
  }
}

export function useRoutines() {
  const rfetch = useRequestFetch()
  const routines = ref<Routine[]>([])
  const loading = ref(true)

  async function load() {
    try { routines.value = (await rfetch<any[]>('/api/routines')).map(normalize) } catch { /* offline */ }
    loading.value = false
  }

  async function createRoutine(input: { name: string; time: Routine['time']; days: string[]; steps: Omit<Step, 'mins'> & { mins: number }[] | Step[] }) {
    const r = normalize(await rfetch('/api/routines', { method: 'POST', body: serialize(input as Routine) }))
    routines.value.push(r)
    return r
  }

  const saveDebounced = useDebounceFn((id: string, body: any) => rfetch(`/api/routines/${id}`, { method: 'PATCH', body }).catch(() => {}), 700)
  function saveRoutineDoc(r: Routine) { saveDebounced(r.id, serialize(r)) }

  async function removeRoutine(id: string) {
    routines.value = routines.value.filter((r) => r.id !== id)
    await rfetch(`/api/routines/${id}`, { method: 'DELETE' }).catch(() => {})
  }

  return { routines, loading, load, createRoutine, saveRoutineDoc, removeRoutine }
}
