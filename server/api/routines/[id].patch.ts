// Guarda una rutina completa (campos + pasos/subpasos reemplazados).
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'

const Sub = z.object({ title: z.string().trim().min(1).max(200), done: z.boolean().optional() })
const Step = z.object({
  title: z.string().trim().min(1).max(200),
  mins: z.number().int().min(0).max(600).optional(),
  done: z.boolean().optional(),
  substeps: z.array(Sub).optional(),
})
const Body = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  time: z.enum(['morning', 'midday', 'night']).optional(),
  days: z.array(z.string().max(3)).optional(),
  steps: z.array(Step).optional(),
})

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = getRouterParam(event, 'id') as string
  const b = await readValid(event, Body)
  const db = useDb()
  const [owned] = await db.select({ id: schema.routines.id }).from(schema.routines)
    .where(and(eq(schema.routines.id, id), eq(schema.routines.userId, userId))).limit(1)
  if (!owned) throw createError({ statusCode: 404, message: 'Rutina no encontrada' })

  const patch: Record<string, unknown> = {}
  if (b.name !== undefined) patch.name = b.name
  if (b.time !== undefined) patch.time = b.time
  if (b.days !== undefined) patch.days = b.days
  if (Object.keys(patch).length) await db.update(schema.routines).set(patch).where(eq(schema.routines.id, id))
  if (b.steps !== undefined) await replaceRoutineSteps(db, id, b.steps)
  return await fetchRoutineNested(db, id)
})
