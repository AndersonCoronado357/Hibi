<script setup lang="ts">
import { Bold, Italic, Heading1, Heading2, List, ListOrdered, Quote, Code2, Strikethrough, Link as LinkIcon, Undo2, Redo2, Highlighter, Palette, ChevronDown, Type, Image as ImageIcon, Music2, AlignLeft, AlignCenter, AlignRight } from '@lucide/vue'
import AppColorPicker from './AppColorPicker.vue'

const props = defineProps<{
  modelValue: string; placeholder?: string; minHeight?: string; toolbarOpen?: boolean
  // Suben el archivo y devuelven la URL a insertar inline (p.ej. /api/attachments/:id).
  uploadImage?: (file: File) => Promise<string>
  uploadAudio?: (file: File) => Promise<string>
}>()
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void; (e: 'update:toolbarOpen', v: boolean): void }>()
const { t } = useI18n()

// En movil la barra de formato se pliega para no comer espacio del editor.
// En desktop (md+) siempre está visible.
// El estado puede ser CONTROLADO por el padre (v-model:toolbar-open) — útil
// para colocar el botón "Formato" junto al título — o interno si no se pasa.
const internalToolbarOpen = ref(false)
const controlled = computed(() => props.toolbarOpen !== undefined)
const toolbarOpen = computed({
  get: () => (controlled.value ? !!props.toolbarOpen : internalToolbarOpen.value),
  set: (v: boolean) => { controlled.value ? emit('update:toolbarOpen', v) : (internalToolbarOpen.value = v) },
})

const editorRef = ref<HTMLDivElement | null>(null)
const editorWrapRef = ref<HTMLDivElement | null>(null)
let pendingFromProp = false

// Tamaños como editor real: número de pt
const SIZES = [10, 12, 13, 14, 15, 16, 18, 20, 24, 28, 32]
const showSizeMenu = ref(false)
// Popovers de color (relativos al botón)
const showColorPopup = ref<null | 'color' | 'hilite'>(null)
const colorValue = ref('#5aa6d2')
const hiliteValue = ref('#fff066')

function cmd(action: string, value?: string) {
  if (!editorRef.value) return
  editorRef.value.focus()
  document.execCommand(action, false, value)
  emit('update:modelValue', editorRef.value.innerHTML)
}

function setColor(c: string) { cmd('foreColor', c) }
function setHilite(c: string) { cmd('hiliteColor', c) }
function onColorChange(v: string) { colorValue.value = v; setColor(v) }
function onHiliteChange(v: string) { hiliteValue.value = v; setHilite(v) }
function toggleColorPopup(which: 'color' | 'hilite') {
  showColorPopup.value = showColorPopup.value === which ? null : which
}

// Click fuera para cerrar popups (capture phase para llegar primero)
function onDocClick(e: MouseEvent) {
  const t = e.target as HTMLElement
  if (showColorPopup.value && !t.closest('.hibi-color-popup') && !t.closest('[data-color-trigger]')) {
    showColorPopup.value = null
  }
  if (showSizeMenu.value && !t.closest('.hibi-size-popup') && !t.closest('[data-size-trigger]')) {
    showSizeMenu.value = false
  }
  if (selectedEmbed.value && !t.closest('.hibi-embed') && !t.closest('.hibi-embed-toolbar')) {
    selectedEmbed.value = null
  }
}
onMounted(() => {
  if (typeof document === 'undefined') return
  document.addEventListener('click', onDocClick, true)
  document.addEventListener('keydown', onDocKeydown)
})
onBeforeUnmount(() => {
  if (typeof document === 'undefined') return
  document.removeEventListener('click', onDocClick, true)
  document.removeEventListener('keydown', onDocKeydown)
})
function setSize(pt: number) {
  // execCommand fontSize sólo acepta 1..7. Mejor envolver en <span style="font-size">.
  if (!editorRef.value) return
  editorRef.value.focus()
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return
  const range = sel.getRangeAt(0)
  if (range.collapsed) {
    // Sin selección: aplicar al siguiente texto que se escriba
    const span = document.createElement('span')
    span.style.fontSize = pt + 'pt'
    span.appendChild(document.createTextNode('​'))
    range.insertNode(span)
    const newRange = document.createRange()
    newRange.setStart(span.firstChild!, 1)
    newRange.collapse(true)
    sel.removeAllRanges(); sel.addRange(newRange)
  } else {
    const span = document.createElement('span')
    span.style.fontSize = pt + 'pt'
    span.appendChild(range.extractContents())
    range.insertNode(span)
  }
  emit('update:modelValue', editorRef.value.innerHTML)
  showSizeMenu.value = false
}

function onInput() {
  if (!editorRef.value || pendingFromProp) return
  // Si el embed seleccionado se borró (p.ej. Backspace nativo sobre el texto
  // de al lado), el elemento queda desprendido del DOM: hay que soltar la
  // selección o el recuadro de tiradores se queda flotando vacío.
  if (selectedEmbed.value && !editorRef.value.contains(selectedEmbed.value)) selectedEmbed.value = null
  emit('update:modelValue', editorRef.value.innerHTML)
}

function insertLink() {
  const url = window.prompt(t('common.editor.linkPrompt'))
  if (url) cmd('createLink', url)
}

// Insertar imagen/audio inline: la selección se guarda ANTES de subir el
// archivo (el input file roba el foco y, con él, la posición del cursor).
const imageInputRef = ref<HTMLInputElement | null>(null)
const audioInputRef = ref<HTMLInputElement | null>(null)
const uploading = ref<'image' | 'audio' | null>(null)
let savedRange: Range | null = null

function saveSelection() {
  const sel = window.getSelection()
  if (sel && sel.rangeCount > 0 && editorRef.value?.contains(sel.anchorNode)) savedRange = sel.getRangeAt(0).cloneRange()
  else savedRange = null
}
function insertHtmlAtSelection(html: string) {
  if (!editorRef.value) return
  editorRef.value.focus()
  const sel = window.getSelection()
  if (savedRange && sel) { sel.removeAllRanges(); sel.addRange(savedRange) }
  document.execCommand('insertHTML', false, html)
  hydrateAudioEmbeds()
  emit('update:modelValue', editorRef.value.innerHTML)
}

function pickImage() { saveSelection(); imageInputRef.value?.click() }
function pickAudio() { saveSelection(); audioInputRef.value?.click() }

async function onImageChosen(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file || !props.uploadImage) return
  uploading.value = 'image'
  try {
    const url = await props.uploadImage(file)
    insertHtmlAtSelection(`<img class="hibi-embed" src="${url}" alt="" style="width:min(400px,100%);border-radius:12px;display:block;margin:0.5em 0" />`)
  } finally { uploading.value = null }
}
async function onAudioChosen(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file || !props.uploadAudio) return
  uploading.value = 'audio'
  try {
    const url = await props.uploadAudio(file)
    insertHtmlAtSelection(audioEmbedHtml(url))
  } finally { uploading.value = null }
}

// Reproductor de audio propio insertado como HTML crudo (no un <audio
// controls> nativo): icono play/pausa + barra de progreso + tiempo, y el
// volumen con el MISMO control que usa Spotify (.hibi-range, relleno en
// gradiente). HTML estático guardado en el contenido de la nota; su
// interactividad se conecta a mano en hydrateAudioEmbeds() (los eventos de
// <audio> no burbujean, así que no sirve la delegación normal).
function audioEmbedHtml(url: string) {
  return `<span class="hibi-embed hibi-audio-embed" contenteditable="false" style="width:min(360px,100%);display:inline-flex;margin:0.5em 0">`
    + `<span class="hibi-audio-btn" role="button" tabindex="0" aria-label="${t('common.editor.playPause')}">`
    + `<svg class="hibi-audio-play-icon" viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`
    + `<svg class="hibi-audio-pause-icon" viewBox="0 0 24 24" width="13" height="13" fill="currentColor" style="display:none"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>`
    + `</span>`
    + `<span class="hibi-audio-track"><span class="hibi-audio-fill"></span></span>`
    + `<span class="hibi-audio-time">0:00</span>`
    + `<span class="hibi-audio-mute" role="button" tabindex="0" aria-label="${t('common.editor.mute')}">`
    + `<svg class="hibi-audio-vol-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/><path d="M16 9a5 5 0 0 1 0 6"/><path d="M19.364 18.364a9 9 0 0 0 0-12.728"/></svg>`
    + `<svg class="hibi-audio-mute-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none"><path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/><line x1="22" x2="16" y1="9" y2="15"/><line x1="16" x2="22" y1="9" y2="15"/></svg>`
    + `</span>`
    + `<input class="hibi-audio-vol hibi-range" type="range" min="0" max="1" step="0.02" value="1" style="background:linear-gradient(to right, var(--color-sky-deep) 100%, var(--bg-muted) 100%)" aria-label="${t('common.editor.volume')}" />`
    + `<audio class="hibi-audio-el" src="${url}" preload="metadata"></audio>`
    + `</span>`
}

function formatAudioTime(s: number) {
  if (!isFinite(s) || s < 0) s = 0
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}
// Conecta play/pausa, progreso y volumen de cada reproductor de audio que
// todavía no tenga listeners (marcado con data-hydrated). Hay que llamarla
// después de CUALQUIER asignación de innerHTML (montaje, cambio de nota,
// inserción nueva) porque ese HTML es estático y no trae su propio JS.
function hydrateAudioEmbeds() {
  if (!editorRef.value) return
  const embeds = editorRef.value.querySelectorAll<HTMLElement>('.hibi-audio-embed:not([data-hydrated])')
  embeds.forEach((wrap) => {
    wrap.setAttribute('data-hydrated', '1')
    const audio = wrap.querySelector('audio') as HTMLAudioElement | null
    const btn = wrap.querySelector('.hibi-audio-btn') as HTMLElement | null
    const playIcon = wrap.querySelector('.hibi-audio-play-icon') as HTMLElement | null
    const pauseIcon = wrap.querySelector('.hibi-audio-pause-icon') as HTMLElement | null
    const track = wrap.querySelector('.hibi-audio-track') as HTMLElement | null
    const fill = wrap.querySelector('.hibi-audio-fill') as HTMLElement | null
    const time = wrap.querySelector('.hibi-audio-time') as HTMLElement | null
    const vol = wrap.querySelector('.hibi-audio-vol') as HTMLInputElement | null
    const muteBtn = wrap.querySelector('.hibi-audio-mute') as HTMLElement | null
    const volIcon = wrap.querySelector('.hibi-audio-vol-icon') as HTMLElement | null
    const muteIcon = wrap.querySelector('.hibi-audio-mute-icon') as HTMLElement | null
    // Notas antiguas guardaron el input sin esta clase: sin ella el navegador
    // pinta su propio control nativo encima del degradado (el "borde dorado").
    if (vol) vol.classList.add('hibi-range')
    if (!audio || !btn) return
    let preMuteVolume = 0.7
    function applyVolume(v: number) {
      audio!.volume = v
      if (vol) { vol.value = String(v); vol.style.background = `linear-gradient(to right, var(--color-sky-deep) ${Math.round(v * 100)}%, var(--bg-muted) ${Math.round(v * 100)}%)` }
      if (volIcon) volIcon.style.display = v > 0 ? '' : 'none'
      if (muteIcon) muteIcon.style.display = v > 0 ? 'none' : ''
    }
    // Pinta el degradado desde el montaje: el HTML guardado de notas antiguas
    // no trae el style inline (solo el nuevo lo genera al insertarse).
    applyVolume(audio.volume ?? 1)
    // Sin stopPropagation en el botón de play: el clic también debe burbujear
    // a onEditorClick para que el embed se pueda seleccionar (alinear/tamaño).
    btn.addEventListener('click', () => { audio.paused ? audio.play() : audio.pause() })
    btn.addEventListener('keydown', (e) => { if ((e as KeyboardEvent).key === 'Enter' || (e as KeyboardEvent).key === ' ') { e.preventDefault(); audio.paused ? audio.play() : audio.pause() } })
    audio.addEventListener('play', () => { if (playIcon) playIcon.style.display = 'none'; if (pauseIcon) pauseIcon.style.display = '' })
    audio.addEventListener('pause', () => { if (playIcon) playIcon.style.display = ''; if (pauseIcon) pauseIcon.style.display = 'none' })
    audio.addEventListener('ended', () => { if (playIcon) playIcon.style.display = ''; if (pauseIcon) pauseIcon.style.display = 'none' })
    audio.addEventListener('timeupdate', () => {
      if (fill) fill.style.width = (audio.duration ? (audio.currentTime / audio.duration) * 100 : 0) + '%'
      if (time) time.textContent = formatAudioTime(audio.currentTime)
    })
    audio.addEventListener('loadedmetadata', () => { if (time) time.textContent = formatAudioTime(audio.currentTime) })
    track?.addEventListener('click', (e) => {
      const rect = track.getBoundingClientRect()
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
      if (isFinite(audio.duration)) audio.currentTime = ratio * audio.duration
    })
    muteBtn?.addEventListener('click', () => {
      if (audio.volume > 0.001) { preMuteVolume = audio.volume; applyVolume(0) }
      else applyVolume(preMuteVolume || 0.5)
    })
    vol?.addEventListener('input', (e) => { applyVolume(parseFloat((e.target as HTMLInputElement).value)) })
  })
}

// Selección de imagen/audio insertados: click para seleccionar, barra
// flotante para alinear (izq/centro/der) y tirador para redimensionar el
// ancho. "Posición" en un editor de texto que fluye significa alineación,
// no arrastre libre XY (el texto no tendría con qué fluir alrededor).
const selectedEmbed = ref<HTMLElement | null>(null)
const overlayBox = ref({ top: 0, left: 0, width: 0, height: 0 })
function updateOverlayPos() {
  if (!selectedEmbed.value || !editorWrapRef.value) return
  const wrap = editorWrapRef.value.getBoundingClientRect()
  const el = selectedEmbed.value.getBoundingClientRect()
  overlayBox.value = { top: el.top - wrap.top, left: el.left - wrap.left, width: el.width, height: el.height }
}
function onEditorClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  const embed = target.closest('.hibi-embed') as HTMLElement | null
  if (embed && editorRef.value?.contains(embed)) { selectedEmbed.value = embed; nextTick(updateOverlayPos) }
  else selectedEmbed.value = null
}
function removeSelectedEmbed() {
  const el = selectedEmbed.value
  if (!el || !editorRef.value) return
  el.remove()
  selectedEmbed.value = null
  emit('update:modelValue', editorRef.value.innerHTML)
}
function onDocKeydown(e: KeyboardEvent) {
  if (!selectedEmbed.value) return
  if (e.key === 'Delete') {
    e.preventDefault()
    removeSelectedEmbed()
  }
}
function alignEmbed(pos: 'left' | 'center' | 'right') {
  const el = selectedEmbed.value
  if (!el || !editorRef.value) return
  if (pos === 'left') { el.style.float = 'left'; el.style.display = ''; el.style.margin = '0.2em 1em 0.4em 0' }
  else if (pos === 'right') { el.style.float = 'right'; el.style.display = ''; el.style.margin = '0.2em 0 0.4em 1em' }
  else { el.style.float = 'none'; el.style.display = el.classList.contains('hibi-audio-embed') ? 'flex' : 'block'; el.style.margin = '0.5em auto' }
  nextTick(updateOverlayPos)
  emit('update:modelValue', editorRef.value.innerHTML)
}
// Redimensionar en las 8 direcciones (4 esquinas + 4 lados), no solo una
// esquina. Como el embed vive en flujo de texto (no posición absoluta), para
// que arrastrar el lado IZQUIERDO/SUPERIOR se sienta natural (el lado
// opuesto se queda quieto) se compensa con margin-left/margin-top.
type ResizeDir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'
const RESIZE_HANDLES: { dir: ResizeDir; style: string; cursor: string }[] = [
  { dir: 'nw', style: 'top:-6px;left:-6px', cursor: 'nwse-resize' },
  { dir: 'n', style: 'top:-6px;left:50%;transform:translateX(-50%)', cursor: 'ns-resize' },
  { dir: 'ne', style: 'top:-6px;right:-6px', cursor: 'nesw-resize' },
  { dir: 'e', style: 'top:50%;right:-6px;transform:translateY(-50%)', cursor: 'ew-resize' },
  { dir: 'se', style: 'bottom:-6px;right:-6px', cursor: 'nwse-resize' },
  { dir: 's', style: 'bottom:-6px;left:50%;transform:translateX(-50%)', cursor: 'ns-resize' },
  { dir: 'sw', style: 'bottom:-6px;left:-6px', cursor: 'nesw-resize' },
  { dir: 'w', style: 'top:50%;left:-6px;transform:translateY(-50%)', cursor: 'ew-resize' },
]
// El audio es una barra de alto fijo (sus controles no crecen con la caja);
// solo tiene sentido cambiarle el ancho. Estirarlo verticalmente deja un
// hueco vacío debajo de la barra en vez de agrandar algo visible.
const visibleResizeHandles = computed(() => {
  if (selectedEmbed.value?.classList.contains('hibi-audio-embed')) {
    return RESIZE_HANDLES.filter((h) => h.dir === 'e' || h.dir === 'w')
  }
  return RESIZE_HANDLES
})
let resizeDir: ResizeDir = 'se'
let resizeStartX = 0, resizeStartY = 0, resizeStartW = 0, resizeStartH = 0, resizeStartML = 0, resizeStartMT = 0
function startResize(dir: ResizeDir, e: PointerEvent) {
  const el = selectedEmbed.value
  if (!el) return
  e.preventDefault(); e.stopPropagation()
  resizeDir = dir
  const rect = el.getBoundingClientRect()
  const cs = getComputedStyle(el)
  resizeStartX = e.clientX; resizeStartY = e.clientY
  resizeStartW = rect.width; resizeStartH = rect.height
  resizeStartML = parseFloat(cs.marginLeft) || 0
  resizeStartMT = parseFloat(cs.marginTop) || 0
  window.addEventListener('pointermove', onResizeMove)
  window.addEventListener('pointerup', onResizeUp)
}
function onResizeMove(e: PointerEvent) {
  const el = selectedEmbed.value
  if (!el || !editorRef.value) return
  const dx = e.clientX - resizeStartX, dy = e.clientY - resizeStartY
  const maxW = editorRef.value.clientWidth
  if (resizeDir.includes('e')) {
    el.style.width = Math.max(60, Math.min(maxW, resizeStartW + dx)) + 'px'
  } else if (resizeDir.includes('w')) {
    const w = Math.max(60, Math.min(maxW, resizeStartW - dx))
    el.style.width = w + 'px'
    el.style.marginLeft = (resizeStartML + (resizeStartW - w)) + 'px'
  }
  if (resizeDir.includes('s')) {
    el.style.height = Math.max(40, resizeStartH + dy) + 'px'
  } else if (resizeDir.includes('n')) {
    const h = Math.max(40, resizeStartH - dy)
    el.style.height = h + 'px'
    el.style.marginTop = (resizeStartMT + (resizeStartH - h)) + 'px'
  }
  if (el.tagName === 'IMG' && (resizeDir.includes('n') || resizeDir.includes('s'))) (el as HTMLImageElement).style.objectFit = 'cover'
  updateOverlayPos()
}
function onResizeUp() {
  window.removeEventListener('pointermove', onResizeMove)
  window.removeEventListener('pointerup', onResizeUp)
  if (editorRef.value) emit('update:modelValue', editorRef.value.innerHTML)
}
function onEditorScroll() { if (selectedEmbed.value) updateOverlayPos() }
function onWindowResize() { if (selectedEmbed.value) updateOverlayPos() }

// OJO: NO hay watch(modelValue) que re-sincronice el DOM tras el montaje.
// El padre usa :key="nota.id" para forzar un remount completo al cambiar de
// nota, así que este componente es la única fuente de verdad del contenido
// mientras está montado. Reescribir innerHTML en cada eco del valor emitido
// (lo que hacía antes) invalidaba el Range guardado para insertar imagen/
// audio a mitad de edición — el resultado era que el archivo se insertaba en
// cualquier posición vieja (por eso el audio terminaba arriba de la imagen).
onMounted(() => {
  if (editorRef.value && props.modelValue) {
    pendingFromProp = true
    editorRef.value.innerHTML = props.modelValue
    pendingFromProp = false
  }
  hydrateAudioEmbeds()
  window.addEventListener('resize', onWindowResize)
})
onBeforeUnmount(() => window.removeEventListener('resize', onWindowResize))

const tools = [
  { icon: Bold, action: 'bold', tkey: 'bold' },
  { icon: Italic, action: 'italic', tkey: 'italic' },
  { icon: Strikethrough, action: 'strikeThrough', tkey: 'strike' },
  { sep: true },
  { icon: Heading1, action: 'formatBlock', value: '<h1>', tkey: 'h1' },
  { icon: Heading2, action: 'formatBlock', value: '<h2>', tkey: 'h2' },
  { icon: Quote, action: 'formatBlock', value: '<blockquote>', tkey: 'quote' },
  { icon: Code2, action: 'formatBlock', value: '<pre>', tkey: 'code' },
  { sep: true },
  { icon: List, action: 'insertUnorderedList', tkey: 'ul' },
  { icon: ListOrdered, action: 'insertOrderedList', tkey: 'ol' },
  { sep: true },
  { icon: LinkIcon, action: 'link', tkey: 'link' },
  { sep: true },
  { icon: Undo2, action: 'undo', tkey: 'undo' },
  { icon: Redo2, action: 'redo', tkey: 'redo' },
] as const
</script>

<template>
  <div class="flex flex-col w-full h-full">
    <!-- Movil: boton para abrir/cerrar la barra de formato. Solo se renderiza
         si el estado NO está controlado por el padre (en ese caso el padre
         coloca su propio botón, p.ej. junto al título). -->
    <button v-if="!controlled" type="button"
      class="md:hidden shrink-0 self-start mb-2 inline-flex items-center gap-2 h-9 px-3 rounded-[10px] bg-muted text-fg-muted hover:text-fg transition-[color]"
      :aria-expanded="toolbarOpen"
      @click="toolbarOpen = !toolbarOpen">
      <Type class="size-[15px]" :stroke-width="2" aria-hidden="true" />
      <span class="text-[13px] font-semibold">{{ t('common.editor.format') }}</span>
      <ChevronDown class="size-3.5 transition-[transform] duration-200" :class="toolbarOpen ? 'rotate-180' : ''" :stroke-width="2.2" aria-hidden="true" />
    </button>

    <!-- Toolbar: desktop siempre visible; movil solo si toolbarOpen -->
    <div
      class="shrink-0 items-center gap-0.5 px-2 py-1.5 rounded-[12px] bg-muted flex-wrap"
      :class="toolbarOpen ? 'flex' : 'hidden md:flex'">
      <template v-for="(tool, i) in tools" :key="i">
        <span v-if="(tool as any).sep" class="w-px h-5 bg-[var(--bg-inset)] mx-1" aria-hidden="true" />
        <button v-else type="button"
          class="grid place-items-center size-8 rounded-[8px] text-fg-muted hover:bg-card hover:text-fg transition-[background-color,color]"
          :title="t('common.editor.' + (tool as any).tkey)"
          @mousedown.prevent
          @click="(tool as any).action === 'link' ? insertLink() : cmd((tool as any).action, (tool as any).value)">
          <component :is="(tool as any).icon" class="size-[15px]" :stroke-width="2" />
        </button>
      </template>

      <template v-if="uploadImage || uploadAudio">
        <span class="w-px h-5 bg-[var(--bg-inset)] mx-1" aria-hidden="true" />
        <button v-if="uploadImage" type="button"
          class="grid place-items-center size-8 rounded-[8px] text-fg-muted hover:bg-card hover:text-fg transition-[background-color,color] disabled:opacity-50"
          :title="t('common.editor.insertImage')" :disabled="uploading !== null"
          @mousedown.prevent @click="pickImage">
          <ImageIcon class="size-[15px]" :stroke-width="2" />
        </button>
        <button v-if="uploadAudio" type="button"
          class="grid place-items-center size-8 rounded-[8px] text-fg-muted hover:bg-card hover:text-fg transition-[background-color,color] disabled:opacity-50"
          :title="t('common.editor.insertAudio')" :disabled="uploading !== null"
          @mousedown.prevent @click="pickAudio">
          <Music2 class="size-[15px]" :stroke-width="2" />
        </button>
      </template>

      <span class="w-px h-5 bg-[var(--bg-inset)] mx-1" aria-hidden="true" />

      <!-- Color de letra -->
      <div class="relative">
        <button type="button" :title="t('common.editor.textColor')" data-color-trigger
          class="grid place-items-center size-8 rounded-[8px] text-fg-muted hover:bg-card hover:text-fg relative"
          @mousedown.prevent @click="toggleColorPopup('color')">
          <Palette class="size-[15px]" :stroke-width="2" />
          <span class="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full" :style="{ background: colorValue }" />
        </button>
        <Transition name="hibi-pop">
          <div v-if="showColorPopup === 'color'"
            class="hibi-color-popup absolute z-[60] top-full left-0 mt-2 w-[280px] rounded-[14px] p-3"
            :style="{ background: 'var(--bg-pop)' }"
            @mousedown.prevent>
            <AppColorPicker :model-value="colorValue" format="hex" @update:model-value="onColorChange" />
          </div>
        </Transition>
      </div>

      <!-- Resaltador -->
      <div class="relative">
        <button type="button" :title="t('common.editor.highlight')" data-color-trigger
          class="grid place-items-center size-8 rounded-[8px] text-fg-muted hover:bg-card hover:text-fg relative"
          @mousedown.prevent @click="toggleColorPopup('hilite')">
          <Highlighter class="size-[15px]" :stroke-width="2" />
          <span class="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full" :style="{ background: hiliteValue }" />
        </button>
        <Transition name="hibi-pop">
          <div v-if="showColorPopup === 'hilite'"
            class="hibi-color-popup absolute z-[60] top-full left-0 mt-2 w-[280px] rounded-[14px] p-3"
            :style="{ background: 'var(--bg-pop)' }"
            @mousedown.prevent>
            <AppColorPicker :model-value="hiliteValue" format="hex" @update:model-value="onHiliteChange" />
          </div>
        </Transition>
      </div>

      <!-- Tamaño con números -->
      <div class="relative">
        <button type="button" :title="t('common.editor.size')" data-size-trigger
          class="inline-flex items-center gap-1 h-8 px-2 rounded-[8px] text-fg-muted hover:bg-card hover:text-fg"
          @mousedown.prevent @click="showSizeMenu = !showSizeMenu">
          <span class="text-[12px] font-bold">pt</span>
          <ChevronDown class="size-3" :stroke-width="2.2" />
        </button>
        <Transition name="hibi-pop">
          <div v-if="showSizeMenu" class="hibi-size-popup absolute z-50 top-full left-0 mt-1.5 rounded-[12px] py-1 flex flex-col min-w-[80px]" :style="{ background: 'var(--bg-pop)' }">
            <button v-for="s in SIZES" :key="s" type="button"
              class="h-8 px-3 text-left text-[13px] font-semibold text-fg hover:bg-muted"
              @mousedown.prevent @click="setSize(s)">{{ s }} pt</button>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Editor -->
    <div ref="editorWrapRef" class="relative flex-1 min-h-0 flex">
      <div ref="editorRef"
        contenteditable="true" role="textbox" aria-multiline="true"
        class="hibi-rich flex-1 min-h-0 overflow-y-auto scroll-area mt-3 px-1 text-[15px] text-fg leading-relaxed outline-none"
        :style="{ minHeight: minHeight || '200px' }"
        :data-placeholder="placeholder || t('common.editor.placeholder')"
        @input="onInput" @click="onEditorClick" @scroll="onEditorScroll"></div>

      <!-- Selección de imagen/audio: barra de alinear + 8 tiradores de tamaño.
           Sin marco/outline alrededor — los tiradores y la barra ya avisan
           que está seleccionado, no hace falta un borde encima. -->
      <div v-if="selectedEmbed"
        class="hibi-embed-toolbar absolute pointer-events-none z-20"
        :style="{ top: overlayBox.top + 'px', left: overlayBox.left + 'px', width: overlayBox.width + 'px', height: overlayBox.height + 'px' }">
        <div class="pointer-events-auto absolute -top-10 left-0 flex items-center gap-0.5 px-1 h-8 rounded-[10px] shadow-sm" :style="{ background: 'var(--bg-pop)' }">
          <button type="button" class="grid place-items-center size-6 rounded-[7px] text-fg-muted hover:bg-muted hover:text-fg" :title="t('common.editor.alignLeft')" @mousedown.prevent @click="alignEmbed('left')"><AlignLeft class="size-[14px]" :stroke-width="2" /></button>
          <button type="button" class="grid place-items-center size-6 rounded-[7px] text-fg-muted hover:bg-muted hover:text-fg" :title="t('common.editor.alignCenter')" @mousedown.prevent @click="alignEmbed('center')"><AlignCenter class="size-[14px]" :stroke-width="2" /></button>
          <button type="button" class="grid place-items-center size-6 rounded-[7px] text-fg-muted hover:bg-muted hover:text-fg" :title="t('common.editor.alignRight')" @mousedown.prevent @click="alignEmbed('right')"><AlignRight class="size-[14px]" :stroke-width="2" /></button>
        </div>
        <div v-for="h in RESIZE_HANDLES" :key="h.dir"
          class="pointer-events-auto absolute size-3 rounded-full bg-sky-deep touch-none"
          :style="h.style + ';cursor:' + h.cursor"
          :title="t('common.editor.resize')"
          @pointerdown="startResize(h.dir, $event)" />
      </div>
    </div>

    <!-- Inputs de archivo ocultos, disparados por los botones de la barra -->
    <input ref="imageInputRef" type="file" accept="image/*" class="hidden" @change="onImageChosen" />
    <input ref="audioInputRef" type="file" accept="audio/*" class="hidden" @change="onAudioChosen" />
  </div>
</template>

<style scoped>
.hibi-rich:empty:before { content: attr(data-placeholder); color: var(--text-subtle); pointer-events: none; }
.hibi-rich :deep(h1) { font-size: 26px; font-weight: 800; line-height: 1.15; margin-top: 1em; margin-bottom: 0.4em; }
.hibi-rich :deep(h2) { font-size: 20px; font-weight: 800; line-height: 1.2; margin-top: 0.9em; margin-bottom: 0.4em; }
.hibi-rich :deep(p) { margin: 0.4em 0; }
.hibi-rich :deep(blockquote) { border-left: 3px solid var(--color-sky-deep); padding: 0.3em 0 0.3em 0.9em; color: var(--text-muted); margin: 0.6em 0; font-style: italic; }
.hibi-rich :deep(pre) { background: var(--bg-muted); padding: 0.8em 1em; border-radius: 12px; font-family: ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace; font-size: 13px; overflow-x: auto; }
.hibi-rich :deep(ul) { list-style: disc; padding-left: 1.4em; margin: 0.4em 0; }
.hibi-rich :deep(ol) { list-style: decimal; padding-left: 1.4em; margin: 0.4em 0; }
.hibi-rich :deep(a) { color: var(--color-sky-deep); text-decoration: underline; text-underline-offset: 2px; }
.hibi-rich :deep(strong) { font-weight: 800; }
.hibi-rich :deep(em) { font-style: italic; }

/* Imagen/audio insertados: seleccionables para mover/redimensionar. Sin
   hover ni marco propio — los tiradores ya avisan que están seleccionados. */
.hibi-rich :deep(.hibi-embed) { cursor: pointer; outline: none; }

/* Reproductor de audio propio (nada de <audio controls> nativo), sin borde */
.hibi-rich :deep(.hibi-audio-embed) {
  align-items: center; gap: 0.5em; padding: 0.45em 0.7em; border-radius: 999px;
  background: var(--bg-muted); vertical-align: middle; max-width: 100%; box-sizing: border-box;
  border: none; outline: none;
}
.hibi-rich :deep(.hibi-audio-btn) {
  display: grid; place-items: center; width: 26px; height: 26px; border-radius: 999px;
  background: var(--color-sky); color: #1f4661; flex-shrink: 0; cursor: pointer;
}
.hibi-rich :deep(.hibi-audio-track) {
  position: relative; flex: 1; min-width: 40px; height: 5px; border-radius: 999px;
  background: var(--bg-muted); cursor: pointer;
}
.hibi-rich :deep(.hibi-audio-fill) { position: absolute; inset: 0 auto 0 0; width: 0%; border-radius: 999px; background: var(--color-sky-deep); }
.hibi-rich :deep(.hibi-audio-time) { flex-shrink: 0; font-size: 11px; font-weight: 700; color: var(--text-subtle); font-variant-numeric: tabular-nums; }
.hibi-rich :deep(.hibi-audio-mute) {
  display: grid; place-items: center; width: 22px; height: 22px; border-radius: 999px;
  color: var(--text-subtle); flex-shrink: 0; cursor: pointer;
}

/* Slider de volumen: MISMO que Spotify (.hibi-range en pages/spotify.vue) —
   riel plano relleno con gradiente vía JS, perilla propia, cero bordes nativos. */
.hibi-rich :deep(.hibi-range) { -webkit-appearance: none; appearance: none; width: 56px; height: 4px; border-radius: 9999px; cursor: pointer; outline: none; flex-shrink: 0; }
.hibi-rich :deep(.hibi-range::-webkit-slider-thumb) { -webkit-appearance: none; appearance: none; width: 11px; height: 11px; border-radius: 50%; background: var(--color-sky-deep); border: none; cursor: pointer; }
.hibi-rich :deep(.hibi-range::-moz-range-thumb) { width: 11px; height: 11px; border-radius: 50%; background: var(--color-sky-deep); border: none; cursor: pointer; }
.hibi-rich :deep(.hibi-range::-moz-range-track) { height: 4px; border-radius: 9999px; background: var(--bg-muted); }
.hibi-rich :deep(.hibi-audio-btn:focus-visible),
.hibi-rich :deep(.hibi-audio-mute:focus-visible),
.hibi-rich :deep(.hibi-range:focus-visible) { outline: 2px solid var(--color-sky-deep); outline-offset: 2px; }
</style>
