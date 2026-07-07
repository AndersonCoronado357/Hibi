// Borra la suscripción push de este navegador (se llama al apagar el maestro).
import { z } from 'zod'
import { eq, and } from 'drizzle-orm'

const Body = z.object({ endpoint: z.string().url() })

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const body = await readValid(event, Body)
  await useDb().delete(schema.pushSubscriptions)
    .where(and(eq(schema.pushSubscriptions.endpoint, body.endpoint), eq(schema.pushSubscriptions.userId, userId)))
  return { ok: true }
})
