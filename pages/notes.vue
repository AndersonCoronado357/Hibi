<script setup lang="ts">
import { Search, Plus, Folder, FolderOpen, Pin, Calendar, ChevronRight, ChevronLeft, ChevronDown, NotebookPen, Type, Trash2 } from '@lucide/vue'

useHead({ title: 'Hibi — Notas' })

interface NoteFolder { id: string; name: string; count: number; color: string }
const folders = ref<NoteFolder[]>([
  { id: 'f1', name: 'Diario', count: 12, color: '#5aa6d2' },
  { id: 'f2', name: 'Trabajo', count: 7, color: '#c5733f' },
  { id: 'f3', name: 'Ideas', count: 14, color: '#db8aa3' },
  { id: 'f4', name: 'Recetas', count: 5, color: '#34936a' },
  { id: 'f5', name: 'Lecturas', count: 9, color: '#7a63c0' },
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

let nextNoteId = 100

// Crear: la nota se crea VACÍA en la carpeta actual y se abre en el editor
// normal (no hay pantalla de creación aparte). El título se escribe ahí.
function createNote() {
  const id = 'n' + (nextNoteId++)
  notesData.value.unshift({
    id, folder: selectedFolder.value, title: '', content: '', preview: 'Sin contenido aún', updated: 'Ahora',
  })
  selectedNoteId.value = id
  mobileToolbarOpen.value = false
  mobileEditorOpen.value = true // en móvil abre el editor; en desktop es inocuo
}

// Eliminar nota. Si era la seleccionada, pasa a la primera de la carpeta.
function deleteNote(id: string) {
  const idx = notesData.value.findIndex(n => n.id === id)
  if (idx === -1) return
  notesData.value.splice(idx, 1)
  mobileEditorOpen.value = false
  if (selectedNoteId.value === id) selectedNoteId.value = filtered.value[0]?.id ?? null
}

// Eliminar carpeta (y sus notas). No se borra la última carpeta.
function deleteFolder(id: string) {
  if (folders.value.length <= 1) return
  notesData.value = notesData.value.filter(n => n.folder !== id)
  folders.value = folders.value.filter(f => f.id !== id)
  if (selectedFolder.value === id) {
    selectedFolder.value = folders.value[0]!.id
    selectedNoteId.value = filtered.value[0]?.id ?? null
  }
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

// Paneles colapsables (desktop)
const showFolders = ref(true)
const showList = ref(true)

// Móvil: drill-down al editor. Tocar una nota la abre a pantalla completa.
const mobileEditorOpen = ref(false)
const mobileToolbarOpen = ref(false)
function openNoteMobile(id: string) {
  selectedNoteId.value = id
  mobileToolbarOpen.value = false
  mobileEditorOpen.value = true
}

// Móvil: nivel carpetas → notas. Al inicio se ve la lista de carpetas;
// tocar una abre sus notas (con botón volver).
const mobileFolderOpen = ref(false)
function openFolderMobile(id: string) {
  selectedFolder.value = id
  creatingFolder.value = false
  mobileFolderOpen.value = true
}
const folderCount = (id: string) => notesData.value.filter(n => n.folder === id).length

// Crear carpeta: inline (sin pantalla aparte). Tocar "+" abre un mini panel
// con nombre + selector de color PERSONALIZADO (AppColorPicker hex).
let nextFolderId = 100
const creatingFolder = ref(false)
const newFolderName = ref('')
const newFolderColor = ref('#5aa6d2')
function startCreateFolder() {
  creatingFolder.value = true
  newFolderName.value = ''
  newFolderColor.value = '#5aa6d2'
  nextTick(() => {
    document.querySelectorAll<HTMLInputElement>('[data-folder-input]').forEach((el) => {
      if (el.offsetParent !== null) el.focus()
    })
  })
}
function confirmCreateFolder() {
  const name = newFolderName.value.trim()
  if (!name) { creatingFolder.value = false; showFolderColor.value = false; return }
  const id = 'f' + (nextFolderId++)
  folders.value.push({ id, name, count: 0, color: newFolderColor.value })
  selectedFolder.value = id
  creatingFolder.value = false
  newFolderName.value = ''
  showFolderColor.value = false
}
function cancelCreateFolder() { creatingFolder.value = false; newFolderName.value = ''; showFolderColor.value = false }

// Selector de color de carpeta: botón swatch que abre un popover (teleport).
// Posicionamiento manual con altura FIJA conocida → no se sale de pantalla.
const POP_W = 280
const POP_H = 290
const showFolderColor = ref(false)
const folderColorPos = ref({ top: 0, left: 0 })
function toggleFolderColor(e: MouseEvent) {
  if (showFolderColor.value) { showFolderColor.value = false; return }
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const vw = window.innerWidth, vh = window.innerHeight
  let left = rect.left
  if (left + POP_W > vw - 12) left = vw - 12 - POP_W
  if (left < 12) left = 12
  // Por defecto abajo del swatch; si no cabe, arriba; si tampoco, clamp.
  let top = rect.bottom + 6
  if (top + POP_H > vh - 12) top = rect.top - POP_H - 6
  if (top < 12) top = Math.max(12, vh - 12 - POP_H)
  folderColorPos.value = { top, left }
  showFolderColor.value = true
}
function onFolderColorOutside(e: MouseEvent) {
  const t = e.target as HTMLElement
  if (showFolderColor.value && !t.closest('[data-folder-color-pop]') && !t.closest('[data-folder-color-trigger]')) {
    showFolderColor.value = false
  }
}
onMounted(() => { if (typeof document !== 'undefined') document.addEventListener('click', onFolderColorOutside, true) })
onBeforeUnmount(() => { if (typeof document !== 'undefined') document.removeEventListener('click', onFolderColorOutside, true) })
</script>

<template>
  <div class="h-full w-full flex flex-col md:flex-row gap-3 px-4 md:px-7 py-5 overflow-hidden relative">
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
          <button class="grid place-items-center size-7 rounded-[9px] text-fg-subtle hover:text-fg hover:bg-muted" :aria-label="creatingFolder ? 'Cerrar' : 'Nueva carpeta'" @click="creatingFolder ? cancelCreateFolder() : startCreateFolder()"><Plus class="size-4 transition-[transform] duration-200" :class="creatingFolder ? 'rotate-45' : ''" :stroke-width="2" /></button>
        </div>
        <ul class="flex-1 overflow-y-auto scroll-area flex flex-col gap-0.5 px-2 pb-3">
          <!-- Mini panel inline de nueva carpeta: nombre + color personalizado -->
          <li v-if="creatingFolder" class="px-1 pb-2">
            <div class="rounded-[12px] bg-muted p-2.5 flex flex-col gap-2.5">
              <div class="flex items-center gap-2">
                <input data-folder-input v-model="newFolderName" type="text" placeholder="Nombre de la carpeta"
                  class="flex-1 min-w-0 h-9 rounded-[8px] bg-card px-2.5 text-[14px] font-semibold text-fg outline-none placeholder:text-fg-subtle"
                  @keydown.enter.prevent="confirmCreateFolder" @keydown.esc="cancelCreateFolder" />
                <button type="button" data-folder-color-trigger class="shrink-0 size-9 rounded-[8px]" :style="{ background: newFolderColor }" aria-label="Color de la carpeta" @click.stop="toggleFolderColor" />
              </div>
              <button type="button" class="h-9 rounded-[10px] bg-sky text-[#1f4661] text-[13px] font-bold" @click="confirmCreateFolder">Crear carpeta</button>
            </div>
          </li>
          <li v-for="f in folders" :key="f.id" class="relative group/folder">
            <button type="button"
              class="w-full flex items-center gap-2.5 pl-2.5 pr-9 py-2 rounded-[10px] transition-[background-color]"
              :class="selectedFolder === f.id ? 'bg-sky-soft text-sky-deep' : 'text-fg-muted hover:bg-muted hover:text-fg'"
              @click="selectedFolder = f.id"
            >
              <component :is="selectedFolder === f.id ? FolderOpen : Folder" class="size-[17px]" :style="{ color: f.color }" :stroke-width="1.8" aria-hidden="true" />
              <span class="flex-1 text-left text-[14px] font-semibold truncate">{{ f.name }}</span>
              <span class="text-[11px] font-bold text-fg-subtle group-hover/folder:opacity-0 transition-opacity">{{ f.count }}</span>
            </button>
            <button v-if="folders.length > 1" type="button"
              class="absolute top-1/2 right-1.5 -translate-y-1/2 grid place-items-center size-7 rounded-[8px] text-fg-subtle opacity-0 group-hover/folder:opacity-100 hover:text-pink-deep hover:bg-pink-soft transition-[opacity,background-color,color]"
              aria-label="Eliminar carpeta" @click.stop="deleteFolder(f.id)">
              <Trash2 class="size-[14px]" :stroke-width="2" />
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
              class="w-full h-10 rounded-[12px] bg-muted pl-10 pr-3 text-[14px] text-fg outline-none" />
          </div>
          <div class="flex items-center justify-between px-1">
            <h3 class="text-[13px] font-bold text-fg-muted">{{ filtered.length }} notas</h3>
            <button class="inline-flex items-center gap-1 text-sky-deep text-[12.5px] font-bold hover:underline" @click="createNote">
              <Plus class="size-3.5" :stroke-width="2.3" />Nueva
            </button>
          </div>
        </div>
        <div class="flex-1 min-h-0 overflow-y-auto scroll-area px-2 pb-3">
          <ul class="flex flex-col gap-1">
            <li v-for="n in filtered" :key="n.id" class="relative group/note">
              <button type="button"
                class="w-full text-left p-3 rounded-[12px] transition-[background-color]"
                :class="selectedNoteId === n.id ? 'bg-sky-soft' : 'hover:bg-muted'"
                @click="selectedNoteId = n.id"
              >
                <div class="flex items-start gap-2 pr-7">
                  <Pin v-if="n.pinned" class="shrink-0 size-3.5 text-pink-deep mt-0.5" :stroke-width="2.3" aria-label="Fijada" />
                  <h4 class="text-[14px] font-bold text-fg truncate flex-1">{{ n.title }}</h4>
                </div>
                <p class="text-[12.5px] text-fg-muted line-clamp-2 mt-1 leading-snug">{{ n.preview }}</p>
                <p class="text-[11px] text-fg-subtle mt-1.5 inline-flex items-center gap-1"><Calendar class="size-3" aria-hidden="true" />{{ n.updated }}</p>
              </button>
              <button type="button"
                class="absolute top-2 right-2 grid place-items-center size-7 rounded-full text-fg-subtle opacity-0 group-hover/note:opacity-100 hover:text-pink-deep hover:bg-pink-soft transition-[opacity,background-color,color]"
                aria-label="Eliminar nota" @click.stop="deleteNote(n.id)">
                <Trash2 class="size-[14px]" :stroke-width="2" />
              </button>
            </li>
          </ul>
        </div>
      </template>
    </AppCard>

    <!-- Editor -->
    <AppCard class="z-10 hidden md:flex flex-1 min-w-0 flex-col overflow-hidden relative" :padded="false">
      <div v-if="selected" class="flex-1 min-h-0 flex flex-col px-7 py-5">
        <!-- Breadcrumb + eliminar -->
        <div class="flex items-center gap-2 text-[12px] text-fg-muted font-semibold mb-3 shrink-0">
          <Folder class="size-3.5" :stroke-width="1.9" aria-hidden="true" />
          {{ folders.find(f => f.id === selected!.folder)?.name }}
          <ChevronRight class="size-3" aria-hidden="true" />
          <span>{{ selected!.updated }}</span>
          <button type="button" class="ml-auto grid place-items-center size-8 rounded-full text-fg-subtle hover:text-pink-deep hover:bg-pink-soft transition-[background-color,color]" aria-label="Eliminar nota" @click="deleteNote(selected!.id)">
            <Trash2 class="size-4" :stroke-width="2" />
          </button>
        </div>
        <!-- Título editable -->
        <h1
          class="hibi-title-edit text-[34px] font-extrabold text-fg leading-tight outline-none mb-4 shrink-0"
          contenteditable="true" spellcheck="false"
          data-placeholder="Título de la nota"
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

    <!-- ───────────── MÓVIL: carpetas (lista) → notas (drill) → editor ───────────── -->
    <div class="md:hidden relative z-10 flex flex-col flex-1 min-h-0 w-full">
      <!-- NIVEL 1: lista de carpetas -->
      <div v-if="!mobileFolderOpen" class="flex flex-col flex-1 min-h-0">
        <div class="shrink-0 flex items-center justify-between pb-3">
          <h2 class="text-[15px] font-extrabold text-fg">Carpetas</h2>
          <button type="button" class="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-sky text-[#1f4661] text-[13px] font-bold active:bg-sky-deep active:text-white" @click="creatingFolder ? cancelCreateFolder() : startCreateFolder()">
            <Plus class="size-4 transition-[transform] duration-200" :class="creatingFolder ? 'rotate-45' : ''" :stroke-width="2.2" /> Carpeta
          </button>
        </div>

        <!-- Mini panel nueva carpeta: nombre + color -->
        <div v-if="creatingFolder" class="shrink-0 rounded-[14px] bg-muted p-3 mb-3 flex flex-col gap-3">
          <div class="flex items-center gap-2">
            <input data-folder-input v-model="newFolderName" type="text" placeholder="Nombre de la carpeta"
              class="flex-1 min-w-0 h-10 rounded-[10px] bg-card px-3 text-[14px] font-semibold text-fg outline-none placeholder:text-fg-subtle"
              @keydown.enter.prevent="confirmCreateFolder" @keydown.esc="cancelCreateFolder" />
            <button type="button" data-folder-color-trigger class="shrink-0 size-10 rounded-[10px]" :style="{ background: newFolderColor }" aria-label="Color de la carpeta" @click.stop="toggleFolderColor" />
          </div>
          <button type="button" class="h-10 rounded-[12px] bg-sky text-[#1f4661] text-[13px] font-bold" @click="confirmCreateFolder">Crear carpeta</button>
        </div>

        <div class="flex-1 min-h-0 overflow-y-auto scroll-area">
          <ul class="flex flex-col gap-2 pb-2">
            <li v-for="f in folders" :key="f.id">
              <div role="button" tabindex="0"
                class="w-full flex items-center gap-3 p-3.5 rounded-[14px] bg-card transition-[background-color] active:bg-muted text-left cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-sky-deep"
                @click="openFolderMobile(f.id)"
                @keydown.enter.prevent="openFolderMobile(f.id)"
                @keydown.space.prevent="openFolderMobile(f.id)">
                <span class="grid place-items-center size-11 rounded-[13px] shrink-0" :style="{ background: f.color + '22', color: f.color }">
                  <Folder class="size-[20px]" :stroke-width="1.9" aria-hidden="true" />
                </span>
                <div class="flex-1 min-w-0">
                  <p class="text-[15px] font-extrabold text-fg break-words">{{ f.name }}</p>
                  <p class="text-[12.5px] text-fg-muted mt-0.5">{{ folderCount(f.id) }} {{ folderCount(f.id) === 1 ? 'nota' : 'notas' }}</p>
                </div>
                <button v-if="folders.length > 1" type="button" class="grid place-items-center size-8 rounded-[10px] text-fg-subtle active:text-pink-deep active:bg-pink-soft shrink-0" aria-label="Eliminar carpeta" @click.stop="deleteFolder(f.id)">
                  <Trash2 class="size-[15px]" :stroke-width="2" />
                </button>
                <ChevronRight class="size-[18px] text-fg-subtle shrink-0" :stroke-width="2" aria-hidden="true" />
              </div>
            </li>
          </ul>
        </div>
      </div>

      <!-- NIVEL 2: notas de la carpeta abierta -->
      <div v-else class="flex flex-col flex-1 min-h-0">
        <div class="shrink-0 flex items-center gap-2 pb-3">
          <button type="button" class="grid place-items-center size-9 rounded-full bg-muted text-fg-muted shrink-0" aria-label="Volver a carpetas" @click="mobileFolderOpen = false">
            <ChevronLeft class="size-[18px]" :stroke-width="2" />
          </button>
          <div class="flex-1 min-w-0 flex items-center gap-2">
            <FolderOpen class="size-[18px] shrink-0" :style="{ color: folders.find(f => f.id === selectedFolder)?.color }" :stroke-width="1.9" aria-hidden="true" />
            <h2 class="text-[17px] font-extrabold text-fg truncate">{{ folders.find(f => f.id === selectedFolder)?.name }}</h2>
          </div>
          <AppButton variant="primary" size="sm" class="shrink-0" @click="createNote">
            <template #icon><Plus class="size-[16px]" :stroke-width="2.3" /></template>Nueva
          </AppButton>
        </div>

        <!-- Buscar -->
        <div class="shrink-0 relative pb-3">
          <Search class="absolute left-3.5 top-[18px] -translate-y-1/2 size-[16px] text-fg-subtle" :stroke-width="1.8" aria-hidden="true" />
          <label for="notes-search-mobile" class="sr-only">Buscar notas</label>
          <input id="notes-search-mobile" v-model="search" type="text" placeholder="Buscar notas…"
            class="w-full h-10 rounded-[12px] bg-muted pl-10 pr-3 text-[14px] text-fg outline-none" />
        </div>

        <!-- Lista de notas -->
        <div class="flex-1 min-h-0 overflow-y-auto scroll-area">
          <ul v-if="filtered.length" class="flex flex-col gap-2 pb-2">
            <li v-for="n in filtered" :key="n.id">
              <button type="button"
                class="w-full text-left p-3.5 rounded-[14px] bg-card transition-[background-color] active:bg-muted"
                @click="openNoteMobile(n.id)">
                <div class="flex items-start gap-2">
                  <Pin v-if="n.pinned" class="shrink-0 size-3.5 text-pink-deep mt-1" :stroke-width="2.3" aria-label="Fijada" />
                  <h4 class="text-[15px] font-bold text-fg break-words flex-1">{{ n.title }}</h4>
                </div>
                <p class="text-[13px] text-fg-muted line-clamp-2 mt-1 leading-snug">{{ n.preview }}</p>
                <p class="text-[11px] text-fg-subtle mt-2 inline-flex items-center gap-1"><Calendar class="size-3" aria-hidden="true" />{{ n.updated }}</p>
              </button>
            </li>
          </ul>
          <div v-else class="h-full flex flex-col items-center justify-center text-center gap-3 text-fg-subtle">
            <HibiCloud :size="80" face class="text-sky-soft opacity-70" aria-hidden="true" />
            <p class="text-[14px] font-semibold">No hay notas en esta carpeta</p>
            <button type="button" class="text-[13px] font-bold text-sky-deep" @click="createNote">Crear la primera</button>
          </div>
        </div>
      </div>

      <!-- Editor a pantalla completa (drill-down) -->
      <Transition name="hibi-drill">
        <div v-if="mobileEditorOpen && selected" class="absolute inset-0 z-20 bg-base flex flex-col">
          <header class="shrink-0 flex items-center gap-2 pb-3">
            <button type="button" class="grid place-items-center size-9 rounded-full text-fg-muted hover:bg-muted shrink-0" aria-label="Volver a las notas" @click="mobileEditorOpen = false">
              <ChevronLeft class="size-[18px]" :stroke-width="2" />
            </button>
            <div class="flex-1 min-w-0 flex items-center gap-1.5 text-[12px] text-fg-muted font-semibold">
              <Folder class="size-3.5 shrink-0" :stroke-width="1.9" aria-hidden="true" />
              <span class="truncate">{{ folders.find(f => f.id === selected!.folder)?.name }}</span>
              <span class="text-fg-subtle shrink-0">· {{ selected!.updated }}</span>
            </div>
            <!-- Eliminar nota -->
            <button type="button"
              class="shrink-0 grid place-items-center size-9 rounded-[10px] text-fg-muted hover:text-pink-deep hover:bg-pink-soft transition-[background-color,color]"
              aria-label="Eliminar nota" @click="deleteNote(selected!.id)">
              <Trash2 class="size-[16px]" :stroke-width="2" />
            </button>
            <!-- Botón Formato a la derecha del header -->
            <button type="button"
              class="shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-[10px] bg-muted text-fg-muted hover:text-fg transition-[color]"
              :aria-expanded="mobileToolbarOpen"
              @click="mobileToolbarOpen = !mobileToolbarOpen">
              <Type class="size-[15px]" :stroke-width="2" aria-hidden="true" />
              <ChevronDown class="size-3.5 transition-[transform] duration-200" :class="mobileToolbarOpen ? 'rotate-180' : ''" :stroke-width="2.2" aria-hidden="true" />
            </button>
          </header>
          <AppCard class="flex-1 min-h-0 flex flex-col !p-0 overflow-hidden">
            <div class="flex-1 min-h-0 flex flex-col px-4 py-4">
              <h1 class="hibi-title-edit text-[24px] font-extrabold text-fg leading-tight outline-none mb-3 shrink-0 break-words"
                contenteditable="true" spellcheck="false" data-placeholder="Título de la nota" @blur="onEditTitle">{{ selected!.title }}</h1>
              <div class="flex-1 min-h-0 flex">
                <AppRichEditor :key="selected!.id" v-model:toolbar-open="mobileToolbarOpen" :model-value="selected!.content" placeholder="Empieza a escribir…" @update:model-value="onEditContent" />
              </div>
            </div>
          </AppCard>
        </div>
      </Transition>
    </div>

    <!-- Popover de color de carpeta (teleport para escapar del overflow) -->
    <ClientOnly>
      <Teleport to="body">
        <Transition name="hibi-pop">
          <div v-if="showFolderColor" data-folder-color-pop
            class="fixed z-[200] w-[280px] h-[290px] rounded-[16px] p-3"
            :style="{ top: folderColorPos.top + 'px', left: folderColorPos.left + 'px', background: 'var(--bg-pop)' }">
            <AppColorPicker v-model="newFolderColor" format="hex" hide-presets />
          </div>
        </Transition>
      </Teleport>
    </ClientOnly>
  </div>
</template>

<style scoped>
.hibi-no-sb { scrollbar-width: none; }
.hibi-no-sb::-webkit-scrollbar { display: none; }

/* Drill-down movil: el editor entra deslizando desde la derecha. */
.hibi-drill-enter-active,
.hibi-drill-leave-active {
  transition: transform 280ms cubic-bezier(0.32, 0.72, 0, 1);
  will-change: transform;
}
.hibi-drill-enter-from,
.hibi-drill-leave-to {
  transform: translateX(100%);
}
@media (prefers-reduced-motion: reduce) {
  .hibi-drill-enter-active,
  .hibi-drill-leave-active { transition: none; }
}

/* Popover de color: fade + leve desplazamiento. */
.hibi-pop-enter-active, .hibi-pop-leave-active {
  transition: opacity 0.16s var(--ease-out, ease), transform 0.16s var(--ease-out, ease);
  transform-origin: top center;
}
.hibi-pop-enter-from, .hibi-pop-leave-to { opacity: 0; transform: translateY(-4px); }

/* Placeholder del título editable cuando la nota es nueva (título vacío). */
.hibi-title-edit:empty:before {
  content: attr(data-placeholder);
  color: var(--text-subtle);
  pointer-events: none;
}
</style>
