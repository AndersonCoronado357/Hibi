// Estado del chat con la mascota. Ahora soporta MÚLTIPLES conversaciones
// con un panel de historial. La integración real con Groq se cablea más
// adelante; aquí ofrecemos un stub con respuestas amables.

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  at: number
}

export interface ChatConversation {
  id: string
  title: string        // título auto-generado del primer mensaje del user
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
}

let counter = 0
function uid(prefix = 'm') {
  return prefix + Date.now().toString(36) + (counter++).toString(36)
}

function newGreeting(): ChatMessage {
  return {
    id: 'm0',
    role: 'assistant',
    text: 'Hola, soy Hibi. Puedo crear tareas, eventos o notas, hacer resúmenes y guiarte por la app. ¿Qué necesitas?',
    at: Date.now(),
  }
}

function newConversation(): ChatConversation {
  const now = Date.now()
  return {
    id: uid('c'),
    title: 'Nueva conversación',
    messages: [newGreeting()],
    createdAt: now,
    updatedAt: now,
  }
}

/** Lista de TODAS las conversaciones (ordenadas por updatedAt desc) */
export function useChatConversations() {
  return useState<ChatConversation[]>('hibi.chat.conversations', () => [newConversation()])
}

/** ID de la conversación activa */
export function useActiveChatId() {
  return useState<string>('hibi.chat.activeId', () => {
    const list = useChatConversations()
    return list.value[0]?.id ?? ''
  })
}

/** Conversación actualmente activa */
export function useActiveConversation() {
  const list = useChatConversations()
  const activeId = useActiveChatId()
  return computed<ChatConversation | undefined>(() =>
    list.value.find(c => c.id === activeId.value),
  )
}

/** Mensajes de la conversación activa (mutables) */
export function useChatMessages() {
  const list = useChatConversations()
  const activeId = useActiveChatId()
  return computed<ChatMessage[]>({
    get() { return list.value.find(c => c.id === activeId.value)?.messages ?? [] },
    set(v) {
      const c = list.value.find(c => c.id === activeId.value)
      if (c) { c.messages = v; c.updatedAt = Date.now() }
    },
  })
}

/** Crea una nueva conversación y la activa */
export function startNewConversation() {
  const list = useChatConversations()
  const activeId = useActiveChatId()
  const c = newConversation()
  list.value.unshift(c)
  activeId.value = c.id
}

/** Activa una conversación por ID */
export function switchToConversation(id: string) {
  const list = useChatConversations()
  const activeId = useActiveChatId()
  if (list.value.some(c => c.id === id)) activeId.value = id
}

/** Borra una conversación (si era la activa, activa la siguiente o crea una nueva) */
export function deleteConversation(id: string) {
  const list = useChatConversations()
  const activeId = useActiveChatId()
  const idx = list.value.findIndex(c => c.id === id)
  if (idx < 0) return
  list.value.splice(idx, 1)
  if (activeId.value === id) {
    if (list.value.length) activeId.value = list.value[0]!.id
    else startNewConversation()
  }
}

const STARTERS = [
  'Anotado, lo dejaré preparado en su sitio.',
  'Puedo crear una tarea o un evento en cuanto conectemos el backend.',
  'Buena idea. ¿La quieres para hoy o más adelante?',
  'Apuntado. Si quieres, hago un resumen de tu día cuando lo pidas.',
  'Listo. También puedo recordártelo más tarde.',
]

/** Stub local hasta tener Groq. Devuelve un mensaje breve y amable. */
export function fakeAssistantReply(prompt: string): string {
  const p = prompt.toLowerCase().trim()
  if (/^hola|buenas|hey|qué tal/.test(p)) return '¡Hola! Cuéntame en qué te ayudo hoy.'
  if (/tarea|pendiente|hacer/.test(p)) return 'Hecho — cuando tengamos backend la creo en Tareas. ¿Para cuándo?'
  if (/evento|reunión|cita/.test(p)) return 'Anotado para Calendario. Dime fecha y hora cuando puedas.'
  if (/nota|apunte/.test(p)) return 'Listo, lo guardo como nota. ¿La quieres en alguna carpeta?'
  if (/recuerda|recordatorio|recuérdame/.test(p)) return 'Cuento contigo — añadiré el recordatorio en cuanto haya backend.'
  if (/gracias/.test(p)) return '¡Para eso estoy!'
  return STARTERS[Math.floor(Math.random() * STARTERS.length)]!
}

function titleFrom(text: string) {
  const t = text.trim().replace(/\s+/g, ' ')
  return t.length > 40 ? t.slice(0, 40) + '…' : t
}

export async function sendUserMessage(text: string) {
  const list = useChatConversations()
  const activeId = useActiveChatId()
  const conv = list.value.find(c => c.id === activeId.value)
  if (!conv) return
  const trimmed = text.trim()
  if (!trimmed) return
  // Si es el primer mensaje del usuario, usa el texto como título
  const hasUserMsg = conv.messages.some(m => m.role === 'user')
  if (!hasUserMsg) conv.title = titleFrom(trimmed)
  conv.messages.push({ id: uid(), role: 'user', text: trimmed, at: Date.now() })
  conv.updatedAt = Date.now()
  await new Promise((r) => setTimeout(r, 420 + Math.random() * 380))
  conv.messages.push({ id: uid(), role: 'assistant', text: fakeAssistantReply(trimmed), at: Date.now() })
  conv.updatedAt = Date.now()
}
