<script setup lang="ts">
// Happy Flip — Flappy Bird de verdad. Hibi cae por gravedad; cada toque
// (dedo, mouse o barra espaciadora) da un aleteo hacia arriba. Avanza sola
// entre columnas de nube con un hueco; pasar una columna suma una moneda.
// Tocar una columna, el techo o el suelo termina la partida.
import { X, Coins, Flame } from '@lucide/vue'

const { t } = useI18n()
const emit = defineEmits<{ end: [coins: number]; exit: [] }>()

const areaRef = ref<HTMLElement | null>(null)
const W = ref(360), H = ref(560)
const R = 24 // radio de colisión de Hibi
const hx = computed(() => W.value * 0.28)

const hy = ref(0)
const vy = ref(0)
const rot = ref(0)
const GRAVITY = 0.00062     // px/ms²
const FLAP_VY = -0.32       // px/ms (impulso hacia arriba)
const MAX_FALL = 0.62

interface Pillar { id: number; x: number; gapY: number; gapH: number; passed: boolean }
const pillars = ref<Pillar[]>([])
const PILLAR_W = 52
let pid = 0

const score = ref(0)
const best = ref(0)
const started = ref(false)
const waiting = ref(false) // Hibi flota quieta hasta el primer toque (como el Flappy real)
const over = ref(false)
const countdown = ref(3)
// Espaciado horizontal ENTRE columnas (no confundir con el punto de spawn).
const PILLAR_GAP_MIN = 210
const PILLAR_GAP_JITTER = 70
let raf = 0, last = 0, elapsed = 0, waitT = 0

function measure() { const r = areaRef.value?.getBoundingClientRect(); if (r) { W.value = r.width; H.value = r.height } }
function speedAt(s: number) { return Math.min(0.20, 0.115 + s * 0.006) }
function gapHAt(s: number) { return Math.max(H.value * 0.26, H.value * 0.36 - s * 3) }

function spawnPillar() {
  const gapH = gapHAt(score.value)
  const margin = H.value * 0.12
  const gapY = margin + gapH / 2 + Math.random() * (H.value - margin * 2 - gapH)
  pillars.value.push({ id: pid++, x: W.value + PILLAR_W, gapY, gapH, passed: false })
}

function begin() {
  measure()
  hy.value = H.value * 0.42; vy.value = 0; rot.value = 0
  pillars.value = []; score.value = 0; over.value = false
  started.value = true; waiting.value = true; waitT = 0
  last = performance.now(); elapsed = 0
  raf = requestAnimationFrame(loop)
}
function startCountdown() {
  countdown.value = 3
  const tick = () => { if (countdown.value <= 1) { countdown.value = 0; begin(); return } countdown.value--; setTimeout(tick, 650) }
  setTimeout(tick, 650)
}

function flap() {
  if (!started.value || over.value) return
  if (waiting.value) waiting.value = false // el primer toque arranca el vuelo real
  vy.value = FLAP_VY
}

function endRun() {
  if (over.value) return
  over.value = true
  cancelAnimationFrame(raf)
  setTimeout(() => emit('end', score.value), 650)
}

function loop(now: number) {
  const dt = Math.min(40, now - last); last = now; elapsed += dt

  if (waiting.value) {
    // Hibi flota quieta con un vaivén suave: sin gravedad, sin columnas moviéndose.
    waitT += dt
    hy.value = H.value * 0.42 + Math.sin(waitT / 260) * 6
    rot.value = Math.sin(waitT / 260) * 4
    raf = requestAnimationFrame(loop)
    return
  }

  const speed = speedAt(score.value)

  // física de Hibi
  vy.value = Math.min(MAX_FALL, vy.value + GRAVITY * dt)
  hy.value += vy.value * dt
  rot.value = Math.max(-24, Math.min(85, vy.value * 110))

  // techo / suelo
  if (hy.value - R < 0) { hy.value = R; endRun(); return }
  if (hy.value + R > H.value) { hy.value = H.value - R; endRun(); return }

  // columnas: mover + generar + puntuar + colisionar
  for (let i = pillars.value.length - 1; i >= 0; i--) {
    const p = pillars.value[i]!
    p.x -= speed * dt
    if (!p.passed && p.x + PILLAR_W / 2 < hx.value) { p.passed = true; score.value++; if (score.value > best.value) best.value = score.value }
    const withinX = hx.value + R > p.x - PILLAR_W / 2 && hx.value - R < p.x + PILLAR_W / 2
    if (withinX) {
      const topEnd = p.gapY - p.gapH / 2, botStart = p.gapY + p.gapH / 2
      if (hy.value - R < topEnd || hy.value + R > botStart) { endRun(); return }
    }
    if (p.x < -PILLAR_W) pillars.value.splice(i, 1)
  }
  // Solo genera la siguiente columna cuando la ÚLTIMA ya avanzó lo suficiente
  // desde el punto de aparición (si no, compararía contra un umbral mal
  // calculado y saldrían decenas de columnas superpuestas en el mismo lugar).
  const spawnX = W.value + PILLAR_W
  const lastPillar = pillars.value[pillars.value.length - 1]
  if (!lastPillar || spawnX - lastPillar.x >= PILLAR_GAP_MIN + Math.random() * PILLAR_GAP_JITTER) spawnPillar()

  raf = requestAnimationFrame(loop)
}

function onKey(e: KeyboardEvent) { if (e.code === 'Space') { e.preventDefault(); flap() } }

onMounted(() => { nextTick(startCountdown); window.addEventListener('resize', measure); window.addEventListener('keydown', onKey) })
onBeforeUnmount(() => { cancelAnimationFrame(raf); window.removeEventListener('resize', measure); window.removeEventListener('keydown', onKey) })
</script>

<template>
  <div ref="areaRef" class="relative w-full h-full overflow-hidden select-none touch-none rounded-[20px] bg-sky-soft cursor-pointer"
    @pointerdown="flap">
    <!-- Escenario de cielo con profundidad: nubes en varias capas + brillos -->
    <HibiCloud :size="90" float :duration="12" class="absolute top-6 left-6 text-white opacity-30 pointer-events-none" aria-hidden="true" />
    <HibiCloud :size="60" float :duration="9" :delay="1" class="absolute bottom-24 right-10 text-white opacity-25 pointer-events-none" aria-hidden="true" />
    <HibiCloud :size="46" float :duration="15" :delay="0.5" class="absolute top-[38%] left-3 text-white opacity-15 pointer-events-none" aria-hidden="true" />
    <HibiCloud :size="70" float :duration="17" :delay="2" class="absolute top-16 right-4 text-white opacity-15 pointer-events-none" aria-hidden="true" />
    <HibiCloud :size="52" float :duration="13" :delay="1.4" class="absolute bottom-8 left-8 text-white opacity-20 pointer-events-none" aria-hidden="true" />
    <HibiSparkle :size="16" twinkle :duration="2.4" class="absolute top-[22%] right-[14%] text-white opacity-60 pointer-events-none" />
    <HibiSparkle :size="12" twinkle :duration="3" :delay="1" class="absolute top-[48%] left-[16%] text-white opacity-50 pointer-events-none" />
    <HibiSparkle :size="14" twinkle :duration="2.7" :delay="0.6" class="absolute bottom-[30%] right-[20%] text-white opacity-55 pointer-events-none" />

    <!-- flash al chocar -->
    <Transition name="hibi-fade">
      <div v-if="over" class="absolute inset-0 z-10 bg-pink-deep/15 pointer-events-none" aria-hidden="true" />
    </Transition>

    <!-- HUD -->
    <div class="absolute top-3 left-3 z-20 inline-flex items-center gap-1.5 px-3 h-9 rounded-full bg-card text-fg font-extrabold text-[14px] tabular-nums">
      <Coins class="size-[15px] text-[#bf8f2e]" :stroke-width="2.2" /> {{ score }}
    </div>
    <div v-if="best > 2" class="absolute top-3 left-1/2 -translate-x-1/2 z-20 inline-flex items-center gap-1 px-2.5 h-9 rounded-full bg-card/90 text-[#c5733f] font-bold text-[12.5px] tabular-nums">
      <Flame class="size-[13px]" :stroke-width="2.3" /> {{ best }}
    </div>
    <button type="button" class="absolute top-3 right-3 z-20 grid place-items-center size-9 rounded-full bg-card text-fg-muted cursor-pointer" :aria-label="t('hibi.game.exitAria')" @click.stop="emit('exit')"><X class="size-[18px]" :stroke-width="2.2" /></button>
    <Transition name="hibi-fade">
      <p v-if="waiting" key="wait" class="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-[64px] z-10 text-[13px] font-extrabold text-sky-deep pointer-events-none hibi-pulse">{{ t('hibi.games.flip.tapToStart') }}</p>
      <p v-else-if="started && score === 0 && !over" key="hint" class="absolute top-[54px] left-1/2 -translate-x-1/2 z-10 text-[12px] font-bold text-sky-deep pointer-events-none">{{ t('hibi.games.flip.hud') }}</p>
    </Transition>

    <template v-if="started">
      <!-- columnas de nube -->
      <template v-for="p in pillars" :key="p.id">
        <div class="absolute rounded-b-[16px]"
          :style="{ left: (p.x - PILLAR_W / 2) + 'px', top: 0, width: PILLAR_W + 'px', height: (p.gapY - p.gapH / 2) + 'px', background: over ? '#8a93a3' : '#34936a' }" />
        <div class="absolute rounded-t-[16px]"
          :style="{ left: (p.x - PILLAR_W / 2) + 'px', top: (p.gapY + p.gapH / 2) + 'px', width: PILLAR_W + 'px', bottom: 0, background: over ? '#8a93a3' : '#34936a' }" />
      </template>

      <!-- Hibi -->
      <div class="absolute z-10 pointer-events-none" :style="{ left: hx + 'px', top: hy + 'px', transform: `translate(-50%,-50%) rotate(${rot}deg)` }">
        <MascotCloud :size="52" class="text-white drop-shadow-sm" />
      </div>
    </template>

    <!-- fin: recap breve antes de volver al menú -->
    <Transition name="hibi-fade">
      <div v-if="over" class="absolute inset-0 z-30 grid place-items-center bg-base/45 pointer-events-none">
        <div class="flex flex-col items-center gap-2">
          <MascotCloud :size="84" class="text-white hibi-anim-pop" />
          <p class="px-4 h-9 inline-flex items-center gap-1.5 rounded-full bg-card text-sky-deep font-extrabold text-[14px]"><Coins class="size-[14px] text-[#bf8f2e]" :stroke-width="2.3" /> {{ score }}</p>
        </div>
      </div>
    </Transition>

    <!-- cuenta atrás -->
    <Transition name="hibi-fade">
      <div v-if="countdown > 0" class="absolute inset-0 z-30 grid place-items-center bg-base/40">
        <span class="text-[72px] font-extrabold text-sky-deep tabular-nums hibi-count" :key="countdown">{{ countdown }}</span>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.hibi-pulse { animation: pulse 1.1s ease-in-out infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
.hibi-count { animation: countPop 0.65s ease-out; }
@keyframes countPop { 0% { transform: scale(1.6); opacity: 0; } 30% { opacity: 1; } 100% { transform: scale(1); opacity: 0.2; } }
.hibi-fade-enter-active, .hibi-fade-leave-active { transition: opacity 0.25s ease; }
.hibi-fade-enter-from, .hibi-fade-leave-to { opacity: 0; }
</style>
