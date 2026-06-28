// Actualiza un objetivo (incluye `current` al aportar progreso).
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'

const Body = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  target: z.string().max(80).optional(),
  area: z.string().max(60).nullable().optional(),
  unit: z.string().max(40).optional(),
  total: z.number().int().min(1).optional(),
  current: z.number().int().min(0).optional(),
  color: z.string().max(60).optional(),
  ringColor: z.string().max(20).optional(),
  position: z.number().int().optional(),
})

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = getRouterParam(event, 'id') as string
  const b = await readValid(event, Body)
  const patch: Record<string, unknown> = { updatedAt: new Date() }
  for (const k of ['title', 'target', 'unit', 'total', 'current', 'color', 'ringColor', 'position'] as const) {
    if (b[k] !== undefined) patch[k] = b[k]
  }
  if (b.area !== undefined) patch.area = b.area || null
  const [row] = await useDb().update(schema.goals).set(patch)
    .where(and(eq(schema.goals.id, id), eq(schema.goals.userId, userId)))
    .returning()
  if (!row) throw createError({ statusCode: 404, message: 'Objetivo no encontrado' })
  return row
})
