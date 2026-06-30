// Rate limit básico en memoria (ventana deslizante por IP). Suficiente para un
// contenedor único; frena fuerza bruta en los endpoints de auth.
import type { H3Event } from 'h3'

const buckets = new Map<string, number[]>()

export function rateLimit(event: H3Event, opts: { key: string; limit: number; windowMs: number }) {
  let ip = 'unknown'
  try { ip = getRequestIP(event, { xForwardedFor: true }) || getRequestHeader(event, 'x-forwarded-for') || 'unknown' }
  catch { ip = getRequestHeader(event, 'x-forwarded-for') || 'unknown' }

  const k = `${opts.key}:${ip}`
  const now = Date.now()
  const hits = (buckets.get(k) ?? []).filter((t) => now - t < opts.windowMs)
  if (hits.length >= opts.limit) {
    throw createError({ statusCode: 429, message: 'Demasiados intentos. Espera un momento e inténtalo de nuevo.' })
  }
  hits.push(now)
  buckets.set(k, hits)
  if (buckets.size > 5000) buckets.clear() // poda simple
}
