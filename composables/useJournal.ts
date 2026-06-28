// Entradas del diario del usuario (persistidas). Envuelve el patrón CRUD genérico.
export interface JournalEntry {
  id: string
  entryDate: string
  mood: number
  energy: number
  body: string
  createdAt: string
  updatedAt: string
}

export function useJournal() {
  const r = useResource<JournalEntry>('journal', {
    optimistic: (i) => ({ mood: 3, energy: 3, body: '', ...i }),
  })
  return {
    ...r,
    entries: r.items,
    createEntry: (input: { entryDate: string; mood?: number; energy?: number; body?: string }) => r.create(input),
    updateEntry: (id: string, patch: Partial<Omit<JournalEntry, 'id'>>) => r.update(id, patch),
    removeEntry: (id: string) => r.remove(id),
  }
}
