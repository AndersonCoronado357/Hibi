// Categorías de finanzas del usuario (6 se siembran al registrarse).
import { eq, asc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  return useDb().select().from(schema.financeCategories)
    .where(eq(schema.financeCategories.userId, userId))
    .orderBy(asc(schema.financeCategories.position), asc(schema.financeCategories.name))
})
