// Borra una carpeta. Sus notas quedan sin carpeta (folder_id → null por la FK);
// el cliente borra explícitamente las notas cuando corresponde.
import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = getRouterParam(event, 'id') as string
  const [row] = await useDb().delete(schema.noteFolders)
    .where(and(eq(schema.noteFolders.id, id), eq(schema.noteFolders.userId, userId)))
    .returning({ id: schema.noteFolders.id })
  if (!row) throw createError({ statusCode: 404, message: 'Carpeta no encontrada' })
  return { ok: true, id: row.id }
})
