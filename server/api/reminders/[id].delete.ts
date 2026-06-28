// Borra un recordatorio del usuario.
import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = getRouterParam(event, 'id') as string
  const [row] = await useDb().delete(schema.reminders)
    .where(and(eq(schema.reminders.id, id), eq(schema.reminders.userId, userId)))
    .returning({ id: schema.reminders.id })
  if (!row) throw createError({ statusCode: 404, message: 'No encontrado' })
  return { ok: true, id: row.id }
})
