// Crea un preset de pomodoro.
import { z } from 'zod'

const Body = z.object({
  label: z.string().trim().min(1, 'Escribe un nombre').max(60),
  focus: z.number().int().min(1).max(180).optional(),
  short: z.number().int().min(1).max(60).optional(),
  long: z.number().int().min(1).max(120).optional(),
  color: z.string().max(60).optional(),
  ringColor: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Color inválido').optional(),
})

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const b = await readValid(event, Body)
  const [row] = await useDb().insert(schema.focusPresets).values({
    id: genId(), userId,
    label: b.label,
    focus: b.focus ?? 25,
    short: b.short ?? 5,
    long: b.long ?? 15,
    color: b.color || 'bg-sky-soft',
    ringColor: b.ringColor || '#5aa6d2',
  }).returning()
  return row
})
