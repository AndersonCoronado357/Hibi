<script setup lang="ts">
import { Plus, Repeat, Sunrise, Sun, Moon, Play, Check, Trash2, ArrowUp, ArrowDown, X, Calendar, ListPlus, FileText, GripVertical } from '@lucide/vue'

useHead({ title: 'Hibi — Rutinas' })

interface Step { title: string; mins: number; done?: boolean; substeps?: { title: string; done?: boolean }[] }
interface Routine { id: string; name: string; time: 'morning' | 'midday' | 'night'; minutes: number; days: string[]; steps: Step[] }
const routines: Routine[] = [
  { id: 'r1', name: 'Mañana clara', time: 'morning', minutes: 35, days: ['L','M','X','J','V'], steps: [
    { title: 'Agua + estiramiento', mins: 5, done: true, substeps: [
      { title: 'Un vaso de agua tibia con limón', done: true },
      { title: 'Estirar cuello y hombros' },
      { title: '5 saludos al sol' },
    ]},
    { title: 'Meditación 10 min', mins: 10, done: true },
    { title: 'Ducha y vestir', mins: 10 },
    { title: 'Desayuno sin pantalla', mins: 10, substeps: [
      { title: 'Café o té' },
      { title: 'Tostadas o yogur' },
    ]},
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

// Switch hoy/todas
type RoutineFilter = 'today' | 'all'
const filter = ref<RoutineFilter>('today')
const TODAY_LETTER = ['D','L','M','X','J','V','S'][new Date().getDay()]!
const visibleRoutines = computed(() => {
  if (filter.value === 'all') return routinesData.value
  return routinesData.value.filter(r => r.days.includes(TODAY_LETTER))
})

// Drag and drop de pasos en el detalle
const dragStepIdx = ref<number | null>(null)
function onStepDragStart(e: DragEvent, i: number) {
  dragStepIdx.value = i
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(i))
  }
}
function onStepDragOver(e: DragEvent) { e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = 'move' }
// DnD también en creación
const dragNewStepIdx = ref<number | null>(null)
function onNewStepDragStart(e: DragEvent, i: number) {
  dragNewStepIdx.value = i
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
  }
}
function onNewStepDrop(toIdx: number) {
  const from = dragNewStepIdx.value
  if (from === null || from === toIdx) { dragNewStepIdx.value = null; return }
  const item = newSteps.value.splice(from, 1)[0]!
  newSteps.value.splice(toIdx, 0, item)
  dragNewStepIdx.value = null
}

function onStepDrop(toIdx: number) {
  const from = dragStepIdx.value
  if (from === null || from === toIdx) { dragStepIdx.value = null; return }
  const arr = selected.value.steps
  const item = arr.splice(from, 1)[0]!
  arr.splice(toIdx, 0, item)
  dragStepIdx.value = null
}

const view = ref<'list' | 'create'>('list')
const newName = ref('')
const newTime = ref<Routine['time']>('morning')
const newDays = ref<string[]>(['L','M','X','J','V'])
const newSteps = ref<Step[]>([])
const newStepTitle = ref('')
const newStepMins = ref<number>(5)
const newNotes = ref('')
const DAYS = ['L','M','X','J','V','S','D']
const TIME_SWATCHES = [
  { value: 'morning', label: 'Mañana', swatch: 'bg-cream' },
  { value: 'midday',  label: 'Mediodía', swatch: 'bg-mint' },
  { value: 'night',   label: 'Noche', swatch: 'bg-lavender' },
]
let nextId = 100
function openCreate() {
  newName.value = ''; newTime.value = 'morning'
  newDays.value = ['L','M','X','J','V']
  newSteps.value = []; newStepTitle.value = ''; newStepMins.value = 5
  newNotes.value = ''
  view.value = 'create'
}
function cancelCreate() { view.value = 'list' }
function toggleDay(d: string) { newDays.value = newDays.value.includes(d) ? newDays.value.filter(x => x !== d) : [...newDays.value, d] }

function addNewStep() {
  const t = newStepTitle.value.trim(); if (!t) return
  newSteps.value.push({ title: t, mins: Math.max(1, Math.min(120, Number(newStepMins.value) || 5)) })
  newStepTitle.value = ''; newStepMins.value = 5
}
function removeNewStep(i: number) { newSteps.value.splice(i, 1) }
function moveStep(arr: Step[], i: number, dir: -1 | 1) {
  const j = i + dir; if (j < 0 || j >= arr.length) return
  const tmp = arr[i]!; arr[i] = arr[j]!; arr[j] = tmp
}

function saveRoutine() {
  const n = newName.value.trim(); if (!n) return
  const id = 'r' + (nextId++)
  const steps = newSteps.value.map(s => ({ ...s }))
  const minutes = steps.reduce((a, s) => a + s.mins, 0)
  routinesData.value.push({ id, name: n, time: newTime.value, minutes, days: [...newDays.value], steps })
  selectedId.value = id
  view.value = 'list'
}

// Modo ejecución (detalle)
const detailStepTitle = ref('')
const detailStepMins = ref<number>(5)
function addStepToSelected() {
  const t = detailStepTitle.value.trim(); if (!t) return
  selected.value.steps.push({ title: t, mins: Math.max(1, Math.min(120, Number(detailStepMins.value) || 5)) })
  selected.value.minutes = selected.value.steps.reduce((a, s) => a + s.mins, 0)
  detailStepTitle.value = ''; detailStepMins.value = 5
}
function toggleStep(s: Step) { s.done = !s.done }
function removeStepAt(i: number) {
  selected.value.steps.splice(i, 1)
  selected.value.minutes = selected.value.steps.reduce((a, s) => a + s.mins, 0)
}
function moveSelectedStep(i: number, dir: -1 | 1) { moveStep(selected.value.steps, i, dir) }
function playRoutine() {
  selected.value.steps.forEach(s => s.done = false)
}
</script>

<template>
  <!-- VISTA DE CREACIÓN -->
  <AppCreateView v-if="view === 'create'"
    title="Nueva rutina"
    subtitle="Una secuencia de pasos para tu día"
    :disabled="!newName.trim()"
    @close="cancelCreate" @save="saveRoutine">
    <div class="flex flex-col gap-2">
      <label class="text-[12.5px] font-bold text-fg-muted px-1">Nombre</label>
      <input v-model="newName" type="text" placeholder="Mañana clara, noche calmada…" autofocus
        class="w-full h-14 rounded-[14px] bg-card focus:bg-muted px-4 text-[18px] font-semibold text-fg outline-none placeholder:text-fg-subtle" />
    </div>
    <!-- Momento + días en una sola fila -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div class="flex flex-col gap-2">
        <label class="text-[12.5px] font-bold text-fg-muted px-1">Momento</label>
        <div class="flex items-center gap-1.5 flex-wrap">
          <button v-for="t in TIME_SWATCHES" :key="t.value" type="button"
            class="hibi-chip text-fg" :class="[t.swatch, newTime === t.value ? 'is-active' : '']"
            @click="newTime = t.value as any">
            <component :is="t.value === 'morning' ? Sunrise : t.value === 'midday' ? Sun : Moon" class="size-[16px]" :stroke-width="1.9" />
            {{ t.label }}
          </button>
        </div>
      </div>
      <div class="flex flex-col gap-2">
        <label class="text-[12.5px] font-bold text-fg-muted px-1">Días</label>
        <div class="flex items-center gap-1.5 flex-wrap">
          <button v-for="d in DAYS" :key="d" type="button" :aria-label="d"
            class="size-10 rounded-full text-[13px] font-bold transition-[background-color,color]"
            :class="newDays.includes(d) ? 'bg-sky text-[#1f4661]' : 'bg-card text-fg-muted hover:text-fg'"
            @click="toggleDay(d)">{{ d }}</button>
        </div>
      </div>
    </div>
    <div class="flex flex-col gap-2">
      <label class="text-[12.5px] font-bold text-fg-muted px-1">Pasos</label>
      <ul v-if="newSteps.length" class="flex flex-col gap-2 mb-2">
        <li v-for="(s, i) in newSteps" :key="i"
          draggable="true"
          class="flex items-center gap-2 bg-muted rounded-[12px] p-2.5 cursor-grab active:cursor-grabbing transition-[opacity]"
          :class="dragNewStepIdx === i ? 'opacity-40' : ''"
          @dragstart="onNewStepDragStart($event, i)"
          @dragover.prevent
          @drop="onNewStepDrop(i)">
          <span class="grid place-items-center size-7 text-fg-subtle shrink-0" aria-label="Arrastrar"><GripVertical class="size-4" :stroke-width="2" /></span>
          <span class="grid place-items-center size-9 rounded-[10px] bg-card text-sky-deep font-bold text-[14px] shrink-0">{{ i + 1 }}</span>
          <input v-model="s.title" type="text" class="flex-1 h-10 rounded-[10px] bg-card focus:bg-inset px-3 text-[14px] font-semibold text-fg outline-none" />
          <input v-model.number="s.mins" type="number" min="1" max="120" class="h-10 w-16 rounded-[10px] bg-card focus:bg-inset px-2 text-center text-[13px] text-fg outline-none tabular-nums" />
          <span class="text-[11.5px] text-fg-muted">min</span>
          <button type="button" class="grid place-items-center size-9 rounded-[10px] text-fg-subtle hover:text-pink-deep hover:bg-pink-soft" aria-label="Eliminar" @click="removeNewStep(i)"><Trash2 class="size-4" :stroke-width="2" /></button>
        </li>
      </ul>
      <!-- Añadir paso nuevo -->
      <div class="flex items-center gap-2 bg-muted rounded-[12px] p-2.5">
        <span class="grid place-items-center size-9 rounded-[10px] bg-card text-fg-subtle"><Plus class="size-4" :stroke-width="2.2" /></span>
        <input v-model="newStepTitle" type="text" placeholder="Nombre del paso" class="flex-1 h-10 rounded-[10px] bg-card focus:bg-inset px-3 text-[14px] font-semibold text-fg outline-none"
          @keydown.enter.prevent="addNewStep" />
        <input v-model.number="newStepMins" type="number" min="1" max="120" class="h-10 w-20 rounded-[10px] bg-card focus:bg-inset px-2 text-[13px] text-fg outline-none tabular-nums" />
        <span class="text-[11.5px] text-fg-muted">min</span>
        <button type="button" class="inline-flex items-center gap-1 h-10 px-3 rounded-[10px] bg-sky text-[#1f4661] hover:bg-sky-deep hover:text-white font-bold text-[13px]" @click="addNewStep">
          <Plus class="size-[14px]" :stroke-width="2.4" />Añadir
        </button>
      </div>
      <p v-if="newSteps.length" class="text-[11.5px] text-fg-muted px-1 tabular-nums mt-1.5">Total: {{ newSteps.reduce((a,s)=>a+s.mins,0) }} min</p>
    </div>
  </AppCreateView>

  <div v-else class="h-full w-full flex flex-col gap-3 px-4 md:px-7 py-5 overflow-hidden relative">
    <!-- Decoración cute -->
    <HibiCloud :size="150" float :duration="8" class="hidden md:block absolute -top-6 -right-8 text-mint opacity-15 pointer-events-none z-40" aria-hidden="true" />
    <HibiCloud :size="90"  float :duration="10" :delay="1.2" class="hidden md:block absolute bottom-6 -left-6 text-sky-soft opacity-15 pointer-events-none z-40" aria-hidden="true" />
    <HibiSparkle :size="18" twinkle :duration="2.4" class="hidden md:block absolute top-[14%] left-[8%] text-fg-subtle opacity-25 pointer-events-none z-40" />
    <HibiSparkle :size="14" twinkle :duration="3" :delay="0.8" class="hidden md:block absolute top-[8%] right-[28%] text-fg-subtle opacity-25 pointer-events-none z-40" />
    <HibiHeart :size="16" beat :duration="2.6" class="hidden md:block absolute bottom-[22%] right-[8%] text-fg-subtle opacity-25 pointer-events-none z-40" />

    <div class="relative z-10">
      <PageHero :icon="Repeat" tone="mint" title="Rutinas" :subtitle="`${routinesData.length} rutinas`">
        <template #actions>
          <AppButton variant="primary" size="sm" @click="openCreate"><template #icon><Plus class="size-[16px]" :stroke-width="2.3" /></template>Nueva</AppButton>
        </template>
      </PageHero>
    </div>

    <div class="relative z-10 flex-1 min-h-0 flex flex-col lg:flex-row gap-3 overflow-hidden">
      <!-- Lista con switch hoy/todas -->
      <AppCard class="lg:w-[360px] shrink-0 flex flex-col" :padded="false">
        <div class="px-4 pt-4 pb-3 flex items-center justify-between shrink-0">
          <h2 class="text-[13px] font-bold text-fg-muted">Tus rutinas</h2>
          <button type="button"
            class="inline-flex items-center gap-1 h-8 px-3 rounded-full bg-muted text-[12px] font-bold text-fg-muted hover:text-fg hover:bg-inset"
            @click="filter = filter === 'today' ? 'all' : 'today'">
            {{ filter === 'today' ? 'Hoy' : 'Todas' }}
            <Repeat class="size-3" :stroke-width="2.4" />
          </button>
        </div>
        <div class="flex-1 min-h-0 overflow-y-auto scroll-area px-2 pb-3 flex flex-col gap-1.5">
          <button v-for="r in visibleRoutines" :key="r.id" type="button"
            class="text-left p-3 rounded-[14px] transition-[background-color] flex items-start gap-3"
            :class="selectedId === r.id ? 'bg-sky-soft' : 'hover:bg-muted'"
            @click="selectedId = r.id"
          >
            <HibiCloudIcon :size="60" :icon="ICONS[r.time]" :icon-size="20" :cloud-color="TONES[r.time].split(' ')[0]" :icon-color="TONES[r.time].split(' ')[1]" :icon-stroke="1.9" class="shrink-0" />
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

      <!-- Modo ejecución: pasos interactivos + CRUD inline -->
      <AppCard class="flex-1 min-w-0 flex flex-col">
        <div class="flex items-center justify-between gap-4 mb-4 shrink-0 flex-wrap">
          <div>
            <h2 class="text-[22px] font-extrabold text-fg">{{ selected.name }}</h2>
            <p class="text-[13px] text-fg-muted">{{ doneCount(selected) }} de {{ selected.steps.length }} pasos, {{ selected.minutes }} min</p>
          </div>
          <button class="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-sky text-[#1f4661] hover:bg-sky-deep hover:text-white font-bold text-[14px] transition-[background-color,color]"
            @click="playRoutine">
            <Play class="size-[16px]" :stroke-width="2.3" aria-hidden="true" />Empezar
          </button>
        </div>
        <!-- TIMELINE de pasos: línea vertical + circulos numerados + drag&drop -->
        <ul class="flex flex-col flex-1 min-h-0 overflow-y-auto scroll-area pr-1 relative">
          <span class="absolute left-[28px] top-3 bottom-3 w-px bg-[var(--bg-muted)]" aria-hidden="true" />
          <template v-for="(s, i) in selected.steps" :key="i">
            <li
              draggable="true"
              class="relative grid grid-cols-[56px_1fr_auto_auto] gap-3 items-center py-2 pr-2 rounded-[12px] cursor-pointer hover:bg-muted transition-[background-color,opacity]"
              :class="dragStepIdx === i ? 'opacity-40' : ''"
              @click="toggleStep(s)"
              @dragstart="onStepDragStart($event, i)"
              @dragover="onStepDragOver"
              @drop="onStepDrop(i)">
              <!-- Marcador del paso: nubecita verde si hecho, nubecita pálida con número si pendiente -->
              <span class="relative z-10 mx-auto inline-block" :style="{ width: '46px', height: '32px' }">
                <HibiCloud :size="46" :class="s.done ? 'text-mint' : 'text-card'" class="absolute inset-0" />
                <span class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-bold text-[13px]"
                  :class="s.done ? 'text-[#34936a]' : 'text-fg-muted'">
                  <Check v-if="s.done" class="size-[15px]" :stroke-width="2.5" aria-hidden="true" />
                  <template v-else>{{ i + 1 }}</template>
                </span>
              </span>
              <p class="text-[14px] font-semibold text-fg" :class="{ 'line-through opacity-50': s.done }">{{ s.title }}</p>
              <span class="text-[12.5px] font-bold text-fg-subtle tabular-nums">{{ s.mins }} min</span>
              <div class="flex items-center gap-1">
                <span class="grid place-items-center size-8 rounded-[9px] text-fg-subtle cursor-grab active:cursor-grabbing" aria-label="Arrastrar" @click.stop><GripVertical class="size-[14px]" :stroke-width="2" /></span>
                <button type="button" class="grid place-items-center size-8 rounded-[9px] text-fg-subtle hover:text-pink-deep hover:bg-pink-soft" aria-label="Eliminar paso" @click.stop="removeStepAt(i)"><Trash2 class="size-[14px]" :stroke-width="2" /></button>
              </div>
            </li>
            <!-- Sub-pasos -->
            <li v-for="(sub, si) in s.substeps || []" :key="i+'-'+si"
              class="relative grid grid-cols-[56px_1fr] gap-3 items-center py-1.5 pl-12 cursor-pointer hover:bg-muted/50 rounded-[10px] transition-[background-color]"
              @click.stop="sub.done = !sub.done">
              <span class="relative z-10 mx-auto inline-block" :style="{ width: '32px', height: '22px' }">
                <Transition name="hibi-check" mode="out-in">
                  <HibiCloudIcon
                    :key="sub.done ? 'on' : 'off'"
                    :size="32"
                    :icon="Check"
                    :icon-size="12"
                    :cloud-color="sub.done ? 'text-mint' : 'text-card'"
                    :icon-color="sub.done ? 'text-[#34936a]' : 'text-transparent'"
                    :icon-stroke="3" />
                </Transition>
              </span>
              <p class="text-[13px] text-fg" :class="{ 'line-through opacity-50': sub.done }">{{ sub.title }}</p>
            </li>
          </template>
          <!-- Añadir paso -->
          <li class="relative grid grid-cols-[56px_1fr_auto] gap-3 items-center py-2 pr-2 mt-1">
            <HibiCloudIcon :size="46" :icon="Plus" :icon-size="16" cloud-color="text-card" icon-color="text-fg-subtle" :icon-stroke="2.2" class="relative z-10 mx-auto" />
            <input v-model="detailStepTitle" type="text" placeholder="Añadir un paso (Enter)"
              class="h-11 rounded-[10px] bg-muted focus:bg-inset px-3 text-[14px] font-semibold text-fg outline-none"
              @keydown.enter.prevent="addStepToSelected" />
            <input v-model.number="detailStepMins" type="number" min="1" max="120" class="h-11 w-20 rounded-[10px] bg-muted focus:bg-inset px-2 text-[13px] text-fg outline-none tabular-nums" />
          </li>
        </ul>
      </AppCard>
    </div>
  </div>
</template>
