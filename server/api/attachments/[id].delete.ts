// Borra un adjunto del usuario (fila + archivo en disco).
import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = getRouterParam(event, 'id') as string
  const [row] = await useDb().delete(schema.noteAttachments)
    .where(and(eq(schema.noteAttachments.id, id), eq(schema.noteAttachments.userId, userId)))
    .returning()
  if (!row) throw createError({ statusCode: 404, message: tServer(event, 'notFound') })
  await deleteUpload(row.storageKey)
  return { ok: true, id: row.id }
})
