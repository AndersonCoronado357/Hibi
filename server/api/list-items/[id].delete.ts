// Borra un ítem. Solo si su listId pertenece a una lista del usuario.
import { and, eq, inArray } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = getRouterParam(event, 'id') as string
  const db = useDb()

  const myLists = db.select({ id: schema.lists.id }).from(schema.lists)
    .where(eq(schema.lists.userId, userId))
  const [row] = await db.delete(schema.listItems)
    .where(and(eq(schema.listItems.id, id), inArray(schema.listItems.listId, myLists)))
    .returning({ id: schema.listItems.id })
  if (!row) throw createError({ statusCode: 404, message: 'No encontrado' })
  return { ok: true, id: row.id }
})
