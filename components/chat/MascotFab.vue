<script setup lang="ts">
// Mascota flotante que lleva a /chat. Se oculta cuando ya estás en /chat.
// Tiene una idle de flotación suave + sparkle decorativo + tooltip al hover.
const route = useRoute()
const hide = computed(() => route.path.startsWith('/chat'))
</script>

<template>
  <NuxtLink
    v-if="!hide"
    to="/chat"
    aria-label="Abrir chat con Hibi"
    class="mascot-fab group/fab fixed z-[55] right-4 md:right-5"
  >
    <!-- Wrapper que flota arriba/abajo en loop -->
    <span class="mascot-fab__float relative inline-block">
      <!-- Sparkle decorativa que parpadea sobre la mascota -->
      <HibiSparkle
        :size="18"
        twinkle
        :duration="2.4"
        class="absolute -top-1 -right-1 text-sky-deep opacity-90 pointer-events-none"
      />
      <!-- Heart que aparece al hover -->
      <HibiHeart
        :size="16"
        beat
        :duration="1.4"
        class="absolute -top-1 -left-1 text-pink-deep opacity-0 group-hover/fab:opacity-100 transition-opacity duration-200 pointer-events-none"
      />
      <MascotCloud :size="78" class="text-sky pointer-events-none" />
    </span>
    <!-- Tooltip al hover -->
    <span
      class="mascot-fab__tip absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap px-3 py-1.5 rounded-full bg-card text-fg text-[12.5px] font-bold opacity-0 -translate-x-1 group-hover/fab:opacity-100 group-hover/fab:translate-x-0 transition-[opacity,transform] duration-200 pointer-events-none"
    >
      Habla con Hibi
    </span>
  </NuxtLink>
</template>

<style scoped>
.mascot-fab {
  bottom: calc(78px + env(safe-area-inset-bottom, 0px));
}
@media (min-width: 768px) {
  .mascot-fab {
    bottom: 22px;
  }
}
/* Flotación cute: sube/baja 5px en loop continuo */
.mascot-fab__float {
  animation: mascotFabFloat 4s ease-in-out infinite;
  will-change: transform;
}
@keyframes mascotFabFloat {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-6px); }
}
@media (prefers-reduced-motion: reduce) {
  .mascot-fab__float { animation: none; }
}
</style>
