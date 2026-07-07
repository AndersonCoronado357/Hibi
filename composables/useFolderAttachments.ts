// Documentos adjuntos a una carpeta de notas (pdf, otros, o cualquier archivo
// subido directamente ahí). Viven en el panel de la carpeta, nunca dentro de
// una nota — por eso es un recurso separado de useNoteAttachments.
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import type { NoteAttachment } from './useNoteAttachments'

export function useFolderAttachments(folderId: Ref<string | null | undefined>) {
  const qc = useQueryClient()
  const rfetch = useRequestFetch()
  const key = computed(() => ['note-folders', folderId.value, 'attachments'])
  const base = computed(() => `/api/note-folders/${folderId.value}/attachments`)

  const query = useQuery({
    queryKey: key,
    queryFn: () => rfetch<NoteAttachment[]>(base.value),
    enabled: computed(() => !!folderId.value),
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
