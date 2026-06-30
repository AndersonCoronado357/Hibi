<script setup lang="ts">
// Mascota flotante que lleva a /chat.
//  · Móvil: ~10% más pequeña, ARRASTRABLE a cualquier parte de la pantalla.
//    Si se suelta sobre la zona de descarte (abajo-centro) se elimina.
//  · Tap (sin arrastrar) abre el chat. Posición y descarte se recuerdan.
//  · Se oculta cuando ya estás en /chat.
import { Trash2 } from '@lucide/vue'

const route = useRoute()
const router = useRouter()
const hideOnChat = computed(() => route.path.startsWith('/chat'))

const { dismissed, init: initFab, setDismissed } = useFab()
const pos = ref<{ x: number; y: number } | null>(null) // left/top px; null = esquina por defecto
const dragging = ref(false)
const overTrash = ref(false)
const isWide = ref(false)
const fabRef = ref<HTMLElement | null>(null)

const size = computed(() => (isWide.value ? 78 : 70)) // 78→70 ≈ 10% menor en móvil

onMounted(() => {
  if (!import.meta.client) return
  initFab()
  const saved = localStorage.getItem('hibi.fab.pos')
  if (saved) { try { pos.value = JSON.parse(saved) } catch { /* ignore */ } }
  const mq = window.matchMedia('(min-width: 768px)')
  isWide.value = mq.matches
  const onMq = (e: MediaQueryListEvent) => { isWide.value = e.matches }
  mq.addEventListener('change', onMq)
  onBeforeUnmount(() => mq.removeEventListener('change', onMq))
})

// Si se elimina, se puede volver a mostrar desde Ajustes.
function restore() { setDismissed(false) }
defineExpose({ restore })

let startX = 0, startY = 0, originX = 0, originY = 0, moved = false

function clamp(x: number, y: number) {
  const s = size.value
  const nx = Math.max(8, Math.min(window.innerWidth - s - 8, x))
  const ny = Math.max(72, Math.min(window.innerHeight - s - 8, y))
  return { x: nx, y: ny }
}

function isOverTrash(cx: number, cy: number) {
  const zoneY = window.innerHeight - 132
  const half = 84
  return cy > zoneY && cx > window.innerWidth / 2 - half && cx < window.innerWidth / 2 + half
}

function onPointerDown(e: PointerEvent) {
  if (e.button !== undefined && e.button !== 0) return
  const rect = fabRef.value!.getBoundingClientRect()
  originX = rect.left; originY = rect.top
  startX = e.clientX; startY = e.clientY
  moved = false
  dragging.value = true
  pos.value = { x: originX, y: originY }
  try { (e.target as HTMLElement).setPointerCapture?.(e.pointerId) } catch { /* ignore */ }
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
}

function onPointerMove(e: PointerEvent) {
  const dx = e.clientX - startX, dy = e.clientY - startY
  if (Math.abs(dx) > 4 || Math.abs(dy) > 4) moved = true
  pos.value = clamp(originX + dx, originY + dy)
  overTrash.value = isOverTrash(e.clientX, e.clientY)
}

function onPointerUp() {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  dragging.value = false
  if (overTrash.value) {
    setDismissed(true)
    overTrash.value = false
    return
  }
  if (!moved) { router.push('/chat'); return }
  if (import.meta.client && pos.value) localStorage.setItem('hibi.fab.pos', JSON.stringify(pos.value))
}

const fabStyle = computed(() => {
  if (pos.value) return { left: pos.value.x + 'px', top: pos.value.y + 'px', right: 'auto', bottom: 'auto' }
  return {}
})

// El tooltip (hover en PC) se adapta: si la nube está en la mitad derecha,
// el globo sale a la IZQUIERDA; si está a la izquierda, sale a la DERECHA.
const tipLeft = ref(true)
watchEffect(() => {
  if (!import.meta.client) return
  const cx = pos.value ? pos.value.x + size.value / 2 : window.innerWidth - 40
  tipLeft.value = cx > window.innerWidth / 2
})
</script>

<template>
  <div v-if="!hideOnChat && !dismissed">
    <!-- Zona de descarte (abajo-centro), sólo visible mientras arrastras -->
    <Teleport to="body">
      <Transition name="trash-fade">
        <div
          v-if="dragging"
          class="fixed left-1/2 -translate-x-1/2 bottom-6 z-[54] grid place-items-center size-20 rounded-full transition-[transform,background-color,color] duration-200"
          :class="overTrash ? 'bg-pink-deep text-white scale-110' : 'bg-pink-soft text-pink-deep'"
          aria-hidden="true"
        >
          <Trash2 :size="overTrash ? 30 : 26" :stroke-width="2" />
        </div>
      </Transition>
    </Teleport>

    <div
      ref="fabRef"
      role="button"
      tabindex="0"
      aria-label="Abrir chat con Hibi (arrastra para mover o descartar)"
      class="mascot-fab group/fab fixed z-[55]"
      :class="[pos ? '' : 'mascot-fab--default', dragging ? 'mascot-fab--dragging' : '']"
      :style="fabStyle"
      @pointerdown="onPointerDown"
      @keydown.enter.prevent="router.push('/chat')"
      @keydown.space.prevent="router.push('/chat')"
    >
      <span class="mascot-fab__float relative inline-block" :class="dragging ? '!animate-none' : ''">
        <HibiSparkle :size="16" twinkle :duration="2.4" class="absolute -top-1 -right-1 text-sky-deep opacity-90 pointer-events-none" />
        <HibiHeart :size="15" beat :duration="1.4" class="absolute -top-1 -left-1 text-pink-deep opacity-0 group-hover/fab:opacity-100 transition-opacity duration-200 pointer-events-none" />
        <MascotCloud :size="size" class="text-sky pointer-events-none select-none" />
      </span>
      <span
        class="mascot-fab__tip hidden md:block absolute top-1/2 -translate-y-1/2 whitespace-nowrap px-3 py-1.5 rounded-full bg-card text-fg text-[12.5px] font-bold opacity-0 group-hover/fab:opacity-100 transition-opacity duration-200 pointer-events-none"
        :class="tipLeft ? 'right-full mr-3' : 'left-full ml-3'"
      >
        Habla con Hibi
      </span>
    </div>
  </div>
</template>

<style scoped>
.mascot-fab {
  touch-action: none;
  cursor: grab;
}
.mascot-fab--dragging {
  cursor: grabbing;
  z-index: 56;
}
/* Posición de reposo por defecto: esquina inferior derecha */
.mascot-fab--default {
  right: 1rem;
  bottom: calc(78px + env(safe-area-inset-bottom, 0px));
}
@media (min-width: 768px) {
  .mascot-fab--default {
    right: 1.25rem;
    bottom: 22px;
  }
}
.mascot-fab__float {
  animation: mascotFabFloat 4s ease-in-out infinite;
  will-change: transform;
}
@keyframes mascotFabFloat {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-6px); }
}
@media (prefers-reduced-motion: reduce) {
  .mascot-fab__float { animation: none; }
}
.trash-fade-enter-active, .trash-fade-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.trash-fade-enter-from, .trash-fade-leave-to { opacity: 0; transform: translate(-50%, 8px); }
</style>
