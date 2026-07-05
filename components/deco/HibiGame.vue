<script setup lang="ts">
// Mini-juego estilo Pou: mueves a Hibi (dedo / mouse) en 2D — también puede
// SUBIR un poco, no solo horizontal — para esquivar cosas variadas que caen.
// Con el tiempo caen más rápido y más seguido. Algunas apuntan cerca de ti
// (no se puede cheesear pegado al borde). Si la golpean, la nube EXPLOTA.
import { X, Coins } from '@lucide/vue'

const { t } = useI18n()

const emit = defineEmits<{ end: [coins: number]; exit: [] }>()

const areaRef = ref<HTMLElement | null>(null)
const W = ref(360)
const H = ref(500)
const R = 30
const mxp = ref(180)
const myp = ref(440)
// Sólo se mueve en la franja INFERIOR: como mucho sube un 20% desde abajo.
const maxY = computed(() => H.value - R - 8)
const minY = computed(() => H.value * 0.80)

interface Drop { id: number; x: number; y: number; v: number; r: number; type: number; tone: string; rot: number; vr: number }
const drops = ref<Drop[]>([])
let did = 0
const score = ref(0)
const running = ref(false)
const exploded = ref(false)
const countdown = ref(0)

let raf = 0, last = 0, spawnAcc = 0, elapsed = 0
const TONES = ['#5aa6d2', '#db8aa3', '#34936a', '#c5733f', '#7a63c0', '#bf8f2e']
const FRAG = Array.from({ length: 9 }, (_, i) => ({ a: (i / 9) * Math.PI * 2 }))
const MAX_DROPS = 18

function measure() { const r = areaRef.value?.getBoundingClientRect(); if (r) { W.value = r.width; H.value = r.height } }
function begin() {
  measure()
  drops.value = []; score.value = 0; exploded.value = false; spawnAcc = 0; elapsed = 0
  mxp.value = W.value / 2; myp.value = H.value - R - 20
  running.value = true; last = performance.now(); raf = requestAnimationFrame(loop)
}
function startCountdown() {
  countdown.value = 3
  const tick = () => { if (countdown.value <= 1) { countdown.value = 0; begin(); return } countdown.value--; setTimeout(tick, 700) }
  setTimeout(tick, 700)
}
function loop(now: number) {
  if (!running.value) return
  const dt = Math.min(48, now - last); last = now; elapsed += dt
  const sec = elapsed / 1000
  const speed = 0.12 + Math.min(0.42, sec * 0.006)      // acelera con el tiempo
  const spawnEvery = Math.max(250, 720 - sec * 9)        // más seguido con el tiempo
  spawnAcc += dt
  if (spawnAcc >= spawnEvery && drops.value.length < MAX_DROPS) { spawnAcc = 0; spawn(speed) }
  for (let i = drops.value.length - 1; i >= 0; i--) {
    const d = drops.value[i]!
    d.y += d.v * dt; d.rot += d.vr * dt
    if (Math.hypot(d.x - mxp.value, d.y - myp.value) < R + d.r - 6) { boom(); return }
    if (d.y > H.value + 40) { drops.value.splice(i, 1); score.value += 1 }
  }
  raf = requestAnimationFrame(loop)
}
function spawn(v: number) {
  const r = 11 + Math.random() * 9
  const targeted = Math.random() < 0.3 // a veces cae cerca de ti
  const x = targeted
    ? Math.max(r, Math.min(W.value - r, mxp.value + (Math.random() * 120 - 60)))
    : (r + Math.random() * Math.max(1, W.value - r * 2))
  drops.value.push({ id: did++, x, y: -24, v: v + Math.random() * 0.05, r, type: Math.floor(Math.random() * 5), tone: TONES[Math.floor(Math.random() * TONES.length)]!, rot: Math.random() * 360, vr: Math.random() * 0.4 - 0.2 })
}
function boom() { running.value = false; cancelAnimationFrame(raf); exploded.value = true; setTimeout(() => emit('end', score.value), 900) }
function onMove(e: PointerEvent) {
  if (!running.value) return
  const r = areaRef.value!.getBoundingClientRect()
  // La nube queda SIEMPRE dentro del área (no se sale por los bordes).
  const pad = R + 6
  mxp.value = Math.max(pad, Math.min(r.width - pad, e.clientX - r.left))
  myp.value = Math.max(minY.value, Math.min(maxY.value, e.clientY - r.top))
}

onMounted(() => { nextTick(startCountdown); window.addEventListener('resize', measure) })
onBeforeUnmount(() => { running.value = false; cancelAnimationFrame(raf); window.removeEventListener('resize', measure) })
</script>

<template>
  <div ref="areaRef" class="relative w-full h-full overflow-hidden touch-none select-none cursor-none rounded-[20px] bg-sky-soft" @pointerdown="onMove" @pointermove="onMove">
    <!-- Escenario de cielo con profundidad: nubes en varias capas + brillos -->
    <HibiCloud :size="120" float :duration="10" class="absolute -top-6 -left-6 text-white opacity-40 pointer-events-none" aria-hidden="true" />
    <HibiCloud :size="80" float :duration="13" :delay="1" class="absolute top-8 right-4 text-white opacity-30 pointer-events-none" aria-hidden="true" />
    <HibiCloud :size="50" float :duration="16" :delay="0.6" class="absolute top-[36%] left-4 text-white opacity-15 pointer-events-none" aria-hidden="true" />
    <HibiCloud :size="62" float :duration="14" :delay="2.1" class="absolute top-[20%] right-10 text-white opacity-15 pointer-events-none" aria-hidden="true" />
    <HibiSparkle :size="16" twinkle :duration="2.6" class="absolute top-[12%] left-[30%] text-white opacity-55 pointer-events-none" />
    <HibiSparkle :size="12" twinkle :duration="3" :delay="1" class="absolute top-[46%] right-[12%] text-white opacity-45 pointer-events-none" />
    <HibiHeart :size="14" beat :duration="2.6" class="absolute top-[28%] left-[10%] text-white opacity-40 pointer-events-none" />

    <!-- HUD -->
    <div class="absolute top-3 left-3 z-20 inline-flex items-center gap-1.5 px-3 h-9 rounded-full bg-card text-fg font-extrabold text-[14px] tabular-nums">
      <Coins class="size-[15px] text-[#bf8f2e]" :stroke-width="2.2" /> {{ score }}
    </div>
    <button type="button" class="absolute top-3 right-3 z-20 grid place-items-center size-9 rounded-full bg-card text-fg-muted cursor-pointer" :aria-label="t('hibi.game.exitAria')" @click="emit('exit')">
      <X class="size-[18px]" :stroke-width="2.2" />
    </button>
    <p class="absolute top-[14px] left-1/2 -translate-x-1/2 z-10 text-[12px] font-bold text-sky-deep pointer-events-none">{{ t('hibi.game.hud') }}</p>

    <Transition name="hibi-fade">
      <div v-if="countdown > 0" class="absolute inset-0 z-30 grid place-items-center bg-base/40">
        <span class="text-[72px] font-extrabold text-sky-deep tabular-nums hibi-count" :key="countdown">{{ countdown }}</span>
      </div>
    </Transition>

    <!-- cosas variadas que caen -->
    <div v-for="d in drops" :key="d.id" class="absolute" :style="{ left: d.x + 'px', top: d.y + 'px', width: d.r * 2 + 'px', height: d.r * 2 + 'px', color: d.tone, transform: `translate(-50%,-50%) rotate(${d.rot}deg)`, opacity: 0.92 }">
      <div v-if="d.type === 0" class="w-full h-full rounded-full" style="background: currentColor" />
      <div v-else-if="d.type === 1" class="w-full h-full rounded-[4px]" style="background: currentColor; transform: rotate(45deg)" />
      <div v-else-if="d.type === 2" class="w-full h-full" style="background: currentColor; clip-path: polygon(50% 0, 100% 100%, 0 100%)" />
      <div v-else-if="d.type === 3" class="w-full rounded-full" style="background: currentColor; height: 58%; margin-top: 21%" />
      <svg v-else viewBox="0 0 24 24" class="w-full h-full" fill="currentColor" aria-hidden="true"><path d="M12 2l2.9 6.3 6.9.6-5.2 4.6 1.6 6.8L12 17.3 5.8 20.9l1.6-6.8L2.2 8.9l6.9-.6z" /></svg>
    </div>

    <!-- jugador -->
    <div class="absolute z-10" :style="{ left: mxp + 'px', top: myp + 'px', transform: 'translate(-50%,-50%)' }">
      <HibiCloud v-if="!exploded" :size="66" face class="text-white drop-shadow-sm" />
      <div v-else class="relative" style="width: 66px; height: 52px">
        <span v-for="(f, i) in FRAG" :key="i" class="hibi-frag absolute left-1/2 top-1/2 size-3 rounded-full bg-white" :style="{ '--fx': Math.cos(f.a) * 60 + 'px', '--fy': Math.sin(f.a) * 60 + 'px' }" />
        <span class="hibi-flash absolute left-1/2 top-1/2 size-10 rounded-full bg-white -translate-x-1/2 -translate-y-1/2" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.hibi-count { animation: countPop 0.7s ease-out; }
@keyframes countPop { 0% { transform: scale(1.6); opacity: 0; } 30% { opacity: 1; } 100% { transform: scale(1); opacity: 0.2; } }
.hibi-frag { animation: frag 0.9s ease-out forwards; }
@keyframes frag { 0% { transform: translate(-50%, -50%) scale(1); opacity: 1; } 100% { transform: translate(calc(-50% + var(--fx)), calc(-50% + var(--fy))) scale(0.3); opacity: 0; } }
.hibi-flash { animation: flash 0.5s ease-out forwards; }
@keyframes flash { 0% { transform: translate(-50%,-50%) scale(0.4); opacity: 0.9; } 100% { transform: translate(-50%,-50%) scale(2.4); opacity: 0; } }
</style>
