// Objetivos del usuario, con sus hitos anidados.
import { eq, asc, inArray } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const db = useDb()
  const gs = await db.select().from(schema.goals)
    .where(eq(schema.goals.userId, userId))
    .orderBy(asc(schema.goals.position), asc(schema.goals.createdAt))
  if (!gs.length) return []
  const ms = await db.select().from(schema.goalMilestones)
    .where(inArray(schema.goalMilestones.goalId, gs.map((g) => g.id)))
    .orderBy(asc(schema.goalMilestones.position))
  const byGoal = new Map<string, typeof ms>()
  for (const m of ms) {
    const arr = byGoal.get(m.goalId) ?? []
    arr.push(m); byGoal.set(m.goalId, arr)
  }
  return gs.map((g) => ({ ...g, milestones: byGoal.get(g.id) ?? [] }))
})
