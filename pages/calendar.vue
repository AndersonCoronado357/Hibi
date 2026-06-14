<script setup lang="ts">
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, format, isSameMonth, isSameDay, isToday, addMonths, subMonths,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, Calendar as Cal, Clock } from '@lucide/vue'

useHead({ title: 'Hibi — Calendario' })

const cursor = ref(new Date())
const view = ref<'day' | 'week' | 'month' | 'agenda'>('month')

const weekDays = computed(() => {
  const start = startOfWeek(cursor.value, { weekStartsOn: 1 })
  return Array.from({ length: 7 }, (_, i) => format(addDays(start, i), 'EEE', { locale: es }))
})
const days = computed(() => {
  const gridStart = startOfWeek(startOfMonth(cursor.value), { weekStartsOn: 1 })
  const gridEnd = endOfWeek(endOfMonth(cursor.value), { weekStartsOn: 1 })
  const out: Date[] = []; let d = gridStart
  while (d <= gridEnd) { out.push(d); d = addDays(d, 1) }
  return out
})

interface Event { id: string; title: string; date: Date; time?: string; tone: string }
const today = new Date()
const events: Event[] = [
  { id: 'e1', title: 'Café con María', date: today, time: '10:30', tone: 'bg-sky-soft text-sky-deep' },
  { id: 'e2', title: 'Stand-up equipo', date: today, time: '09:00', tone: 'bg-mint text-[#34936a]' },
  { id: 'e3', title: 'Compras semana', date: addDays(today, 1), time: '18:00', tone: 'bg-peach text-[#c5733f]' },
  { id: 'e4', title: 'Cumple de Lu', date: addDays(today, 3), tone: 'bg-pink-soft text-pink-deep' },
  { id: 'e5', title: 'Médico', date: addDays(today, 5), time: '16:15', tone: 'bg-lavender text-[#7a63c0]' },
  { id: 'e6', title: 'Yoga', date: addDays(today, 7), time: '07:30', tone: 'bg-mint text-[#34936a]' },
  { id: 'e7', title: 'Cena familia', date: addDays(today, 9), time: '21:00', tone: 'bg-sky-soft text-sky-deep' },
]
const eventsData = ref<Event[]>(events)
function eventsOn(d: Date) { return eventsData.value.filter(e => isSameDay(e.date, d)) }
const selected = ref(today)
const selectedEvents = computed(() => eventsOn(selected.value))
const monthLabel = computed(() => format(cursor.value, "MMMM yyyy", { locale: es }))

// Formulario inline
const creating = ref(false)
const newTitle = ref(''); const newDate = ref(format(today, 'yyyy-MM-dd')); const newTime = ref(''); const newTone = ref('bg-sky-soft text-sky-deep')
let nextId = 100
function startCreate() {
  creating.value = true
  newDate.value = format(selected.value, 'yyyy-MM-dd')
  nextTick(() => document.getElementById('new-event-title')?.focus())
}
function cancelCreate() { creating.value = false; newTitle.value = ''; newTime.value = '' }
function saveEvent() {
  const t = newTitle.value.trim(); if (!t) return
  const [y, m, d] = newDate.value.split('-').map(Number)
  eventsData.value.push({ id: 'e' + (nextId++), title: t, date: new Date(y!, m!-1, d!), time: newTime.value || undefined, tone: newTone.value })
  cancelCreate()
}
const TONES = [
  { v: 'bg-sky-soft text-sky-deep', label: 'Cielo' },
  { v: 'bg-mint text-[#34936a]', label: 'Menta' },
  { v: 'bg-peach text-[#c5733f]', label: 'Melocotón' },
  { v: 'bg-pink-soft text-pink-deep', label: 'Rosa' },
  { v: 'bg-lavender text-[#7a63c0]', label: 'Lavanda' },
]
</script>

<template>
  <div class="h-full flex flex-col gap-3 px-4 md:px-7 py-5">
    <!-- Toolbar card -->
    <AppCard class="shrink-0 !p-3 md:!p-4 flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-2.5">
        <span class="grid place-items-center size-10 rounded-[13px] bg-sky-soft text-sky-deep" aria-hidden="true"><Cal class="size-5" :stroke-width="1.9" /></span>
        <div>
          <h1 class="text-[20px] md:text-[22px] font-extrabold text-fg leading-tight capitalize">{{ monthLabel }}</h1>
          <p class="text-[12.5px] text-fg-muted leading-tight">{{ events.length }} eventos este mes</p>
        </div>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <div class="inline-flex items-center gap-1">
          <button class="grid place-items-center size-9 rounded-[11px] bg-muted text-fg-muted hover:text-fg" aria-label="Mes anterior" @click="cursor = subMonths(cursor, 1)"><ChevronLeft class="size-4" :stroke-width="2" /></button>
          <button class="h-9 px-3 rounded-[11px] bg-muted text-[13px] font-semibold text-fg-muted hover:text-fg" @click="cursor = new Date()">Hoy</button>
          <button class="grid place-items-center size-9 rounded-[11px] bg-muted text-fg-muted hover:text-fg" aria-label="Mes siguiente" @click="cursor = addMonths(cursor, 1)"><ChevronRight class="size-4" :stroke-width="2" /></button>
        </div>
        <AppSegmented v-model="view" :options="[
          { value: 'day', label: 'Día' }, { value: 'week', label: 'Semana' }, { value: 'month', label: 'Mes' }, { value: 'agenda', label: 'Agenda' },
        ]" />
        <AppButton variant="primary" size="sm" @click="startCreate"><template #icon><Plus class="size-[16px]" :stroke-width="2.3" /></template><span class="hidden sm:inline">Evento</span></AppButton>
      </div>
    </AppCard>

    <div class="flex-1 min-h-0 flex gap-3">
      <!-- Mes en card -->
      <AppCard class="flex-1 min-w-0 flex flex-col" :padded="false">
        <div class="grid grid-cols-7 gap-1 px-3 pt-3 shrink-0">
          <div v-for="d in weekDays" :key="d" class="text-center text-[11.5px] font-bold uppercase tracking-wide text-fg-subtle py-1.5">{{ d }}</div>
        </div>
        <div class="grid grid-cols-7 gap-1 flex-1 min-h-0 auto-rows-fr p-3">
          <button v-for="d in days" :key="d.toISOString()" type="button"
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
                :class="e.tone">{{ e.time ? e.time + ' · ' : '' }}{{ e.title }}</span>
              <span v-if="eventsOn(d).length > 2" class="text-[10px] text-fg-subtle font-semibold pl-1">+ {{ eventsOn(d).length - 2 }} más</span>
            </div>
          </button>
        </div>
      </AppCard>

      <!-- Sidebar del día -->
      <AppCard class="hidden lg:flex flex-col w-[300px] shrink-0 overflow-hidden" :padded="false">
        <header class="px-5 pt-5 pb-3 shrink-0">
          <p class="text-[12.5px] text-fg-muted font-semibold capitalize">{{ format(selected, "EEEE", { locale: es }) }}</p>
          <h3 class="text-[26px] font-extrabold text-fg leading-none mt-0.5">{{ format(selected, 'd') }} <span class="text-[15px] font-bold text-fg-muted">{{ format(selected, 'MMM', { locale: es }) }}</span></h3>
        </header>
        <div class="flex-1 min-h-0 overflow-y-auto scroll-area px-5 pb-5">
          <Transition name="inline-form">
            <form v-if="creating" aria-label="Nuevo evento" class="staggered bg-muted rounded-[14px] p-3 mb-3 flex flex-col gap-2" @submit.prevent="saveEvent" @keydown.escape="cancelCreate">
              <label for="new-event-title" class="sr-only">Título</label>
              <input id="new-event-title" v-model="newTitle" type="text" placeholder="Título del evento" class="w-full h-10 rounded-[10px] bg-card focus:bg-inset px-3 text-[14px] font-semibold text-fg outline-none" />
              <div class="grid grid-cols-2 gap-2">
                <input v-model="newDate" type="date" class="h-9 rounded-[10px] bg-card focus:bg-inset px-3 text-[12.5px] text-fg outline-none" />
                <input v-model="newTime" type="time" class="h-9 rounded-[10px] bg-card focus:bg-inset px-3 text-[12.5px] text-fg outline-none" />
              </div>
              <div class="flex items-center gap-1.5 flex-wrap">
                <button v-for="t in TONES" :key="t.v" type="button" :aria-label="t.label"
                  class="size-7 rounded-full grid place-items-center transition-[outline-width]"
                  :class="[t.v.split(' ')[0], newTone === t.v ? 'outline outline-2 outline-offset-2 outline-sky-deep' : '']"
                  @click="newTone = t.v"></button>
              </div>
              <div class="flex items-center justify-end gap-2">
                <button type="button" class="h-9 px-3.5 rounded-[10px] text-[13px] font-semibold text-fg-muted hover:bg-card" @click="cancelCreate">Cancelar</button>
                <button type="submit" :disabled="!newTitle.trim()" class="h-9 px-4 rounded-[10px] bg-sky text-[#1f4661] text-[13px] font-bold disabled:opacity-50">Crear</button>
              </div>
            </form>
          </Transition>
          <div v-if="selectedEvents.length === 0 && !creating" class="text-center py-8">
            <HibiCloud :size="64" face class="text-sky mx-auto opacity-70" />
            <p class="text-[13px] text-fg-muted mt-2">Sin eventos este día</p>
          </div>
          <ul v-else-if="selectedEvents.length" class="flex flex-col gap-2">
            <li v-for="e in selectedEvents" :key="e.id" class="flex items-start gap-3 p-3 rounded-[12px] bg-muted">
              <span class="grid place-items-center size-9 rounded-[11px] shrink-0" :class="e.tone" aria-hidden="true"><Clock class="size-[15px]" :stroke-width="2" /></span>
              <div class="flex-1 min-w-0">
                <p class="text-[14px] font-semibold text-fg truncate">{{ e.title }}</p>
                <p class="text-[12px] text-fg-muted">{{ e.time || 'Todo el día' }}</p>
              </div>
            </li>
          </ul>
        </div>
      </AppCard>
    </div>
  </div>
</template>
