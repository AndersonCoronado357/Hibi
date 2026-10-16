<script setup lang="ts">
// Vista especial del DÍA DE AMOR Y AMISTAD (tercer sábado de septiembre en
// Colombia). Aparece a pantalla completa la primera vez que se entra ese día
// y se cierra con el botón o con Escape. Estética Hibi: plano, muy redondeado,
// sin bordes ni sombras; rosas azules dibujadas con círculos (nada realista).
const NOMBRE = 'Mharyi'

const { esDestinataria } = useSaludoPersonal()

const visible = ref(false)
const closing = ref(false)

// Fin de semana del día de amor y amistad: el tercer sábado de septiembre
// (mes 8) y el domingo siguiente. Dos días, porque el sábado se puede pasar.
function esDiaAmorYAmistad(d: Date): boolean {
  if (d.getMonth() !== 8) return false
  const primerDia = new Date(d.getFullYear(), 8, 1).getDay() // 0=dom … 6=sáb
  const primerSabado = 1 + ((6 - primerDia + 7) % 7)
  const sabado = primerSabado + 14
  return d.getDate() === sabado || d.getDate() === sabado + 1
}
// Clave con la fecha LOCAL (no toISOString, que usa UTC y puede correr el día).
function claveDe(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `hibi.amorYAmistad.${d.getFullYear()}-${mm}-${dd}`
}

// Pétalos que caen y corazones que suben: se generan en el cliente (Math.random
// en SSR provocaría desajuste de hidratación).
interface Petalo { id: number; left: number; delay: number; dur: number; size: number; tono: string; giro: number }
interface Corazon { id: number; left: number; delay: number; dur: number; size: number; tono: string }
const petalos = ref<Petalo[]>([])
const corazones = ref<Corazon[]>([])
const TONOS_PETALO = ['var(--color-sky)', 'var(--color-sky-deep)', 'var(--color-sky-soft)', 'var(--color-lavender)']
const TONOS_CORAZON = ['var(--color-pink)', 'var(--color-pink-deep)', 'var(--color-sky)']

function sembrarDecoracion() {
  petalos.value = Array.from({ length: 16 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 9,
    dur: 9 + Math.random() * 7,
    size: 10 + Math.random() * 12,
    tono: TONOS_PETALO[i % TONOS_PETALO.length]!,
    giro: Math.random() * 360,
  }))
  corazones.value = Array.from({ length: 7 }, (_, i) => ({
    id: i,
    left: 12 + Math.random() * 76,
    delay: 1.2 + Math.random() * 6,
    dur: 5 + Math.random() * 3.5,
    size: 14 + Math.random() * 12,
    tono: TONOS_CORAZON[i % TONOS_CORAZON.length]!,
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

// Al cambiar de tamaño hay que recolocar: los huecos dependen de los px reales.
let temporizadorResize: ReturnType<typeof setTimeout> | undefined
function onResize() {
  clearTimeout(temporizadorResize)
  temporizadorResize = setTimeout(() => { if (visible.value) recalcularJardin() }, 180)
}

onMounted(async () => {
  const hoy = new Date()
  // ?amor=1 fuerza la vista (para verla cuando quieras sin borrar el storage).
  const forzar = new URLSearchParams(location.search).get('amor') === '1'
  if (!forzar) {
    if (!esDiaAmorYAmistad(hoy)) return
    if (!(await esDestinataria())) return
    const clave = claveDe(hoy)
    try { if (localStorage.getItem(clave)) return } catch { /* sin storage: se muestra igual */ }
    try { localStorage.setItem(clave, '1') } catch { /* ignorar */ }
  }
  sembrarDecoracion()
  visible.value = true
  document.addEventListener('keydown', onKey)
  window.addEventListener('resize', onResize)
  // Se coloca cuando ya hay algo medible: necesitamos el tamaño de la vista y
  // el rectángulo del texto para saber dónde NO pueden ir las flores.
  await nextTick()
  recalcularJardin()
})
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKey)
  window.removeEventListener('resize', onResize)
  clearTimeout(temporizadorResize)
})

// ── Rosas repartidas alrededor del contenido ──────────────────────────────
// Tres profundidades del mismo azul. Cada paleta va del corazón (el tono más
// oscuro) a la corona exterior (el más claro); las "lejanas" usan la paleta
// lavada para que se lean como fondo y no compitan con el texto.
const PALETAS = {
  cerca: {
    tonos: [
      'color-mix(in oklab, var(--color-sky-deep) 78%, #1b4c6e)',
      'var(--color-sky-deep)',
      'color-mix(in oklab, var(--color-sky-deep) 42%, var(--color-sky))',
      'var(--color-sky)',
    ],
    verde: 'var(--color-mint)',
  },
  media: {
    tonos: [
      'var(--color-sky-deep)',
      'color-mix(in oklab, var(--color-sky-deep) 55%, var(--color-sky))',
      'var(--color-sky)',
      'color-mix(in oklab, var(--color-sky) 55%, var(--color-sky-soft))',
    ],
    verde: 'color-mix(in oklab, var(--color-mint) 78%, #fff)',
  },
  // Las lejanas se mezclan con el FONDO de la página (var(--bg-base)), no con
  // blanco: así se desvanecen igual en tema claro y en tema oscuro.
  lejos: {
    tonos: [
      'color-mix(in oklab, var(--color-sky) 72%, var(--bg-base))',
      'color-mix(in oklab, var(--color-sky) 54%, var(--bg-base))',
      'color-mix(in oklab, var(--color-sky-soft) 50%, var(--bg-base))',
      'color-mix(in oklab, var(--color-sky-soft) 36%, var(--bg-base))',
    ],
    verde: 'color-mix(in oklab, var(--color-mint) 42%, var(--bg-base))',
  },
} as const

// Tamaños en PÍXELES: [A vw, B vh, mínimo, máximo] → el mismo min(Avw,Bvh) con
// tope que haría clamp() en CSS, pero calculado en JS. Hace falta saber el
// tamaño real de cada rosa para poder comprobar si choca con otra.
const TAMS = {
  xl: [26, 21, 66, 168],
  l:  [23, 18.5, 58, 146],
  m:  [18, 15, 46, 118],
  s:  [14, 11.5, 36, 92],
  xs: [11, 9, 28, 68],
} as const
type ClaveTam = keyof typeof TAMS

function anchoPx(k: ClaveTam, W: number, H: number): number {
  const [a, b, lo, hi] = TAMS[k]
  return Math.round(Math.max(lo, Math.min(hi, Math.min((a * W) / 100, (b * H) / 100))))
}

interface Rosa {
  /** Esquina superior izquierda, en px dentro de la capa de rosas. */
  x: number
  y: number
  /** Ancho en px. La cabeza de la flor ocupa el cuadrado w × w de arriba. */
  w: number
  paleta: keyof typeof PALETAS
  /** Solo las del suelo llevan tallo; las de alrededor son cabezas sueltas */
  tallo: boolean
  delay: number
  dur: number
}

// Generador determinista (mulberry32): el jardín siempre sale igual, así que
// no hay riesgo de desajuste entre lo que pinta el servidor y el cliente.
function prng(semilla: number) {
  let a = semilla
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Franja del suelo: `k` es a qué altura queda el centro de la flor, medida
 *  en veces su propio ancho POR ENCIMA del borde de abajo. Las de delante
 *  (k pequeño) son grandes y se salen; las de atrás (k grande) son pequeñas. */
const SUELO = [
  { paleta: 'cerca' as const, tams: ['l', 'xl'] as ClaveTam[], k: [0.02, 0.5], max: 11, dur: [6.5, 9] },
  { paleta: 'media' as const, tams: ['s', 'm'] as ClaveTam[],  k: [0.6, 1.15], max: 13, dur: [8, 11] },
  { paleta: 'lejos' as const, tams: ['xs', 's'] as ClaveTam[], k: [1.25, 2.1], max: 15, dur: [10, 13.5] },
]

/** Marco: el resto de la vista, de abajo hacia arriba. `y` en fracción del
 *  alto. Lo que caiga sobre el texto se descarta. */
const MARCO = [
  { paleta: 'media' as const, tams: ['s', 'm'] as ClaveTam[],  y: [0.55, 0.88], max: 12, dur: [8, 11.5] },
  { paleta: 'lejos' as const, tams: ['xs', 's'] as ClaveTam[], y: [0.26, 0.62], max: 14, dur: [9, 12.5] },
  { paleta: 'lejos' as const, tams: ['xs', 's'] as ClaveTam[], y: [-0.03, 0.3], max: 14, dur: [9.5, 13] },
]

/** Separación mínima entre dos flores, en px. Nunca se tocan. */
const HUECO = 8

/**
 * Coloca el jardín midiendo en píxeles de verdad.
 *
 * Con porcentajes de CSS era imposible evitar solapes: el ancho de cada rosa
 * sale de un clamp() que depende de la pantalla, así que una separación en %
 * que funciona en un monitor amontona las flores en un celular. Aquí se
 * calcula el ancho real de cada una, se lanza al azar dentro de su franja y se
 * RECHAZA si toca a otra o si cae sobre el bloque del texto. Si no encuentra
 * hueco, esa flor simplemente no se pone: mejor menos flores que apiladas.
 */
function armarJardin(W: number, H: number, seguro: { x0: number; y0: number; x1: number; y1: number } | null): Rosa[] {
  const rnd = prng(19092026)
  const entre = (a: number, b: number) => a + rnd() * (b - a)
  const elige = <X,>(xs: readonly X[]): X => xs[Math.floor(rnd() * xs.length)]!

  const puestas: { cx: number; cy: number; r: number }[] = []
  const j: Rosa[] = []

  // (cx, cy) es el centro de la CABEZA, que es lo que se ve; el tallo es fino
  // y puede pasar por detrás de otra flor sin que se note.
  function libre(cx: number, cy: number, r: number): boolean {
    if (seguro && cx + r > seguro.x0 && cx - r < seguro.x1 && cy + r > seguro.y0 && cy - r < seguro.y1) return false
    for (const p of puestas) {
      if (Math.hypot(p.cx - cx, p.cy - cy) < p.r + r + HUECO) return false
    }
    return true
  }
  function pon(cx: number, cy: number, w: number, paleta: Rosa['paleta'], tallo: boolean, dur: number) {
    puestas.push({ cx, cy, r: w / 2 })
    j.push({
      x: Math.round(cx - w / 2),
      y: Math.round(cy - w / 2),
      w,
      paleta,
      tallo,
      delay: +(0.45 + (j.length % 14) * 0.07).toFixed(2),
      dur,
    })
  }

  // Primero las de delante (las grandes mandan), después se rellena con las
  // pequeñas por los huecos que vayan quedando.
  for (const f of SUELO) {
    let puestasAqui = 0
    for (let i = 0; i < f.max * 26 && puestasAqui < f.max; i++) {
      const w = anchoPx(elige(f.tams), W, H)
      const cx = entre(-w * 0.3, W + w * 0.3)
      const cy = H - entre(f.k[0]!, f.k[1]!) * w
      if (!libre(cx, cy, w / 2)) continue
      pon(cx, cy, w, f.paleta, true, +entre(f.dur[0]!, f.dur[1]!).toFixed(1))
      puestasAqui++
    }
  }

  for (const f of MARCO) {
    let puestasAqui = 0
    for (let i = 0; i < f.max * 30 && puestasAqui < f.max; i++) {
      const w = anchoPx(elige(f.tams), W, H)
      const cx = entre(-w * 0.3, W + w * 0.3)
      const cy = entre(f.y[0]!, f.y[1]!) * H
      if (!libre(cx, cy, w / 2)) continue
      pon(cx, cy, w, f.paleta, false, +entre(f.dur[0]!, f.dur[1]!).toFixed(1))
      puestasAqui++
    }
  }

  return j
}

const capaRosas = ref<HTMLElement | null>(null)
const contenido = ref<HTMLElement | null>(null)
const jardin = ref<Rosa[]>([])

function recalcularJardin() {
  const capa = capaRosas.value
  if (!capa) return
  const base = capa.getBoundingClientRect()
  if (base.width < 2 || base.height < 2) return
  // El texto, con un margen: ninguna flor lo pisa.
  const c = contenido.value?.getBoundingClientRect()
  const M = 24
  const seguro = c
    ? { x0: c.left - base.left - M, y0: c.top - base.top - M, x1: c.right - base.left + M, y1: c.bottom - base.top + M }
    : null
  jardin.value = armarJardin(base.width, base.height, seguro)
}
function estiloRosa(r: Rosa): Record<string, string> {
  return {
    left: r.x + 'px',
    top: r.y + 'px',
    width: r.w + 'px',
    animationDelay: r.delay + 's',
    zIndex: String(r.paleta === 'cerca' ? 2 : r.paleta === 'media' ? 1 : 0),
  }
}
</script>

<template>
  <Transition name="loveday">
    <section
      v-if="visible"
      class="fixed inset-0 z-[300] bg-base overflow-x-hidden overflow-y-auto flex flex-col items-center text-center px-5 py-6"
      :class="{ 'loveday-out': closing }"
      role="dialog"
      aria-label="Feliz día de amor y amistad"
    >
      <!-- Nubes suaves de fondo -->
      <HibiCloud :size="230" float :duration="13" class="absolute -top-12 -left-16 text-sky-soft opacity-60 pointer-events-none" />
      <HibiCloud :size="170" float :duration="16" :delay="1.5" class="absolute top-[18%] -right-14 text-sky-soft opacity-50 pointer-events-none" />
      <HibiCloud :size="200" float :duration="15" :delay="0.8" class="absolute -bottom-14 -left-10 text-sky-soft opacity-45 pointer-events-none" />

      <!-- Pétalos azules cayendo -->
      <span
        v-for="p in petalos" :key="'p' + p.id"
        class="loveday-petalo pointer-events-none"
        :style="{
          left: p.left + '%',
          width: p.size + 'px',
          height: p.size * 0.72 + 'px',
          background: p.tono,
          animationDelay: p.delay + 's',
          animationDuration: p.dur + 's',
          ['--giro' as string]: p.giro + 'deg',
        }"
      />

      <!-- Rosas azules repartidas alrededor (detrás del contenido).
           La capa recorta: así las que asoman por los bordes no alargan el
           área desplazable de la vista. -->
      <div ref="capaRosas" class="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          v-for="(r, i) in jardin" :key="'r' + i"
          class="loveday-rosa absolute [&_svg]:w-full [&_svg]:h-auto"
          :style="estiloRosa(r)"
        >
          <HibiRose
            :size="140"
            :stem="r.tallo"
            :sway="r.paleta !== 'lejos'"
            :duration="r.dur"
            :delay="i * 0.37"
            :tones="[...PALETAS[r.paleta].tonos]"
            :green="PALETAS[r.paleta].verde"
          />
        </div>
      </div>

      <!-- Corazones que suben -->
      <HibiHeart
        v-for="c in corazones" :key="'c' + c.id"
        :size="c.size"
        class="loveday-corazon pointer-events-none"
        :style="{ left: c.left + '%', color: c.tono, animationDelay: c.delay + 's', animationDuration: c.dur + 's' }"
      />

      <!-- Contenido -->
      <!-- my-auto (en vez de justify-center en el padre): centra cuando cabe y
           deja desplazar completo cuando la pantalla es muy baja. -->
      <div ref="contenido" class="relative z-10 my-auto flex flex-col items-center gap-1 max-w-[680px]">
        <!-- Nube de Hibi FELIZ -->
        <div class="loveday-nube relative">
          <HibiSparkle :size="22" twinkle class="absolute -top-1 -left-5 text-sky-deep" />
          <HibiSparkle :size="16" twinkle :delay="0.9" class="absolute top-4 -right-6 text-pink-deep" />
          <svg class="w-[clamp(120px,min(34vw,30vh),240px)] h-auto text-white" viewBox="0 0 140 95" fill="none" aria-hidden="true">
            <g fill="currentColor">
              <circle cx="30" cy="55" r="30" /><circle cx="55" cy="30" r="30" /><circle cx="60" cy="65" r="30" />
              <circle cx="95" cy="40" r="25" /><circle cx="115" cy="60" r="25" /><circle cx="90" cy="70" r="20" />
            </g>
            <!-- Carita feliz: ojos en arco, mejillas y sonrisa abierta -->
            <ellipse cx="51" cy="60" rx="4.6" ry="3" fill="var(--color-pink)" opacity="0.85" />
            <ellipse cx="89" cy="60" rx="4.6" ry="3" fill="var(--color-pink)" opacity="0.85" />
            <path d="M55 54 Q60 48 65 54" stroke="var(--color-sky-deep)" stroke-width="2.4" stroke-linecap="round" fill="none" />
            <path d="M75 54 Q80 48 85 54" stroke="var(--color-sky-deep)" stroke-width="2.4" stroke-linecap="round" fill="none" />
            <path d="M63 58 Q70 66 77 58 Z" fill="var(--color-sky-deep)" />
          </svg>
        </div>

        <p class="loveday-linea text-[clamp(15px,3.6vw,21px)] font-bold text-fg-muted" style="animation-delay:0.28s">
          Feliz día de
        </p>
        <h1 class="loveday-linea text-[clamp(24px,min(7.2vw,6.4vh),54px)] font-extrabold text-fg leading-[1.05]" style="animation-delay:0.4s">
          amor y amistad
        </h1>

        <!-- Nombre destacado -->
        <div class="loveday-nombre relative mt-1" style="animation-delay:0.62s">
          <HibiSparkle :size="20" twinkle :delay="0.4" class="absolute -top-2 -left-7 text-pink-deep" />
          <HibiSparkle :size="15" twinkle :delay="1.2" class="absolute -bottom-1 -right-6 text-sky-deep" />
          <p class="text-[clamp(34px,min(12vw,11vh),92px)] font-extrabold text-sky-deep leading-none tracking-tight">{{ NOMBRE }}</p>
        </div>

        <p class="loveday-linea text-[clamp(13.5px,3.3vw,17px)] text-fg-muted max-w-[420px] mt-3 leading-snug" style="animation-delay:0.82s">
          Que tu día venga con cielo despejado y de los buenos.
        </p>

        <button
          type="button"
          class="loveday-linea mt-6 h-12 px-7 rounded-full bg-sky-deep text-white text-[15px] font-extrabold outline-none focus-visible:ring-2 focus-visible:ring-sky-deep active:opacity-90 transition-[opacity]"
          style="animation-delay:1.15s"
          @click="cerrar"
        >
          Entrar a Hibi
        </button>
      </div>
    </section>
  </Transition>
</template>

<style scoped>
/* Entrada y salida de toda la vista */
.loveday-enter-active { transition: opacity 0.45s ease-out; }
.loveday-enter-from { opacity: 0; }
.loveday-out { animation: lovedayOut 0.46s ease-in forwards; }
@keyframes lovedayOut {
  to { opacity: 0; transform: scale(1.03); }
}

/* Nube: baja desde arriba con rebote y luego flota */
.loveday-nube {
  animation: lovedayCaer 0.9s cubic-bezier(0.34, 1.32, 0.64, 1) both,
             lovedayBob 4.4s ease-in-out 0.9s infinite;
}
@keyframes lovedayCaer {
  from { opacity: 0; transform: translateY(-70px) scale(0.86); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes lovedayBob {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-9px); }
}

/* Líneas de texto y botón: aparecen desde abajo, escalonadas */
.loveday-linea { animation: lovedaySubir 0.62s var(--ease-soft, ease-out) both; }
@keyframes lovedaySubir {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Nombre: entra con rebote y late suave */
.loveday-nombre {
  animation: lovedayPop 0.7s cubic-bezier(0.34, 1.5, 0.64, 1) both,
             lovedayLatir 3.4s ease-in-out 1.4s infinite;
}
@keyframes lovedayPop {
  from { opacity: 0; transform: scale(0.6); }
  to   { opacity: 1; transform: scale(1); }
}
@keyframes lovedayLatir {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.035); }
}

/* Rosas: brotan girando un poco */
.loveday-rosa { animation: lovedayBrotar 0.85s cubic-bezier(0.34, 1.45, 0.64, 1) both; transform-origin: center bottom; }
@keyframes lovedayBrotar {
  from { opacity: 0; transform: scale(0.2) rotate(-14deg); }
  to   { opacity: 1; transform: scale(1) rotate(0deg); }
}

/* Pétalos cayendo: bajan girando y se desvanecen al final */
.loveday-petalo {
  position: absolute;
  top: -8%;
  border-radius: 60% 40% 55% 45% / 60% 60% 40% 40%;
  animation-name: lovedayCaerPetalo;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  opacity: 0.75;
}
@keyframes lovedayCaerPetalo {
  0%   { transform: translateY(0) translateX(0) rotate(var(--giro)); opacity: 0; }
  10%  { opacity: 0.75; }
  50%  { transform: translateY(52vh) translateX(26px) rotate(calc(var(--giro) + 180deg)); }
  90%  { opacity: 0.6; }
  100% { transform: translateY(112vh) translateX(-18px) rotate(calc(var(--giro) + 360deg)); opacity: 0; }
}

/* Corazones que suben desde abajo */
.loveday-corazon {
  position: absolute;
  bottom: -6%;
  animation-name: lovedaySubirCorazon;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
}
@keyframes lovedaySubirCorazon {
  0%   { transform: translateY(0) scale(0.7); opacity: 0; }
  15%  { opacity: 0.85; }
  70%  { opacity: 0.6; }
  100% { transform: translateY(-88vh) scale(1.05); opacity: 0; }
}
</style>
