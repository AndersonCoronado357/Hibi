// Hábitos del usuario + marcas de cumplimiento (persistidos). Las rachas,
// porcentajes y heatmap se derivan en el cliente a partir de las marcas.
export interface HabitRow {
  id: string
  name: string
  icon: string
  ringColor: string
  position: number
  createdAt: string
}
export interface HabitCompletion {
  id: string
  habitId: string
  day: string // yyyy-MM-dd
}

export function useHabits() {
  const habitsR = useResource<HabitRow>('habits', {
    prepend: false,
    optimistic: (i) => ({ icon: 'Sparkles', ringColor: '#5aa6d2', position: 0, ...i }),
  })
  const complR = useResource<HabitCompletion>('habit-completions')
  const qc = complR.qc
  const key = complR.key
  const rfetch = useRequestFetch()

  // Marca/desmarca un día con update optimista sobre la caché de marcas.
  async function toggle(habitId: string, day: string) {
    await qc.cancelQueries({ queryKey: key })
    const prev = qc.getQueryData<HabitCompletion[]>(key) ?? []
    const existing = prev.find((c) => c.habitId === habitId && c.day === day)
    if (existing) qc.setQueryData<HabitCompletion[]>(key, prev.filter((c) => c !== existing))
    else qc.setQueryData<HabitCompletion[]>(key, [...prev, { id: `tmp_${Date.now()}`, habitId, day }])
    try {
      await rfetch('/api/habit-completions/toggle', { method: 'POST', body: { habitId, day } })
    } catch {
      qc.setQueryData<HabitCompletion[]>(key, prev)
    } finally {
      qc.invalidateQueries({ queryKey: key })
    }
  }

  return {
    habits: habitsR.items,
    completions: complR.items,
    isLoading: habitsR.isLoading,
    createHabit: (input: { name: string; icon?: string; ringColor?: string }) => habitsR.create(input),
    updateHabit: (id: string, patch: Partial<Pick<HabitRow, 'name' | 'icon' | 'ringColor' | 'position'>>) => habitsR.update(id, patch),
    removeHabit: (id: string) => habitsR.remove(id),
    toggle,
  }
}
