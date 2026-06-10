<script setup lang="ts">
withDefaults(defineProps<{ showText?: boolean }>(), { showText: true })
</script>

<template>
  <span class="inline-flex items-center gap-2.5 select-none">
    <span class="grid place-items-center size-10 rounded-[15px] bg-sky text-white">
      <HibiCloud :size="30" face />
    </span>
    <span v-if="showText" class="flex flex-col leading-none">
      <span class="text-[19px] font-extrabold text-fg tracking-tight">Hibi</span>
      <span class="text-[10px] text-sky-deep font-bold tracking-[0.15em]">日々</span>
    </span>
  </span>
</template>
