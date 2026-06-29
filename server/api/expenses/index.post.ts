// Crea un gasto (monto entero COP, fecha yyyy-MM-dd).
import { z } from 'zod'

const Body = z.object({
  title: z.string().trim().min(1, 'Escribe un concepto').max(120),
  amount: z.number().int(),
  spentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
  categoryId: z.string().nullable().optional(),
})

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const b = await readValid(event, Body)
  const [row] = await useDb().insert(schema.expenses).values({
    id: genId(), userId,
    categoryId: b.categoryId || null,
    title: b.title,
    amount: b.amount,
    spentDate: b.spentDate,
  }).returning()
  return row
})
