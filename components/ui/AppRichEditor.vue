<script setup lang="ts">
import { Bold, Italic, Heading1, Heading2, List, ListOrdered, Quote, Code2, Strikethrough, Link as LinkIcon, Undo2, Redo2, Highlighter, Palette, ChevronDown, Type } from '@lucide/vue'
import AppColorPicker from './AppColorPicker.vue'

const props = defineProps<{ modelValue: string; placeholder?: string; minHeight?: string; toolbarOpen?: boolean }>()
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
}
onMounted(() => { if (typeof document !== 'undefined') document.addEventListener('click', onDocClick, true) })
onBeforeUnmount(() => { if (typeof document !== 'undefined') document.removeEventListener('click', onDocClick, true) })
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
  emit('update:modelValue', editorRef.value.innerHTML)
}

function insertLink() {
  const url = window.prompt(t('common.editor.linkPrompt'))
  if (url) cmd('createLink', url)
}

onMounted(() => {
  if (editorRef.value && props.modelValue) {
    pendingFromProp = true
    editorRef.value.innerHTML = props.modelValue
    pendingFromProp = false
  }
})

watch(() => props.modelValue, (v) => {
  if (editorRef.value && v !== editorRef.value.innerHTML) {
    pendingFromProp = true
    editorRef.value.innerHTML = v
    pendingFromProp = false
  }
})

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
    <div ref="editorRef"
      contenteditable="true"
      class="hibi-rich flex-1 min-h-0 overflow-y-auto scroll-area mt-3 px-1 text-[15px] text-fg leading-relaxed outline-none"
      :style="{ minHeight: minHeight || '200px' }"
      :data-placeholder="placeholder || t('common.editor.placeholder')"
      @input="onInput"></div>

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
</style>
