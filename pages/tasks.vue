<script setup lang="ts">
import {
  Plus, Filter, ListTodo, LayoutGrid, Inbox, Flag, Tag, CheckCircle2, Clock, X,
} from '@lucide/vue'

useHead({ title: 'Hibi — Tareas' })

type Status = 'pending' | 'in_progress' | 'waiting' | 'done'
interface Task {
  id: string; title: string; project: string; due?: string
  priority: 0 | 1 | 2 | 3; status: Status; tags?: string[]; energy?: 'low' | 'medium' | 'high'
}

const tasks = ref<Task[]>([
  { id: 't1', title: 'Diseñar las cards del dashboard', project: 'Hibi', due: 'Hoy', priority: 3, status: 'in_progress', tags: ['ui'], energy: 'medium' },
  { id: 't2', title: 'Comprar pan y leche', project: 'Casa', due: 'Hoy', priority: 1, status: 'pending', tags: ['compras'], energy: 'low' },
  { id: 't3', title: 'Llamar al médico', project: 'Personal', due: 'Mañana', priority: 2, status: 'pending', energy: 'low' },
  { id: 't4', title: 'Repasar fotos del viaje', project: 'Personal', priority: 0, status: 'pending', tags: ['ocio'] },
  { id: 't5', title: 'Preparar la presentación del jueves', project: 'Trabajo', due: 'Vie', priority: 3, status: 'in_progress', tags: ['trabajo'], energy: 'high' },
  { id: 't6', title: 'Responder al correo de Ana', project: 'Trabajo', due: 'Hoy', priority: 2, status: 'waiting' },
  { id: 't7', title: 'Sacar al perro', project: 'Casa', priority: 1, status: 'done' },
  { id: 't8', title: 'Pagar la factura de la luz', project: 'Finanzas', due: 'Vie', priority: 2, status: 'pending', tags: ['urgente'] },
])

type View = 'list' | 'kanban'
const view = ref<View>('list')
const COLUMNS: { key: Status; title: string; tone: string }[] = [
  { key: 'pending', title: 'Pendiente', tone: 'bg-muted text-fg-muted' },
  { key: 'in_progress', title: 'En curso', tone: 'bg-sky-soft text-sky-deep' },
  { key: 'waiting', title: 'En espera', tone: 'bg-peach text-[#c5733f]' },
  { key: 'done', title: 'Hecho', tone: 'bg-mint text-[#34936a]' },
]
const grouped = computed(() => {
  const m: Record<Status, Task[]> = { pending: [], in_progress: [], waiting: [], done: [] }
  tasks.value.forEach((t) => m[t.status].push(t)); return m
})
const selectedId = ref<string | null>('t1')
const selected = computed(() => tasks.value.find((t) => t.id === selectedId.value) || null)
const PRIORITY_TONE = ['text-fg-subtle', 'text-[#34936a]', 'text-sky-deep', 'text-[#c5733f]', 'text-pink-deep']
const PRIORITY_LABEL = ['Sin prioridad', 'Baja', 'Media', 'Alta', 'Urgente']
function toggleDone(t: Task) { t.status = t.status === 'done' ? 'pending' : 'done' }

const filters = ['Hoy', 'Próximas', 'Sin fecha', 'Importantes', 'Hechas']
const activeFilter = ref('Hoy')

const creating = ref(false)
const newTitle = ref(''); const newProject = ref('Hibi'); const newDue = ref(''); const newPriority = ref<0|1|2|3>(0)
let nextId = 100
function startCreate() {
  creating.value = true
  nextTick(() => document.getElementById('new-task-title')?.focus())
}
function cancelCreate() { creating.value = false; newTitle.value = ''; newDue.value = ''; newPriority.value = 0 }
function saveTask() {
  const title = newTitle.value.trim(); if (!title) return
  tasks.value.unshift({ id: 't' + (nextId++), title, project: newProject.value || 'Personal', due: newDue.value || undefined, priority: newPriority.value, status: 'pending' })
  cancelCreate()
}
</script>

<template>
  <div class="h-full flex flex-col gap-3 px-4 md:px-7 py-5">
    <!-- Toolbar card -->
    <AppCard class="shrink-0 !p-3 md:!p-4 flex flex-col gap-3">
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <div class="flex items-center gap-2.5">
          <span class="grid place-items-center size-10 rounded-[13px] bg-mint text-[#34936a]" aria-hidden="true"><ListTodo class="size-5" :stroke-width="1.9" /></span>
          <div>
            <h1 class="text-[20px] md:text-[22px] font-extrabold text-fg leading-tight">Tareas</h1>
            <p class="text-[12.5px] text-fg-muted leading-tight">{{ tasks.length }} en total, {{ grouped.done.length }} hechas</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <AppSegmented v-model="view" :options="[
            { value: 'list', icon: Inbox, ariaLabel: 'Lista' },
            { value: 'kanban', icon: LayoutGrid, ariaLabel: 'Kanban' },
          ]" />
          <AppButton variant="primary" size="sm" @click="startCreate">
            <template #icon><Plus class="size-[16px]" :stroke-width="2.3" /></template>
            <span class="hidden sm:inline">Nueva</span>
          </AppButton>
        </div>
      </div>
      <div class="flex items-center gap-1.5 overflow-x-auto hibi-no-sb">
        <button v-for="f in filters" :key="f" type="button"
          class="shrink-0 h-8 px-3 rounded-full text-[13px] font-semibold transition-[background-color,color]"
          :class="activeFilter === f ? 'bg-sky text-[#1f4661]' : 'bg-muted text-fg-muted hover:text-fg'"
          @click="activeFilter = f">{{ f }}</button>
        <button class="shrink-0 grid place-items-center size-8 rounded-full bg-muted text-fg-muted hover:text-fg" aria-label="Filtros"><Filter class="size-[15px]" :stroke-width="1.9" /></button>
      </div>
    </AppCard>

    <!-- Contenido -->
    <div class="flex-1 min-h-0 flex gap-3">
      <template v-if="view === 'list'">
        <!-- Lista -->
        <AppCard class="flex-1 min-w-0 md:max-w-[420px] lg:max-w-[460px] flex flex-col" :padded="false">
          <div class="flex-1 min-h-0 overflow-y-auto scroll-area p-3">
            <Transition name="inline-form">
            <form
              v-if="creating" aria-label="Nueva tarea"
              class="staggered bg-muted rounded-[14px] p-3 mb-2 flex flex-col gap-2"
              @submit.prevent="saveTask" @keydown.escape="cancelCreate"
            >
              <label for="new-task-title" class="sr-only">Título</label>
              <input id="new-task-title" v-model="newTitle" type="text" placeholder="Título de la tarea"
                class="w-full h-10 rounded-[10px] bg-card focus:bg-inset px-3 text-[14.5px] font-semibold text-fg outline-none" />
              <div class="grid grid-cols-3 gap-2">
                <label for="new-task-project" class="sr-only">Proyecto</label>
                <input id="new-task-project" v-model="newProject" type="text" placeholder="Proyecto" class="h-9 rounded-[10px] bg-card focus:bg-inset px-3 text-[13px] text-fg outline-none" />
                <label for="new-task-due" class="sr-only">Fecha</label>
                <input id="new-task-due" v-model="newDue" type="text" placeholder="Hoy / Mañana / Vie" class="h-9 rounded-[10px] bg-card focus:bg-inset px-3 text-[13px] text-fg outline-none" />
                <label for="new-task-priority" class="sr-only">Prioridad</label>
                <select id="new-task-priority" v-model.number="newPriority" class="h-9 rounded-[10px] bg-card focus:bg-inset px-3 text-[13px] text-fg outline-none">
                  <option :value="0">Sin prioridad</option><option :value="1">Baja</option><option :value="2">Media</option><option :value="3">Alta</option>
                </select>
              </div>
              <div class="flex items-center justify-end gap-2">
                <button type="button" class="h-9 px-3.5 rounded-[10px] text-[13px] font-semibold text-fg-muted hover:bg-card hover:text-fg" @click="cancelCreate">Cancelar</button>
                <button type="submit" :disabled="!newTitle.trim()" class="h-9 px-4 rounded-[10px] bg-sky text-[#1f4661] text-[13px] font-bold disabled:opacity-50">Crear</button>
              </div>
            </form>
            </Transition>
            <ul class="flex flex-col gap-1">
              <li v-for="t in tasks" :key="t.id">
                <button type="button"
                  class="w-full text-left flex items-start gap-3 p-3 rounded-[14px] transition-[background-color]"
                  :class="selectedId === t.id ? 'bg-sky-soft' : 'hover:bg-muted'"
                  @click="selectedId = t.id"
                >
                  <button type="button"
                    class="mt-0.5 shrink-0 grid place-items-center size-[22px] rounded-md transition-[background-color]"
                    :class="t.status === 'done' ? 'bg-mint text-[#34936a]' : 'bg-card text-fg-subtle hover:bg-sky-soft hover:text-sky-deep'"
                    @click.stop="toggleDone(t)"
                    :aria-label="t.status === 'done' ? 'Marcar pendiente' : 'Marcar hecha'"
                  ><CheckCircle2 v-if="t.status === 'done'" class="size-[15px]" :stroke-width="2" /></button>
                  <div class="flex-1 min-w-0">
                    <p class="text-[14.5px] font-semibold text-fg truncate" :class="{ 'line-through opacity-50': t.status === 'done' }">{{ t.title }}</p>
                    <div class="flex items-center gap-2 mt-1 text-[12px] text-fg-muted">
                      <span class="font-semibold">{{ t.project }}</span>
                      <span v-if="t.due" class="inline-flex items-center gap-1"><Clock class="size-3" aria-hidden="true" />{{ t.due }}</span>
                      <Flag v-if="t.priority > 0" class="size-3" :class="PRIORITY_TONE[t.priority]" :stroke-width="2.3" :aria-label="`Prioridad ${PRIORITY_LABEL[t.priority]}`" />
                    </div>
                  </div>
                </button>
              </li>
            </ul>
          </div>
        </AppCard>

        <!-- Detalle -->
        <AppCard class="hidden md:flex flex-1 min-w-0 flex-col overflow-hidden" :padded="false">
          <template v-if="selected">
            <header class="shrink-0 px-6 pt-6 pb-4 flex items-start gap-3">
              <button type="button"
                class="mt-1 grid place-items-center size-6 rounded-md shrink-0"
                :class="selected.status === 'done' ? 'bg-mint text-[#34936a]' : 'bg-muted text-fg-subtle hover:bg-sky-soft hover:text-sky-deep'"
                @click="toggleDone(selected)"
                :aria-label="selected.status === 'done' ? 'Marcar pendiente' : 'Marcar hecha'"
              ><CheckCircle2 v-if="selected.status === 'done'" class="size-4" :stroke-width="2" /></button>
              <h2 class="flex-1 text-[22px] font-extrabold text-fg leading-tight" :class="{ 'line-through opacity-50': selected.status === 'done' }">{{ selected.title }}</h2>
              <button type="button" class="grid place-items-center size-8 rounded-[10px] text-fg-subtle hover:text-fg hover:bg-muted" aria-label="Cerrar detalle" @click="selectedId = null"><X class="size-[17px]" :stroke-width="2" /></button>
            </header>
            <div class="flex-1 min-h-0 overflow-y-auto scroll-area px-6 pb-6">
              <div class="grid grid-cols-2 gap-3 mb-5">
                <div class="rounded-[12px] bg-muted px-3.5 py-3">
                  <p class="text-[12px] text-fg-muted font-semibold">Proyecto</p>
                  <p class="text-[14px] font-semibold text-fg mt-0.5">{{ selected.project }}</p>
                </div>
                <div class="rounded-[12px] bg-muted px-3.5 py-3">
                  <p class="text-[12px] text-fg-muted font-semibold">Fecha</p>
                  <p class="text-[14px] font-semibold text-fg mt-0.5">{{ selected.due || 'Sin fecha' }}</p>
                </div>
                <div class="rounded-[12px] bg-muted px-3.5 py-3">
                  <p class="text-[12px] text-fg-muted font-semibold">Prioridad</p>
                  <p class="text-[14px] font-semibold mt-0.5" :class="PRIORITY_TONE[selected.priority]">{{ PRIORITY_LABEL[selected.priority] }}</p>
                </div>
                <div class="rounded-[12px] bg-muted px-3.5 py-3">
                  <p class="text-[12px] text-fg-muted font-semibold">Energía</p>
                  <p class="text-[14px] font-semibold text-fg mt-0.5 capitalize">{{ selected.energy || 'Sin definir' }}</p>
                </div>
              </div>
              <div v-if="selected.tags?.length" class="flex flex-wrap gap-1.5 mb-4">
                <span v-for="tag in selected.tags" :key="tag" class="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-sky-soft text-sky-deep text-[12px] font-semibold">
                  <Tag class="size-3" :stroke-width="2" aria-hidden="true" />{{ tag }}
                </span>
              </div>
              <div>
                <p class="text-[13px] font-bold text-fg-muted mb-2">Subtareas</p>
                <div class="rounded-[12px] bg-muted px-3.5 py-4 text-[13.5px] text-fg-muted text-center">
                  Aún no hay subtareas. Pulsa <kbd class="px-1.5 py-0.5 rounded-md bg-card text-fg font-sans text-[11px]">⏎</kbd> para añadir.
                </div>
              </div>
            </div>
          </template>
          <AppEmptyHint v-else title="Elige una tarea" hint="Verás aquí toda la información, etiquetas y subtareas." />
        </AppCard>
      </template>

      <!-- KANBAN -->
      <template v-else>
        <div class="flex-1 min-h-0 overflow-x-auto scroll-area">
          <div class="grid grid-cols-[repeat(4,minmax(250px,1fr))] gap-3 h-full">
            <AppCard v-for="col in COLUMNS" :key="col.key" class="flex flex-col min-h-0 !p-3" :padded="false">
              <header class="flex items-center justify-between px-2 pt-1 pb-2 shrink-0">
                <div class="flex items-center gap-2">
                  <span class="grid place-items-center h-6 px-2 rounded-full text-[11px] font-bold" :class="col.tone">{{ grouped[col.key].length }}</span>
                  <h3 class="text-[14px] font-extrabold text-fg">{{ col.title }}</h3>
                </div>
                <button class="grid place-items-center size-7 rounded-[9px] text-fg-subtle hover:text-fg hover:bg-muted" aria-label="Añadir"><Plus class="size-4" :stroke-width="2" /></button>
              </header>
              <div class="flex-1 min-h-0 overflow-y-auto scroll-area flex flex-col gap-2">
                <article v-for="t in grouped[col.key]" :key="t.id" class="bg-muted rounded-[12px] p-3 cursor-grab active:cursor-grabbing hover:bg-inset transition-[background-color]">
                  <p class="text-[13.5px] font-semibold text-fg leading-snug">{{ t.title }}</p>
                  <div class="flex items-center justify-between mt-2 text-[11.5px] text-fg-muted">
                    <span class="font-semibold">{{ t.project }}</span>
                    <div class="flex items-center gap-1.5">
                      <span v-if="t.due" class="inline-flex items-center gap-1"><Clock class="size-3" aria-hidden="true" />{{ t.due }}</span>
                      <Flag v-if="t.priority > 0" class="size-3" :class="PRIORITY_TONE[t.priority]" :stroke-width="2.3" aria-hidden="true" />
                    </div>
                  </div>
                </article>
              </div>
            </AppCard>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.hibi-no-sb { scrollbar-width: none; }
.hibi-no-sb::-webkit-scrollbar { display: none; }
</style>
