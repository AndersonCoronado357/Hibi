<script setup lang="ts">
withDefaults(
  defineProps<{
    interactive?: boolean
    padded?: boolean
    as?: string
  }>(),
  { interactive: false, padded: true, as: 'div' },
)
</script>

<template>
  <component
    :is="as"
    class="hibi-card bg-card rounded-[22px] transition-colors duration-200 ease-soft"
    :class="[padded ? 'p-5' : '', interactive ? 'hibi-card--interactive cursor-pointer' : '']"
  >
    <slot />
  </component>
</template>

<style scoped>
/* Plano: separación por color, sin borde ni sombra. Hover solo cambia
   el relleno; sin scale/translate que muevan el layout. */
.hibi-card--interactive:hover {
  background-color: var(--bg-inset);
}
.hibi-card--interactive:active {
  background-color: var(--bg-muted);
}
</style>
