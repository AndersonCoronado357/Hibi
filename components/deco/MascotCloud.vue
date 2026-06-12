<script setup lang="ts">
import { nextTick } from 'vue'

// Mascota = nube de la referencia. Sigue el cursor (bloque completo,
// suavizado). Idle: flota suave y parpadea.
// Click: se ríe. Si haces muchos clicks seguidos (>8) además suelta unas
// pocas gotitas sutiles que caen debajo, como lluvia. Si paras, se
// reinicia el conteo. Todo discreto.
const props = withDefaults(defineProps<{ size?: number }>(), { size: 172 })

const el = ref<HTMLElement | null>(null)
const { x: mx, y: my } = useMouse({ type: 'client' })
const { left, top, width, height } = useElementBounding(el)
const cxy = computed(() => ({ x: left.value + width.value / 2, y: top.value + height.value / 2 }))

const lean = computed(() => {
  const dx = mx.value - cxy.value.x
  const dy = my.value - cxy.value.y
  const c = (v: number, m: number) => Math.max(-m, Math.min(m, v))
  return { x: c(dx / 11, 20), y: c(dy / 11, 12), rot: c(dx / 38, 6) }
})
const pupil = computed(() => {
  const dx = mx.value - cxy.value.x
  const dy = my.value - cxy.value.y
  const dist = Math.hypot(dx, dy) || 1
  const reach = Math.min(1, dist / 300)
  return { x: (dx / dist) * reach * 2.6, y: (dy / dist) * reach * 2.6 }
})
const svgH = computed(() => Math.round((props.size * 95) / 140))

// Parpadeo (solo en reposo)
const blink = ref(false)
let blinkT: ReturnType<typeof setTimeout> | undefined
function scheduleBlink() {
  blinkT = setTimeout(
    () => {
      blink.value = true
      setTimeout(() => {
        blink.value = false
        scheduleBlink()
      }, 150)
    },
    3000 + Math.random() * 3500,
  )
}

// Reír + gotitas
const laughing = ref(false)
const popping = ref(false)
const clickCount = ref(0)
const RAIN_AFTER = 8

interface Drop {
  id: number
  x: number
  top: number
  dur: number
}
const drops = ref<Drop[]>([])
let dropId = 0
let laughT: ReturnType<typeof setTimeout> | undefined
let resetT: ReturnType<typeof setTimeout> | undefined

function onClick() {
  // contar clicks seguidos (se reinicia si dejas de clickear)
  if (resetT) clearTimeout(resetT)
  resetT = setTimeout(() => (clickCount.value = 0), 1600)
  clickCount.value++

  // siempre: reír + rebote leve
  laughing.value = true
  if (laughT) clearTimeout(laughT)
  laughT = setTimeout(() => (laughing.value = false), 900)
  popping.value = false
  nextTick(() => {
    popping.value = true
    setTimeout(() => (popping.value = false), 380)
  })

  // tras muchos clicks: pocas gotitas sutiles
  if (clickCount.value > RAIN_AFTER) {
    const n = 1 + Math.floor(Math.random() * 2) // 1-2
    for (let i = 0; i < n; i++) {
      const id = dropId++
      const x = 24 + Math.random() * (props.size - 48)
      // desde el BORDE INFERIOR de la nube (no de en medio)
      const dropTop = svgH.value * 0.95 + Math.random() * 4
      const dur = 900 + Math.random() * 600
      drops.value.push({ id, x, top: dropTop, dur })
      setTimeout(() => {
        const idx = drops.value.findIndex((d) => d.id === id)
        if (idx >= 0) drops.value.splice(idx, 1)
      }, dur + 60)
    }
  }
}

onMounted(scheduleBlink)
onBeforeUnmount(() => {
  if (blinkT) clearTimeout(blinkT)
  if (laughT) clearTimeout(laughT)
  if (resetT) clearTimeout(resetT)
})
</script>

<template>
  <div
    ref="el"
    class="relative inline-block select-none cursor-pointer will-change-transform"
    role="button"
    aria-label="Nube de Hibi"
    :style="{
      transform: `translate(${lean.x}px, ${lean.y}px) rotate(${lean.rot}deg)`,
      transformOrigin: 'center bottom',
      transition: 'transform 0.2s ease-out',
    }"
    @click="onClick"
  >
    <div class="hibi-bob">
      <div :class="{ 'hibi-pop': popping }">
        <svg :width="size" :height="svgH" viewBox="0 0 140 95" fill="none" aria-hidden="true">
          <g fill="currentColor">
            <circle cx="30" cy="55" r="30" />
            <circle cx="55" cy="30" r="30" />
            <circle cx="60" cy="65" r="30" />
            <circle cx="95" cy="40" r="25" />
            <circle cx="115" cy="60" r="25" />
            <circle cx="90" cy="70" r="20" />
          </g>

          <ellipse cx="51" cy="59" rx="4.3" ry="2.9" fill="var(--color-pink)" opacity="0.85" />
          <ellipse cx="89" cy="59" rx="4.3" ry="2.9" fill="var(--color-pink)" opacity="0.85" />

          <!-- Ojos: felices al reír · cerrados al parpadear · siguiendo el cursor -->
          <g v-if="laughing">
            <path d="M56 54 Q60 49 64 54" stroke="var(--color-sky-deep)" stroke-width="2.2" stroke-linecap="round" fill="none" />
            <path d="M76 54 Q80 49 84 54" stroke="var(--color-sky-deep)" stroke-width="2.2" stroke-linecap="round" fill="none" />
          </g>
          <g v-else-if="blink">
            <path d="M56 53 Q60 56 64 53" stroke="var(--color-sky-deep)" stroke-width="2" stroke-linecap="round" fill="none" />
            <path d="M76 53 Q80 56 84 53" stroke="var(--color-sky-deep)" stroke-width="2" stroke-linecap="round" fill="none" />
          </g>
          <g v-else :style="{ transform: `translate(${pupil.x}px, ${pupil.y}px)`, transition: 'transform 0.18s ease-out' }">
            <ellipse cx="60" cy="52" rx="3.1" ry="3.9" fill="var(--color-sky-deep)" />
            <ellipse cx="80" cy="52" rx="3.1" ry="3.9" fill="var(--color-sky-deep)" />
          </g>

          <!-- Boca: abierta al reír · sonrisa en reposo -->
          <ellipse v-if="laughing" cx="70" cy="59" rx="4.2" ry="3.3" fill="var(--color-sky-deep)" />
          <path v-else d="M64 57 Q70 62 76 57" stroke="var(--color-sky-deep)" stroke-width="1.9" stroke-linecap="round" fill="none" />
        </svg>
      </div>
    </div>

    <!-- Gotitas sutiles -->
    <span
      v-for="d in drops"
      :key="d.id"
      class="hibi-drop"
      :style="{ left: `${d.x}px`, top: `${d.top}px`, animationDuration: `${d.dur}ms` }"
    />
  </div>
</template>

<style scoped>
.hibi-bob {
  animation: hibi-bob 4.6s ease-in-out infinite;
}
@keyframes hibi-bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

.hibi-pop {
  animation: hibi-pop 0.42s var(--ease-bounce);
}
@keyframes hibi-pop {
  0% { transform: scale(1); }
  40% { transform: scale(1.06); }
  100% { transform: scale(1); }
}

/* Gotitas de agua: visibles pero pocas, caen desde abajo */
.hibi-drop {
  position: absolute;
  width: 6px;
  height: 8px;
  border-radius: 50% 50% 50% 50% / 60% 60% 42% 42%;
  background: var(--color-sky-deep);
  opacity: 0.9;
  pointer-events: none;
  animation-name: hibi-rain;
  animation-timing-function: ease-in;
  animation-fill-mode: forwards;
}
@keyframes hibi-rain {
  0% { transform: translateY(0) scale(0.9); opacity: 0; }
  15% { opacity: 0.9; }
  100% { transform: translateY(80px) scale(1); opacity: 0; }
}
</style>
