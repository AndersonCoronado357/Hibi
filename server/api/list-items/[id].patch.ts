// Actualiza un ítem. La pertenencia se verifica por la lista padre: solo se
// actualiza si su listId pertenece a una lista del usuario.
import { z } from 'zod'
import { and, eq, inArray } from 'drizzle-orm'

const Body = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  done: z.boolean().optional(),
  data: z.record(z.any()).optional(),
  position: z.number().int().optional(),
})

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = getRouterParam(event, 'id') as string
  const b = await readValid(event, Body)
  const db = useDb()

  const patch: Record<string, unknown> = {}
  for (const k of ['title', 'done', 'data', 'position'] as const) {
    if (b[k] !== undefined) patch[k] = b[k]
  }

  const myLists = db.select({ id: schema.lists.id }).from(schema.lists)
    .where(eq(schema.lists.userId, userId))
  const [row] = await db.update(schema.listItems).set(patch)
    .where(and(eq(schema.listItems.id, id), inArray(schema.listItems.listId, myLists)))
    .returning()
  if (!row) throw createError({ statusCode: 404, message: 'No encontrado' })
  return row
})
