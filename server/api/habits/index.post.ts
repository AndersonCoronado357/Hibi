// Crea un hábito.
import { z } from 'zod'

const Body = z.object({
  name: z.string().trim().min(1, 'Escribe un nombre').max(80),
  icon: z.string().max(40).optional(),
  ringColor: z.string().max(20).optional(),
})

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const b = await readValid(event, Body)
  const [row] = await useDb().insert(schema.habits).values({
    id: genId(), userId, name: b.name,
    icon: b.icon || 'Sparkles',
    ringColor: b.ringColor || '#5aa6d2',
  }).returning()
  return row
})
