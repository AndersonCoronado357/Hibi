<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  title: string
  icon: Component
  description?: string
}>()

const { t } = useI18n()
</script>

<template>
  <section class="h-full w-full flex flex-col items-center justify-center text-center px-6">
    <div
      v-motion
      :initial="{ opacity: 0, scale: 0.9, y: 10 }"
      :enter="{ opacity: 1, scale: 1, y: 0, transition: { duration: 450 } }"
      class="relative mb-7"
    >
      <HibiCloud :size="160" face class="text-sky hibi-float-slow" />
      <span
        class="absolute -right-1 -top-1 grid place-items-center size-12 rounded-[18px] bg-sky-soft text-sky-deep hibi-float"
      >
        <component :is="icon" :size="22" :stroke-width="1.9" />
      </span>
    </div>
    <h1 class="text-[24px] font-extrabold text-fg">{{ title }}</h1>
    <p class="mt-2 max-w-sm text-fg-muted leading-relaxed">
      {{ description ?? t('common.soonDesc') }}
    </p>
    <span
      class="mt-5 inline-flex items-center h-8 px-4 rounded-full bg-sky-soft text-sky-deep text-[12.5px] font-bold"
      >{{ t('common.soon') }}</span
    >
  </section>
</template>
