<script setup lang="ts">
// Pop de nubes (estilo topo). Aparecen nubes y estrellas por la pantalla; las
// tocas antes de que se vayan. Las bombas (con calavera) NO se tocan: cortan
// la racha y restan una moneda. 30 segundos. Combo con multiplicador y
// números flotantes al acertar.
import { X, Coins, Star, Skull } from '@lucide/vue'

const { t } = useI18n()
const emit = defineEmits<{ end: [coins: number]; exit: [] }>()

interface Pop { id: number; x: number; y: number; type: 'cloud' | 'star' | 'bomb'; born: number; life: number; hit: boolean }
const pops = ref<Pop[]>([])
const coins = ref(0)
const combo = ref(0)
const bestCombo = ref(0)
const timeLeft = ref(30)
const over = ref(false)
const started = ref(false)
const countdown = ref(3)
let pid = 0, raf = 0, last = 0, spawnAcc = 0, elapsed = 0

const TONES = ['text-sky', 'text-pink', 'text-mint', 'text-lavender', 'text-peach']
interface Floater { id: number; x: number; y: number; text: string; bad?: boolean }
const floaters = ref<Floater[]>([])
let fid = 0
function floatText(x: number, y: number, text: string, bad = false) {
  const id = fid++
  floaters.value.push({ id, x, y, text, bad })
  setTimeout(() => { floaters.value = floaters.value.filter(f => f.id !== id) }, 700)
}

function spawn() {
  const t = Math.random()
  const type: Pop['type'] = t < 0.18 ? 'bomb' : t < 0.5 ? 'star' : 'cloud'
  pops.value.push({ id: pid++, x: 8 + Math.random() * 80, y: 22 + Math.random() * 56, type, born: performance.now(), life: 850 + Math.random() * 500, hit: false })
}
function loop(now: number) {
  if (over.value) return
  const dt = Math.min(48, now - last); last = now; elapsed += dt
  timeLeft.value = Math.max(0, 30 - elapsed / 1000)
  const spawnEvery = Math.max(340, 720 - elapsed / 1000 * 13)
  spawnAcc += dt
  if (spawnAcc >= spawnEvery && pops.value.length < 7) { spawnAcc = 0; spawn() }
  for (let i = pops.value.length - 1; i >= 0; i--) {
    const p = pops.value[i]!
    if (p.hit) continue
    if (now - p.born > p.life) {
      if (p.type !== 'bomb') combo.value = 0 // dejar ir una buena corta la racha
      pops.value.splice(i, 1)
    }
  }
  if (timeLeft.value <= 0) return finish()
  raf = requestAnimationFrame(loop)
}
function tap(p: Pop) {
  if (over.value || p.hit) return
  p.hit = true
  if (p.type === 'bomb') {
    combo.value = 0; coins.value = Math.max(0, coins.value - 1)
    floatText(p.x, p.y, '-1', true)
  } else {
    combo.value++; if (combo.value > bestCombo.value) bestCombo.value = combo.value
    const gain = 1 + Math.floor(combo.value / 5)
    coins.value += gain
    floatText(p.x, p.y, '+' + gain)
  }
  setTimeout(() => { const idx = pops.value.findIndex(q => q.id === p.id); if (idx >= 0) pops.value.splice(idx, 1) }, 220)
}
function finish() { if (over.value) return; over.value = true; cancelAnimationFrame(raf); setTimeout(() => emit('end', coins.value), 650) }
function begin() { started.value = true; last = performance.now(); raf = requestAnimationFrame(loop) }
function startCountdown() {
  countdown.value = 3
  const tick = () => { if (countdown.value <= 1) { countdown.value = 0; begin(); return } countdown.value--; setTimeout(tick, 650) }
  setTimeout(tick, 650)
}

onMounted(startCountdown)
onBeforeUnmount(() => { over.value = true; cancelAnimationFrame(raf) })
</script>

<template>
  <div class="relative w-full h-full overflow-hidden select-none touch-none rounded-[20px] bg-sky-soft">
    <!-- Escenario de cielo con profundidad: nubes en varias capas + brillos -->
    <HibiCloud :size="120" float :duration="10" class="absolute -top-6 -right-6 text-white opacity-30 pointer-events-none" aria-hidden="true" />
    <HibiCloud :size="70" float :duration="13" :delay="1" class="absolute bottom-4 -left-4 text-white opacity-25 pointer-events-none" aria-hidden="true" />
    <HibiCloud :size="48" float :duration="16" :delay="0.6" class="absolute top-[42%] left-2 text-white opacity-15 pointer-events-none" aria-hidden="true" />
    <HibiCloud :size="58" float :duration="14" :delay="2" class="absolute bottom-[30%] right-2 text-white opacity-15 pointer-events-none" aria-hidden="true" />
    <HibiSparkle :size="15" twinkle :duration="2.5" class="absolute top-[16%] left-[14%] text-white opacity-55 pointer-events-none" />
    <HibiSparkle :size="12" twinkle :duration="3.1" :delay="1.1" class="absolute bottom-[14%] right-[16%] text-white opacity-50 pointer-events-none" />
    <HibiHeart :size="14" beat :duration="2.8" class="absolute top-[64%] left-[8%] text-white opacity-45 pointer-events-none" />

    <!-- HUD -->
    <div class="absolute top-3 left-3 right-3 z-20 flex items-center justify-between">
      <div class="inline-flex items-center gap-1.5 px-3 h-9 rounded-full bg-card text-fg font-extrabold text-[14px] tabular-nums">
        <Coins class="size-[15px] text-[#bf8f2e]" :stroke-width="2.2" /> {{ coins }}
      </div>
      <div class="inline-flex items-center px-3 h-9 rounded-full bg-card font-extrabold text-[14px] tabular-nums transition-colors" :class="timeLeft <= 5 ? 'text-pink-deep timer-warn' : 'text-sky-deep'">{{ Math.ceil(timeLeft) }}s</div>
      <button type="button" class="grid place-items-center size-9 rounded-full bg-card text-fg-muted cursor-pointer" :aria-label="t('hibi.game.exitAria')" @click="emit('exit')"><X class="size-[18px]" :stroke-width="2.2" /></button>
    </div>
    <Transition name="hibi-fade">
      <p v-if="combo >= 3" :key="combo" class="absolute top-[52px] left-1/2 -translate-x-1/2 z-10 text-[13px] font-extrabold text-pink-deep pointer-events-none combo-pop">{{ t('hibi.games.pop.combo', { n: combo }) }}</p>
    </Transition>

    <template v-if="started && !over">
      <!-- objetivos -->
      <button v-for="p in pops" :key="p.id" type="button"
        class="absolute z-10 grid place-items-center transition-transform"
        :class="p.hit ? 'pop-hit' : 'pop-in'"
        :style="{ left: p.x + '%', top: p.y + '%', transform: 'translate(-50%,-50%)' }"
        @pointerdown="tap(p)">
        <span v-if="p.type === 'bomb'" class="grid place-items-center size-14 rounded-full bg-[#7d8494] text-white"><Skull class="size-7" :stroke-width="1.9" /></span>
        <span v-else-if="p.type === 'star'" class="text-[#e6b800]"><Star class="size-12 fill-current" :stroke-width="0" /></span>
        <HibiCloud v-else :size="56" face :class="TONES[p.id % TONES.length]" aria-hidden="true" />
      </button>

      <!-- números flotantes -->
      <span v-for="f in floaters" :key="f.id" class="absolute z-20 font-extrabold text-[15px] pointer-events-none floater" :class="f.bad ? 'text-pink-deep' : 'text-[#34936a]'" :style="{ left: f.x + '%', top: f.y + '%' }">{{ f.text }}</span>
    </template>

    <!-- fin -->
    <Transition name="hibi-fade">
      <div v-if="over" class="absolute inset-0 z-30 grid place-items-center bg-base/45 pointer-events-none">
        <div class="flex flex-col items-center gap-2">
          <MascotCloud :size="84" class="text-white hibi-anim-pop" />
          <p class="px-4 h-9 inline-flex items-center gap-1.5 rounded-full bg-card text-sky-deep font-extrabold text-[14px]"><Coins class="size-[14px] text-[#bf8f2e]" :stroke-width="2.3" /> {{ coins }}</p>
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
.pop-in { animation: popIn 0.22s var(--ease-bounce, cubic-bezier(0.34,1.4,0.64,1)); }
@keyframes popIn { 0% { transform: translate(-50%,-50%) scale(0.2); opacity: 0; } 100% { transform: translate(-50%,-50%) scale(1); opacity: 1; } }
.pop-hit { animation: popHit 0.22s ease-out forwards; }
@keyframes popHit { 0% { transform: translate(-50%,-50%) scale(1); } 100% { transform: translate(-50%,-50%) scale(1.5); opacity: 0; } }
.floater { animation: floatUp 0.7s ease-out forwards; }
@keyframes floatUp { 0% { opacity: 1; transform: translate(-50%,-50%) scale(0.9); } 100% { opacity: 0; transform: translate(-50%, -220%) scale(1.15); } }
.combo-pop { animation: comboPop 0.3s var(--ease-bounce, cubic-bezier(0.34,1.4,0.64,1)); }
@keyframes comboPop { 0% { transform: translateX(-50%) scale(1.3); } 100% { transform: translateX(-50%) scale(1); } }
.timer-warn { animation: timerPulse 0.6s ease-in-out infinite; }
@keyframes timerPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
.hibi-count { animation: countPop 0.65s ease-out; }
@keyframes countPop { 0% { transform: scale(1.6); opacity: 0; } 30% { opacity: 1; } 100% { transform: scale(1); opacity: 0.2; } }
.hibi-fade-enter-active, .hibi-fade-leave-active { transition: opacity 0.25s ease; }
.hibi-fade-enter-from, .hibi-fade-leave-to { opacity: 0; }
</style>
