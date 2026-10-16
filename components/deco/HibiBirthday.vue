<script setup lang="ts">
import { Gift, Download, Check } from '@lucide/vue'
import type { Cupon } from '~/composables/useCupones'
// Vista de CUMPLEAÑOS. Sale el 12 de octubre y el día siguiente, una vez al
// día, y SOLO a ella. Trae los dos cupones de regalo para descargar.
// Estética Hibi: plano, muy redondeado, sin bordes ni sombras.
const NOMBRE = 'Mharyi'
const DIA = 12
const HASTA = 13
const MES = 9 // 9 = octubre

const visible = ref(false)
const closing = ref(false)
const { descargar } = useCupones()
const { esDestinataria } = useSaludoPersonal()

const CUPONES: Cupon[] = [
  {
    archivo: 'cupon-escultura-arcilla.png',
    etiqueta: 'Cupón de regalo',
    titulo: 'Una escultura en arcilla',
    subtitulo: 'Hecha a mano, la que tú quieras. Tú eliges qué, yo la hago.',
    detalle: ['Hasta 20 cm de alto por 10 cm de ancho.', 'Sin fecha de vencimiento. Se canjea diciendo qué quieres.'],
    para: NOMBRE,
    acento: 'sky',
  },
  {
    archivo: 'cupon-escultura-40.png',
    etiqueta: 'Cupón de regalo',
    titulo: '40% en otra escultura',
    subtitulo: 'Cuarenta por ciento de descuento en la escultura en arcilla que elijas.',
    detalle: ['Un solo uso, aparte del cupón de la escultura de regalo.', 'Sin fecha de vencimiento.'],
    para: NOMBRE,
    acento: 'pink',
  },
]

// Estado de cada botón: idle | generando | listo
const estado = ref<Record<string, 'idle' | 'generando' | 'listo'>>({})
async function bajar(c: Cupon) {
  if (estado.value[c.archivo] === 'generando') return
  estado.value = { ...estado.value, [c.archivo]: 'generando' }
  try {
    await descargar(c)
    estado.value = { ...estado.value, [c.archivo]: 'listo' }
  } catch {
    estado.value = { ...estado.value, [c.archivo]: 'idle' }
  }
}

// El cumpleaños y el día siguiente, para que no se lo pierda si ese día no entra.
function esSemanaDeCumple(d: Date): boolean {
  return d.getMonth() === MES && d.getDate() >= DIA && d.getDate() <= HASTA
}
// Clave con la fecha LOCAL (no toISOString, que usa UTC y puede correr el día).
function claveDe(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `hibi.cumple.${d.getFullYear()}-${mm}-${dd}`
}

// Confeti y globos: se generan en el cliente (Math.random en SSR rompería la
// hidratación).
interface Papel { id: number; left: number; delay: number; dur: number; w: number; h: number; tono: string; giro: number; redondo: boolean }
interface Globo { id: number; left: number; delay: number; dur: number; size: number; tono: string }
const papeles = ref<Papel[]>([])
const globos = ref<Globo[]>([])
const TONOS = ['var(--color-sky)', 'var(--color-sky-deep)', 'var(--color-pink)', 'var(--color-pink-deep)', 'var(--color-mint)', 'var(--color-lavender)', 'var(--color-yellow)']

function sembrar() {
  papeles.value = Array.from({ length: 26 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 7,
    dur: 7 + Math.random() * 6,
    w: 7 + Math.random() * 7,
    h: 10 + Math.random() * 9,
    tono: TONOS[i % TONOS.length]!,
    giro: Math.random() * 360,
    redondo: i % 3 === 0,
  }))
  globos.value = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    left: 6 + Math.random() * 88,
    delay: 0.8 + Math.random() * 7,
    dur: 9 + Math.random() * 5,
    size: 26 + Math.random() * 20,
    tono: TONOS[(i * 2) % TONOS.length]!,
  }))
}

function cerrar() {
  if (closing.value) return
  closing.value = true
  setTimeout(() => { visible.value = false; closing.value = false }, 460)
}
function onKey(e: KeyboardEvent) {
  if (visible.value && e.key === 'Escape') { e.preventDefault(); cerrar() }
}

onMounted(async () => {
  const hoy = new Date()
  // ?cumple=1 fuerza la vista, para poder verla cuando quieras.
  const forzar = new URLSearchParams(location.search).get('cumple') === '1'
  if (!forzar) {
    if (!esSemanaDeCumple(hoy)) return
    if (!(await esDestinataria())) return
    const clave = claveDe(hoy)
    try { if (localStorage.getItem(clave)) return } catch { /* sin storage: se muestra igual */ }
    try { localStorage.setItem(clave, '1') } catch { /* ignorar */ }
  }
  sembrar()
  visible.value = true
  document.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => document.removeEventListener('keydown', onKey))
</script>

<template>
  <Transition name="cumple">
    <section
      v-if="visible"
      class="fixed inset-0 z-[300] bg-base overflow-x-hidden overflow-y-auto flex flex-col items-center text-center px-5 py-6"
      :class="{ 'cumple-out': closing }"
      role="dialog"
      aria-label="Feliz cumpleaños"
    >
      <!-- Nubes suaves de fondo -->
      <HibiCloud :size="220" float :duration="14" class="absolute -top-10 -left-16 text-sky-soft opacity-50 pointer-events-none" />
      <HibiCloud :size="170" float :duration="17" :delay="1.4" class="absolute top-[22%] -right-14 text-sky-soft opacity-40 pointer-events-none" />

      <!-- Confeti cayendo -->
      <span
        v-for="p in papeles" :key="'p' + p.id"
        class="cumple-papel pointer-events-none"
        :class="{ 'rounded-full': p.redondo, 'rounded-[2px]': !p.redondo }"
        :style="{
          left: p.left + '%',
          width: p.w + 'px',
          height: p.h + 'px',
          background: p.tono,
          animationDelay: p.delay + 's',
          animationDuration: p.dur + 's',
          ['--giro' as string]: p.giro + 'deg',
        }"
      />

      <!-- Globos subiendo -->
      <span
        v-for="g in globos" :key="'g' + g.id"
        class="cumple-globo pointer-events-none"
        :style="{
          left: g.left + '%',
          width: g.size + 'px',
          height: g.size * 1.18 + 'px',
          background: g.tono,
          animationDelay: g.delay + 's',
          animationDuration: g.dur + 's',
        }"
      />

      <div class="relative z-10 my-auto flex flex-col items-center gap-1 w-full max-w-[560px]">
        <!-- Nube de Hibi con gorro de fiesta -->
        <div class="cumple-nube relative">
          <HibiSparkle :size="22" twinkle class="absolute -top-2 -left-6 text-pink-deep" />
          <HibiSparkle :size="16" twinkle :delay="0.9" class="absolute top-5 -right-7 text-sky-deep" />
          <svg class="w-[clamp(130px,min(36vw,28vh),230px)] h-auto text-white" viewBox="0 0 140 118" fill="none" aria-hidden="true">
            <!-- Gorro -->
            <path d="M52 30 L66 -2 L80 30 Z" fill="var(--color-pink)" />
            <circle cx="66" cy="-2" r="6" fill="var(--color-yellow)" />
            <circle cx="61" cy="18" r="3.1" fill="var(--color-sky-soft)" />
            <circle cx="71" cy="24" r="2.6" fill="var(--color-sky-soft)" />
            <!-- Cuerpo -->
            <g fill="currentColor" transform="translate(0 23)">
              <circle cx="30" cy="55" r="30" /><circle cx="55" cy="30" r="30" /><circle cx="60" cy="65" r="30" />
              <circle cx="95" cy="40" r="25" /><circle cx="115" cy="60" r="25" /><circle cx="90" cy="70" r="20" />
            </g>
            <!-- Carita feliz -->
            <g transform="translate(0 23)">
              <ellipse cx="51" cy="60" rx="4.6" ry="3" fill="var(--color-pink)" opacity="0.85" />
              <ellipse cx="89" cy="60" rx="4.6" ry="3" fill="var(--color-pink)" opacity="0.85" />
              <path d="M55 54 Q60 48 65 54" stroke="var(--color-sky-deep)" stroke-width="2.4" stroke-linecap="round" fill="none" />
              <path d="M75 54 Q80 48 85 54" stroke="var(--color-sky-deep)" stroke-width="2.4" stroke-linecap="round" fill="none" />
              <path d="M63 58 Q70 66 77 58 Z" fill="var(--color-sky-deep)" />
            </g>
          </svg>
        </div>

        <p class="cumple-linea text-[clamp(15px,3.6vw,21px)] font-bold text-fg-muted" style="animation-delay:0.26s">
          Feliz
        </p>
        <h1 class="cumple-linea text-[clamp(26px,min(8vw,7vh),58px)] font-extrabold text-fg leading-[1.05]" style="animation-delay:0.38s">
          cumpleaños
        </h1>

        <div class="cumple-nombre relative mt-1" style="animation-delay:0.6s">
          <HibiSparkle :size="20" twinkle :delay="0.4" class="absolute -top-2 -left-7 text-sky-deep" />
          <HibiSparkle :size="15" twinkle :delay="1.2" class="absolute -bottom-1 -right-6 text-pink-deep" />
          <p class="text-[clamp(34px,min(12vw,11vh),88px)] font-extrabold text-pink-deep leading-none tracking-tight">{{ NOMBRE }}</p>
        </div>

        <p class="cumple-linea text-[clamp(13.5px,3.3vw,17px)] text-fg-muted max-w-[420px] mt-3 leading-snug" style="animation-delay:0.8s">
          Que te lo pases lindo hoy. Te dejé dos regalos aquí abajo.
        </p>

        <!-- Cupones -->
        <ul class="cumple-linea w-full flex flex-col gap-2.5 mt-6" style="animation-delay:0.98s">
          <li v-for="c in CUPONES" :key="c.archivo">
            <button
              type="button"
              class="w-full flex items-center gap-3 text-left p-3.5 rounded-[18px] bg-card active:opacity-90 transition-[opacity] outline-none focus-visible:ring-2 focus-visible:ring-sky-deep"
              @click="bajar(c)"
            >
              <span
                class="shrink-0 grid place-items-center size-11 rounded-[14px]"
                :class="c.acento === 'pink' ? 'bg-pink-soft text-pink-deep' : 'bg-sky-soft text-sky-deep'"
              >
                <Gift class="size-[21px]" :stroke-width="1.9" />
              </span>
              <span class="flex-1 min-w-0">
                <span class="block text-[15px] font-extrabold text-fg truncate">{{ c.titulo }}</span>
                <span class="block text-[12.5px] text-fg-muted truncate">
                  {{ estado[c.archivo] === 'generando' ? 'Preparando la imagen…' : estado[c.archivo] === 'listo' ? 'Descargado. Toca otra vez si lo quieres de nuevo.' : 'Toca para descargar el cupón' }}
                </span>
              </span>
              <span
                class="shrink-0 grid place-items-center size-9 rounded-full"
                :class="c.acento === 'pink' ? 'bg-pink-soft text-pink-deep' : 'bg-sky-soft text-sky-deep'"
              >
                <Check v-if="estado[c.archivo] === 'listo'" class="size-[17px]" :stroke-width="2.4" />
                <Download v-else class="size-[17px]" :stroke-width="2.2" />
              </span>
            </button>
          </li>
        </ul>

        <button
          type="button"
          class="cumple-linea mt-6 h-12 px-7 rounded-full bg-pink-deep text-white text-[15px] font-extrabold outline-none focus-visible:ring-2 focus-visible:ring-pink-deep active:opacity-90 transition-[opacity]"
          style="animation-delay:1.18s"
          @click="cerrar"
        >
          Entrar a Hibi
        </button>
      </div>
    </section>
  </Transition>
</template>

<style scoped>
.cumple-enter-active { transition: opacity 0.45s ease-out; }
.cumple-enter-from { opacity: 0; }
.cumple-out { animation: cumpleOut 0.46s ease-in forwards; }
@keyframes cumpleOut { to { opacity: 0; transform: scale(1.03); } }

/* Nube: baja con rebote y luego flota */
.cumple-nube {
  animation: cumpleCaer 0.9s cubic-bezier(0.34, 1.32, 0.64, 1) both,
             cumpleBob 4.4s ease-in-out 0.9s infinite;
}
@keyframes cumpleCaer {
  from { opacity: 0; transform: translateY(-70px) scale(0.86); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes cumpleBob {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-9px); }
}

.cumple-linea { animation: cumpleSubir 0.62s var(--ease-soft, ease-out) both; }
@keyframes cumpleSubir {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

.cumple-nombre {
  animation: cumplePop 0.7s cubic-bezier(0.34, 1.5, 0.64, 1) both,
             cumpleLatir 3.4s ease-in-out 1.4s infinite;
}
@keyframes cumplePop {
  from { opacity: 0; transform: scale(0.6); }
  to   { opacity: 1; transform: scale(1); }
}
@keyframes cumpleLatir {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.04); }
}

/* Confeti: cae girando. Solo transform y opacity, que son las dos que el
   navegador compone sin repintar. */
.cumple-papel {
  position: absolute;
  top: -8%;
  animation-name: cumpleCaerPapel;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  opacity: 0.85;
}
@keyframes cumpleCaerPapel {
  0%   { transform: translateY(0) translateX(0) rotate(var(--giro)); opacity: 0; }
  10%  { opacity: 0.85; }
  50%  { transform: translateY(52vh) translateX(30px) rotate(calc(var(--giro) + 220deg)); }
  90%  { opacity: 0.7; }
  100% { transform: translateY(112vh) translateX(-20px) rotate(calc(var(--giro) + 440deg)); opacity: 0; }
}

/* Globos: suben desde abajo meciéndose */
.cumple-globo {
  position: absolute;
  bottom: -12%;
  border-radius: 50% 50% 48% 48% / 46% 46% 54% 54%;
  animation-name: cumpleSubirGlobo;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
}
@keyframes cumpleSubirGlobo {
  0%   { transform: translateY(0) translateX(0) scale(0.8); opacity: 0; }
  14%  { opacity: 0.8; }
  50%  { transform: translateY(-52vh) translateX(18px) scale(1); }
  72%  { opacity: 0.55; }
  100% { transform: translateY(-115vh) translateX(-14px) scale(1.05); opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .cumple-papel, .cumple-globo, .cumple-nube, .cumple-nombre { animation: none; }
}
</style>
