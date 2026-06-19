<script setup lang="ts">
import { Search, Plus, Folder, FolderOpen, Pin, Calendar, ChevronRight, ChevronLeft, NotebookPen } from '@lucide/vue'

useHead({ title: 'Hibi — Notas' })

interface NoteFolder { id: string; name: string; count: number; color: string }
const folders = ref<NoteFolder[]>([
  { id: 'f1', name: 'Diario', count: 12, color: 'text-sky-deep' },
  { id: 'f2', name: 'Trabajo', count: 7, color: 'text-[#c5733f]' },
  { id: 'f3', name: 'Ideas', count: 14, color: 'text-pink-deep' },
  { id: 'f4', name: 'Recetas', count: 5, color: 'text-[#34936a]' },
  { id: 'f5', name: 'Lecturas', count: 9, color: 'text-[#7a63c0]' },
])

interface Note { id: string; folder: string; title: string; content: string; preview: string; updated: string; pinned?: boolean }
const notesData = ref<Note[]>([
  { id: 'n1', folder: 'f3', title: 'Idea: planificador de viajes con IA',
    content: '<p>Una app que reciba destino y preferencias y proponga itinerario día por día.</p><h2>Funcionalidades clave</h2><ul><li>Sugerencias por estación</li><li>Reservas inteligentes</li><li>Notas compartidas</li></ul>',
    preview: 'Una app que reciba destino y preferencias y proponga itinerario…', updated: 'Hoy 14:32', pinned: true },
  { id: 'n2', folder: 'f1', title: 'Domingo tranquilo',
    content: '<p>Mañana de café con libro. La luz entraba muy suave por la ventana.</p>',
    preview: 'Mañana de café con libro…', updated: 'Ayer 20:10' },
  { id: 'n3', folder: 'f2', title: 'Notas de la reunión Q3',
    content: '<h2>Puntos clave</h2><ul><li>Lanzamiento octubre</li><li>Equipos asignados</li><li>Retro mensual</li></ul>',
    preview: 'Puntos clave: lanzamiento octubre…', updated: 'Vie 17:45' },
  { id: 'n4', folder: 'f4', title: 'Pasta al limón',
    content: '<p>Pasta, 1 limón (ralladura + zumo), parmesano, pimienta negra, perejil.</p>',
    preview: 'Pasta, 1 limón…', updated: '2 jun' },
  { id: 'n5', folder: 'f5', title: 'El infinito en un junco',
    content: '<p>Capítulo 4, el papiro y la memoria.</p><blockquote>Anotar la cita sobre Alejandría.</blockquote>',
    preview: 'Capítulo 4, el papiro y la memoria…', updated: '28 may' },
])
const selectedFolder = ref('f3')
const selectedNoteId = ref<string | null>('n1')
const filtered = computed(() => notesData.value.filter(n => n.folder === selectedFolder.value))
const selected = computed<Note | null>(() => notesData.value.find(n => n.id === selectedNoteId.value) || null)
const search = ref('')

const view = ref<'list' | 'create'>('list')
const newTitle = ref('')
const newFolder = ref('f3')
const newContent = ref('')
const FOLDER_OPTS = computed(() => folders.value.map(f => ({ value: f.id, label: f.name })))
let nextNoteId = 100

function openCreate() {
  newTitle.value = ''
  newFolder.value = selectedFolder.value
  newContent.value = ''
  view.value = 'create'
}
function cancelCreate() { view.value = 'list' }
function saveNote() {
  const t = newTitle.value.trim(); if (!t) return
  const id = 'n' + (nextNoteId++)
  const stripped = newContent.value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 140) || 'Sin contenido aún'
  notesData.value.unshift({
    id, folder: newFolder.value, title: t,
    content: newContent.value, preview: stripped, updated: 'Ahora',
  })
  selectedFolder.value = newFolder.value
  selectedNoteId.value = id
  view.value = 'list'
}

// Edición en vivo de la nota seleccionada
function onEditContent(html: string) {
  if (!selected.value) return
  selected.value.content = html
  selected.value.preview = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 140)
  selected.value.updated = 'Ahora'
}
function onEditTitle(e: Event) {
  if (!selected.value) return
  const v = (e.target as HTMLElement).innerText.trim()
  if (v) selected.value.title = v
}

// Paneles colapsables
const showFolders = ref(true)
const showList = ref(true)
</script>

<template>
  <!-- VISTA DE CREACIÓN -->
  <AppCreateView v-if="view === 'create'"
    title="Nueva nota"
    subtitle="Escribe con formato enriquecido"
    :disabled="!newTitle.trim()"
    @close="cancelCreate" @save="saveNote">
    <div class="flex flex-col gap-2">
      <label class="text-[12.5px] font-bold text-fg-muted px-1">Título</label>
      <input v-model="newTitle" type="text" placeholder="Título de la nota" autofocus
        class="w-full h-14 rounded-[14px] bg-muted focus:bg-inset px-4 text-[20px] font-extrabold text-fg outline-none placeholder:text-fg-subtle" />
    </div>
    <div class="flex flex-col gap-2">
      <label class="text-[12.5px] font-bold text-fg-muted px-1">Carpeta</label>
      <AppSelect v-model="newFolder" :options="FOLDER_OPTS" placeholder="Carpeta" />
    </div>
    <div class="flex flex-col gap-2 flex-1 min-h-[400px]">
      <label class="text-[12.5px] font-bold text-fg-muted px-1">Contenido</label>
      <div class="rounded-[14px] bg-card p-3 flex-1 min-h-[400px] flex">
        <AppRichEditor :model-value="newContent" @update:model-value="newContent = $event" placeholder="Empieza a escribir, usa la barra para dar formato…" min-height="360px" />
      </div>
    </div>
  </AppCreateView>

  <!-- VISTA NORMAL -->
  <div v-else class="h-full w-full flex flex-col md:flex-row gap-3 px-4 md:px-7 py-5 overflow-hidden relative">
    <!-- Decoración cute -->
    <HibiCloud :size="150" float :duration="8" class="hidden md:block absolute -top-6 -right-8 text-pink-soft opacity-15 pointer-events-none z-40" aria-hidden="true" />
    <HibiCloud :size="90"  float :duration="10" :delay="1.2" class="hidden md:block absolute bottom-6 -left-6 text-sky-soft opacity-15 pointer-events-none z-40" aria-hidden="true" />
    <HibiSparkle :size="18" twinkle :duration="2.4" class="hidden md:block absolute top-[14%] left-[12%] text-fg-subtle opacity-25 pointer-events-none z-40" />
    <HibiSparkle :size="14" twinkle :duration="3" :delay="0.8" class="hidden md:block absolute bottom-[24%] right-[10%] text-fg-subtle opacity-25 pointer-events-none z-40" />
    <HibiHeart :size="16" beat :duration="2.6" class="hidden md:block absolute top-[40%] right-[6%] text-fg-subtle opacity-25 pointer-events-none z-40" />

    <!-- Panel carpetas: UNA sola card con ancho reactivo para que el colapso
         anime suavemente. El contenido del modo colapsado/expandido se
         intercambia con v-show. -->
    <AppCard
      class="hibi-collapsible relative z-10 hidden md:flex flex-col shrink-0 overflow-hidden"
      :class="showFolders ? 'w-[220px]' : 'w-[40px] items-center justify-center cursor-pointer hover:bg-muted'"
      :padded="false"
      @click="!showFolders && (showFolders = true)"
    >
      <!-- Modo COLAPSADO: solo el botón con icono -->
      <button v-show="!showFolders" type="button" class="grid place-items-center size-7 rounded-full text-fg-muted hover:text-fg" title="Mostrar carpetas">
        <NotebookPen class="size-[16px]" :stroke-width="1.9" />
      </button>

      <!-- Modo EXPANDIDO: panel completo -->
      <template v-if="showFolders">
        <button type="button"
          class="absolute top-1/2 -right-3 -translate-y-1/2 z-20 grid place-items-center size-7 rounded-full bg-card text-fg-muted hover:text-fg hover:bg-muted transition-[background-color,color]"
          title="Ocultar carpetas"
          @click.stop="showFolders = false">
          <ChevronLeft class="size-[14px]" :stroke-width="2.4" />
        </button>
        <div class="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
          <div class="flex items-center gap-2">
            <HibiCloudIcon :size="44" :icon="NotebookPen" :icon-size="16" cloud-color="text-sky-soft" icon-color="text-sky-deep" :icon-stroke="1.9" class="shrink-0" />
            <h2 class="text-[14px] font-extrabold text-fg">Carpetas</h2>
          </div>
          <button class="grid place-items-center size-7 rounded-[9px] text-fg-subtle hover:text-fg hover:bg-muted" aria-label="Nueva carpeta"><Plus class="size-4" :stroke-width="2" /></button>
        </div>
        <ul class="flex-1 overflow-y-auto scroll-area flex flex-col gap-0.5 px-2 pb-3">
          <li v-for="f in folders" :key="f.id">
            <button type="button"
              class="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] transition-[background-color]"
              :class="selectedFolder === f.id ? 'bg-sky-soft text-sky-deep' : 'text-fg-muted hover:bg-muted hover:text-fg'"
              @click="selectedFolder = f.id"
            >
              <component :is="selectedFolder === f.id ? FolderOpen : Folder" class="size-[17px]" :class="f.color" :stroke-width="1.8" aria-hidden="true" />
              <span class="flex-1 text-left text-[14px] font-semibold truncate">{{ f.name }}</span>
              <span class="text-[11px] font-bold text-fg-subtle">{{ f.count }}</span>
            </button>
          </li>
        </ul>
      </template>
    </AppCard>

    <!-- Panel lista de notas: UNA sola card con ancho reactivo (colapso animado) -->
    <AppCard
      class="hibi-collapsible relative z-10 hidden md:flex flex-col shrink-0 overflow-hidden"
      :class="showList ? 'md:w-[300px] lg:w-[320px]' : 'w-[40px] items-center justify-center cursor-pointer hover:bg-muted'"
      :padded="false"
      @click="!showList && (showList = true)"
    >
      <!-- Modo COLAPSADO -->
      <button v-show="!showList" type="button" class="grid place-items-center size-7 rounded-full text-fg-muted hover:text-fg" title="Mostrar lista">
        <ChevronRight class="size-[14px]" :stroke-width="2.4" />
      </button>

      <!-- Modo EXPANDIDO -->
      <template v-if="showList">
        <button type="button"
          class="absolute top-1/2 -right-3 -translate-y-1/2 z-20 grid place-items-center size-7 rounded-full bg-card text-fg-muted hover:text-fg hover:bg-muted transition-[background-color,color]"
          title="Ocultar lista"
          @click.stop="showList = false">
          <ChevronLeft class="size-[14px]" :stroke-width="2.4" />
        </button>
        <div class="px-4 pt-4 pb-3 shrink-0 flex flex-col gap-3">
          <div class="relative">
            <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 size-[16px] text-fg-subtle" :stroke-width="1.8" aria-hidden="true" />
            <label for="notes-search" class="sr-only">Buscar notas</label>
            <input id="notes-search" v-model="search" type="text" placeholder="Buscar notas…"
              class="w-full h-10 rounded-[12px] bg-muted focus:bg-inset pl-10 pr-3 text-[14px] text-fg outline-none transition-[background-color]" />
          </div>
          <div class="flex items-center justify-between px-1">
            <h3 class="text-[13px] font-bold text-fg-muted">{{ filtered.length }} notas</h3>
            <button class="inline-flex items-center gap-1 text-sky-deep text-[12.5px] font-bold hover:underline" @click="openCreate">
              <Plus class="size-3.5" :stroke-width="2.3" />Nueva
            </button>
          </div>
        </div>
        <div class="flex-1 min-h-0 overflow-y-auto scroll-area px-2 pb-3">
          <ul class="flex flex-col gap-1">
            <li v-for="n in filtered" :key="n.id">
              <button type="button"
                class="w-full text-left p-3 rounded-[12px] transition-[background-color]"
                :class="selectedNoteId === n.id ? 'bg-sky-soft' : 'hover:bg-muted'"
                @click="selectedNoteId = n.id"
              >
                <div class="flex items-start gap-2">
                  <Pin v-if="n.pinned" class="shrink-0 size-3.5 text-pink-deep mt-0.5" :stroke-width="2.3" aria-label="Fijada" />
                  <h4 class="text-[14px] font-bold text-fg truncate flex-1">{{ n.title }}</h4>
                </div>
                <p class="text-[12.5px] text-fg-muted line-clamp-2 mt-1 leading-snug">{{ n.preview }}</p>
                <p class="text-[11px] text-fg-subtle mt-1.5 inline-flex items-center gap-1"><Calendar class="size-3" aria-hidden="true" />{{ n.updated }}</p>
              </button>
            </li>
          </ul>
        </div>
      </template>
    </AppCard>

    <!-- Editor -->
    <AppCard class="z-10 hidden md:flex flex-1 min-w-0 flex-col overflow-hidden relative" :padded="false">
      <div v-if="selected" class="flex-1 min-h-0 flex flex-col px-7 py-5">
        <!-- Breadcrumb -->
        <div class="flex items-center gap-2 text-[12px] text-fg-muted font-semibold mb-3 shrink-0">
          <Folder class="size-3.5" :stroke-width="1.9" aria-hidden="true" />
          {{ folders.find(f => f.id === selected!.folder)?.name }}
          <ChevronRight class="size-3" aria-hidden="true" />
          <span>{{ selected!.updated }}</span>
        </div>
        <!-- Título editable -->
        <h1
          class="text-[34px] font-extrabold text-fg leading-tight outline-none mb-4 shrink-0"
          contenteditable="true" spellcheck="false"
          @blur="onEditTitle"
        >{{ selected!.title }}</h1>
        <!-- Editor enriquecido ocupando el resto del ancho y alto -->
        <div class="flex-1 min-h-0 flex">
          <AppRichEditor
            :key="selected!.id"
            :model-value="selected!.content"
            placeholder="Empieza a escribir…"
            @update:model-value="onEditContent" />
        </div>
      </div>
      <AppEmptyHint v-else title="Elige una nota" hint="O crea una nueva con el botón “+ Nueva”." />
    </AppCard>
  </div>
</template>
