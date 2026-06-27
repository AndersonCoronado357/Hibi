// Conexión singleton a Postgres (Drizzle + postgres.js). Lee DATABASE_URL del
// entorno (acmsy la inyecta en prod); en dev cae a un Postgres local.
// Nitro auto-importa server/utils → `useDb()` y `schema` sin import.
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../db/schema'

let _db: PostgresJsDatabase<typeof schema> | null = null

const DEV_FALLBACK = 'postgres://postgres:postgres@localhost:5432/hibi'

export function useDb(): PostgresJsDatabase<typeof schema> {
  if (_db) return _db
  const url = process.env.DATABASE_URL || DEV_FALLBACK
  const client = postgres(url, { max: 5, onnotice: () => {} })
  _db = drizzle(client, { schema })
  return _db
}

export { schema }
