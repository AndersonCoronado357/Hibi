<script setup lang="ts">
import { Plus, Repeat, Sunrise, Sun, Moon, Play, Check } from '@lucide/vue'

useHead({ title: 'Hibi — Rutinas' })

interface Step { title: string; mins: number; done?: boolean }
interface Routine { id: string; name: string; time: 'morning' | 'midday' | 'night'; minutes: number; days: string[]; steps: Step[] }
const routines: Routine[] = [
  { id: 'r1', name: 'Mañana clara', time: 'morning', minutes: 35, days: ['L','M','X','J','V'], steps: [
    { title: 'Agua + estiramiento', mins: 5, done: true }, { title: 'Meditación 10 min', mins: 10, done: true },
    { title: 'Ducha y vestir', mins: 10 }, { title: 'Desayuno sin pantalla', mins: 10 },
  ]},
  { id: 'r2', name: 'Comida + paseo', time: 'midday', minutes: 50, days: ['L','M','X','J','V','S','D'], steps: [
    { title: 'Almorzar tranquilo', mins: 25 }, { title: 'Paseo 20 min', mins: 20 }, { title: 'Café y revisar día', mins: 5 },
  ]},
  { id: 'r3', name: 'Noche calmada', time: 'night', minutes: 30, days: ['L','M','X','J','V','S','D'], steps: [
    { title: 'Cerrar pantallas', mins: 1 }, { title: 'Diario del día', mins: 10 },
    { title: 'Leer 15 min', mins: 15 }, { title: 'Apagar luces', mins: 1 },
  ]},
]
const ICONS = { morning: Sunrise, midday: Sun, night: Moon } as const
const TONES = { morning: 'bg-cream text-[#bf8f2e]', midday: 'bg-mint text-[#34936a]', night: 'bg-lavender text-[#7a63c0]' } as const
const LABELS = { morning: 'Mañana', midday: 'Mediodía', night: 'Noche' } as const

const routinesData = ref(routines)
const selectedId = ref<string>('r1')
const selected = computed(() => routinesData.value.find(r => r.id === selectedId.value)!)
const doneCount = (r: Routine) => r.steps.filter(s => s.done).length

const creating = ref(false)
const newName = ref(''); const newTime = ref<Routine['time']>('morning'); const newDays = ref<string[]>(['L','M','X','J','V'])
const DAYS = ['L','M','X','J','V','S','D']
let nextId = 100
function startCreate() { creating.value = true; nextTick(() => document.getElementById('new-rou-name')?.focus()) }
function cancelCreate() { creating.value = false; newName.value = '' }
function toggleDay(d: string) { newDays.value = newDays.value.includes(d) ? newDays.value.filter(x => x !== d) : [...newDays.value, d] }
function saveRoutine() {
  const n = newName.value.trim(); if (!n) return
  const id = 'r' + (nextId++)
  routinesData.value.push({ id, name: n, time: newTime.value, minutes: 0, days: [...newDays.value], steps: [] })
  selectedId.value = id
  cancelCreate()
}
</script>

<template>
  <div class="h-full flex flex-col gap-3 px-4 md:px-7 py-5">
    <AppCard class="shrink-0 !p-3 md:!p-4 flex items-center justify-between gap-3">
      <div class="flex items-center gap-2.5">
        <span class="grid place-items-center size-10 rounded-[13px] bg-mint text-[#34936a]" aria-hidden="true"><Repeat class="size-5" :stroke-width="1.9" /></span>
        <div>
          <h1 class="text-[20px] md:text-[22px] font-extrabold text-fg leading-tight">Rutinas</h1>
          <p class="text-[12.5px] text-fg-muted leading-tight">{{ routinesData.length }} rutinas</p>
        </div>
      </div>
      <AppButton variant="primary" size="sm" @click="startCreate"><template #icon><Plus class="size-[16px]" :stroke-width="2.3" /></template>Nueva</AppButton>
    </AppCard>

    <div class="flex-1 min-h-0 flex flex-col lg:flex-row gap-3 overflow-y-auto lg:overflow-hidden scroll-area">
      <!-- Lista -->
      <AppCard class="lg:w-[360px] shrink-0 flex flex-col" :padded="false">
        <h2 class="px-4 pt-4 pb-2 text-[13px] font-bold text-fg-muted">Tus rutinas</h2>
        <div class="flex-1 min-h-0 overflow-y-auto scroll-area px-2 pb-3 flex flex-col gap-1.5">
          <Transition name="inline-form">
            <form v-if="creating" aria-label="Nueva rutina" class="staggered bg-muted rounded-[14px] p-3 mx-1 mb-1 flex flex-col gap-2" @submit.prevent="saveRoutine" @keydown.escape="cancelCreate">
              <label for="new-rou-name" class="sr-only">Nombre</label>
              <input id="new-rou-name" v-model="newName" type="text" placeholder="Nombre de la rutina" class="w-full h-10 rounded-[10px] bg-card focus:bg-inset px-3 text-[14px] font-semibold text-fg outline-none" />
              <div class="flex items-center gap-1.5">
                <button v-for="(label, key) in LABELS" :key="key" type="button"
                  class="flex-1 grid place-items-center h-9 rounded-[10px] transition-[outline-width,background-color]"
                  :class="[TONES[key], newTime === key ? 'outline outline-2 outline-offset-2 outline-sky-deep' : '']"
                  @click="newTime = key as any">
                  <component :is="ICONS[key]" class="size-[16px]" :stroke-width="1.9" aria-hidden="true" />
                </button>
              </div>
              <div class="flex items-center gap-1 justify-center">
                <button v-for="d in DAYS" :key="d" type="button" :aria-label="d"
                  class="size-7 rounded-full text-[11px] font-bold transition-[background-color,color]"
                  :class="newDays.includes(d) ? 'bg-sky text-[#1f4661]' : 'bg-card text-fg-subtle hover:text-fg'"
                  @click="toggleDay(d)">{{ d }}</button>
              </div>
              <div class="flex items-center justify-end gap-2">
                <button type="button" class="h-8 px-3 rounded-[8px] text-[12.5px] font-semibold text-fg-muted hover:bg-card" @click="cancelCreate">Cancelar</button>
                <button type="submit" :disabled="!newName.trim()" class="h-8 px-3 rounded-[8px] bg-sky text-[#1f4661] text-[12.5px] font-bold disabled:opacity-50">Crear</button>
              </div>
            </form>
          </Transition>
          <button v-for="r in routinesData" :key="r.id" type="button"
            class="text-left p-3 rounded-[14px] transition-[background-color] flex items-start gap-3"
            :class="selectedId === r.id ? 'bg-sky-soft' : 'hover:bg-muted'"
            @click="selectedId = r.id"
          >
            <span class="grid place-items-center size-12 rounded-[14px]" :class="TONES[r.time]" aria-hidden="true"><component :is="ICONS[r.time]" class="size-[20px]" :stroke-width="1.9" /></span>
            <div class="flex-1 min-w-0">
              <p class="text-[15px] font-extrabold text-fg leading-tight">{{ r.name }}</p>
              <p class="text-[12.5px] text-fg-muted mt-0.5">{{ LABELS[r.time] }}, {{ r.minutes }} min, {{ r.steps.length }} pasos</p>
              <div class="flex items-center gap-0.5 mt-2">
                <span v-for="d in ['L','M','X','J','V','S','D']" :key="d" class="size-5 grid place-items-center rounded-full text-[10px] font-bold" :class="r.days.includes(d) ? 'bg-sky text-[#1f4661]' : 'bg-card text-fg-subtle'">{{ d }}</span>
              </div>
            </div>
          </button>
        </div>
      </AppCard>

      <!-- Modo ejecución -->
      <AppCard class="flex-1 min-w-0 flex flex-col">
        <div class="flex items-center justify-between gap-4 mb-4 shrink-0">
          <div>
            <h2 class="text-[22px] font-extrabold text-fg">{{ selected.name }}</h2>
            <p class="text-[13px] text-fg-muted">{{ doneCount(selected) }} de {{ selected.steps.length }} pasos, {{ selected.minutes }} min</p>
          </div>
          <button class="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-sky text-[#1f4661] font-bold text-[14px] hover:brightness-[0.96] transition-[filter]">
            <Play class="size-[16px]" :stroke-width="2.3" aria-hidden="true" />Empezar
          </button>
        </div>
        <ul class="flex flex-col gap-2 flex-1 min-h-0 overflow-y-auto scroll-area pr-1">
          <li v-for="(s, i) in selected.steps" :key="i" class="flex items-center gap-3 p-3 rounded-[12px] bg-muted">
            <span class="grid place-items-center size-8 rounded-full font-bold text-[13px]" :class="s.done ? 'bg-mint text-[#34936a]' : 'bg-card text-fg-muted'">
              <Check v-if="s.done" class="size-[15px]" :stroke-width="2.5" aria-hidden="true" />
              <template v-else>{{ i + 1 }}</template>
            </span>
            <p class="flex-1 text-[14px] font-semibold text-fg" :class="{ 'line-through opacity-50': s.done }">{{ s.title }}</p>
            <span class="text-[12.5px] font-bold text-fg-subtle">{{ s.mins }} min</span>
          </li>
        </ul>
      </AppCard>
    </div>
  </div>
</template>
