// Actualiza un preset de pomodoro (parcial).
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'

const Body = z.object({
  label: z.string().trim().min(1).max(60).optional(),
  focus: z.number().int().min(1).max(180).optional(),
  short: z.number().int().min(1).max(60).optional(),
  long: z.number().int().min(1).max(120).optional(),
  color: z.string().max(60).optional(),
  ringColor: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Color inválido').optional(),
  position: z.number().int().optional(),
})

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = getRouterParam(event, 'id') as string
  const b = await readValid(event, Body)
  const patch: Record<string, unknown> = {}
  if (b.label !== undefined) patch.label = b.label
  if (b.focus !== undefined) patch.focus = b.focus
  if (b.short !== undefined) patch.short = b.short
  if (b.long !== undefined) patch.long = b.long
  if (b.color !== undefined) patch.color = b.color
  if (b.ringColor !== undefined) patch.ringColor = b.ringColor
  if (b.position !== undefined) patch.position = b.position
  const [row] = await useDb().update(schema.focusPresets).set(patch)
    .where(and(eq(schema.focusPresets.id, id), eq(schema.focusPresets.userId, userId)))
    .returning()
  if (!row) throw createError({ statusCode: 404, message: 'No encontrado' })
  return row
})
