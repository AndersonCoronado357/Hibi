// Actualiza una suscripción (servicio, monto, próximo cobro, categoría).
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'

const Body = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  amount: z.number().int().optional(),
  nextPayment: zDate().optional(),
  categoryId: z.string().nullable().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color invalido').nullable().optional(),
})

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = getRouterParam(event, 'id') as string
  const b = await readValid(event, Body)
  const patch: Record<string, unknown> = {}
  if (b.title !== undefined) patch.title = b.title
  if (b.amount !== undefined) patch.amount = b.amount
  if (b.nextPayment !== undefined) patch.nextPayment = b.nextPayment || null
  if (b.categoryId !== undefined) patch.categoryId = b.categoryId || null
  if (b.color !== undefined) patch.color = b.color || null
  const [row] = await useDb().update(schema.fixedExpenses).set(patch)
    .where(and(eq(schema.fixedExpenses.id, id), eq(schema.fixedExpenses.userId, userId)))
    .returning()
  if (!row) throw createError({ statusCode: 404, message: 'No encontrado' })
  return row
})
