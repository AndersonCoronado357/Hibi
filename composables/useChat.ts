// Estado del chat con la mascota. La integración real con Groq se cablea
// más adelante (cuando el usuario provea GROQ_API_KEY); aquí ofrecemos un
// stub con respuestas amables para validar el flujo.
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  at: number
}

export function useChatMessages() {
  return useState<ChatMessage[]>('hibi.chat.messages', () => [
    {
      id: 'm0',
      role: 'assistant',
      text: '¡Hola! Soy tu nubecita. Puedo ayudarte a crear tareas, eventos o notas, hacer resúmenes y guiarte por la app. ¿Qué necesitas?',
      at: Date.now(),
    },
  ])
}

let counter = 0
function uid() {
  return 'm' + Date.now().toString(36) + (counter++).toString(36)
}

const STARTERS = [
  'Anota lo que me digas, lo dejaré preparado en su sitio.',
  'Puedo crear una tarea o un evento en cuanto conectemos el backend.',
  'Buena idea. ¿La quieres para hoy o para más adelante?',
  'Apuntado. Si quieres, hago un resumen de tu día en cualquier momento.',
  'Listo. Si quieres también puedo recordártelo más tarde.',
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

export async function sendUserMessage(text: string) {
  const messages = useChatMessages()
  const trimmed = text.trim()
  if (!trimmed) return
  messages.value.push({ id: uid(), role: 'user', text: trimmed, at: Date.now() })
  await new Promise((r) => setTimeout(r, 420 + Math.random() * 380))
  messages.value.push({ id: uid(), role: 'assistant', text: fakeAssistantReply(trimmed), at: Date.now() })
}
