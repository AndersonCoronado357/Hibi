// Actualiza un evento del usuario (título, fecha, horas, color).
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'

const Body = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida').optional(),
  startTime: zTime().optional(),
  endTime: zTime().optional(),
  color: z.string().max(20).optional(),
})

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = getRouterParam(event, 'id') as string
  const body = await readValid(event, Body)

  const patch: Record<string, unknown> = { updatedAt: new Date() }
  if (body.title !== undefined) patch.title = body.title
  if (body.eventDate !== undefined) patch.eventDate = body.eventDate
  if (body.startTime !== undefined) patch.startTime = body.startTime || null
  if (body.endTime !== undefined) patch.endTime = body.endTime || null
  if (body.color !== undefined) patch.color = body.color

  const [row] = await useDb().update(schema.events).set(patch)
    .where(and(eq(schema.events.id, id), eq(schema.events.userId, userId)))
    .returning()
  if (!row) throw createError({ statusCode: 404, message: 'No encontrado' })
  return row
})
