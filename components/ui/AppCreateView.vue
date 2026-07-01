<script setup lang="ts">
import { ArrowLeft, Check } from '@lucide/vue'

defineProps<{
  title: string
  subtitle?: string
  saveLabel?: string
  disabled?: boolean
}>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'save'): void }>()
const { t } = useI18n()
</script>

<template>
  <!-- Vista de creación FULL-SCREEN. Ocupa todo el contenedor del módulo. -->
  <section class="h-full w-full flex flex-col gap-4 px-4 md:px-7 py-5 overflow-hidden relative" :data-create-view="true">
    <!-- Decoración cinnamoroll de fondo -->
    <HibiCloud :size="180" class="absolute -top-6 -right-8 text-sky-soft opacity-30 pointer-events-none" aria-hidden="true" />
    <HibiCloud :size="120" class="absolute bottom-12 -left-10 text-pink-soft opacity-25 pointer-events-none" aria-hidden="true" />
    <HibiCloud :size="80" class="absolute top-1/3 right-1/4 text-lavender opacity-15 pointer-events-none" aria-hidden="true" />

    <!-- Toolbar con back + save -->
    <header class="relative z-10 shrink-0 flex items-center justify-between gap-3">
      <button type="button"
        class="inline-flex items-center gap-2 h-12 pl-3 pr-5 rounded-full bg-card text-fg hover:bg-muted transition-[background-color]"
        @click="emit('close')">
        <ArrowLeft class="size-[18px]" :stroke-width="2" aria-hidden="true" />
        <span class="text-[14px] font-bold">{{ t('common.back') }}</span>
      </button>
      <div class="flex-1 min-w-0 text-center hidden md:block">
        <h1 class="text-[18px] font-extrabold text-fg leading-tight truncate">{{ title }}</h1>
        <p v-if="subtitle" class="text-[12.5px] text-fg-muted leading-tight truncate">{{ subtitle }}</p>
      </div>
      <button type="submit" form="create-form"
        class="group/hibibtn relative inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-sky-deep text-white hover:bg-sky hover:text-[#1f4661] font-bold text-[14px] disabled:opacity-50 disabled:cursor-not-allowed transition-[background-color,color]"
        :disabled="disabled">
        <span class="inline-flex items-center gap-2 transition-opacity duration-200 group-hover/hibibtn:opacity-0">
          <Check class="size-[16px]" :stroke-width="2.4" aria-hidden="true" />
          {{ saveLabel || t('common.save') }}
        </span>
        <HibiButtonFace variant="primary" />
      </button>
    </header>

    <!-- Title móvil -->
    <div class="md:hidden relative z-10">
      <h1 class="text-[22px] font-extrabold text-fg leading-tight">{{ title }}</h1>
      <p v-if="subtitle" class="text-[13px] text-fg-muted leading-tight mt-0.5">{{ subtitle }}</p>
    </div>

    <!-- Form body, ocupa TODO el ancho y alto disponible. hibi-anim-form
         hace que cada bloque (label+input) aparezca con stagger en cascada. -->
    <form id="create-form" class="relative z-10 flex-1 min-h-0 w-full" @submit.prevent="emit('save')">
      <div class="hibi-anim-form w-full h-full flex flex-col gap-5 overflow-y-auto scroll-area">
        <slot />
      </div>
    </form>
  </section>
</template>
