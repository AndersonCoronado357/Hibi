<script setup lang="ts">
// Selector custom. Popover teleportado al body para escapar de cualquier
// overflow-hidden del contenedor padre.
import { ChevronDown, Check } from '@lucide/vue'

interface Option { value: string | number; label: string; hint?: string }

const props = withDefaults(
  defineProps<{
    modelValue: string | number
    options: Option[]
    placeholder?: string
    label?: string
    size?: 'sm' | 'md'
    disabled?: boolean
    /** Fondo del trigger: 'card' (blanco, por defecto) o 'muted' (azulito) */
    tone?: 'card' | 'muted'
  }>(),
  { placeholder: 'Selecciona…', size: 'md', disabled: false, tone: 'card' },
)

const emit = defineEmits<{ 'update:modelValue': [v: string | number] }>()

const open = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const popoverRef = ref<HTMLElement | null>(null)
const activeIndex = ref(-1)
const id = useId()

const selected = computed(() => props.options.find(o => o.value === props.modelValue))

// Auto-flip arriba/abajo segun espacio en el viewport.
const { pos: popPos, recalc: recalcPos } = usePopoverPosition(triggerRef, {
  matchTriggerWidth: true,
  desiredHeight: 280,
})

function toggle() {
  if (props.disabled) return
  open.value = !open.value
  if (open.value) {
    recalcPos()
    activeIndex.value = Math.max(0, props.options.findIndex(o => o.value === props.modelValue))
    nextTick(() => popoverRef.value?.querySelector<HTMLElement>('[data-active]')?.focus())
  }
}
function close() { open.value = false; triggerRef.value?.focus() }
function pick(v: string | number) { emit('update:modelValue', v); close() }
function move(d: 1 | -1) {
  if (!open.value) { open.value = true; recalcPos(); activeIndex.value = 0; return }
  const n = props.options.length
  activeIndex.value = (activeIndex.value + d + n) % n
  nextTick(() => popoverRef.value?.querySelector<HTMLElement>('[data-active]')?.focus())
}

function onClickOutside(e: MouseEvent) {
  const t = e.target as Node
  if (open.value && triggerRef.value && popoverRef.value && !triggerRef.value.contains(t) && !popoverRef.value.contains(t)) close()
}
function onKey(e: KeyboardEvent) {
  if (!open.value) return
  if (e.key === 'Escape') { e.preventDefault(); close() }
  if (e.key === 'ArrowDown') { e.preventDefault(); move(1) }
  if (e.key === 'ArrowUp') { e.preventDefault(); move(-1) }
  if (e.key === 'Enter') { e.preventDefault(); const o = props.options[activeIndex.value]; if (o) pick(o.value) }
}
function onScrollResize() { if (open.value) recalcPos() }
onMounted(() => {
  if (typeof document === 'undefined') return
  document.addEventListener('click', onClickOutside, true)
  document.addEventListener('keydown', onKey)
  window.addEventListener('scroll', onScrollResize, true)
  window.addEventListener('resize', onScrollResize)
})
onBeforeUnmount(() => {
  if (typeof document === 'undefined') return
  document.removeEventListener('click', onClickOutside, true)
  document.removeEventListener('keydown', onKey)
  window.removeEventListener('scroll', onScrollResize, true)
  window.removeEventListener('resize', onScrollResize)
})

const heightClass = computed(() => props.size === 'sm' ? 'h-10' : 'h-12')
const textClass = computed(() => props.size === 'sm' ? 'text-[13.5px]' : 'text-[14.5px]')
const bgClass = computed(() => props.tone === 'muted' ? 'bg-muted' : 'bg-card')
</script>

<template>
  <div class="relative w-full">
    <label v-if="label" :for="id" class="block text-[12.5px] font-semibold text-fg-muted mb-1.5 px-1">{{ label }}</label>
    <button
      :id="id"
      ref="triggerRef"
      type="button"
      :disabled="disabled"
      :aria-expanded="open"
      :aria-haspopup="'listbox'"
      class="hibi-no-hover w-full rounded-[12px] px-3 pr-9 flex items-center justify-between outline-none disabled:opacity-50 relative"
      :class="[heightClass, textClass, bgClass]"
      @click="toggle"
      @keydown.down.prevent="move(1)"
      @keydown.up.prevent="move(-1)"
      @keydown.enter.prevent="toggle"
    >
      <span v-if="selected && !open" class="text-fg font-semibold truncate">{{ selected.label }}</span>
      <span v-else class="text-fg-subtle">{{ placeholder }}</span>
      <ChevronDown class="absolute right-3 size-4 text-fg-subtle transition-[transform] duration-150" :class="open ? 'rotate-180' : ''" :stroke-width="2" aria-hidden="true" />
    </button>

    <!-- Popover TELEPORTED al body para escapar de overflow-hidden -->
    <ClientOnly>
    <Teleport to="body">
      <Transition name="hibi-pop">
        <div
          v-if="open"
          ref="popoverRef"
          role="listbox"
          class="fixed z-[200] rounded-[14px] py-1.5 overflow-y-auto scroll-area"
          :style="{ top: popPos.top + 'px', left: popPos.left + 'px', width: popPos.width + 'px', maxHeight: popPos.maxHeight + 'px', background: 'var(--bg-pop)' }"
        >
          <button
            v-for="(o, i) in options"
            :key="o.value"
            type="button"
            role="option"
            :aria-selected="o.value === modelValue"
            :data-active="i === activeIndex || null"
            class="w-full px-3.5 h-10 flex items-center justify-between gap-2 text-left text-[14px] font-semibold transition-[background-color] duration-100 focus:outline-none"
            :class="o.value === modelValue ? 'bg-sky-soft text-sky-deep' : 'text-fg hover:bg-muted focus:bg-muted'"
            @click="pick(o.value)"
          >
            <span class="truncate">{{ o.label }}</span>
            <Check v-if="o.value === modelValue" class="size-[15px] shrink-0" :stroke-width="2.4" aria-hidden="true" />
            <span v-else-if="o.hint" class="text-[11.5px] text-fg-subtle">{{ o.hint }}</span>
          </button>
        </div>
      </Transition>
    </Teleport>
    </ClientOnly>
  </div>
</template>

<style scoped>
.hibi-pop-enter-active, .hibi-pop-leave-active {
  transition: opacity 0.16s var(--ease-out, ease), transform 0.16s var(--ease-out, ease);
  transform-origin: top center;
}
.hibi-pop-enter-from, .hibi-pop-leave-to { opacity: 0; transform: translateY(-4px); }
/* Si abre hacia arriba, invertimos el origen del transform */
.hibi-pop-enter-active.up, .hibi-pop-leave-active.up { transform-origin: bottom center; }
</style>
