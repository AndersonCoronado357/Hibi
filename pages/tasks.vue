<script setup lang="ts">
import {
  Plus, Repeat, ListTodo, LayoutGrid, Inbox, Flag, CheckCircle2, Clock, ChevronDown, Trash2, List,
  CalendarDays, CalendarClock, CalendarOff,
} from '@lucide/vue'
import { format, parseISO, isValid, startOfWeek, addDays } from 'date-fns'

const { t } = useI18n()
const dateLocale = useDateLocale()

useHead({ title: t('tasks.head.title') })

type Status = 'pending' | 'done'
const { tasks, createTask, updateTask, removeTask, toggleDone, isLoading } = useTasks()

type View = 'list' | 'kanban' | 'create'
const view = ref<View>('list')
const COLUMNS = computed<{ key: Status; title: string; bg: string; text: string; dotBg: string }[]>(() => [
  { key: 'pending', title: t('tasks.columns.pending'), bg: 'bg-sky-soft',  text: 'text-sky-deep',   dotBg: '#5aa6d2' },
  { key: 'done',    title: t('tasks.columns.done'),     bg: 'bg-mint',      text: 'text-[#34936a]',  dotBg: '#34936a' },
])

const PRIORITY_TONE = ['text-fg-subtle', 'text-[#34936a]', 'text-sky-deep', 'text-[#c5733f]', 'text-pink-deep']
const PRIORITY_BG = ['bg-muted text-fg', 'bg-mint text-[#34936a]', 'bg-sky-soft text-sky-deep', 'bg-peach text-[#c5733f]', 'bg-pink-soft text-pink-deep']
const PRIORITY_LABEL = computed(() => [
  t('tasks.priority.none'), t('tasks.priority.low'), t('tasks.priority.medium'), t('tasks.priority.high'), t('tasks.priority.urgent'),
])

// ── Repetición semanal ──
// Letras almacenadas (independientes del idioma): L M X J V S D (Lun→Dom).
const WEEK_ORDER = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const DAY_LETTER = ['D', 'L', 'M', 'X', 'J', 'V', 'S'] // JS getDay() → letra almacenada
// Etiquetas localizadas (una letra) en el mismo orden Lun→Dom.
const weekdayChips = computed(() =>
  WEEK_ORDER.map((letter, i) => ({
    letter,
    label: format(addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), i), 'EEEEE', { locale: dateLocale.value }),
  })),
)
const letterLabel = computed<Record<string, string>>(() =>
  Object.fromEntries(weekdayChips.value.map((c) => [c.letter, c.label])),
)
// Primera fecha >= from cuyo día está en `days`.
function nextOccurrence(from: Date, days: string): string {
  const set = new Set(days.split(''))
  const d = new Date(from); d.setHours(0, 0, 0, 0)
  for (let i = 0; i < 7; i++) { if (set.has(DAY_LETTER[d.getDay()])) return format(d, 'yyyy-MM-dd'); d.setDate(d.getDate() + 1) }
  return format(from, 'yyyy-MM-dd')
}
// Próxima ocurrencia estrictamente después de la fecha actual (o de hoy).
function nextAfter(fromISO: string | null, days: string): string {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  let base = today
  if (fromISO) { const d = parseISO(fromISO); if (isValid(d)) { d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + 1); if (d.getTime() > today.getTime()) base = d } }
  return nextOccurrence(base, days)
}
// Etiqueta legible de la repetición (para las filas).
function repeatText(days: string | null): string | null {
  if (!days) return null
  if (days.length === 7) return t('tasks.create.everyDay')
  return WEEK_ORDER.filter((d) => days.includes(d)).map((d) => letterLabel.value[d]).join(' · ')
}

const doneCount = computed(() => tasks.value.filter((t) => t.status === 'done').length)

// Fecha ISO (yyyy-MM-dd) → etiqueta amable (Hoy / Mañana / Ayer / "12 de jul")
function formatDue(d: string | null): string | null {
  if (!d) return null
  const dt = parseISO(d); if (!isValid(dt)) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const diff = Math.round((dt.getTime() - today.getTime()) / 86400000)
  if (diff === 0) return t('common.today')
  if (diff === 1) return t('common.tomorrow')
  if (diff === -1) return t('common.yesterday')
  return format(dt, t('tasks.dateFormat'), { locale: dateLocale.value })
}

const filters = computed(() => [
  { value: 'all', label: t('tasks.filters.all'), icon: List },
  { value: 'today', label: t('tasks.filters.today'), icon: CalendarDays },
  { value: 'upcoming', label: t('tasks.filters.upcoming'), icon: CalendarClock },
  { value: 'noDate', label: t('tasks.filters.noDate'), icon: CalendarOff },
  { value: 'important', label: t('tasks.filters.important'), icon: Flag },
  { value: 'done', label: t('tasks.filters.done'), icon: CheckCircle2 },
])
const activeFilter = ref('today')

const todayStr = () => format(new Date(), 'yyyy-MM-dd')
const filteredTasks = computed(() => {
  const t0 = todayStr()
  return tasks.value.filter((t) => {
    switch (activeFilter.value) {
      case 'today': return t.dueDate === t0
      case 'upcoming': return !!t.dueDate && t.dueDate > t0
      case 'noDate': return !t.dueDate
      case 'important': return t.priority >= 2
      case 'done': return t.status === 'done'
      default: return true
    }
  })
})
const grouped = computed(() => {
  const m: Record<Status, Task[]> = { pending: [], done: [] }
  filteredTasks.value.forEach((t) => m[t.status].push(t)); return m
})

const expandedId = ref<string | null>(null)
function toggleRow(id: string) { expandedId.value = expandedId.value === id ? null : id }

// Crear
const newTitle = ref('')
const newDue = ref('')
const newPriorityStr = ref<'0'|'1'|'2'|'3'>('0')
const newNotes = ref('')
const newRepeatDays = ref<string[]>([])
const isEveryDay = computed(() => newRepeatDays.value.length === 7)
function toggleDay(d: string) {
  const i = newRepeatDays.value.indexOf(d)
  if (i >= 0) newRepeatDays.value.splice(i, 1); else newRepeatDays.value.push(d)
}
function toggleEveryDay() { newRepeatDays.value = isEveryDay.value ? [] : [...WEEK_ORDER] }
const saving = ref(false)
function openCreate() {
  newTitle.value = ''; newDue.value = ''; newPriorityStr.value = '0'; newNotes.value = ''; newRepeatDays.value = []
  view.value = 'create'
}
function cancelCreate() { view.value = 'list' }
async function saveTask() {
  const title = newTitle.value.trim(); if (!title || saving.value) return
  saving.value = true
  try {
    const repeatDays = WEEK_ORDER.filter((d) => newRepeatDays.value.includes(d)).join('')
    const dueDate = repeatDays ? nextOccurrence(new Date(), repeatDays) : (newDue.value || null)
    await createTask({ title, dueDate, repeatDays: repeatDays || null, priority: Number(newPriorityStr.value), notes: newNotes.value || null })
    view.value = 'list'
  } finally {
    saving.value = false
  }
}

// Completar: si la tarea es recurrente, salta al próximo día marcado y sigue pendiente.
function onToggle(task: Task) {
  if (task.status === 'pending' && task.repeatDays) updateTask(task.id, { dueDate: nextAfter(task.dueDate, task.repeatDays) })
  else toggleDone(task)
}

// DnD MANUAL: no usamos el draggable nativo del browser (que aplica opacity al
// ghost). Clonamos el elemento y lo movemos con position:fixed siguiendo al
// cursor. El usuario ve la card EXACTAMENTE igual a como es en su columna.
const draggingId = ref<string | null>(null)
const dragOverCol = ref<Status | null>(null)
const dragOffset = { x: 0, y: 0 }
let dragClone: HTMLElement | null = null

function onCardPointerDown(e: PointerEvent, t: Task) {
  if (e.button !== 0) return
  e.preventDefault()
  const target = e.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  dragOffset.x = e.clientX - rect.left
  dragOffset.y = e.clientY - rect.top

  const clone = target.cloneNode(true) as HTMLElement
  clone.style.position = 'fixed'
  clone.style.left = (e.clientX - dragOffset.x) + 'px'
  clone.style.top = (e.clientY - dragOffset.y) + 'px'
  clone.style.width = rect.width + 'px'
  clone.style.margin = '0'
  clone.style.pointerEvents = 'none'
  clone.style.zIndex = '9999'
  clone.style.cursor = 'grabbing'
  document.body.appendChild(clone)
  dragClone = clone
  draggingId.value = t.id

  document.addEventListener('pointermove', onPointerMove)
  document.addEventListener('pointerup', onPointerUp)
  document.addEventListener('pointercancel', onPointerUp)
}

function onPointerMove(e: PointerEvent) {
  if (!dragClone) return
  dragClone.style.left = (e.clientX - dragOffset.x) + 'px'
  dragClone.style.top = (e.clientY - dragOffset.y) + 'px'
  // Detectar columna sobre la que está el cursor
  dragClone.style.display = 'none'
  const under = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null
  dragClone.style.display = ''
  const col = under?.closest('[data-col-key]') as HTMLElement | null
  dragOverCol.value = (col?.dataset.colKey as Status) || null
}

function onPointerUp() {
  if (draggingId.value && dragOverCol.value) {
    const t = tasks.value.find(x => x.id === draggingId.value)
    if (t && t.status !== dragOverCol.value) updateTask(t.id, { status: dragOverCol.value })
  }
  if (dragClone) { dragClone.remove(); dragClone = null }
  draggingId.value = null
  dragOverCol.value = null
  document.removeEventListener('pointermove', onPointerMove)
  document.removeEventListener('pointerup', onPointerUp)
  document.removeEventListener('pointercancel', onPointerUp)
}
function statusOf(s: Status) { return COLUMNS.value.find(c => c.key === s)! }
</script>

<template>
  <!-- CREAR -->
  <AppCreateView v-if="view === 'create'"
    :title="t('tasks.create.title')" :subtitle="t('tasks.create.subtitle')"
    :disabled="!newTitle.trim() || saving"
    @close="cancelCreate" @save="saveTask">
    <div class="flex flex-col gap-2">
      <label class="text-[12.5px] font-bold text-fg-muted px-1">{{ t('tasks.create.titleLabel') }}</label>
      <input v-model="newTitle" type="text" :placeholder="t('tasks.create.titlePlaceholder')" autofocus
        class="w-full h-14 rounded-[14px] bg-card px-4 text-[18px] font-semibold text-fg outline-none placeholder:text-fg-subtle" />
    </div>
    <div class="flex flex-wrap items-end gap-x-6 gap-y-3">
      <div class="flex flex-col gap-2">
        <label class="text-[12.5px] font-bold text-fg-muted px-1">{{ t('tasks.create.priorityLabel') }}</label>
        <div class="flex flex-wrap gap-1.5">
          <button v-for="(label, i) in PRIORITY_LABEL" :key="i" type="button"
            class="hibi-chip"
            :class="[
              newPriorityStr === String(i) ? PRIORITY_BG[i] + ' is-active' : 'bg-muted text-fg',
            ]"
            @click="newPriorityStr = String(i) as any">
            <Flag class="size-[13px]" :class="PRIORITY_TONE[i]" :stroke-width="2.4" aria-hidden="true" /> {{ label }}
          </button>
        </div>
      </div>
      <div class="flex flex-col gap-2 ml-auto">
        <label class="text-[12.5px] font-bold text-fg-muted px-1">{{ t('tasks.create.repeatLabel') }}</label>
        <div class="flex items-center gap-1.5 flex-wrap">
          <button v-for="c in weekdayChips" :key="c.letter" type="button"
            class="size-9 rounded-full text-[12.5px] font-bold uppercase grid place-items-center transition-[background-color,color]"
            :class="newRepeatDays.includes(c.letter) ? 'bg-sky-soft text-sky-deep' : 'bg-muted text-fg-muted hover:text-fg'"
            :aria-pressed="newRepeatDays.includes(c.letter)"
            @click="toggleDay(c.letter)">{{ c.label }}</button>
          <button type="button"
            class="h-9 px-3.5 rounded-full text-[12.5px] font-bold transition-[background-color,color]"
            :class="isEveryDay ? 'bg-sky-soft text-sky-deep' : 'bg-muted text-fg-muted hover:text-fg'"
            :aria-pressed="isEveryDay"
            @click="toggleEveryDay">{{ t('tasks.create.everyDay') }}</button>
        </div>
      </div>
    </div>
    <div class="flex flex-col gap-2">
      <label class="text-[12.5px] font-bold text-fg-muted px-1">{{ t('tasks.create.dateLabel') }}</label>
      <AppDate v-model="newDue" :placeholder="t('tasks.create.datePlaceholder')" :disabled="newRepeatDays.length > 0" />
      <p v-if="newRepeatDays.length > 0" class="text-[11.5px] text-fg-subtle px-1">{{ t('tasks.create.dateRepeatHint') }}</p>
    </div>
    <!-- Notas: textarea grande -->
    <div class="flex flex-col gap-2 flex-1 min-h-[200px]">
      <label class="text-[12.5px] font-bold text-fg-muted px-1">{{ t('tasks.create.notesLabel') }}</label>
      <textarea v-model="newNotes" :placeholder="t('tasks.create.notesPlaceholder')"
        class="w-full flex-1 min-h-0 rounded-[14px] bg-card px-4 py-3 text-[14.5px] text-fg outline-none resize-none"></textarea>
    </div>
  </AppCreateView>

  <!-- NORMAL -->
  <div v-else class="h-full w-full flex flex-col gap-3 px-4 md:px-7 py-5 overflow-hidden relative">
    <!-- Decoración cute -->
    <HibiCloud :size="150" float :duration="8" class="hidden md:block absolute -top-6 -right-8 text-sky-soft opacity-15 pointer-events-none z-40" aria-hidden="true" />
    <HibiCloud :size="90"  float :duration="10" :delay="1.2" class="hidden md:block absolute bottom-6 -left-6 text-pink-soft opacity-15 pointer-events-none z-40" aria-hidden="true" />
    <HibiSparkle :size="18" twinkle :duration="2.4" class="hidden md:block absolute top-[18%] left-[8%] text-fg-subtle opacity-25 pointer-events-none z-40" />
    <HibiSparkle :size="14" twinkle :duration="3" :delay="0.8" class="hidden md:block absolute top-[8%] right-[30%] text-fg-subtle opacity-25 pointer-events-none z-40" />
    <HibiHeart :size="16" beat :duration="2.6" class="hidden md:block absolute bottom-[22%] right-[8%] text-fg-subtle opacity-25 pointer-events-none z-40" />

    <div class="relative z-10 flex flex-col gap-3">
      <PageHero :icon="ListTodo" tone="mint" :title="t('tasks.title')" :subtitle="t('tasks.subtitle', { total: tasks.length, done: doneCount })">
        <template #actions>
          <!-- Filtros: mismo estilo que el toggle de vista (AppSegmented).
               Con icono: en movil se muestra solo el icono (sin texto), asi
               no se cortan ni necesitan scroll. -->
          <AppSegmented
            block
            :model-value="activeFilter"
            :options="filters"
            @update:model-value="(v) => activeFilter = String(v)" />
          <AppSegmented v-model="view" :options="[
            { value: 'list', icon: Inbox, ariaLabel: t('tasks.views.list') },
            { value: 'kanban', icon: LayoutGrid, ariaLabel: t('tasks.views.kanban') },
          ]" />
          <AppButton variant="primary" size="sm" @click="openCreate">
            <template #icon><Plus class="size-[16px]" :stroke-width="2.3" /></template>
            <span class="hidden sm:inline">{{ t('tasks.new') }}</span>
          </AppButton>
        </template>
      </PageHero>
    </div>

    <!-- LISTA: cada tarea = AppCard independiente -->
    <div v-if="view === 'list'" class="relative z-10 flex-1 min-h-0 overflow-y-auto scroll-area">
      <!-- Cargando -->
      <div v-if="isLoading && !tasks.length" class="flex flex-col gap-2 pb-2">
        <div v-for="n in 4" :key="n" class="h-[68px] rounded-[18px] bg-muted/60 animate-pulse" />
      </div>
      <!-- Vacío -->
      <div v-else-if="!filteredTasks.length" class="h-full min-h-[240px] flex flex-col items-center justify-center text-center gap-3 py-10">
        <HibiCloudIcon :size="96" :icon="ListTodo" :icon-size="34" cloud-color="text-sky-soft" icon-color="text-sky-deep" :icon-stroke="1.7" />
        <div>
          <p class="text-[15px] font-extrabold text-fg">{{ activeFilter === 'all' ? t('tasks.empty.allTitle') : t('tasks.empty.filteredTitle') }}</p>
          <p class="text-[13px] text-fg-muted mt-0.5">{{ activeFilter === 'all' ? t('tasks.empty.allSubtitle') : t('tasks.empty.filteredSubtitle') }}</p>
        </div>
      </div>
      <ul v-else class="flex flex-col gap-2 hibi-cascade pb-2">
        <li v-for="task in filteredTasks" :key="task.id">
          <AppCard class="!p-0 overflow-hidden transition-[background-color]"
            :class="expandedId === task.id ? '!bg-muted' : ''">
            <div role="button" tabindex="0" class="w-full flex items-center gap-3 p-4 text-left cursor-pointer outline-none focus-visible:bg-muted"
              @click="toggleRow(task.id)"
              @keydown.enter.prevent="toggleRow(task.id)"
              @keydown.space.prevent="toggleRow(task.id)">
              <!-- Check con nube — wrapper con tamaño fijo para que el swap NO mueva layout -->
              <button type="button" @click.stop="onToggle(task)"
                class="shrink-0 relative inline-block"
                :style="{ width: '40px', height: '27px' }"
                :aria-label="task.status === 'done' ? t('tasks.row.markPending') : t('tasks.row.markDone')">
                <Transition name="hibi-check">
                  <HibiCloudIcon
                    :key="task.status"
                    :size="40"
                    :icon="CheckCircle2"
                    :icon-size="16"
                    :cloud-color="task.status === 'done' ? 'text-mint' : 'text-muted'"
                    :icon-color="task.status === 'done' ? 'text-[#34936a]' : 'text-transparent'"
                    :icon-stroke="2.4"
                    class="absolute inset-0" />
                </Transition>
              </button>
              <div class="flex-1 min-w-0">
                <p class="text-[15px] font-semibold text-fg truncate" :class="{ 'line-through opacity-50': task.status === 'done' }">{{ task.title }}</p>
                <div class="flex items-center gap-2 mt-1.5 text-[12px] flex-wrap">
                  <!-- Chip de estado PLENO -->
                  <span class="inline-flex items-center gap-1.5 px-2.5 h-6 rounded-full text-[11.5px] font-bold" :class="[statusOf(task.status).bg, statusOf(task.status).text]">
                    <span class="size-1.5 rounded-full" :style="{ background: statusOf(task.status).dotBg }" />{{ statusOf(task.status).title }}
                  </span>
                  <span v-if="formatDue(task.dueDate)" class="inline-flex items-center gap-1 text-fg-muted"><Clock class="size-3" aria-hidden="true" />{{ formatDue(task.dueDate) }}</span>
                  <span v-if="repeatText(task.repeatDays)" class="inline-flex items-center gap-1 text-sky-deep font-semibold"><Repeat class="size-3" :stroke-width="2.4" aria-hidden="true" />{{ repeatText(task.repeatDays) }}</span>
                  <span v-if="task.priority > 0" class="inline-flex items-center gap-1 text-fg-muted">
                    <Flag class="size-3" :class="PRIORITY_TONE[task.priority]" :stroke-width="2.3" />
                    {{ PRIORITY_LABEL[task.priority] }}
                  </span>
                </div>
              </div>
              <ChevronDown class="size-[18px] text-fg-muted transition-[transform] duration-200" :class="expandedId === task.id ? 'rotate-180' : ''" :stroke-width="2.2" aria-hidden="true" />
            </div>
            <!-- Detalle expandible — v-if para que el grid trick anime altura -->
            <Transition name="hibi-acc">
              <div v-if="expandedId === task.id" class="px-4 pb-4 pt-0 flex flex-col gap-3">
                <div v-if="task.notes" class="rounded-[10px] bg-card px-3 py-2.5">
                  <p class="text-[11px] text-fg-muted font-semibold uppercase tracking-wide mb-1">{{ t('tasks.row.notes') }}</p>
                  <p class="text-[13.5px] text-fg whitespace-pre-wrap">{{ task.notes }}</p>
                </div>
                <p v-else class="text-[12.5px] text-fg-subtle italic">{{ t('tasks.row.noNotes') }}</p>
                <div class="flex justify-end">
                  <button type="button"
                    class="inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[12.5px] font-bold text-pink-deep bg-pink-soft hover:bg-pink transition-[background-color] outline-none focus-visible:ring-2 focus-visible:ring-pink-deep"
                    @click.stop="removeTask(task.id)">
                    <Trash2 class="size-[14px]" :stroke-width="2.2" aria-hidden="true" />{{ t('common.delete') }}
                  </button>
                </div>
              </div>
            </Transition>
          </AppCard>
        </li>
      </ul>
    </div>

    <!-- KANBAN — ocupa todo el ancho disponible -->
    <div v-else class="relative z-10 flex-1 min-h-0 grid grid-cols-2 gap-3 w-full">
        <AppCard v-for="col in COLUMNS" :key="col.key"
          :data-col-key="col.key"
          class="hibi-drop flex flex-col min-h-0 !p-3"
          :class="dragOverCol === col.key ? 'hibi-drop--over' : ''"
          :padded="false">
          <header class="flex items-center justify-between px-2 pt-1 pb-2 shrink-0">
            <div class="flex items-center gap-2">
              <span class="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-[11.5px] font-bold" :class="[col.bg, col.text]">
                <span class="size-1.5 rounded-full" :style="{ background: col.dotBg }" />
                {{ col.title }}
                <span class="opacity-70">· {{ grouped[col.key].length }}</span>
              </span>
            </div>
            <button class="grid place-items-center size-7 rounded-[9px] text-fg-subtle hover:text-fg hover:bg-muted" :aria-label="t('tasks.column.add')" @click="openCreate"><Plus class="size-4" :stroke-width="2" /></button>
          </header>
          <div class="flex-1 min-h-0 overflow-y-auto scroll-area flex flex-col gap-2">
            <article v-for="task in grouped[col.key]" :key="task.id"
              class="bg-muted rounded-[12px] p-3 cursor-grab active:cursor-grabbing hover:bg-inset transition-[background-color] touch-none select-none"
              :class="draggingId === task.id ? 'opacity-30' : ''"
              @pointerdown="onCardPointerDown($event, task)">
              <p class="text-[13.5px] font-semibold text-fg leading-snug">{{ task.title }}</p>
              <div class="flex items-center justify-between mt-2 text-[11.5px] text-fg-muted">
                <span v-if="formatDue(task.dueDate)" class="inline-flex items-center gap-1"><Clock class="size-3" aria-hidden="true" />{{ formatDue(task.dueDate) }}</span>
                <Repeat v-if="task.repeatDays" class="size-3 text-sky-deep" :class="task.priority > 0 ? '' : 'ml-auto'" :stroke-width="2.4" aria-hidden="true" />
                <Flag v-if="task.priority > 0" class="size-3 ml-auto" :class="PRIORITY_TONE[task.priority]" :stroke-width="2.3" aria-hidden="true" />
              </div>
            </article>
            <div v-if="!grouped[col.key].length"
              class="rounded-[12px] bg-card/40 p-4 text-center text-[12px] text-fg-subtle">
              {{ t('tasks.column.empty') }}
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
