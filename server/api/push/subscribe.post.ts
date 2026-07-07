// Guarda (o actualiza) la suscripción push de este navegador/dispositivo.
import { z } from 'zod'
import { eq } from 'drizzle-orm'

const Body = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }),
})

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const body = await readValid(event, Body)
  const existing = await useDb().select().from(schema.pushSubscriptions).where(eq(schema.pushSubscriptions.endpoint, body.endpoint))
  if (existing[0]) {
    await useDb().update(schema.pushSubscriptions)
      .set({ userId, p256dh: body.keys.p256dh, auth: body.keys.auth })
      .where(eq(schema.pushSubscriptions.endpoint, body.endpoint))
    return { ok: true }
  }
  await useDb().insert(schema.pushSubscriptions).values({
    id: genId(),
    userId,
    endpoint: body.endpoint,
    p256dh: body.keys.p256dh,
    auth: body.keys.auth,
  })
  return { ok: true }
})
