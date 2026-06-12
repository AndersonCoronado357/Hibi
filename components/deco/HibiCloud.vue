<script setup lang="ts">
// Nube EXACTA a la referencia del usuario: un círculo base + 5 "box-shadow"
// convertidos a círculos (mismos offsets/tamaños). Sin base rectangular.
// Estática (sin animación). Cuerpo en currentColor.
withDefaults(defineProps<{ size?: number; face?: boolean }>(), {
  size: 120,
  face: false,
})
function h(size: number) {
  return Math.round((size * 95) / 140)
}
</script>

<template>
  <svg :width="size" :height="h(size)" viewBox="0 0 140 95" fill="none" aria-hidden="true">
    <g fill="currentColor">
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
