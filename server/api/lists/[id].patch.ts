// Actualiza una lista (nombre, tipo, tono, icono, orden).
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'

const Body = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  type: z.enum(['shopping', 'movies', 'books', 'places']).optional(),
  tone: z.string().max(60).optional(),
  icon: z.string().max(60).optional(),
  position: z.number().int().optional(),
})

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = getRouterParam(event, 'id') as string
  const b = await readValid(event, Body)
  const patch: Record<string, unknown> = {}
  for (const k of ['name', 'type', 'tone', 'icon', 'position'] as const) {
    if (b[k] !== undefined) patch[k] = b[k]
  }
  const [row] = await useDb().update(schema.lists).set(patch)
    .where(and(eq(schema.lists.id, id), eq(schema.lists.userId, userId)))
    .returning()
  if (!row) throw createError({ statusCode: 404, message: 'No encontrado' })
  return row
})
