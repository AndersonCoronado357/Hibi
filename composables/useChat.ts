// Estado del chat con Hibi. Ahora persiste en la BD y responde con la IA
// local (streaming). Mantiene el estado en useState para reactividad y el
// panel de historial; se hidrata desde el servidor al abrir el chat.

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  at: number
}

export interface ChatConversation {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
}

let counter = 0
function uid(prefix = 'm') {
  return prefix + Date.now().toString(36) + (counter++).toString(36)
}

function toMs(v: any): number {
  const n = v ? Date.parse(v) : NaN
  return Number.isNaN(n) ? Date.now() : n
}
function mapMessage(m: any): ChatMessage {
  return { id: m.id, role: m.role, text: m.text, at: toMs(m.createdAt) }
}
function mapConversation(c: any): ChatConversation {
  return {
    id: c.id,
    title: c.title,
    messages: (c.messages ?? []).map(mapMessage),
    createdAt: toMs(c.createdAt),
    updatedAt: toMs(c.updatedAt),
  }
}
function titleFrom(text: string) {
  const t = text.trim().replace(/\s+/g, ' ')
  return t.length > 40 ? t.slice(0, 40) + '…' : t
}

/** Lista de TODAS las conversaciones (ordenadas por updatedAt desc) */
export function useChatConversations() {
  return useState<ChatConversation[]>('hibi.chat.conversations', () => [])
}

/** ID de la conversación activa */
export function useActiveChatId() {
  return useState<string>('hibi.chat.activeId', () => '')
}

/** Conversación actualmente activa */
export function useActiveConversation() {
  const list = useChatConversations()
  const activeId = useActiveChatId()
  return computed<ChatConversation | undefined>(() => list.value.find((c) => c.id === activeId.value))
}

/** Mensajes de la conversación activa (mutables) */
export function useChatMessages() {
  const list = useChatConversations()
  const activeId = useActiveChatId()
  return computed<ChatMessage[]>({
    get() { return list.value.find((c) => c.id === activeId.value)?.messages ?? [] },
    set(v) {
      const c = list.value.find((c) => c.id === activeId.value)
      if (c) { c.messages = v; c.updatedAt = Date.now() }
    },
  })
}

/** Carga las conversaciones del usuario (una vez). */
export async function hydrateChat() {
  const hydrated = useState<boolean>('hibi.chat.hydrated', () => false)
  if (hydrated.value) return
  const list = useChatConversations()
  const activeId = useActiveChatId()
  try {
    const rows = await useRequestFetch()<any[]>('/api/chat/conversations')
    if (rows.length) {
      list.value = rows.map(mapConversation)
      if (!list.value.some((c) => c.id === activeId.value)) activeId.value = list.value[0]!.id
    } else {
      await startNewConversation()
    }
  } catch { /* offline: se queda vacío */ }
  hydrated.value = true
}

/** Crea una nueva conversación y la activa */
export async function startNewConversation() {
  const list = useChatConversations()
  const activeId = useActiveChatId()
  try {
    const c = mapConversation(await $fetch('/api/chat/conversations', { method: 'POST' }))
    list.value.unshift(c)
    activeId.value = c.id
  } catch { /* noop */ }
}

/** Activa una conversación por ID */
export function switchToConversation(id: string) {
  const list = useChatConversations()
  const activeId = useActiveChatId()
  if (list.value.some((c) => c.id === id)) activeId.value = id
}

/** Borra una conversación (si era la activa, activa la siguiente o crea una nueva) */
export async function deleteConversation(id: string) {
  const list = useChatConversations()
  const activeId = useActiveChatId()
  const idx = list.value.findIndex((c) => c.id === id)
  if (idx < 0) return
  list.value.splice(idx, 1)
  $fetch(`/api/chat/conversations/${id}`, { method: 'DELETE' }).catch(() => {})
  if (activeId.value === id) {
    if (list.value.length) activeId.value = list.value[0]!.id
    else await startNewConversation()
  }
}

/** Envía el mensaje del usuario y transmite la respuesta de la IA en vivo. */
export async function sendUserMessage(text: string) {
  const list = useChatConversations()
  const activeId = useActiveChatId()
  const conv = list.value.find((c) => c.id === activeId.value)
  if (!conv) return
  const trimmed = text.trim()
  if (!trimmed) return

  if (!conv.messages.some((m) => m.role === 'user')) conv.title = titleFrom(trimmed)
  conv.messages.push({ id: uid(), role: 'user', text: trimmed, at: Date.now() })
  conv.updatedAt = Date.now()

  const assistant = reactive<ChatMessage>({ id: uid(), role: 'assistant', text: '', at: Date.now() })
  conv.messages.push(assistant)

  try {
    const res = await fetch('/api/chat/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: conv.id, text: trimmed }),
    })
    if (!res.ok || !res.body) throw new Error('bad response')
    const reader = res.body.getReader()
    const dec = new TextDecoder()
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      assistant.text += dec.decode(value, { stream: true })
      conv.updatedAt = Date.now()
    }
  } catch {
    if (!assistant.text) assistant.text = 'No pude conectar con la IA. Inténtalo de nuevo.'
  }
  conv.updatedAt = Date.now()
}
