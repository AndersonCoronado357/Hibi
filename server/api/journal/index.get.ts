// Lista las entradas del diario del usuario (por fecha, más recientes primero).
import { eq, desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  return useDb().select().from(schema.journalEntries)
    .where(eq(schema.journalEntries.userId, userId))
    .orderBy(desc(schema.journalEntries.entryDate))
})
