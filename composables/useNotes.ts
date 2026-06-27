// Notas del usuario: carpetas + notas (persistidas). Dos recursos CRUD.
export interface NoteFolder {
  id: string
  name: string
  color: string
  position: number
  createdAt: string
}
export interface Note {
  id: string
  folderId: string | null
  title: string
  content: string
  pinned: boolean
  createdAt: string
  updatedAt: string
}

export function useNotes() {
  const foldersR = useResource<NoteFolder>('note-folders', {
    prepend: false,
    optimistic: (i) => ({ color: '#5aa6d2', position: 0, ...i }),
  })
  const notesR = useResource<Note>('notes', {
    optimistic: (i) => ({ folderId: null, title: '', content: '', pinned: false, ...i }),
  })

  return {
    folders: foldersR.items,
    notes: notesR.items,
    foldersLoading: foldersR.isLoading,
    notesLoading: notesR.isLoading,
    createFolder: (input: { name: string; color?: string }) => foldersR.create(input),
    updateFolder: (id: string, patch: Partial<Pick<NoteFolder, 'name' | 'color' | 'position'>>) => foldersR.update(id, patch),
    removeFolder: (id: string) => foldersR.remove(id),
    createNote: (input: { folderId?: string | null; title?: string; content?: string }) => notesR.create(input),
    updateNote: (id: string, patch: Partial<Pick<Note, 'folderId' | 'title' | 'content' | 'pinned'>>) => notesR.update(id, patch),
    removeNote: (id: string) => notesR.remove(id),
  }
}
