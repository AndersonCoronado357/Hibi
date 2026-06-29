// Suscripciones del usuario (próximo cobro más cercano primero; sin fecha al final).
import { eq, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  return useDb().select().from(schema.subscriptions)
    .where(eq(schema.subscriptions.userId, userId))
    .orderBy(sql`${schema.subscriptions.nextCharge} asc nulls last`, sql`${schema.subscriptions.createdAt} asc`)
})
