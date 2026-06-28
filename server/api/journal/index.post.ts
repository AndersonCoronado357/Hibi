// Crea una entrada de diario para el usuario actual.
import { z } from 'zod'

const Body = z.object({
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
  mood: z.number().int().min(1).max(5).optional(),
  energy: z.number().int().min(1).max(5).optional(),
  body: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const body = await readValid(event, Body)
  const [row] = await useDb().insert(schema.journalEntries).values({
    id: genId(),
    userId,
    entryDate: body.entryDate,
    mood: body.mood ?? 3,
    energy: body.energy ?? 3,
    body: body.body ?? '',
  }).returning()
  return row
})
