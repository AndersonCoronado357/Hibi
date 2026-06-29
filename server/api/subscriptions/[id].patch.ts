// Actualiza una suscripción (servicio, monto, próximo cobro, categoría).
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'

const Body = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  amount: z.number().int().optional(),
  nextCharge: zDate().optional(),
  categoryId: z.string().nullable().optional(),
})

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = getRouterParam(event, 'id') as string
  const b = await readValid(event, Body)
  const patch: Record<string, unknown> = {}
  if (b.title !== undefined) patch.title = b.title
  if (b.amount !== undefined) patch.amount = b.amount
  if (b.nextCharge !== undefined) patch.nextCharge = b.nextCharge || null
  if (b.categoryId !== undefined) patch.categoryId = b.categoryId || null
  const [row] = await useDb().update(schema.subscriptions).set(patch)
    .where(and(eq(schema.subscriptions.id, id), eq(schema.subscriptions.userId, userId)))
    .returning()
  if (!row) throw createError({ statusCode: 404, message: 'No encontrado' })
  return row
})
