// Borra una lista del usuario (sus ítems se borran en cascada por la FK).
import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = getRouterParam(event, 'id') as string
  const [row] = await useDb().delete(schema.lists)
    .where(and(eq(schema.lists.id, id), eq(schema.lists.userId, userId)))
    .returning({ id: schema.lists.id })
  if (!row) throw createError({ statusCode: 404, message: 'No encontrado' })
  return { ok: true, id: row.id }
})
