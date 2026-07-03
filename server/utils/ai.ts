// IA local de acmsy. Preferimos el gateway OpenAI-compatible (AI_API_URL con
// Bearer AI_API_KEY); si no, Ollama nativo (OLLAMA_URL /api/chat). Ambos en
// streaming. En dev basta con Ollama corriendo en 127.0.0.1:11434.
export interface AiMessage { role: string; content: string }

export const SYSTEM_PROMPT =
  'Eres Hibi, la asistente cálida y cercana de la app Hibi (organización personal: tareas, notas, calendario, hábitos, metas, diario, finanzas y más). ' +
  'Tu identidad es SIEMPRE "Hibi". Nunca digas que eres un "modelo de lenguaje" ni menciones empresas (ni Anthropic, ni OpenAI, ni Qwen, ni ninguna) ni nombres de modelos. ' +
  'Si te preguntan qué eres, quién te creó o qué modelo usas, responde solo algo como "Soy Hibi, tu asistente dentro de esta app" y sigue ayudando; no des más detalles técnicos. ' +
  'Respondes en español, con frases claras y breves, tono amable y práctico. Ayudas a planificar el día, resumir y dar ideas. ' +
  'No inventes datos del usuario que no conozcas; si te piden crear algo, explica en una frase cómo hacerlo en la app.'

export async function* streamChat(messages: AiMessage[]): AsyncGenerator<string> {
  const cfg = useRuntimeConfig()
  const aiUrl = (process.env.AI_API_URL || cfg.aiApiUrl || '').replace(/\/+$/, '')
  const aiKey = process.env.AI_API_KEY || cfg.aiApiKey
  const aiBasic = process.env.AI_BASIC_AUTH || (cfg.aiBasicAuth as string) || ''
  const ollama = (process.env.OLLAMA_URL || cfg.ollamaUrl || '').replace(/\/+$/, '')
  const model = process.env.AI_MODEL || (cfg.aiModel as string) || 'qwen2.5:3b'
  if (aiUrl) { yield* openaiStream(aiUrl, aiKey, aiBasic, model, messages); return }
  if (ollama) { yield* ollamaStream(ollama, model, messages); return }
  throw new Error('No hay IA configurada')
}

export interface ToolCallResult { name: string; args: Record<string, any> }

// Una sola llamada NO-stream con `tools` para detectar comandos. Solo aplica al
// gateway OpenAI-compatible (AI_API_URL); con Ollama local devuelve [] (no tools).
export async function detectToolCalls(messages: AiMessage[], tools: unknown[], toolChoice: unknown = 'auto'): Promise<ToolCallResult[]> {
  const cfg = useRuntimeConfig()
  const aiUrl = (process.env.AI_API_URL || cfg.aiApiUrl || '').replace(/\/+$/, '')
  if (!aiUrl) return []
  const aiKey = process.env.AI_API_KEY || cfg.aiApiKey
  const aiBasic = process.env.AI_BASIC_AUTH || (cfg.aiBasicAuth as string) || ''
  const model = process.env.AI_MODEL || (cfg.aiModel as string) || 'qwen2.5:3b'
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (aiBasic) headers.Authorization = 'Basic ' + Buffer.from(aiBasic).toString('base64')
  else if (aiKey) headers.Authorization = `Bearer ${aiKey}`
  if (aiKey) headers['X-API-Key'] = aiKey
  const res = await fetch(`${aiUrl}/chat/completions`, {
    method: 'POST', headers,
    body: JSON.stringify({ model, messages, tools, tool_choice: toolChoice, stream: false }),
  })
  if (!res.ok) throw new Error('IA(tools) respondió ' + res.status)
  const j: any = await res.json()
  const calls = j?.choices?.[0]?.message?.tool_calls || []
  return calls
    .map((tc: any) => {
      let args: Record<string, any> = {}
      try { args = JSON.parse(tc?.function?.arguments || '{}') } catch { /* args inválidos */ }
      return { name: tc?.function?.name || '', args }
    })
    .filter((c: ToolCallResult) => c.name)
}

// Completa (sin stream) y devuelve el texto plano. Reúne el streaming en un string.
export async function aiText(messages: AiMessage[]): Promise<string> {
  let s = ''
  try { for await (const t of streamChat(messages)) s += t } catch { /* ignore */ }
  return s.trim()
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

async function* openaiStream(base: string, key: string | undefined, basic: string, model: string, messages: AiMessage[]) {
  // acmsy: Basic auth (usuario:clave) + header X-API-Key. Genérico: Bearer.
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (basic) headers.Authorization = 'Basic ' + Buffer.from(basic).toString('base64')
  else if (key) headers.Authorization = `Bearer ${key}`
  if (key) headers['X-API-Key'] = key
  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers,
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
