// Conversaciones del usuario con sus mensajes anidados (recientes primero).
import { eq, asc, desc, inArray } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const db = useDb()
  const convs = await db.select().from(schema.chatConversations)
    .where(eq(schema.chatConversations.userId, userId))
    .orderBy(desc(schema.chatConversations.updatedAt))
  if (!convs.length) return []
  const msgs = await db.select().from(schema.chatMessages)
    .where(inArray(schema.chatMessages.conversationId, convs.map((c) => c.id)))
    .orderBy(asc(schema.chatMessages.createdAt))
  const byConv = new Map<string, typeof msgs>()
  for (const m of msgs) { const a = byConv.get(m.conversationId) ?? []; a.push(m); byConv.set(m.conversationId, a) }
  return convs.map((c) => ({ ...c, messages: byConv.get(c.id) ?? [] }))
})
