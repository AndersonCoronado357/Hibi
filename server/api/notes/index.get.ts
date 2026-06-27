// Notas del usuario (más recientes primero).
import { eq, desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  return useDb().select().from(schema.notes)
    .where(eq(schema.notes.userId, userId))
    .orderBy(desc(schema.notes.createdAt))
})
