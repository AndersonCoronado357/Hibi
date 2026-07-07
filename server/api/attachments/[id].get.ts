// Sirve un adjunto del usuario. Tipos seguros (imagen/audio/video/pdf) se
// envían inline con su mimetype real; "texto" SIEMPRE se fuerza a
// text/plain (nunca se confía en el mimetype declarado por quien subió el
// archivo — evitaría que alguien cuele text/html y ejecute JS en nuestro
// origen); cualquier otro tipo SIEMPRE se fuerza a descarga como
// octet-stream — así un archivo malicioso nunca se ejecuta/renderiza.
import { and, eq } from 'drizzle-orm'
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = getRouterParam(event, 'id') as string
  const [row] = await useDb().select().from(schema.noteAttachments)
    .where(and(eq(schema.noteAttachments.id, id), eq(schema.noteAttachments.userId, userId))).limit(1)
  if (!row) throw createError({ statusCode: 404, message: tServer(event, 'notFound') })

  const filePath = attachmentPath(row.storageKey)
  try { await stat(filePath) } catch { throw createError({ statusCode: 404, message: tServer(event, 'notFound') }) }

  const inlineSafe = row.kind === 'image' || row.kind === 'audio' || row.kind === 'video' || row.kind === 'pdf' || row.kind === 'text'
  const contentType = row.kind === 'text' ? 'text/plain; charset=utf-8' : (inlineSafe ? row.mimetype : 'application/octet-stream')
  setResponseHeader(event, 'Content-Type', contentType)
  setResponseHeader(event, 'Content-Disposition', `${inlineSafe ? 'inline' : 'attachment'}; filename="${encodeURIComponent(row.filename)}"`)
  setResponseHeader(event, 'Cache-Control', 'private, max-age=31536000, immutable')
  return sendStream(event, createReadStream(filePath))
})
