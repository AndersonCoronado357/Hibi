// Borra una sesión de enfoque del usuario.
import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = getRouterParam(event, 'id') as string
  const [row] = await useDb().delete(schema.focusSessions)
    .where(and(eq(schema.focusSessions.id, id), eq(schema.focusSessions.userId, userId)))
    .returning({ id: schema.focusSessions.id })
  if (!row) throw createError({ statusCode: 404, message: 'No encontrado' })
  return { ok: true, id: row.id }
})
