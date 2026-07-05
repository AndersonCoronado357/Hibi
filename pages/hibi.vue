<script setup lang="ts">
// Módulo Hibi — tu mascota nube, ahora un MUNDO vivo (estilo Pou).
//  · Móvil: primero un selector 50-50 — "Cuida a tu Hibi" / "Habla con Hibi".
//  · La escena viva (HibiWorld) trae sus propios cuartos e interacciones reales;
//    aquí sólo vive el estado persistido, la decadencia, monedas y el mini-juego.
import { Flame, MessageCircle } from '@lucide/vue'

const { t } = useI18n()
useHead({ title: t('hibi.head.title') })

const router = useRouter()
const careOpen = ref(false) // móvil: false = selector, true = mundo. Desktop lo ignora.

// ── Estado de la mascota (persistido) ───────────────────────────────
interface Pet {
  energia: number; pancita: number; carino: number; diversion: number
  streak: number; lastCareDay: string; lastTick: number; coins: number; room: string; sleeping: boolean
  inventory: Record<string, number>
}
const STORE = 'hibi.pet.v1'
const STARTER_INV = { galleta: 3, manzana: 2, sandwich: 1 }
const pet = reactive<Pet>({ energia: 80, pancita: 82, carino: 86, diversion: 80, streak: 1, lastCareDay: '', lastTick: 0, coins: 40, room: 'casa', sleeping: false, inventory: { ...STARTER_INV } })
// No mostramos los stats hasta reconciliar cache + servidor + decay, para que
// al entrar se vea UN solo valor final y no un parpadeo (defaults → cache → decay).
const ready = ref(false)
const { fetchPet, savePet } = usePet()
function onRoom(k: string) { pet.room = k; save() }

const dayKey = (d = new Date()) => d.toISOString().slice(0, 10)
// Sin redondear: los stats se guardan como float para que el decaimiento por
// tiempo real acumule fracciones (si redondeáramos, cada tick pequeño se perdería).
// Se redondean solo al MOSTRAR (HibiWorld) y al GUARDAR en el servidor (usePet).
const clamp = (n: number) => Math.max(0, Math.min(100, n))

// Lee la caché local (sin decadencia ni reset todavía).
function loadLocalOnly() {
  if (!import.meta.client) return
  const raw = localStorage.getItem(STORE)
  if (raw) { try { Object.assign(pet, JSON.parse(raw)) } catch { /* ignore */ } }
  if (typeof pet.diversion !== 'number') pet.diversion = 70
  if (typeof pet.room !== 'string') pet.room = 'casa'
  if (!pet.inventory || typeof pet.inventory !== 'object') pet.inventory = { ...STARTER_INV }
}
// Ritmos por hora ausente.
const SLEEP_ENERGY_PER_HR = 20 // dormida: la energía sube ~20/h (0→100 en ~5h)
// Pasada de sueño: al llegar a 100 de energía, los demás bajan/h. Duplicado
// respecto a antes → tardan la MITAD en caer (100→0 en ~16h/25h/16h).
const OVERSLEEP = { pancita: 6, carino: 4, diversion: 6 }

// Reconciliación por el tiempo ausente + corta la racha si faltó un día.
// Dormida → la energía sube con el tiempo; al tocar 100 sigue dormida y los
// otros stats empiezan a decaer. Despierta → decadencia normal.
function applyDecay() {
  const elapsedMs = pet.lastTick ? Date.now() - pet.lastTick : 0
  if (elapsedMs > 0) {
    const hrs = elapsedMs / 3_600_000
    if (pet.sleeping) {
      const hrsToFull = Math.max(0, (100 - pet.energia) / SLEEP_ENERGY_PER_HR)
      pet.energia = clamp(pet.energia + hrs * SLEEP_ENERGY_PER_HR)
      const over = hrs - hrsToFull // horas de sueño DESPUÉS de llegar a 100
      if (over > 0) {
        pet.pancita = clamp(pet.pancita - over * OVERSLEEP.pancita)
        pet.carino = clamp(pet.carino - over * OVERSLEEP.carino)
        pet.diversion = clamp(pet.diversion - over * OVERSLEEP.diversion)
      }
    } else {
      // Despierta: decaimiento continuo (proporcional al tiempo REAL, sin perder
      // fracciones de hora — importante ahora que reconciliamos a menudo).
      pet.pancita = clamp(pet.pancita - hrs * 4)
      pet.energia = clamp(pet.energia - hrs * 3)
      pet.carino = clamp(pet.carino - hrs * 2)
      pet.diversion = clamp(pet.diversion - hrs * 3) // se va aburriendo
    }
    pet.lastTick = Date.now() // consume el tiempo ya aplicado (no re-contar)
  }
  const yest = dayKey(new Date(Date.now() - 86_400_000))
  if (pet.lastCareDay && pet.lastCareDay !== dayKey() && pet.lastCareDay !== yest) pet.streak = 0
}
// Guarda en la caché local Y (con debounce) en el servidor.
function save() {
  if (!import.meta.client) return
  localStorage.setItem(STORE, JSON.stringify(pet))
  savePet(pet)
}
function registerDailyCare() {
  const today = dayKey()
  if (pet.lastCareDay === today) return
  const yest = dayKey(new Date(Date.now() - 86_400_000))
  pet.streak = pet.lastCareDay === yest ? pet.streak + 1 : 1
  pet.lastCareDay = today
}
function commit() { registerDailyCare(); pet.lastTick = Date.now(); save() }

// Al entrar: base local (instantánea) → si el servidor es más reciente (otro
// dispositivo) lo adopta → decae desde su lastTick → persiste la fusión.
onMounted(async () => {
  loadLocalOnly()
  const localTick = pet.lastTick || 0
  const server = await fetchPet()
  if (server && (server.lastTick || 0) > localTick) Object.assign(pet, server)
  applyDecay()
  pet.lastTick = Date.now()
  ready.value = true // recién ahora los valores son finales → se revelan
  save()
  if (pet.sleeping) startSleepLoop() // seguía dormida → reanuda el sueño en vivo
  // Al volver a la pestaña (el móvil pudo pausar el timer del todo), reconcilia
  // el tiempo transcurrido de una vez.
  if (import.meta.client) document.addEventListener('visibilitychange', reconcileOnVisible)
})
function reconcileOnVisible() {
  if (typeof document !== 'undefined' && document.visibilityState === 'visible') { applyDecay(); save() }
}

// ── Estado derivado (la CARA de la mascota) ─────────────────────────
const mood = computed(() => Math.round((pet.energia + pet.pancita + pet.carino + pet.diversion) / 4))
type PetState = 'happy' | 'content' | 'meh' | 'hungry' | 'sleepy' | 'sad'
const state = computed<PetState>(() => {
  const e = pet.energia, p = pet.pancita, c = pet.carino
  if (e < 40) return 'sleepy'
  const min = Math.min(e, p, c)
  if (min < 35) { if (p === min) return 'hungry'; return 'sad' }
  if (pet.diversion < 30) return 'meh' // aburrida
  if (mood.value >= 80) return 'happy'
  if (mood.value >= 55) return 'content'
  return 'meh'
})

// ── Acciones que vienen del mundo (interacciones reales) ────────────
function onFeed(id: string, gain: number) {
  if ((pet.inventory[id] || 0) <= 0) return
  pet.inventory[id]--
  pet.pancita = clamp(pet.pancita + gain)
  commit()
}
function onBuy(id: string, price: number) {
  if (pet.coins < price) return
  pet.coins -= price
  pet.inventory[id] = (pet.inventory[id] || 0) + 1
  commit()
}
function onAffection() {
  pet.carino = clamp(pet.carino + 1)
  commit()
}

// Dormir: el cuarto apaga la luz. La energía sube mientras duerme; al llegar a
// 100 NO se despierta sola: sigue dormida y empiezan a decaer los otros stats
// (dormir de más también pasa factura). Solo se despierta al encender la luz.
let sleepInt: ReturnType<typeof setInterval> | undefined
function startSleepLoop() {
  if (sleepInt) return
  // Decaimiento por tiempo REAL: aunque el navegador congele el timer en segundo
  // plano, cada tick aplica lo transcurrido desde lastTick (no un -1 fijo que
  // perdería las horas de fondo). applyDecay sube la energía y, tras el 100,
  // baja los otros stats, y actualiza lastTick.
  sleepInt = setInterval(() => { applyDecay(); save() }, 6000)
}
function stopSleepLoop() { if (sleepInt) { clearInterval(sleepInt); sleepInt = undefined } }
function onSleep(active: boolean) {
  pet.sleeping = active
  if (active) startSleepLoop()
  else stopSleepLoop()
  commit() // persiste sleeping + pone lastTick = ahora
}

// ── Juegos ────────────────────────────────────────────────────────
// El menú y los mini-juegos viven DENTRO de HibiWorld (panel que sube desde
// abajo, como la tienda) — aquí solo se recibe el premio cuando uno termina.
const lastGameCoins = ref(0)
function onGameReward(coins: number) {
  if (coins > 0) {
    pet.coins += coins
    pet.diversion = clamp(pet.diversion + 10) // jugar la divierte (baja el aburrimiento)
    pet.carino = clamp(pet.carino + 2)
    pet.energia = clamp(pet.energia - 3)
    commit()
  }
  lastGameCoins.value = coins
}

onBeforeUnmount(() => {
  if (sleepInt) clearInterval(sleepInt)
  if (import.meta.client) document.removeEventListener('visibilitychange', reconcileOnVisible)
})
</script>

<template>
  <div class="h-full w-full relative overflow-hidden">
    <!-- ══════════════ SELECTOR (sólo móvil) — paneles 50-50 ══════════════ -->
    <div v-if="!careOpen" class="md:hidden h-full w-full flex flex-col gap-3 px-4 py-4">
      <button type="button" class="flex-1 min-h-0 w-full rounded-[24px] bg-sky-soft relative overflow-hidden flex flex-col items-center justify-center gap-3 px-5 active:scale-[0.985] transition-transform"
        @click="careOpen = true">
        <HibiCloud :size="120" class="absolute -top-5 -right-5 text-white opacity-50 pointer-events-none" aria-hidden="true" />
        <HibiCloud :size="70" :delay="0.6" class="absolute -bottom-3 -left-3 text-white opacity-40 pointer-events-none" aria-hidden="true" />
        <MascotCloud :size="112" class="text-white relative pointer-events-none" />
        <div class="relative text-center">
          <p class="text-[19px] font-extrabold text-sky-deep">{{ t('hibi.chooser.careTitle') }}</p>
          <p class="text-[12.5px] text-sky-deep/80 mt-0.5">{{ t('hibi.chooser.careSubtitle') }}</p>
        </div>
        <span class="relative inline-flex items-center gap-1.5 px-3 h-8 rounded-full bg-card text-sky-deep text-[12px] font-bold">
          <Flame class="size-[14px]" :stroke-width="2.2" /> {{ t('hibi.streak', { n: pet.streak, unit: t(pet.streak === 1 ? 'hibi.streakUnit.one' : 'hibi.streakUnit.other') }) }}
        </span>
      </button>

      <button type="button" class="flex-1 min-h-0 w-full rounded-[24px] bg-pink-soft relative overflow-hidden flex flex-col items-center justify-center gap-3 px-5 active:scale-[0.985] transition-transform"
        @click="router.push('/chat')">
        <HibiCloud :size="120" class="absolute -bottom-5 -left-5 text-white opacity-45 pointer-events-none" aria-hidden="true" />
        <span class="relative grid place-items-center size-[88px] rounded-full bg-card text-pink-deep">
          <MessageCircle class="size-10" :stroke-width="1.7" />
        </span>
        <div class="relative text-center">
          <p class="text-[19px] font-extrabold text-pink-deep">{{ t('hibi.chooser.chatTitle') }}</p>
          <p class="text-[12.5px] text-pink-deep/80 mt-0.5">{{ t('hibi.chooser.chatSubtitle') }}</p>
        </div>
      </button>
    </div>

    <!-- ══════════════ MUNDO VIVO (desktop siempre; móvil al entrar) ══════════════ -->
    <div :class="careOpen ? 'block' : 'hidden md:block'" class="h-full w-full md:p-5">
      <div class="h-full w-full overflow-hidden md:rounded-[24px] bg-base">
        <HibiWorld
          v-if="ready"
          :energia="pet.energia" :pancita="pet.pancita" :carino="pet.carino" :diversion="pet.diversion"
          :coins="pet.coins" :streak="pet.streak" :state="state" :room="pet.room" :inventory="pet.inventory"
          :sleeping="pet.sleeping"
          :last-game-coins="lastGameCoins"
          @feed="onFeed" @buy="onBuy" @affection="onAffection" @sleep="onSleep"
          @game-reward="onGameReward" @update:room="onRoom" @chat="router.push('/chat')" />
        <!-- Mientras reconcilia (cache+servidor+decay): nube pulsante, sin números aún -->
        <div v-else class="h-full w-full grid place-items-center">
          <HibiCloud :size="96" class="text-sky-soft opacity-60 animate-pulse" aria-hidden="true" />
        </div>
      </div>
    </div>
  </div>
</template>
