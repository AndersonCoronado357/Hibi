// Sesión y usuarios (sobre las tablas auth_* de acmsy, con Drizzle).
import type { H3Event } from 'h3'
import { eq, sql } from 'drizzle-orm'
import { useDb, schema } from './db'
import { signSession, unsignSession, genId } from './crypto'

const COOKIE = 'hibi_session'
const norm = (e: string) => String(e || '').trim().toLowerCase()
const isHttps = () => (process.env.ORIGIN || useRuntimeConfig().origin || '').startsWith('https')

// ── Cookie de sesión (sin estado, firmada HMAC) ──
export function setSession(event: H3Event, userId: number) {
  setCookie(event, COOKIE, signSession({ uid: userId }), {
    httpOnly: true, secure: isHttps(), sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30,
  })
}
export function clearAuthSession(event: H3Event) { deleteCookie(event, COOKIE, { path: '/' }) }
export function getUserId(event: H3Event): number | null {
  const data = unsignSession<{ uid: number }>(getCookie(event, COOKIE))
  return data?.uid ?? null
}
export async function getUser(event: H3Event) {
  const id = getUserId(event)
  if (!id) return null
  const [u] = await useDb().select().from(schema.authUsers).where(eq(schema.authUsers.id, id)).limit(1)
  return u ?? null
}
export async function requireUserId(event: H3Event): Promise<number> {
  const id = getUserId(event)
  if (!id) throw createError({ statusCode: 401, message: tServer(event, 'notAuthenticated') })
  return id
}

// ── Usuarios ──
export async function findUserByEmail(email: string) {
  const [u] = await useDb().select().from(schema.authUsers).where(eq(schema.authUsers.email, norm(email))).limit(1)
  return u ?? null
}
export async function findUserById(id: number) {
  const [u] = await useDb().select().from(schema.authUsers).where(eq(schema.authUsers.id, id)).limit(1)
  return u ?? null
}
export async function createUser(data: { email: string; passwordHash?: string | null; name?: string | null; googleId?: string | null; emailVerified?: boolean }) {
  const [u] = await useDb().insert(schema.authUsers).values({
    email: norm(data.email),
    passwordHash: data.passwordHash ?? null,
    name: data.name ?? null,
    googleId: data.googleId ?? null,
    emailVerified: data.emailVerified ?? false,
  }).returning()
  await seedUserDefaults(u!.id)
  return u!
}
export async function setUserPassword(id: number, passwordHash: string) {
  await useDb().update(schema.authUsers).set({ passwordHash }).where(eq(schema.authUsers.id, id))
}
export async function linkGoogle(id: number, googleId: string, name: string | null) {
  await useDb().update(schema.authUsers).set({ googleId, emailVerified: true, name: sql`coalesce(${schema.authUsers.name}, ${name})` }).where(eq(schema.authUsers.id, id))
}
export async function recordLogin(userId: number, method: string) {
  const db = useDb()
  await db.update(schema.authUsers).set({
    lastLoginAt: new Date(), lastSeenAt: new Date(), loginCount: sql`coalesce(${schema.authUsers.loginCount}, 0) + 1`,
  }).where(eq(schema.authUsers.id, userId))
  await db.insert(schema.authLogins).values({ userId, method })
}

// ── Tokens de un solo uso (reset) ──
export async function createResetToken(userId: number, tokenHash: string, expiresAt: Date) {
  await useDb().insert(schema.authTokens).values({ userId, kind: 'reset', tokenHash, expiresAt })
}
export async function findValidResetToken(tokenHash: string) {
  const [t] = await useDb().select().from(schema.authTokens)
    .where(sql`${schema.authTokens.kind} = 'reset' and ${schema.authTokens.tokenHash} = ${tokenHash} and ${schema.authTokens.used} = false`).limit(1)
  if (!t) return null
  if (new Date(t.expiresAt).getTime() < Date.now()) return null
  return t
}
export async function consumeToken(id: number) {
  await useDb().update(schema.authTokens).set({ used: true }).where(eq(schema.authTokens.id, id))
}

// ── Defaults al crear cuenta ──
export async function seedUserDefaults(userId: number) {
  const db = useDb()
  const cats = [
    { name: 'Comida', icon: 'Utensils', color: '#5aa6d2' },
    { name: 'Hogar', icon: 'Home', color: '#34936a' },
    { name: 'Transporte', icon: 'Bus', color: '#c5733f' },
    { name: 'Ocio', icon: 'Film', color: '#db8aa3' },
    { name: 'Salud', icon: 'HeartPulse', color: '#7a63c0' },
    { name: 'Otros', icon: 'ShoppingBag', color: '#bf8f2e' },
  ]
  await db.insert(schema.financeCategories).values(cats.map((c, i) => ({ id: genId(), userId, name: c.name, icon: c.icon, color: c.color, position: i })))
  await db.insert(schema.petState).values({ userId, inventory: { galleta: 3, manzana: 2, sandwich: 1 } }).onConflictDoNothing()
  await db.insert(schema.userSettings).values({ userId }).onConflictDoNothing()
}
