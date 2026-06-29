// Borra una suscripción del usuario.
import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = getRouterParam(event, 'id') as string
  const [row] = await useDb().delete(schema.subscriptions)
    .where(and(eq(schema.subscriptions.id, id), eq(schema.subscriptions.userId, userId)))
    .returning({ id: schema.subscriptions.id })
  if (!row) throw createError({ statusCode: 404, message: 'No encontrado' })
  return { ok: true, id: row.id }
})
