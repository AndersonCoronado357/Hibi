// Actualiza un recordatorio del usuario (título, fecha, hora, alarma, aviso, notas, hecho).
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'

const Body = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  remindDate: zDate().optional(),
  time: zTime().optional(),
  alarm: z.boolean().optional(),
  pre: z.string().max(80).nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
  done: z.boolean().optional(),
})

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = getRouterParam(event, 'id') as string
  const body = await readValid(event, Body)

  const patch: Record<string, unknown> = { updatedAt: new Date() }
  if (body.title !== undefined) patch.title = body.title
  if (body.remindDate !== undefined) patch.remindDate = body.remindDate || null
  if (body.time !== undefined) patch.time = body.time || null
  if (body.alarm !== undefined) patch.alarm = body.alarm
  if (body.pre !== undefined) patch.pre = body.pre || null
  if (body.notes !== undefined) patch.notes = body.notes || null
  if (body.done !== undefined) patch.done = body.done

  const [row] = await useDb().update(schema.reminders).set(patch)
    .where(and(eq(schema.reminders.id, id), eq(schema.reminders.userId, userId)))
    .returning()
  if (!row) throw createError({ statusCode: 404, message: 'No encontrado' })
  return row
})
