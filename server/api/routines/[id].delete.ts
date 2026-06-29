// Borra una rutina (pasos y subpasos en cascada por la FK).
import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = getRouterParam(event, 'id') as string
  const [row] = await useDb().delete(schema.routines)
    .where(and(eq(schema.routines.id, id), eq(schema.routines.userId, userId)))
    .returning({ id: schema.routines.id })
  if (!row) throw createError({ statusCode: 404, message: 'Rutina no encontrada' })
  return { ok: true, id: row.id }
})
