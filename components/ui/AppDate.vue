<script setup lang="ts">
// Date picker custom basado en date-fns. Botón trigger + popover con
// calendario propio. Devuelve el valor en formato yyyy-MM-dd.
import { Calendar, ChevronLeft, ChevronRight } from '@lucide/vue'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths,
  format, isSameDay, isSameMonth, isToday, parseISO, isValid,
} from 'date-fns'
import { es } from 'date-fns/locale'

const props = withDefaults(
  defineProps<{
    modelValue: string | null
    label?: string
    placeholder?: string
    size?: 'sm' | 'md'
    disabled?: boolean
  }>(),
  { placeholder: 'Elegir fecha', size: 'md', disabled: false },
)
const emit = defineEmits<{ 'update:modelValue': [v: string] }>()

const open = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const popoverRef = ref<HTMLElement | null>(null)
const id = useId()
const popPos = ref({ top: 0, left: 0 })
function recalcPos() {
  if (!triggerRef.value) return
  const r = triggerRef.value.getBoundingClientRect()
  popPos.value = { top: r.bottom + 6, left: r.left }
}

const parsed = computed(() => {
  if (!props.modelValue) return null
  const d = parseISO(props.modelValue)
  return isValid(d) ? d : null
})
const cursor = ref<Date>(parsed.value ?? new Date())
watch(() => props.modelValue, v => { if (v) { const d = parseISO(v); if (isValid(d)) cursor.value = d } })

const weekDays = ['L','M','X','J','V','S','D']
const days = computed(() => {
  const gs = startOfWeek(startOfMonth(cursor.value), { weekStartsOn: 1 })
  const ge = endOfWeek(endOfMonth(cursor.value), { weekStartsOn: 1 })
  const out: Date[] = []; let d = gs
  while (d <= ge) { out.push(d); d = addDays(d, 1) }
  return out
})

function toggle() {
  if (props.disabled) return
  open.value = !open.value
  if (open.value) { cursor.value = parsed.value ?? new Date(); recalcPos() }
}
function onScrollResize() { if (open.value) recalcPos() }
function close() { open.value = false; triggerRef.value?.focus() }
function pick(d: Date) { emit('update:modelValue', format(d, 'yyyy-MM-dd')); close() }
function pickToday() { pick(new Date()) }

function onClickOutside(e: MouseEvent) {
  const t = e.target as Node
  if (open.value && triggerRef.value && popoverRef.value && !triggerRef.value.contains(t) && !popoverRef.value.contains(t)) close()
}
function onKey(e: KeyboardEvent) {
  if (open.value && e.key === 'Escape') { e.preventDefault(); close() }
}
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

const display = computed(() => parsed.value ? format(parsed.value, "d 'de' MMM yyyy", { locale: es }) : '')
// Estándar global de altura para inputs/selects/dates: h-12 (md) / h-10 (sm)
const heightClass = computed(() => props.size === 'sm' ? 'h-10' : 'h-12')
const textClass = computed(() => props.size === 'sm' ? 'text-[13.5px]' : 'text-[14.5px]')
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
      class="w-full rounded-[12px] bg-muted hover:bg-inset focus:bg-inset pl-10 pr-3 flex items-center outline-none transition-[background-color] duration-150 disabled:opacity-50"
      :class="[heightClass, textClass]"
      @click="toggle"
    >
      <Calendar class="absolute left-3 size-[16px] text-fg-subtle" :stroke-width="1.9" aria-hidden="true" />
      <span v-if="display && !open" class="text-fg font-semibold truncate">{{ display }}</span>
      <span v-else class="text-fg-subtle">{{ placeholder }}</span>
    </button>

    <ClientOnly>
    <Teleport to="body">
    <Transition name="hibi-pop">
      <div
        v-if="open"
        ref="popoverRef"
        role="dialog"
        aria-label="Elegir fecha"
        class="fixed z-[200] rounded-[16px] p-3 w-[280px]"
        :style="{ top: popPos.top + 'px', left: popPos.left + 'px', background: 'var(--bg-pop)' }"
      >
        <div class="flex items-center justify-between mb-2">
          <button type="button" class="grid place-items-center size-8 rounded-[10px] text-fg-muted hover:bg-muted hover:text-fg transition-[background-color]" aria-label="Mes anterior" @click="cursor = subMonths(cursor, 1)"><ChevronLeft class="size-4" :stroke-width="2" /></button>
          <p class="text-[13.5px] font-bold text-fg capitalize">{{ format(cursor, 'MMMM yyyy', { locale: es }) }}</p>
          <button type="button" class="grid place-items-center size-8 rounded-[10px] text-fg-muted hover:bg-muted hover:text-fg transition-[background-color]" aria-label="Mes siguiente" @click="cursor = addMonths(cursor, 1)"><ChevronRight class="size-4" :stroke-width="2" /></button>
        </div>
        <div class="grid grid-cols-7 gap-0.5 text-center text-[10.5px] font-bold uppercase tracking-wide text-fg-subtle mb-1">
          <span v-for="d in weekDays" :key="d">{{ d }}</span>
        </div>
        <div class="grid grid-cols-7 gap-0.5">
          <button
            v-for="d in days"
            :key="d.toISOString()"
            type="button"
            class="aspect-square text-[12.5px] font-semibold rounded-[8px] transition-[background-color,color]"
            :class="[
              !isSameMonth(d, cursor) ? 'text-fg-subtle opacity-50 hover:bg-muted' : 'text-fg hover:bg-muted',
              parsed && isSameDay(d, parsed) ? 'bg-sky text-[#1f4661]' : '',
              !(parsed && isSameDay(d, parsed)) && isToday(d) ? 'ring-1 ring-sky-deep' : '',
            ]"
            @click="pick(d)"
          >{{ format(d, 'd') }}</button>
        </div>
        <div class="flex justify-between mt-2 pt-2">
          <button type="button" class="text-[12.5px] font-bold text-fg-muted hover:text-fg" @click="close">Cancelar</button>
          <button type="button" class="text-[12.5px] font-bold text-sky-deep hover:underline" @click="pickToday">Hoy</button>
        </div>
      </div>
    </Transition>
    </Teleport>
    </ClientOnly>
  </div>
</template>

<style scoped>
.hibi-pop-enter-active, .hibi-pop-leave-active {
  transition: opacity 0.16s ease, transform 0.16s ease;
  transform-origin: top center;
}
.hibi-pop-enter-from, .hibi-pop-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
