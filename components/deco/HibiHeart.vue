<script setup lang="ts">
// Corazoncito cute redondeado. Body en currentColor.
// Animación opt-in: heartbeat (escala pulsante con dos golpes).
const props = withDefaults(
  defineProps<{
    size?: number
    beat?: boolean
    duration?: number
    delay?: number
  }>(),
  { size: 22, beat: false, duration: 2.2, delay: 0 },
)
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    :class="{ 'hibi-heart-beat': props.beat }"
    :style="props.beat ? { animationDuration: `${props.duration}s`, animationDelay: `${props.delay}s` } : undefined"
  >
    <path
      d="M12 21s-7.5-4.6-9.5-9.5C1 7.6 3.6 4 7.2 4c1.9 0 3.6 1 4.8 2.5C13.2 5 14.9 4 16.8 4 20.4 4 23 7.6 21.5 11.5 19.5 16.4 12 21 12 21z"
      fill="currentColor"
    />
  </svg>
</template>

<style scoped>
.hibi-heart-beat {
  animation-name: hibiHeartBeat;
  animation-iteration-count: infinite;
  animation-timing-function: ease-in-out;
  transform-origin: center;
  will-change: transform;
}
@keyframes hibiHeartBeat {
  0%, 40%, 100% { transform: scale(1) }
  15%           { transform: scale(1.18) }
  30%           { transform: scale(0.95) }
}
@media (prefers-reduced-motion: reduce) {
  .hibi-heart-beat { animation: none; }
}
</style>
