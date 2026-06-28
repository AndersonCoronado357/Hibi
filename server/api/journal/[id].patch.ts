// Actualiza una entrada de diario del usuario (fecha, ánimo, energía, cuerpo).
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'

const Body = z.object({
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida').optional(),
  mood: z.number().int().min(1).max(5).optional(),
  energy: z.number().int().min(1).max(5).optional(),
  body: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = getRouterParam(event, 'id') as string
  const body = await readValid(event, Body)

  const patch: Record<string, unknown> = { updatedAt: new Date() }
  if (body.entryDate !== undefined) patch.entryDate = body.entryDate
  if (body.mood !== undefined) patch.mood = body.mood
  if (body.energy !== undefined) patch.energy = body.energy
  if (body.body !== undefined) patch.body = body.body

  const [row] = await useDb().update(schema.journalEntries).set(patch)
    .where(and(eq(schema.journalEntries.id, id), eq(schema.journalEntries.userId, userId)))
    .returning()
  if (!row) throw createError({ statusCode: 404, message: 'No encontrado' })
  return row
})
