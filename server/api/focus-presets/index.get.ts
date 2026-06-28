// Presets de pomodoro del usuario (orden por posición).
import { eq, asc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  return useDb().select().from(schema.focusPresets)
    .where(eq(schema.focusPresets.userId, userId))
    .orderBy(asc(schema.focusPresets.position))
})
