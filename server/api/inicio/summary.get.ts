// Agregados del día para los widgets de Inicio. El cliente pasa su fecha
// local (?today=yyyy-MM-dd) para respetar su zona horaria.
import { and, eq, count } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const q = getQuery(event)
  const today = /^\d{4}-\d{2}-\d{2}$/.test(String(q.today || '')) ? String(q.today) : new Date().toISOString().slice(0, 10)
  const db = useDb()

  const [ev] = await db.select({ n: count() }).from(schema.events)
    .where(and(eq(schema.events.userId, userId), eq(schema.events.eventDate, today)))
  const [tkToday] = await db.select({ n: count() }).from(schema.tasks)
    .where(and(eq(schema.tasks.userId, userId), eq(schema.tasks.status, 'pending'), eq(schema.tasks.dueDate, today)))
  const [tkPending] = await db.select({ n: count() }).from(schema.tasks)
    .where(and(eq(schema.tasks.userId, userId), eq(schema.tasks.status, 'pending')))
  const [rm] = await db.select({ n: count() }).from(schema.reminders)
    .where(and(eq(schema.reminders.userId, userId), eq(schema.reminders.remindDate, today), eq(schema.reminders.done, false)))
  const [hb] = await db.select({ n: count() }).from(schema.habits).where(eq(schema.habits.userId, userId))
  const [hbDone] = await db.select({ n: count() }).from(schema.habitCompletions)
    .where(and(eq(schema.habitCompletions.userId, userId), eq(schema.habitCompletions.day, today)))
  const [jr] = await db.select({ mood: schema.journalEntries.mood }).from(schema.journalEntries)
    .where(and(eq(schema.journalEntries.userId, userId), eq(schema.journalEntries.entryDate, today))).limit(1)
  const [pet] = await db.select({ streak: schema.petState.streak }).from(schema.petState)
    .where(eq(schema.petState.userId, userId)).limit(1)

  return {
    todayEvents: ev?.n ?? 0,
    todayTasks: tkToday?.n ?? 0,
    pendingTasks: tkPending?.n ?? 0,
    reminders: rm?.n ?? 0,
    habitsDone: hbDone?.n ?? 0,
    habitsTotal: hb?.n ?? 0,
    mood: jr?.mood ?? null,
    streak: pet?.streak ?? 0,
  }
})
