// Recordatorios del usuario (persistidos). Envuelve el patrón CRUD genérico.
export interface Reminder {
  id: string
  title: string
  remindDate: string
  time: string | null
  alarm: boolean
  pre: string | null
  notes: string | null
  done: boolean
  createdAt: string
  updatedAt: string
}

export function useReminders() {
  const r = useResource<Reminder>('reminders', {
    optimistic: (i) => ({ time: null, alarm: false, pre: null, notes: null, done: false, ...i }),
  })
  return {
    ...r,
    reminders: r.items,
    createReminder: (input: { title: string; remindDate: string; time?: string | null; alarm?: boolean; pre?: string | null; notes?: string | null }) => r.create(input),
    updateReminder: (id: string, patch: Partial<Omit<Reminder, 'id'>>) => r.update(id, patch),
    removeReminder: (id: string) => r.remove(id),
    toggleDone: (x: Reminder) => r.update(x.id, { done: !x.done }),
  }
}
