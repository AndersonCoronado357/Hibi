// Marca/desmarca un hábito en un día. Inserta si falta, borra si existe.
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'

const Body = z.object({
  habitId: z.string().min(1),
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Día inválido'),
})

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const b = await readValid(event, Body)
  const db = useDb()

  // El hábito debe ser del usuario.
  const [h] = await db.select({ id: schema.habits.id }).from(schema.habits)
    .where(and(eq(schema.habits.id, b.habitId), eq(schema.habits.userId, userId))).limit(1)
  if (!h) throw createError({ statusCode: 404, message: 'Hábito no encontrado' })

  const [existing] = await db.select({ id: schema.habitCompletions.id }).from(schema.habitCompletions)
    .where(and(eq(schema.habitCompletions.habitId, b.habitId), eq(schema.habitCompletions.day, b.day))).limit(1)

  if (existing) {
    await db.delete(schema.habitCompletions).where(eq(schema.habitCompletions.id, existing.id))
    return { habitId: b.habitId, day: b.day, done: false }
  }
  await db.insert(schema.habitCompletions).values({ id: genId(), userId, habitId: b.habitId, day: b.day })
  return { habitId: b.habitId, day: b.day, done: true }
})
