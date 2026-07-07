// Borra una nota del usuario. Los adjuntos se borran en cascada en la BD,
// pero sus archivos en disco no — hay que limpiarlos a mano antes.
import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = getRouterParam(event, 'id') as string

  const attachments = await useDb().select({ storageKey: schema.noteAttachments.storageKey }).from(schema.noteAttachments)
    .where(and(eq(schema.noteAttachments.noteId, id), eq(schema.noteAttachments.userId, userId)))

  const [row] = await useDb().delete(schema.notes)
    .where(and(eq(schema.notes.id, id), eq(schema.notes.userId, userId)))
    .returning({ id: schema.notes.id })
  if (!row) throw createError({ statusCode: 404, message: tServer(event, 'noteNotFound') })

  await Promise.all(attachments.map((a) => deleteUpload(a.storageKey)))
  return { ok: true, id: row.id }
})
