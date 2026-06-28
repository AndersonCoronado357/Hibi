// Carpetas de notas del usuario.
import { eq, asc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  return useDb().select().from(schema.noteFolders)
    .where(eq(schema.noteFolders.userId, userId))
    .orderBy(asc(schema.noteFolders.position), asc(schema.noteFolders.createdAt))
})
