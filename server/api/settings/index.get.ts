// Ajustes/preferencias del usuario.
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const db = useDb()
  let [s] = await db.select().from(schema.userSettings).where(eq(schema.userSettings.userId, userId)).limit(1)
  if (!s) {
    await db.insert(schema.userSettings).values({ userId }).onConflictDoNothing()
    ;[s] = await db.select().from(schema.userSettings).where(eq(schema.userSettings.userId, userId)).limit(1)
  }
  return s ?? null
})
