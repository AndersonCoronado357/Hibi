// Seguridad del login (portado de acmsy shared/auth/security.js).
//  · Contraseñas con scrypt (KDF de node:crypto).
//  · Tokens de un solo uso (reset).
//  · Sesión sin estado: cookie firmada con HMAC (base64url json.mac).
import crypto from 'node:crypto'

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16)
  const dk = crypto.scryptSync(String(password), salt, 64)
  return 'scrypt$' + salt.toString('hex') + '$' + dk.toString('hex')
}

export function verifyPassword(password: string, stored?: string | null): boolean {
  try {
    const [scheme, saltHex, hashHex] = String(stored || '').split('$')
    if (scheme !== 'scrypt' || !saltHex || !hashHex) return false
    const dk = crypto.scryptSync(String(password), Buffer.from(saltHex, 'hex'), 64)
    const expected = Buffer.from(hashHex, 'hex')
    return dk.length === expected.length && crypto.timingSafeEqual(dk, expected)
  } catch { return false }
}

export function randomToken(bytes = 32): string { return crypto.randomBytes(bytes).toString('hex') }
export function sha256(s: string): string { return crypto.createHash('sha256').update(String(s)).digest('hex') }
// Id público para filas (claves primarias text).
export function genId(): string { return crypto.randomUUID() }

function sessionSecret(): string {
  const s = process.env.SESSION_SECRET || useRuntimeConfig().sessionSecret
  if (!s) throw new Error('Falta SESSION_SECRET en el entorno')
  return s
}

export function signSession(data: unknown): string {
  const json = Buffer.from(JSON.stringify(data)).toString('base64url')
  const mac = crypto.createHmac('sha256', sessionSecret()).update(json).digest('base64url')
  return json + '.' + mac
}

export function unsignSession<T = Record<string, unknown>>(token?: string | null): T | null {
  if (!token || typeof token !== 'string' || token.indexOf('.') < 0) return null
  const i = token.lastIndexOf('.')
  const json = token.slice(0, i)
  const mac = token.slice(i + 1)
  const expected = crypto.createHmac('sha256', sessionSecret()).update(json).digest('base64url')
  try {
    if (mac.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null
    return JSON.parse(Buffer.from(json, 'base64url').toString('utf8')) as T
  } catch { return null }
}
