// Registro por correo/contraseña. Crea la cuenta, siembra defaults y abre sesión.
import { z } from 'zod'

const schema = z.object({
  name: z.string().trim().min(1, 'Escribe tu nombre').max(80).optional(),
  email: z.string().trim().toLowerCase().email('Correo no válido'),
  password: z.string().min(6, 'La contraseña necesita al menos 6 caracteres').max(200),
})

export default defineEventHandler(async (event) => {
  const parsed = schema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, message: parsed.error.issues[0]?.message || 'Datos inválidos' })
  const { name, email, password } = parsed.data

  const existing = await findUserByEmail(email)
  if (existing?.passwordHash) throw createError({ statusCode: 409, message: 'Ese correo ya tiene una cuenta. Inicia sesión.' })

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
