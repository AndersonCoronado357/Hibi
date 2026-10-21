// Crea una suscripción (monto entero COP/mes, próximo cobro yyyy-MM-dd o null).
import { z } from 'zod'

const Body = z.object({
  title: z.string().trim().min(1, 'Escribe un concepto').max(120),
  amount: z.number().int(),
  nextPayment: zDate().optional(),
  categoryId: z.string().nullable().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color invalido').nullable().optional(),
})

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const b = await readValid(event, Body)
  const [row] = await useDb().insert(schema.fixedExpenses).values({
    id: genId(), userId,
    categoryId: b.categoryId || null,
    title: b.title,
    amount: b.amount,
    nextPayment: b.nextPayment || null,
    color: b.color || null,
  }).returning()
  return row
})
