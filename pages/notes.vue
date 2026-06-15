<script setup lang="ts">
import { Search, Plus, Folder, FolderOpen, Pin, Calendar, ChevronRight, NotebookPen } from '@lucide/vue'

useHead({ title: 'Hibi — Notas' })

interface Folder { id: string; name: string; count: number; color: string }
const folders: Folder[] = [
  { id: 'f1', name: 'Diario', count: 12, color: 'text-sky-deep' },
  { id: 'f2', name: 'Trabajo', count: 7, color: 'text-[#c5733f]' },
  { id: 'f3', name: 'Ideas', count: 14, color: 'text-pink-deep' },
  { id: 'f4', name: 'Recetas', count: 5, color: 'text-[#34936a]' },
  { id: 'f5', name: 'Lecturas', count: 9, color: 'text-[#7a63c0]' },
]

interface Note { id: string; folder: string; title: string; preview: string; updated: string; pinned?: boolean }
const notesData = ref<Note[]>([
  { id: 'n1', folder: 'f3', title: 'Idea: planificador de viajes con IA', preview: 'Una app que reciba destino y preferencias y proponga itinerario día por día…', updated: 'Hoy 14:32', pinned: true },
  { id: 'n2', folder: 'f1', title: 'Domingo tranquilo', preview: 'Mañana de café con libro. La luz entraba muy suave por la ventana…', updated: 'Ayer 20:10' },
  { id: 'n3', folder: 'f2', title: 'Notas de la reunión Q3', preview: 'Puntos clave: lanzamiento octubre, equipos asignados, retro mensual…', updated: 'Vie 17:45' },
  { id: 'n4', folder: 'f4', title: 'Pasta al limón', preview: 'Pasta, 1 limón (ralladura + zumo), parmesano, pimienta negra, perejil…', updated: '2 jun' },
  { id: 'n5', folder: 'f5', title: 'El infinito en un junco', preview: 'Capítulo 4, el papiro y la memoria. Anotar la cita sobre Alejandría…', updated: '28 may' },
])
const selectedFolder = ref('f3')
const selectedNoteId = ref<string | null>('n1')
const filtered = computed(() => notesData.value.filter(n => n.folder === selectedFolder.value))
const selected = computed(() => notesData.value.find(n => n.id === selectedNoteId.value))
const search = ref('')
let nextNoteId = 100
function createNote() {
  const id = 'n' + (nextNoteId++)
  notesData.value.unshift({ id, folder: selectedFolder.value, title: 'Nueva nota', preview: 'Empieza a escribir aquí…', updated: 'Ahora' })
  selectedNoteId.value = id
}
</script>

<template>
  <div class="h-full flex flex-col md:flex-row gap-3 px-4 md:px-7 py-5">
    <!-- Carpetas en card -->
    <AppCard class="hidden md:flex flex-col w-[220px] shrink-0" :padded="false">
      <div class="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
        <div class="flex items-center gap-2">
          <span class="grid place-items-center size-8 rounded-[10px] bg-sky-soft text-sky-deep" aria-hidden="true"><NotebookPen class="size-4" :stroke-width="1.9" /></span>
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
    </AppCard>

    <!-- Lista en card -->
    <AppCard class="md:w-[320px] shrink-0 flex flex-col md:max-w-[340px]" :padded="false">
      <div class="px-4 pt-4 pb-3 shrink-0 flex flex-col gap-3">
        <div class="relative">
          <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 size-[16px] text-fg-subtle" :stroke-width="1.8" aria-hidden="true" />
          <label for="notes-search" class="sr-only">Buscar notas</label>
          <input id="notes-search" v-model="search" type="text" placeholder="Buscar notas…"
            class="w-full h-10 rounded-[12px] bg-muted focus:bg-inset pl-10 pr-3 text-[14px] text-fg outline-none transition-[background-color]" />
        </div>
        <div class="flex items-center justify-between px-1">
          <h3 class="text-[13px] font-bold text-fg-muted">{{ filtered.length }} notas</h3>
          <button class="text-sky-deep text-[12.5px] font-bold hover:underline" @click="createNote">+ Nueva</button>
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
    </AppCard>

    <!-- Editor en card -->
    <AppCard class="hidden md:flex flex-1 min-w-0 flex-col overflow-hidden" :padded="false">
      <template v-if="selected">
        <div class="flex-1 min-h-0 overflow-y-auto scroll-area px-7 py-7">
          <div class="max-w-[660px] mx-auto w-full">
            <div class="flex items-center gap-2 text-[12px] text-fg-muted font-semibold mb-3">
              <Folder class="size-3.5" :stroke-width="1.9" aria-hidden="true" />
              {{ folders.find(f => f.id === selected.folder)?.name }}
              <ChevronRight class="size-3" aria-hidden="true" />
              <span>{{ selected.updated }}</span>
            </div>
            <h1 class="text-[34px] font-extrabold text-fg leading-tight">{{ selected.title }}</h1>
            <p class="text-fg-muted text-[15px] mt-4 leading-relaxed">{{ selected.preview }}</p>
            <p class="text-fg-muted text-[15px] mt-4 leading-relaxed">
              Las notas se editan con un editor enriquecido. Auto-guardado cada segundo y comando <kbd class="px-1.5 py-0.5 rounded-md bg-muted text-fg font-sans text-[12px]">/</kbd> para insertar contenido.
            </p>
            <div class="mt-6 rounded-[14px] bg-muted px-5 py-4">
              <p class="text-[13px] font-bold text-fg">Editor TipTap, próximamente</p>
              <p class="text-[12.5px] text-fg-muted mt-1">Aquí podrás escribir con formato, insertar bloques con <kbd class="px-1 rounded bg-card text-fg font-sans text-[11px]">/</kbd>, y enlazar entre notas con <kbd class="px-1 rounded bg-card text-fg font-sans text-[11px]">[[</kbd>.</p>
            </div>
          </div>
        </div>
      </template>
      <AppEmptyHint v-else title="Elige una nota" hint="O crea una nueva tocando “+ Nueva”." />
    </AppCard>
  </div>
</template>
