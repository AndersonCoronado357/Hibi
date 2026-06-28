// Crea un recordatorio para el usuario actual.
import { z } from 'zod'

const Body = z.object({
  title: z.string().trim().min(1, 'Escribe un título').max(200),
  remindDate: zDate(),
  time: zTime().optional(),
  alarm: z.boolean().optional(),
  pre: z.string().max(80).nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
})

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const body = await readValid(event, Body)
  if (!body.remindDate) throw createError({ statusCode: 400, message: 'Elige una fecha' })
  const [row] = await useDb().insert(schema.reminders).values({
    id: genId(),
    userId,
    title: body.title,
    remindDate: body.remindDate,
    time: body.time || null,
    alarm: body.alarm ?? false,
    pre: body.pre || null,
    notes: body.notes || null,
  }).returning()
  return row
})
