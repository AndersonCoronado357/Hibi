// Crea una nota (normalmente vacía, en la carpeta actual).
import { z } from 'zod'

const Body = z.object({
  folderId: z.string().nullable().optional(),
  title: z.string().max(300).optional(),
  content: z.string().optional(),
  pinned: z.boolean().optional(),
})

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const b = await readValid(event, Body)
  const [row] = await useDb().insert(schema.notes).values({
    id: genId(), userId,
    folderId: b.folderId || null,
    title: b.title ?? '',
    content: b.content ?? '',
    pinned: b.pinned ?? false,
  }).returning()
  return row
})
