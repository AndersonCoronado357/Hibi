// Marcas de cumplimiento del usuario (todos los hábitos). El cliente deriva
// rachas, porcentajes y heatmap a partir de estas filas.
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  return useDb().select({
    id: schema.habitCompletions.id,
    habitId: schema.habitCompletions.habitId,
    day: schema.habitCompletions.day,
  }).from(schema.habitCompletions).where(eq(schema.habitCompletions.userId, userId))
})
