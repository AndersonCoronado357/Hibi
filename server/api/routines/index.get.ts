// Rutinas del usuario con pasos y subpasos anidados.
import { eq, asc, inArray } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const db = useDb()
  const rs = await db.select().from(schema.routines)
    .where(eq(schema.routines.userId, userId))
    .orderBy(asc(schema.routines.position), asc(schema.routines.createdAt))
  if (!rs.length) return []
  const steps = await db.select().from(schema.routineSteps)
    .where(inArray(schema.routineSteps.routineId, rs.map((r) => r.id)))
    .orderBy(asc(schema.routineSteps.position))
  const sids = steps.map((s) => s.id)
  const subs = sids.length
    ? await db.select().from(schema.routineSubsteps).where(inArray(schema.routineSubsteps.stepId, sids)).orderBy(asc(schema.routineSubsteps.position))
    : []
  const subsByStep = new Map<string, typeof subs>()
  for (const ss of subs) { const a = subsByStep.get(ss.stepId) ?? []; a.push(ss); subsByStep.set(ss.stepId, a) }
  const stepsByRoutine = new Map<string, any[]>()
  for (const s of steps) {
    const a = stepsByRoutine.get(s.routineId) ?? []
    a.push({ ...s, substeps: subsByStep.get(s.id) ?? [] }); stepsByRoutine.set(s.routineId, a)
  }
  return rs.map((r) => ({ ...r, steps: stepsByRoutine.get(r.id) ?? [] }))
})
