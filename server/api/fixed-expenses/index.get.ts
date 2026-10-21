// Gastos fijos del usuario, con el historial de lo que ha costado cada uno.
// El historial viaja con la lista porque el total de un mes pasado se calcula
// con el valor que regía ESE mes, no con el de hoy.
import { eq, asc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const db = useDb()
  const filas = await db.select().from(schema.fixedExpenses)
    .where(eq(schema.fixedExpenses.userId, userId))
    .orderBy(asc(schema.fixedExpenses.createdAt))
  const historial = await db.select().from(schema.fixedExpenseAmounts)
    .where(eq(schema.fixedExpenseAmounts.userId, userId))
    .orderBy(asc(schema.fixedExpenseAmounts.createdAt))
  return filas.map((f) => ({
    ...f,
    history: historial
      .filter((h) => h.fixedExpenseId === f.id)
      .map((h) => ({ amount: h.amount, fromMonth: h.fromMonth, changedAt: h.createdAt })),
  }))
})
