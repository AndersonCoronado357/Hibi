// Registro por correo/contraseña. Crea la cuenta, siembra defaults y abre sesión.
import { z } from 'zod'

const schema = z.object({
  name: z.string().trim().min(1, 'nameRequired').max(80).optional(),
  email: z.string().trim().toLowerCase().email('emailInvalid'),
  password: z.string().min(6, 'passwordTooShort').max(200),
})

export default defineEventHandler(async (event) => {
  rateLimit(event, { key: 'register', limit: 6, windowMs: 60_000 })
  const parsed = schema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, message: tServer(event, parsed.error.issues[0]?.message || 'invalidData') })
  const { name, email, password } = parsed.data

  const existing = await findUserByEmail(email)
  if (existing?.passwordHash) throw createError({ statusCode: 409, message: tServer(event, 'emailTaken') })

  let user
  if (existing) {
    // Cuenta creada antes con Google: le añadimos contraseña sin duplicar.
    await setUserPassword(existing.id, hashPassword(password))
    user = existing
  } else {
    user = await createUser({ email, name: name ?? null, passwordHash: hashPassword(password), emailVerified: false })
  }

  setSession(event, user.id)
  await recordLogin(user.id, 'password')
  return { user: { id: user.id, email: user.email, name: user.name ?? name ?? null } }
})
