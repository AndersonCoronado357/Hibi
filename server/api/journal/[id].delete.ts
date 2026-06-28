// Borra una entrada de diario del usuario.
import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = getRouterParam(event, 'id') as string
  const [row] = await useDb().delete(schema.journalEntries)
    .where(and(eq(schema.journalEntries.id, id), eq(schema.journalEntries.userId, userId)))
    .returning({ id: schema.journalEntries.id })
  if (!row) throw createError({ statusCode: 404, message: 'No encontrado' })
  return { ok: true, id: row.id }
})
