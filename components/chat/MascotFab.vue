<script setup lang="ts">
// Botón flotante con la mascota. Lleva a la vista /chat. Se oculta cuando
// ya estás en /chat para no estorbar.
const route = useRoute()
const hide = computed(() => route.path.startsWith('/chat'))
</script>

<template>
  <NuxtLink
    v-if="!hide"
    to="/chat"
    aria-label="Abrir chat con la nubecita"
    class="mascot-fab fixed z-[55] right-4 md:right-5 grid place-items-center bg-card rounded-full size-16 md:size-[68px] hover:brightness-[0.98] transition-colors"
  >
    <MascotCloud :size="64" class="text-sky pointer-events-none" />
  </NuxtLink>
</template>

<style scoped>
.mascot-fab {
  /* móvil: por encima de la bottom-nav + safe area */
  bottom: calc(78px + env(safe-area-inset-bottom, 0px));
}
@media (min-width: 768px) {
  .mascot-fab {
    bottom: 22px;
  }
}
</style>
