<script setup lang="ts">
// HibiWorld — la casa de Hibi por SECCIONES (flechas a los lados, con animación).
//  · Bolitas de estado que se vacían por % y te llevan a su sección.
//  · Casa: tócala → rebota, se ríe y suelta corazones esparcidos.
//  · Cocina: NEVERA (izq) con lo que tienes + TIENDA (der, en filas) para comprar.
//    El seleccionado sale abajo con flechitas; lo arrastras a Hibi → la sigue con
//    los ojos y abre la boca al comer (se cierra al soltar).
//  · Juegos: mini-juego. · Dormitorio: apaga la luz.
import {
  Coins, Flame, Cookie, Heart, Sparkles as SparkIcon, Gamepad2, Moon,
  ChevronLeft, ChevronRight, Power, X, ShoppingBag, Refrigerator, Check,
  Apple, Banana, Cherry, Grape, Carrot, Citrus, Croissant, Coffee, Milk, Egg,
  Salad, Soup, Sandwich, Fish, Drumstick, Beef, Ham, Pizza, Popcorn, Donut,
  Candy, Lollipop, IceCreamCone, Cake, Wheat, Bean, CupSoda, Beer, Wine,
} from '@lucide/vue'
import type { Component } from 'vue'

const { t } = useI18n()

const props = defineProps<{
  energia: number; pancita: number; carino: number; diversion: number
  coins: number; streak: number; state: string; room: string
  inventory: Record<string, number>; lastGameCoins?: number
  sleeping?: boolean
}>()
const emit = defineEmits<{
  feed: [id: string, gain: number]
  buy: [id: string, price: number]
  affection: []
  sleep: [active: boolean]
  gameReward: [coins: number]
  'update:room': [key: string]
}>()

type SectionKey = 'casa' | 'cocina' | 'juegos' | 'dormir'
// Claves de sección (persistidas / usadas en lógica). El NOMBRE visible sale del mapa i18n.
const SECTIONS: { key: SectionKey }[] = [
  { key: 'casa' },
  { key: 'cocina' },
  { key: 'juegos' },
  { key: 'dormir' },
]
const sectionLabel = computed<Record<SectionKey, string>>(() => ({
  casa: t('hibi.sections.casa'),
  cocina: t('hibi.sections.cocina'),
  juegos: t('hibi.sections.juegos'),
  dormir: t('hibi.sections.dormir'),
}))
// Cada cuarto tiene su propio color de pared (se diferencian de un vistazo)
const ROOM_WALL: Record<SectionKey, string> = {
  casa: 'bg-sky-soft', cocina: 'bg-peach', juegos: 'bg-pink-soft', dormir: 'bg-lavender',
}
const idx = computed(() => { const i = SECTIONS.findIndex(s => s.key === props.room); return i < 0 ? 0 : i })
const room = computed<SectionKey>(() => SECTIONS[idx.value]!.key)
const sectionName = computed(() => sectionLabel.value[room.value])
const slideDir = ref<1 | -1>(1)
function goTo(i: number) {
  const n = (i + SECTIONS.length) % SECTIONS.length
  if (n === idx.value) return
  slideDir.value = (n === (idx.value + 1) % SECTIONS.length) ? 1 : (n === (idx.value - 1 + SECTIONS.length) % SECTIONS.length ? -1 : (n > idx.value ? 1 : -1))
  if (room.value === 'dormir' && sleeping.value) { sleeping.value = false; emit('sleep', false) }
  cocinaPanel.value = 'none'
  gamesPanel.value = 'none'
  emit('update:room', SECTIONS[n]!.key)
}
function prev() { goTo(idx.value - 1) }
function next() { goTo(idx.value + 1) }

const STATS = computed(() => [
  { key: 'e', icon: SparkIcon, ink: 'text-sky-deep', fill: '#5aa6d2', label: t('hibi.stats.energia'), v: Math.round(props.energia), go: 'dormir' },
  { key: 'p', icon: Cookie, ink: 'text-[#bf8f2e]', fill: '#d8a43a', label: t('hibi.stats.pancita'), v: Math.round(props.pancita), go: 'cocina' },
  { key: 'c', icon: Heart, ink: 'text-pink-deep', fill: '#db8aa3', label: t('hibi.stats.carino'), v: Math.round(props.carino), go: 'casa' },
  { key: 'd', icon: Gamepad2, ink: 'text-[#7a63c0]', fill: '#9a7fd1', label: t('hibi.stats.diversion'), v: Math.round(props.diversion), go: 'juegos' },
])
function tapStat(go: string) { const i = SECTIONS.findIndex(s => s.key === go); if (i >= 0) goTo(i) }

const sceneRef = ref<HTMLElement | null>(null)
const actorRef = ref<HTMLElement | null>(null)
const mascotRef = ref<{ poke: () => void } | null>(null)
const sceneW = ref(900)
const sceneH = ref(560)
function measure() { const r = sceneRef.value?.getBoundingClientRect(); if (r) { sceneW.value = r.width; sceneH.value = r.height } }
const hibiSize = computed(() => Math.round(Math.max(160, Math.min(290, Math.min(sceneW.value * 0.32, sceneH.value * 0.46)))))

const sleeping = ref(props.sleeping ?? false) // inicia según el estado persistido
const reacting = ref(false)
const eating = ref(false)
const giggle = ref(false)
const effState = computed(() => (sleeping.value ? 'sleepy' : props.state))
const STATE_LABEL = computed<Record<string, string>>(() => ({
  happy: t('hibi.moods.happy'), content: t('hibi.moods.content'), meh: t('hibi.moods.meh'), hungry: t('hibi.moods.hungry'), sleepy: t('hibi.moods.sleepy'), sad: t('hibi.moods.sad'),
}))
const moodLabel = computed(() => (sleeping.value ? t('hibi.moods.sleeping') : (STATE_LABEL.value[props.state] || t('hibi.moods.content'))))

// ── Mirada: sigue el cursor; al arrastrar comida, sigue la comida ────
const { x: mx, y: my } = useMouse({ type: 'client' })
const { left: aLeft, top: aTop, width: aW, height: aH } = useElementBounding(actorRef)
function lookToward(px: number, py: number) {
  const cx = aLeft.value + aW.value / 2
  const cy = aTop.value + aH.value * 0.42
  const dx = px - cx, dy = py - cy
  const dist = Math.hypot(dx, dy) || 1
  const reach = Math.min(1, dist / 300)
  return { x: (dx / dist) * reach, y: (dy / dist) * reach }
}
const look = computed<{ x: number; y: number } | null>(() => {
  if (sleeping.value) return null
  if (drag.value) return lookToward(drag.value.x, drag.value.y)
  return lookToward(mx.value, my.value)
})
// Boca abierta: al reír, o cuando la comida arrastrada está cerca.
// Al SOLTAR la comida, drag pasa a null → la boca se cierra al instante.
const mouthOpen = computed(() => giggle.value || (!!drag.value && dragNearMouth.value))

// ── Casa: mimar → reacción (rebote + risa + corazones esparcidos) ───
let giggleT: ReturnType<typeof setTimeout> | undefined
function petHibi() {
  mascotRef.value?.poke()
  reacting.value = false
  requestAnimationFrame(() => { reacting.value = true; setTimeout(() => (reacting.value = false), 480) })
  giggle.value = true
  if (giggleT) clearTimeout(giggleT); giggleT = setTimeout(() => (giggle.value = false), 600)
  emit('affection'); popHearts()
}
// Corazones repartidos por el CONTORNO de la nube (elipse) que salen hacia AFUERA.
interface Pop { id: number; x: number; y: number; ox: number; oy: number; delay: number }
const hearts = ref<Pop[]>([])
let hid = 0
// Puntos sobre el CONTORNO real de la nube (coords del SVG 140×112, en sus bultos).
const CONTOUR: [number, number][] = [
  [52, 8], [72, 12], [92, 18], [110, 30], [122, 46], [134, 62],
  [6, 58], [16, 40], [34, 20], [86, 10], [104, 24], [46, 12],
]
function popHearts() {
  const s = hibiSize.value / 140
  // toma 5-6 puntos AL AZAR (no todos, no siempre los mismos)
  const pts = CONTOUR.slice().sort(() => Math.random() - 0.5).slice(0, 5 + Math.floor(Math.random() * 2))
  pts.forEach((p) => {
    const id = hid++
    const x = (p[0] - 70) * s + (Math.random() * 10 - 5)   // px desde el centro, con jitter
    const y = (p[1] - 54) * s + (Math.random() * 8 - 4)
    const len = Math.hypot(x, y) || 1                       // sale hacia AFUERA desde el centro
    const dist = 22 + Math.random() * 22
    hearts.value.push({ id, x, y, ox: (x / len) * dist, oy: (y / len) * dist - 8, delay: Math.random() * 140 })
    setTimeout(() => { const k = hearts.value.findIndex(h => h.id === id); if (k >= 0) hearts.value.splice(k, 1) }, 1200)
  })
}
function onActorDown(_e: PointerEvent) { if (!sleeping.value) petHibi() }

// ── Catálogo de comida (30) — gains modestos, precios más caros ─────
// `id` es la CLAVE de inventario (persistida): NO se traduce. name/desc salen de i18n por id.
interface Food { id: string; icon: Component; gain: number; price: number; bg: string; ink: string }
const FOODS: Food[] = [
  { id: 'galleta', icon: Cookie, gain: 6, price: 8, bg: 'bg-cream', ink: 'text-[#bf8f2e]' },
  { id: 'manzana', icon: Apple, gain: 8, price: 12, bg: 'bg-mint', ink: 'text-[#34936a]' },
  { id: 'banana', icon: Banana, gain: 8, price: 12, bg: 'bg-yellow', ink: 'text-[#bf8f2e]' },
  { id: 'cereza', icon: Cherry, gain: 7, price: 10, bg: 'bg-pink-soft', ink: 'text-pink-deep' },
  { id: 'uvas', icon: Grape, gain: 9, price: 16, bg: 'bg-lavender', ink: 'text-[#7a63c0]' },
  { id: 'zanahoria', icon: Carrot, gain: 7, price: 10, bg: 'bg-peach', ink: 'text-[#c5733f]' },
  { id: 'naranja', icon: Citrus, gain: 8, price: 14, bg: 'bg-cream', ink: 'text-[#bf8f2e]' },
  { id: 'croissant', icon: Croissant, gain: 11, price: 22, bg: 'bg-cream', ink: 'text-[#bf8f2e]' },
  { id: 'cafe', icon: Coffee, gain: 5, price: 10, bg: 'bg-peach', ink: 'text-[#c5733f]' },
  { id: 'leche', icon: Milk, gain: 7, price: 12, bg: 'bg-sky-soft', ink: 'text-sky-deep' },
  { id: 'huevo', icon: Egg, gain: 10, price: 18, bg: 'bg-cream', ink: 'text-[#bf8f2e]' },
  { id: 'ensalada', icon: Salad, gain: 12, price: 26, bg: 'bg-mint', ink: 'text-[#34936a]' },
  { id: 'sopa', icon: Soup, gain: 13, price: 28, bg: 'bg-peach', ink: 'text-[#c5733f]' },
  { id: 'sandwich', icon: Sandwich, gain: 14, price: 32, bg: 'bg-peach', ink: 'text-[#c5733f]' },
  { id: 'sushi', icon: Fish, gain: 17, price: 40, bg: 'bg-sky-soft', ink: 'text-sky-deep' },
  { id: 'pollo', icon: Drumstick, gain: 18, price: 44, bg: 'bg-cream', ink: 'text-[#bf8f2e]' },
  { id: 'carne', icon: Beef, gain: 20, price: 50, bg: 'bg-pink-soft', ink: 'text-pink-deep' },
  { id: 'jamon', icon: Ham, gain: 15, price: 34, bg: 'bg-pink-soft', ink: 'text-pink-deep' },
  { id: 'pizza', icon: Pizza, gain: 21, price: 54, bg: 'bg-pink-soft', ink: 'text-pink-deep' },
  { id: 'palomitas', icon: Popcorn, gain: 10, price: 20, bg: 'bg-cream', ink: 'text-[#bf8f2e]' },
  { id: 'dona', icon: Donut, gain: 15, price: 34, bg: 'bg-pink-soft', ink: 'text-pink-deep' },
  { id: 'dulce', icon: Candy, gain: 6, price: 10, bg: 'bg-lavender', ink: 'text-[#7a63c0]' },
  { id: 'paleta', icon: Lollipop, gain: 7, price: 12, bg: 'bg-pink-soft', ink: 'text-pink-deep' },
  { id: 'helado', icon: IceCreamCone, gain: 16, price: 38, bg: 'bg-sky-soft', ink: 'text-sky-deep' },
  { id: 'pastel', icon: Cake, gain: 27, price: 78, bg: 'bg-lavender', ink: 'text-[#7a63c0]' },
  { id: 'pan', icon: Wheat, gain: 8, price: 14, bg: 'bg-cream', ink: 'text-[#bf8f2e]' },
  { id: 'frijoles', icon: Bean, gain: 11, price: 24, bg: 'bg-mint', ink: 'text-[#34936a]' },
  { id: 'refresco', icon: CupSoda, gain: 6, price: 12, bg: 'bg-sky-soft', ink: 'text-sky-deep' },
  { id: 'malta', icon: Beer, gain: 9, price: 20, bg: 'bg-cream', ink: 'text-[#bf8f2e]' },
  { id: 'jugo', icon: Wine, gain: 10, price: 24, bg: 'bg-pink-soft', ink: 'text-pink-deep' },
]
const FOOD_BY_ID = Object.fromEntries(FOODS.map(f => [f.id, f]))
// Etiquetas de comida por id (solo DISPLAY): nombre + descripción.
const foodName = (id: string) => t(`hibi.items.${id}.name`)
const foodDesc = (id: string) => t(`hibi.items.${id}.desc`)

const cocinaPanel = ref<'none' | 'nevera' | 'tienda'>('none')

// Juegos: 'none' cerrado, 'menu' eligiendo, o el id del juego en curso.
const gamesPanel = ref<'none' | 'menu' | string>('none')
function onGameEnd(coins: number) { gamesPanel.value = 'menu'; emit('gameReward', coins) }
const owned = computed(() => FOODS.filter(f => (props.inventory[f.id] || 0) > 0))
const selId = ref<string>('')
watchEffect(() => {
  if (!owned.value.length) { selId.value = ''; return }
  if (!owned.value.find(f => f.id === selId.value)) selId.value = owned.value[0]!.id
})
const selFood = computed(() => FOOD_BY_ID[selId.value] || null)
const selQty = computed(() => (selFood.value ? props.inventory[selFood.value.id] || 0 : 0))
function cycleSel(dir: number) {
  if (!owned.value.length) return
  const i = owned.value.findIndex(f => f.id === selId.value)
  selId.value = owned.value[(i + dir + owned.value.length) % owned.value.length]!.id
}
function buy(f: Food) {
  if (props.coins < f.price) return
  emit('buy', f.id, f.price)
}

// ── Arrastrar la comida hasta la boca ───────────────────────────────
const drag = ref<{ food: Food; x: number; y: number } | null>(null)
const dragNearMouth = ref(false)
function actorDist(x: number, y: number) {
  const r = actorRef.value?.getBoundingClientRect()
  if (!r) return Infinity
  return Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height * 0.45))
}
function startDrag(e: PointerEvent) {
  const f = selFood.value
  if (!f || selQty.value <= 0) return
  drag.value = { food: f, x: e.clientX, y: e.clientY }
  window.addEventListener('pointermove', dragMove)
  window.addEventListener('pointerup', dragEnd)
}
function dragMove(e: PointerEvent) {
  if (!drag.value) return
  drag.value.x = e.clientX; drag.value.y = e.clientY
  const r = actorRef.value?.getBoundingClientRect()
  dragNearMouth.value = !!r && actorDist(e.clientX, e.clientY) < r.width * 0.55
}
function dragEnd(e: PointerEvent) {
  window.removeEventListener('pointermove', dragMove)
  window.removeEventListener('pointerup', dragEnd)
  const d = drag.value; drag.value = null; dragNearMouth.value = false
  if (!d) return
  const r = actorRef.value?.getBoundingClientRect()
  if (r && actorDist(e.clientX, e.clientY) < r.width * 0.7) {
    eating.value = true
    emit('feed', d.food.id, d.food.gain)
    setTimeout(() => (eating.value = false), 440)
  }
}

// ── Dormir ──────────────────────────────────────────────────────────
function toggleSleep() { sleeping.value = !sleeping.value; emit('sleep', sleeping.value) }

onMounted(() => { measure(); window.addEventListener('resize', measure) })
onBeforeUnmount(() => {
  window.removeEventListener('resize', measure)
  window.removeEventListener('pointermove', dragMove)
  window.removeEventListener('pointerup', dragEnd)
  if (giggleT) clearTimeout(giggleT)
})
</script>

<template>
  <div ref="sceneRef" class="relative w-full h-full overflow-hidden flex flex-col bg-base select-none touch-none">
    <!-- ░░ FONDO por cuarto — cambia con animación de deslizar ░░ -->
    <Transition :name="slideDir === 1 ? 'room-next' : 'room-prev'">
      <div :key="room" class="absolute inset-0 pointer-events-none" :class="ROOM_WALL[room]" aria-hidden="true">
        <!-- suelo de nube -->
        <div class="absolute inset-x-[-14%] bottom-0 h-[32%] rounded-t-[100%] bg-white/25" />
        <div class="absolute inset-x-[6%] bottom-0 h-[20%] rounded-t-[100%] bg-white/15" />

        <!-- ░ CASA: sala — sofá, planta, cuadro ░ -->
        <template v-if="room === 'casa'">
          <div class="absolute top-[8%] right-[10%] size-24 rounded-full bg-white/55" />
          <HibiCloud :size="130" float :duration="11" class="absolute top-[6%] left-[6%] text-white opacity-60" />
          <HibiCloud :size="80" float :duration="14" :delay="1.2" class="absolute top-[18%] right-[30%] text-white opacity-45" />
          <!-- cuadro en la pared -->
          <div class="absolute left-[10%] top-[18%] w-14 h-11 rounded-[7px] bg-white/80 p-1.5">
            <div class="w-full h-full rounded-[4px] bg-sky/60" />
          </div>
          <!-- sofá -->
          <div class="absolute left-[6%] bottom-[22%] w-[132px] h-[58px]">
            <div class="absolute inset-x-3 top-0 h-9 rounded-[14px] bg-white/80" />
            <div class="absolute left-5 right-5 top-2 h-6 rounded-[9px] bg-sky/45" />
            <div class="absolute left-0 bottom-1 w-6 h-10 rounded-[11px] bg-white/85" />
            <div class="absolute right-0 bottom-1 w-6 h-10 rounded-[11px] bg-white/85" />
            <div class="absolute left-4 right-4 bottom-2 h-6 rounded-[8px] bg-white/90" />
            <div class="absolute left-5 -bottom-1 w-2 h-2.5 rounded-b bg-black/15" />
            <div class="absolute right-5 -bottom-1 w-2 h-2.5 rounded-b bg-black/15" />
          </div>
          <!-- planta -->
          <div class="absolute right-[8%] bottom-[23%] w-12 h-[70px]">
            <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-7 rounded-b-[12px] rounded-t-[4px] bg-peach" />
            <div class="absolute bottom-5 left-1/2 -translate-x-1/2 w-11 h-12 rounded-full bg-mint/85" />
          </div>
        </template>

        <!-- ░ COCINA: nevera, mesón con alacenas, repisa con frascos ░ -->
        <template v-else-if="room === 'cocina'">
          <div class="absolute top-[9%] right-[12%] size-20 rounded-full bg-white/45" />
          <!-- repisa con frascos -->
          <div class="absolute left-[14%] top-[20%] w-28 h-1.5 rounded bg-white/70" />
          <div class="absolute left-[16%] top-[13%] w-5 h-7 rounded-[4px] bg-white/80" />
          <div class="absolute left-[26%] top-[14%] w-4 h-6 rounded-[4px] bg-mint/70" />
          <div class="absolute left-[34%] top-[13%] w-5 h-7 rounded-[4px] bg-peach/80" />
          <!-- mesón con alacenas -->
          <div class="absolute inset-x-[18%] bottom-[30%] h-12">
            <div class="absolute inset-x-0 top-0 h-3 rounded-t-[6px] bg-white/85" />
            <div class="absolute inset-x-0 top-3 bottom-0 bg-cream/70" />
            <div class="absolute top-6 left-[25%] w-px h-5 bg-black/12" />
            <div class="absolute top-6 left-[50%] w-px h-5 bg-black/12" />
            <div class="absolute top-6 left-[75%] w-px h-5 bg-black/12" />
            <div class="absolute top-7 left-[18%] size-1.5 rounded-full bg-black/15" />
            <div class="absolute top-7 left-[43%] size-1.5 rounded-full bg-black/15" />
            <div class="absolute top-7 left-[68%] size-1.5 rounded-full bg-black/15" />
          </div>
          <!-- nevera -->
          <div class="absolute right-[9%] bottom-[30%] w-12 h-[92px] rounded-[10px] bg-white/85">
            <div class="absolute inset-x-2 top-[42%] h-px bg-black/12" />
            <div class="absolute left-2 top-3 w-1 h-6 rounded-full bg-black/15" />
            <div class="absolute left-2 top-[50%] w-1 h-6 rounded-full bg-black/15" />
          </div>
        </template>

        <!-- ░ JUEGOS: globos, pelota, bloques ░ -->
        <template v-else-if="room === 'juegos'">
          <!-- globos -->
          <div class="absolute left-[12%] top-[12%]">
            <div class="size-8 rounded-full bg-pink/75" />
            <div class="absolute left-1/2 top-8 w-px h-9 bg-black/15" />
          </div>
          <div class="absolute left-[21%] top-[16%]">
            <div class="size-7 rounded-full bg-sky/70" />
            <div class="absolute left-1/2 top-7 w-px h-8 bg-black/15" />
          </div>
          <HibiSparkle :size="18" twinkle class="absolute top-[14%] right-[20%] text-white/80" />
          <HibiSparkle :size="14" twinkle :delay="0.7" class="absolute top-[30%] right-[34%] text-white/70" />
          <!-- pelota -->
          <div class="absolute right-[10%] bottom-[23%] size-14 rounded-full bg-white/85 overflow-hidden">
            <div class="absolute inset-y-0 left-1/2 w-3.5 -translate-x-1/2 bg-pink/70" />
            <div class="absolute inset-x-0 top-1/2 h-3.5 -translate-y-1/2 bg-sky/70" />
          </div>
          <!-- bloques -->
          <div class="absolute left-[9%] bottom-[23%]">
            <div class="absolute bottom-0 left-0 size-8 rounded-[6px] bg-sky/70" />
            <div class="absolute bottom-0 left-8 size-8 rounded-[6px] bg-mint/70" />
            <div class="absolute bottom-8 left-3 size-8 rounded-[6px] bg-peach/80" />
          </div>
        </template>

        <!-- ░ DORMITORIO: cama, mesita con lámpara, luna y estrellas ░ -->
        <template v-else>
          <div class="absolute top-[10%] right-[16%] size-16 rounded-full bg-white/55" />
          <HibiSparkle :size="14" twinkle class="absolute top-[16%] left-[20%] text-white/80" />
          <HibiSparkle :size="12" twinkle :delay="0.6" class="absolute top-[26%] left-[48%] text-white/70" />
          <HibiSparkle :size="13" twinkle :delay="1" class="absolute top-[20%] right-[34%] text-white/70" />
          <HibiSparkle :size="11" twinkle :delay="1.3" class="absolute top-[34%] left-[32%] text-white/60" />
          <!-- cama -->
          <div class="absolute left-[8%] bottom-[20%] w-[160px] h-[58px]">
            <div class="absolute left-0 bottom-0 w-6 h-[52px] rounded-[10px] bg-white/80" />
            <div class="absolute left-4 right-0 bottom-2 h-9 rounded-[10px] bg-white/85" />
            <div class="absolute left-6 bottom-7 w-12 h-5 rounded-[7px] bg-white/95" />
            <div class="absolute left-[46%] right-0 bottom-2 h-7 rounded-[10px] bg-lavender/75" />
            <div class="absolute left-1 -bottom-1 w-2 h-3 bg-black/15" />
            <div class="absolute right-1 -bottom-1 w-2 h-3 bg-black/15" />
          </div>
          <!-- mesita + lámpara -->
          <div class="absolute right-[12%] bottom-[22%] w-10 h-[64px]">
            <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-9 h-7 rounded-[6px] bg-white/80" />
            <div class="absolute bottom-6 left-1/2 -translate-x-1/2 w-1 h-5 bg-black/15" />
            <div class="absolute bottom-[42px] left-1/2 -translate-x-1/2 w-8 h-5 rounded-t-[12px] bg-yellow/90" />
          </div>
        </template>
      </div>
    </Transition>

    <Transition name="hibi-fade">
      <div v-if="sleeping" class="absolute inset-0 bg-[#0a0e1c]/55 pointer-events-none z-20" aria-hidden="true" />
    </Transition>

    <!-- monedas/racha — móvil: fila propia (derecha) · desktop: flotan arriba-derecha -->
    <div class="relative z-30 shrink-0 flex items-center justify-end gap-2 px-4 pt-3 md:absolute md:top-4 md:right-4 md:pt-0">
      <span class="inline-flex items-center gap-1.5 px-3 h-9 rounded-full bg-card text-[#bf8f2e] text-[13px] font-extrabold tabular-nums"><Coins class="size-[15px]" :stroke-width="2.3" /> {{ coins }}</span>
      <span class="inline-flex items-center gap-1.5 px-3 h-9 rounded-full bg-card text-[#c5733f] text-[13px] font-extrabold tabular-nums"><Flame class="size-[15px]" :stroke-width="2.3" /> {{ streak }}</span>
    </div>
    <!-- bolitas de estado -->
    <div class="relative z-30 shrink-0 flex items-start justify-center gap-3 md:gap-4 pt-1.5 md:pt-4 px-4">
      <button v-for="s in STATS" :key="s.key" type="button" class="flex flex-col items-center gap-1 active:scale-95 transition-transform" :aria-label="s.label" @click="tapStat(s.go)">
        <span class="relative grid place-items-center size-12 md:size-[52px] rounded-full bg-card overflow-hidden">
          <span class="absolute inset-x-0 bottom-0 transition-[height] duration-500 ease-out" :style="{ height: s.v + '%', backgroundColor: s.fill, opacity: 0.5 }" aria-hidden="true" />
          <component :is="s.icon" class="relative size-[18px] md:size-5" :class="s.ink" :stroke-width="2.2" />
        </span>
        <span class="text-[10.5px] font-bold text-fg tabular-nums">{{ s.v }}%</span>
      </button>
    </div>

    <!-- flechas laterales -->
    <button type="button" class="absolute left-2 top-1/2 -translate-y-1/2 z-30 grid place-items-center size-11 rounded-full bg-card/85 text-fg active:scale-90 transition-transform" :aria-label="t('hibi.nav.prevSection')" @click="prev"><ChevronLeft class="size-6" :stroke-width="2.3" /></button>
    <button type="button" class="absolute right-2 top-1/2 -translate-y-1/2 z-30 grid place-items-center size-11 rounded-full bg-card/85 text-fg active:scale-90 transition-transform" :aria-label="t('hibi.nav.nextSection')" @click="next"><ChevronRight class="size-6" :stroke-width="2.3" /></button>

    <!-- Cocina: NEVERA (esquina izq) · TIENDA (esquina der) — abren su panel -->
    <template v-if="room === 'cocina'">
      <button type="button" class="absolute left-3 bottom-[92px] md:bottom-4 z-40 inline-flex items-center gap-1.5 h-10 px-3.5 rounded-full bg-card text-[#1f4661] text-[12.5px] font-bold active:scale-95 transition-transform" @click="cocinaPanel = 'nevera'">
        <Refrigerator class="size-[16px] text-sky-deep" :stroke-width="2.2" /> {{ t('hibi.kitchen.fridge') }}
      </button>
      <button type="button" class="absolute right-3 bottom-[92px] md:bottom-4 z-40 inline-flex items-center gap-1.5 h-10 px-3.5 rounded-full bg-cream text-[#9a5a33] text-[12.5px] font-bold active:scale-95 transition-transform" @click="cocinaPanel = 'tienda'">
        <ShoppingBag class="size-[16px]" :stroke-width="2.2" /> {{ t('hibi.kitchen.shop') }}
      </button>
    </template>

    <!-- CENTRO: Hibi -->
    <div class="relative z-10 flex-1 min-h-0 flex flex-col items-center justify-center gap-2">
      <Transition name="hibi-fade" mode="out-in">
        <span :key="moodLabel" class="px-4 h-8 inline-flex items-center rounded-full bg-card text-fg text-[13.5px] font-extrabold">{{ moodLabel }}</span>
      </Transition>
      <div class="relative flex items-center justify-center" :style="{ height: hibiSize * 1.18 + 'px' }">
        <span v-for="h in hearts" :key="'h' + h.id" class="hibi-heart absolute z-40 text-pink-deep pointer-events-none" :style="{ left: `calc(50% + ${h.x}px)`, top: `calc(45% + ${h.y}px)`, '--ox': h.ox + 'px', '--oy': h.oy + 'px', animationDelay: h.delay + 'ms' }" aria-hidden="true">
          <Heart class="size-6 fill-current" :stroke-width="0" />
        </span>
        <div class="absolute left-1/2 -translate-x-1/2 rounded-[50%] bg-sky-deep/15 pointer-events-none" :style="{ bottom: '2%', width: hibiSize * 0.5 + 'px', height: hibiSize * 0.1 + 'px' }" aria-hidden="true" />
        <div ref="actorRef" class="relative z-10 origin-bottom hibi-breathe" :class="[reacting ? 'hibi-squish' : '', eating ? 'hibi-chomp' : '']" @pointerdown="onActorDown">
          <HibiMascot ref="mascotRef" :size="hibiSize" :state="effState" :look="look" :mouth-open="mouthOpen" class="text-white" />
        </div>
      </div>
    </div>

    <!-- ABAJO: interacción de la sección (con animación al cambiar) -->
    <div class="relative z-30 shrink-0 px-4 pb-4 min-h-[150px] flex flex-col justify-end">
      <Transition :name="slideDir === 1 ? 'sec-next' : 'sec-prev'" mode="out-in">
        <div :key="room" class="flex flex-col items-center gap-2">
          <!-- Casa -->
          <p v-if="room === 'casa'" class="text-[13px] font-bold text-sky-deep py-3">{{ t('hibi.home.petHint') }}</p>

          <!-- Cocina: el seleccionado abajo con flechitas; se arrastra a Hibi -->
          <template v-else-if="room === 'cocina'">
            <div v-if="selFood" class="flex items-center gap-3">
              <button type="button" class="grid place-items-center size-9 rounded-full bg-card text-fg-muted active:scale-90 transition-transform" :aria-label="t('hibi.nav.prev')" @click="cycleSel(-1)"><ChevronLeft class="size-5" :stroke-width="2.3" /></button>
              <div class="flex flex-col items-center gap-1">
                <button type="button" class="relative grid place-items-center size-[66px] rounded-[20px] touch-none active:scale-95 transition-transform cursor-grab" :class="[selFood.bg, selFood.ink]" @pointerdown.prevent="startDrag($event)">
                  <component :is="selFood.icon" class="size-9" :stroke-width="1.85" />
                  <span class="absolute -top-1.5 -right-1.5 grid place-items-center min-w-5 h-5 px-1 rounded-full bg-sky-deep text-white text-[11px] font-extrabold tabular-nums">{{ selQty }}</span>
                </button>
                <span class="text-[12px] font-bold text-fg">{{ foodName(selFood.id) }}</span>
              </div>
              <button type="button" class="grid place-items-center size-9 rounded-full bg-card text-fg-muted active:scale-90 transition-transform" :aria-label="t('hibi.nav.next')" @click="cycleSel(1)"><ChevronRight class="size-5" :stroke-width="2.3" /></button>
            </div>
            <p v-if="selFood" class="text-[11.5px] font-bold text-[#9a5a33]">{{ t('hibi.kitchen.dragToFeed') }}</p>
            <p v-else class="text-[12.5px] font-bold text-[#9a5a33] py-2">{{ t('hibi.kitchen.emptyHint') }}</p>
          </template>

          <!-- Juegos -->
          <template v-else-if="room === 'juegos'">
            <button type="button" class="inline-flex items-center gap-2 h-12 px-7 rounded-full bg-pink-deep text-white font-bold text-[15px] active:scale-95 transition-transform" @click="gamesPanel = 'menu'">
              <Gamepad2 class="size-[18px]" :stroke-width="2.1" /> {{ t('hibi.games.play') }}
            </button>
            <p v-if="lastGameCoins" class="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-[#bf8f2e]"><Coins class="size-[14px]" :stroke-width="2.3" /> {{ t('hibi.games.won', { n: lastGameCoins, unit: t(lastGameCoins === 1 ? 'hibi.games.coinUnit.one' : 'hibi.games.coinUnit.other') }) }}</p>
            <p v-else class="text-[12px] font-bold text-pink-deep/80">{{ t('hibi.games.hint') }}</p>
          </template>

          <!-- Dormitorio -->
          <template v-else>
            <button type="button" class="inline-flex items-center gap-2 h-12 px-6 rounded-full font-bold text-[14.5px] active:scale-95 transition-transform" :class="sleeping ? 'bg-card text-[#7a63c0]' : 'bg-lavender text-[#7a63c0]'" @click="toggleSleep">
              <Power class="size-[17px]" :stroke-width="2.3" /> {{ sleeping ? t('hibi.bedroom.lightOn') : t('hibi.bedroom.lightOff') }}
            </button>
            <p class="text-[12px] font-bold" :class="sleeping ? 'text-white/80' : 'text-[#6b5aa6]'">{{ sleeping ? t('hibi.bedroom.sleeping') : t('hibi.bedroom.sleepHint') }}</p>
          </template>
        </div>
      </Transition>

      <!-- nombre + puntitos (fijos) -->
      <div class="flex flex-col items-center gap-1.5 pt-2">
        <span class="text-[12px] font-extrabold text-fg">{{ sectionName }}</span>
        <div class="flex items-center gap-1.5">
          <button v-for="(s, i) in SECTIONS" :key="s.key" type="button" class="rounded-full transition-all" :class="i === idx ? 'w-5 h-1.5 bg-sky-deep' : 'size-1.5 bg-fg-subtle/40'" :aria-label="sectionLabel[s.key]" @click="goTo(i)" />
        </div>
      </div>
    </div>

    <!-- NEVERA: tu comida (toca para elegir) -->
    <Transition name="sheet-up">
      <div v-if="room === 'cocina' && cocinaPanel === 'nevera'" class="absolute inset-x-0 bottom-0 top-[96px] z-[45] bg-base rounded-t-[22px] flex flex-col overflow-hidden">
        <header class="shrink-0 flex items-center justify-between px-4 py-3">
          <h3 class="text-[15px] font-extrabold text-fg inline-flex items-center gap-2"><Refrigerator class="size-[17px] text-sky-deep" :stroke-width="2.2" /> {{ t('hibi.kitchen.fridge') }}</h3>
          <button type="button" class="grid place-items-center size-9 rounded-full bg-muted text-fg-muted" :aria-label="t('common.close')" @click="cocinaPanel = 'none'"><X class="size-[18px]" :stroke-width="2.2" /></button>
        </header>
        <ul v-if="owned.length" class="flex-1 min-h-0 overflow-y-auto scroll-area px-3 pb-4 flex flex-col gap-2">
          <li v-for="f in owned" :key="f.id">
            <button type="button" class="w-full flex items-center gap-3 p-2.5 rounded-[14px] active:scale-[0.99] transition-transform" :class="selId === f.id ? 'bg-sky-soft' : 'bg-card'" @click="selId = f.id; cocinaPanel = 'none'">
              <span class="relative grid place-items-center size-12 rounded-[14px] shrink-0" :class="[f.bg, f.ink]">
                <component :is="f.icon" class="size-6" :stroke-width="1.9" />
                <span class="absolute -top-1.5 -right-1.5 grid place-items-center min-w-[18px] h-[18px] px-1 rounded-full bg-sky-deep text-white text-[10px] font-extrabold tabular-nums">{{ inventory[f.id] }}</span>
              </span>
              <div class="flex-1 min-w-0 text-left">
                <p class="text-[14px] font-bold text-fg leading-tight">{{ foodName(f.id) }}</p>
                <p class="text-[12px] text-fg-muted truncate">{{ foodDesc(f.id) }}</p>
                <p class="text-[11.5px] font-bold text-[#34936a]">{{ t('hibi.kitchen.gain', { n: f.gain }) }}</p>
              </div>
              <span class="shrink-0 inline-flex items-center gap-1 h-9 px-3.5 rounded-full text-[12.5px] font-bold" :class="selId === f.id ? 'bg-sky-deep text-white' : 'bg-muted text-fg-muted'">
                <Check v-if="selId === f.id" class="size-[14px]" :stroke-width="2.6" /> {{ selId === f.id ? t('hibi.kitchen.chosen') : t('hibi.kitchen.choose') }}
              </span>
            </button>
          </li>
        </ul>
        <div v-else class="flex-1 grid place-items-center px-6 text-center">
          <p class="text-[13.5px] font-bold text-fg-muted">{{ t('hibi.kitchen.fridgeEmptyL1') }}<br>{{ t('hibi.kitchen.fridgeEmptyL2') }}</p>
        </div>
      </div>
    </Transition>

    <!-- TIENDA: sección en filas (no modal) -->
    <Transition name="sheet-up">
      <div v-if="room === 'cocina' && cocinaPanel === 'tienda'" class="absolute inset-x-0 bottom-0 top-[96px] z-[45] bg-base rounded-t-[22px] flex flex-col overflow-hidden">
        <header class="shrink-0 flex items-center justify-between px-4 py-3">
          <h3 class="text-[15px] font-extrabold text-fg inline-flex items-center gap-2"><ShoppingBag class="size-[17px] text-[#9a5a33]" :stroke-width="2.2" /> {{ t('hibi.kitchen.shop') }}</h3>
          <span class="inline-flex items-center gap-1.5 px-3 h-8 rounded-full bg-cream text-[#bf8f2e] text-[13px] font-bold tabular-nums"><Coins class="size-[14px]" :stroke-width="2.3" /> {{ coins }}</span>
          <button type="button" class="grid place-items-center size-9 rounded-full bg-muted text-fg-muted" :aria-label="t('common.close')" @click="cocinaPanel = 'none'"><X class="size-[18px]" :stroke-width="2.2" /></button>
        </header>
        <ul class="flex-1 min-h-0 overflow-y-auto scroll-area px-3 pb-4 flex flex-col gap-2">
          <li v-for="f in FOODS" :key="f.id" class="flex items-center gap-3 p-2.5 rounded-[14px] bg-card">
            <span class="relative grid place-items-center size-12 rounded-[14px] shrink-0" :class="[f.bg, f.ink]">
              <component :is="f.icon" class="size-6" :stroke-width="1.9" />
              <span v-if="inventory[f.id]" class="absolute -top-1.5 -right-1.5 grid place-items-center min-w-[18px] h-[18px] px-1 rounded-full bg-sky-deep text-white text-[10px] font-extrabold tabular-nums">{{ inventory[f.id] }}</span>
            </span>
            <div class="flex-1 min-w-0">
              <p class="text-[14px] font-bold text-fg leading-tight">{{ foodName(f.id) }}</p>
              <p class="text-[12px] text-fg-muted truncate">{{ foodDesc(f.id) }}</p>
              <p class="text-[11.5px] font-bold text-[#34936a]">{{ t('hibi.kitchen.gain', { n: f.gain }) }}</p>
            </div>
            <button type="button" :disabled="coins < f.price" class="shrink-0 inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-sky text-[#1f4661] font-bold text-[13px] tabular-nums disabled:opacity-40" @click="buy(f)">
              <Coins class="size-[13px]" :stroke-width="2.4" /> {{ f.price }}
            </button>
          </li>
        </ul>
      </div>
    </Transition>

    <!-- JUEGOS: menú que sube desde abajo, un poco más de la mitad de la pantalla -->
    <Transition name="sheet-up">
      <div v-if="room === 'juegos' && gamesPanel === 'menu'" class="absolute inset-x-0 bottom-0 top-[26%] z-[45] bg-base rounded-t-[22px] flex flex-col overflow-hidden">
        <div class="flex-1 min-h-0 p-2.5">
          <HibiGamesMenu :last-game-coins="lastGameCoins" @pick="gamesPanel = $event" @close="gamesPanel = 'none'" />
        </div>
      </div>
    </Transition>

    <!-- Juego elegido: a pantalla completa (como antes). Al salir/terminar vuelve al menú. -->
    <ClientOnly>
      <Teleport to="body">
        <Transition name="sheet-up">
          <div v-if="gamesPanel !== 'none' && gamesPanel !== 'menu'" class="fixed inset-0 z-[70] bg-base p-3" style="padding-top: max(0.75rem, env(safe-area-inset-top)); padding-bottom: max(0.75rem, env(safe-area-inset-bottom))">
            <GameFlip v-if="gamesPanel === 'flip'" @end="onGameEnd" @exit="gamesPanel = 'menu'" />
            <GameMemory v-else-if="gamesPanel === 'memory'" @end="onGameEnd" @exit="gamesPanel = 'menu'" />
            <GamePop v-else-if="gamesPanel === 'pop'" @end="onGameEnd" @exit="gamesPanel = 'menu'" />
            <GameSimon v-else-if="gamesPanel === 'simon'" @end="onGameEnd" @exit="gamesPanel = 'menu'" />
            <GameMerge v-else-if="gamesPanel === 'merge'" @end="onGameEnd" @exit="gamesPanel = 'menu'" />
            <HibiGame v-else-if="gamesPanel === 'esquiva'" @end="onGameEnd" @exit="gamesPanel = 'menu'" />
          </div>
        </Transition>
      </Teleport>
    </ClientOnly>

    <!-- comida arrastrándose -->
    <ClientOnly>
      <Teleport to="body">
        <div v-if="drag" class="fixed z-[80] pointer-events-none -translate-x-1/2 -translate-y-1/2 grid place-items-center size-16 rounded-[18px] bg-card scale-110" :class="drag.food.ink" :style="{ left: drag.x + 'px', top: drag.y + 'px' }">
          <component :is="drag.food.icon" class="size-8" :stroke-width="1.9" />
        </div>
      </Teleport>
    </ClientOnly>
  </div>
</template>

<style scoped>
.hibi-breathe { animation: hibiBreathe 3.4s ease-in-out infinite; }
@keyframes hibiBreathe { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-5px) scale(1.012); } }
.hibi-squish { animation: hibiSquish 0.5s ease-out; }
@keyframes hibiSquish { 0% { transform: scale(1); } 35% { transform: scale(1.13, 0.85); } 70% { transform: scale(0.95, 1.06); } 100% { transform: scale(1); } }
.hibi-chomp { animation: hibiChomp 0.36s ease-in-out; }
@keyframes hibiChomp { 0%, 100% { transform: scaleY(1); } 50% { transform: scaleY(0.9); } }
.hibi-heart { transform: translate(-50%, -50%); animation: hibiHeartOut 1.3s ease-out forwards; }
@keyframes hibiHeartOut {
  0% { transform: translate(-50%, -50%) scale(0.3); opacity: 0; }
  25% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
  100% { transform: translate(calc(-50% + var(--ox, 0px)), calc(-50% + var(--oy, 0px))) scale(0.8); opacity: 0; }
}

.room-next-enter-active, .room-next-leave-active, .room-prev-enter-active, .room-prev-leave-active { transition: transform 0.45s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.45s ease; }
.room-next-enter-from { transform: translateX(100%); opacity: 0.5; }
.room-next-leave-to { transform: translateX(-100%); opacity: 0.5; }
.room-prev-enter-from { transform: translateX(-100%); opacity: 0.5; }
.room-prev-leave-to { transform: translateX(100%); opacity: 0.5; }
.sec-next-enter-active, .sec-next-leave-active, .sec-prev-enter-active, .sec-prev-leave-active { transition: transform 0.26s ease, opacity 0.26s ease; }
.sec-next-enter-from { transform: translateX(26px); opacity: 0; }
.sec-next-leave-to { transform: translateX(-26px); opacity: 0; }
.sec-prev-enter-from { transform: translateX(-26px); opacity: 0; }
.sec-prev-leave-to { transform: translateX(26px); opacity: 0; }
.sheet-up-enter-active, .sheet-up-leave-active { transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.25s ease; }
.sheet-up-enter-from, .sheet-up-leave-to { transform: translateY(100%); opacity: 0.6; }

@media (prefers-reduced-motion: reduce) {
  .hibi-breathe, .hibi-squish, .hibi-chomp, .hibi-heart { animation: none; }
  .sec-next-enter-active, .sec-next-leave-active, .sec-prev-enter-active, .sec-prev-leave-active, .sheet-up-enter-active, .sheet-up-leave-active, .room-next-enter-active, .room-next-leave-active, .room-prev-enter-active, .room-prev-leave-active { transition: opacity 0.2s ease; }
  .sec-next-enter-from, .sec-next-leave-to, .sec-prev-enter-from, .sec-prev-leave-to, .sheet-up-enter-from, .sheet-up-leave-to, .room-next-enter-from, .room-next-leave-to, .room-prev-enter-from, .room-prev-leave-to { transform: none; }
}
</style>
