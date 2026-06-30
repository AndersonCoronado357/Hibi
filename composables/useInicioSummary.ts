// Resumen del día para los widgets de Inicio.
import { useQuery } from '@tanstack/vue-query'

export interface InicioSummary {
  todayEvents: number
  todayTasks: number
  pendingTasks: number
  reminders: number
  habitsDone: number
  habitsTotal: number
  mood: number | null
  streak: number
}

export function useInicioSummary() {
  const rfetch = useRequestFetch()
  const query = useQuery({
    queryKey: ['inicio-summary'],
    queryFn: () => {
      const today = new Date().toISOString().slice(0, 10)
      return rfetch<InicioSummary>(`/api/inicio/summary?today=${today}`)
    },
  })
  return {
    summary: computed<InicioSummary | null>(() => query.data.value ?? null),
    isLoading: query.isLoading,
    refetch: () => query.refetch(),
  }
}
