// Fija una contraseña nueva a partir del token del correo y abre sesión.
import { z } from 'zod'

const schema = z.object({
  token: z.string().min(10),
  password: z.string().min(6, 'La contraseña necesita al menos 6 caracteres').max(200),
})

export default defineEventHandler(async (event) => {
  const parsed = schema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, message: parsed.error.issues[0]?.message || 'Datos inválidos' })
  const { token, password } = parsed.data

  const row = await findValidResetToken(sha256(token))
  if (!row) throw createError({ statusCode: 400, message: 'El enlace no es válido o ya venció' })

  await setUserPassword(row.userId, hashPassword(password))
  await consumeToken(row.id)
  setSession(event, row.userId)
  await recordLogin(row.userId, 'reset')
  return { ok: true }
})
