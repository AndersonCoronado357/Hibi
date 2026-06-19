<script setup lang="ts">
// Estrellita cute de 4 puntas estilo "sparkle". Body en currentColor.
// Animación opt-in: twinkle (escala + opacidad pulsante).
const props = withDefaults(
  defineProps<{
    size?: number
    twinkle?: boolean
    duration?: number
    delay?: number
  }>(),
  { size: 24, twinkle: false, duration: 2.4, delay: 0 },
)
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    :class="{ 'hibi-sparkle-twinkle': props.twinkle }"
    :style="props.twinkle ? { animationDuration: `${props.duration}s`, animationDelay: `${props.delay}s` } : undefined"
  >
    <!-- 4-point sparkle: dos rombos cruzados que crean una estrella de 4 puntas -->
    <path
      d="M12 1.5 L13.5 10.5 L22.5 12 L13.5 13.5 L12 22.5 L10.5 13.5 L1.5 12 L10.5 10.5 Z"
      fill="currentColor"
    />
    <!-- núcleo brillante -->
    <circle cx="12" cy="12" r="1.6" fill="currentColor" opacity="0.45" />
  </svg>
</template>

<style scoped>
.hibi-sparkle-twinkle {
  animation-name: hibiSparkleTwinkle;
  animation-iteration-count: infinite;
  animation-timing-function: ease-in-out;
  transform-origin: center;
  will-change: transform, opacity;
}
@keyframes hibiSparkleTwinkle {
  0%, 100% { transform: scale(1)    rotate(0deg);   opacity: 0.85 }
  50%      { transform: scale(1.25) rotate(20deg);  opacity: 1 }
}
@media (prefers-reduced-motion: reduce) {
  .hibi-sparkle-twinkle { animation: none; }
}
</style>
