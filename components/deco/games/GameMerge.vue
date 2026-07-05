<script setup lang="ts">
// Fusiona (estilo 2048). Desliza (dedo) o usa las flechas (PC) para juntar
// nubes iguales y formar nubes más grandes en la cuadrícula 4x4. "Cobrar"
// canjea las monedas ganadas; si se llena sin movimientos, termina solo.
import { X, Coins, Check } from '@lucide/vue'

const { t } = useI18n()
const emit = defineEmits<{ end: [coins: number]; exit: [] }>()

const N = 4
const grid = ref<number[][]>([])
const score = ref(0)
const maxLvl = ref(1)
const over = ref(false)
const areaRef = ref<HTMLElement | null>(null)

// Rampa de color por nivel: cielo → rosa → menta → lavanda → durazno (se repite).
const TONES = ['#a6d6f0', '#f7c8d5', '#c6e9d6', '#dcd2f1', '#ffd8c4', '#ffe6a8', '#5aa6d2', '#db8aa3', '#34936a', '#7a63c0', '#c5733f']
const INK = ['#1f4661', '#8a3a52', '#215a41', '#463876', '#7a3f22', '#7a5c17', '#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff']
const coins = computed(() => Math.min(90, Math.floor(score.value / 18) + (maxLvl.value - 1) * 2))

const empty = () => Array.from({ length: N }, () => Array(N).fill(0))
function addTile() {
  const cells: [number, number][] = []
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (grid.value[r]![c] === 0) cells.push([r, c])
  if (!cells.length) return
  const [r, c] = cells[Math.floor(Math.random() * cells.length)]!
  grid.value[r]![c] = Math.random() < 0.9 ? 1 : 2
}
function reset() { grid.value = empty(); score.value = 0; maxLvl.value = 1; over.value = false; addTile(); addTile() }

function slideRow(row: number[]) {
  const a = row.filter(v => v > 0); const res: number[] = []
  for (let i = 0; i < a.length; i++) {
    if (i + 1 < a.length && a[i] === a[i + 1]) { const lvl = a[i]! + 1; res.push(lvl); score.value += Math.pow(2, lvl); if (lvl > maxLvl.value) maxLvl.value = lvl; i++ }
    else res.push(a[i]!)
  }
  while (res.length < N) res.push(0)
  return res
}
function move(dir: 'l' | 'r' | 'u' | 'd') {
  if (over.value) return
  const before = JSON.stringify(grid.value)
  const g = grid.value.map(r => [...r])
  const lines: number[][] = []
  for (let i = 0; i < N; i++) {
    let line = dir === 'l' || dir === 'r' ? [...g[i]!] : g.map(r => r[i]!)
    if (dir === 'r' || dir === 'd') line.reverse()
    line = slideRow(line)
    if (dir === 'r' || dir === 'd') line.reverse()
    lines.push(line)
  }
  for (let i = 0; i < N; i++) {
    if (dir === 'l' || dir === 'r') g[i] = lines[i]!
    else for (let r = 0; r < N; r++) g[r]![i] = lines[i]![r]!
  }
  grid.value = g
  if (JSON.stringify(grid.value) !== before) { addTile(); checkOver() }
}
function checkOver() {
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    if (grid.value[r]![c] === 0) return
    if (c + 1 < N && grid.value[r]![c] === grid.value[r]![c + 1]) return
    if (r + 1 < N && grid.value[r]![c] === grid.value[r + 1]![c]) return
  }
  over.value = true; setTimeout(() => emit('end', coins.value), 800)
}
function cashIn() { emit('end', coins.value) }

// gestos
let sx = 0, sy = 0
function down(e: PointerEvent) { sx = e.clientX; sy = e.clientY }
function up(e: PointerEvent) {
  const dx = e.clientX - sx, dy = e.clientY - sy
  if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return
  if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 'r' : 'l'); else move(dy > 0 ? 'd' : 'u')
}
function onKey(e: KeyboardEvent) {
  const k = e.key
  if (k === 'ArrowLeft') { e.preventDefault(); move('l') }
  else if (k === 'ArrowRight') { e.preventDefault(); move('r') }
  else if (k === 'ArrowUp') { e.preventDefault(); move('u') }
  else if (k === 'ArrowDown') { e.preventDefault(); move('d') }
}

onMounted(() => { reset(); window.addEventListener('keydown', onKey) })
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="relative w-full h-full overflow-hidden select-none rounded-[20px] bg-mint flex flex-col">
    <HibiCloud :size="130" float :duration="11" class="absolute -top-7 -right-6 text-white opacity-35 pointer-events-none" aria-hidden="true" />
    <HibiCloud :size="72" float :duration="14" :delay="1" class="absolute bottom-8 -left-5 text-white opacity-25 pointer-events-none" aria-hidden="true" />
    <HibiSparkle :size="16" twinkle class="absolute top-[16%] left-[10%] text-white opacity-50 pointer-events-none" />
    <HibiSparkle :size="12" twinkle :delay="1" class="absolute bottom-[22%] right-[8%] text-white opacity-45 pointer-events-none" />
    <MascotCloud :size="46" class="absolute top-3 right-16 text-white opacity-90 pointer-events-none z-10" />

    <!-- HUD -->
    <div class="shrink-0 flex items-center justify-between px-3 pt-3 z-20">
      <div class="inline-flex items-center gap-1.5 px-3 h-9 rounded-full bg-card text-fg font-extrabold text-[14px] tabular-nums">
        <Coins class="size-[15px] text-[#bf8f2e]" :stroke-width="2.2" /> {{ coins }}
      </div>
      <div class="inline-flex items-center px-3 h-9 rounded-full bg-card text-[#2b7a56] font-bold text-[13px] tabular-nums">{{ score }}</div>
      <button type="button" class="grid place-items-center size-9 rounded-full bg-card text-fg-muted cursor-pointer" :aria-label="t('hibi.game.exitAria')" @click="emit('exit')"><X class="size-[18px]" :stroke-width="2.2" /></button>
    </div>

    <p class="shrink-0 text-center text-[12px] font-bold text-[#2b7a56]/80 pt-1 pb-1 z-10">{{ t('hibi.games.merge.hint') }}</p>

    <!-- Cuadrícula: ocupa el mayor cuadrado posible dentro del espacio disponible -->
    <div class="flex-1 min-h-0 grid place-items-center p-3 z-10">
      <div ref="areaRef" class="grid grid-cols-4 gap-3 h-full max-h-full aspect-square max-w-full p-3 rounded-[24px] bg-white/40 touch-none"
        @pointerdown="down" @pointerup="up">
        <template v-for="(row, r) in grid" :key="r">
          <div v-for="(v, c) in row" :key="c" class="relative rounded-[16px] bg-white/45 overflow-hidden">
            <Transition name="tile">
              <div v-if="v > 0" :key="v" class="absolute inset-0 grid place-items-center rounded-[16px]" :style="{ background: TONES[Math.min(v - 1, TONES.length - 1)] }">
                <span class="font-extrabold tabular-nums" :style="{ fontSize: (v < 6 ? 'clamp(15px, 5vw, 26px)' : v < 9 ? 'clamp(13px, 4vw, 21px)' : 'clamp(11px, 3.4vw, 18px)'), color: INK[Math.min(v - 1, INK.length - 1)] }">{{ Math.pow(2, v) }}</span>
              </div>
            </Transition>
          </div>
        </template>
      </div>
    </div>

    <!-- Cobrar: acción principal, ancho completo -->
    <div class="shrink-0 px-3 pb-3">
      <button type="button" class="w-full h-12 flex items-center justify-center gap-2 rounded-[16px] bg-[#34936a] text-white font-extrabold text-[15px] cursor-pointer active:scale-[0.98] transition-transform" @click="cashIn">
        <Check class="size-[17px]" :stroke-width="2.4" /> {{ t('hibi.games.merge.cash', { n: coins }) }}
      </button>
    </div>

    <div v-if="over" class="absolute inset-0 z-30 grid place-items-center bg-base/45 pointer-events-none">
      <div class="flex flex-col items-center gap-2">
        <MascotCloud :size="84" class="text-white hibi-anim-pop" />
        <p class="px-4 h-9 inline-flex items-center gap-1.5 rounded-full bg-card text-[#2b7a56] font-extrabold text-[14px]"><Coins class="size-[14px] text-[#bf8f2e]" :stroke-width="2.3" /> {{ coins }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tile-enter-active { transition: transform 0.16s var(--ease-bounce, cubic-bezier(0.34,1.4,0.64,1)); }
.tile-enter-from { transform: scale(0.3); }
</style>
