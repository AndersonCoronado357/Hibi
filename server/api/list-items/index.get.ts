// Ítems de las listas del usuario. No tienen user_id: la pertenencia es por
// la lista padre → filtramos por listId ∈ (listas del usuario).
import { eq, asc, inArray } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const db = useDb()
  const myLists = await db.select({ id: schema.lists.id }).from(schema.lists)
    .where(eq(schema.lists.userId, userId))
  if (!myLists.length) return []
  return db.select().from(schema.listItems)
    .where(inArray(schema.listItems.listId, myLists.map((l) => l.id)))
    .orderBy(asc(schema.listItems.position))
})
