<script setup lang="ts">
import {
  Plus, Filter, ListTodo, LayoutGrid, Inbox, Flag, CheckCircle2, Clock, ChevronDown, Calendar as CalIcon, FileText,
} from '@lucide/vue'

useHead({ title: 'Hibi — Tareas' })

type Status = 'pending' | 'done'
interface Task {
  id: string; title: string; due?: string
  priority: 0 | 1 | 2 | 3; status: Status
  notes?: string
}

const tasks = ref<Task[]>([
  { id: 't1', title: 'Diseñar las cards del dashboard', due: 'Hoy', priority: 3, status: 'pending', notes: 'Probar variantes con la nube de Hibi en la esquina.' },
  { id: 't2', title: 'Comprar pan y leche', due: 'Hoy', priority: 1, status: 'pending' },
  { id: 't3', title: 'Llamar al médico', due: 'Mañana', priority: 2, status: 'pending' },
  { id: 't4', title: 'Repasar fotos del viaje', priority: 0, status: 'pending' },
  { id: 't5', title: 'Preparar la presentación del jueves', due: 'Vie', priority: 3, status: 'pending' },
  { id: 't6', title: 'Responder al correo de Ana', due: 'Hoy', priority: 2, status: 'pending' },
  { id: 't7', title: 'Sacar al perro', priority: 1, status: 'done' },
  { id: 't8', title: 'Pagar la factura de la luz', due: 'Vie', priority: 2, status: 'pending' },
])

type View = 'list' | 'kanban' | 'create'
const view = ref<View>('list')
const COLUMNS: { key: Status; title: string; bg: string; text: string; dotBg: string }[] = [
  { key: 'pending', title: 'Pendiente', bg: 'bg-sky-soft',  text: 'text-sky-deep',   dotBg: '#5aa6d2' },
  { key: 'done',    title: 'Hecho',     bg: 'bg-mint',      text: 'text-[#34936a]',  dotBg: '#34936a' },
]
const grouped = computed(() => {
  const m: Record<Status, Task[]> = { pending: [], done: [] }
  tasks.value.forEach((t) => m[t.status].push(t)); return m
})
const PRIORITY_TONE = ['text-fg-subtle', 'text-[#34936a]', 'text-sky-deep', 'text-[#c5733f]', 'text-pink-deep']
const PRIORITY_BG = ['bg-muted text-fg', 'bg-mint text-[#34936a]', 'bg-sky-soft text-sky-deep', 'bg-peach text-[#c5733f]', 'bg-pink-soft text-pink-deep']
const PRIORITY_LABEL = ['Sin prioridad', 'Baja', 'Media', 'Alta', 'Urgente']
function toggleDone(t: Task) { t.status = t.status === 'done' ? 'pending' : 'done' }

const filters = ['Hoy', 'Próximas', 'Sin fecha', 'Importantes', 'Hechas']
const activeFilter = ref('Hoy')

const expandedId = ref<string | null>(null)
function toggleRow(id: string) { expandedId.value = expandedId.value === id ? null : id }

// Crear
const newTitle = ref('')
const newDue = ref('')
const newPriorityStr = ref<'0'|'1'|'2'|'3'>('0')
const newNotes = ref('')
let nextId = 100
function openCreate() {
  newTitle.value = ''; newDue.value = ''; newPriorityStr.value = '0'; newNotes.value = ''
  view.value = 'create'
}
function cancelCreate() { view.value = 'list' }
function saveTask() {
  const title = newTitle.value.trim(); if (!title) return
  tasks.value.unshift({
    id: 't' + (nextId++), title, due: newDue.value || undefined,
    priority: Number(newPriorityStr.value) as 0|1|2|3, status: 'pending',
    notes: newNotes.value || undefined,
  })
  view.value = 'list'
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
    if (t) t.status = dragOverCol.value
  }
  if (dragClone) { dragClone.remove(); dragClone = null }
  draggingId.value = null
  dragOverCol.value = null
  document.removeEventListener('pointermove', onPointerMove)
  document.removeEventListener('pointerup', onPointerUp)
  document.removeEventListener('pointercancel', onPointerUp)
}
function statusOf(s: Status) { return COLUMNS.find(c => c.key === s)! }
</script>

<template>
  <!-- CREAR -->
  <AppCreateView v-if="view === 'create'"
    title="Nueva tarea" subtitle="Captúrala rápido"
    :disabled="!newTitle.trim()"
    @close="cancelCreate" @save="saveTask">
    <div class="flex flex-col gap-2">
      <label class="text-[12.5px] font-bold text-fg-muted px-1">Título</label>
      <input v-model="newTitle" type="text" placeholder="¿Qué hay que hacer?" autofocus
        class="w-full h-14 rounded-[14px] bg-card focus:bg-muted px-4 text-[18px] font-semibold text-fg outline-none placeholder:text-fg-subtle" />
    </div>
    <div class="flex flex-col gap-2">
      <label class="text-[12.5px] font-bold text-fg-muted px-1">Prioridad</label>
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
    <div class="flex flex-col gap-2">
      <label class="text-[12.5px] font-bold text-fg-muted px-1">Fecha</label>
      <AppDate v-model="newDue" placeholder="Selecciona una fecha" />
    </div>
    <!-- Notas: textarea grande -->
    <div class="flex flex-col gap-2 flex-1 min-h-[200px]">
      <label class="text-[12.5px] font-bold text-fg-muted px-1">Notas</label>
      <textarea v-model="newNotes" placeholder="Detalles, contexto, enlaces…"
        class="w-full flex-1 min-h-0 rounded-[14px] bg-card focus:bg-muted px-4 py-3 text-[14.5px] text-fg outline-none resize-none"></textarea>
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
      <PageHero :icon="ListTodo" tone="mint" title="Tareas" :subtitle="`${tasks.length} en total · ${grouped.done.length} hechas`">
        <template #actions>
          <AppSegmented v-model="view" :options="[
            { value: 'list', icon: Inbox, ariaLabel: 'Lista' },
            { value: 'kanban', icon: LayoutGrid, ariaLabel: 'Kanban' },
          ]" />
          <AppButton variant="primary" size="sm" @click="openCreate">
            <template #icon><Plus class="size-[16px]" :stroke-width="2.3" /></template>
            <span class="hidden sm:inline">Nueva</span>
          </AppButton>
        </template>
      </PageHero>
      <AppCard class="shrink-0 !p-3 md:!p-4">
        <div class="flex items-center gap-1.5 overflow-x-auto hibi-no-sb">
          <button v-for="f in filters" :key="f" type="button"
            class="shrink-0 h-8 px-3 rounded-full text-[13px] font-semibold transition-[background-color,color]"
            :class="activeFilter === f ? 'bg-sky text-[#1f4661]' : 'bg-muted text-fg-muted hover:text-fg'"
            @click="activeFilter = f">{{ f }}</button>
          <button class="shrink-0 grid place-items-center size-8 rounded-full bg-muted text-fg-muted hover:text-fg" aria-label="Filtros"><Filter class="size-[15px]" :stroke-width="1.9" /></button>
        </div>
      </AppCard>
    </div>

    <!-- LISTA: cada tarea = AppCard independiente -->
    <div v-if="view === 'list'" class="relative z-10 flex-1 min-h-0 overflow-y-auto scroll-area">
      <ul class="flex flex-col gap-2 hibi-cascade pb-2">
        <li v-for="t in tasks" :key="t.id">
          <AppCard class="!p-0 overflow-hidden transition-[background-color]"
            :class="expandedId === t.id ? '!bg-muted' : ''">
            <button type="button" class="w-full flex items-center gap-3 p-4 text-left" @click="toggleRow(t.id)">
              <!-- Check con nube — wrapper con tamaño fijo para que el swap NO mueva layout -->
              <button type="button" @click.stop="toggleDone(t)"
                class="shrink-0 relative inline-block"
                :style="{ width: '40px', height: '27px' }"
                :aria-label="t.status === 'done' ? 'Marcar pendiente' : 'Marcar hecha'">
                <Transition name="hibi-check">
                  <HibiCloudIcon
                    :key="t.status"
                    :size="40"
                    :icon="CheckCircle2"
                    :icon-size="16"
                    :cloud-color="t.status === 'done' ? 'text-mint' : 'text-muted'"
                    :icon-color="t.status === 'done' ? 'text-[#34936a]' : 'text-transparent'"
                    :icon-stroke="2.4"
                    class="absolute inset-0" />
                </Transition>
              </button>
              <div class="flex-1 min-w-0">
                <p class="text-[15px] font-semibold text-fg truncate" :class="{ 'line-through opacity-50': t.status === 'done' }">{{ t.title }}</p>
                <div class="flex items-center gap-2 mt-1.5 text-[12px] flex-wrap">
                  <!-- Chip de estado PLENO -->
                  <span class="inline-flex items-center gap-1.5 px-2.5 h-6 rounded-full text-[11.5px] font-bold" :class="[statusOf(t.status).bg, statusOf(t.status).text]">
                    <span class="size-1.5 rounded-full" :style="{ background: statusOf(t.status).dotBg }" />{{ statusOf(t.status).title }}
                  </span>
                  <span v-if="t.due" class="inline-flex items-center gap-1 text-fg-muted"><Clock class="size-3" aria-hidden="true" />{{ t.due }}</span>
                  <span v-if="t.priority > 0" class="inline-flex items-center gap-1 text-fg-muted">
                    <Flag class="size-3" :class="PRIORITY_TONE[t.priority]" :stroke-width="2.3" />
                    {{ PRIORITY_LABEL[t.priority] }}
                  </span>
                </div>
              </div>
              <ChevronDown class="size-[18px] text-fg-muted transition-[transform] duration-200" :class="expandedId === t.id ? 'rotate-180' : ''" :stroke-width="2.2" aria-hidden="true" />
            </button>
            <!-- Detalle expandible — v-if para que el grid trick anime altura -->
            <Transition name="hibi-acc">
              <div v-if="expandedId === t.id" class="px-4 pb-4 pt-0">
                <div v-if="t.notes" class="rounded-[10px] bg-card px-3 py-2.5">
                  <p class="text-[11px] text-fg-muted font-semibold uppercase tracking-wide mb-1">Notas</p>
                  <p class="text-[13.5px] text-fg whitespace-pre-wrap">{{ t.notes }}</p>
                </div>
                <p v-else class="text-[12.5px] text-fg-subtle italic">Sin notas</p>
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
            <button class="grid place-items-center size-7 rounded-[9px] text-fg-subtle hover:text-fg hover:bg-muted" aria-label="Añadir" @click="openCreate"><Plus class="size-4" :stroke-width="2" /></button>
          </header>
          <div class="flex-1 min-h-0 overflow-y-auto scroll-area flex flex-col gap-2">
            <article v-for="t in grouped[col.key]" :key="t.id"
              class="bg-muted rounded-[12px] p-3 cursor-grab active:cursor-grabbing hover:bg-inset transition-[background-color] touch-none select-none"
              :class="draggingId === t.id ? 'opacity-30' : ''"
              @pointerdown="onCardPointerDown($event, t)">
              <p class="text-[13.5px] font-semibold text-fg leading-snug">{{ t.title }}</p>
              <div class="flex items-center justify-between mt-2 text-[11.5px] text-fg-muted">
                <span v-if="t.due" class="inline-flex items-center gap-1"><Clock class="size-3" aria-hidden="true" />{{ t.due }}</span>
                <Flag v-if="t.priority > 0" class="size-3 ml-auto" :class="PRIORITY_TONE[t.priority]" :stroke-width="2.3" aria-hidden="true" />
              </div>
            </article>
            <div v-if="!grouped[col.key].length"
              class="rounded-[12px] bg-card/40 p-4 text-center text-[12px] text-fg-subtle">
              Vacío
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
