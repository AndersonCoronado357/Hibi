<script setup lang="ts">
withDefaults(
  defineProps<{
    interactive?: boolean
    padded?: boolean
    as?: string
    /** Mostrar adorno cute en la esquina superior derecha (opt-in) */
    sparkle?: boolean
    /** Color tailwind del sparkle (ej. 'text-sky-deep', 'text-pink-deep') */
    sparkleColor?: string
    /** Tipo de adorno: 'sparkle' | 'heart'. Default sparkle. */
    sparkleType?: 'sparkle' | 'heart'
  }>(),
  { interactive: false, padded: true, as: 'div', sparkle: false, sparkleColor: 'text-sky-deep', sparkleType: 'sparkle' },
)
</script>

<template>
  <component
    :is="as"
    class="hibi-card hibi-card--enter relative bg-card rounded-[22px] transition-[background-color] duration-200 ease-soft overflow-hidden"
    :class="[
      padded ? 'p-5' : '',
      interactive ? 'hibi-card--interactive cursor-pointer' : '',
    ]"
  >
    <HibiSparkle
      v-if="sparkle && sparkleType === 'sparkle'"
      :size="16"
      twinkle
      :duration="2.6"
      class="absolute top-2 right-2 opacity-70 pointer-events-none"
      :class="sparkleColor"
    />
    <HibiHeart
      v-else-if="sparkle && sparkleType === 'heart'"
      :size="16"
      beat
      :duration="2.4"
      class="absolute top-2 right-2 opacity-70 pointer-events-none"
      :class="sparkleColor"
    />
    <slot />
  </component>
</template>

<style scoped>
/* Plano: separación SOLO por color. Sin scale/translate/lift en interacción. */
.hibi-card--interactive:hover {
  background-color: var(--bg-inset);
}
.hibi-card--interactive:active {
  background-color: var(--bg-muted);
}

/* Animación de entrada SEGURA: SIN `both` mode → si el navegador no
   dispara la animación, la card se queda visible (opacity 1) y no se
   "esconde". El efecto es solo un pulso de fade al insertarse. */
.hibi-card--enter {
  animation: hibiCardFadeIn 300ms ease-out;
}
@keyframes hibiCardFadeIn {
  0%   { opacity: 0; }
  100% { opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .hibi-card--enter { animation: none; }
}
</style>
