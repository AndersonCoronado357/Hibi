// Borra una carpeta. Sus notas quedan sin carpeta (folder_id → null por la FK);
// el cliente borra explícitamente las notas cuando corresponde. Los documentos
// adjuntos a la carpeta SÍ se borran en cascada en la BD, pero sus archivos en
// disco no — hay que limpiarlos a mano antes.
import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = getRouterParam(event, 'id') as string

  const attachments = await useDb().select({ storageKey: schema.noteAttachments.storageKey }).from(schema.noteAttachments)
    .where(and(eq(schema.noteAttachments.folderId, id), eq(schema.noteAttachments.userId, userId)))

  const [row] = await useDb().delete(schema.noteFolders)
    .where(and(eq(schema.noteFolders.id, id), eq(schema.noteFolders.userId, userId)))
    .returning({ id: schema.noteFolders.id })
  if (!row) throw createError({ statusCode: 404, message: tServer(event, 'folderNotFound') })

  await Promise.all(attachments.map((a) => deleteUpload(a.storageKey)))
  return { ok: true, id: row.id }
})
