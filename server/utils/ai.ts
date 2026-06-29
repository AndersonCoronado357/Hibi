// IA local de acmsy. Preferimos el gateway OpenAI-compatible (AI_API_URL con
// Bearer AI_API_KEY); si no, Ollama nativo (OLLAMA_URL /api/chat). Ambos en
// streaming. En dev basta con Ollama corriendo en 127.0.0.1:11434.
export interface AiMessage { role: string; content: string }

export const SYSTEM_PROMPT =
  'Eres Hibi, una asistente cálida y cercana dentro de una app de organización personal (tareas, notas, calendario, hábitos, metas, diario, finanzas y más). ' +
  'Respondes en español, con frases claras y breves, tono amable y práctico. Ayudas a planificar el día, resumir y dar ideas. ' +
  'No inventes datos del usuario que no conozcas; si te piden crear algo, explica en una frase cómo hacerlo en la app.'

export async function* streamChat(messages: AiMessage[]): AsyncGenerator<string> {
  const cfg = useRuntimeConfig()
  const aiUrl = (process.env.AI_API_URL || cfg.aiApiUrl || '').replace(/\/+$/, '')
  const aiKey = process.env.AI_API_KEY || cfg.aiApiKey
  const ollama = (process.env.OLLAMA_URL || cfg.ollamaUrl || '').replace(/\/+$/, '')
  const model = process.env.AI_MODEL || 'qwen2.5:3b'
  if (aiUrl) { yield* openaiStream(aiUrl, aiKey, model, messages); return }
  if (ollama) { yield* ollamaStream(ollama, model, messages); return }
  throw new Error('No hay IA configurada')
}

// Lector de líneas sobre el cuerpo de una respuesta en streaming.
async function* readLines(res: Response): AsyncGenerator<string> {
  const reader = res.body!.getReader()
  const dec = new TextDecoder()
  let buf = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += dec.decode(value, { stream: true })
    let idx: number
    while ((idx = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, idx); buf = buf.slice(idx + 1)
      if (line.trim()) yield line.trim()
    }
  }
  if (buf.trim()) yield buf.trim()
}

async function* openaiStream(base: string, key: string | undefined, model: string, messages: AiMessage[]) {
  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(key ? { Authorization: `Bearer ${key}` } : {}) },
    body: JSON.stringify({ model, messages, stream: true }),
  })
  if (!res.ok || !res.body) throw new Error('La IA respondió ' + res.status)
  for await (const line of readLines(res)) {
    if (!line.startsWith('data:')) continue
    const data = line.slice(5).trim()
    if (data === '[DONE]') break
    try { const j = JSON.parse(data); const t = j.choices?.[0]?.delta?.content; if (t) yield t as string } catch { /* keep-alive */ }
  }
}

async function* ollamaStream(base: string, model: string, messages: AiMessage[]) {
  const res = await fetch(`${base}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, stream: true }),
  })
  if (!res.ok || !res.body) throw new Error('Ollama respondió ' + res.status)
  for await (const line of readLines(res)) {
    try { const j = JSON.parse(line); const t = j.message?.content; if (t) yield t as string; if (j.done) break } catch { /* partial */ }
  }
}
