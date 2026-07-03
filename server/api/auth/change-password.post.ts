// Cambia la contraseña del usuario en sesión. Verifica la actual con scrypt.
import { z } from 'zod'

const Body = z.object({
  current: z.string().min(1, 'currentRequired'),
  next: z.string().min(8, 'newPasswordTooShort'),
})

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  rateLimit(event, { key: 'change-password', limit: 8, windowMs: 60_000 })
  const parsed = Body.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, message: tServer(event, parsed.error.issues[0]?.message || 'invalidData') })
  const { current, next } = parsed.data

  const user = await findUserById(userId)
  if (!user) throw createError({ statusCode: 401, message: tServer(event, 'notAuthenticated') })

  // Cuentas con contraseña: la actual debe coincidir. Cuentas solo-Google
  // (sin passwordHash) pueden establecer una contraseña por primera vez.
  if (user.passwordHash && !verifyPassword(current, user.passwordHash)) {
    throw createError({ statusCode: 400, message: tServer(event, 'wrongCurrentPassword') })
  }

  await setUserPassword(userId, hashPassword(next))
  return { ok: true }
})
