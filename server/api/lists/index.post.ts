// Crea una lista.
import { z } from 'zod'

const Body = z.object({
  name: z.string().trim().min(1, 'Escribe un nombre').max(80),
  type: z.enum(['shopping', 'movies', 'books', 'places']).optional(),
  tone: z.string().max(60).optional(),
  icon: z.string().max(60).optional(),
})

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const b = await readValid(event, Body)
  const [row] = await useDb().insert(schema.lists).values({
    id: genId(), userId,
    name: b.name,
    type: b.type ?? 'shopping',
    tone: b.tone || 'bg-sky-soft',
    icon: b.icon || 'ListChecks',
  }).returning()
  return row
})
