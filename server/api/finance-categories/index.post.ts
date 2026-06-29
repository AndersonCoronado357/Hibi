// Crea una categoría de finanzas (icono lucide + color hex).
import { z } from 'zod'

const Body = z.object({
  name: z.string().trim().min(1, 'Escribe un nombre').max(60),
  icon: z.string().max(40).optional(),
  color: z.string().max(20).optional(),
})

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const b = await readValid(event, Body)
  const [row] = await useDb().insert(schema.financeCategories).values({
    id: genId(), userId,
    name: b.name,
    icon: b.icon || 'ShoppingBag',
    color: b.color || '#5aa6d2',
  }).returning()
  return row
})
