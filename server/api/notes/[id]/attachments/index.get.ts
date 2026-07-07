// Lista los adjuntos de una nota del usuario.
import { and, eq, asc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const noteId = getRouterParam(event, 'id') as string
  const [note] = await useDb().select({ id: schema.notes.id }).from(schema.notes)
    .where(and(eq(schema.notes.id, noteId), eq(schema.notes.userId, userId))).limit(1)
  if (!note) throw createError({ statusCode: 404, message: tServer(event, 'noteNotFound') })

  return useDb().select().from(schema.noteAttachments)
    .where(and(eq(schema.noteAttachments.noteId, noteId), eq(schema.noteAttachments.userId, userId)))
    .orderBy(asc(schema.noteAttachments.createdAt))
})
