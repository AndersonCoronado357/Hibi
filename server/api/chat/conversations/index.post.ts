// Crea una conversación nueva con el saludo inicial de Hibi.
const GREETING = 'Hola, soy Hibi. Puedo ayudarte a planificar el día, resumir y darte ideas. ¿Qué necesitas?'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const db = useDb()
  const convId = genId()
  const [conv] = await db.insert(schema.chatConversations).values({ id: convId, userId, title: 'Nueva conversación' }).returning()
  const [msg] = await db.insert(schema.chatMessages).values({ id: genId(), conversationId: convId, role: 'assistant', text: GREETING }).returning()
  return { ...conv, messages: [msg] }
})
