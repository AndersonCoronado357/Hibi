// Intérprete de comandos: la IA lee lenguaje libre y decide QUÉ crear (tarea,
// cita/evento, recordatorio o nota) y con qué datos. Lo usan el chat y la barra
// de captura rápida del inicio. Los "/comandos" fuerzan una herramienta concreta.

import { and, eq } from 'drizzle-orm'

export type CommandType = 'task' | 'event' | 'reminder' | 'note'
export interface CommandResult { type: CommandType; title: string }

const COMMAND_TOOLS = [
  { type: 'function', function: { name: 'create_task', description: 'Crea una TAREA: algo por hacer / un pendiente sin hora fija', parameters: { type: 'object', properties: { title: { type: 'string' }, dueDate: { type: 'string', description: 'YYYY-MM-DD, "hoy" o "mañana" (opcional)' } }, required: ['title'] } } },
  { type: 'function', function: { name: 'create_event', description: 'Agenda un EVENTO o CITA en el calendario: cita médica, reunión, salida, algo con fecha y normalmente hora', parameters: { type: 'object', properties: { title: { type: 'string' }, eventDate: { type: 'string', description: 'YYYY-MM-DD, "hoy" o "mañana"' }, startTime: { type: 'string', description: 'HH:MM' }, endTime: { type: 'string', description: 'HH:MM (opcional)' } }, required: ['title'] } } },
  { type: 'function', function: { name: 'create_reminder', description: 'Crea un RECORDATORIO: "recuérdame/avísame" de algo a cierta hora', parameters: { type: 'object', properties: { title: { type: 'string' }, remindDate: { type: 'string', description: 'YYYY-MM-DD, "hoy" o "mañana"' }, time: { type: 'string', description: 'HH:MM' } }, required: ['title'] } } },
  { type: 'function', function: { name: 'create_note', description: 'Guarda una NOTA o idea (texto libre, sin fecha)', parameters: { type: 'object', properties: { title: { type: 'string' }, content: { type: 'string' } }, required: ['title'] } } },
]

const COMMAND_SYSTEM =
  'Eres el intérprete de comandos de Hibi. Si el usuario quiere GUARDAR algo, llama a la herramienta correcta y extrae fecha/hora si aparecen. ' +
  'Reglas: "cita", "reunión", "evento", algo con fecha+hora → create_event. "recuérdame"/"avísame" → create_reminder. "nota"/"idea"/"apunta" → create_note. Un pendiente/algo por hacer → create_task. ' +
  'Si el usuario solo PREGUNTA o pide VER/RESUMIR lo que YA tiene (sus tareas, qué tiene hoy o mañana, cómo van sus hábitos, sus recordatorios), NO llames a ninguna herramienta. ' +
  'Solo llama a UNA herramienta. Si es pura charla sin nada que guardar, no llames a ninguna.'

// Prompt para la captura rápida del inicio: AQUÍ NO HAY CALENDARIO. Cualquier
// cita/evento se guarda como RECORDATORIO (que además notifica).
const COMMAND_SYSTEM_NOEVENTS =
  'Eres el intérprete de la captura rápida de Hibi. AQUÍ NO EXISTE EL CALENDARIO. ' +
  'Reglas: cualquier "cita", "reunión", "evento" o algo con fecha/hora del que haya que avisar → create_reminder. "recuérdame"/"avísame" → create_reminder. "nota"/"idea"/"apunta" → create_note. Un pendiente/algo por hacer SIN hora → create_task. ' +
  'Solo llama a UNA herramienta. Si es pura charla sin nada que guardar, no llames a ninguna.'

const SLASH_TO_TOOL: Record<string, string> = {
  tarea: 'create_task', task: 'create_task', pendiente: 'create_task', todo: 'create_task',
  cita: 'create_event', evento: 'create_event', event: 'create_event', reunion: 'create_event', 'reunión': 'create_event',
  nota: 'create_note', note: 'create_note', idea: 'create_note', apunta: 'create_note',
  recordatorio: 'create_reminder', recuerdame: 'create_reminder', 'recuérdame': 'create_reminder', reminder: 'create_reminder', avisame: 'create_reminder', 'avísame': 'create_reminder',
}

export function localDay(offset = 0): string {
  const d = new Date(); d.setDate(d.getDate() + offset)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
export function resolveDate(s?: string): string | null {
  if (!s) return null
  const v = String(s).trim().toLowerCase()
  if (/^(hoy|today)$/.test(v)) return localDay(0)
  if (/^(mañana|manana|tomorrow)$/.test(v)) return localDay(1)
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v >= localDay(0) ? v : null // ignora fechas pasadas (alucinación del modelo)
  return null
}
// Ancla temporal para que el modelo calcule bien "hoy"/"mañana".
function dateHint(): string {
  return `La fecha de hoy es ${localDay(0)} (YYYY-MM-DD). Calcula cualquier fecha ("hoy", "mañana", "el viernes") a partir de HOY; nunca uses años pasados.`
}
// Extrae la fecha del TEXTO del usuario (determinista). Es más fiable que dejar
// que el modelo calcule fechas (los modelos pequeños fallan en esa aritmética).
function nextWeekday(target: number): string {
  const d = new Date(); d.setHours(0, 0, 0, 0)
  let add = (target - d.getDay() + 7) % 7
  if (add === 0) add = 7 // "el viernes" = el próximo, no hoy
  d.setDate(d.getDate() + add)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function dateFromText(text: string): string | null {
  const s = (text || '').toLowerCase()
  if (/\bpasado\s+ma(ñ|n)ana\b/.test(s)) return localDay(2)
  if (/\bma(ñ|n)ana\b|\btomorrow\b/.test(s)) return localDay(1)
  if (/\bhoy\b|\btoday\b|\besta\s+(tarde|noche)\b/.test(s)) return localDay(0)
  const days: Record<string, number> = { domingo: 0, lunes: 1, martes: 2, 'miércoles': 3, miercoles: 3, jueves: 4, viernes: 5, 'sábado': 6, sabado: 6 }
  for (const name in days) { if (new RegExp('\\b' + name + '\\b').test(s)) return nextWeekday(days[name]!) }
  const iso = s.match(/\b(\d{4}-\d{2}-\d{2})\b/); if (iso) return iso[1]!
  return null
}

// ── Markdown → HTML ────────────────────────────────────────────────────────
// Los modelos pequeños escriben Markdown mucho mejor que HTML a mano. Convertimos
// SOLO a los tags que el editor de notas estiliza (h1, h2, p, ul/ol/li, strong,
// em, blockquote). Nada de <h3> (el editor no lo estiliza → se vería plano).
function mdInline(s: string): string {
  let t = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  t = t.replace(/__(.+?)__/g, '<strong>$1</strong>')
  t = t.replace(/(^|[^*])\*(?!\s)(.+?)\*(?!\*)/g, '$1<em>$2</em>')
  t = t.replace(/(^|[^_])_(?!\s)(.+?)_(?!_)/g, '$1<em>$2</em>')
  return t
}
function markdownToHtml(md: string): string {
  const lines = md.replace(/\r/g, '').split('\n')
  const out: string[] = []
  let list: 'ul' | 'ol' | null = null
  const closeList = () => { if (list) { out.push(`</${list}>`); list = null } }
  for (const raw of lines) {
    const line = raw.trim()
    if (!line) { closeList(); continue }
    let m: RegExpMatchArray | null
    if ((m = line.match(/^(#{1,6})\s+(.*)$/))) { closeList(); const lvl = m[1]!.length === 1 ? 1 : 2; out.push(`<h${lvl}>${mdInline(m[2]!)}</h${lvl}>`); continue }
    if ((m = line.match(/^[-*•]\s+(.*)$/))) { if (list !== 'ul') { closeList(); out.push('<ul>'); list = 'ul' } out.push(`<li>${mdInline(m[1]!)}</li>`); continue }
    if ((m = line.match(/^\d+[.)]\s+(.*)$/))) { if (list !== 'ol') { closeList(); out.push('<ol>'); list = 'ol' } out.push(`<li>${mdInline(m[1]!)}</li>`); continue }
    if ((m = line.match(/^>\s?(.*)$/))) { closeList(); out.push(`<blockquote>${mdInline(m[1]!)}</blockquote>`); continue }
    closeList(); out.push(`<p>${mdInline(line)}</p>`)
  }
  closeList()
  return out.join('\n')
}

// Genera una nota desarrollada sobre el tema: carpeta, título y contenido HTML
// enriquecido (con la calidad de una respuesta del chat).
async function generateNote(topic: string): Promise<{ folder: string; title: string; content: string }> {
  const sys =
    'Eres Hibi. Escribe una NOTA completa y BIEN DESARROLLADA sobre el tema que pida el usuario, en español natural y correcto (nada de traducciones raras). ' +
    'Desarrolla de verdad: 4-6 secciones con explicaciones útiles, consejos concretos y ejemplos; no frases sueltas ni relleno. ' +
    'Usa Markdown: "## " para el título de cada sección, "- " para listas y "**negrita**" para resaltar lo importante. ' +
    'Responde EXACTAMENTE en este formato:\n' +
    'CARPETA: <1-3 palabras que agrupen el tema>\n' +
    'TITULO: <título claro y natural, sin repetir mi instrucción>\n' +
    '<a partir de aquí, el cuerpo de la nota en Markdown>'
  const raw = await aiText([{ role: 'system', content: sys }, { role: 'user', content: topic }])
  const fm = raw.match(/CARPETA:\s*(.+)/i)
  const tm = raw.match(/T[IÍ]TULO:\s*(.+)/i)
  const folder = (fm?.[1]?.trim() || 'Notas').slice(0, 40)
  const title = (tm?.[1]?.trim() || topic).slice(0, 120)
  // Cuerpo = lo que va tras la línea TITULO; si no aparece, quita las metalíneas.
  const after = raw.split(/T[IÍ]TULO:.*(?:\n|$)/i)[1]
  const body = (after && after.trim() ? after : raw.replace(/^\s*CARPETA:.*$/im, '').replace(/^\s*T[IÍ]TULO:.*$/im, '')).slice(0, 8000)
  const content = markdownToHtml(body) || `<p>${topic}</p>`
  return { folder, title, content }
}
// Busca (o crea) una carpeta del usuario por nombre y devuelve su id.
async function folderIdByName(userId: number, name: string): Promise<string> {
  const db = useDb()
  const [f] = await db.select({ id: schema.noteFolders.id }).from(schema.noteFolders)
    .where(and(eq(schema.noteFolders.userId, userId), eq(schema.noteFolders.name, name))).limit(1)
  if (f?.id) return f.id
  const [nf] = await db.insert(schema.noteFolders).values({ id: genId(), userId, name, color: '#5aa6d2', position: 0 }).returning({ id: schema.noteFolders.id })
  return nf!.id
}

async function runTool(userId: number, name: string, args: Record<string, any>, rawText = ''): Promise<CommandResult | null> {
  const db = useDb()
  const title = String(args.title || '').trim().slice(0, 200)
  if (!title) return null
  // Fecha: primero del texto del usuario (fiable); si no trae, la del modelo.
  const dateFrom = (modelArg?: string) => dateFromText(rawText) || resolveDate(modelArg)
  const time = (v: any) => (v ? String(v).slice(0, 5) : null)
  switch (name) {
    case 'create_task':
      await db.insert(schema.tasks).values({ id: genId(), userId, title, dueDate: dateFrom(args.dueDate) })
      return { type: 'task', title }
    case 'create_event':
      await db.insert(schema.events).values({ id: genId(), userId, title, eventDate: dateFrom(args.eventDate) || localDay(0), startTime: time(args.startTime), endTime: time(args.endTime) })
      return { type: 'event', title }
    case 'create_reminder':
      await db.insert(schema.reminders).values({ id: genId(), userId, title, remindDate: dateFrom(args.remindDate) || localDay(0), time: time(args.time) })
      return { type: 'reminder', title }
    case 'create_note': {
      // La IA redacta el contenido y propone una carpeta para el tema.
      const g = await generateNote(rawText || title)
      const folderId = await folderIdByName(userId, g.folder)
      await db.insert(schema.notes).values({ id: genId(), userId, folderId, title: g.title, content: g.content })
      return { type: 'note', title: g.title }
    }
    default:
      return null
  }
}

// En el modo rápido no hay calendario: una cita/evento/reunión se guarda como
// recordatorio. Red de seguridad por si el modelo elige la herramienta errónea.
function isEventLike(text: string): boolean {
  return /\b(cita|citas|reuni[oó]n|reunion|evento|eventos|appointment|meeting|consulta|turno)\b/i.test(text || '')
}
function remapNoEvents(name: string, text: string): string {
  if (name === 'create_event') return 'create_reminder'
  if (name === 'create_task' && isEventLike(text)) return 'create_reminder'
  return name
}

// ¿Es un "/comando"? Devuelve {tool, rest} o null.
function parseSlash(text: string): { tool: string; rest: string } | null {
  const m = text.trim().match(/^\/(\S+)\s+([\s\S]+)$/)
  if (!m) return null
  const tool = SLASH_TO_TOOL[m[1]!.toLowerCase()]
  return tool ? { tool, rest: m[2]!.trim() } : null
}

// Interpreta el mensaje SUELTO (barra del inicio). Slash → herramienta forzada;
// texto libre → la IA decide. Devuelve lo creado (vacío si no creó nada).
export async function interpretMessage(userId: number, text: string, opts: { noEvents?: boolean } = {}): Promise<CommandResult[]> {
  // El modo rápido (barra del inicio) NO toca el calendario: las citas se
  // convierten en recordatorios (que además notifican).
  const tools = opts.noEvents ? COMMAND_TOOLS.filter((t) => t.function.name !== 'create_event') : COMMAND_TOOLS
  const slash = parseSlash(text)
  if (slash) {
    let tool = slash.tool
    if (opts.noEvents && tool === 'create_event') tool = 'create_reminder'
    // Las notas se generan del texto: no hace falta la clasificación de la IA
    // para extraer args → una llamada menos (más rápido).
    if (tool === 'create_note') {
      const r = await runTool(userId, 'create_note', { title: slash.rest }, slash.rest)
      return r ? [r] : []
    }
    let calls = await detectToolCalls(
      [{ role: 'system', content: dateHint() }, { role: 'user', content: slash.rest }],
      tools.filter((t) => t.function.name === tool),
      { type: 'function', function: { name: tool } },
    ).catch(() => [] as any[])
    if (!calls.length) calls = [{ name: tool, args: {} }] // fallback determinista
    const out: CommandResult[] = []
    for (const c of calls) { const r = await runTool(userId, tool, { title: slash.rest, ...c.args }, slash.rest); if (r) out.push(r) }
    return out
  }
  const sys = opts.noEvents ? COMMAND_SYSTEM_NOEVENTS : COMMAND_SYSTEM
  const calls = await detectToolCalls([{ role: 'system', content: sys + ' ' + dateHint() }, { role: 'user', content: text }], tools, 'auto')
  const out: CommandResult[] = []
  for (const c of calls) {
    const name = opts.noEvents ? remapNoEvents(c.name, text) : c.name
    const r = await runTool(userId, name, c.args, text); if (r) out.push(r)
  }
  return out
}

// Interpreta usando una conversación completa (chat): la IA decide si crea algo.
export async function runFromMessages(userId: number, messages: { role: string; content: string }[]): Promise<CommandResult[]> {
  const rawText = [...messages].reverse().find((m) => m.role === 'user')?.content || ''
  const calls = await detectToolCalls([{ role: 'system', content: dateHint() }, ...messages], COMMAND_TOOLS, 'auto')
  const out: CommandResult[] = []
  for (const c of calls) { const r = await runTool(userId, c.name, c.args, rawText); if (r) out.push(r) }
  return out
}

// Confirmación en español para el chat.
export function confirmText(results: CommandResult[]): string {
  const label: Record<CommandType, string> = { task: 'la tarea', event: 'la cita', reminder: 'el recordatorio', note: 'la nota' }
  const where: Record<CommandType, string> = { task: 'Tareas', event: 'el Calendario', reminder: 'Recordatorios', note: 'Notas' }
  return results.map((r) => `Listo, creé ${label[r.type]} "${r.title}" en ${where[r.type]}.`).join(' ')
}
