// Interpreta un texto suelto (la barra de captura rápida del inicio) y crea la
// entidad correcta con la IA (o un /comando). Devuelve lo que se creó.
import { z } from 'zod'

const Body = z.object({ text: z.string().trim().min(1).max(2000) })

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const b = await readValid(event, Body)
  const created = await interpretMessage(userId, b.text, { noEvents: true })
  return { created }
})
