// Login por correo/contraseña. El formulario manda `identifier` (usamos el correo).
import { z } from 'zod'

const schema = z.object({
  identifier: z.string().trim().min(1, 'emailRequired'),
  password: z.string().min(1, 'passwordRequired'),
})

export default defineEventHandler(async (event) => {
  rateLimit(event, { key: 'login', limit: 12, windowMs: 60_000 })
  const parsed = schema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, message: tServer(event, parsed.error.issues[0]?.message || 'invalidData') })
  const { identifier, password } = parsed.data

  const user = await findUserByEmail(identifier)
  if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
    throw createError({ statusCode: 401, message: tServer(event, 'badCredentials') })
  }

  setSession(event, user.id)
  await recordLogin(user.id, 'password')
  return { user: { id: user.id, email: user.email, name: user.name ?? null } }
})
