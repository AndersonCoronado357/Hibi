// Lista los recordatorios del usuario (por fecha y hora ascendente).
import { eq, asc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  return useDb().select().from(schema.reminders)
    .where(eq(schema.reminders.userId, userId))
    .orderBy(asc(schema.reminders.remindDate), asc(schema.reminders.time))
})
