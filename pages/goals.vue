<script setup lang="ts">
import { Plus, Target, Calendar, TrendingUp, Minus, Check, Hash, Palette, FileText, Folder, Trash2 } from '@lucide/vue'
import { format, parseISO, isValid } from 'date-fns'
import { es } from 'date-fns/locale'

useHead({ title: 'Hibi — Objetivos' })

const { goals, isLoading, createGoal, removeGoal: apiRemoveGoal, setLocalCurrent, saveCurrent } = useGoals()

// Vista: progreso e hitos derivados de current/total.
const goalsData = computed(() => goals.value.map((g) => {
  const progress = g.total > 0 ? Math.round((g.current / g.total) * 100) : 0
  return { ...g, progress, milestones: (g.milestones ?? []).map((m) => ({ ...m, done: progress >= m.at })) }
}))
type GoalView = (typeof goalsData)['value'][number]

// Drag de la barra para aportar: refleja al instante en la caché y persiste al soltar.
const dragGoalId = ref<string | null>(null)
let dragCurrent = 0
function updateFromPointer(e: PointerEvent, g: GoalView) {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
  // CURRENT en unidades enteras a partir del total; progreso = current/total.
  dragCurrent = Math.round((pct / 100) * g.total)
  setLocalCurrent(g.id, dragCurrent)
}
function onBarPointerDown(e: PointerEvent, g: GoalView) {
  dragGoalId.value = g.id
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  updateFromPointer(e, g)
}
function onBarPointerMove(e: PointerEvent, g: GoalView) {
  if (dragGoalId.value !== g.id) return
  updateFromPointer(e, g)
}
function onBarPointerUp(e: PointerEvent) {
  if (dragGoalId.value) saveCurrent(dragGoalId.value, dragCurrent)
  dragGoalId.value = null
  ;(e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId)
}
function fmtCurrent(g: GoalView) {
  if (g.unit === 'COP') return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(g.current)
  return `${g.current} ${g.unit}`
}
function fmtTotal(g: GoalView) {
  if (g.unit === 'COP') return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(g.total)
  return `${g.total} ${g.unit}`
}
function fmtTarget(target: string) {
  if (!target) return 'Sin fecha'
  if (/^\d{4}-\d{2}-\d{2}$/.test(target)) { const d = parseISO(target); if (isValid(d)) return format(d, "d 'de' MMM yyyy", { locale: es }) }
  return target
}

const TONES = [
  { value: '0', label: 'Cielo', tone: 'bg-sky-soft text-sky-deep', ringColor: 'var(--color-sky-deep)', swatch: 'bg-sky-soft' },
  { value: '1', label: 'Rosa', tone: 'bg-pink-soft text-pink-deep', ringColor: 'var(--color-pink-deep)', swatch: 'bg-pink-soft' },
  { value: '2', label: 'Menta', tone: 'bg-mint text-[#34936a]', ringColor: '#34936a', swatch: 'bg-mint' },
  { value: '3', label: 'Melocotón', tone: 'bg-peach text-[#c5733f]', ringColor: '#c5733f', swatch: 'bg-peach' },
  { value: '4', label: 'Lavanda', tone: 'bg-lavender text-[#7a63c0]', ringColor: '#7a63c0', swatch: 'bg-lavender' },
]
const TONE_OPTS = TONES.map(t => ({ value: t.value, label: t.label }))

const view = ref<'list' | 'create'>('list')
const newTitle = ref('')
const newTarget = ref('')
const newToneStr = ref('0')
const newGoalColor = ref('#5aa6d2')
const newArea = ref('')
const newUnit = ref('')
const newTotalStr = ref('100')
const newNotes = ref('')
function openCreate() {
  newTitle.value = ''; newTarget.value = ''; newToneStr.value = '0'
  newGoalColor.value = '#5aa6d2'
  newArea.value = ''; newUnit.value = ''; newTotalStr.value = '100'; newNotes.value = ''
  view.value = 'create'
}
function cancelCreate() { view.value = 'list' }
function removeGoal(id: string) { apiRemoveGoal(id) }

async function saveGoal() {
  const t = newTitle.value.trim(); if (!t) return
  await createGoal({
    title: t, target: newTarget.value || '', area: newArea.value || null,
    unit: newUnit.value || '', total: Number(newTotalStr.value) || 100, ringColor: newGoalColor.value,
  })
  view.value = 'list'
}
</script>

<template>
  <!-- VISTA DE CREACIÓN -->
  <AppCreateView v-if="view === 'create'"
    title="Nuevo objetivo"
    subtitle="Define a dónde quieres llegar"
    :disabled="!newTitle.trim()"
    @close="cancelCreate" @save="saveGoal">
    <div class="flex flex-col gap-2">
      <label class="text-[12.5px] font-bold text-fg-muted px-1">Título</label>
      <input v-model="newTitle" type="text" placeholder="¿Qué quieres conseguir?" autofocus
        class="w-full h-14 rounded-[14px] bg-card px-4 text-[18px] font-semibold text-fg outline-none placeholder:text-fg-subtle" />
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div class="flex flex-col gap-2">
        <label class="text-[12.5px] font-bold text-fg-muted px-1">Fecha objetivo</label>
        <AppDate v-model="newTarget" placeholder="Selecciona fecha" />
      </div>
      <div class="flex flex-col gap-2">
        <label class="text-[12.5px] font-bold text-fg-muted px-1">Área</label>
        <input v-model="newArea" type="text" placeholder="Salud, Estudio, Finanzas…"
          class="w-full h-12 rounded-[12px] bg-card px-3 text-[14.5px] text-fg outline-none" />
      </div>
      <div class="flex flex-col gap-2">
        <label class="text-[12.5px] font-bold text-fg-muted px-1">Meta total</label>
        <input v-model="newTotalStr" type="number" min="1" placeholder="100"
          class="w-full h-12 rounded-[12px] bg-card px-3 text-[14.5px] text-fg outline-none tabular-nums" />
      </div>
      <div class="flex flex-col gap-2">
        <label class="text-[12.5px] font-bold text-fg-muted px-1">Unidad</label>
        <input v-model="newUnit" type="text" placeholder="libros, km, COP, lecciones…"
          class="w-full h-12 rounded-[12px] bg-card px-3 text-[14.5px] text-fg outline-none" />
      </div>
    </div>
    <div class="flex flex-col gap-2 flex-1 min-h-0">
      <label class="text-[12.5px] font-bold text-fg-muted px-1 shrink-0">Color</label>
      <div class="flex-1 min-h-0">
        <AppColorPicker v-model="newGoalColor" format="hex" />
      </div>
    </div>
  </AppCreateView>

  <!-- VISTA NORMAL -->
  <div v-else class="h-full w-full flex flex-col gap-2 md:gap-3 px-3 md:px-7 py-3 md:py-5 overflow-hidden relative">
    <!-- Decoración cute -->
    <HibiCloud :size="150" float :duration="8" class="hidden md:block absolute -top-6 -right-8 text-lavender opacity-15 pointer-events-none z-40" aria-hidden="true" />
    <HibiCloud :size="90"  float :duration="10" :delay="1.2" class="hidden md:block absolute bottom-6 -left-6 text-sky-soft opacity-15 pointer-events-none z-40" aria-hidden="true" />
    <HibiSparkle :size="18" twinkle :duration="2.4" class="hidden md:block absolute top-[14%] left-[10%] text-fg-subtle opacity-25 pointer-events-none z-40" />
    <HibiSparkle :size="14" twinkle :duration="3" :delay="0.8" class="hidden md:block absolute top-[8%] right-[28%] text-fg-subtle opacity-25 pointer-events-none z-40" />
    <HibiHeart :size="16" beat :duration="2.6" class="hidden md:block absolute bottom-[20%] right-[8%] text-fg-subtle opacity-25 pointer-events-none z-40" />

    <div class="relative z-10">
      <PageHero :icon="Target" tone="lavender" title="Objetivos" :subtitle="`${goalsData.length} activos · avance medio ${goalsData.length ? Math.round(goalsData.reduce((a,g)=>a+g.progress,0)/goalsData.length) : 0}%`">
        <template #actions>
          <AppButton variant="primary" size="sm" class="w-full md:w-auto" @click="openCreate"><template #icon><Plus class="size-[16px]" :stroke-width="2.3" /></template>Nuevo</AppButton>
        </template>
      </PageHero>
    </div>

    <div class="hibi-anim-pop relative z-10 flex-1 min-h-0 overflow-y-auto scroll-area flex flex-col gap-3">
      <AppCard v-for="g in goalsData" :key="g.id" class="group/goal shrink-0 !p-4 md:!p-5">
        <div class="flex items-start gap-3 mb-4">
          <HibiCloudIcon :size="56" :icon="Target" :icon-size="20" :cloud-color="g.color.split(' ')[0]" :icon-color="g.color.split(' ')[1]" :icon-stroke="1.9" class="shrink-0" />
          <div class="flex-1 min-w-0">
            <h3 class="text-[16px] md:text-[17px] font-extrabold text-fg leading-tight">{{ g.title }}</h3>
            <div class="flex items-center gap-2 md:gap-3 mt-1 text-[12px] md:text-[12.5px] text-fg-muted flex-wrap">
              <span class="inline-flex items-center gap-1"><Calendar class="size-3" :stroke-width="2" aria-hidden="true" />{{ fmtTarget(g.target) }}</span>
              <span v-if="g.area" class="text-[11px] font-bold px-2 h-6 grid place-items-center rounded-full" :class="g.color">{{ g.area }}</span>
            </div>
          </div>
          <div class="flex items-start gap-1 shrink-0">
            <div class="text-right">
              <p class="text-[24px] md:text-[26px] font-extrabold leading-none tabular-nums" :style="{ color: g.ringColor }">{{ g.progress }}<span class="text-[14px] text-fg-muted">%</span></p>
              <!-- current/total: largo en COP → solo desde sm -->
              <p class="hidden sm:block text-[11px] text-fg-muted tabular-nums">{{ fmtCurrent(g) }} / {{ fmtTotal(g) }}</p>
            </div>
            <button type="button" class="grid place-items-center size-7 rounded-full text-fg-subtle md:opacity-0 md:group-hover/goal:opacity-100 hover:text-pink-deep hover:bg-pink-soft transition-[opacity,background-color,color]" aria-label="Eliminar objetivo" @click="removeGoal(g.id)"><Trash2 class="size-[14px]" :stroke-width="2" /></button>
          </div>
        </div>

        <!-- Barra de progreso MOVIBLE: arrastra para aportar progreso -->
        <div class="relative h-6 flex items-center cursor-grab active:cursor-grabbing touch-none select-none"
          @pointerdown="onBarPointerDown($event, g)"
          @pointermove="onBarPointerMove($event, g)"
          @pointerup="onBarPointerUp"
          @pointercancel="onBarPointerUp">
          <div class="relative h-3 w-full rounded-full bg-muted overflow-visible">
            <div class="absolute inset-y-0 left-0 rounded-full transition-[width] duration-150"
              :style="{ width: g.progress + '%', background: g.ringColor }"></div>
            <!-- Knob -->
            <span class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 size-6 rounded-full bg-card grid place-items-center transition-[left] duration-150"
              :style="{ left: g.progress + '%', boxShadow: `0 2px 8px ${g.ringColor}66, inset 0 0 0 3px ${g.ringColor}` }"
              aria-hidden="true">
              <span class="size-1.5 rounded-full" :style="{ background: g.ringColor }"></span>
            </span>
            <!-- Hitos -->
            <span v-for="(m, i) in g.milestones" :key="i"
              class="absolute top-1/2 -translate-y-1/2 size-3 rounded-full transition-[background-color]"
              :class="m.done ? '' : 'bg-card'"
              :style="{ left: `calc(${m.at}% - 6px)`, background: m.done ? g.ringColor : 'var(--bg-card)' }"
              :title="m.label">
            </span>
          </div>
        </div>
        <div class="relative h-5 mt-1.5">
          <span v-for="(m, i) in g.milestones" :key="i"
            class="absolute text-[10.5px] font-bold tabular-nums whitespace-nowrap -translate-x-1/2"
            :class="m.done ? 'text-fg' : 'text-fg-subtle'"
            :style="{ left: m.at + '%' }">{{ m.label }}</span>
        </div>
        <div class="mt-2 flex items-center justify-between gap-2">
          <p class="text-[11.5px] text-fg-muted font-semibold inline-flex items-center gap-1"><TrendingUp class="size-3" :stroke-width="2.2" /><span class="hidden sm:inline">Arrastra la barra para aportar progreso</span><span class="sm:hidden">Arrastra para aportar</span></p>
          <!-- En móvil el conteo va aquí (en el header se ocultaba por ser largo en COP) -->
          <p class="sm:hidden text-[12px] text-fg-muted tabular-nums font-bold text-right">{{ fmtCurrent(g) }} / {{ fmtTotal(g) }}</p>
        </div>
      </AppCard>
    </div>
  </div>
</template>
