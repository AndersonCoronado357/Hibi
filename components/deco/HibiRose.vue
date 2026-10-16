<script setup lang="ts">
// Rosa PLANA estilo Hibi (nada realista), vista de frente y en espiral:
// remolino en el corazón + tres coronas de pétalos anchos y redondeados que se
// solapan. Cada corona lleva un tono distinto del mismo azul: el centro el más
// oscuro y va aclarando hacia fuera. Colores macizos, sin degradados, sin
// desenfoque y sin contornos (como el resto de la ilustración de Hibi).
const props = withDefaults(
  defineProps<{
    size?: number
    /** Tallo verde con dos hojas dentadas y un par de espinas */
    stem?: boolean
    /** Se mece con el viento y respira un poco */
    sway?: boolean
    duration?: number
    delay?: number
    /** 4 tonos del mismo color: [corazón (el más oscuro) … corona exterior (la más clara)] */
    tones?: string[]
    /** Verde del tallo, las hojas y los sépalos */
    green?: string
  }>(),
  {
    size: 96,
    stem: false,
    sway: false,
    duration: 7,
    delay: 0,
    tones: () => [
      'var(--color-sky-deep)',
      'var(--color-sky-deep)',
      'var(--color-sky)',
      'var(--color-sky)',
    ],
    green: 'var(--color-mint)',
  },
)

const h = computed(() => Math.round(props.size * (props.stem ? 1.5 : 1)))
const t = computed(() => {
  const x = props.tones
  return [x[0]!, x[1] ?? x[0]!, x[2] ?? x[1] ?? x[0]!, x[3] ?? x[2] ?? x[1] ?? x[0]!]
})

// Una corona = n pétalos redondos repartidos en un anillo alrededor del centro.
function corona(n: number, radio: number, petalo: number, fase: number) {
  return Array.from({ length: n }, (_, i) => {
    const a = fase + (i * 2 * Math.PI) / n
    return {
      cx: +(50 + radio * Math.cos(a)).toFixed(2),
      cy: +(50 + radio * Math.sin(a)).toFixed(2),
      r: petalo,
      deg: +((a * 180) / Math.PI).toFixed(2),
    }
  })
}
const ARRIBA = -Math.PI / 2
const coronaExterior = corona(8, 30, 17, ARRIBA)
const coronaMedia = corona(7, 20, 13, ARRIBA + 0.45)
const coronaInterior = corona(6, 11, 9.5, ARRIBA + 0.9)
// Sépalos: puntas verdes que asoman por detrás de los pétalos de fuera.
const sepalos = corona(5, 38, 0, ARRIBA + 0.32)
</script>

<template>
  <!-- La animación va en este <span>, NO en el <svg> ni en un <g> de dentro:
       el navegador compone una capa del div y mueve la textura, mientras que
       animar dentro del SVG lo obliga a redibujar los ~26 trazos en cada
       cuadro. Con muchas rosas en pantalla esa diferencia es la que hace que
       la vista se arrastre. -->
  <span
    class="hibi-rose"
    :class="{ 'hibi-rose-sway': props.sway }"
    :style="props.sway ? { animationDuration: `${props.duration}s`, animationDelay: `${props.delay}s` } : undefined"
  >
  <svg
    :width="size"
    :height="h"
    :viewBox="stem ? '0 0 100 150' : '0 0 100 100'"
    fill="none"
    aria-hidden="true"
  >
    <!-- Tallo, hojas dentadas y espinas (detrás de la flor) -->
    <g v-if="stem" :fill="green">
      <path d="M50 78 C52 100 48 122 50 150" :stroke="green" stroke-width="5.4" stroke-linecap="round" fill="none" />
      <!-- Espinas -->
      <path d="M53 104 L61 99 L53 100 Z" />
      <path d="M47 126 L39 121 L47 122 Z" />
      <!-- Hoja izquierda: borde de arriba liso, borde de abajo dentado -->
      <path d="M50 112 C40 101 26 93 14 100 q5 9 11 6 q4 8 10 4 q4 7 9 2 q3 4 6 0 Z" />
      <!-- Hoja derecha: la misma, reflejada y más abajo -->
      <g transform="translate(100 18) scale(-1 1)">
        <path d="M50 112 C40 101 26 93 14 100 q5 9 11 6 q4 8 10 4 q4 7 9 2 q3 4 6 0 Z" />
      </g>
    </g>

    <g>
      <!-- Sépalos asomando por detrás de la corona exterior -->
      <g :fill="green">
        <ellipse
          v-for="(s, i) in sepalos" :key="'s' + i"
          :cx="s.cx" :cy="s.cy" rx="10" ry="4.6"
          :transform="`rotate(${s.deg} ${s.cx} ${s.cy})`"
        />
      </g>

      <!-- Corona exterior: el tono más claro -->
      <g :fill="t[3]">
        <circle v-for="(p, i) in coronaExterior" :key="'e' + i" :cx="p.cx" :cy="p.cy" :r="p.r" />
      </g>
      <!-- Corona media -->
      <g :fill="t[2]">
        <circle v-for="(p, i) in coronaMedia" :key="'m' + i" :cx="p.cx" :cy="p.cy" :r="p.r" />
      </g>
      <!-- Corona interior -->
      <g :fill="t[1]">
        <circle v-for="(p, i) in coronaInterior" :key="'i' + i" :cx="p.cx" :cy="p.cy" :r="p.r" />
      </g>

      <!-- Corazón y remolino en espiral -->
      <circle cx="50" cy="50" r="10.5" :fill="t[0]" />
      <path d="M50 41.5 a8.5 8.5 0 1 1 -8 11" :stroke="t[3]" stroke-width="2.5" stroke-linecap="round" fill="none" />
      <path d="M50 46 a4.2 4.2 0 1 1 -3.7 6.2" :stroke="t[3]" stroke-width="1.9" stroke-linecap="round" fill="none" />
    </g>
  </svg>
  </span>
</template>

<style scoped>
.hibi-rose { display: block; width: 100%; line-height: 0; }

/* Mecida con el viento y respiración, en UNA sola animación de transform */
.hibi-rose-sway {
  transform-origin: 50% 100%;
  animation-name: hibiRoseSway;
  animation-iteration-count: infinite;
  animation-timing-function: ease-in-out;
}
@keyframes hibiRoseSway {
  0%   { transform: rotate(-3.2deg) scale(1); }
  25%  { transform: rotate(0deg)    scale(1.035); }
  50%  { transform: rotate(3.2deg)  scale(1); }
  75%  { transform: rotate(0deg)    scale(1.035); }
  100% { transform: rotate(-3.2deg) scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  .hibi-rose-sway { animation: none; }
}
</style>
