// Suscripciones del usuario (próximo cobro más cercano primero; sin fecha al final).
import { eq, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  return useDb().select().from(schema.fixedExpenses)
    .where(eq(schema.fixedExpenses.userId, userId))
    .orderBy(sql`${schema.fixedExpenses.nextPayment} asc nulls last`, sql`${schema.fixedExpenses.createdAt} asc`)
})
