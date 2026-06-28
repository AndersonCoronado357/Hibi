// Hábitos del usuario.
import { eq, asc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  return useDb().select().from(schema.habits)
    .where(eq(schema.habits.userId, userId))
    .orderBy(asc(schema.habits.position), asc(schema.habits.createdAt))
})
