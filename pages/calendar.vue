<script setup lang="ts">
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, format, isSameDay,
  isSameMonth, isToday, addMonths, subMonths, addWeeks, subWeeks, addHours, isAfter,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, Calendar as Cal, Clock, Palette, FileText } from '@lucide/vue'

useHead({ title: 'Hibi — Calendario' })

const cursor = ref(new Date())
type View = 'day' | 'week' | 'month' | 'agenda' | 'create'
const view = ref<View>('month')
const today = new Date()

interface Event { id: string; title: string; date: Date; startTime?: string; endTime?: string; color: string }
const eventsData = ref<Event[]>([
  { id: 'e1', title: 'Café con María', date: today, startTime: '10:30', endTime: '11:30', color: '#5aa6d2' },
  { id: 'e2', title: 'Stand-up equipo', date: today, startTime: '09:00', endTime: '09:30', color: '#34936a' },
  { id: 'e3', title: 'Compras semana', date: addDays(today, 1), startTime: '18:00', endTime: '19:00', color: '#c5733f' },
  { id: 'e4', title: 'Cumple de Lu', date: addDays(today, 3), color: '#db8aa3' },
  { id: 'e5', title: 'Médico', date: addDays(today, 5), startTime: '16:15', endTime: '17:00', color: '#7a63c0' },
  { id: 'e6', title: 'Yoga', date: addDays(today, 7), startTime: '07:30', endTime: '08:30', color: '#34936a' },
  { id: 'e7', title: 'Cena familia', date: addDays(today, 9), startTime: '21:00', endTime: '23:00', color: '#5aa6d2' },
])
function evStyle(ev: Event) {
  return { background: ev.color + '22', color: ev.color }
}

function eventsOn(d: Date) { return eventsData.value.filter(e => isSameDay(e.date, d)) }
const selected = ref(today)
const selectedEvents = computed(() => eventsOn(selected.value))

const headerLabel = computed(() => {
  if (view.value === 'day') return format(cursor.value, "EEEE d 'de' MMMM yyyy", { locale: es })
  if (view.value === 'week') {
    const s = startOfWeek(cursor.value, { weekStartsOn: 1 })
    const e = endOfWeek(cursor.value, { weekStartsOn: 1 })
    return `${format(s, "d 'de' MMM", { locale: es })} a ${format(e, "d 'de' MMM yyyy", { locale: es })}`
  }
  return format(cursor.value, "MMMM yyyy", { locale: es })
})
function prev() {
  if (view.value === 'day') cursor.value = addDays(cursor.value, -1)
  else if (view.value === 'week') cursor.value = subWeeks(cursor.value, 1)
  else cursor.value = subMonths(cursor.value, 1)
}
function next() {
  if (view.value === 'day') cursor.value = addDays(cursor.value, 1)
  else if (view.value === 'week') cursor.value = addWeeks(cursor.value, 1)
  else cursor.value = addMonths(cursor.value, 1)
}

const weekDays = ['L','M','X','J','V','S','D']
const monthDays = computed(() => {
  // SIEMPRE 6 semanas (42 celdas) para evitar layout shift cuando un mes ocupa
  // 5 semanas y otro 6. Rellenamos el final con los primeros días del mes siguiente.
  const gs = startOfWeek(startOfMonth(cursor.value), { weekStartsOn: 1 })
  const out: Date[] = []
  for (let i = 0; i < 42; i++) out.push(addDays(gs, i))
  return out
})

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const HOUR_H = 48

function parseHm(t?: string): number | null {
  if (!t) return null
  const [h, m] = t.split(':').map(Number)
  if (Number.isNaN(h)) return null
  return h! * 60 + (m ?? 0)
}
function eventTop(ev: Event): number {
  const s = parseHm(ev.startTime); if (s === null) return 2
  return s * (HOUR_H / 60) + 2
}
function eventHeight(ev: Event): number {
  const s = parseHm(ev.startTime); const e = parseHm(ev.endTime)
  if (s === null || e === null || e <= s) return 38
  return Math.max(30, (e - s) * (HOUR_H / 60) - 4)
}

const agendaDays = computed(() => {
  const grouped: { date: Date; events: Event[] }[] = []
  const fut = eventsData.value
    .filter(e => isAfter(addHours(e.date, 24), today))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
  for (const ev of fut) {
    const last = grouped[grouped.length - 1]
    if (last && isSameDay(last.date, ev.date)) last.events.push(ev)
    else grouped.push({ date: ev.date, events: [ev] })
  }
  return grouped
})

// Vista de creación
const prevView = ref<View>('month')
const newTitle = ref('')
const newDate = ref(format(today, 'yyyy-MM-dd'))
const newStartTime = ref('09:00')
const newEndTime = ref('10:00')
const newAllDay = ref(false)
const newColor = ref('#5aa6d2')

let nextId = 100
function openCreate() {
  prevView.value = view.value === 'create' ? 'month' : view.value
  newTitle.value = ''
  newDate.value = format(selected.value, 'yyyy-MM-dd')
  newStartTime.value = '09:00'; newEndTime.value = '10:00'
  newAllDay.value = false
  newColor.value = '#5aa6d2'
  view.value = 'create'
}
function cancelCreate() { view.value = prevView.value }
function saveEvent() {
  const t = newTitle.value.trim(); if (!t) return
  const [y, m, d] = newDate.value.split('-').map(Number)
  eventsData.value.push({
    id: 'e' + (nextId++), title: t,
    date: new Date(y!, m!-1, d!),
    startTime: newAllDay.value ? undefined : newStartTime.value,
    endTime: newAllDay.value ? undefined : newEndTime.value,
    color: newColor.value,
  })
  view.value = prevView.value
}

const VIEW_OPTS = [
  { value: 'day', label: 'Día' }, { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' }, { value: 'agenda', label: 'Agenda' },
]
</script>

<template>
  <!-- VISTA DE CREACIÓN -->
  <AppCreateView v-if="view === 'create'"
    title="Nuevo evento"
    subtitle="Añade un compromiso al calendario"
    :disabled="!newTitle.trim()"
    @close="cancelCreate" @save="saveEvent">
    <div class="flex flex-col gap-2">
      <label class="text-[12.5px] font-bold text-fg-muted px-1">Título</label>
      <input v-model="newTitle" type="text" placeholder="¿Qué hay que hacer?" autofocus
        class="w-full h-14 rounded-[14px] bg-card focus:bg-muted px-4 text-[18px] font-semibold text-fg outline-none placeholder:text-fg-subtle" />
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div class="flex flex-col gap-2">
        <label class="text-[12.5px] font-bold text-fg-muted px-1">Fecha</label>
        <AppDate v-model="newDate" placeholder="Fecha" />
      </div>
      <div class="flex flex-col gap-2">
        <label class="text-[12.5px] font-bold text-fg-muted px-1">Empieza</label>
        <AppTime v-model="newStartTime" :disabled="newAllDay" />
      </div>
      <div class="flex flex-col gap-2">
        <label class="text-[12.5px] font-bold text-fg-muted px-1">Termina</label>
        <AppTime v-model="newEndTime" :disabled="newAllDay" />
      </div>
    </div>

    <div class="flex items-center gap-2.5">
      <AppCheck v-model="newAllDay" label="Todo el día" />
      <span class="text-[14px] font-semibold text-fg cursor-pointer" @click="newAllDay = !newAllDay">Todo el día</span>
    </div>

    <!-- COLOR PICKER FIJO -->
    <div class="flex flex-col gap-2 flex-1 min-h-0">
      <label class="text-[12.5px] font-bold text-fg-muted px-1 shrink-0">Color del evento</label>
      <div class="flex-1 min-h-0">
        <AppColorPicker v-model="newColor" format="hex" />
      </div>
    </div>
  </AppCreateView>

  <!-- VISTAS NORMALES -->
  <div v-else class="h-full flex flex-col gap-3 px-4 md:px-7 py-5 relative overflow-hidden">
    <HibiCloud :size="120" float :duration="7" class="hidden md:block absolute -top-4 -right-6 text-sky-soft opacity-15 pointer-events-none z-40" aria-hidden="true" />
    <HibiCloud :size="90" float :duration="9" :delay="1.4" class="hidden md:block absolute bottom-4 -left-6 text-lavender opacity-15 pointer-events-none z-40" aria-hidden="true" />
    <HibiSparkle :size="16" twinkle :duration="2.4" class="hidden md:block absolute top-[14%] left-[10%] text-fg-subtle opacity-25 pointer-events-none z-40" />
    <HibiSparkle :size="14" twinkle :duration="3" :delay="0.7" class="hidden md:block absolute top-[8%] right-[28%] text-fg-subtle opacity-25 pointer-events-none z-40" />
    <HibiHeart :size="14" beat :duration="2.6" class="hidden md:block absolute bottom-[22%] right-[6%] text-fg-subtle opacity-25 pointer-events-none z-40" />
    <div class="relative z-10">
      <PageHero :icon="Cal" tone="sky" :title="headerLabel" :subtitle="`${eventsData.length} eventos`">
        <template #actions>
          <div class="inline-flex items-center gap-1">
            <button class="grid place-items-center size-9 rounded-[11px] bg-card text-sky-deep hover:bg-inset transition-[background-color]" aria-label="Anterior" @click="prev"><ChevronLeft class="size-4" :stroke-width="2" /></button>
            <button class="h-9 px-3 rounded-[11px] bg-card text-[13px] font-semibold text-sky-deep hover:bg-inset" @click="cursor = new Date()">Hoy</button>
            <button class="grid place-items-center size-9 rounded-[11px] bg-card text-sky-deep hover:bg-inset transition-[background-color]" aria-label="Siguiente" @click="next"><ChevronRight class="size-4" :stroke-width="2" /></button>
          </div>
          <AppSegmented v-model="view" :options="VIEW_OPTS" />
          <AppButton variant="primary" size="sm" @click="openCreate"><template #icon><Plus class="size-[16px]" :stroke-width="2.3" /></template><span class="hidden sm:inline">Evento</span></AppButton>
        </template>
      </PageHero>
    </div>

    <div class="flex-1 min-h-0 flex gap-3">
      <!-- DÍA: 24h scroll interno -->
      <AppCard v-if="view === 'day'" class="flex-1 min-w-0 flex flex-col" :padded="false">
        <div class="flex-1 min-h-0 overflow-y-auto scroll-area">
          <div class="relative" :style="{ height: HOURS.length * HOUR_H + 'px' }">
            <div v-for="h in HOURS" :key="h" class="absolute left-0 right-0 flex" :style="{ top: (h * HOUR_H) + 'px', height: HOUR_H + 'px' }">
              <span class="w-16 shrink-0 text-right pr-3 pt-0.5 text-[11px] text-fg-subtle font-semibold tabular-nums">{{ String(h).padStart(2,'0') }}:00</span>
              <span class="flex-1 border-t border-[var(--bg-muted)]" />
            </div>
            <div class="absolute left-16 right-4 top-0 bottom-0">
              <div v-for="ev in eventsOn(cursor)" :key="ev.id"
                class="absolute left-0 right-0 rounded-[10px] px-3 py-2 text-[12.5px] font-semibold overflow-hidden"
                :style="{ ...evStyle(ev), top: eventTop(ev) + 'px', height: eventHeight(ev) + 'px' }">
                <p class="font-bold truncate">{{ ev.title }}</p>
                <p v-if="ev.startTime" class="text-[11px] opacity-80 truncate">{{ ev.startTime }}{{ ev.endTime ? ' – ' + ev.endTime : '' }}</p>
              </div>
            </div>
          </div>
        </div>
      </AppCard>

      <!-- SEMANA: 24h scroll interno -->
      <AppCard v-else-if="view === 'week'" class="flex-1 min-w-0 flex flex-col" :padded="false">
        <div class="grid grid-cols-[64px_repeat(7,1fr)] gap-0 border-b border-[var(--bg-muted)] sticky top-0 bg-card z-10">
          <div />
          <div v-for="(d, i) in (() => { const s = startOfWeek(cursor, { weekStartsOn: 1 }); return Array.from({length:7},(_,j)=>addDays(s,j)) })()" :key="i" class="text-center py-2">
            <p class="text-[10.5px] uppercase font-bold tracking-wide text-fg-subtle">{{ weekDays[i] }}</p>
            <p class="text-[15px] font-extrabold mt-0.5" :class="isToday(d) ? 'text-sky-deep' : 'text-fg'">{{ format(d, 'd') }}</p>
          </div>
        </div>
        <div class="flex-1 min-h-0 overflow-y-auto scroll-area">
          <div class="relative grid grid-cols-[64px_repeat(7,1fr)]" :style="{ height: HOURS.length * HOUR_H + 'px' }">
            <div class="relative">
              <span v-for="h in HOURS" :key="h" class="absolute right-3 text-[10.5px] text-fg-subtle font-semibold tabular-nums"
                :style="{ top: (h * HOUR_H - 6) + 'px' }">{{ String(h).padStart(2,'0') }}</span>
            </div>
            <div v-for="(d, i) in (() => { const s = startOfWeek(cursor, { weekStartsOn: 1 }); return Array.from({length:7},(_,j)=>addDays(s,j)) })()" :key="i" class="relative border-l border-[var(--bg-muted)]">
              <div v-for="h in HOURS" :key="h" class="absolute left-0 right-0 border-t border-[var(--bg-muted)]/60" :style="{ top: (h * HOUR_H) + 'px', height: HOUR_H + 'px' }" />
              <div v-for="ev in eventsOn(d)" :key="ev.id"
                class="absolute left-1 right-1 rounded-[8px] px-2 py-1 text-[11px] font-bold overflow-hidden"
                :style="{ ...evStyle(ev), top: eventTop(ev) + 'px', height: eventHeight(ev) + 'px' }">
                <p class="truncate">{{ ev.title }}</p>
                <p v-if="ev.startTime" class="text-[10px] opacity-80 truncate">{{ ev.startTime }}</p>
              </div>
            </div>
          </div>
        </div>
      </AppCard>

      <!-- MES -->
      <AppCard v-else-if="view === 'month'" class="flex-1 min-w-0 flex flex-col" :padded="false">
        <div class="grid grid-cols-7 gap-1 px-3 pt-3 shrink-0">
          <div v-for="d in weekDays" :key="d" class="text-center text-[11.5px] font-bold uppercase tracking-wide text-fg-subtle py-1.5">{{ d }}</div>
        </div>
        <div class="grid grid-cols-7 gap-1 flex-1 min-h-0 auto-rows-fr p-3">
          <button v-for="d in monthDays" :key="d.toISOString()" type="button"
            class="day-cell flex flex-col items-stretch gap-1 p-1.5 rounded-[10px] transition-[background-color] text-left"
            :class="[
              isSameMonth(d, cursor) ? 'bg-muted text-fg hover:bg-inset' : 'bg-card text-fg-subtle hover:bg-muted',
              isSameDay(d, selected) ? 'outline outline-2 outline-sky-deep' : '',
            ]"
            @click="selected = d"
          >
            <span class="self-start text-[12px] font-bold size-6 grid place-items-center rounded-full"
              :class="isToday(d) ? 'bg-sky text-[#1f4661]' : ''">{{ format(d, 'd') }}</span>
            <div class="flex flex-col gap-1 overflow-hidden">
              <span v-for="e in eventsOn(d).slice(0, 2)" :key="e.id"
                class="text-[10.5px] font-semibold px-1.5 py-0.5 rounded truncate"
                :style="evStyle(e)">{{ e.startTime ? e.startTime + ' · ' : '' }}{{ e.title }}</span>
              <span v-if="eventsOn(d).length > 2" class="text-[10px] text-fg-subtle font-semibold pl-1">+ {{ eventsOn(d).length - 2 }} más</span>
            </div>
          </button>
        </div>
      </AppCard>

      <!-- AGENDA: full ancho -->
      <AppCard v-else class="flex-1 min-w-0 flex flex-col" :padded="false">
        <div class="flex-1 min-h-0 overflow-y-auto scroll-area px-5 md:px-8 py-5">
          <div v-if="!agendaDays.length" class="text-center text-fg-muted py-12">Nada por aquí.</div>
          <ul v-else class="flex flex-col gap-6 w-full">
            <li v-for="g in agendaDays" :key="g.date.toISOString()">
              <div class="grid grid-cols-[88px_1fr] gap-4 items-start">
                <!-- Día grande -->
                <div class="text-center bg-muted rounded-[14px] px-2 py-3">
                  <p class="text-[11px] uppercase font-bold tracking-wide text-fg-muted">{{ format(g.date, 'EEE', { locale: es }) }}</p>
                  <p class="text-[28px] font-extrabold text-fg leading-none tabular-nums mt-1">{{ format(g.date, 'd') }}</p>
                  <p class="text-[11px] font-bold text-fg-muted capitalize mt-1">{{ format(g.date, 'MMM', { locale: es }) }}</p>
                </div>
                <!-- Eventos full ancho -->
                <ul class="flex flex-col gap-2 w-full">
                  <li v-for="ev in g.events" :key="ev.id"
                    class="flex items-center gap-3 p-4 rounded-[14px]"
                    :style="evStyle(ev)">
                    <span class="size-3 rounded-full shrink-0" :style="{ background: ev.color }" aria-hidden="true" />
                    <div class="flex-1 min-w-0">
                      <p class="text-[15px] font-bold truncate">{{ ev.title }}</p>
                      <p class="text-[12.5px] font-semibold opacity-80">
                        {{ ev.startTime ? ev.startTime : 'Todo el día' }}{{ ev.endTime ? ' – ' + ev.endTime : '' }}
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </li>
          </ul>
        </div>
      </AppCard>

      <!-- Sidebar del día (solo en MES) -->
      <AppCard v-if="view === 'month'" class="hidden lg:flex flex-col w-[300px] shrink-0 overflow-hidden" :padded="false">
        <header class="px-5 pt-5 pb-3 shrink-0">
          <p class="text-[12.5px] text-fg-muted font-semibold capitalize">{{ format(selected, "EEEE", { locale: es }) }}</p>
          <h3 class="text-[26px] font-extrabold text-fg leading-none mt-0.5">{{ format(selected, 'd') }} <span class="text-[15px] font-bold text-fg-muted">{{ format(selected, 'MMM', { locale: es }) }}</span></h3>
        </header>
        <div class="flex-1 min-h-0 overflow-y-auto scroll-area px-5 pb-5">
          <div v-if="selectedEvents.length === 0" class="text-center py-8 text-[13px] text-fg-muted">
            Sin eventos este día
          </div>
          <ul v-else class="flex flex-col gap-2">
            <li v-for="e in selectedEvents" :key="e.id" class="flex items-start gap-3 p-3 rounded-[12px] bg-muted">
              <span class="relative inline-block shrink-0" :style="{ width: '54px', height: '37px' }" aria-hidden="true">
                <HibiCloud :size="54" :body-opacity="0.25" :style="{ color: e.color || '#5aa6d2' }" class="absolute inset-0" />
                <Clock class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" :style="{ width: '16px', height: '16px', color: e.color || '#5aa6d2' }" :stroke-width="2" />
              </span>
              <div class="flex-1 min-w-0">
                <p class="text-[14px] font-semibold text-fg truncate">{{ e.title }}</p>
                <p class="text-[12px] text-fg-muted">{{ e.startTime || 'Todo el día' }}{{ e.endTime ? ' – ' + e.endTime : '' }}</p>
              </div>
            </li>
          </ul>
        </div>
      </AppCard>
    </div>
  </div>
</template>
