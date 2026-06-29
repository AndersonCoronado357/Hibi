// Estado de la mascota del usuario (una fila). Se crea por defecto si faltara.
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const db = useDb()
  let [row] = await db.select().from(schema.petState).where(eq(schema.petState.userId, userId)).limit(1)
  if (!row) {
    await db.insert(schema.petState).values({ userId }).onConflictDoNothing()
    ;[row] = await db.select().from(schema.petState).where(eq(schema.petState.userId, userId)).limit(1)
  }
  return row
})
