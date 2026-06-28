// Sesiones de enfoque del usuario (más recientes primero).
import { eq, desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  return useDb().select().from(schema.focusSessions)
    .where(eq(schema.focusSessions.userId, userId))
    .orderBy(desc(schema.focusSessions.finishedAt))
})
