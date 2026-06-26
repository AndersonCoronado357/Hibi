<script setup lang="ts">
// Mascota Hibi EXPRESIVA: la cara y los accesorios cambian según el estado
// (feliz, contenta, aburrida, con hambre, con sueño, triste). Tiene idle
// (flota/respira), parpadeo en estados despiertos, y una reacción al tocarla.
const props = withDefaults(defineProps<{
  size?: number
  state?: 'happy' | 'content' | 'meh' | 'hungry' | 'sleepy' | 'sad'
  look?: { x: number; y: number } | null  // -1..1 cada eje: los ojos siguen algo
  mouthOpen?: boolean                      // boca abierta (al comer)
}>(), { size: 190, state: 'content' })

const emit = defineEmits<{ poke: [] }>()

const svgH = computed(() => Math.round((props.size * 112) / 140))

// Mirada: los ojitos se desplazan hacia donde apunta `look` (suavizado, como MascotCloud)
const lx = computed(() => Math.max(-1, Math.min(1, props.look?.x ?? 0)) * 2)
const ly = computed(() => Math.max(-1, Math.min(1, props.look?.y ?? 0)) * 1.7)
const eyeStyle = computed(() => ({ transform: `translate(${lx.value}px, ${ly.value}px)`, transition: 'transform 0.18s ease-out' }))

// Parpadeo (solo en estados despiertos)
const blink = ref(false)
let blinkT: ReturnType<typeof setTimeout> | undefined
const awake = computed(() => props.state !== 'sleepy')
function scheduleBlink() {
  blinkT = setTimeout(() => {
    if (awake.value) { blink.value = true; setTimeout(() => { blink.value = false }, 140) }
    scheduleBlink()
  }, 2600 + Math.random() * 3200)
}

// Reacción (rebote). Se puede disparar al tocar o desde el padre (cuidados).
const poked = ref(false)
let pokeT: ReturnType<typeof setTimeout> | undefined
function poke() {
  poked.value = false
  requestAnimationFrame(() => {
    poked.value = true
    if (pokeT) clearTimeout(pokeT)
    pokeT = setTimeout(() => (poked.value = false), 700)
  })
}
function onClick() { poke(); emit('poke') }
defineExpose({ poke })

onMounted(scheduleBlink)
onBeforeUnmount(() => { if (blinkT) clearTimeout(blinkT); if (pokeT) clearTimeout(pokeT) })

const D = 'var(--color-sky-deep)' // ojos/boca
const P = 'var(--color-pink)'     // mejillas
</script>

<template>
  <div class="hibi-mascot select-none" :class="['st-' + state, poked ? 'is-poked' : '']" role="button" tabindex="0"
    @click="onClick" @keydown.enter.prevent="onClick">
    <svg :width="size" :height="svgH" viewBox="0 0 140 112" fill="none" aria-hidden="true">
      <!-- ░░ Accesorios encima ░░ -->
      <!-- Zzz (con sueño) -->
      <g v-if="state === 'sleepy'" :fill="D">
        <text class="acc zzz zzz1" x="100" y="24" font-size="14" font-weight="800">z</text>
        <text class="acc zzz zzz2" x="112" y="14" font-size="10" font-weight="800">z</text>
      </g>
      <!-- Nubecita de lluvia (triste) -->
      <g v-else-if="state === 'sad'" class="acc">
        <ellipse cx="40" cy="12" rx="14" ry="7.5" fill="var(--bg-muted)" />
        <circle cx="30" cy="11" r="6" fill="var(--bg-muted)" />
        <circle cx="50" cy="11" r="6" fill="var(--bg-muted)" />
        <line class="rain rain1" x1="34" y1="19" x2="32" y2="25" :stroke="D" stroke-width="1.6" stroke-linecap="round" />
        <line class="rain rain2" x1="42" y1="19" x2="40" y2="25" :stroke="D" stroke-width="1.6" stroke-linecap="round" />
        <line class="rain rain3" x1="48" y1="19" x2="46" y2="25" :stroke="D" stroke-width="1.6" stroke-linecap="round" />
      </g>
      <!-- Pensando comida (con hambre) -->
      <g v-else-if="state === 'hungry'" class="acc think">
        <circle cx="104" cy="26" r="2.4" fill="var(--bg-card)" />
        <circle cx="110" cy="20" r="3.4" fill="var(--bg-card)" />
        <circle cx="119" cy="12" r="8" fill="var(--bg-card)" />
        <circle cx="119" cy="12" r="5" fill="#d8a43a" />
        <circle cx="117" cy="11" r="0.9" fill="#8a6420" />
        <circle cx="121" cy="13" r="0.9" fill="#8a6420" />
        <circle cx="120" cy="10" r="0.9" fill="#8a6420" />
      </g>
      <!-- Corazones / chispas (feliz) -->
      <g v-else-if="state === 'happy'">
        <path class="acc heart hp1" d="M30 22 c-2-3-7-2-7 2 c0 3 4 5 7 8 c3-3 7-5 7-8 c0-4-5-5-7-2 z" :fill="P" />
        <path class="acc heart hp2" d="M112 18 c-1.6-2.4-5.6-1.6-5.6 1.6 c0 2.4 3.2 4 5.6 6.4 c2.4-2.4 5.6-4 5.6-6.4 c0-3.2-4-4-5.6-1.6 z" fill="var(--color-pink-deep)" />
      </g>

      <!-- ░░ Cuerpo nube ░░ -->
      <g class="body" fill="currentColor">
        <circle cx="30" cy="60" r="28" />
        <circle cx="54" cy="38" r="28" />
        <circle cx="60" cy="68" r="28" />
        <circle cx="95" cy="46" r="24" />
        <circle cx="113" cy="64" r="22" />
        <circle cx="90" cy="72" r="19" />
      </g>

      <!-- ░░ Cara (cambia por estado) ░░ -->
      <g class="face" :class="blink ? 'is-blink' : ''">
        <!-- Mejillas -->
        <template v-if="state === 'happy' || state === 'content' || state === 'hungry'">
          <ellipse cx="49" cy="63" rx="4.6" ry="3" :fill="P" opacity="0.85" />
          <ellipse cx="91" cy="63" rx="4.6" ry="3" :fill="P" opacity="0.85" />
        </template>

        <!-- OJOS por estado -->
        <!-- happy: arcos felices ^ ^ -->
        <g v-if="state === 'happy'" :stroke="D" stroke-width="2.4" stroke-linecap="round" fill="none" :style="eyeStyle">
          <path d="M54 56 Q58.5 50.5 63 56" />
          <path d="M77 56 Q81.5 50.5 86 56" />
        </g>
        <!-- sleepy: ojos cerrados caídos -->
        <g v-else-if="state === 'sleepy'" :stroke="D" stroke-width="2" stroke-linecap="round" fill="none">
          <path d="M54 56 Q58.5 59 63 56" />
          <path d="M77 56 Q81.5 59 86 56" />
        </g>
        <!-- meh / aburrida: ojos planos -->
        <g v-else-if="state === 'meh'" :stroke="D" stroke-width="2.2" stroke-linecap="round" :style="eyeStyle">
          <line x1="55" y1="55" x2="62" y2="55" />
          <line x1="78" y1="55" x2="85" y2="55" />
        </g>
        <!-- hungry: ojos GRANDES y dilatados que TIEMBLAN (carita de antojo) -->
        <g v-else-if="state === 'hungry'" class="hungry-eyes" :style="eyeStyle">
          <g class="eyes-open">
            <ellipse cx="58" cy="55" rx="4.8" ry="6" :fill="D" />
            <ellipse cx="82" cy="55" rx="4.8" ry="6" :fill="D" />
            <circle cx="59.8" cy="52.4" r="1.6" fill="#fff" opacity="0.95" />
            <circle cx="83.8" cy="52.4" r="1.6" fill="#fff" opacity="0.95" />
          </g>
          <g class="eyes-closed" :stroke="D" stroke-width="2.2" stroke-linecap="round" fill="none">
            <path d="M53 55 Q58 59 63 55" />
            <path d="M77 55 Q82 59 87 55" />
          </g>
        </g>
        <!-- content / sad: ojos redondos (parpadean) -->
        <g v-else :style="eyeStyle">
          <g class="eyes-open">
            <ellipse cx="58.5" cy="55" rx="3.1" ry="3.9" :fill="D" />
            <ellipse cx="81.5" cy="55" rx="3.1" ry="3.9" :fill="D" />
            <circle cx="59.6" cy="53.6" r="1" fill="#fff" opacity="0.9" />
            <circle cx="82.6" cy="53.6" r="1" fill="#fff" opacity="0.9" />
          </g>
          <g class="eyes-closed" :stroke="D" stroke-width="2" stroke-linecap="round" fill="none">
            <path d="M55 55 Q58.5 58 62 55" />
            <path d="M78 55 Q81.5 58 85 55" />
          </g>
        </g>

        <!-- Lágrima (triste) -->
        <ellipse v-if="state === 'sad'" class="tear" cx="58.5" cy="62" rx="1.8" ry="2.6" :fill="D" opacity="0.85" />

        <!-- BOCA: abierta al comer, si no según el estado -->
        <g v-if="mouthOpen" class="mouth-open">
          <ellipse cx="70" cy="64" rx="6.6" ry="7.6" :fill="D" />
          <ellipse cx="70" cy="67.5" rx="3.4" ry="3" :fill="P" />
        </g>
        <template v-else>
          <ellipse v-if="state === 'happy'" cx="70" cy="62" rx="5" ry="4" :fill="D" />
          <path v-else-if="state === 'content'" d="M64 60 Q70 65.5 76 60" :stroke="D" stroke-width="2" stroke-linecap="round" fill="none" />
          <line v-else-if="state === 'meh'" x1="65" y1="62" x2="75" y2="62" :stroke="D" stroke-width="2" stroke-linecap="round" />
          <ellipse v-else-if="state === 'hungry'" cx="70" cy="63" rx="3.6" ry="3" :fill="D" />
          <ellipse v-else-if="state === 'sleepy'" cx="70" cy="61" rx="2.2" ry="2.2" :fill="D" />
          <path v-else-if="state === 'sad'" d="M64 64 Q70 59.5 76 64" :stroke="D" stroke-width="2" stroke-linecap="round" fill="none" />
        </template>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.hibi-mascot { display: inline-block; cursor: pointer; will-change: transform; }
.hibi-mascot svg { display: block; overflow: visible; }

/* Idle: flotar + respirar suave. Velocidad según estado. */
.body { transform-box: fill-box; transform-origin: center bottom; }
.hibi-mascot { animation: hibiFloat 4.4s ease-in-out infinite; }
.st-sleepy { animation-duration: 6.5s; }
.st-happy  { animation-duration: 3s; }
@keyframes hibiFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }

/* Feliz: leve balanceo extra */
.st-happy svg { animation: hibiWiggle 3.2s ease-in-out infinite; transform-origin: center 70%; }
@keyframes hibiWiggle { 0%,100% { transform: rotate(-2deg); } 50% { transform: rotate(2deg); } }

/* Aburrida/triste: caída leve (sin energía) */
.st-meh svg, .st-sad svg { transform: translateY(2px); }

/* Reacción al tocar */
.is-poked { animation: hibiPoke 0.6s var(--ease-bounce, cubic-bezier(0.34, 1.56, 0.64, 1)) !important; }
@keyframes hibiPoke { 0% { transform: scale(1); } 35% { transform: scale(1.09) translateY(-4px); } 100% { transform: scale(1); } }

/* Parpadeo: alterna ojos abiertos/cerrados en estados redondos */
.eyes-closed { display: none; }
.face.is-blink .eyes-open { display: none; }
.face.is-blink .eyes-closed { display: block; }

/* Con hambre: los ojitos dilatados tiemblan */
.hungry-eyes .eyes-open { animation: hibiTremble 0.18s linear infinite; transform-box: fill-box; transform-origin: center; }
@keyframes hibiTremble { 0%,100% { transform: translate(0,0); } 25% { transform: translate(0.5px,-0.4px); } 50% { transform: translate(-0.5px,0.4px); } 75% { transform: translate(0.4px,0.4px); } }
/* Boca abierta aparece con un pop */
.mouth-open { animation: hibiMouthPop 0.22s ease-out; transform-box: fill-box; transform-origin: center; }
@keyframes hibiMouthPop { 0% { transform: scale(0.4); } 100% { transform: scale(1); } }

/* Zzz flotando */
.zzz { opacity: 0; }
.zzz1 { animation: zzz 2.8s ease-in-out infinite; }
.zzz2 { animation: zzz 2.8s ease-in-out infinite 0.5s; }
@keyframes zzz {
  0% { opacity: 0; transform: translate(0, 4px); }
  30% { opacity: 0.9; }
  70% { opacity: 0.9; }
  100% { opacity: 0; transform: translate(6px, -8px); }
}

/* Lluvia de la nubecita triste */
.rain { opacity: 0; }
.rain1 { animation: rain 1.5s linear infinite; }
.rain2 { animation: rain 1.5s linear infinite 0.4s; }
.rain3 { animation: rain 1.5s linear infinite 0.8s; }
@keyframes rain { 0% { opacity: 0; transform: translateY(-3px); } 30% { opacity: 0.85; } 100% { opacity: 0; transform: translateY(6px); } }

/* Lágrima cae */
.tear { animation: tear 2.4s ease-in infinite; }
@keyframes tear {
  0% { opacity: 0; transform: translateY(0); }
  20% { opacity: 0.9; }
  100% { opacity: 0; transform: translateY(14px); }
}

/* Corazones / burbuja al estar feliz o pensando comida */
.heart { transform-box: fill-box; transform-origin: center; }
.hp1 { animation: floatUp 2.6s ease-in-out infinite; }
.hp2 { animation: floatUp 2.6s ease-in-out infinite 0.9s; }
@keyframes floatUp {
  0% { opacity: 0; transform: translateY(6px) scale(0.7); }
  30% { opacity: 1; }
  100% { opacity: 0; transform: translateY(-14px) scale(1.05); }
}
.think { animation: thinkPulse 2.2s ease-in-out infinite; transform-box: fill-box; transform-origin: 119px 12px; }
@keyframes thinkPulse { 0%,100% { transform: scale(0.92); opacity: 0.85; } 50% { transform: scale(1.05); opacity: 1; } }

@media (prefers-reduced-motion: reduce) {
  .hibi-mascot, .st-happy svg, .is-poked, .hungry-eyes .eyes-open, .mouth-open,
  .zzz1, .zzz2, .rain1, .rain2, .rain3, .tear, .hp1, .hp2, .think { animation: none !important; }
  .zzz, .rain { opacity: 0.85; }
}
</style>
