// Guarda el estado de la mascota (upsert de la fila del usuario).
import { z } from 'zod'
import { eq } from 'drizzle-orm'

const stat = z.number().int().min(0).max(100)
const Body = z.object({
  energia: stat.optional(),
  pancita: stat.optional(),
  carino: stat.optional(),
  diversion: stat.optional(),
  coins: z.number().int().min(0).optional(),
  streak: z.number().int().min(0).optional(),
  room: z.string().max(40).optional(),
  inventory: z.record(z.number().int()).optional(),
  lastCareDay: z.string().max(20).optional(),
  lastTick: z.number().optional(), // ms epoch desde el cliente
})

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const b = await readValid(event, Body)
  const patch: Record<string, unknown> = { updatedAt: new Date() }
  for (const k of ['energia', 'pancita', 'carino', 'diversion', 'coins', 'streak', 'room', 'inventory', 'lastCareDay'] as const) {
    if (b[k] !== undefined) patch[k] = b[k]
  }
  if (b.lastTick !== undefined) patch.lastTick = new Date(b.lastTick)

  const db = useDb()
  await db.insert(schema.petState).values({ userId, ...(patch as any) })
    .onConflictDoUpdate({ target: schema.petState.userId, set: patch })
  const [row] = await db.select().from(schema.petState).where(eq(schema.petState.userId, userId)).limit(1)
  return row
})
