// Ayudas para rutinas (documento anidado: pasos + subpasos). Guardamos el
// documento completo: al actualizar, reemplazamos los pasos/subpasos de golpe.
import { eq, asc, inArray } from 'drizzle-orm'
import { schema } from './db'
import { genId } from './crypto'

type SubIn = { title: string; done?: boolean }
type StepIn = { title: string; mins?: number; done?: boolean; substeps?: SubIn[] }

export async function replaceRoutineSteps(db: any, routineId: string, steps: StepIn[]) {
  await db.delete(schema.routineSteps).where(eq(schema.routineSteps.routineId, routineId))
  let p = 0
  for (const s of steps) {
    const stepId = genId()
    await db.insert(schema.routineSteps).values({
      id: stepId, routineId, title: s.title, mins: s.mins ?? 0, done: s.done ?? false, position: p++,
    })
    let sp = 0
    for (const ss of s.substeps ?? []) {
      await db.insert(schema.routineSubsteps).values({
        id: genId(), stepId, title: ss.title, done: ss.done ?? false, position: sp++,
      })
    }
  }
}

export async function fetchRoutineNested(db: any, routineId: string) {
  const [r] = await db.select().from(schema.routines).where(eq(schema.routines.id, routineId)).limit(1)
  if (!r) return null
  const steps = await db.select().from(schema.routineSteps)
    .where(eq(schema.routineSteps.routineId, routineId)).orderBy(asc(schema.routineSteps.position))
  const sids = steps.map((s: any) => s.id)
  const subs = sids.length
    ? await db.select().from(schema.routineSubsteps).where(inArray(schema.routineSubsteps.stepId, sids)).orderBy(asc(schema.routineSubsteps.position))
    : []
  const byStep = new Map<string, any[]>()
  for (const ss of subs) { const a = byStep.get(ss.stepId) ?? []; a.push(ss); byStep.set(ss.stepId, a) }
  return { ...r, steps: steps.map((s: any) => ({ ...s, substeps: byStep.get(s.id) ?? [] })) }
}
