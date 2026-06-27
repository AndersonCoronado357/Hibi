// Borra una tarea del usuario.
import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = getRouterParam(event, 'id') as string
  const [row] = await useDb().delete(schema.tasks)
    .where(and(eq(schema.tasks.id, id), eq(schema.tasks.userId, userId)))
    .returning({ id: schema.tasks.id })
  if (!row) throw createError({ statusCode: 404, message: 'Tarea no encontrada' })
  return { ok: true, id: row.id }
})
