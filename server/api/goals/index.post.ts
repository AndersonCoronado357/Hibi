// Crea un objetivo.
import { z } from 'zod'

const Body = z.object({
  title: z.string().trim().min(1, 'Escribe un título').max(200),
  target: z.string().max(80).optional(),
  area: z.string().max(60).nullable().optional(),
  unit: z.string().max(40).optional(),
  total: z.number().int().min(1).optional(),
  current: z.number().int().min(0).optional(),
  color: z.string().max(60).optional(),
  ringColor: z.string().max(20).optional(),
})

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const b = await readValid(event, Body)
  const [row] = await useDb().insert(schema.goals).values({
    id: genId(), userId,
    title: b.title,
    target: b.target || '',
    area: b.area || null,
    unit: b.unit || '',
    total: b.total ?? 100,
    current: b.current ?? 0,
    color: b.color || 'bg-sky-soft text-sky-deep',
    ringColor: b.ringColor || '#5aa6d2',
  }).returning()
  return { ...row, milestones: [] }
})
