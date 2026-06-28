// Eventos del calendario del usuario (persistidos). Envuelve el patrón CRUD genérico.
export interface CalendarEvent {
  id: string
  title: string
  eventDate: string
  startTime: string | null
  endTime: string | null
  color: string
  createdAt: string
  updatedAt: string
}

export function useEvents() {
  const r = useResource<CalendarEvent>('events', {
    optimistic: (i) => ({ color: '#5aa6d2', startTime: null, endTime: null, ...i }),
  })
  return {
    ...r,
    events: r.items,
    createEvent: (input: { title: string; eventDate: string; startTime?: string | null; endTime?: string | null; color?: string }) => r.create(input),
    updateEvent: (id: string, patch: Partial<Omit<CalendarEvent, 'id'>>) => r.update(id, patch),
    removeEvent: (id: string) => r.remove(id),
  }
}
