// Guarda ajustes del usuario (nombre visible, avatar, idioma, tema, avisos).
import { z } from 'zod'
import { eq } from 'drizzle-orm'

const Body = z.object({
  displayName: z.string().max(80).nullable().optional(),
  avatar: z.string().max(3_000_000).nullable().optional(), // data URL
  locale: z.string().max(5).optional(),
  theme: z.string().max(20).optional(),
  notifications: z.record(z.boolean()).optional(),
})

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const b = await readValid(event, Body)
  const patch: Record<string, unknown> = { updatedAt: new Date() }
  if (b.displayName !== undefined) patch.displayName = b.displayName || null
  if (b.avatar !== undefined) patch.avatar = b.avatar || null
  if (b.locale !== undefined) patch.locale = b.locale
  if (b.theme !== undefined) patch.theme = b.theme
  if (b.notifications !== undefined) patch.notifications = b.notifications

  const db = useDb()
  await db.insert(schema.userSettings).values({ userId, ...(patch as any) })
    .onConflictDoUpdate({ target: schema.userSettings.userId, set: patch })
  const [s] = await db.select().from(schema.userSettings).where(eq(schema.userSettings.userId, userId)).limit(1)
  return s
})
