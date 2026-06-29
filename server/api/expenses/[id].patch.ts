// Actualiza un gasto (concepto, monto, fecha, categoría).
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'

const Body = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  amount: z.number().int().optional(),
  spentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida').optional(),
  categoryId: z.string().nullable().optional(),
})

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = getRouterParam(event, 'id') as string
  const b = await readValid(event, Body)
  const patch: Record<string, unknown> = {}
  if (b.title !== undefined) patch.title = b.title
  if (b.amount !== undefined) patch.amount = b.amount
  if (b.spentDate !== undefined) patch.spentDate = b.spentDate
  if (b.categoryId !== undefined) patch.categoryId = b.categoryId || null
  const [row] = await useDb().update(schema.expenses).set(patch)
    .where(and(eq(schema.expenses.id, id), eq(schema.expenses.userId, userId)))
    .returning()
  if (!row) throw createError({ statusCode: 404, message: 'No encontrado' })
  return row
})
