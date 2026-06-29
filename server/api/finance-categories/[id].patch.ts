// Actualiza una categoría (nombre, icono, color, posición).
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'

const Body = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  icon: z.string().max(40).optional(),
  color: z.string().max(20).optional(),
  position: z.number().int().optional(),
})

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = getRouterParam(event, 'id') as string
  const b = await readValid(event, Body)
  const patch: Record<string, unknown> = {}
  if (b.name !== undefined) patch.name = b.name
  if (b.icon !== undefined) patch.icon = b.icon
  if (b.color !== undefined) patch.color = b.color
  if (b.position !== undefined) patch.position = b.position
  const [row] = await useDb().update(schema.financeCategories).set(patch)
    .where(and(eq(schema.financeCategories.id, id), eq(schema.financeCategories.userId, userId)))
    .returning()
  if (!row) throw createError({ statusCode: 404, message: 'No encontrado' })
  return row
})
