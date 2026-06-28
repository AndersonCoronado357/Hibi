// Objetivos del usuario (con hitos anidados). El progreso se deriva de
// current/total; "aportar progreso" solo persiste `current`.
export interface GoalMilestone {
  id: string
  label: string
  at: number
  done: boolean
  position: number
}
export interface Goal {
  id: string
  title: string
  target: string
  area: string | null
  unit: string
  current: number
  total: number
  color: string
  ringColor: string
  position: number
  milestones: GoalMilestone[]
  createdAt: string
  updatedAt: string
}

export function useGoals() {
  const r = useResource<Goal>('goals', {
    optimistic: (i) => ({
      target: '', area: null, unit: '', current: 0, total: 100,
      color: 'bg-sky-soft text-sky-deep', ringColor: '#5aa6d2', milestones: [], position: 0, ...i,
    }),
  })

  // Actualiza `current` solo en la caché (durante el arrastre; sin red).
  function setLocalCurrent(id: string, current: number) {
    const cur = r.qc.getQueryData<Goal[]>(r.key) ?? []
    r.qc.setQueryData<Goal[]>(r.key, cur.map((g) => (g.id === id ? { ...g, current } : g)))
  }

  return {
    goals: r.items,
    isLoading: r.isLoading,
    createGoal: (input: Record<string, any>) => r.create(input),
    updateGoal: (id: string, patch: Record<string, any>) => r.update(id, patch),
    removeGoal: (id: string) => r.remove(id),
    setLocalCurrent,
    saveCurrent: (id: string, current: number) => r.update(id, { current }),
  }
}
