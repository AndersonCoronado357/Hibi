<script setup lang="ts">
import { Bold, Italic, Heading1, Heading2, List, ListOrdered, Quote, Code2, Strikethrough, Link as LinkIcon, Undo2, Redo2, Highlighter, Palette, ChevronDown } from '@lucide/vue'
import AppColorPicker from './AppColorPicker.vue'

const props = defineProps<{ modelValue: string; placeholder?: string; minHeight?: string }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

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
  const url = window.prompt('URL del enlace')
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
  { icon: Bold, action: 'bold', label: 'Negrita' },
  { icon: Italic, action: 'italic', label: 'Cursiva' },
  { icon: Strikethrough, action: 'strikeThrough', label: 'Tachado' },
  { sep: true },
  { icon: Heading1, action: 'formatBlock', value: '<h1>', label: 'Título grande' },
  { icon: Heading2, action: 'formatBlock', value: '<h2>', label: 'Título medio' },
  { icon: Quote, action: 'formatBlock', value: '<blockquote>', label: 'Cita' },
  { icon: Code2, action: 'formatBlock', value: '<pre>', label: 'Código' },
  { sep: true },
  { icon: List, action: 'insertUnorderedList', label: 'Lista' },
  { icon: ListOrdered, action: 'insertOrderedList', label: 'Lista numerada' },
  { sep: true },
  { icon: LinkIcon, action: 'link', label: 'Enlace' },
  { sep: true },
  { icon: Undo2, action: 'undo', label: 'Deshacer' },
  { icon: Redo2, action: 'redo', label: 'Rehacer' },
] as const
</script>

<template>
  <div class="flex flex-col w-full h-full">
    <!-- Toolbar -->
    <div class="shrink-0 flex items-center gap-0.5 px-2 py-1.5 rounded-[12px] bg-muted flex-wrap">
      <template v-for="(t, i) in tools" :key="i">
        <span v-if="(t as any).sep" class="w-px h-5 bg-[var(--bg-inset)] mx-1" aria-hidden="true" />
        <button v-else type="button"
          class="grid place-items-center size-8 rounded-[8px] text-fg-muted hover:bg-card hover:text-fg transition-[background-color,color]"
          :title="(t as any).label"
          @mousedown.prevent
          @click="(t as any).action === 'link' ? insertLink() : cmd((t as any).action, (t as any).value)">
          <component :is="(t as any).icon" class="size-[15px]" :stroke-width="2" />
        </button>
      </template>

      <span class="w-px h-5 bg-[var(--bg-inset)] mx-1" aria-hidden="true" />

      <!-- Color de letra -->
      <div class="relative">
        <button type="button" title="Color del texto" data-color-trigger
          class="grid place-items-center size-8 rounded-[8px] text-fg-muted hover:bg-card hover:text-fg relative"
          @mousedown.prevent @click="toggleColorPopup('color')">
          <Palette class="size-[15px]" :stroke-width="2" />
          <span class="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full" :style="{ background: colorValue }" />
        </button>
        <Transition name="hibi-pop">
          <div v-if="showColorPopup === 'color'"
            class="hibi-color-popup absolute z-[60] top-full left-0 mt-2 w-[280px] bg-card rounded-[14px] p-3 shadow-[0_10px_30px_rgba(15,18,30,0.18)]"
            @mousedown.prevent>
            <AppColorPicker :model-value="colorValue" format="hex" @update:model-value="onColorChange" />
          </div>
        </Transition>
      </div>

      <!-- Resaltador -->
      <div class="relative">
        <button type="button" title="Resaltador" data-color-trigger
          class="grid place-items-center size-8 rounded-[8px] text-fg-muted hover:bg-card hover:text-fg relative"
          @mousedown.prevent @click="toggleColorPopup('hilite')">
          <Highlighter class="size-[15px]" :stroke-width="2" />
          <span class="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full" :style="{ background: hiliteValue }" />
        </button>
        <Transition name="hibi-pop">
          <div v-if="showColorPopup === 'hilite'"
            class="hibi-color-popup absolute z-[60] top-full left-0 mt-2 w-[280px] bg-card rounded-[14px] p-3 shadow-[0_10px_30px_rgba(15,18,30,0.18)]"
            @mousedown.prevent>
            <AppColorPicker :model-value="hiliteValue" format="hex" @update:model-value="onHiliteChange" />
          </div>
        </Transition>
      </div>

      <!-- Tamaño con números -->
      <div class="relative">
        <button type="button" title="Tamaño" data-size-trigger
          class="inline-flex items-center gap-1 h-8 px-2 rounded-[8px] text-fg-muted hover:bg-card hover:text-fg"
          @mousedown.prevent @click="showSizeMenu = !showSizeMenu">
          <span class="text-[12px] font-bold">pt</span>
          <ChevronDown class="size-3" :stroke-width="2.2" />
        </button>
        <Transition name="hibi-pop">
          <div v-if="showSizeMenu" class="hibi-size-popup absolute z-50 top-full left-0 mt-1.5 bg-card rounded-[12px] py-1 flex flex-col min-w-[80px] shadow-[0_6px_20px_rgba(15,18,30,0.10)]">
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
      :data-placeholder="placeholder || 'Empieza a escribir…'"
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
