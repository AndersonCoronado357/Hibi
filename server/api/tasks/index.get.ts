// Lista las tareas del usuario (más recientes primero).
import { eq, desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  return useDb().select().from(schema.tasks)
    .where(eq(schema.tasks.userId, userId))
    .orderBy(desc(schema.tasks.createdAt))
})
