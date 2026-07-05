<script setup lang="ts">
// Parejas (memoria). El tablero se calcula según el tamaño REAL de la pantalla
// (más celdas en una pantalla grande, menos en un celular) y ocupa todo el
// alto y ancho disponibles. El set de frutas y las posiciones SIEMPRE son
// aleatorios. Hibi mira arriba y reacciona (feliz al acertar, sorprendida al
// fallar); las cartas se voltean con rebote y las parejas brillan.
//
// OJO: el reverso de TODAS las cartas debe verse IDÉNTICO (mismo icono, mismo
// color) — si el reverso delata la fruta (p.ej. por color), el juego deja de
// ser un juego de memoria: se distinguen las parejas sin voltear nunca.
import {
  X, Coins, Apple, Banana, Cherry, Grape, Carrot, Citrus, Croissant, Coffee, Milk, Egg,
  Cookie, Popcorn, Candy, IceCreamCone,
} from '@lucide/vue'

const { t } = useI18n()
const emit = defineEmits<{ end: [coins: number]; exit: [] }>()

const FRUITS = [
  { icon: Apple, color: '#db8aa3' }, { icon: Banana, color: '#bf8f2e' }, { icon: Cherry, color: '#c0506b' },
  { icon: Grape, color: '#7a63c0' }, { icon: Carrot, color: '#c5733f' }, { icon: Citrus, color: '#3f9d8f' },
  { icon: Croissant, color: '#b9822f' }, { icon: Coffee, color: '#8a6b4f' }, { icon: Milk, color: '#5aa6d2' }, { icon: Egg, color: '#c99a3a' },
  { icon: Cookie, color: '#bf8f2e' }, { icon: Popcorn, color: '#c9a227' }, { icon: Candy, color: '#7a63c0' }, { icon: IceCreamCone, color: '#5aa6d2' },
]
const CELL = 100 // tamaño de referencia por carta (px) — la CANTIDAD de cartas surge de dividir el espacio real entre esto.
const GAP = 10

const shuffle = <T,>(a: T[]) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j]!, b[i]!] } return b }

interface Card { id: number; fruit: number; up: boolean; done: boolean; wrong: boolean; justDone: boolean }
const boardRef = ref<HTMLElement | null>(null)
const cols = ref(4)
const rows = ref(3)
const cards = ref<Card[]>([])
const pairs = ref(6)
const found = ref(0)
const moves = ref(0)
const first = ref<number | null>(null)
const busy = ref(false)
const peeking = ref(true)
const react = ref<'idle' | 'happy' | 'oops'>('idle')
const won = ref(false)

// Calcula cuántas filas/columnas caben REALMENTE en la pantalla del jugador,
// para que el tablero ocupe todo el alto y ancho — más grande en tablet o PC.
function computeLayout() {
  const r = boardRef.value?.getBoundingClientRect()
  const w = r?.width || 360, h = r?.height || 420
  let c = Math.max(2, Math.floor((w + GAP) / (CELL + GAP)))
  let ro = Math.max(2, Math.floor((h + GAP) / (CELL + GAP)))
  while (c * ro > FRUITS.length * 2) { if (ro >= c) ro--; else c-- }
  if ((c * ro) % 2 !== 0) { if (ro > c) ro--; else c-- }
  cols.value = Math.max(2, c); rows.value = Math.max(2, ro)
}

function setup() {
  computeLayout()
  const n = (cols.value * rows.value) / 2
  pairs.value = n
  const chosen = shuffle(FRUITS.map((_, i) => i)).slice(0, n)
  const deck = shuffle([...chosen, ...chosen]).map((fruit, id) => ({ id, fruit, up: true, done: false, wrong: false, justDone: false }))
  cards.value = deck
  found.value = 0; moves.value = 0; first.value = null; busy.value = false; react.value = 'idle'; won.value = false
  // Vistazo inicial: muestra todo un momento y luego tapa (personalidad + memoria).
  peeking.value = true
  setTimeout(() => { cards.value.forEach(c => (c.up = false)); peeking.value = false }, 1400)
}

function flip(i: number) {
  if (busy.value || peeking.value || won.value) return
  const c = cards.value[i]!
  if (c.up || c.done) return
  c.up = true
  if (first.value === null) { first.value = i; return }
  moves.value++
  const a = cards.value[first.value]!, b = c
  if (a.fruit === b.fruit) {
    a.done = b.done = true; a.justDone = b.justDone = true
    found.value++
    react.value = 'happy'; setTimeout(() => (react.value = 'idle'), 700)
    first.value = null
    if (found.value === pairs.value) win()
  } else {
    busy.value = true; a.wrong = b.wrong = true
    react.value = 'oops'
    setTimeout(() => { a.up = b.up = false; a.wrong = b.wrong = false; first.value = null; busy.value = false; react.value = 'idle' }, 760)
  }
}

const accuracy = computed(() => (moves.value ? Math.round((found.value / moves.value) * 100) : 100))
const coins = computed(() => pairs.value * 2 + Math.max(0, 14 - Math.max(0, moves.value - pairs.value) * 2))
function win() { won.value = true; setTimeout(() => emit('end', coins.value), 900) }

onMounted(() => nextTick(setup))
</script>

<template>
  <div class="relative w-full h-full overflow-hidden select-none rounded-[20px] bg-pink-soft flex flex-col">
    <HibiCloud :size="120" float :duration="11" class="absolute -top-7 -right-6 text-white opacity-40 pointer-events-none" aria-hidden="true" />
    <HibiCloud :size="70" float :duration="14" :delay="1.1" class="absolute bottom-4 -left-4 text-white opacity-30 pointer-events-none" aria-hidden="true" />
    <HibiSparkle :size="16" twinkle class="absolute top-[22%] left-[8%] text-white opacity-50 pointer-events-none" />
    <HibiSparkle :size="12" twinkle :delay="0.8" class="absolute bottom-[30%] right-[10%] text-white opacity-45 pointer-events-none" />
    <HibiHeart :size="14" beat :duration="2.6" class="absolute top-[40%] right-[6%] text-white opacity-40 pointer-events-none" />

    <!-- HUD -->
    <div class="shrink-0 flex items-center justify-between px-3 pt-3 z-20">
      <div class="inline-flex items-center gap-1.5 px-3 h-9 rounded-full bg-card text-fg font-extrabold text-[14px] tabular-nums">
        <Coins class="size-[15px] text-[#bf8f2e]" :stroke-width="2.2" /> {{ coins }}
      </div>
      <div class="inline-flex items-center gap-1.5 px-3 h-9 rounded-full bg-card text-pink-deep font-bold text-[13px] tabular-nums">
        {{ t('hibi.games.memory.pairs', { a: found, b: pairs }) }}
      </div>
      <button type="button" class="grid place-items-center size-9 rounded-full bg-card text-fg-muted cursor-pointer" :aria-label="t('hibi.game.exitAria')" @click="emit('exit')"><X class="size-[18px]" :stroke-width="2.2" /></button>
    </div>

    <!-- Hibi que reacciona -->
    <div class="shrink-0 flex flex-col items-center pt-1 pb-2 z-10 gap-1">
      <div :class="{ 'hibi-jump': react === 'happy', 'hibi-shake': react === 'oops' }">
        <MascotCloud :size="60" class="text-white" />
      </div>
      <Transition name="hibi-fade" mode="out-in">
        <p v-if="peeking" key="peek" class="text-[12.5px] font-extrabold text-pink-deep">{{ t('hibi.games.memory.peek') }}</p>
        <p v-else-if="won" key="won" class="text-[12.5px] font-extrabold text-pink-deep">{{ t('hibi.games.memory.won', { n: accuracy }) }}</p>
        <p v-else key="hint" class="text-[12px] font-bold text-pink-deep/70">{{ t('hibi.games.memory.movesLabel', { n: moves }) }}</p>
      </Transition>
    </div>

    <!-- Tablero: ocupa TODO el alto y ancho disponibles -->
    <div ref="boardRef" class="flex-1 min-h-0 px-3 pb-3 z-10">
      <div class="grid gap-2.5 w-full h-full" :style="{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }">
        <button v-for="(c, i) in cards" :key="c.id" type="button"
          class="relative rounded-[16px] transition-transform duration-150"
          :class="[c.wrong ? 'hibi-shake' : '', c.done ? 'opacity-0 pointer-events-none' : 'active:scale-95']"
          :style="c.done ? { transition: 'opacity 0.35s ease 0.25s' } : {}"
          @click="flip(i)">
          <div class="card" :class="{ 'is-up': c.up || c.done }">
            <!-- Reverso: SIEMPRE igual (mismo icono, mismo color) para todas las cartas -->
            <span class="face back grid place-items-center rounded-[16px] bg-card">
              <HibiCloud :size="30" face class="text-sky-deep opacity-70" aria-hidden="true" />
            </span>
            <span class="face front grid place-items-center rounded-[16px]" :style="{ background: 'var(--bg-card)', color: FRUITS[c.fruit]!.color }">
              <component :is="FRUITS[c.fruit]!.icon" class="size-8" :stroke-width="1.8" />
              <span v-if="c.justDone" class="spark absolute inset-0 rounded-[16px]" :style="{ boxShadow: `0 0 0 3px ${FRUITS[c.fruit]!.color}99 inset` }" />
            </span>
          </div>
        </button>
      </div>
    </div>

    <!-- Victoria -->
    <Transition name="hibi-fade">
      <div v-if="won" class="absolute inset-0 z-30 grid place-items-center bg-base/45 pointer-events-none">
        <div class="flex flex-col items-center gap-2">
          <MascotCloud :size="84" class="text-white hibi-anim-pop" />
          <p class="px-4 h-9 inline-flex items-center rounded-full bg-card text-pink-deep font-extrabold text-[14px]">{{ t('hibi.games.memory.complete') }}</p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.card { position: relative; width: 100%; height: 100%; transform-style: preserve-3d; transition: transform 0.36s cubic-bezier(0.34, 1.4, 0.64, 1); }
.card.is-up { transform: rotateY(180deg); }
.face { position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; }
.front { transform: rotateY(180deg); }
.spark { animation: sparkIn 0.5s ease-out; }
@keyframes sparkIn { 0% { opacity: 0; transform: scale(0.85); } 100% { opacity: 1; transform: scale(1); } }
.hibi-jump { animation: jump 0.6s var(--ease-bounce, cubic-bezier(0.34,1.4,0.64,1)); }
@keyframes jump { 0%,100% { transform: translateY(0); } 40% { transform: translateY(-12px); } }
.hibi-shake { animation: shake 0.4s ease; }
@keyframes shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
.hibi-fade-enter-active, .hibi-fade-leave-active { transition: opacity 0.25s ease; }
.hibi-fade-enter-from, .hibi-fade-leave-to { opacity: 0; }
</style>
