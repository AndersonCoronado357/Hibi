<script setup lang="ts">
// Módulo Hibi — tu mascota nube, ahora un MUNDO vivo (estilo Pou).
//  · Móvil: primero un selector 50-50 — "Cuida a tu Hibi" / "Habla con Hibi".
//  · La escena viva (HibiWorld) trae sus propios cuartos e interacciones reales;
//    aquí sólo vive el estado persistido, la decadencia, monedas y el mini-juego.
import { Flame, MessageCircle, Coins } from '@lucide/vue'

useHead({ title: 'Hibi — Tu mascota' })

const router = useRouter()
const careOpen = ref(false) // móvil: false = selector, true = mundo. Desktop lo ignora.

// ── Estado de la mascota (persistido) ───────────────────────────────
interface Pet {
  energia: number; pancita: number; carino: number; diversion: number
  streak: number; lastCareDay: string; lastTick: number; coins: number; room: string
  inventory: Record<string, number>
}
const STORE = 'hibi.pet.v1'
const STARTER_INV = { galleta: 3, manzana: 2, sandwich: 1 }
const pet = reactive<Pet>({ energia: 80, pancita: 82, carino: 86, diversion: 80, streak: 1, lastCareDay: '', lastTick: 0, coins: 40, room: 'casa', inventory: { ...STARTER_INV } })
const { fetchPet, savePet } = usePet()
function onRoom(k: string) { pet.room = k; save() }

const dayKey = (d = new Date()) => d.toISOString().slice(0, 10)
const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)))

// Lee la caché local (sin decadencia ni reset todavía).
function loadLocalOnly() {
  if (!import.meta.client) return
  const raw = localStorage.getItem(STORE)
  if (raw) { try { Object.assign(pet, JSON.parse(raw)) } catch { /* ignore */ } }
  if (typeof pet.diversion !== 'number') pet.diversion = 70
  if (typeof pet.room !== 'string') pet.room = 'casa'
  if (!pet.inventory || typeof pet.inventory !== 'object') pet.inventory = { ...STARTER_INV }
}
// Aplica decadencia por horas ausente + corta la racha si faltó un día.
function applyDecay() {
  if (pet.lastTick) {
    const hrs = Math.floor((Date.now() - pet.lastTick) / 3_600_000)
    if (hrs > 0) {
      pet.pancita = clamp(pet.pancita - hrs * 4)
      pet.energia = clamp(pet.energia - hrs * 3)
      pet.carino = clamp(pet.carino - hrs * 2)
      pet.diversion = clamp(pet.diversion - hrs * 3) // se va aburriendo
    }
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
  save()
})

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

// Dormir: el cuarto enciende/apaga la luz; aquí recargamos la energía sola.
let sleepInt: ReturnType<typeof setInterval> | undefined
function stopSleep() { if (sleepInt) { clearInterval(sleepInt); sleepInt = undefined } commit() }
function onSleep(active: boolean) {
  if (active) {
    if (sleepInt) clearInterval(sleepInt)
    let t = 0
    // Energía sube despacio: ~+1 cada 6 s → llenar de 0 a 100 tarda ~10 min.
    sleepInt = setInterval(() => {
      pet.energia = clamp(pet.energia + 1)
      if (++t % 5 === 0) { // cada ~30 s baja un poco lo demás
        pet.pancita = clamp(pet.pancita - 1)
        pet.carino = clamp(pet.carino - 1)
        pet.diversion = clamp(pet.diversion - 1)
      }
      save()
      if (pet.energia >= 100) stopSleep()
    }, 6000)
  } else {
    stopSleep()
  }
}

// ── Mini-juego (esquivar) ───────────────────────────────────────────
const gameOpen = ref(false)
const lastGameCoins = ref(0)
function onPlayGame() { gameOpen.value = true }
function onGameEnd(coins: number) {
  gameOpen.value = false // vuelve a la vista de Juegos (sin modal)
  pet.coins += coins
  pet.diversion = clamp(pet.diversion + 10) // jugar la divierte (baja el aburrimiento)
  pet.carino = clamp(pet.carino + 2)
  pet.energia = clamp(pet.energia - 3)
  commit()
  lastGameCoins.value = coins
}

onBeforeUnmount(() => { if (sleepInt) clearInterval(sleepInt) })
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
          <p class="text-[19px] font-extrabold text-sky-deep">Cuida a tu Hibi</p>
          <p class="text-[12.5px] text-sky-deep/80 mt-0.5">Aliméntala, juega y mímala</p>
        </div>
        <span class="relative inline-flex items-center gap-1.5 px-3 h-8 rounded-full bg-card text-sky-deep text-[12px] font-bold">
          <Flame class="size-[14px]" :stroke-width="2.2" /> Racha {{ pet.streak }} {{ pet.streak === 1 ? 'día' : 'días' }}
        </span>
      </button>

      <button type="button" class="flex-1 min-h-0 w-full rounded-[24px] bg-pink-soft relative overflow-hidden flex flex-col items-center justify-center gap-3 px-5 active:scale-[0.985] transition-transform"
        @click="router.push('/chat')">
        <HibiCloud :size="120" class="absolute -bottom-5 -left-5 text-white opacity-45 pointer-events-none" aria-hidden="true" />
        <span class="relative grid place-items-center size-[88px] rounded-full bg-card text-pink-deep">
          <MessageCircle class="size-10" :stroke-width="1.7" />
        </span>
        <div class="relative text-center">
          <p class="text-[19px] font-extrabold text-pink-deep">Habla con Hibi</p>
          <p class="text-[12.5px] text-pink-deep/80 mt-0.5">Pregunta, anota o pide un resumen</p>
        </div>
      </button>
    </div>

    <!-- ══════════════ MUNDO VIVO (desktop siempre; móvil al entrar) ══════════════ -->
    <div :class="careOpen ? 'block' : 'hidden md:block'" class="h-full w-full md:p-5">
      <div class="h-full w-full overflow-hidden md:rounded-[24px] bg-base">
        <HibiWorld
          :energia="pet.energia" :pancita="pet.pancita" :carino="pet.carino" :diversion="pet.diversion"
          :coins="pet.coins" :streak="pet.streak" :state="state" :room="pet.room" :inventory="pet.inventory"
          :last-game-coins="lastGameCoins"
          @feed="onFeed" @buy="onBuy" @affection="onAffection" @sleep="onSleep"
          @play-game="onPlayGame" @update:room="onRoom" @chat="router.push('/chat')" />
      </div>
    </div>

    <!-- ═══════════ Mini-juego (sin modal: al perder vuelve a Juegos) ═══════════ -->
    <ClientOnly>
      <Teleport to="body">
        <Transition name="sheet-up">
          <div v-if="gameOpen" class="fixed inset-0 z-[60] bg-base p-3" style="padding-top: max(0.75rem, env(safe-area-inset-top)); padding-bottom: max(0.75rem, env(safe-area-inset-bottom))">
            <HibiGame @end="onGameEnd" @exit="gameOpen = false" />
          </div>
        </Transition>
      </Teleport>
    </ClientOnly>
  </div>
</template>

<style scoped>
.sheet-up-enter-active, .sheet-up-leave-active { transition: transform 0.32s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.25s ease; }
.sheet-up-enter-from, .sheet-up-leave-to { transform: translateY(100%); opacity: 0.6; }
@media (prefers-reduced-motion: reduce) {
  .sheet-up-enter-active, .sheet-up-leave-active { transition: opacity 0.2s ease; }
  .sheet-up-enter-from, .sheet-up-leave-to { transform: none; }
}
</style>
