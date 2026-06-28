// Crea un evento para el usuario actual.
import { z } from 'zod'

const Body = z.object({
  title: z.string().trim().min(1, 'Escribe un título').max(200),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
  startTime: zTime().optional(),
  endTime: zTime().optional(),
  color: z.string().max(20).optional(),
})

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const body = await readValid(event, Body)
  const [row] = await useDb().insert(schema.events).values({
    id: genId(),
    userId,
    title: body.title,
    eventDate: body.eventDate,
    startTime: body.startTime || null,
    endTime: body.endTime || null,
    color: body.color || '#5aa6d2',
  }).returning()
  return row
})
