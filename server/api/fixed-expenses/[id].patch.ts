// Edita un gasto fijo. Si cambia el monto, el valor anterior NO se pisa: cada
// cambio queda registrado en fixed_expense_amounts. Asi se puede ver lo que
// costaba antes, y los meses ya cerrados siguen sumando lo que valia entonces.
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'

const Body = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  amount: z.number().int().optional(),
  categoryId: z.string().nullable().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color invalido').nullable().optional(),
})

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = getRouterParam(event, 'id') as string
  const b = await readValid(event, Body)
  const db = useDb()

  const [antes] = await db.select().from(schema.fixedExpenses)
    .where(and(eq(schema.fixedExpenses.id, id), eq(schema.fixedExpenses.userId, userId))).limit(1)
  if (!antes) throw createError({ statusCode: 404, message: 'No encontrado' })

  const patch: Record<string, unknown> = {}
  if (b.title !== undefined) patch.title = b.title
  if (b.amount !== undefined) patch.amount = b.amount
  if (b.categoryId !== undefined) patch.categoryId = b.categoryId || null
  if (b.color !== undefined) patch.color = b.color || null

  const [row] = await db.update(schema.fixedExpenses).set(patch)
    .where(and(eq(schema.fixedExpenses.id, id), eq(schema.fixedExpenses.userId, userId)))
    .returning()

  // Solo se anota si el monto DE VERDAD cambio: guardar al tocar el color no
  // deberia ensuciar el historial con una entrada repetida.
  if (b.amount !== undefined && b.amount !== antes.amount) {
    await db.insert(schema.fixedExpenseAmounts).values({
      id: genId(), userId, fixedExpenseId: id, amount: b.amount, fromMonth: mesActual(),
    })
  }

  return { ...row, history: await historialDe(db, userId, id) }
})
