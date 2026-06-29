// Crea una rutina con sus pasos y subpasos.
import { z } from 'zod'

const Sub = z.object({ title: z.string().trim().min(1).max(200), done: z.boolean().optional() })
const Step = z.object({
  title: z.string().trim().min(1).max(200),
  mins: z.number().int().min(0).max(600).optional(),
  done: z.boolean().optional(),
  substeps: z.array(Sub).optional(),
})
const Body = z.object({
  name: z.string().trim().min(1, 'Escribe un nombre').max(120),
  time: z.enum(['morning', 'midday', 'night']).optional(),
  days: z.array(z.string().max(3)).optional(),
  steps: z.array(Step).optional(),
})

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const b = await readValid(event, Body)
  const db = useDb()
  const routineId = genId()
  await db.insert(schema.routines).values({
    id: routineId, userId, name: b.name, time: b.time || 'morning', days: b.days || [],
  })
  await replaceRoutineSteps(db, routineId, b.steps || [])
  return await fetchRoutineNested(db, routineId)
})
