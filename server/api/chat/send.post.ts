// Envía un mensaje del chat. Primero deja que la IA (o un /comando) interprete
// si el usuario quiere CREAR algo (tarea/cita/recordatorio/nota); si crea algo,
// confirma. Si no, responde como chat normal en streaming. A prueba de fallos.
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

// Limpia el título que devuelve la IA: los modelos pequeños suelen envolverlo
// ("Un buen título sería \"X\".", "Título: X", "- X"). Extraemos solo el título.
function cleanTitle(s: string): string {
  const raw = (s || '').trim()
  // 1) Si hay texto entre comillas, casi siempre ES el título.
  const q = raw.match(/["“«']([^"”»']{2,60})["”»']/)
  let t = q ? q[1]! : (raw.split('\n').map((l) => l.trim()).find(Boolean) || '')
  t = t.replace(/^(t[ií]tulo|title|tema)\s*[:\-–]\s*/i, '') // etiqueta "Título:"
  t = t.replace(/^[-*•\d.)\s]+/, '')                        // viñeta/numeración
  t = t.replace(/^["'“”«»\s]+|["'“”«».,;:!¡¿?\s]+$/g, '')   // comillas/puntuación
  const words = t.split(/\s+/).filter(Boolean)
  if (words.length > 8) t = words.slice(0, 8).join(' ')     // recorta frases largas
  return t.slice(0, 60).trim()
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

  const aiMessages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...prior.map((m) => ({ role: m.role, content: m.text })),
    { role: 'user', content: b.text },
  ]

  // ¿Comando? /algo fuerza la herramienta; texto libre → la IA decide con el
  // contexto de la conversación. Fallback seguro: si falla, chat normal.
  let commandReply = ''
  try {
    const results = b.text.trim().startsWith('/')
      ? await interpretMessage(userId, b.text)
      : await runFromMessages(userId, aiMessages)
    if (results.length) commandReply = confirmText(results)
  } catch (err) {
    console.warn('[chat/send] intérprete falló, sigo en chat:', String(err))
  }

  // Si no creó nada y el mensaje pide un RESUMEN (chips del chat o preguntas),
  // leemos los datos REALES del usuario y se los damos a la IA como contexto.
  if (!commandReply) {
    const intent = detectSummaryIntent(b.text)
    if (intent) {
      try {
        const ctx = await buildSummaryContext(userId, intent)
        if (ctx) aiMessages.splice(1, 0, { role: 'system', content: ctx })
      } catch (err) {
        console.warn('[chat/send] contexto de resumen falló:', String(err))
      }
    }
  }

  setResponseHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  setResponseHeader(event, 'Cache-Control', 'no-cache, no-transform')
  setResponseHeader(event, 'X-Accel-Buffering', 'no')

  const encoder = new TextEncoder()
  let full = ''
  return new ReadableStream({
    async start(controller) {
      try {
        if (commandReply) {
          full = commandReply
          controller.enqueue(encoder.encode(commandReply))
        } else {
          for await (const token of streamChat(aiMessages)) {
            full += token
            controller.enqueue(encoder.encode(token))
          }
        }
      } catch (err) {
        const note = 'No pude conectar con la IA. Inténtalo de nuevo.'
        if (!full) { full = note; controller.enqueue(encoder.encode(note)) }
        console.warn('[chat/send] IA no disponible:', String(err))
      } finally {
        try {
          await db.insert(schema.chatMessages).values({ id: genId(), conversationId: conv.id, role: 'assistant', text: full || '…' })
          // Título de la conversación según el TEMA (no el primer mensaje crudo).
          let topicTitle = ''
          if (firstUser) {
            try {
              const rawTitle = await aiText([
                { role: 'system', content: 'Tu única tarea es crear un título. Responde SOLO con el título (3 a 6 palabras) que resuma el tema. Nada de comillas, nada de la palabra "Título", nada de explicaciones ni punto final. Solo el título.' },
                { role: 'user', content: `Usuario: ${b.text}\nAsistente: ${full}`.slice(0, 500) },
              ])
              topicTitle = cleanTitle(rawTitle)
            } catch { /* deja el título provisional */ }
          }
          await db.update(schema.chatConversations)
            .set({ updatedAt: new Date(), ...(topicTitle ? { title: topicTitle } : {}) })
            .where(eq(schema.chatConversations.id, conv.id))
        } catch { /* noop */ }
        controller.close()
      }
    },
  })
})
