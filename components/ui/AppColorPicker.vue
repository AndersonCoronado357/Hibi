<script setup lang="ts">
// Color picker INLINE compacto: presets + cuadrado SV + slider hue + inputs RGB.
import { Check } from '@lucide/vue'

const props = withDefaults(defineProps<{
  modelValue: string
  format?: 'rgb' | 'hex'
  compact?: boolean
  /** Oculta la fila de colores predefinidos (solo selector libre). */
  hidePresets?: boolean
}>(), { modelValue: '#5aa6d2', format: 'rgb', compact: false, hidePresets: false })
const emit = defineEmits<{ 'update:modelValue': [v: string] }>()

const PRESETS = [
  '#5aa6d2','#34936a','#c5733f','#db8aa3','#7a63c0','#bf8f2e','#e0654d','#56a8a8',
]

// ─── Conversiones ───
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const m = hex.replace('#', '').match(/^([0-9a-f]{6}|[0-9a-f]{3})$/i)
  if (!m) return { r: 90, g: 166, b: 210 }
  let h = m[1]!
  if (h.length === 3) h = h.split('').map(c => c + c).join('')
  return { r: parseInt(h.slice(0,2), 16), g: parseInt(h.slice(2,4), 16), b: parseInt(h.slice(4,6), 16) }
}
function rgbToHex(r: number, g: number, b: number): string {
  const c = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')
  return '#' + c(r) + c(g) + c(b)
}
function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  const v = max
  const s = max === 0 ? 0 : d / max
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60; if (h < 0) h += 360
  }
  return { h, s, v }
}
function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  const c = v * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v - c
  let r = 0, g = 0, b = 0
  if (h < 60)      { r = c; g = x; b = 0 }
  else if (h < 120){ r = x; g = c; b = 0 }
  else if (h < 180){ r = 0; g = c; b = x }
  else if (h < 240){ r = 0; g = x; b = c }
  else if (h < 300){ r = x; g = 0; b = c }
  else             { r = c; g = 0; b = x }
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 }
}

const internalHsv = ref(rgbToHsv(...Object.values(hexToRgb(props.modelValue)) as [number, number, number]))
const rgb = computed(() => hsvToRgb(internalHsv.value.h, internalHsv.value.s, internalHsv.value.v))
const hex = computed(() => rgbToHex(rgb.value.r, rgb.value.g, rgb.value.b))

watch(() => props.modelValue, (v) => {
  if (v?.toLowerCase() !== hex.value.toLowerCase()) {
    const rgbN = hexToRgb(v)
    const hsv = rgbToHsv(rgbN.r, rgbN.g, rgbN.b)
    if (hsv.s === 0) hsv.h = internalHsv.value.h
    internalHsv.value = hsv
  }
})

function emitChange() { emit('update:modelValue', hex.value) }
function pickPreset(c: string) {
  const rgbN = hexToRgb(c)
  const hsv = rgbToHsv(rgbN.r, rgbN.g, rgbN.b)
  if (hsv.s === 0) hsv.h = internalHsv.value.h
  internalHsv.value = hsv
  emit('update:modelValue', c)
}

const svRef = ref<HTMLDivElement | null>(null)
function onSvPointer(e: PointerEvent) {
  if (!svRef.value) return
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  updateSv(e)
}
function onSvMove(e: PointerEvent) { if (e.buttons === 0) return; updateSv(e) }
function onSvUp(e: PointerEvent) { (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId) }
function updateSv(e: PointerEvent) {
  const rect = svRef.value!.getBoundingClientRect()
  const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))
  internalHsv.value = { h: internalHsv.value.h, s: x, v: 1 - y }
  emitChange()
}

const hueRef = ref<HTMLDivElement | null>(null)
function onHuePointer(e: PointerEvent) {
  if (!hueRef.value) return
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  updateHue(e)
}
function onHueMove(e: PointerEvent) { if (e.buttons === 0) return; updateHue(e) }
function onHueUp(e: PointerEvent) { (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId) }
function updateHue(e: PointerEvent) {
  const rect = hueRef.value!.getBoundingClientRect()
  const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  internalHsv.value = { ...internalHsv.value, h: x * 360 }
  emitChange()
}

function setHex(raw: string) {
  let h = raw.trim().replace(/^#/, '')
  if (!/^[0-9a-f]{3}$|^[0-9a-f]{6}$/i.test(h)) return
  if (h.length === 3) h = h.split('').map(c => c + c).join('')
  const r = parseInt(h.slice(0,2), 16), g = parseInt(h.slice(2,4), 16), b = parseInt(h.slice(4,6), 16)
  const hsv = rgbToHsv(r, g, b)
  if (hsv.s === 0) hsv.h = internalHsv.value.h
  internalHsv.value = hsv
  emit('update:modelValue', '#' + h.toLowerCase())
}

function setR(v: number) {
  const hsv = rgbToHsv(Math.max(0, Math.min(255, v || 0)), rgb.value.g, rgb.value.b)
  if (hsv.s === 0) hsv.h = internalHsv.value.h
  internalHsv.value = hsv; emitChange()
}
function setG(v: number) {
  const hsv = rgbToHsv(rgb.value.r, Math.max(0, Math.min(255, v || 0)), rgb.value.b)
  if (hsv.s === 0) hsv.h = internalHsv.value.h
  internalHsv.value = hsv; emitChange()
}
function setB(v: number) {
  const hsv = rgbToHsv(rgb.value.r, rgb.value.g, Math.max(0, Math.min(255, v || 0)))
  if (hsv.s === 0) hsv.h = internalHsv.value.h
  internalHsv.value = hsv; emitChange()
}

const hueColor = computed(() => {
  const { r, g, b } = hsvToRgb(internalHsv.value.h, 1, 1)
  return rgbToHex(r, g, b)
})
</script>

<template>
  <div class="w-full h-full flex flex-col gap-3 min-h-[260px]">
    <!-- Presets iniciales: SIEMPRE una sola fila -->
    <div v-if="!hidePresets" class="shrink-0 grid grid-cols-8 gap-1.5">
      <button v-for="c in PRESETS" :key="c" type="button"
        :aria-label="'Color ' + c"
        class="w-full aspect-square rounded-full grid place-items-center transition-[transform] hover:scale-110"
        :style="{ background: c }"
        @click="pickPreset(c)">
        <Check v-if="hex.toLowerCase() === c.toLowerCase()" class="size-[14px] text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]" :stroke-width="3" />
      </button>
    </div>

    <!-- Cuadrado SV — ocupa el alto disponible -->
    <div ref="svRef"
      class="relative w-full flex-1 min-h-[120px] rounded-[12px] cursor-crosshair touch-none select-none overflow-hidden"
      :style="{
        background: `
          linear-gradient(to top, #000, transparent),
          linear-gradient(to right, #fff, ${hueColor})
        `
      }"
      @pointerdown="onSvPointer"
      @pointermove="onSvMove"
      @pointerup="onSvUp"
      @pointercancel="onSvUp">
      <span class="absolute size-4 rounded-full border-2 border-white pointer-events-none -translate-x-1/2 -translate-y-1/2 shadow-[0_0_0_1px_rgba(0,0,0,0.4)]"
        :style="{ left: (internalHsv.s * 100) + '%', top: ((1 - internalHsv.v) * 100) + '%' }" />
    </div>

    <!-- Slider hue -->
    <div ref="hueRef"
      class="relative w-full h-2.5 rounded-full cursor-pointer touch-none select-none"
      :style="{ background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)' }"
      @pointerdown="onHuePointer"
      @pointermove="onHueMove"
      @pointerup="onHueUp"
      @pointercancel="onHueUp">
      <span class="absolute top-1/2 size-4 rounded-full border-2 border-white pointer-events-none -translate-x-1/2 -translate-y-1/2 shadow-[0_1px_3px_rgba(0,0,0,0.4)]"
        :style="{ left: (internalHsv.h / 360 * 100) + '%', background: hueColor }" />
    </div>

    <!-- Salida: HEX o RGB según prop -->
    <div class="flex items-center gap-2">
      <span class="size-9 rounded-[8px] shrink-0" :style="{ background: hex }" aria-hidden="true" />
      <!-- HEX único -->
      <div v-if="format === 'hex'" class="flex-1 flex items-center bg-muted rounded-[8px] h-9 px-3">
        <span class="text-[11px] font-bold text-fg-muted mr-2">HEX</span>
        <input type="text" :value="hex.toUpperCase()" maxlength="7"
          class="flex-1 w-0 bg-transparent text-[13px] font-bold text-fg tabular-nums outline-none uppercase tracking-wide"
          @input="setHex(($event.target as HTMLInputElement).value)" />
      </div>
      <!-- RGB tres campos -->
      <div v-else class="flex-1 grid grid-cols-3 gap-1.5">
        <div class="flex items-center bg-muted rounded-[8px] h-9 px-1.5">
          <span class="text-[10px] font-bold text-fg-muted mr-1">R</span>
          <input type="number" min="0" max="255" :value="Math.round(rgb.r)"
            class="flex-1 w-0 bg-transparent text-center text-[12.5px] font-bold text-fg tabular-nums outline-none"
            @input="setR(Number(($event.target as HTMLInputElement).value))" />
        </div>
        <div class="flex items-center bg-muted rounded-[8px] h-9 px-1.5">
          <span class="text-[10px] font-bold text-fg-muted mr-1">G</span>
          <input type="number" min="0" max="255" :value="Math.round(rgb.g)"
            class="flex-1 w-0 bg-transparent text-center text-[12.5px] font-bold text-fg tabular-nums outline-none"
            @input="setG(Number(($event.target as HTMLInputElement).value))" />
        </div>
        <div class="flex items-center bg-muted rounded-[8px] h-9 px-1.5">
          <span class="text-[10px] font-bold text-fg-muted mr-1">B</span>
          <input type="number" min="0" max="255" :value="Math.round(rgb.b)"
            class="flex-1 w-0 bg-transparent text-center text-[12.5px] font-bold text-fg tabular-nums outline-none"
            @input="setB(Number(($event.target as HTMLInputElement).value))" />
        </div>
      </div>
    </div>
  </div>
</template>
