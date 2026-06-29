// Gastos del usuario (más recientes por fecha de gasto primero).
import { eq, desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  return useDb().select().from(schema.expenses)
    .where(eq(schema.expenses.userId, userId))
    .orderBy(desc(schema.expenses.spentDate), desc(schema.expenses.createdAt))
})
