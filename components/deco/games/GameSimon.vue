<script setup lang="ts">
// Secuencia (Simón). Hibi ilumina una secuencia de colores; la repites. Cada
// ronda suma un color más. Fallar termina el juego. Monedas por ronda
// alcanzada. Hibi es la protagonista (no hay iconos de nube repetidos dentro
// de los cuadros): cada color tiene su propio icono con personalidad, y el
// tablero ocupa la mayor parte posible de la pantalla.
import { X, Coins, Sparkles, Heart, Leaf, Star } from '@lucide/vue'

const { t } = useI18n()
const emit = defineEmits<{ end: [coins: number]; exit: [] }>()

const PADS = [
  { bg: 'bg-sky', on: '#6fb9e0', icon: Sparkles },
  { bg: 'bg-pink', on: '#f0a7bd', icon: Heart },
  { bg: 'bg-mint', on: '#9adcb8', icon: Leaf },
  { bg: 'bg-lavender', on: '#c3b2ec', icon: Star },
]
const seq = ref<number[]>([])
const active = ref(-1)
const showing = ref(true)
const round = ref(0)
const inputIdx = ref(0)
const coins = ref(0)
const over = ref(false)
const countdown = ref(3)
const wrongPad = ref(-1)
const react = ref<'idle' | 'happy'>('idle')
let timers: ReturnType<typeof setTimeout>[] = []

function clearTimers() { timers.forEach(clearTimeout); timers = [] }
function flash(i: number, ms = 360) { active.value = i; timers.push(setTimeout(() => { if (active.value === i) active.value = -1 }, ms)) }

function nextRound() {
  round.value++
  seq.value.push(Math.floor(Math.random() * 4))
  inputIdx.value = 0
  playback()
}
function playback() {
  showing.value = true
  const step = Math.max(360, 620 - round.value * 12)
  seq.value.forEach((p, k) => {
    timers.push(setTimeout(() => flash(p, step * 0.6), 500 + k * step))
  })
  timers.push(setTimeout(() => { showing.value = false }, 500 + seq.value.length * step))
}
function onPad(i: number) {
  if (showing.value || over.value) return
  flash(i, 220)
  if (i === seq.value[inputIdx.value]) {
    inputIdx.value++
    if (inputIdx.value === seq.value.length) {
      coins.value += 3
      react.value = 'happy'; timers.push(setTimeout(() => (react.value = 'idle'), 650))
      timers.push(setTimeout(nextRound, 620))
    }
  } else {
    over.value = true; clearTimers()
    wrongPad.value = i
    timers.push(setTimeout(() => emit('end', coins.value), 900))
  }
}
function begin() { timers.push(setTimeout(nextRound, 500)) }
function startCountdown() {
  countdown.value = 3
  const tick = () => { if (countdown.value <= 1) { countdown.value = 0; begin(); return } countdown.value--; timers.push(setTimeout(tick, 650)) }
  timers.push(setTimeout(tick, 650))
}

onMounted(startCountdown)
onBeforeUnmount(clearTimers)
</script>

<template>
  <div class="relative w-full h-full overflow-hidden select-none rounded-[20px] bg-lavender flex flex-col">
    <HibiCloud :size="120" float :duration="12" class="absolute -top-7 -left-6 text-white opacity-30 pointer-events-none" aria-hidden="true" />
    <HibiCloud :size="76" float :duration="15" :delay="1.2" class="absolute bottom-6 -right-5 text-white opacity-25 pointer-events-none" aria-hidden="true" />
    <HibiSparkle :size="18" twinkle class="absolute top-[14%] right-[12%] text-white opacity-55 pointer-events-none" />
    <HibiSparkle :size="13" twinkle :delay="0.9" class="absolute bottom-[16%] left-[9%] text-white opacity-45 pointer-events-none" />

    <!-- HUD -->
    <div class="shrink-0 flex items-center justify-between px-3 pt-3 z-20">
      <div class="inline-flex items-center gap-1.5 px-3 h-9 rounded-full bg-card text-fg font-extrabold text-[14px] tabular-nums">
        <Coins class="size-[15px] text-[#bf8f2e]" :stroke-width="2.2" /> {{ coins }}
      </div>
      <div class="inline-flex items-center px-3 h-9 rounded-full bg-card text-[#7a63c0] font-bold text-[13px] tabular-nums">
        {{ t('hibi.games.simon.round', { n: round }) }}
      </div>
      <button type="button" class="grid place-items-center size-9 rounded-full bg-card text-fg-muted cursor-pointer" :aria-label="t('hibi.game.exitAria')" @click="emit('exit')"><X class="size-[18px]" :stroke-width="2.2" /></button>
    </div>

    <!-- Hibi: protagonista del juego -->
    <div class="shrink-0 flex flex-col items-center pt-1 pb-2 z-10 gap-1.5">
      <div class="relative">
        <span class="hibi-glow absolute inset-0 rounded-full" aria-hidden="true" />
        <div :class="{ 'hibi-nod': showing, 'hibi-shake': over, 'hibi-jump': react === 'happy' }">
          <MascotCloud :size="82" class="text-white" />
        </div>
      </div>
      <p class="text-[13.5px] font-bold text-[#5a479b]">{{ over ? t('hibi.games.simon.over') : showing ? t('hibi.games.simon.watch') : t('hibi.games.simon.your') }}</p>
      <!-- progreso de la ronda actual -->
      <div v-if="seq.length && !over" class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card/50">
        <span v-for="(_, i) in seq" :key="i" class="rounded-full transition-all duration-200" :class="i < inputIdx || (showing && i <= 0) ? 'size-2 bg-[#7a63c0]' : 'size-2 bg-[#7a63c0]/25'" />
      </div>
    </div>

    <!-- Cuadros de color: ocupan la mayor parte posible de la pantalla -->
    <div class="flex-1 min-h-0 grid place-items-center p-3">
      <div class="grid grid-cols-2 grid-rows-2 gap-4 h-full max-h-full aspect-square max-w-full">
        <button v-for="(p, i) in PADS" :key="i" type="button"
          class="relative rounded-[26px] grid place-items-center transition-transform duration-100"
          :class="[p.bg, active === i ? 'pad-on' : 'active:scale-[0.97]', wrongPad === i ? 'pad-wrong' : '']"
          :style="active === i ? { background: p.on } : {}"
          :disabled="showing || over"
          @pointerdown="onPad(i)">
          <component :is="p.icon" class="size-[18%]" :class="active === i ? 'text-white' : 'text-white/60'" :stroke-width="1.8" />
        </button>
      </div>
    </div>

    <!-- cuenta atrás -->
    <Transition name="hibi-fade">
      <div v-if="countdown > 0" class="absolute inset-0 z-30 grid place-items-center bg-base/40">
        <span class="text-[72px] font-extrabold text-[#5a479b] tabular-nums hibi-count" :key="countdown">{{ countdown }}</span>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.pad-on { transform: scale(1.035); box-shadow: 0 0 0 5px rgba(255,255,255,0.55) inset; }
.pad-wrong { animation: shake 0.4s ease; background: var(--color-pink-deep) !important; }
@keyframes shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-6px); } 75% { transform: translateX(6px); } }
.hibi-nod { animation: nod 0.9s ease-in-out infinite; }
@keyframes nod { 0%,100% { transform: translateY(0) rotate(-2deg); } 50% { transform: translateY(-4px) rotate(2deg); } }
.hibi-shake { animation: shake 0.4s ease; }
.hibi-jump { animation: jump 0.6s var(--ease-bounce, cubic-bezier(0.34,1.4,0.64,1)); }
@keyframes jump { 0%,100% { transform: translateY(0); } 40% { transform: translateY(-12px); } }
.hibi-glow { background: radial-gradient(circle, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 70%); transform: scale(1.6); animation: glow 2.4s ease-in-out infinite; }
@keyframes glow { 0%, 100% { opacity: 0.55; } 50% { opacity: 0.9; } }
.hibi-count { animation: countPop 0.65s ease-out; }
@keyframes countPop { 0% { transform: scale(1.6); opacity: 0; } 30% { opacity: 1; } 100% { transform: scale(1); opacity: 0.2; } }
.hibi-fade-enter-active, .hibi-fade-leave-active { transition: opacity 0.25s ease; }
.hibi-fade-enter-from, .hibi-fade-leave-to { opacity: 0; }
</style>
