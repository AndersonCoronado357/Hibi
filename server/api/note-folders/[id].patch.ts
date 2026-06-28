// Renombra o recolorea una carpeta.
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'

const Body = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  color: z.string().max(20).optional(),
  position: z.number().int().optional(),
})

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = getRouterParam(event, 'id') as string
  const b = await readValid(event, Body)
  const patch: Record<string, unknown> = {}
  if (b.name !== undefined) patch.name = b.name
  if (b.color !== undefined) patch.color = b.color
  if (b.position !== undefined) patch.position = b.position
  const [row] = await useDb().update(schema.noteFolders).set(patch)
    .where(and(eq(schema.noteFolders.id, id), eq(schema.noteFolders.userId, userId)))
    .returning()
  if (!row) throw createError({ statusCode: 404, message: 'Carpeta no encontrada' })
  return row
})
