<script setup lang="ts">
import { Search, Plus, Folder, FolderOpen, Pin, Calendar, ChevronRight, ChevronLeft, ChevronDown, NotebookPen, Type, Trash2, Paperclip, Image as FileImageIcon, Music2, Video as VideoIcon, FileText, FileType2, File as FileGenericIcon, ExternalLink, Play, Pause, Volume2, VolumeX } from '@lucide/vue'
import { format, parseISO, isValid, isToday, isYesterday } from 'date-fns'

const { t } = useI18n()
const dateLocale = useDateLocale()

useHead({ title: t('notes.head.title') })

const {
  folders, notes, notesLoading,
  createFolder, removeFolder, createNote: apiCreateNote, updateNote, removeNote,
} = useNotes()

const search = ref('')
const selectedFolder = ref<string>('')
const selectedNoteId = ref<string | null>(null)

// Imágenes/audio del editor: se suben y se insertan INLINE en el cuerpo de
// la nota (nunca aparecen en un listado aparte).
const { upload: uploadInlineAttachment, attachmentUrl } = useNoteAttachments(selectedNoteId)
async function onUploadImage(file: File) { const a = await uploadInlineAttachment(file); return attachmentUrl(a.id) }
async function onUploadAudio(file: File) { const a = await uploadInlineAttachment(file); return attachmentUrl(a.id) }

// Documentos de la carpeta (pdf/otros/cualquiera): viven en el panel de la
// carpeta actual, nunca dentro de una nota — independientes de qué nota esté abierta.
const selectedFolderRef = computed(() => selectedFolder.value || null)
const { attachments: folderAttachments, upload: uploadFolderAttachment, remove: removeFolderAttachment, attachmentUrl: folderAttachmentUrl } = useFolderAttachments(selectedFolderRef)
const folderUploading = ref(false)
const folderUploadError = ref('')
let errorTimer: ReturnType<typeof setTimeout> | null = null
async function onUploadFolderFiles(files: File[]) {
  folderUploading.value = true
  const rejected: string[] = []
  try {
    for (const f of files) {
      try { await uploadFolderAttachment(f) }
      catch { rejected.push(f.name) }
    }
  } finally {
    folderUploading.value = false
    if (rejected.length) {
      folderUploadError.value = t('notes.attachments.rejected', { files: rejected.join(', ') })
      if (errorTimer) clearTimeout(errorTimer)
      errorTimer = setTimeout(() => (folderUploadError.value = ''), 6000)
    }
  }
}
const FILE_ICONS = { image: FileImageIcon, audio: Music2, video: VideoIcon, pdf: FileText, text: FileType2, other: FileGenericIcon } as const
const fileIcon = (kind: string) => FILE_ICONS[kind as keyof typeof FILE_ICONS] ?? FileGenericIcon
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
const FOLDER_ACCEPT = 'image/*,audio/*,video/*,application/pdf,text/plain,text/markdown,.md,.markdown,.txt'
const folderFileInputRef = ref<HTMLInputElement | null>(null)
const folderFileInputMobileRef = ref<HTMLInputElement | null>(null)
function pickFolderFile(mobile = false) { (mobile ? folderFileInputMobileRef : folderFileInputRef).value?.click() }
function onFolderFilesChosen(e: Event) {
  const input = e.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = ''
  if (files.length) onUploadFolderFiles(files)
}

// Visor de archivos EN LA APP (no modal: pantalla completa como el editor
// móvil). Imagen y pdf se muestran directo; audio con reproductor propio.
// "other" nunca tiene visor posible (se sirve forzado a descarga) → abre en
// pestaña nueva, que es justo lo que hace el navegador con ese archivo.
interface ViewableAttachment { id: string; filename: string; kind: string }
const viewingAttachment = ref<ViewableAttachment | null>(null)
const textContent = ref('')
const textLoading = ref(false)
async function handleFileClick(a: ViewableAttachment) {
  if (a.kind === 'other') { window.open(folderAttachmentUrl(a.id), '_blank', 'noopener'); return }
  viewingAttachment.value = a
  if (a.kind === 'text') {
    textContent.value = ''; textLoading.value = true
    try { textContent.value = await $fetch<string>(folderAttachmentUrl(a.id), { responseType: 'text' }) }
    finally { textLoading.value = false }
  }
}
function closeViewer() { viewingAttachment.value = null; stopAudio() }

const audioElRef = ref<HTMLAudioElement | null>(null)
const audioPlaying = ref(false)
const audioCurrent = ref(0)
const audioDuration = ref(0)
function toggleAudioPlay() {
  const el = audioElRef.value
  if (!el) return
  if (el.paused) { el.play(); audioPlaying.value = true } else { el.pause(); audioPlaying.value = false }
}
function onAudioTime(e: Event) { const el = e.target as HTMLAudioElement; audioCurrent.value = el.currentTime; audioDuration.value = el.duration || 0 }
function onAudioEnded() { audioPlaying.value = false }
function audioPct() { return audioDuration.value ? (audioCurrent.value / audioDuration.value) * 100 : 0 }
function formatTime(s: number) { if (!isFinite(s) || s < 0) s = 0; return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` }
function seekAudio(e: MouseEvent) {
  const el = audioElRef.value
  if (!el || !isFinite(el.duration)) return
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  el.currentTime = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * el.duration
}
function stopAudio() { audioElRef.value?.pause(); audioPlaying.value = false; audioCurrent.value = 0 }

// Volumen: mismo patrón que Spotify (composables/useSpotify.ts + pages/spotify.vue)
// — slider .hibi-range con relleno en gradiente, botón que alterna mute y
// recuerda el volumen previo.
const audioVolume = ref(1)
const audioPreMute = ref(0.7)
function setAudioVolume(v: number) {
  audioVolume.value = Math.max(0, Math.min(1, v))
  if (audioElRef.value) audioElRef.value.volume = audioVolume.value
}
function toggleAudioMute() {
  if (audioVolume.value > 0.001) { audioPreMute.value = audioVolume.value; setAudioVolume(0) }
  else setAudioVolume(audioPreMute.value || 0.5)
}
// Al abrir un audio nuevo, el <audio> se monta con volumen 1 por defecto;
// hay que aplicarle el volumen recordado de la sesión.
watch(audioElRef, (el) => { if (el) el.volume = audioVolume.value })

// Selección inicial de carpeta cuando cargan
watchEffect(() => {
  if (!selectedFolder.value && folders.value.length) selectedFolder.value = folders.value[0]!.id
})

function stripHtml(html: string) { return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() }
function previewOf(content: string) { const txt = stripHtml(content); return txt ? txt.slice(0, 140) : t('notes.editor.noContent') }
function updatedLabel(iso: string) {
  const d = parseISO(iso); if (!isValid(d)) return ''
  if (isToday(d)) return t('common.today') + ' ' + format(d, 'HH:mm')
  if (isYesterday(d)) return t('common.yesterday') + ' ' + format(d, 'HH:mm')
  return format(d, t('notes.dateFormat'), { locale: dateLocale.value })
}
function toView(n: Note) {
  return { id: n.id, folder: n.folderId, title: n.title, content: n.content, pinned: !!n.pinned, preview: previewOf(n.content), updated: updatedLabel(n.updatedAt) }
}
type NoteView = ReturnType<typeof toView>

const filtered = computed<NoteView[]>(() => {
  const q = search.value.trim().toLowerCase()
  return notes.value
    .filter((n) => n.folderId === selectedFolder.value)
    .filter((n) => !q || n.title.toLowerCase().includes(q) || stripHtml(n.content).toLowerCase().includes(q))
    .map(toView)
})
const selected = computed<NoteView | null>(() => {
  const n = notes.value.find((x) => x.id === selectedNoteId.value)
  return n ? toView(n) : null
})

// Mantener seleccionada una nota válida de la carpeta actual
watch(filtered, () => {
  if (!selectedNoteId.value || !filtered.value.some((n) => n.id === selectedNoteId.value)) {
    selectedNoteId.value = filtered.value[0]?.id ?? null
  }
}, { immediate: true })

// Crear: la nota se crea VACÍA en la carpeta actual y se abre en el editor.
async function createNote() {
  if (!selectedFolder.value) return
  mobileToolbarOpen.value = false
  const n = await apiCreateNote({ folderId: selectedFolder.value, title: '', content: '' })
  selectedNoteId.value = n.id
  mobileEditorOpen.value = true
}

// Eliminar nota. Si era la seleccionada, pasa a la primera de la carpeta.
async function deleteNote(id: string) {
  const wasSelected = selectedNoteId.value === id
  mobileEditorOpen.value = false
  await removeNote(id)
  if (wasSelected) selectedNoteId.value = filtered.value.find((n) => n.id !== id)?.id ?? null
}

// Eliminar carpeta (y sus notas). No se borra la última carpeta.
async function deleteFolder(id: string) {
  if (folders.value.length <= 1) return
  const noteIds = notes.value.filter((n) => n.folderId === id).map((n) => n.id)
  await Promise.all(noteIds.map((nid) => removeNote(nid)))
  await removeFolder(id)
  if (selectedFolder.value === id) {
    selectedFolder.value = folders.value.find((f) => f.id !== id)?.id ?? ''
    selectedNoteId.value = null
  }
}

// Guardado en vivo: título al perder foco; contenido con debounce + flush al
// cambiar de nota (evita una petición por tecla). El editor no reinicia el
// cursor porque solo reescribe si el HTML difiere.
let pendingContent: { id: string; content: string } | null = null
const flushContent = () => { if (pendingContent) { updateNote(pendingContent.id, { content: pendingContent.content }); pendingContent = null } }
const debouncedFlush = useDebounceFn(flushContent, 500)
function onEditContent(html: string) {
  if (!selected.value) return
  pendingContent = { id: selected.value.id, content: html }
  debouncedFlush()
}
function onEditTitle(e: Event) {
  if (!selected.value) return
  const v = (e.target as HTMLElement).innerText.trim()
  updateNote(selected.value.id, { title: v })
}
watch(selectedNoteId, () => flushContent())
onBeforeUnmount(() => flushContent())

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
const folderCount = (id: string) => notes.value.filter(n => n.folderId === id).length

// Crear carpeta: inline (sin pantalla aparte). Tocar "+" abre un mini panel
// con nombre + selector de color PERSONALIZADO (AppColorPicker hex).
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
async function confirmCreateFolder() {
  const name = newFolderName.value.trim()
  if (!name) { creatingFolder.value = false; showFolderColor.value = false; return }
  const f = await createFolder({ name, color: newFolderColor.value })
  selectedFolder.value = f.id
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
  const el = e.target as HTMLElement
  if (showFolderColor.value && !el.closest('[data-folder-color-pop]') && !el.closest('[data-folder-color-trigger]')) {
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
      <button v-show="!showFolders" type="button" class="grid place-items-center size-7 rounded-full text-fg-muted hover:text-fg" :title="t('notes.folders.show')">
        <NotebookPen class="size-[16px]" :stroke-width="1.9" />
      </button>

      <!-- Modo EXPANDIDO: panel completo -->
      <template v-if="showFolders">
        <button type="button"
          class="absolute top-1/2 -right-3 -translate-y-1/2 z-20 grid place-items-center size-7 rounded-full bg-card text-fg-muted hover:text-fg hover:bg-muted transition-[background-color,color]"
          :title="t('notes.folders.hide')"
          @click.stop="showFolders = false">
          <ChevronLeft class="size-[14px]" :stroke-width="2.4" />
        </button>
        <div class="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
          <div class="flex items-center gap-2">
            <HibiCloudIcon :size="44" :icon="NotebookPen" :icon-size="16" cloud-color="text-sky-soft" icon-color="text-sky-deep" :icon-stroke="1.9" class="shrink-0" />
            <h2 class="text-[14px] font-extrabold text-fg">{{ t('notes.folders.title') }}</h2>
          </div>
          <button class="grid place-items-center size-7 rounded-[9px] text-fg-subtle hover:text-fg hover:bg-muted" :aria-label="creatingFolder ? t('common.close') : t('notes.folders.new')" @click="creatingFolder ? cancelCreateFolder() : startCreateFolder()"><Plus class="size-4 transition-[transform] duration-200" :class="creatingFolder ? 'rotate-45' : ''" :stroke-width="2" /></button>
        </div>
        <ul class="flex-1 overflow-y-auto scroll-area flex flex-col gap-0.5 px-2 pb-3">
          <!-- Mini panel inline de nueva carpeta: nombre + color personalizado -->
          <li v-if="creatingFolder" class="px-1 pb-2">
            <div class="rounded-[12px] bg-muted p-2.5 flex flex-col gap-2.5">
              <div class="flex items-center gap-2">
                <input data-folder-input v-model="newFolderName" type="text" :placeholder="t('notes.folders.namePlaceholder')"
                  class="flex-1 min-w-0 h-9 rounded-[8px] bg-card px-2.5 text-[14px] font-semibold text-fg outline-none placeholder:text-fg-subtle"
                  @keydown.enter.prevent="confirmCreateFolder" @keydown.esc="cancelCreateFolder" />
                <button type="button" data-folder-color-trigger class="shrink-0 size-9 rounded-[8px]" :style="{ background: newFolderColor }" :aria-label="t('notes.folders.color')" @click.stop="toggleFolderColor" />
              </div>
              <button type="button" class="h-9 rounded-[10px] bg-sky text-[#1f4661] text-[13px] font-bold" @click="confirmCreateFolder">{{ t('notes.folders.create') }}</button>
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
              <span class="text-[11px] font-bold text-fg-subtle group-hover/folder:opacity-0 transition-opacity">{{ folderCount(f.id) }}</span>
            </button>
            <button v-if="folders.length > 1" type="button"
              class="absolute top-1/2 right-1.5 -translate-y-1/2 grid place-items-center size-7 rounded-[8px] text-fg-subtle opacity-0 group-hover/folder:opacity-100 hover:text-pink-deep hover:bg-pink-soft transition-[opacity,background-color,color]"
              :aria-label="t('notes.folders.delete')" @click.stop="deleteFolder(f.id)">
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
      <button v-show="!showList" type="button" class="grid place-items-center size-7 rounded-full text-fg-muted hover:text-fg" :title="t('notes.list.show')">
        <ChevronRight class="size-[14px]" :stroke-width="2.4" />
      </button>

      <!-- Modo EXPANDIDO -->
      <template v-if="showList">
        <button type="button"
          class="absolute top-1/2 -right-3 -translate-y-1/2 z-20 grid place-items-center size-7 rounded-full bg-card text-fg-muted hover:text-fg hover:bg-muted transition-[background-color,color]"
          :title="t('notes.list.hide')"
          @click.stop="showList = false">
          <ChevronLeft class="size-[14px]" :stroke-width="2.4" />
        </button>
        <div class="px-4 pt-4 pb-3 shrink-0 flex flex-col gap-3">
          <div class="relative">
            <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 size-[16px] text-fg-subtle" :stroke-width="1.8" aria-hidden="true" />
            <label for="notes-search" class="sr-only">{{ t('notes.list.searchLabel') }}</label>
            <input id="notes-search" v-model="search" type="text" :placeholder="t('notes.list.searchPlaceholder')"
              class="w-full h-10 rounded-[12px] bg-muted pl-10 pr-3 text-[14px] text-fg outline-none" />
          </div>
          <div class="flex items-center justify-between px-1">
            <h3 class="text-[13px] font-bold text-fg-muted">{{ t('notes.list.count', { n: filtered.length }) }}</h3>
            <div class="flex items-center gap-3">
              <button class="inline-flex items-center gap-1 text-sky-deep text-[12.5px] font-bold hover:underline disabled:opacity-50" :disabled="folderUploading" @click="pickFolderFile(false)">
                <Paperclip class="size-3.5" :stroke-width="2.3" />{{ t('notes.list.addFile') }}
              </button>
              <button class="inline-flex items-center gap-1 text-sky-deep text-[12.5px] font-bold hover:underline" @click="createNote">
                <Plus class="size-3.5" :stroke-width="2.3" />{{ t('notes.list.new') }}
              </button>
            </div>
          </div>
          <p v-if="folderUploadError" class="text-[12px] font-semibold text-pink-deep px-1">{{ folderUploadError }}</p>
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
                  <Pin v-if="n.pinned" class="shrink-0 size-3.5 text-pink-deep mt-0.5" :stroke-width="2.3" :aria-label="t('notes.pinned')" />
                  <h4 class="text-[14px] font-bold text-fg truncate flex-1">{{ n.title }}</h4>
                </div>
                <p class="text-[12.5px] text-fg-muted line-clamp-2 mt-1 leading-snug">{{ n.preview }}</p>
                <p class="text-[11px] text-fg-subtle mt-1.5 inline-flex items-center gap-1"><Calendar class="size-3" aria-hidden="true" />{{ n.updated }}</p>
              </button>
              <button type="button"
                class="absolute top-2 right-2 grid place-items-center size-7 rounded-full text-fg-subtle opacity-0 group-hover/note:opacity-100 hover:text-pink-deep hover:bg-pink-soft transition-[opacity,background-color,color]"
                :aria-label="t('notes.list.deleteNote')" @click.stop="deleteNote(n.id)">
                <Trash2 class="size-[14px]" :stroke-width="2" />
              </button>
            </li>
            <!-- Documentos de esta carpeta: misma fila que una nota, nunca dentro de una nota -->
            <li v-for="a in folderAttachments" :key="a.id" class="relative group/note">
              <!-- Misma fila para todos los tipos de archivo (icono+nombre+tamaño),
                   audio incluido: la reproducción vive en el visor de pantalla
                   completa, no en esta lista. -->
              <button type="button"
                class="w-full flex items-center gap-2.5 text-left p-3 rounded-[12px] transition-[background-color] hover:bg-muted"
                @click="handleFileClick(a)">
                <component :is="fileIcon(a.kind)" class="shrink-0 size-4 text-fg-subtle" :stroke-width="1.9" aria-hidden="true" />
                <div class="flex-1 min-w-0 pr-7">
                  <h4 class="text-[14px] font-bold text-fg truncate">{{ a.filename }}</h4>
                  <p class="text-[11px] text-fg-subtle mt-0.5">{{ formatFileSize(a.size) }}</p>
                </div>
              </button>
              <button type="button"
                class="absolute top-2 right-2 grid place-items-center size-7 rounded-full text-fg-subtle opacity-0 group-hover/note:opacity-100 hover:text-pink-deep hover:bg-pink-soft transition-[opacity,background-color,color]"
                :aria-label="t('notes.attachments.remove')" @click.stop="removeFolderAttachment(a.id)">
                <Trash2 class="size-[14px]" :stroke-width="2" />
              </button>
            </li>
          </ul>
        </div>
      </template>
    </AppCard>
    <input ref="folderFileInputRef" type="file" class="hidden" :accept="FOLDER_ACCEPT" multiple @change="onFolderFilesChosen" />

    <!-- Editor -->
    <AppCard class="z-10 hidden md:flex flex-1 min-w-0 flex-col overflow-hidden relative" :padded="false">
      <div v-if="selected" class="flex-1 min-h-0 flex flex-col px-7 py-5">
        <!-- Breadcrumb + eliminar -->
        <div class="flex items-center gap-2 text-[12px] text-fg-muted font-semibold mb-3 shrink-0">
          <Folder class="size-3.5" :stroke-width="1.9" aria-hidden="true" />
          {{ folders.find(f => f.id === selected!.folder)?.name }}
          <ChevronRight class="size-3" aria-hidden="true" />
          <span>{{ selected!.updated }}</span>
          <button type="button" class="ml-auto grid place-items-center size-8 rounded-full text-fg-subtle hover:text-pink-deep hover:bg-pink-soft transition-[background-color,color]" :aria-label="t('notes.list.deleteNote')" @click="deleteNote(selected!.id)">
            <Trash2 class="size-4" :stroke-width="2" />
          </button>
        </div>
        <!-- Título editable -->
        <h1
          class="hibi-title-edit text-[34px] font-extrabold text-fg leading-tight outline-none mb-4 shrink-0"
          contenteditable="true" spellcheck="false" role="textbox" aria-multiline="false"
          :data-placeholder="t('notes.editor.titlePlaceholder')"
          @blur="onEditTitle"
        >{{ selected!.title }}</h1>
        <!-- Editor enriquecido ocupando el resto del ancho y alto -->
        <div class="flex-1 min-h-0 flex">
          <AppRichEditor
            :key="selected!.id"
            :model-value="selected!.content"
            :placeholder="t('notes.editor.contentPlaceholder')"
            :upload-image="onUploadImage"
            :upload-audio="onUploadAudio"
            @update:model-value="onEditContent" />
        </div>
      </div>
      <AppEmptyHint v-else :title="t('notes.empty.pickTitle')" :hint="t('notes.empty.pickHint')" />
    </AppCard>

    <!-- ───────────── MÓVIL: carpetas (lista) → notas (drill) → editor ───────────── -->
    <div class="md:hidden relative z-10 flex flex-col flex-1 min-h-0 w-full">
      <!-- NIVEL 1: lista de carpetas -->
      <div v-if="!mobileFolderOpen" class="flex flex-col flex-1 min-h-0">
        <div class="shrink-0 flex items-center justify-between pb-3">
          <h2 class="text-[15px] font-extrabold text-fg">{{ t('notes.folders.title') }}</h2>
          <button type="button" class="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-sky text-[#1f4661] text-[13px] font-bold active:bg-sky-deep active:text-white" @click="creatingFolder ? cancelCreateFolder() : startCreateFolder()">
            <Plus class="size-4 transition-[transform] duration-200" :class="creatingFolder ? 'rotate-45' : ''" :stroke-width="2.2" /> {{ t('notes.folders.mobileNew') }}
          </button>
        </div>

        <!-- Mini panel nueva carpeta: nombre + color -->
        <div v-if="creatingFolder" class="shrink-0 rounded-[14px] bg-muted p-3 mb-3 flex flex-col gap-3">
          <div class="flex items-center gap-2">
            <input data-folder-input v-model="newFolderName" type="text" :placeholder="t('notes.folders.namePlaceholder')"
              class="flex-1 min-w-0 h-10 rounded-[10px] bg-card px-3 text-[14px] font-semibold text-fg outline-none placeholder:text-fg-subtle"
              @keydown.enter.prevent="confirmCreateFolder" @keydown.esc="cancelCreateFolder" />
            <button type="button" data-folder-color-trigger class="shrink-0 size-10 rounded-[10px]" :style="{ background: newFolderColor }" :aria-label="t('notes.folders.color')" @click.stop="toggleFolderColor" />
          </div>
          <button type="button" class="h-10 rounded-[12px] bg-sky text-[#1f4661] text-[13px] font-bold" @click="confirmCreateFolder">{{ t('notes.folders.create') }}</button>
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
                  <p class="text-[12.5px] text-fg-muted mt-0.5">{{ t(folderCount(f.id) === 1 ? 'notes.countOne' : 'notes.countMany', { n: folderCount(f.id) }) }}</p>
                </div>
                <button v-if="folders.length > 1" type="button" class="grid place-items-center size-8 rounded-[10px] text-fg-subtle active:text-pink-deep active:bg-pink-soft shrink-0" :aria-label="t('notes.folders.delete')" @click.stop="deleteFolder(f.id)">
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
          <button type="button" class="grid place-items-center size-9 rounded-full bg-muted text-fg-muted shrink-0" :aria-label="t('notes.folders.backToFolders')" @click="mobileFolderOpen = false">
            <ChevronLeft class="size-[18px]" :stroke-width="2" />
          </button>
          <div class="flex-1 min-w-0 flex items-center gap-2">
            <FolderOpen class="size-[18px] shrink-0" :style="{ color: folders.find(f => f.id === selectedFolder)?.color }" :stroke-width="1.9" aria-hidden="true" />
            <h2 class="text-[17px] font-extrabold text-fg truncate">{{ folders.find(f => f.id === selectedFolder)?.name }}</h2>
          </div>
          <button type="button" class="grid place-items-center size-9 rounded-full bg-muted text-fg-muted shrink-0 disabled:opacity-50" :disabled="folderUploading" :aria-label="t('notes.list.addFile')" @click="pickFolderFile(true)">
            <Paperclip class="size-[16px]" :stroke-width="2" />
          </button>
          <AppButton variant="primary" size="sm" class="shrink-0" @click="createNote">
            <template #icon><Plus class="size-[16px]" :stroke-width="2.3" /></template>{{ t('notes.list.new') }}
          </AppButton>
        </div>
        <p v-if="folderUploadError" class="shrink-0 text-[12px] font-semibold text-pink-deep pb-2">{{ folderUploadError }}</p>

        <!-- Buscar -->
        <div class="shrink-0 relative pb-3">
          <Search class="absolute left-3.5 top-[18px] -translate-y-1/2 size-[16px] text-fg-subtle" :stroke-width="1.8" aria-hidden="true" />
          <label for="notes-search-mobile" class="sr-only">{{ t('notes.list.searchLabel') }}</label>
          <input id="notes-search-mobile" v-model="search" type="text" :placeholder="t('notes.list.searchPlaceholder')"
            class="w-full h-10 rounded-[12px] bg-muted pl-10 pr-3 text-[14px] text-fg outline-none" />
        </div>

        <!-- Lista de notas -->
        <div class="flex-1 min-h-0 overflow-y-auto scroll-area">
          <ul v-if="filtered.length || folderAttachments.length" class="flex flex-col gap-2 pb-2">
            <li v-for="n in filtered" :key="n.id">
              <button type="button"
                class="w-full text-left p-3.5 rounded-[14px] bg-card transition-[background-color] active:bg-muted"
                @click="openNoteMobile(n.id)">
                <div class="flex items-start gap-2">
                  <Pin v-if="n.pinned" class="shrink-0 size-3.5 text-pink-deep mt-1" :stroke-width="2.3" :aria-label="t('notes.pinned')" />
                  <h4 class="text-[15px] font-bold text-fg break-words flex-1">{{ n.title }}</h4>
                </div>
                <p class="text-[13px] text-fg-muted line-clamp-2 mt-1 leading-snug">{{ n.preview }}</p>
                <p class="text-[11px] text-fg-subtle mt-2 inline-flex items-center gap-1"><Calendar class="size-3" aria-hidden="true" />{{ n.updated }}</p>
              </button>
            </li>
            <!-- Documentos de esta carpeta: misma fila que una nota, nunca dentro de una nota -->
            <li v-for="a in folderAttachments" :key="a.id" class="relative">
              <!-- Misma fila para todos los tipos de archivo (icono+nombre+tamaño),
                   audio incluido: la reproducción vive en el visor de pantalla
                   completa, no en esta lista. -->
              <button type="button"
                class="w-full flex items-center gap-3 text-left p-3.5 rounded-[14px] bg-card transition-[background-color] active:bg-muted"
                @click="handleFileClick(a)">
                <component :is="fileIcon(a.kind)" class="shrink-0 size-[18px] text-fg-subtle" :stroke-width="1.9" aria-hidden="true" />
                <div class="flex-1 min-w-0 pr-8">
                  <h4 class="text-[15px] font-bold text-fg break-words truncate">{{ a.filename }}</h4>
                  <p class="text-[11px] text-fg-subtle mt-1">{{ formatFileSize(a.size) }}</p>
                </div>
              </button>
              <button type="button" class="absolute top-1/2 right-2.5 -translate-y-1/2 grid place-items-center size-8 rounded-[10px] text-fg-subtle active:text-pink-deep active:bg-pink-soft shrink-0"
                :aria-label="t('notes.attachments.remove')" @click.stop="removeFolderAttachment(a.id)">
                <Trash2 class="size-[15px]" :stroke-width="2" />
              </button>
            </li>
          </ul>
          <div v-else class="h-full flex flex-col items-center justify-center text-center gap-3 text-fg-subtle">
            <HibiCloud :size="80" face class="text-sky-soft opacity-70" aria-hidden="true" />
            <p class="text-[14px] font-semibold">{{ t('notes.empty.noNotes') }}</p>
            <button type="button" class="text-[13px] font-bold text-sky-deep" @click="createNote">{{ t('notes.empty.createFirst') }}</button>
          </div>
        </div>
      </div>

      <!-- Editor a pantalla completa (drill-down) -->
      <Transition name="hibi-drill">
        <div v-if="mobileEditorOpen && selected" class="absolute inset-0 z-20 bg-base flex flex-col">
          <header class="shrink-0 flex items-center gap-2 pb-3">
            <button type="button" class="grid place-items-center size-9 rounded-full text-fg-muted hover:bg-muted shrink-0" :aria-label="t('notes.list.backToNotes')" @click="mobileEditorOpen = false">
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
              :aria-label="t('notes.list.deleteNote')" @click="deleteNote(selected!.id)">
              <Trash2 class="size-[16px]" :stroke-width="2" />
            </button>
            <!-- Botón Formato a la derecha del header -->
            <button type="button"
              class="shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-[10px] bg-muted text-fg-muted hover:text-fg transition-[color]"
              :aria-label="t('notes.editor.format')"
              :aria-expanded="mobileToolbarOpen"
              @click="mobileToolbarOpen = !mobileToolbarOpen">
              <Type class="size-[15px]" :stroke-width="2" aria-hidden="true" />
              <ChevronDown class="size-3.5 transition-[transform] duration-200" :class="mobileToolbarOpen ? 'rotate-180' : ''" :stroke-width="2.2" aria-hidden="true" />
            </button>
          </header>
          <AppCard class="flex-1 min-h-0 flex flex-col !p-0 overflow-hidden">
            <div class="flex-1 min-h-0 flex flex-col px-4 py-4">
              <h1 class="hibi-title-edit text-[24px] font-extrabold text-fg leading-tight outline-none mb-3 shrink-0 break-words"
                contenteditable="true" spellcheck="false" role="textbox" aria-multiline="false" :data-placeholder="t('notes.editor.titlePlaceholder')" @blur="onEditTitle">{{ selected!.title }}</h1>
              <div class="flex-1 min-h-0 flex">
                <AppRichEditor :key="selected!.id" v-model:toolbar-open="mobileToolbarOpen" :model-value="selected!.content" :placeholder="t('notes.editor.contentPlaceholder')" :upload-image="onUploadImage" :upload-audio="onUploadAudio" @update:model-value="onEditContent" />
              </div>
            </div>
          </AppCard>
        </div>
      </Transition>
      <input ref="folderFileInputMobileRef" type="file" class="hidden" multiple @change="onFolderFilesChosen" />
    </div>

    <!-- Visor de archivos EN LA APP (no modal, pantalla completa como el
         editor móvil). Imagen/pdf se muestran directo; audio con reproductor
         propio. "other" nunca llega aquí (se descarga, ver handleFileClick). -->
    <Transition name="hibi-drill">
      <div v-if="viewingAttachment" class="absolute inset-0 z-50 bg-base flex flex-col p-4 md:p-6">
        <header class="shrink-0 flex items-center gap-2 pb-3">
          <button type="button" class="grid place-items-center size-9 rounded-full bg-muted text-fg-muted hover:bg-[var(--bg-inset)] shrink-0" :aria-label="t('common.back')" @click="closeViewer">
            <ChevronLeft class="size-[18px]" :stroke-width="2" />
          </button>
          <h2 class="flex-1 min-w-0 text-[14px] font-bold text-fg truncate">{{ viewingAttachment.filename }}</h2>
          <a :href="folderAttachmentUrl(viewingAttachment.id)" target="_blank" rel="noopener"
            class="shrink-0 grid place-items-center size-9 rounded-full bg-muted text-fg-muted hover:bg-[var(--bg-inset)]" :aria-label="t('notes.attachments.openNewTab')">
            <ExternalLink class="size-[16px]" :stroke-width="2" />
          </a>
        </header>
        <div class="flex-1 min-h-0 flex items-center justify-center overflow-auto">
          <img v-if="viewingAttachment.kind === 'image'" :src="folderAttachmentUrl(viewingAttachment.id)" alt="" class="max-w-full max-h-full object-contain rounded-[12px]" />
          <iframe v-else-if="viewingAttachment.kind === 'pdf'" :src="folderAttachmentUrl(viewingAttachment.id)" class="w-full h-full rounded-[12px]" style="border: 0" />
          <video v-else-if="viewingAttachment.kind === 'video'" :src="folderAttachmentUrl(viewingAttachment.id)" controls autoplay class="max-w-full max-h-full rounded-[12px]" />
          <div v-else-if="viewingAttachment.kind === 'text'" class="w-full h-full max-w-3xl overflow-y-auto scroll-area rounded-[12px] bg-card p-5">
            <p v-if="textLoading" class="text-[13px] text-fg-subtle">{{ t('common.loading') }}</p>
            <pre v-else class="text-[13px] text-fg leading-relaxed whitespace-pre-wrap break-words font-mono">{{ textContent }}</pre>
          </div>
          <div v-else-if="viewingAttachment.kind === 'audio'" class="w-full max-w-md flex flex-col items-center gap-6 px-6">
            <HibiCloudIcon :size="96" :icon="Music2" :icon-size="34" cloud-color="text-lavender" icon-color="text-fg" />
            <div class="w-full flex items-center gap-3">
              <button type="button" class="grid place-items-center size-12 rounded-full bg-sky text-[#1f4661] shrink-0" @click="toggleAudioPlay">
                <component :is="audioPlaying ? Pause : Play" class="size-5" fill="currentColor" :stroke-width="0" />
              </button>
              <div class="flex-1 h-2 rounded-full bg-muted cursor-pointer relative" @click="seekAudio">
                <div class="absolute inset-y-0 left-0 rounded-full bg-sky-deep pointer-events-none" :style="{ width: audioPct() + '%' }" />
              </div>
              <span class="text-[12px] font-bold text-fg-subtle tabular-nums shrink-0">{{ formatTime(audioCurrent) }}</span>
            </div>
            <div class="w-full flex items-center gap-2.5">
              <button type="button" class="grid place-items-center size-8 rounded-full text-fg-muted shrink-0 hover:text-sky-deep transition-colors" :aria-label="audioVolume > 0 ? t('common.editor.mute') : t('common.editor.unmute')" @click="toggleAudioMute">
                <component :is="audioVolume > 0 ? Volume2 : VolumeX" class="size-[17px]" :stroke-width="2" />
              </button>
              <input type="range" min="0" max="1" step="0.02" :value="audioVolume" class="hibi-range flex-1"
                :style="{ background: 'linear-gradient(to right, var(--color-sky-deep) ' + Math.round(audioVolume * 100) + '%, var(--bg-muted) ' + Math.round(audioVolume * 100) + '%)' }"
                :aria-label="t('common.editor.volume')" @input="(e) => setAudioVolume(+(e.target as HTMLInputElement).value)" />
            </div>
            <audio ref="audioElRef" :src="folderAttachmentUrl(viewingAttachment.id)" class="hidden"
              @timeupdate="onAudioTime" @loadedmetadata="onAudioTime" @ended="onAudioEnded" />
          </div>
        </div>
      </div>
    </Transition>

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

/* Slider de volumen: mismo que Spotify (pages/spotify.vue), sin bordes. */
.hibi-range { -webkit-appearance: none; appearance: none; width: 100%; height: 4px; border-radius: 9999px; background: var(--bg-muted); cursor: pointer; outline: none; }
.hibi-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 13px; height: 13px; border-radius: 50%; background: var(--color-sky-deep); border: none; cursor: pointer; }
.hibi-range::-moz-range-thumb { width: 13px; height: 13px; border-radius: 50%; background: var(--color-sky-deep); border: none; cursor: pointer; }
.hibi-range::-moz-range-track { height: 4px; border-radius: 9999px; background: var(--bg-muted); }
</style>
