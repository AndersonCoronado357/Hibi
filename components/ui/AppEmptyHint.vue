<script setup lang="ts">
const { t } = useI18n()
const props = withDefaults(defineProps<{ title?: string; hint?: string }>(), { title: '', hint: '' })
</script>

<template>
  <div class="flex-1 grid place-items-center text-center">
    <div>
      <HibiCloud :size="80" face class="text-sky mx-auto opacity-70" />
      <p class="mt-3 text-[15px] font-bold text-fg">{{ props.title || t('common.emptyHintTitle') }}</p>
      <p class="mt-1 text-[13px] text-fg-muted max-w-[18rem] mx-auto">{{ props.hint || t('common.emptyHintText') }}</p>
    </div>
  </div>
</template>
