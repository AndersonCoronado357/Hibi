// Crea una tarea para el usuario actual.
import { z } from 'zod'

const Body = z.object({
  title: z.string().trim().min(1, 'Escribe un título').max(200),
  dueDate: zDate().optional(),
  repeatDays: z.string().max(7).nullable().optional(),
  priority: z.number().int().min(0).max(3).optional(),
  notes: z.string().max(5000).nullable().optional(),
})

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const body = await readValid(event, Body)
  const [row] = await useDb().insert(schema.tasks).values({
    id: genId(),
    userId,
    title: body.title,
    dueDate: body.dueDate || null,
    repeatDays: body.repeatDays || null,
    priority: body.priority ?? 0,
    notes: body.notes || null,
  }).returning()
  return row
})
