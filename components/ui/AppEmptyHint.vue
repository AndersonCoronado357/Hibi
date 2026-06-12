<script setup lang="ts">
withDefaults(defineProps<{ title?: string; hint?: string }>(), {
  title: 'Selecciona algo a la izquierda',
  hint: 'Aquí verás el detalle de lo que elijas.',
})
</script>

<template>
  <div class="flex-1 grid place-items-center text-center">
    <div>
      <HibiCloud :size="80" face class="text-sky mx-auto opacity-70" />
      <p class="mt-3 text-[15px] font-bold text-fg">{{ title }}</p>
      <p class="mt-1 text-[13px] text-fg-muted max-w-[18rem] mx-auto">{{ hint }}</p>
    </div>
  </div>
</template>
