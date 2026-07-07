// Esquema de la base de datos (Drizzle + Postgres).
//  · Las tablas auth_* ESPEJAN el esquema del módulo compartido de acmsy
//    (el panel de acmsy lee `auth_users`), así que no se cambian sus nombres/columnas.
//  · Cada tabla de módulo referencia al usuario por `user_id` → auth_users.id.
import { pgTable, serial, integer, text, boolean, timestamp, date, jsonb, uniqueIndex, index } from 'drizzle-orm/pg-core'

// ───────────────────────── AUTH (compartido acmsy) ─────────────────────────
export const authUsers = pgTable('auth_users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  name: text('name'),
  googleId: text('google_id'),
  emailVerified: boolean('email_verified').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }),
  loginCount: integer('login_count').default(0),
})

export const authTokens = pgTable('auth_tokens', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => authUsers.id, { onDelete: 'cascade' }),
  kind: text('kind').notNull(),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  used: boolean('used').default(false),
})

export const authLogins = pgTable('auth_logins', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => authUsers.id, { onDelete: 'cascade' }),
  method: text('method'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// Sesiones propias (cookie firmada + registro server-side para revocar).
export const authSessions = pgTable('auth_sessions', {
  id: text('id').primaryKey(), // token aleatorio
  userId: integer('user_id').notNull().references(() => authUsers.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
})

// Ajustes/preferencias por usuario (perfil, notificaciones, idioma, tema).
export const userSettings = pgTable('user_settings', {
  userId: integer('user_id').primaryKey().references(() => authUsers.id, { onDelete: 'cascade' }),
  displayName: text('display_name'),
  avatar: text('avatar'), // data URL / URL
  locale: text('locale').default('es'),
  theme: text('theme').default('light'),
  notifications: jsonb('notifications').$type<Record<string, boolean>>().default({}),
  summaryPushedOn: date('summary_pushed_on'), // último día que se envió el resumen por push (evita duplicados)
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// helper para el timestamp de creación
const created = () => timestamp('created_at', { withTimezone: true }).defaultNow()
const updated = () => timestamp('updated_at', { withTimezone: true }).defaultNow()

// ───────────────────────── TAREAS ─────────────────────────
export const tasks = pgTable('tasks', {
  id: text('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => authUsers.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  dueDate: date('due_date'),
  repeatDays: text('repeat_days'), // días de repetición LMXJVSD; vacío/null = una sola vez
  priority: integer('priority').notNull().default(0), // 0..3
  status: text('status').notNull().default('pending'), // pending | done
  notes: text('notes'),
  position: integer('position').notNull().default(0),
  createdAt: created(),
  updatedAt: updated(),
}, (t) => ({ byUser: index('tasks_user_idx').on(t.userId) }))

// ───────────────────────── NOTAS ─────────────────────────
export const noteFolders = pgTable('note_folders', {
  id: text('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => authUsers.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color').notNull().default('#5aa6d2'),
  position: integer('position').notNull().default(0),
  createdAt: created(),
}, (t) => ({ byUser: index('note_folders_user_idx').on(t.userId) }))

export const notes = pgTable('notes', {
  id: text('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => authUsers.id, { onDelete: 'cascade' }),
  folderId: text('folder_id').references(() => noteFolders.id, { onDelete: 'set null' }),
  title: text('title').notNull().default(''),
  content: text('content').notNull().default(''), // HTML
  pinned: boolean('pinned').default(false),
  createdAt: created(),
  updatedAt: updated(),
}, (t) => ({ byUser: index('notes_user_idx').on(t.userId) }))

// Archivos adjuntos (disco persistente, no BLOB en BD). Dos usos, mutuamente
// excluyentes vía noteId/folderId:
//  · kind image|audio → noteId set: se insertan inline en el body de ESA nota
//    (referenciados por URL desde el HTML). No tienen listado propio.
//  · kind pdf|other (o cualquiera subido desde la carpeta) → folderId set:
//    viven en el panel de la carpeta, nunca dentro de una nota.
export const noteAttachments = pgTable('note_attachments', {
  id: text('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => authUsers.id, { onDelete: 'cascade' }),
  noteId: text('note_id').references(() => notes.id, { onDelete: 'cascade' }),
  folderId: text('folder_id').references(() => noteFolders.id, { onDelete: 'cascade' }),
  kind: text('kind').notNull(), // image | audio | pdf | other
  filename: text('filename').notNull(),
  mimetype: text('mimetype').notNull(),
  size: integer('size').notNull().default(0),
  storageKey: text('storage_key').notNull(), // nombre del archivo en disco (uploads dir)
  createdAt: created(),
}, (t) => ({
  byNote: index('note_attachments_note_idx').on(t.noteId),
  byFolder: index('note_attachments_folder_idx').on(t.folderId),
  byUser: index('note_attachments_user_idx').on(t.userId),
}))

// ───────────────────────── CALENDARIO ─────────────────────────
export const events = pgTable('events', {
  id: text('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => authUsers.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  eventDate: date('event_date').notNull(),
  startTime: text('start_time'), // HH:MM
  endTime: text('end_time'),
  color: text('color').notNull().default('#5aa6d2'),
  createdAt: created(),
  updatedAt: updated(),
}, (t) => ({ byUser: index('events_user_idx').on(t.userId) }))

// ───────────────────────── RECORDATORIOS ─────────────────────────
export const reminders = pgTable('reminders', {
  id: text('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => authUsers.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  remindDate: date('remind_date').notNull(),
  time: text('time'), // HH:MM
  alarm: boolean('alarm').default(false),
  pre: text('pre'), // "10 min antes"
  notes: text('notes'),
  done: boolean('done').default(false),
  pushedAt: timestamp('pushed_at', { withTimezone: true }), // cuándo se envió el push (null = pendiente)
  createdAt: created(),
  updatedAt: updated(),
}, (t) => ({ byUser: index('reminders_user_idx').on(t.userId) }))

// ───────────────────────── HÁBITOS ─────────────────────────
export const habits = pgTable('habits', {
  id: text('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => authUsers.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  icon: text('icon').notNull().default('Sparkles'), // nombre lucide
  ringColor: text('ring_color').notNull().default('#5aa6d2'),
  position: integer('position').notNull().default(0),
  createdAt: created(),
}, (t) => ({ byUser: index('habits_user_idx').on(t.userId) }))

export const habitCompletions = pgTable('habit_completions', {
  id: text('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => authUsers.id, { onDelete: 'cascade' }),
  habitId: text('habit_id').notNull().references(() => habits.id, { onDelete: 'cascade' }),
  day: date('day').notNull(),
}, (t) => ({ uniq: uniqueIndex('habit_completions_uniq').on(t.habitId, t.day) }))

// ───────────────────────── METAS ─────────────────────────
export const goals = pgTable('goals', {
  id: text('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => authUsers.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  target: text('target'), // "Dic 2026"
  area: text('area'),
  unit: text('unit').notNull().default(''),
  current: integer('current').notNull().default(0),
  total: integer('total').notNull().default(100),
  color: text('color').notNull().default('bg-sky-soft text-sky-deep'),
  ringColor: text('ring_color').notNull().default('#5aa6d2'),
  position: integer('position').notNull().default(0),
  createdAt: created(),
  updatedAt: updated(),
}, (t) => ({ byUser: index('goals_user_idx').on(t.userId) }))

export const goalMilestones = pgTable('goal_milestones', {
  id: text('id').primaryKey(),
  goalId: text('goal_id').notNull().references(() => goals.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  at: integer('at').notNull().default(0), // % 0..100
  done: boolean('done').default(false),
  position: integer('position').notNull().default(0),
})

// ───────────────────────── DIARIO ─────────────────────────
export const journalEntries = pgTable('journal_entries', {
  id: text('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => authUsers.id, { onDelete: 'cascade' }),
  entryDate: date('entry_date').notNull(),
  mood: integer('mood').notNull().default(3), // 1..5
  energy: integer('energy').notNull().default(3), // 1..5
  body: text('body').notNull().default(''), // HTML
  createdAt: created(),
  updatedAt: updated(),
}, (t) => ({ byUser: index('journal_user_idx').on(t.userId) }))

// ───────────────────────── ENFOQUE ─────────────────────────
export const focusPresets = pgTable('focus_presets', {
  id: text('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => authUsers.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  focus: integer('focus').notNull().default(25),
  short: integer('short').notNull().default(5),
  long: integer('long').notNull().default(15),
  color: text('color').notNull().default('bg-sky-soft'),
  ringColor: text('ring_color').notNull().default('#5aa6d2'),
  position: integer('position').notNull().default(0),
}, (t) => ({ byUser: index('focus_presets_user_idx').on(t.userId) }))

export const focusSessions = pgTable('focus_sessions', {
  id: text('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => authUsers.id, { onDelete: 'cascade' }),
  task: text('task'),
  minutes: integer('minutes').notNull().default(0),
  finishedAt: timestamp('finished_at', { withTimezone: true }).defaultNow(),
}, (t) => ({ byUser: index('focus_sessions_user_idx').on(t.userId) }))

// ───────────────────────── RUTINAS ─────────────────────────
export const routines = pgTable('routines', {
  id: text('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => authUsers.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  time: text('time').notNull().default('morning'), // morning|midday|night
  days: jsonb('days').$type<string[]>().notNull().default([]),
  position: integer('position').notNull().default(0),
  createdAt: created(),
}, (t) => ({ byUser: index('routines_user_idx').on(t.userId) }))

export const routineSteps = pgTable('routine_steps', {
  id: text('id').primaryKey(),
  routineId: text('routine_id').notNull().references(() => routines.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  mins: integer('mins').notNull().default(0),
  done: boolean('done').default(false),
  position: integer('position').notNull().default(0),
})

export const routineSubsteps = pgTable('routine_substeps', {
  id: text('id').primaryKey(),
  stepId: text('step_id').notNull().references(() => routineSteps.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  done: boolean('done').default(false),
  position: integer('position').notNull().default(0),
})

// ───────────────────────── LISTAS ─────────────────────────
export const lists = pgTable('lists', {
  id: text('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => authUsers.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type').notNull().default('shopping'), // shopping|movies|books|places
  tone: text('tone').notNull().default('bg-sky-soft'),
  icon: text('icon').notNull().default('ListChecks'),
  position: integer('position').notNull().default(0),
  createdAt: created(),
}, (t) => ({ byUser: index('lists_user_idx').on(t.userId) }))

export const listItems = pgTable('list_items', {
  id: text('id').primaryKey(),
  listId: text('list_id').notNull().references(() => lists.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  done: boolean('done').default(false),
  data: jsonb('data').$type<Record<string, unknown>>().default({}), // qty/year/rating/author/city según tipo
  position: integer('position').notNull().default(0),
})

// ───────────────────────── FINANZAS ─────────────────────────
export const financeCategories = pgTable('finance_categories', {
  id: text('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => authUsers.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  icon: text('icon').notNull().default('ShoppingBag'),
  color: text('color').notNull().default('#5aa6d2'),
  position: integer('position').notNull().default(0),
}, (t) => ({ byUser: index('finance_categories_user_idx').on(t.userId) }))

export const expenses = pgTable('expenses', {
  id: text('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => authUsers.id, { onDelete: 'cascade' }),
  categoryId: text('category_id').references(() => financeCategories.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  amount: integer('amount').notNull().default(0), // COP, negativo para gasto
  spentDate: date('spent_date').notNull(),
  createdAt: created(),
}, (t) => ({ byUser: index('expenses_user_idx').on(t.userId) }))

export const subscriptions = pgTable('subscriptions', {
  id: text('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => authUsers.id, { onDelete: 'cascade' }),
  categoryId: text('category_id').references(() => financeCategories.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  amount: integer('amount').notNull().default(0), // COP/mes
  nextCharge: date('next_charge'),
  createdAt: created(),
}, (t) => ({ byUser: index('subscriptions_user_idx').on(t.userId) }))

// ───────────────────────── MASCOTA (Hibi) ─────────────────────────
export const petState = pgTable('pet_state', {
  userId: integer('user_id').primaryKey().references(() => authUsers.id, { onDelete: 'cascade' }),
  energia: integer('energia').notNull().default(80),
  pancita: integer('pancita').notNull().default(82),
  carino: integer('carino').notNull().default(86),
  diversion: integer('diversion').notNull().default(80),
  coins: integer('coins').notNull().default(40),
  streak: integer('streak').notNull().default(1),
  sleeping: boolean('sleeping').notNull().default(false), // si se quedó dormida
  room: text('room').notNull().default('casa'),
  inventory: jsonb('inventory').$type<Record<string, number>>().notNull().default({}),
  lastCareDay: text('last_care_day').default(''),
  lastTick: timestamp('last_tick', { withTimezone: true }).defaultNow(),
  updatedAt: updated(),
})

// ───────────────────────── CHAT ─────────────────────────
export const chatConversations = pgTable('chat_conversations', {
  id: text('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => authUsers.id, { onDelete: 'cascade' }),
  title: text('title').notNull().default('Nueva conversación'),
  createdAt: created(),
  updatedAt: updated(),
}, (t) => ({ byUser: index('chat_conversations_user_idx').on(t.userId) }))

export const chatMessages = pgTable('chat_messages', {
  id: text('id').primaryKey(),
  conversationId: text('conversation_id').notNull().references(() => chatConversations.id, { onDelete: 'cascade' }),
  role: text('role').notNull(), // user | assistant
  text: text('text').notNull(),
  createdAt: created(),
}, (t) => ({ byConv: index('chat_messages_conv_idx').on(t.conversationId) }))

// ───────────────────────── SPOTIFY ─────────────────────────
// Una cuenta de Spotify conectada por usuario. El refresh_token vive solo en el
// servidor; el access_token se renueva y se entrega al cliente para el reproductor.
export const spotifyAccounts = pgTable('spotify_accounts', {
  userId: integer('user_id').primaryKey().references(() => authUsers.id, { onDelete: 'cascade' }),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  scope: text('scope').notNull().default(''),
  spotifyUserId: text('spotify_user_id'),
  displayName: text('display_name'),
  product: text('product'), // premium | free
  updatedAt: updated(),
})

// ───────────────────────── WEB PUSH ─────────────────────────
// Una fila por navegador/dispositivo suscrito (un usuario puede tener varias).
// endpoint+keys vienen tal cual del PushSubscription del navegador.
export const pushSubscriptions = pgTable('push_subscriptions', {
  id: text('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => authUsers.id, { onDelete: 'cascade' }),
  endpoint: text('endpoint').notNull().unique(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  createdAt: created(),
}, (t) => ({ byUser: index('push_subscriptions_user_idx').on(t.userId) }))
