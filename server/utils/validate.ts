// Lee y valida el body con un esquema Zod; lanza 400 con un mensaje claro.
import type { H3Event } from 'h3'
import { z, type ZodSchema } from 'zod'

export async function readValid<T>(event: H3Event, schema: ZodSchema<T>): Promise<T> {
  const parsed = schema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, message: parsed.error.issues[0]?.message || 'Datos inválidos' })
  return parsed.data
}

// Fecha 'yyyy-MM-dd' opcional: acepta la cadena válida, '' o null → null.
export const zDate = () =>
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida').or(z.literal('')).nullable()

// Hora 'HH:mm' opcional.
export const zTime = () =>
  z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Hora inválida').or(z.literal('')).nullable()
