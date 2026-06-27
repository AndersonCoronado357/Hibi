// Borra una nota del usuario.
import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = getRouterParam(event, 'id') as string
  const [row] = await useDb().delete(schema.notes)
    .where(and(eq(schema.notes.id, id), eq(schema.notes.userId, userId)))
    .returning({ id: schema.notes.id })
  if (!row) throw createError({ statusCode: 404, message: 'Nota no encontrada' })
  return { ok: true, id: row.id }
})
