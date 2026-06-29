// Borra una conversación del usuario (sus mensajes en cascada por la FK).
import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = getRouterParam(event, 'id') as string
  const [row] = await useDb().delete(schema.chatConversations)
    .where(and(eq(schema.chatConversations.id, id), eq(schema.chatConversations.userId, userId)))
    .returning({ id: schema.chatConversations.id })
  if (!row) throw createError({ statusCode: 404, message: 'Conversación no encontrada' })
  return { ok: true, id: row.id }
})
