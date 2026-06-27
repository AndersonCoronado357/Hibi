// Actualiza una tarea del usuario (título, fecha, prioridad, estado, notas, orden).
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'

const Body = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  dueDate: zDate().optional(),
  priority: z.number().int().min(0).max(3).optional(),
  status: z.enum(['pending', 'done']).optional(),
  notes: z.string().max(5000).nullable().optional(),
  position: z.number().int().optional(),
})

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = getRouterParam(event, 'id') as string
  const body = await readValid(event, Body)

  const patch: Record<string, unknown> = { updatedAt: new Date() }
  if (body.title !== undefined) patch.title = body.title
  if (body.dueDate !== undefined) patch.dueDate = body.dueDate || null
  if (body.priority !== undefined) patch.priority = body.priority
  if (body.status !== undefined) patch.status = body.status
  if (body.notes !== undefined) patch.notes = body.notes || null
  if (body.position !== undefined) patch.position = body.position

  const [row] = await useDb().update(schema.tasks).set(patch)
    .where(and(eq(schema.tasks.id, id), eq(schema.tasks.userId, userId)))
    .returning()
  if (!row) throw createError({ statusCode: 404, message: 'Tarea no encontrada' })
  return row
})
