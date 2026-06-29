// Borra una categoría del usuario. Los gastos/suscripciones asociados siguen
// funcionando (su category_id → null por la FK onDelete: 'set null').
import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = getRouterParam(event, 'id') as string
  const [row] = await useDb().delete(schema.financeCategories)
    .where(and(eq(schema.financeCategories.id, id), eq(schema.financeCategories.userId, userId)))
    .returning({ id: schema.financeCategories.id })
  if (!row) throw createError({ statusCode: 404, message: 'No encontrado' })
  return { ok: true, id: row.id }
})
