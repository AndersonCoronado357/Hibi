// Crea una carpeta de notas.
import { z } from 'zod'

const Body = z.object({
  name: z.string().trim().min(1, 'Escribe un nombre').max(80),
  color: z.string().max(20).optional(),
})

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const b = await readValid(event, Body)
  const [row] = await useDb().insert(schema.noteFolders).values({
    id: genId(), userId, name: b.name, color: b.color || '#5aa6d2',
  }).returning()
  return row
})
