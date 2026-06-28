// Borra un preset de pomodoro del usuario.
import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = getRouterParam(event, 'id') as string
  const [row] = await useDb().delete(schema.focusPresets)
    .where(and(eq(schema.focusPresets.id, id), eq(schema.focusPresets.userId, userId)))
    .returning({ id: schema.focusPresets.id })
  if (!row) throw createError({ statusCode: 404, message: 'No encontrado' })
  return { ok: true, id: row.id }
})
