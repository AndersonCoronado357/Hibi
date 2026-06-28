// Registra una sesión de enfoque terminada (finishedAt por defecto ahora).
import { z } from 'zod'

const Body = z.object({
  task: z.string().max(160).nullable().optional(),
  minutes: z.number().int().min(0),
})

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const b = await readValid(event, Body)
  const [row] = await useDb().insert(schema.focusSessions).values({
    id: genId(), userId,
    task: b.task ?? null,
    minutes: b.minutes,
  }).returning()
  return row
})
