// Crea un ítem en una lista. La lista debe ser del usuario (si no, 404).
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'

const Body = z.object({
  listId: z.string().min(1),
  title: z.string().trim().min(1, 'Escribe un título').max(200),
  done: z.boolean().optional(),
  data: z.record(z.any()).optional(),
  position: z.number().int().optional(),
})

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const b = await readValid(event, Body)
  const db = useDb()

  // La lista debe ser del usuario.
  const [list] = await db.select({ id: schema.lists.id }).from(schema.lists)
    .where(and(eq(schema.lists.id, b.listId), eq(schema.lists.userId, userId))).limit(1)
  if (!list) throw createError({ statusCode: 404, message: 'No encontrado' })

  const [row] = await db.insert(schema.listItems).values({
    id: genId(),
    listId: b.listId,
    title: b.title,
    done: b.done ?? false,
    data: b.data ?? {},
    position: b.position ?? 0,
  }).returning()
  return row
})
