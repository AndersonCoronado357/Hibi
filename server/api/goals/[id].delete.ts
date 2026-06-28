// Borra un objetivo (sus hitos se borran en cascada por la FK).
import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = getRouterParam(event, 'id') as string
  const [row] = await useDb().delete(schema.goals)
    .where(and(eq(schema.goals.id, id), eq(schema.goals.userId, userId)))
    .returning({ id: schema.goals.id })
  if (!row) throw createError({ statusCode: 404, message: 'Objetivo no encontrado' })
  return { ok: true, id: row.id }
})
