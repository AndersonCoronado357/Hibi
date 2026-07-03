// Desconecta Spotify: borra la cuenta guardada del usuario.
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const db = useDb()
  await db.delete(schema.spotifyAccounts).where(eq(schema.spotifyAccounts.userId, userId))
  return { ok: true }
})
