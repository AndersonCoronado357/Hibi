<script setup lang="ts">
// Selector de hora HH:MM totalmente custom (NO HTML5). Trigger + popover con
// dos ruedas estilo iOS (horas 0-23, minutos paso 5).
import { Clock } from '@lucide/vue'

const props = withDefaults(defineProps<{
  modelValue: string
  size?: 'sm' | 'md'
  disabled?: boolean
  minuteStep?: number
}>(), { size: 'md', disabled: false, minuteStep: 1 })

const emit = defineEmits<{ 'update:modelValue': [v: string] }>()

const open = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const popoverRef = ref<HTMLElement | null>(null)
const hoursColRef = ref<HTMLElement | null>(null)
const minsColRef = ref<HTMLElement | null>(null)
// Ruedas hora+minuto ~290px alto x 240px ancho. Auto-flip.
const { pos: popPos, recalc: recalcPos } = usePopoverPosition(triggerRef, {
  desiredHeight: 290,
  desiredWidth: 240,
  matchTriggerWidth: false,
})
function onScrollResize() { if (open.value) recalcPos() }

const parsed = computed(() => {
  const m = props.modelValue?.match(/^(\d{1,2}):(\d{1,2})$/)
  if (!m) return { h: 9, mi: 0 }
  return { h: Math.max(0, Math.min(23, Number(m[1]))), mi: Math.max(0, Math.min(59, Number(m[2]))) }
})

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const MINS = computed(() => {
  const step = Math.max(1, props.minuteStep ?? 1)
  return Array.from({ length: Math.ceil(60 / step) }, (_, i) => i * step)
})

function pickH(h: number) { emit('update:modelValue', `${String(h).padStart(2,'0')}:${String(parsed.value.mi).padStart(2,'0')}`) }
function pickM(mi: number) { emit('update:modelValue', `${String(parsed.value.h).padStart(2,'0')}:${String(mi).padStart(2,'0')}`) }

function toggle() {
  if (props.disabled) return
  open.value = !open.value
  if (open.value) {
    recalcPos()
    nextTick(() => {
      // scroll a la opción activa
      const h = hoursColRef.value?.querySelector<HTMLElement>(`[data-h="${parsed.value.h}"]`)
      const m = minsColRef.value?.querySelector<HTMLElement>(`[data-m="${parsed.value.mi}"]`)
      if (h && hoursColRef.value) hoursColRef.value.scrollTop = h.offsetTop - hoursColRef.value.clientHeight / 2 + h.clientHeight / 2
      if (m && minsColRef.value) minsColRef.value.scrollTop = m.offsetTop - minsColRef.value.clientHeight / 2 + m.clientHeight / 2
    })
  }
}
function close() { open.value = false }
function onClickOutside(e: MouseEvent) {
  const t = e.target as Node
  if (open.value && triggerRef.value && popoverRef.value && !triggerRef.value.contains(t) && !popoverRef.value.contains(t)) close()
}
function onKey(e: KeyboardEvent) { if (open.value && e.key === 'Escape') close() }
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
const display = computed(() => `${String(parsed.value.h).padStart(2,'0')}:${String(parsed.value.mi).padStart(2,'0')}`)
</script>

<template>
  <div class="relative w-full">
    <button ref="triggerRef" type="button" :disabled="disabled"
      class="w-full rounded-[12px] bg-card flex items-center gap-2 pl-3 pr-3 outline-none disabled:opacity-50"
      :class="heightClass"
      @click="toggle">
      <Clock class="size-[16px] text-fg-subtle shrink-0" :stroke-width="1.9" aria-hidden="true" />
      <span v-if="!open" class="text-[15px] font-bold text-fg tabular-nums">{{ display }}</span>
      <span v-else class="text-[15px] font-bold text-fg-subtle tabular-nums">Selecciona…</span>
    </button>
    <ClientOnly>
    <Teleport to="body">
    <Transition name="hibi-pop">
      <div v-if="open" ref="popoverRef"
        class="fixed z-[200] rounded-[18px] p-5 flex gap-5 overflow-hidden"
        :style="{ top: popPos.top + 'px', left: popPos.left + 'px', maxHeight: popPos.maxHeight + 'px', background: 'var(--bg-pop)' }">
        <div class="flex flex-col items-center">
          <p class="text-[11px] font-bold text-fg-subtle uppercase tracking-wider mb-2">Hora</p>
          <div ref="hoursColRef" class="hibi-wheel w-20 h-[220px] overflow-y-auto scroll-area flex flex-col items-center gap-1 px-1">
            <button v-for="h in HOURS" :key="h" type="button" :data-h="h"
              class="h-10 w-full text-center text-[16px] font-bold tabular-nums rounded-[10px] transition-[background-color,color] shrink-0"
              :class="parsed.h === h ? 'bg-sky-soft text-sky-deep' : 'text-fg hover:bg-muted'"
              @click="pickH(h)">{{ String(h).padStart(2,'0') }}</button>
          </div>
        </div>
        <span class="text-[28px] font-extrabold text-fg-muted self-center">:</span>
        <div class="flex flex-col items-center">
          <p class="text-[11px] font-bold text-fg-subtle uppercase tracking-wider mb-2">Min</p>
          <div ref="minsColRef" class="hibi-wheel w-20 h-[220px] overflow-y-auto scroll-area flex flex-col items-center gap-1 px-1">
            <button v-for="m in MINS" :key="m" type="button" :data-m="m"
              class="h-10 w-full text-center text-[16px] font-bold tabular-nums rounded-[10px] transition-[background-color,color] shrink-0"
              :class="parsed.mi === m ? 'bg-sky-soft text-sky-deep' : 'text-fg hover:bg-muted'"
              @click="pickM(m)">{{ String(m).padStart(2,'0') }}</button>
          </div>
        </div>
      </div>
    </Transition>
    </Teleport>
    </ClientOnly>
  </div>
</template>

<style scoped>
.hibi-pop-enter-active, .hibi-pop-leave-active {
  transition: opacity 0.18s var(--ease-out), transform 0.18s var(--ease-out);
  transform-origin: top left;
}
.hibi-pop-enter-from, .hibi-pop-leave-to { opacity: 0; transform: translateY(-6px) scale(0.96); }
</style>
