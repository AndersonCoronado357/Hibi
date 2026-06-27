// Actualiza una nota (título, contenido HTML, carpeta, fijada).
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'

const Body = z.object({
  folderId: z.string().nullable().optional(),
  title: z.string().max(300).optional(),
  content: z.string().optional(),
  pinned: z.boolean().optional(),
})

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = getRouterParam(event, 'id') as string
  const b = await readValid(event, Body)
  const patch: Record<string, unknown> = { updatedAt: new Date() }
  if (b.folderId !== undefined) patch.folderId = b.folderId || null
  if (b.title !== undefined) patch.title = b.title
  if (b.content !== undefined) patch.content = b.content
  if (b.pinned !== undefined) patch.pinned = b.pinned
  const [row] = await useDb().update(schema.notes).set(patch)
    .where(and(eq(schema.notes.id, id), eq(schema.notes.userId, userId)))
    .returning()
  if (!row) throw createError({ statusCode: 404, message: 'Nota no encontrada' })
  return row
})
