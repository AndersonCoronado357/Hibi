// Sube una imagen o audio para insertar INLINE en el cuerpo de una nota
// (lo llama el editor enriquecido). Documentos (pdf/otro) no se aceptan aquí
// — esos van siempre a nivel de carpeta, nunca dentro de una nota.
import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const noteId = getRouterParam(event, 'id') as string
  const [note] = await useDb().select({ id: schema.notes.id }).from(schema.notes)
    .where(and(eq(schema.notes.id, noteId), eq(schema.notes.userId, userId))).limit(1)
  if (!note) throw createError({ statusCode: 404, message: tServer(event, 'noteNotFound') })

  const parts = await readMultipartFormData(event)
  const file = parts?.find((p) => p.name === 'file' && p.filename)
  if (!file || !file.data?.length) throw createError({ statusCode: 400, message: tServer(event, 'invalidData') })
  if (file.data.length > MAX_UPLOAD_SIZE) throw createError({ statusCode: 413, message: tServer(event, 'fileTooLarge') })

  const mimetype = file.type || 'application/octet-stream'
  const kind = classifyKind(mimetype, file.filename)
  if (kind !== 'image' && kind !== 'audio') throw createError({ statusCode: 400, message: tServer(event, 'onlyImageAudioInline') })
  const storageKey = genId() + safeExt(file.filename || '')
  await saveUpload(storageKey, file.data)

  const [row] = await useDb().insert(schema.noteAttachments).values({
    id: genId(), userId, noteId,
    kind, filename: file.filename || 'file', mimetype, size: file.data.length, storageKey,
  }).returning()
  return row
})
