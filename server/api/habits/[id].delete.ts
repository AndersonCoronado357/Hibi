// Borra un hábito (sus marcas se borran en cascada por la FK).
import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = getRouterParam(event, 'id') as string
  const [row] = await useDb().delete(schema.habits)
    .where(and(eq(schema.habits.id, id), eq(schema.habits.userId, userId)))
    .returning({ id: schema.habits.id })
  if (!row) throw createError({ statusCode: 404, message: 'Hábito no encontrado' })
  return { ok: true, id: row.id }
})
