// Listas del usuario (por orden manual, luego por creación).
import { eq, asc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  return useDb().select().from(schema.lists)
    .where(eq(schema.lists.userId, userId))
    .orderBy(asc(schema.lists.position), asc(schema.lists.createdAt))
})
