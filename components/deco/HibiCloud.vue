<script setup lang="ts">
// Nube EXACTA a la referencia del usuario: un círculo base + 5 "box-shadow"
// convertidos a círculos (mismos offsets/tamaños). Sin base rectangular.
// Cuerpo en currentColor. Animación de flotación opt-in vía `float`.
const props = withDefaults(
  defineProps<{
    size?: number
    face?: boolean
    /** Activa animación suave de flotación vertical */
    float?: boolean
    /** Velocidad de la animación en segundos (default 6) */
    duration?: number
    /** Retraso de inicio en segundos (default 0). Útil para desfasar varias nubes. */
    delay?: number
    /** Opacidad GLOBAL del cuerpo (0..1). Aplica al <g> para que los 6
     *  círculos overlap NO se sumen creando bolas oscuras visibles. */
    bodyOpacity?: number
  }>(),
  { size: 120, face: false, float: false, duration: 6, delay: 0, bodyOpacity: 1 },
)
function h(size: number) {
  return Math.round((size * 95) / 140)
}
</script>

<template>
  <svg
    :width="size"
    :height="h(size)"
    viewBox="0 0 140 95"
    fill="none"
    aria-hidden="true"
    :class="{ 'hibi-cloud-float': props.float }"
    :style="props.float ? { animationDuration: `${props.duration}s`, animationDelay: `${props.delay}s` } : undefined"
  >
    <g fill="currentColor" :opacity="props.bodyOpacity">
      <circle cx="30" cy="55" r="30" />
      <circle cx="55" cy="30" r="30" />
      <circle cx="60" cy="65" r="30" />
      <circle cx="95" cy="40" r="25" />
      <circle cx="115" cy="60" r="25" />
      <circle cx="90" cy="70" r="20" />
    </g>
    <g v-if="face">
      <ellipse cx="60" cy="52" rx="3" ry="3.7" fill="var(--color-sky-deep)" />
      <ellipse cx="80" cy="52" rx="3" ry="3.7" fill="var(--color-sky-deep)" />
      <ellipse cx="51" cy="59" rx="4.2" ry="2.8" fill="var(--color-pink)" opacity="0.8" />
      <ellipse cx="89" cy="59" rx="4.2" ry="2.8" fill="var(--color-pink)" opacity="0.8" />
      <path d="M64 57 Q70 62 76 57" stroke="var(--color-sky-deep)" stroke-width="1.9" stroke-linecap="round" fill="none" />
    </g>
  </svg>
</template>

<style scoped>
.hibi-cloud-float {
  animation-name: hibiCloudFloat;
  animation-iteration-count: infinite;
  animation-timing-function: ease-in-out;
  will-change: transform;
}
@keyframes hibiCloudFloat {
  0%, 100% { transform: translateY(0) }
  50%      { transform: translateY(-8px) }
}
@media (prefers-reduced-motion: reduce) {
  .hibi-cloud-float { animation: none; }
}
</style>
