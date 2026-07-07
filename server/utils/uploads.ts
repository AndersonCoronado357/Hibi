// Almacenamiento en disco de los archivos adjuntos de notas. La carpeta es
// persistente y vive FUERA del bundle de la app: en prod es un volumen
// montado (UPLOADS_DIR), en dev cae a .data/uploads (ya gitignorado).
import { mkdir, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'

export type AttachmentKind = 'image' | 'audio' | 'video' | 'pdf' | 'text' | 'other'

export const MAX_UPLOAD_SIZE = 20 * 1024 * 1024 // 20MB

export function uploadsDir(): string {
  return process.env.UPLOADS_DIR || path.join(process.cwd(), '.data', 'uploads')
}

export function attachmentPath(storageKey: string): string {
  return path.join(uploadsDir(), storageKey)
}

export async function saveUpload(storageKey: string, data: Buffer): Promise<void> {
  const dir = uploadsDir()
  await mkdir(dir, { recursive: true })
  await writeFile(path.join(dir, storageKey), data)
}

export async function deleteUpload(storageKey: string): Promise<void> {
  try { await unlink(attachmentPath(storageKey)) } catch { /* ya no existe: nada que hacer */ }
}

export function classifyKind(mimetype: string, filename?: string): AttachmentKind {
  // SVG puede llevar <script> que se ejecuta si alguien abre el archivo
  // directo (no al insertarlo como <img>) — se trata como "other" (descarga
  // forzada) para que nunca corra en el origen de la app.
  if (mimetype === 'image/svg+xml') return 'other'
  if (mimetype.startsWith('image/')) return 'image'
  if (mimetype.startsWith('audio/')) return 'audio'
  if (mimetype.startsWith('video/')) return 'video'
  if (mimetype === 'application/pdf') return 'pdf'
  if (mimetype === 'text/plain' || mimetype === 'text/markdown') return 'text'
  const ext = (filename || '').toLowerCase().match(/\.(\w+)$/)?.[1]
  if (ext === 'md' || ext === 'markdown' || ext === 'txt') return 'text'
  return 'other'
}

// Extensión segura derivada del nombre original (solo alfanumérica, corta).
export function safeExt(filename: string): string {
  const ext = path.extname(filename || '').toLowerCase().replace(/[^a-z0-9.]/g, '')
  return ext.length > 1 && ext.length <= 10 ? ext : ''
}
