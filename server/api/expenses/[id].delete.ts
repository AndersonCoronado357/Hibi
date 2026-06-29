// Borra un gasto del usuario.
import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = getRouterParam(event, 'id') as string
  const [row] = await useDb().delete(schema.expenses)
    .where(and(eq(schema.expenses.id, id), eq(schema.expenses.userId, userId)))
    .returning({ id: schema.expenses.id })
  if (!row) throw createError({ statusCode: 404, message: 'No encontrado' })
  return { ok: true, id: row.id }
})
