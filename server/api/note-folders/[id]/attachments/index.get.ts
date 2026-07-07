// Lista los documentos adjuntos a una carpeta de notas (pdf/otros/lo que sea
// subido directamente ahí — nunca ligados a una nota individual).
import { and, eq, asc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const folderId = getRouterParam(event, 'id') as string
  const [folder] = await useDb().select({ id: schema.noteFolders.id }).from(schema.noteFolders)
    .where(and(eq(schema.noteFolders.id, folderId), eq(schema.noteFolders.userId, userId))).limit(1)
  if (!folder) throw createError({ statusCode: 404, message: tServer(event, 'folderNotFound') })

  return useDb().select().from(schema.noteAttachments)
    .where(and(eq(schema.noteAttachments.folderId, folderId), eq(schema.noteAttachments.userId, userId)))
    .orderBy(asc(schema.noteAttachments.createdAt))
})
