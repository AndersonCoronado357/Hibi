// Adjuntos de una nota (imágenes, audio, pdf, otros). A diferencia de
// useResource, este recurso es anidado (depende de un noteId reactivo) y la
// subida usa multipart/form-data en vez de JSON — por eso está escrito a mano.
import { useQuery, useQueryClient } from '@tanstack/vue-query'

export interface NoteAttachment {
  id: string
  noteId: string
  kind: 'image' | 'audio' | 'pdf' | 'other'
  filename: string
  mimetype: string
  size: number
  createdAt: string
}

export function useNoteAttachments(noteId: Ref<string | null | undefined>) {
  const qc = useQueryClient()
  const rfetch = useRequestFetch()
  const key = computed(() => ['notes', noteId.value, 'attachments'])
  const base = computed(() => `/api/notes/${noteId.value}/attachments`)

  const query = useQuery({
    queryKey: key,
    queryFn: () => rfetch<NoteAttachment[]>(base.value),
    enabled: computed(() => !!noteId.value),
  })
  const attachments = computed<NoteAttachment[]>(() => query.data.value ?? [])

  function attachmentUrl(id: string) { return `/api/attachments/${id}` }

  async function upload(file: File): Promise<NoteAttachment> {
    const form = new FormData()
    form.append('file', file)
    const row = await rfetch<NoteAttachment>(base.value, { method: 'POST', body: form })
    qc.setQueryData<NoteAttachment[]>(key.value, (prev) => [...(prev ?? []), row])
    return row
  }

  async function remove(id: string) {
    await rfetch(`/api/attachments/${id}`, { method: 'DELETE' })
    qc.setQueryData<NoteAttachment[]>(key.value, (prev) => (prev ?? []).filter((a) => a.id !== id))
  }

  return { attachments, isLoading: query.isLoading, upload, remove, attachmentUrl }
}
