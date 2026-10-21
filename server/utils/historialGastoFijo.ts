import { and, asc, eq } from 'drizzle-orm'

/** Lo que ha costado un gasto fijo, de lo más viejo a lo más nuevo. */
export async function historialDe(db: ReturnType<typeof useDb>, userId: number, fixedExpenseId: string) {
  const filas = await db.select().from(schema.fixedExpenseAmounts)
    .where(and(
      eq(schema.fixedExpenseAmounts.fixedExpenseId, fixedExpenseId),
      eq(schema.fixedExpenseAmounts.userId, userId),
    ))
    .orderBy(asc(schema.fixedExpenseAmounts.createdAt))
  return filas.map((h) => ({ amount: h.amount, fromMonth: h.fromMonth, changedAt: h.createdAt }))
}
