<script setup lang="ts">
// Recortador de avatar (visor circular): arrastrar para encuadrar, rueda o
// pellizco para zoom, grid de tercios al interactuar. Exporta 512×512 JPEG
// como data URL. Portado del RecorteFoto de Splitmate. Overlay a propósito
// (ajuste de imagen), pedido explícitamente.
import { X, Check, LocateFixed } from '@lucide/vue'

const props = defineProps<{ file: File | null }>()
const emit = defineEmits<{ close: []; done: [dataUrl: string] }>()
const { t } = useI18n()

const C = 280 // diámetro del visor (px)
const OUT = 512 // imagen exportada
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))

const url = ref('')
const W = ref(0)
const H = ref(0)
const zoom = ref(1)
const panX = ref(0)
const panY = ref(0)
const saving = ref(false)

let revoke: (() => void) | null = null
watch(() => props.file, (f) => {
  if (revoke) { revoke(); revoke = null }
  zoom.value = 1; panX.value = 0; panY.value = 0; W.value = 0; H.value = 0; url.value = ''
  if (!f) return
  const u = URL.createObjectURL(f)
  url.value = u
  revoke = () => URL.revokeObjectURL(u)
  const img = new Image()
  img.onload = () => { W.value = img.naturalWidth; H.value = img.naturalHeight }
  img.src = u
}, { immediate: true })

const coverScale = computed(() => (W.value && H.value) ? Math.max(C / W.value, C / H.value) : 1)
const drawScale = computed(() => coverScale.value * zoom.value)
const dispW = computed(() => W.value * drawScale.value)
const dispH = computed(() => H.value * drawScale.value)
const halfX = computed(() => (C - dispW.value) / 2)
const halfY = computed(() => (C - dispH.value) / 2)
const imgLeft = computed(() => halfX.value + clamp(panX.value, halfX.value, -halfX.value))
const imgTop = computed(() => halfY.value + clamp(panY.value, halfY.value, -halfY.value))

interface Pt { id: number; x: number; y: number }
const pointers = ref<Pt[]>([])
let lastX = 0, lastY = 0, pinchDist = 0, pinchZoom = 1
const guia = ref(false)
let timerGuia: ReturnType<typeof setTimeout> | null = null
function tocarGuia() { guia.value = true; if (timerGuia) clearTimeout(timerGuia); timerGuia = setTimeout(() => (guia.value = false), 700) }
const distf = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y)

function onDown(e: PointerEvent) {
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  pointers.value = [...pointers.value, { id: e.pointerId, x: e.clientX, y: e.clientY }]
  if (pointers.value.length === 1) { lastX = e.clientX; lastY = e.clientY }
  else if (pointers.value.length === 2) { pinchDist = distf(pointers.value[0]!, pointers.value[1]!); pinchZoom = zoom.value }
  tocarGuia()
}
function onMove(e: PointerEvent) {
  const i = pointers.value.findIndex((p) => p.id === e.pointerId)
  if (i === -1) return
  pointers.value[i] = { id: e.pointerId, x: e.clientX, y: e.clientY }
  pointers.value = [...pointers.value]
  if (pointers.value.length === 1) {
    panX.value = clamp(panX.value + (e.clientX - lastX), halfX.value, -halfX.value)
    panY.value = clamp(panY.value + (e.clientY - lastY), halfY.value, -halfY.value)
    lastX = e.clientX; lastY = e.clientY
  } else if (pointers.value.length === 2) {
    const d = distf(pointers.value[0]!, pointers.value[1]!)
    if (pinchDist > 0) zoom.value = clamp(pinchZoom * (d / pinchDist), 1, 3)
  }
  tocarGuia()
}
function onUp(e: PointerEvent) {
  pointers.value = pointers.value.filter((p) => p.id !== e.pointerId)
  if (pointers.value.length === 1) { lastX = pointers.value[0]!.x; lastY = pointers.value[0]!.y }
  tocarGuia()
}
function onWheel(e: WheelEvent) { e.preventDefault(); zoom.value = clamp(zoom.value * (e.deltaY > 0 ? 0.94 : 1.06), 1, 3); tocarGuia() }
function centrar() { zoom.value = 1; panX.value = 0; panY.value = 0; tocarGuia() }

async function guardar() {
  if (saving.value || !W.value) return
  saving.value = true
  try {
    const img = new Image()
    img.src = url.value
    await img.decode().catch(() => {})
    const canvas = document.createElement('canvas')
    canvas.width = OUT; canvas.height = OUT
    const ctx = canvas.getContext('2d')
    if (!ctx) { saving.value = false; return }
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, OUT, OUT)
    const s = OUT / C
    ctx.drawImage(img, imgLeft.value * s, imgTop.value * s, dispW.value * s, dispH.value * s)
    emit('done', canvas.toDataURL('image/jpeg', 0.9))
  } finally {
    saving.value = false
  }
}

function onKey(e: KeyboardEvent) { if (e.key === 'Escape' && !saving.value) emit('close') }
onMounted(() => { if (import.meta.client) document.addEventListener('keydown', onKey) })
onBeforeUnmount(() => { if (import.meta.client) document.removeEventListener('keydown', onKey); if (revoke) revoke() })
</script>

<template>
  <ClientOnly>
    <Teleport to="body">
      <div class="fixed inset-0 z-[200] flex items-center justify-center bg-fg/50 p-4" role="dialog" aria-modal="true" :aria-label="t('settings.cropTitle')">
        <div class="w-full max-w-md flex flex-col overflow-hidden rounded-[24px]" style="background: var(--bg-pop)">
          <header class="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
            <div class="min-w-0">
              <h2 class="text-[16px] font-extrabold text-fg">{{ t('settings.cropTitle') }}</h2>
              <p class="mt-0.5 text-[12px] text-fg-muted">{{ t('settings.cropHint') }}</p>
            </div>
            <button type="button" :disabled="saving" :aria-label="t('common.close')"
              class="grid place-items-center size-9 rounded-full bg-muted text-fg-muted hover:text-fg transition-[color] disabled:opacity-50" @click="emit('close')">
              <X class="size-[18px]" :stroke-width="2.2" />
            </button>
          </header>

          <div class="flex flex-col items-center gap-3 px-5 py-4">
            <div class="relative touch-none overflow-hidden rounded-full select-none"
              :class="pointers.length ? 'cursor-grabbing' : 'cursor-grab'"
              :style="{ width: C + 'px', height: C + 'px', maxWidth: '100%', background: 'var(--bg-base)' }"
              @pointerdown="onDown" @pointermove="onMove" @pointerup="onUp" @pointercancel="onUp" @wheel="onWheel">
              <img v-if="url" :src="url" alt="" draggable="false"
                class="pointer-events-none absolute max-w-none select-none"
                :style="{ width: dispW + 'px', height: dispH + 'px', left: imgLeft + 'px', top: imgTop + 'px' }" />
              <!-- Guías (grid de tercios + cruz) al interactuar -->
              <div class="pointer-events-none absolute inset-0 transition-opacity duration-300" :class="guia ? 'opacity-100' : 'opacity-0'">
                <div class="absolute top-0 bottom-0 left-1/3 w-px bg-white/45" />
                <div class="absolute top-0 bottom-0 left-2/3 w-px bg-white/45" />
                <div class="absolute right-0 left-0 top-1/3 h-px bg-white/45" />
                <div class="absolute right-0 left-0 top-2/3 h-px bg-white/45" />
                <div class="absolute top-1/2 left-1/2 size-3 -translate-x-1/2 -translate-y-1/2">
                  <div class="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-white/70" />
                  <div class="absolute top-0 left-1/2 h-full w-px -translate-x-1/2 bg-white/70" />
                </div>
              </div>
              <div class="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-white/15" />
            </div>

            <button type="button" :disabled="zoom === 1 && panX === 0 && panY === 0"
              class="inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[12px] font-bold text-fg-muted hover:text-sky-deep hover:bg-sky-soft transition-[background-color,color] disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-fg-muted" @click="centrar">
              <LocateFixed class="size-[14px]" :stroke-width="2.2" /> {{ t('settings.cropCenter') }}
            </button>
          </div>

          <footer class="flex gap-2 px-5 pt-2 pb-5">
            <button type="button" :disabled="saving" class="flex-1 h-11 rounded-[14px] bg-muted text-fg font-bold text-[14px] disabled:opacity-50" @click="emit('close')">{{ t('common.cancel') }}</button>
            <button type="button" :disabled="saving || !W" class="flex-[1.4] h-11 rounded-[14px] bg-sky-deep text-white font-bold text-[14px] disabled:opacity-50 inline-flex items-center justify-center gap-2" @click="guardar">
              <Check v-if="!saving" class="size-[16px]" :stroke-width="2.6" />
              {{ saving ? t('settings.cropSaving') : t('settings.cropUse') }}
            </button>
          </footer>
        </div>
      </div>
    </Teleport>
  </ClientOnly>
</template>
