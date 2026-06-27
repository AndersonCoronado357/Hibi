// Usuario de la sesión actual (+ ajustes de perfil). Devuelve { user: null } si no hay.
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const user = await getUser(event)
  if (!user) return { user: null }
  const [settings] = await useDb().select().from(schema.userSettings).where(eq(schema.userSettings.userId, user.id)).limit(1)
  return {
    user: {
      id: user.id,
      email: user.email,
      name: settings?.displayName || user.name || null,
      avatar: settings?.avatar || null,
      locale: settings?.locale || 'es',
      theme: settings?.theme || 'light',
      emailVerified: user.emailVerified ?? false,
    },
  }
})
