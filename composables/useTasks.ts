// Tareas del usuario (persistidas). Envuelve el patrón CRUD genérico.
export interface Task {
  id: string
  title: string
  dueDate: string | null
  priority: 0 | 1 | 2 | 3
  status: 'pending' | 'done'
  notes: string | null
  position: number
  createdAt: string
  updatedAt: string
}

export function useTasks() {
  const r = useResource<Task>('tasks', {
    optimistic: (i) => ({ status: 'pending', priority: 0, position: 0, dueDate: null, notes: null, ...i }),
  })
  return {
    ...r,
    tasks: r.items,
    createTask: (input: { title: string; dueDate?: string | null; priority?: number; notes?: string | null }) => r.create(input),
    updateTask: (id: string, patch: Partial<Omit<Task, 'id'>>) => r.update(id, patch),
    removeTask: (id: string) => r.remove(id),
    toggleDone: (t: Task) => r.update(t.id, { status: t.status === 'done' ? 'pending' : 'done' }),
  }
}
