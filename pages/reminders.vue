<script setup lang="ts">
import { Plus, BellRing, AlarmClock, Bell, Check, Clock, Layers, Volume2, FileText } from '@lucide/vue'

useHead({ title: 'Hibi — Recordatorios' })

interface Reminder { id: string; title: string; date: string; time?: string; group: 'Hoy' | 'Mañana' | 'Esta semana' | 'Más adelante'; alarm?: boolean; pre?: string; notes?: string; done?: boolean }
const today = new Date()
const iso = (d: Date) => d.toISOString().slice(0, 10)
const dPlus = (n: number) => { const x = new Date(today); x.setDate(x.getDate()+n); return iso(x) }
const remindersData = ref<Reminder[]>([
  { id: 'r1', title: 'Tomar la pastilla', date: iso(today), time: '14:00', group: 'Hoy', alarm: true, pre: '10 min antes' },
  { id: 'r2', title: 'Llamar a mamá', date: iso(today), time: '19:30', group: 'Hoy' },
  { id: 'r3', title: 'Yoga online', date: dPlus(1), time: '07:30', group: 'Mañana', pre: '15 min antes' },
  { id: 'r4', title: 'Reunión con Diego', date: dPlus(1), time: '11:00', group: 'Mañana' },
  { id: 'r5', title: 'Renovar el carnet', date: dPlus(4), time: '10:00', group: 'Esta semana' },
  { id: 'r6', title: 'Cumple de Lu', date: dPlus(5), group: 'Esta semana', alarm: true },
  { id: 'r7', title: 'Revisar suscripción Netflix', date: dPlus(8), group: 'Más adelante' },
])
function fmtWhen(r: Reminder) {
  try {
    const d = new Date(r.date)
    const dateStr = d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
    return r.time ? `${dateStr} · ${r.time}` : dateStr
  } catch { return r.date + (r.time ? ' ' + r.time : '') }
}
function toggleDone(r: Reminder) { r.done = !r.done }
const groups: Reminder['group'][] = ['Hoy', 'Mañana', 'Esta semana', 'Más adelante']
function inGroup(g: Reminder['group']) { return remindersData.value.filter(r => r.group === g) }

const view = ref<'list' | 'create'>('list')
const newTitle = ref('')
const newDate = ref(iso(today))
const newTime = ref('09:00')
const newGroup = ref<Reminder['group']>('Hoy')
const newAlarm = ref(false)
const newPre = ref('')
const newNotes = ref('')
const GROUP_OPTS = groups.map(g => ({ value: g, label: g }))
const PRE_OPTS = [
  { value: '', label: 'A la hora exacta' },
  { value: '5 min antes', label: '5 min antes' },
  { value: '10 min antes', label: '10 min antes' },
  { value: '15 min antes', label: '15 min antes' },
  { value: '30 min antes', label: '30 min antes' },
  { value: '1 hora antes', label: '1 hora antes' },
  { value: '1 día antes', label: '1 día antes' },
]
let nextId = 100
function openCreate() {
  newTitle.value = ''; newDate.value = iso(today); newTime.value = '09:00'; newGroup.value = 'Hoy'
  newAlarm.value = false; newPre.value = ''; newNotes.value = ''
  view.value = 'create'
}
function cancelCreate() { view.value = 'list' }
function saveReminder() {
  const t = newTitle.value.trim(); if (!t) return
  remindersData.value.unshift({
    id: 'r' + (nextId++), title: t, date: newDate.value, time: newTime.value,
    group: newGroup.value, alarm: newAlarm.value,
    pre: newPre.value || undefined,
    notes: newNotes.value || undefined,
  })
  view.value = 'list'
}
</script>

<template>
  <!-- VISTA DE CREACIÓN: clásica -->
  <AppCreateView v-if="view === 'create'"
    title="Nuevo recordatorio"
    subtitle="Para que no se te pase"
    :disabled="!newTitle.trim()"
    @close="cancelCreate" @save="saveReminder">
    <div class="flex flex-col gap-2">
      <label class="text-[12.5px] font-bold text-fg-muted px-1">¿Qué te recuerdo?</label>
      <input v-model="newTitle" type="text" placeholder="Tomar la pastilla, llamar a mamá…" autofocus
        class="w-full h-14 rounded-[14px] bg-card px-4 text-[18px] font-semibold text-fg outline-none placeholder:text-fg-subtle" />
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div class="flex flex-col gap-2">
        <label class="text-[12.5px] font-bold text-fg-muted px-1">Fecha</label>
        <AppDate v-model="newDate" />
      </div>
      <div class="flex flex-col gap-2">
        <label class="text-[12.5px] font-bold text-fg-muted px-1">Hora</label>
        <AppTime v-model="newTime" />
      </div>
      <div class="flex flex-col gap-2">
        <label class="text-[12.5px] font-bold text-fg-muted px-1">Alarma sonora</label>
        <div class="flex items-center gap-2.5 h-12 px-3 rounded-[12px] bg-card">
          <AppCheck v-model="newAlarm" label="Alarma sonora" />
          <span class="text-[13.5px] font-semibold text-fg cursor-pointer" @click="newAlarm = !newAlarm">{{ newAlarm ? 'Activada' : 'Desactivada' }}</span>
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-2">
      <label class="text-[12.5px] font-bold text-fg-muted px-1">Grupo</label>
      <div class="flex flex-wrap gap-1.5">
        <button v-for="g in groups" :key="g" type="button"
          class="hibi-chip bg-muted text-fg" :class="newGroup === g ? 'is-active' : ''"
          @click="newGroup = g">{{ g }}</button>
      </div>
    </div>

    <div class="flex flex-col gap-2">
      <label class="text-[12.5px] font-bold text-fg-muted px-1">Aviso previo</label>
      <div class="flex flex-wrap gap-1.5">
        <button v-for="o in PRE_OPTS" :key="o.value" type="button"
          class="hibi-chip bg-muted text-fg" :class="newPre === o.value ? 'is-active' : ''"
          @click="newPre = o.value">{{ o.label }}</button>
      </div>
    </div>

    <div class="flex flex-col gap-2 flex-1 min-h-[160px]">
      <label class="text-[12.5px] font-bold text-fg-muted px-1">Notas</label>
      <textarea v-model="newNotes" placeholder="Detalles, contexto…"
        class="w-full flex-1 min-h-[160px] rounded-[14px] bg-card px-4 py-3 text-[14.5px] text-fg outline-none resize-none"></textarea>
    </div>
  </AppCreateView>

  <!-- VISTA NORMAL -->
  <div v-else class="h-full w-full flex flex-col gap-3 px-4 md:px-7 py-5 overflow-hidden relative">
    <!-- Decoración cute -->
    <HibiCloud :size="150" float :duration="8" class="hidden md:block absolute -top-6 -right-8 text-mint opacity-15 pointer-events-none z-40" aria-hidden="true" />
    <HibiCloud :size="90"  float :duration="10" :delay="1.2" class="hidden md:block absolute bottom-6 -left-6 text-sky-soft opacity-15 pointer-events-none z-40" aria-hidden="true" />
    <HibiSparkle :size="18" twinkle :duration="2.4" class="hidden md:block absolute top-[16%] left-[8%] text-fg-subtle opacity-25 pointer-events-none z-40" />
    <HibiSparkle :size="14" twinkle :duration="3" :delay="0.8" class="hidden md:block absolute bottom-[28%] right-[10%] text-fg-subtle opacity-25 pointer-events-none z-40" />
    <HibiHeart :size="16" beat :duration="2.6" class="hidden md:block absolute top-[36%] right-[8%] text-fg-subtle opacity-25 pointer-events-none z-40" />

    <!-- Toolbar -->
    <div class="relative z-10">
      <PageHero :icon="BellRing" tone="peach" title="Recordatorios" :subtitle="`${remindersData.length} pendientes`">
        <template #actions>
          <AppButton variant="primary" size="sm" class="w-full md:w-auto" @click="openCreate"><template #icon><Plus class="size-[16px]" :stroke-width="2.3" /></template>Nuevo</AppButton>
        </template>
      </PageHero>
    </div>

    <!-- Timeline full ancho -->
    <AppCard class="relative z-10 flex-1 min-h-0 flex flex-col" :padded="false">
      <div class="flex-1 min-h-0 overflow-y-auto scroll-area px-5 md:px-8 py-5">
        <div class="w-full">
          <div v-for="(g, gi) in groups" :key="g" :class="gi > 0 ? 'mt-7' : ''">
            <div class="flex items-center justify-between mb-3 px-1">
              <h2 class="text-[15px] font-extrabold text-fg">{{ g }}</h2>
              <span class="text-[11.5px] text-fg-muted font-bold">{{ inGroup(g).length }}</span>
            </div>
            <!-- Grid: col 1 = 48px (línea + bolita centradas), col 2 = 1fr (contenido) -->
            <ul class="hibi-anim-float-down flex flex-col gap-3">
              <li v-for="r in inGroup(g)" :key="r.id"
                class="grid grid-cols-[72px_1fr] gap-3 items-center">
                <!-- Columna del marcador: la nube TAMBIÉN alterna hecho al tocarla -->
                <button type="button" class="relative flex items-center justify-center cursor-pointer"
                  :aria-label="r.done ? 'Marcar pendiente' : 'Marcar hecho'"
                  @click="toggleDone(r)">
                  <HibiCloudIcon
                    :size="72"
                    :icon="r.done ? Check : (r.alarm ? AlarmClock : Bell)"
                    :icon-size="20"
                    :cloud-color="r.done ? 'text-mint' : (r.alarm ? 'text-pink-soft' : 'text-sky-soft')"
                    :icon-color="r.done ? 'text-[#34936a]' : (r.alarm ? 'text-pink-deep' : 'text-sky-deep')"
                    :icon-stroke="r.done ? 2.6 : 2" />
                </button>
                <!-- Tarjeta — click en cualquier punto = toggle hecho -->
                <button type="button"
                  class="min-w-0 bg-muted rounded-[14px] p-3.5 md:p-4 flex items-center justify-between gap-3 text-left transition-[background-color,opacity] hover:bg-inset w-full"
                  :class="r.done ? 'opacity-60' : ''"
                  @click="toggleDone(r)">
                  <div class="min-w-0 flex-1">
                    <p class="text-[14.5px] font-bold text-fg break-words" :class="r.done ? 'line-through' : ''">{{ r.title }}</p>
                    <p class="text-[12.5px] text-fg-muted mt-0.5 break-words" :class="r.done ? 'line-through' : ''">
                      {{ fmtWhen(r) }}<span v-if="r.pre">, <span class="font-semibold">{{ r.pre }}</span></span>
                    </p>
                  </div>
                  <span class="shrink-0 relative inline-block" :style="{ width: '44px', height: '30px' }">
                    <Transition name="hibi-check">
                      <HibiCloudIcon
                        :key="r.done ? 'on' : 'off'"
                        :size="44"
                        :icon="Check"
                        :icon-size="16"
                        :cloud-color="r.done ? 'text-mint' : 'text-muted'"
                        :icon-color="r.done ? 'text-[#34936a]' : 'text-transparent'"
                        :icon-stroke="2.3"
                        class="absolute inset-0" />
                    </Transition>
                  </span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </AppCard>
  </div>
</template>
