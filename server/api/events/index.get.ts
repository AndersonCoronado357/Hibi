// Lista los eventos del usuario (por fecha asc, luego hora de inicio asc).
import { eq, and, asc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  return useDb().select().from(schema.events)
    .where(eq(schema.events.userId, userId))
    .orderBy(asc(schema.events.eventDate), asc(schema.events.startTime))
})
