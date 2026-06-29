// Envía un mensaje: guarda el del usuario, llama a la IA local en streaming,
// va enviando el texto al cliente y al terminar guarda la respuesta.
import { z } from 'zod'
import { and, eq, asc } from 'drizzle-orm'

const Body = z.object({
  conversationId: z.string().min(1),
  text: z.string().trim().min(1, 'Escribe un mensaje').max(4000),
})

function titleFrom(text: string) {
  const t = text.trim().replace(/\s+/g, ' ')
  return t.length > 40 ? t.slice(0, 40) + '…' : t
}

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const b = await readValid(event, Body)
  const db = useDb()

  const [conv] = await db.select().from(schema.chatConversations)
    .where(and(eq(schema.chatConversations.id, b.conversationId), eq(schema.chatConversations.userId, userId))).limit(1)
  if (!conv) throw createError({ statusCode: 404, message: 'Conversación no encontrada' })

  // Guarda el mensaje del usuario; pon título si es el primero suyo.
  const prior = await db.select().from(schema.chatMessages)
    .where(eq(schema.chatMessages.conversationId, conv.id)).orderBy(asc(schema.chatMessages.createdAt))
  const firstUser = !prior.some((m) => m.role === 'user')
  await db.insert(schema.chatMessages).values({ id: genId(), conversationId: conv.id, role: 'user', text: b.text })
  await db.update(schema.chatConversations)
    .set({ updatedAt: new Date(), ...(firstUser ? { title: titleFrom(b.text) } : {}) })
    .where(eq(schema.chatConversations.id, conv.id))

  // Historial para la IA (prompt de sistema + mensajes previos + el nuevo).
  const aiMessages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...prior.map((m) => ({ role: m.role, content: m.text })),
    { role: 'user', content: b.text },
  ]

  setResponseHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  setResponseHeader(event, 'Cache-Control', 'no-cache, no-transform')
  setResponseHeader(event, 'X-Accel-Buffering', 'no')

  const encoder = new TextEncoder()
  let full = ''
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const token of streamChat(aiMessages)) {
          full += token
          controller.enqueue(encoder.encode(token))
        }
      } catch (err) {
        const note = 'No pude conectar con la IA local. Comprueba que Ollama esté encendido e inténtalo otra vez.'
        if (!full) { full = note; controller.enqueue(encoder.encode(note)) }
        console.warn('[chat/send] IA no disponible:', String(err))
      } finally {
        try {
          await db.insert(schema.chatMessages).values({ id: genId(), conversationId: conv.id, role: 'assistant', text: full || '…' })
          await db.update(schema.chatConversations).set({ updatedAt: new Date() }).where(eq(schema.chatConversations.id, conv.id))
        } catch { /* noop */ }
        controller.close()
      }
    },
  })
})
