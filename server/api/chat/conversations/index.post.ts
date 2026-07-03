// Crea una conversación nueva VACÍA (sin saludo automático de la IA).
// El saludo/empty-state es puramente visual en la página; nunca se guarda
// un mensaje del asistente hasta que el usuario escribe algo.
export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const db = useDb()
  const convId = genId()
  const [conv] = await db.insert(schema.chatConversations).values({ id: convId, userId, title: 'Nueva conversación' }).returning()
  return { ...conv, messages: [] }
})
