// Sube un documento a una carpeta de notas. SOLO se acepta lo que el usuario
// pidió (imagen, audio, video, pdf, texto/markdown) — cualquier otro tipo
// (ejecutables, Word/Excel/zip, binarios sin clasificar…) se rechaza aquí
// mismo, no solo se sirve forzado a descarga.
import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const folderId = getRouterParam(event, 'id') as string
  const [folder] = await useDb().select({ id: schema.noteFolders.id }).from(schema.noteFolders)
    .where(and(eq(schema.noteFolders.id, folderId), eq(schema.noteFolders.userId, userId))).limit(1)
  if (!folder) throw createError({ statusCode: 404, message: tServer(event, 'folderNotFound') })

  const parts = await readMultipartFormData(event)
  const file = parts?.find((p) => p.name === 'file' && p.filename)
  if (!file || !file.data?.length) throw createError({ statusCode: 400, message: tServer(event, 'invalidData') })
  if (file.data.length > MAX_UPLOAD_SIZE) throw createError({ statusCode: 413, message: tServer(event, 'fileTooLarge') })

  const mimetype = file.type || 'application/octet-stream'
  const kind = classifyKind(mimetype, file.filename)
  if (kind === 'other') throw createError({ statusCode: 400, message: tServer(event, 'fileTypeNotAllowed') })
  const storageKey = genId() + safeExt(file.filename || '')
  await saveUpload(storageKey, file.data)

  const [row] = await useDb().insert(schema.noteAttachments).values({
    id: genId(), userId, folderId,
    kind, filename: file.filename || 'file', mimetype, size: file.data.length, storageKey,
  }).returning()
  return row
})
