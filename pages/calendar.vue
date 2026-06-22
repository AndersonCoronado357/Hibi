<script setup lang="ts">
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, format, isSameDay,
  isSameMonth, isToday, addMonths, subMonths, addWeeks, subWeeks, addHours, isAfter,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, Calendar as Cal, Clock, Palette, FileText, Clock4, CalendarDays, CalendarRange, List } from '@lucide/vue'

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

// Movil: drill-down. Al tocar un dia del mes, mostramos su detalle dentro
// del mismo card (reemplaza el grid). Volver con la flecha.
const mobileDayDetail = ref(false)
function pickDay(d: Date) {
  selected.value = d
  if (typeof window !== 'undefined' && window.innerWidth < 768) {
    mobileDayDetail.value = true
  }
}
// Al cambiar de vista (mes → semana/dia/agenda), salir del detalle.
watch(() => view.value, () => { mobileDayDetail.value = false })

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
  if (s === null || e === null || e <= s) return 40
  // Min 40px para que titulo + hora nunca se corten
  return Math.max(40, (e - s) * (HOUR_H / 60) - 4)
}

// Eventos con hora (van en la timeline) vs de todo el dia (franja arriba)
function timedEventsOn(d: Date) { return eventsOn(d).filter(e => e.startTime) }
function allDayEventsOn(d: Date) { return eventsOn(d).filter(e => !e.startTime) }

const weekDaysArr = computed(() => {
  const s = startOfWeek(cursor.value, { weekStartsOn: 1 })
  return Array.from({ length: 7 }, (_, j) => addDays(s, j))
})
const weekAllDayCount = computed(() => weekDaysArr.value.reduce((n, d) => n + allDayEventsOn(d).length, 0))

// Auto-scroll de la timeline (dia/semana) a la primera hora con evento, o 07:00.
// Asi no abre en medianoche con horas vacias de madrugada.
const dayScrollRef = ref<HTMLElement | null>(null)
const weekScrollRef = ref<HTMLElement | null>(null)
function firstEventMinutes(days: Date[]): number {
  let min = Infinity
  for (const d of days) for (const e of timedEventsOn(d)) {
    const m = parseHm(e.startTime); if (m !== null && m < min) min = m
  }
  return min === Infinity ? 7 * 60 : min
}
function scrollTimeline() {
  nextTick(() => {
    if (view.value === 'day' && dayScrollRef.value) {
      const m = firstEventMinutes([cursor.value])
      dayScrollRef.value.scrollTop = Math.max(0, m * (HOUR_H / 60) - HOUR_H)
    } else if (view.value === 'week' && weekScrollRef.value) {
      const m = firstEventMinutes(weekDaysArr.value)
      weekScrollRef.value.scrollTop = Math.max(0, m * (HOUR_H / 60) - HOUR_H)
    }
  })
}
watch([view, cursor], scrollTimeline)
onMounted(scrollTimeline)

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
  { value: 'day',    label: 'Día',    icon: Clock4,         ariaLabel: 'Día' },
  { value: 'week',   label: 'Semana', icon: CalendarRange,  ariaLabel: 'Semana' },
  { value: 'month',  label: 'Mes',    icon: CalendarDays,   ariaLabel: 'Mes' },
  { value: 'agenda', label: 'Agenda', icon: List,           ariaLabel: 'Agenda' },
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
        class="w-full h-14 rounded-[14px] bg-card px-4 text-[18px] font-semibold text-fg outline-none placeholder:text-fg-subtle" />
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
  <div v-else class="h-full flex flex-col gap-2 md:gap-3 px-3 md:px-7 py-3 md:py-5 relative overflow-hidden">
    <HibiCloud :size="120" float :duration="7" class="hidden md:block absolute -top-4 -right-6 text-sky-soft opacity-15 pointer-events-none z-40" aria-hidden="true" />
    <HibiCloud :size="90" float :duration="9" :delay="1.4" class="hidden md:block absolute bottom-4 -left-6 text-lavender opacity-15 pointer-events-none z-40" aria-hidden="true" />
    <HibiSparkle :size="16" twinkle :duration="2.4" class="hidden md:block absolute top-[14%] left-[10%] text-fg-subtle opacity-25 pointer-events-none z-40" />
    <HibiSparkle :size="14" twinkle :duration="3" :delay="0.7" class="hidden md:block absolute top-[8%] right-[28%] text-fg-subtle opacity-25 pointer-events-none z-40" />
    <HibiHeart :size="14" beat :duration="2.6" class="hidden md:block absolute bottom-[22%] right-[6%] text-fg-subtle opacity-25 pointer-events-none z-40" />
    <div class="relative z-10">
      <PageHero :icon="Cal" tone="sky" :title="headerLabel" :subtitle="`${eventsData.length} eventos`">
        <template #actions>
          <!-- DESKTOP: barra rica con "Hoy" como boton aparte -->
          <div class="hidden md:flex items-center gap-2">
            <div class="inline-flex items-center gap-1">
              <button class="grid place-items-center size-9 rounded-[11px] bg-card text-sky-deep hover:bg-inset transition-[background-color]" aria-label="Anterior" @click="prev"><ChevronLeft class="size-4" :stroke-width="2" /></button>
              <button class="h-9 px-3 rounded-[11px] bg-card text-[13px] font-semibold text-sky-deep hover:bg-inset" @click="cursor = new Date()">Hoy</button>
              <button class="grid place-items-center size-9 rounded-[11px] bg-card text-sky-deep hover:bg-inset transition-[background-color]" aria-label="Siguiente" @click="next"><ChevronRight class="size-4" :stroke-width="2" /></button>
            </div>
            <AppSegmented v-model="view" :options="VIEW_OPTS" />
            <AppButton variant="primary" size="sm" @click="openCreate"><template #icon><Plus class="size-[16px]" :stroke-width="2.3" /></template>Evento</AppButton>
          </div>

          <!-- MOVIL: barra compacta que CABE en 343px sin scroll -->
          <div class="flex md:hidden items-center gap-1.5 w-full">
            <button class="grid place-items-center size-9 rounded-[11px] bg-card text-sky-deep shrink-0" aria-label="Anterior" @click="prev"><ChevronLeft class="size-4" :stroke-width="2" /></button>
            <button class="flex-1 h-9 px-2 rounded-[11px] bg-card text-[13px] font-bold text-sky-deep capitalize truncate" @click="cursor = new Date()">{{ format(cursor, 'MMM yy', { locale: es }) }}</button>
            <button class="grid place-items-center size-9 rounded-[11px] bg-card text-sky-deep shrink-0" aria-label="Siguiente" @click="next"><ChevronRight class="size-4" :stroke-width="2" /></button>
            <div class="inline-flex items-center gap-0.5 p-0.5 rounded-full bg-card shrink-0">
              <button v-for="opt in VIEW_OPTS" :key="String(opt.value)" type="button"
                :aria-label="opt.ariaLabel"
                :aria-selected="view === opt.value"
                class="grid place-items-center size-8 rounded-full transition-[background-color,color]"
                :class="view === opt.value ? 'bg-sky-soft text-sky-deep' : 'text-fg-subtle'"
                @click="view = opt.value as View">
                <component :is="opt.icon" class="size-[15px]" :stroke-width="2" />
              </button>
            </div>
            <button class="grid place-items-center size-9 rounded-full bg-sky text-[#1f4661] shrink-0" aria-label="Nuevo evento" @click="openCreate"><Plus class="size-[16px]" :stroke-width="2.3" /></button>
          </div>
        </template>
      </PageHero>
    </div>

    <div class="flex-1 min-h-0 flex gap-3">
      <!-- DÍA: 24h scroll interno -->
      <AppCard v-if="view === 'day'" class="flex-1 min-w-0 flex flex-col" :padded="false">
        <!-- Franja de eventos de TODO EL DÍA (sin hora) -->
        <div v-if="allDayEventsOn(cursor).length" class="shrink-0 border-b border-[var(--bg-muted)] px-3 md:px-4 py-2 flex flex-col gap-1.5">
          <div v-for="ev in allDayEventsOn(cursor)" :key="ev.id"
            class="flex items-center gap-2.5 px-3 py-2 rounded-[10px] min-w-0" :style="evStyle(ev)">
            <span class="size-2.5 rounded-full shrink-0" :style="{ background: ev.color }" aria-hidden="true" />
            <p class="flex-1 min-w-0 text-[13px] font-bold break-words">{{ ev.title }}</p>
            <span class="shrink-0 text-[11.5px] font-semibold opacity-80">Todo el día</span>
          </div>
        </div>
        <div ref="dayScrollRef" class="flex-1 min-h-0 overflow-y-auto scroll-area">
          <div class="relative" :style="{ height: HOURS.length * HOUR_H + 'px' }">
            <div v-for="h in HOURS" :key="h" class="absolute left-0 right-0 flex" :style="{ top: (h * HOUR_H) + 'px', height: HOUR_H + 'px' }">
              <span class="w-12 md:w-16 shrink-0 text-right pr-2 md:pr-3 pt-0.5 text-[10.5px] md:text-[11px] text-fg-subtle font-semibold tabular-nums">{{ String(h).padStart(2,'0') }}:00</span>
              <span class="flex-1 border-t border-[var(--bg-muted)]" />
            </div>
            <div class="absolute left-12 md:left-16 right-2 md:right-4 top-0 bottom-0">
              <div v-for="ev in timedEventsOn(cursor)" :key="ev.id"
                class="absolute left-0 right-0 rounded-[10px] px-2.5 md:px-3 py-1.5 md:py-2 text-[12px] md:text-[12.5px] font-semibold overflow-hidden flex items-start gap-2"
                :style="{ ...evStyle(ev), top: eventTop(ev) + 'px', height: eventHeight(ev) + 'px' }">
                <p class="flex-1 min-w-0 font-bold truncate">{{ ev.title }}</p>
                <span class="shrink-0 text-[11px] opacity-80 tabular-nums whitespace-nowrap">{{ ev.startTime }}{{ ev.endTime ? ' – ' + ev.endTime : '' }}</span>
              </div>
            </div>
          </div>
        </div>
      </AppCard>

      <!-- SEMANA -->
      <AppCard v-else-if="view === 'week'" class="flex-1 min-w-0 flex flex-col relative overflow-hidden" :padded="false">
        <!-- MOVIL: parecido al mes (header LMXJVSD + 7 celdas con numero +
             puntos). Tap a un dia abre el drill-down detalle. Sin scroll
             horizontal: solo vertical. -->
        <div class="md:hidden flex flex-col flex-1 min-h-0">
          <div class="grid grid-cols-7 gap-1 px-2 pt-2 shrink-0">
            <div v-for="d in weekDays" :key="d" class="text-center text-[11px] font-bold uppercase tracking-wide text-fg-subtle py-1.5">{{ d }}</div>
          </div>
          <div class="grid grid-cols-7 gap-1 shrink-0 p-2">
            <button v-for="(d, i) in (() => { const s = startOfWeek(cursor, { weekStartsOn: 1 }); return Array.from({length:7},(_,j)=>addDays(s,j)) })()" :key="i" type="button"
              class="day-cell flex flex-col items-center gap-1 p-2 min-h-[72px] rounded-[10px] transition-[background-color] text-left"
              :class="[
                isToday(d) ? 'bg-sky-soft' : 'bg-muted',
                isSameDay(d, selected) ? 'outline outline-2 outline-sky-deep' : '',
              ]"
              @click="pickDay(d)">
              <span class="text-[13px] font-bold size-7 grid place-items-center rounded-full"
                :class="isToday(d) ? 'bg-sky text-[#1f4661]' : ''">{{ format(d, 'd') }}</span>
              <div class="flex items-center justify-center gap-0.5 flex-wrap">
                <span v-for="e in eventsOn(d).slice(0, 4)" :key="e.id"
                  class="size-1.5 rounded-full shrink-0"
                  :style="{ background: e.color }" />
              </div>
            </button>
          </div>
          <!-- Debajo del grid: lista de eventos de la semana, scroll vertical -->
          <div class="flex-1 min-h-0 overflow-y-auto scroll-area px-3 pb-3 pt-1 border-t border-[var(--bg-muted)]">
            <div v-if="(() => { const s = startOfWeek(cursor, { weekStartsOn: 1 }); return Array.from({length:7},(_,j)=>addDays(s,j)).flatMap(eventsOn).length })() === 0" class="text-center text-fg-subtle italic text-[13px] py-8">Sin eventos esta semana</div>
            <ul v-else class="flex flex-col gap-4 pt-2">
              <li v-for="(d, i) in (() => { const s = startOfWeek(cursor, { weekStartsOn: 1 }); return Array.from({length:7},(_,j)=>addDays(s,j)) })().filter(d => eventsOn(d).length)" :key="i">
                <div class="grid grid-cols-[72px_1fr] gap-3 items-center">
                  <!-- Bloque de fecha (mismo que agenda) -->
                  <div class="text-center rounded-[14px] px-2 py-3" :class="isToday(d) ? 'bg-sky-soft' : 'bg-muted'">
                    <p class="text-[11px] uppercase font-bold tracking-wide" :class="isToday(d) ? 'text-sky-deep' : 'text-fg-muted'">{{ format(d, 'EEE', { locale: es }) }}</p>
                    <p class="text-[26px] font-extrabold leading-none tabular-nums mt-1" :class="isToday(d) ? 'text-sky-deep' : 'text-fg'">{{ format(d, 'd') }}</p>
                    <p class="text-[11px] font-bold capitalize mt-1" :class="isToday(d) ? 'text-sky-deep/80' : 'text-fg-muted'">{{ format(d, 'MMM', { locale: es }) }}</p>
                  </div>
                  <ul class="flex flex-col gap-1.5 w-full min-w-0">
                    <li v-for="ev in eventsOn(d)" :key="ev.id"
                      class="flex items-center gap-3 px-3.5 py-3 rounded-[14px] min-w-0"
                      :style="evStyle(ev)">
                      <span class="size-2.5 rounded-full shrink-0" :style="{ background: ev.color }" aria-hidden="true" />
                      <p class="flex-1 min-w-0 text-[14px] font-bold break-words">{{ ev.title }}</p>
                      <span class="shrink-0 text-[12px] font-semibold opacity-80 tabular-nums whitespace-nowrap">{{ ev.startTime ? ev.startTime : 'Todo el día' }}{{ ev.endTime ? ' – ' + ev.endTime : '' }}</span>
                    </li>
                  </ul>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <!-- DESKTOP: timeline 24h con 7 columnas -->
        <div class="hidden md:flex flex-col flex-1 min-h-0">
          <div class="grid grid-cols-[64px_repeat(7,1fr)] gap-0 border-b border-[var(--bg-muted)] bg-card z-10 shrink-0">
            <div />
            <div v-for="(d, i) in weekDaysArr" :key="i" class="text-center py-2">
              <p class="text-[10.5px] uppercase font-bold tracking-wide text-fg-subtle">{{ weekDays[i] }}</p>
              <p class="text-[15px] font-extrabold mt-0.5" :class="isToday(d) ? 'text-sky-deep' : 'text-fg'">{{ format(d, 'd') }}</p>
            </div>
          </div>
          <!-- Franja de eventos de TODO EL DÍA -->
          <div v-if="weekAllDayCount > 0" class="grid grid-cols-[64px_repeat(7,1fr)] border-b border-[var(--bg-muted)] bg-card shrink-0">
            <div class="flex items-center justify-end pr-3 text-[9.5px] text-fg-subtle font-bold uppercase tracking-wide">Todo el día</div>
            <div v-for="(d, i) in weekDaysArr" :key="i" class="px-1 py-1.5 flex flex-col gap-1 border-l border-[var(--bg-muted)] min-w-0">
              <span v-for="ev in allDayEventsOn(d)" :key="ev.id"
                class="text-[10px] font-bold px-1.5 py-0.5 rounded truncate"
                :style="evStyle(ev)">{{ ev.title }}</span>
            </div>
          </div>
          <div ref="weekScrollRef" class="flex-1 min-h-0 overflow-y-auto scroll-area">
            <div class="relative grid grid-cols-[64px_repeat(7,1fr)]" :style="{ height: HOURS.length * HOUR_H + 'px' }">
              <div class="relative">
                <span v-for="h in HOURS" :key="h" class="absolute right-3 text-[10.5px] text-fg-subtle font-semibold tabular-nums"
                  :style="{ top: (h * HOUR_H - 6) + 'px' }">{{ String(h).padStart(2,'0') }}</span>
              </div>
              <div v-for="(d, i) in weekDaysArr" :key="i" class="relative border-l border-[var(--bg-muted)]">
                <div v-for="h in HOURS" :key="h" class="absolute left-0 right-0 border-t border-[var(--bg-muted)]/60" :style="{ top: (h * HOUR_H) + 'px', height: HOUR_H + 'px' }" />
                <div v-for="ev in timedEventsOn(d)" :key="ev.id"
                  class="absolute left-1 right-1 rounded-[8px] px-2 py-1 text-[11px] font-bold overflow-hidden flex items-start gap-1.5"
                  :style="{ ...evStyle(ev), top: eventTop(ev) + 'px', height: eventHeight(ev) + 'px' }">
                  <p class="flex-1 min-w-0 truncate">{{ ev.title }}</p>
                  <span class="shrink-0 text-[10px] opacity-80 tabular-nums whitespace-nowrap">{{ ev.startTime }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- DRILL-DOWN MOVIL: panel del dia (mismo que en mes) -->
        <Transition name="hibi-drill">
          <div v-if="mobileDayDetail" class="md:hidden absolute inset-0 z-10 flex flex-col bg-card">
            <header class="shrink-0 flex items-center gap-2 px-3 pt-3 pb-2 border-b border-[var(--bg-muted)]">
              <button type="button" class="grid place-items-center size-9 rounded-full text-fg-muted hover:bg-muted" aria-label="Volver" @click="mobileDayDetail = false"><ChevronLeft class="size-[18px]" :stroke-width="2" /></button>
              <div class="flex-1 min-w-0">
                <p class="text-[11px] uppercase font-bold tracking-wide text-fg-subtle">{{ format(selected, 'EEEE', { locale: es }) }}</p>
                <h2 class="text-[16px] font-extrabold text-fg leading-tight capitalize">{{ format(selected, "d 'de' MMMM", { locale: es }) }}</h2>
              </div>
              <button type="button" class="grid place-items-center size-9 rounded-full bg-sky text-[#1f4661]" aria-label="Nuevo evento" @click="openCreate"><Plus class="size-[16px]" :stroke-width="2.3" /></button>
            </header>
            <div class="flex-1 min-h-0 overflow-y-auto scroll-area px-3 py-3">
              <div v-if="!selectedEvents.length" class="h-full flex flex-col items-center justify-center text-center text-fg-subtle gap-3">
                <HibiCloud :size="80" face class="text-sky-soft opacity-70" aria-hidden="true" />
                <p class="text-[14px] font-semibold">Sin eventos este día</p>
                <button type="button" class="text-[13px] font-bold text-sky-deep" @click="openCreate">Crear el primero</button>
              </div>
              <ul v-else class="flex flex-col gap-2">
                <li v-for="e in selectedEvents" :key="e.id"
                  class="flex items-center gap-3 px-3.5 py-3 rounded-[14px] min-w-0"
                  :style="evStyle(e)">
                  <span class="size-2.5 rounded-full shrink-0" :style="{ background: e.color }" aria-hidden="true" />
                  <p class="flex-1 min-w-0 text-[14px] font-bold break-words">{{ e.title }}</p>
                  <span class="shrink-0 text-[12px] font-semibold opacity-80 tabular-nums whitespace-nowrap">{{ e.startTime ? e.startTime : 'Todo el día' }}{{ e.endTime ? ' – ' + e.endTime : '' }}</span>
                </li>
              </ul>
            </div>
          </div>
        </Transition>
      </AppCard>

      <!-- MES -->
      <AppCard v-else-if="view === 'month'" class="flex-1 min-w-0 flex flex-col relative overflow-hidden" :padded="false">
        <!-- VISTA NORMAL DEL MES (siempre renderizada — el detalle se superpone en movil) -->
        <div class="flex flex-col flex-1 min-h-0">
          <div class="grid grid-cols-7 gap-1 px-2 md:px-3 pt-2 md:pt-3 shrink-0">
            <div v-for="d in weekDays" :key="d" class="text-center text-[11px] md:text-[11.5px] font-bold uppercase tracking-wide text-fg-subtle py-1.5">{{ d }}</div>
          </div>
          <div class="grid grid-cols-7 gap-1 flex-1 min-h-0 auto-rows-fr p-2 md:p-3">
            <button v-for="d in monthDays" :key="d.toISOString()" type="button"
              class="day-cell flex flex-col items-center md:items-stretch gap-1 md:gap-1.5 p-1 md:p-1.5 rounded-[10px] transition-[background-color] text-left"
              :class="[
                isSameMonth(d, cursor) ? 'bg-muted text-fg hover:bg-inset' : 'bg-card text-fg-subtle hover:bg-muted',
                isSameDay(d, selected) ? 'outline outline-2 outline-sky-deep' : '',
              ]"
              @click="pickDay(d)"
            >
              <span class="text-[12px] md:text-[12px] font-bold size-6 md:size-6 grid place-items-center rounded-full md:self-start"
                :class="isToday(d) ? 'bg-sky text-[#1f4661]' : ''">{{ format(d, 'd') }}</span>
              <!-- Movil: puntos de color (max 4) -->
              <div class="flex md:hidden items-center justify-center gap-0.5 flex-wrap">
                <span v-for="e in eventsOn(d).slice(0, 4)" :key="e.id"
                  class="size-1.5 rounded-full shrink-0"
                  :style="{ background: e.color }" />
              </div>
              <!-- Desktop: pildoras con texto (titulo izq, hora der) -->
              <div class="hidden md:flex flex-col gap-1 overflow-hidden">
                <span v-for="e in eventsOn(d).slice(0, 2)" :key="e.id"
                  class="text-[10.5px] font-semibold px-1.5 py-0.5 rounded flex items-center gap-1 min-w-0"
                  :style="evStyle(e)">
                  <span class="flex-1 min-w-0 truncate">{{ e.title }}</span>
                  <span v-if="e.startTime" class="shrink-0 tabular-nums opacity-80">{{ e.startTime }}</span>
                </span>
                <span v-if="eventsOn(d).length > 2" class="text-[10px] text-fg-subtle font-semibold pl-1">+ {{ eventsOn(d).length - 2 }} más</span>
              </div>
            </button>
          </div>
        </div>

        <!-- DRILL-DOWN MOVIL: panel del dia se superpone con slide desde la derecha -->
        <Transition name="hibi-drill">
          <div v-if="mobileDayDetail" class="md:hidden absolute inset-0 z-10 flex flex-col bg-card">
            <header class="shrink-0 flex items-center gap-2 px-3 pt-3 pb-2 border-b border-[var(--bg-muted)]">
              <button type="button" class="grid place-items-center size-9 rounded-full text-fg-muted hover:bg-muted" aria-label="Volver al mes" @click="mobileDayDetail = false"><ChevronLeft class="size-[18px]" :stroke-width="2" /></button>
              <div class="flex-1 min-w-0">
                <p class="text-[11px] uppercase font-bold tracking-wide text-fg-subtle">{{ format(selected, 'EEEE', { locale: es }) }}</p>
                <h2 class="text-[16px] font-extrabold text-fg leading-tight capitalize">{{ format(selected, "d 'de' MMMM", { locale: es }) }}</h2>
              </div>
              <button type="button" class="grid place-items-center size-9 rounded-full bg-sky text-[#1f4661]" aria-label="Nuevo evento" @click="openCreate"><Plus class="size-[16px]" :stroke-width="2.3" /></button>
            </header>
            <div class="flex-1 min-h-0 overflow-y-auto scroll-area px-3 py-3">
              <div v-if="!selectedEvents.length" class="h-full flex flex-col items-center justify-center text-center text-fg-subtle gap-3">
                <HibiCloud :size="80" face class="text-sky-soft opacity-70" aria-hidden="true" />
                <p class="text-[14px] font-semibold">Sin eventos este día</p>
                <button type="button" class="text-[13px] font-bold text-sky-deep" @click="openCreate">Crear el primero</button>
              </div>
              <ul v-else class="flex flex-col gap-2">
                <li v-for="e in selectedEvents" :key="e.id"
                  class="flex items-center gap-3 px-3.5 py-3 rounded-[14px] min-w-0"
                  :style="evStyle(e)">
                  <span class="size-2.5 rounded-full shrink-0" :style="{ background: e.color }" aria-hidden="true" />
                  <p class="flex-1 min-w-0 text-[14px] font-bold break-words">{{ e.title }}</p>
                  <span class="shrink-0 text-[12px] font-semibold opacity-80 tabular-nums whitespace-nowrap">{{ e.startTime ? e.startTime : 'Todo el día' }}{{ e.endTime ? ' – ' + e.endTime : '' }}</span>
                </li>
              </ul>
            </div>
          </div>
        </Transition>
      </AppCard>

      <!-- AGENDA: bloque de fecha a la izq (centrado vertical) + eventos en
           una linea (titulo izq / hora der). Ancho completo. -->
      <AppCard v-else class="flex-1 min-w-0 flex flex-col" :padded="false">
        <div class="flex-1 min-h-0 overflow-y-auto scroll-area px-4 md:px-8 py-4 md:py-5">
          <div v-if="!agendaDays.length" class="text-center text-fg-muted py-12">Nada por aquí.</div>
          <ul v-else class="flex flex-col gap-5 md:gap-6 w-full">
            <li v-for="g in agendaDays" :key="g.date.toISOString()">
              <div class="grid grid-cols-[72px_1fr] md:grid-cols-[88px_1fr] gap-3 md:gap-4 items-center">
                <!-- Día grande -->
                <div class="text-center bg-muted rounded-[14px] px-2 py-3">
                  <p class="text-[11px] uppercase font-bold tracking-wide text-fg-muted">{{ format(g.date, 'EEE', { locale: es }) }}</p>
                  <p class="text-[26px] md:text-[28px] font-extrabold text-fg leading-none tabular-nums mt-1">{{ format(g.date, 'd') }}</p>
                  <p class="text-[11px] font-bold text-fg-muted capitalize mt-1">{{ format(g.date, 'MMM', { locale: es }) }}</p>
                </div>
                <!-- Eventos: una linea, titulo izq + hora der, centrados verticalmente -->
                <ul class="flex flex-col gap-2 w-full min-w-0">
                  <li v-for="ev in g.events" :key="ev.id"
                    class="flex items-center gap-3 px-3.5 md:px-4 py-3 md:py-3.5 rounded-[14px] min-w-0"
                    :style="evStyle(ev)">
                    <span class="size-2.5 md:size-3 rounded-full shrink-0" :style="{ background: ev.color }" aria-hidden="true" />
                    <p class="flex-1 min-w-0 text-[14px] md:text-[15px] font-bold break-words">{{ ev.title }}</p>
                    <span class="shrink-0 text-[12px] md:text-[12.5px] font-semibold opacity-80 tabular-nums whitespace-nowrap">{{ ev.startTime ? ev.startTime : 'Todo el día' }}{{ ev.endTime ? ' – ' + ev.endTime : '' }}</span>
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
            <li v-for="e in selectedEvents" :key="e.id" class="flex items-center gap-3 p-3 rounded-[12px] bg-muted min-w-0">
              <span class="relative inline-block shrink-0" :style="{ width: '54px', height: '37px' }" aria-hidden="true">
                <HibiCloud :size="54" :body-opacity="0.25" :style="{ color: e.color || '#5aa6d2' }" class="absolute inset-0" />
                <Clock class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" :style="{ width: '16px', height: '16px', color: e.color || '#5aa6d2' }" :stroke-width="2" />
              </span>
              <p class="flex-1 min-w-0 text-[14px] font-semibold text-fg break-words">{{ e.title }}</p>
              <span class="shrink-0 text-[12px] text-fg-muted tabular-nums whitespace-nowrap">{{ e.startTime || 'Todo el día' }}{{ e.endTime ? ' – ' + e.endTime : '' }}</span>
            </li>
          </ul>
        </div>
      </AppCard>
    </div>
  </div>
</template>

<style scoped>
/* Drill-down movil: el detalle del dia se desliza desde la derecha y vuelve
   por la derecha al cerrarse. Suave, sin rebote. */
.hibi-drill-enter-active,
.hibi-drill-leave-active {
  transition: transform 280ms cubic-bezier(0.32, 0.72, 0, 1);
  will-change: transform;
}
.hibi-drill-enter-from {
  transform: translateX(100%);
}
.hibi-drill-leave-to {
  transform: translateX(100%);
}
@media (prefers-reduced-motion: reduce) {
  .hibi-drill-enter-active,
  .hibi-drill-leave-active {
    transition: none;
  }
}
</style>
