<script setup lang="ts">
import { Plus, Repeat, Sunrise, Sun, Moon, Play, Check, Trash2, ArrowUp, ArrowDown, X, Calendar, ListPlus, FileText, GripVertical, ChevronRight, ChevronLeft } from '@lucide/vue'

useHead({ title: 'Hibi — Rutinas' })

import type { Routine, Step } from '~/composables/useRoutines'

const { routines: routinesData, loading, load, createRoutine, saveRoutineDoc, removeRoutine: apiRemoveRoutine } = useRoutines()

const ICONS = { morning: Sunrise, midday: Sun, night: Moon } as const
const TONES = { morning: 'bg-cream text-[#bf8f2e]', midday: 'bg-mint text-[#34936a]', night: 'bg-lavender text-[#7a63c0]' } as const
const LABELS = { morning: 'Mañana', midday: 'Mediodía', night: 'Noche' } as const

const selectedId = ref<string>('')
const selected = computed(() => routinesData.value.find(r => r.id === selectedId.value))
const doneCount = (r: Routine) => r.steps.filter(s => s.done).length

// Cargar del servidor; persistir la rutina seleccionada cuando se edita
// (guardado del documento completo con debounce dentro del composable).
let hydrated = false
let lastWatchedId: string | null = null
onMounted(async () => {
  await load()
  if (!routinesData.value.some(r => r.id === selectedId.value)) selectedId.value = routinesData.value[0]?.id ?? ''
  await nextTick()
  lastWatchedId = selected.value?.id ?? null
  hydrated = true
})
watch(selected, (r) => {
  if (!hydrated || !r) { lastWatchedId = r?.id ?? null; return }
  if (r.id !== lastWatchedId) { lastWatchedId = r.id; return } // cambió la selección, no es edición
  saveRoutineDoc(r)
}, { deep: true })

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
  newSteps.value.push({ title: t, mins: Math.max(1, Math.min(120, Number(newStepMins.value) || 5)), substeps: [] })
  newStepTitle.value = ''; newStepMins.value = 5
}
function removeNewStep(i: number) { newSteps.value.splice(i, 1) }

// Subpasos del paso i durante la creación (el "subárbol")
const subInputs = ref<Record<number, string>>({})
function addSubstep(i: number) {
  const t = (subInputs.value[i] || '').trim(); if (!t) return
  const step = newSteps.value[i]!
  if (!step.substeps) step.substeps = []
  step.substeps.push({ title: t })
  subInputs.value[i] = ''
}
function removeSubstep(i: number, si: number) { newSteps.value[i]!.substeps?.splice(si, 1) }
function stepMins(delta: number) { newStepMins.value = Math.max(1, Math.min(120, (Number(newStepMins.value) || 5) + delta)) }
function moveStep(arr: Step[], i: number, dir: -1 | 1) {
  const j = i + dir; if (j < 0 || j >= arr.length) return
  const tmp = arr[i]!; arr[i] = arr[j]!; arr[j] = tmp
}

async function saveRoutine() {
  const n = newName.value.trim(); if (!n) return
  const steps = newSteps.value.map(s => ({
    title: s.title, mins: s.mins, done: !!s.done,
    substeps: (s.substeps ?? []).map(ss => ({ title: ss.title, done: !!ss.done })),
  }))
  const r = await createRoutine({ name: n, time: newTime.value, days: [...newDays.value], steps })
  selectedId.value = r.id
  view.value = 'list'
}

// Modo ejecución (detalle)
const detailStepTitle = ref('')
const detailStepMins = ref<number>(5)
const addingStep = ref(false) // el "añadir paso" se abre con el botón del header
const stepInputRef = ref<HTMLInputElement | null>(null)
function focusSub() {
  nextTick(() => { if (import.meta.client) document.querySelector<HTMLInputElement>('input[data-subinput]')?.focus() })
}
function toggleAddStep() {
  addingStep.value = !addingStep.value
  if (addingStep.value) { addingSubFor.value = null; nextTick(() => stepInputRef.value?.focus()) }
}
// Si el input queda vacío y pierde el foco, se cierra (no se queda abierto)
function onStepBlur() { if (!detailStepTitle.value.trim()) addingStep.value = false }
function onSubBlur(i: number) { if (!(detailSubInputs.value[i] || '').trim()) addingSubFor.value = null }
function addStepToSelected() {
  const t = detailStepTitle.value.trim(); if (!t) return
  selected.value.steps.push({ title: t, mins: Math.max(1, Math.min(120, Number(detailStepMins.value) || 5)), substeps: [] })
  selected.value.minutes = selected.value.steps.reduce((a, s) => a + s.mins, 0)
  detailStepTitle.value = ''; detailStepMins.value = 5
  addingStep.value = false // uno a la vez: se cierra tras añadir
}
// Subpasos en la vista normal (rutina ya creada)
const detailSubInputs = ref<Record<number, string>>({})
const addingSubFor = ref<number | null>(null) // qué paso tiene abierto el "añadir subpaso"
function toggleAddSub(i: number) {
  addingSubFor.value = addingSubFor.value === i ? null : i
  if (addingSubFor.value !== null) { addingStep.value = false; focusSub() }
}
function addSubstepToStep(i: number) {
  const t = (detailSubInputs.value[i] || '').trim(); if (!t) return
  const step = selected.value.steps[i]!
  if (!step.substeps) step.substeps = []
  step.substeps.push({ title: t })
  detailSubInputs.value[i] = ''
  addingSubFor.value = null // uno por uno: se cierra tras añadir
}
function removeSubstepFromStep(i: number, si: number) { selected.value.steps[i]!.substeps?.splice(si, 1) }
// Drag & drop de subpasos (reordenar dentro de su propio paso)
const dragSub = ref<{ step: number; sub: number } | null>(null)
function onSubDragStart(e: DragEvent, stepIdx: number, subIdx: number) {
  dragSub.value = { step: stepIdx, sub: subIdx }
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
}
function onSubDrop(stepIdx: number, subIdx: number) {
  const d = dragSub.value
  if (!d || d.step !== stepIdx || d.sub === subIdx) { dragSub.value = null; return }
  const arr = selected.value.steps[stepIdx]!.substeps!
  const item = arr.splice(d.sub, 1)[0]!
  arr.splice(subIdx, 0, item)
  dragSub.value = null
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

// Móvil: lista de rutinas → tocar una abre su detalle (drill-down).
const mobileRoutineOpen = ref(false)
function openRoutineMobile(id: string) {
  selectedId.value = id
  mobileRoutineOpen.value = true
}
function removeRoutine(id: string) {
  const wasSelected = selectedId.value === id
  apiRemoveRoutine(id)
  if (wasSelected) { selectedId.value = routinesData.value[0]?.id ?? ''; mobileRoutineOpen.value = false }
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
        class="w-full h-14 rounded-[14px] bg-card px-4 text-[18px] font-semibold text-fg outline-none placeholder:text-fg-subtle" />
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
          class="bg-muted rounded-[12px] p-2.5 flex flex-col gap-2 transition-[opacity]"
          :class="dragNewStepIdx === i ? 'opacity-40' : ''">
          <!-- Fila principal del paso (arrastrable para reordenar) -->
          <div class="flex items-center gap-2 flex-wrap cursor-grab active:cursor-grabbing"
            draggable="true"
            @dragstart="onNewStepDragStart($event, i)"
            @dragover.prevent
            @drop="onNewStepDrop(i)">
            <span class="hidden sm:grid place-items-center size-7 text-fg-subtle shrink-0" aria-label="Arrastrar"><GripVertical class="size-4" :stroke-width="2" /></span>
            <span class="grid place-items-center size-9 rounded-[10px] bg-card text-sky-deep font-bold text-[14px] shrink-0">{{ i + 1 }}</span>
            <input v-model="s.title" type="text" class="flex-1 min-w-0 h-10 rounded-[10px] bg-card px-3 text-[14px] font-semibold text-fg outline-none" />
            <input v-model.number="s.mins" type="number" min="1" max="120" class="h-10 w-14 rounded-[10px] bg-card px-2 text-center text-[13px] text-fg outline-none tabular-nums" />
            <span class="text-[11.5px] text-fg-muted">min</span>
            <button type="button" class="grid place-items-center size-9 rounded-[10px] text-fg-subtle hover:text-pink-deep hover:bg-pink-soft shrink-0" aria-label="Eliminar paso" @click="removeNewStep(i)"><Trash2 class="size-4" :stroke-width="2" /></button>
          </div>
          <!-- Subpasos del paso (el subárbol) -->
          <div class="pl-2 sm:pl-9 flex flex-col gap-1.5">
            <div v-for="(sub, si) in s.substeps" :key="si" class="flex items-center gap-2">
              <span class="size-1.5 rounded-full bg-sky-deep/50 shrink-0" aria-hidden="true" />
              <input v-model="sub.title" type="text" class="flex-1 min-w-0 h-9 rounded-[9px] bg-card px-3 text-[13px] text-fg outline-none" />
              <button type="button" class="grid place-items-center size-8 rounded-[9px] text-fg-subtle hover:text-pink-deep hover:bg-pink-soft shrink-0" aria-label="Eliminar subpaso" @click="removeSubstep(i, si)"><X class="size-[14px]" :stroke-width="2.2" /></button>
            </div>
            <div class="flex items-center gap-2">
              <span class="size-1.5 rounded-full bg-fg-subtle/40 shrink-0" aria-hidden="true" />
              <input v-model="subInputs[i]" type="text" placeholder="Añadir subpaso" class="flex-1 min-w-0 h-9 rounded-[9px] bg-card px-3 text-[13px] text-fg outline-none placeholder:text-fg-subtle"
                @keydown.enter.prevent="addSubstep(i)" />
              <button type="button" class="grid place-items-center size-8 rounded-[9px] bg-card text-sky-deep shrink-0" aria-label="Añadir subpaso" @click="addSubstep(i)"><Plus class="size-[15px]" :stroke-width="2.4" /></button>
            </div>
          </div>
        </li>
      </ul>
      <!-- Añadir paso nuevo -->
      <div class="flex items-center gap-2 flex-wrap bg-muted rounded-[12px] p-2.5">
        <span class="grid place-items-center size-9 rounded-[10px] bg-card text-fg-subtle shrink-0"><Plus class="size-4" :stroke-width="2.2" /></span>
        <input v-model="newStepTitle" type="text" placeholder="Nombre del paso" class="flex-1 min-w-0 h-10 rounded-[10px] bg-card px-3 text-[14px] font-semibold text-fg outline-none"
          @keydown.enter.prevent="addNewStep" />
        <input v-model.number="newStepMins" type="number" min="1" max="120" class="h-10 w-14 rounded-[10px] bg-card px-2 text-center text-[13px] text-fg outline-none tabular-nums" />
        <span class="text-[11.5px] text-fg-muted">min</span>
        <button type="button" class="inline-flex items-center gap-1 h-10 px-3 rounded-[10px] bg-sky text-[#1f4661] hover:bg-sky-deep hover:text-white font-bold text-[13px] shrink-0" @click="addNewStep">
          <Plus class="size-[14px]" :stroke-width="2.4" />Añadir
        </button>
      </div>
      <p v-if="newSteps.length" class="text-[11.5px] text-fg-muted px-1 tabular-nums mt-1.5">Total: {{ newSteps.reduce((a,s)=>a+s.mins,0) }} min</p>
    </div>
  </AppCreateView>

  <div v-else class="h-full w-full flex flex-col gap-2 md:gap-3 px-3 md:px-7 py-3 md:py-5 overflow-hidden relative">
    <!-- Decoración cute -->
    <HibiCloud :size="150" float :duration="8" class="hidden md:block absolute -top-6 -right-8 text-mint opacity-15 pointer-events-none z-40" aria-hidden="true" />
    <HibiCloud :size="90"  float :duration="10" :delay="1.2" class="hidden md:block absolute bottom-6 -left-6 text-sky-soft opacity-15 pointer-events-none z-40" aria-hidden="true" />
    <HibiSparkle :size="18" twinkle :duration="2.4" class="hidden md:block absolute top-[14%] left-[8%] text-fg-subtle opacity-25 pointer-events-none z-40" />
    <HibiSparkle :size="14" twinkle :duration="3" :delay="0.8" class="hidden md:block absolute top-[8%] right-[28%] text-fg-subtle opacity-25 pointer-events-none z-40" />
    <HibiHeart :size="16" beat :duration="2.6" class="hidden md:block absolute bottom-[22%] right-[8%] text-fg-subtle opacity-25 pointer-events-none z-40" />

    <div class="relative z-10">
      <PageHero :icon="Repeat" tone="mint" title="Rutinas" :subtitle="`${routinesData.length} rutinas`">
        <template #actions>
          <AppButton variant="primary" size="sm" class="w-full md:w-auto" @click="openCreate"><template #icon><Plus class="size-[16px]" :stroke-width="2.3" /></template>Nueva</AppButton>
        </template>
      </PageHero>
    </div>

    <div class="relative z-10 flex-1 min-h-0 flex flex-col lg:flex-row gap-2 lg:gap-3 overflow-hidden">
      <!-- MÓVIL: SOLO la lista de rutinas; tocar una abre su detalle -->
      <div class="lg:hidden flex flex-col flex-1 min-h-0">
        <div class="shrink-0 flex items-center justify-between pb-2 px-1">
          <h2 class="text-[13px] font-bold text-fg-muted">Tus rutinas</h2>
          <button type="button"
            class="inline-flex items-center gap-1 h-8 px-3 rounded-full bg-muted text-[12px] font-bold text-fg-muted"
            @click="filter = filter === 'today' ? 'all' : 'today'">
            {{ filter === 'today' ? 'Hoy' : 'Todas' }}<Repeat class="size-3" :stroke-width="2.4" />
          </button>
        </div>
        <div class="flex-1 min-h-0 overflow-y-auto scroll-area flex flex-col gap-2">
          <button v-for="r in visibleRoutines" :key="r.id" type="button"
            class="text-left p-3 rounded-[14px] bg-card transition-[background-color] flex items-center gap-3 active:bg-muted"
            @click="openRoutineMobile(r.id)">
            <HibiCloudIcon :size="56" :icon="ICONS[r.time]" :icon-size="19" :cloud-color="TONES[r.time].split(' ')[0]" :icon-color="TONES[r.time].split(' ')[1]" :icon-stroke="1.9" class="shrink-0" />
            <div class="flex-1 min-w-0">
              <p class="text-[15px] font-extrabold text-fg leading-tight truncate">{{ r.name }}</p>
              <p class="text-[12.5px] text-fg-muted mt-0.5 truncate">{{ LABELS[r.time] }} · {{ r.minutes }} min · {{ doneCount(r) }}/{{ r.steps.length }} pasos</p>
              <div class="flex items-center gap-0.5 mt-2">
                <span v-for="d in DAYS" :key="d" class="size-5 grid place-items-center rounded-full text-[10px] font-bold" :class="r.days.includes(d) ? 'bg-sky text-[#1f4661]' : 'bg-muted text-fg-subtle'">{{ d }}</span>
              </div>
            </div>
            <ChevronRight class="size-[18px] text-fg-subtle shrink-0" :stroke-width="2" aria-hidden="true" />
          </button>
          <div v-if="!visibleRoutines.length" class="h-full flex flex-col items-center justify-center text-center gap-3 text-fg-subtle">
            <HibiCloud :size="80" face class="text-sky-soft opacity-70" aria-hidden="true" />
            <p class="text-[14px] font-semibold">No hay rutinas para hoy</p>
            <button type="button" class="text-[13px] font-bold text-sky-deep" @click="filter = 'all'">Ver todas</button>
          </div>
        </div>
      </div>

      <!-- DESKTOP: sidebar con switch hoy/todas -->
      <AppCard class="hidden lg:flex lg:w-[360px] shrink-0 flex-col" :padded="false">
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

      <!-- Modo ejecución: en desktop panel derecho; en móvil overlay drill-down -->
      <AppCard
        class="flex-1 min-w-0 flex-col"
        :class="mobileRoutineOpen ? '!absolute inset-0 z-20 flex' : 'hidden lg:flex'">
        <template v-if="selected">
        <div class="flex items-center gap-3 mb-4 shrink-0">
          <button type="button" class="lg:hidden grid place-items-center size-9 rounded-full text-fg-muted hover:bg-muted shrink-0" aria-label="Volver a rutinas" @click="mobileRoutineOpen = false"><ChevronLeft class="size-[18px]" :stroke-width="2" /></button>
          <div class="flex-1 min-w-0">
            <h2 class="text-[20px] md:text-[22px] font-extrabold text-fg break-words">{{ selected.name }}</h2>
            <p class="text-[12.5px] md:text-[13px] text-fg-muted">{{ doneCount(selected) }} de {{ selected.steps.length }} pasos · {{ selected.minutes }} min</p>
          </div>
          <button class="shrink-0 inline-flex items-center gap-2 h-10 md:h-11 px-4 md:px-5 rounded-full font-bold text-[13px] md:text-[14px] transition-[background-color,color]"
            :class="addingStep ? 'bg-sky-deep text-white' : 'bg-sky text-[#1f4661] hover:bg-sky-deep hover:text-white'"
            @click="toggleAddStep">
            <Plus class="size-[16px]" :stroke-width="2.4" aria-hidden="true" />Agregar paso
          </button>
        </div>
        <!-- TIMELINE de pasos: línea vertical + circulos numerados + drag&drop -->
        <ul class="flex flex-col flex-1 min-h-0 overflow-y-auto scroll-area pr-1 relative">
          <span class="absolute left-[28px] top-3 bottom-3 w-px bg-[var(--bg-muted)]" aria-hidden="true" />
          <template v-for="(s, i) in selected.steps" :key="i">
            <li
              class="relative grid grid-cols-[56px_1fr_auto_auto] gap-3 items-center py-2 pr-2 rounded-[12px] cursor-pointer hover:bg-muted transition-[background-color,opacity]"
              :class="dragStepIdx === i ? 'opacity-40' : ''"
              @click="toggleStep(s)"
              @dragover="onStepDragOver"
              @drop="onStepDrop(i)">
              <!-- Marcador del paso con POP al cambiar (nube verde con check / pálida con número) -->
              <span class="relative z-10 mx-auto inline-block" :style="{ width: '46px', height: '32px' }">
                <Transition name="hibi-check">
                  <span :key="s.done ? 'on' : 'off'" class="absolute inset-0">
                    <HibiCloud :size="46" :class="s.done ? 'text-mint' : 'text-card'" class="absolute inset-0" />
                    <span class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-bold text-[13px]"
                      :class="s.done ? 'text-[#34936a]' : 'text-fg-muted'">
                      <Check v-if="s.done" class="size-[15px]" :stroke-width="2.5" aria-hidden="true" />
                      <template v-else>{{ i + 1 }}</template>
                    </span>
                  </span>
                </Transition>
              </span>
              <p class="min-w-0 break-words text-[14px] font-semibold text-fg" :class="{ 'line-through opacity-50': s.done }">{{ s.title }}</p>
              <span class="text-[12px] md:text-[12.5px] font-bold text-fg-subtle tabular-nums whitespace-nowrap">{{ s.mins }} min</span>
              <div class="flex items-center gap-1">
                <span draggable="true" class="grid place-items-center size-8 rounded-[9px] text-fg-subtle cursor-grab active:cursor-grabbing" aria-label="Arrastrar paso" @click.stop @dragstart="onStepDragStart($event, i)"><GripVertical class="size-[14px]" :stroke-width="2" /></span>
                <button type="button" class="grid place-items-center size-8 rounded-[9px] transition-[background-color,color]" :class="addingSubFor === i ? 'bg-sky-soft text-sky-deep' : 'text-fg-subtle hover:text-sky-deep hover:bg-sky-soft'" aria-label="Añadir subpaso" @click.stop="toggleAddSub(i)"><Plus class="size-[15px]" :stroke-width="2.2" /></button>
                <button type="button" class="grid place-items-center size-8 rounded-[9px] text-fg-subtle hover:text-pink-deep hover:bg-pink-soft" aria-label="Eliminar paso" @click.stop="removeStepAt(i)"><Trash2 class="size-[14px]" :stroke-width="2" /></button>
              </div>
            </li>
            <!-- Sub-pasos: con drag & drop para reordenar dentro del paso -->
            <li v-for="(sub, si) in s.substeps || []" :key="i+'-'+si"
              class="group/sub relative grid grid-cols-[56px_1fr_auto] gap-3 items-center py-1.5 pl-12 pr-1 cursor-pointer hover:bg-muted/50 rounded-[10px] transition-[background-color,opacity]"
              :class="dragSub && dragSub.step === i && dragSub.sub === si ? 'opacity-40' : ''"
              @click.stop="sub.done = !sub.done"
              @dragover="onStepDragOver"
              @drop.stop="onSubDrop(i, si)">
              <span class="relative z-10 mx-auto inline-block" :style="{ width: '32px', height: '22px' }">
                <Transition name="hibi-check">
                  <HibiCloudIcon
                    :key="sub.done ? 'on' : 'off'"
                    :size="32"
                    :icon="Check"
                    :icon-size="12"
                    :cloud-color="sub.done ? 'text-mint' : 'text-card'"
                    :icon-color="sub.done ? 'text-[#34936a]' : 'text-transparent'"
                    :icon-stroke="3"
                    class="absolute inset-0" />
                </Transition>
              </span>
              <p class="min-w-0 text-[13px] text-fg break-words" :class="{ 'line-through opacity-50': sub.done }">{{ sub.title }}</p>
              <div class="flex items-center gap-0.5">
                <span draggable="true" class="grid place-items-center size-7 rounded-[8px] text-fg-subtle cursor-grab active:cursor-grabbing" aria-label="Arrastrar subpaso" @click.stop @dragstart.stop="onSubDragStart($event, i, si)"><GripVertical class="size-[13px]" :stroke-width="2" /></span>
                <button type="button" class="grid place-items-center size-7 rounded-[8px] text-fg-subtle md:opacity-0 md:group-hover/sub:opacity-100 hover:text-pink-deep hover:bg-pink-soft transition-[opacity,background-color,color]" aria-label="Eliminar subpaso" @click.stop="removeSubstepFromStep(i, si)"><X class="size-[13px]" :stroke-width="2.2" /></button>
              </div>
            </li>
            <!-- Añadir subpaso a este paso: solo cuando se abre con el botón + -->
            <li v-if="addingSubFor === i" class="relative grid grid-cols-[56px_1fr] gap-3 items-center py-1 pl-12">
              <span class="relative z-10 mx-auto size-1.5 rounded-full bg-sky-deep/40" aria-hidden="true" />
              <div class="flex items-center gap-1.5 pr-1">
                <input data-subinput v-model="detailSubInputs[i]" type="text" placeholder="Nuevo subpaso"
                  class="flex-1 min-w-0 h-9 rounded-[9px] bg-muted px-3 text-[13px] text-fg outline-none placeholder:text-fg-subtle"
                  @keydown.enter.prevent="addSubstepToStep(i)" @blur="onSubBlur(i)" />
                <button type="button" :disabled="!(detailSubInputs[i] || '').trim()" class="shrink-0 grid place-items-center size-9 rounded-[9px] bg-sky text-[#1f4661] hover:bg-sky-deep hover:text-white disabled:opacity-40 transition-[background-color,color]" aria-label="Guardar subpaso" @click="addSubstepToStep(i)"><Check class="size-[15px]" :stroke-width="2.6" /></button>
              </div>
            </li>
          </template>
          <!-- Añadir paso: solo cuando se abre con "Agregar paso" (uno a la vez) -->
          <li v-if="addingStep" class="relative grid grid-cols-[56px_1fr_auto] gap-2 items-center py-2 pr-1 mt-1">
            <HibiCloudIcon :size="40" :icon="Plus" :icon-size="15" cloud-color="text-card" icon-color="text-fg-subtle" :icon-stroke="2.2" class="relative z-10 mx-auto" />
            <input ref="stepInputRef" v-model="detailStepTitle" type="text" placeholder="Nuevo paso"
              class="min-w-0 h-11 rounded-[10px] bg-muted px-3 text-[14px] font-semibold text-fg outline-none"
              @keydown.enter.prevent="addStepToSelected" @blur="onStepBlur" />
            <div class="flex items-center gap-1.5 shrink-0">
              <input v-model.number="detailStepMins" type="number" min="1" max="120" aria-label="Minutos" class="h-11 w-14 rounded-[10px] bg-muted px-2 text-center text-[13px] text-fg outline-none tabular-nums" />
              <button type="button" :disabled="!detailStepTitle.trim()" class="grid place-items-center size-11 rounded-[10px] bg-sky text-[#1f4661] hover:bg-sky-deep hover:text-white disabled:opacity-40 transition-[background-color,color]" aria-label="Guardar paso" @click="addStepToSelected"><Check class="size-[18px]" :stroke-width="2.6" /></button>
            </div>
          </li>
        </ul>
        </template>
        <div v-else class="flex-1 grid place-items-center text-center p-8">
          <div class="flex flex-col items-center gap-3">
            <HibiCloud :size="90" face class="text-sky-soft opacity-70" aria-hidden="true" />
            <p class="text-[14px] font-semibold text-fg-muted">{{ loading ? 'Cargando rutinas…' : 'Crea tu primera rutina' }}</p>
            <button v-if="!loading" type="button" class="text-[13px] font-bold text-sky-deep" @click="openCreate">Nueva rutina</button>
          </div>
        </div>
      </AppCard>
    </div>
  </div>
</template>

<style scoped>
.hibi-no-sb { scrollbar-width: none; }
.hibi-no-sb::-webkit-scrollbar { display: none; }
</style>
