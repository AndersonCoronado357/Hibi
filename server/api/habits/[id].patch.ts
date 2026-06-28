// Actualiza un hábito (nombre, icono, color, orden).
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'

const Body = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  icon: z.string().max(40).optional(),
  ringColor: z.string().max(20).optional(),
  position: z.number().int().optional(),
})

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = getRouterParam(event, 'id') as string
  const b = await readValid(event, Body)
  const patch: Record<string, unknown> = {}
  if (b.name !== undefined) patch.name = b.name
  if (b.icon !== undefined) patch.icon = b.icon
  if (b.ringColor !== undefined) patch.ringColor = b.ringColor
  if (b.position !== undefined) patch.position = b.position
  const [row] = await useDb().update(schema.habits).set(patch)
    .where(and(eq(schema.habits.id, id), eq(schema.habits.userId, userId)))
    .returning()
  if (!row) throw createError({ statusCode: 404, message: 'Hábito no encontrado' })
  return row
})
