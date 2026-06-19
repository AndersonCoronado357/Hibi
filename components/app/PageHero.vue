<script setup lang="ts">
// Hero reutilizable para cada página: banner pastel con nubes decorativas,
// icono grande coloreado, título grande y subtítulo. Slot para acciones.
// Inspirado en el card de perfil de settings.
import type { Component } from 'vue'

withDefaults(defineProps<{
  icon: Component
  /** Color de fondo del banner: 'sky' | 'pink' | 'mint' | 'peach' | 'lavender' | 'cream' */
  tone?: 'sky' | 'pink' | 'mint' | 'peach' | 'lavender' | 'cream'
  title: string
  subtitle?: string
}>(), { tone: 'sky' })

const TONE_MAP = {
  sky:      { bg: 'bg-sky-soft',   iconColor: 'text-sky-deep',     textColor: 'text-sky-deep' },
  pink:     { bg: 'bg-pink-soft',  iconColor: 'text-pink-deep',    textColor: 'text-pink-deep' },
  mint:     { bg: 'bg-mint',       iconColor: 'text-[#34936a]',    textColor: 'text-[#34936a]' },
  peach:    { bg: 'bg-peach',      iconColor: 'text-[#c5733f]',    textColor: 'text-[#c5733f]' },
  lavender: { bg: 'bg-lavender',   iconColor: 'text-[#7a63c0]',    textColor: 'text-[#7a63c0]' },
  cream:    { bg: 'bg-cream',      iconColor: 'text-[#bf8f2e]',    textColor: 'text-[#bf8f2e]' },
} as const
</script>

<template>
  <AppCard class="shrink-0 !p-0">
    <div class="relative overflow-hidden rounded-[22px] flex items-center px-5 md:px-6 py-4 md:py-5 gap-4" :class="TONE_MAP[tone].bg">
      <!-- Nubes decorativas dentro del banner (siempre visibles) -->
      <HibiCloud :size="84" float :duration="7" class="absolute -top-2 right-[20%] text-card opacity-60 pointer-events-none" aria-hidden="true" />
      <HibiCloud :size="56" float :duration="9" :delay="1" class="absolute bottom-0 right-4 text-card opacity-50 pointer-events-none" aria-hidden="true" />
      <HibiSparkle :size="14" twinkle :duration="2.6" class="absolute top-3 right-[40%] text-card opacity-70 pointer-events-none" />

      <!-- Icono dentro de una nube Hibi del color del tono (cinnamoroll) -->
      <HibiCloudIcon
        :size="70"
        :icon="icon"
        :icon-size="26"
        :cloud-color="TONE_MAP[tone].bg"
        :icon-color="TONE_MAP[tone].iconColor"
        :icon-stroke="1.9"
        class="relative z-10 shrink-0"
      />

      <!-- Título + subtítulo -->
      <div class="relative z-10 flex-1 min-w-0">
        <h1 class="text-[22px] md:text-[24px] font-extrabold leading-tight truncate" :class="TONE_MAP[tone].textColor">
          {{ title }}
        </h1>
        <p v-if="subtitle" class="text-[12.5px] md:text-[13px] font-semibold truncate opacity-80" :class="TONE_MAP[tone].textColor">
          {{ subtitle }}
        </p>
      </div>

      <!-- Acciones (filtros, botones, etc.) -->
      <div class="relative z-10 flex items-center gap-2 shrink-0">
        <slot name="actions" />
      </div>
    </div>
  </AppCard>
</template>
