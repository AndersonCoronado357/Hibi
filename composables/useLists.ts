// Listas del usuario: listas + sus ítems (persistidos). Dos recursos CRUD.
// Los ítems no tienen user_id: pertenecen a su lista (ownership por join).
export interface ListRecord {
  id: string
  name: string
  type: 'shopping' | 'movies' | 'books' | 'places'
  tone: string
  icon: string // nombre lucide
  position: number
  createdAt: string
}
export interface ListItem {
  id: string
  listId: string
  title: string
  done: boolean
  data: Record<string, any> // qty/year/rating/author/city según tipo
  position: number
}

export function useLists() {
  const listsR = useResource<ListRecord>('lists', {
    prepend: true,
    optimistic: (i) => ({ type: 'shopping', tone: 'bg-sky-soft', icon: 'ListChecks', position: 0, ...i }),
  })
  const itemsR = useResource<ListItem>('list-items', {
    prepend: false,
    optimistic: (i) => ({ done: false, data: {}, position: 0, ...i }),
  })

  return {
    lists: listsR.items,
    items: itemsR.items,
    listsLoading: listsR.isLoading,
    itemsLoading: itemsR.isLoading,
    createList: (input: { name: string; type?: ListRecord['type']; tone?: string; icon?: string }) => listsR.create(input),
    updateList: (id: string, patch: Partial<Pick<ListRecord, 'name' | 'type' | 'tone' | 'icon' | 'position'>>) => listsR.update(id, patch),
    removeList: (id: string) => listsR.remove(id),
    createItem: (input: { listId: string; title: string; done?: boolean; data?: Record<string, any>; position?: number }) => itemsR.create(input),
    updateItem: (id: string, patch: Partial<Pick<ListItem, 'title' | 'done' | 'data' | 'position'>>) => itemsR.update(id, patch),
    removeItem: (id: string) => itemsR.remove(id),
    toggleItem: (item: ListItem) => itemsR.update(item.id, { done: !item.done }),
  }
}
