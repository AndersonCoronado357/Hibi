// Crea un gasto fijo (monto entero COP/mes) y abre su historial en el mes actual.
import { z } from 'zod'

const Body = z.object({
  title: z.string().trim().min(1, 'Escribe un concepto').max(120),
  amount: z.number().int(),
  categoryId: z.string().nullable().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color invalido').nullable().optional(),
})

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const b = await readValid(event, Body)
  const db = useDb()
  const [row] = await db.insert(schema.fixedExpenses).values({
    id: genId(), userId,
    categoryId: b.categoryId || null,
    title: b.title,
    amount: b.amount,
    color: b.color || null,
  }).returning()
  await db.insert(schema.fixedExpenseAmounts).values({
    id: genId(), userId, fixedExpenseId: row!.id, amount: b.amount, fromMonth: mesActual(),
  })
  return { ...row, history: await historialDe(db, userId, row!.id) }
})
