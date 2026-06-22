<script setup lang="ts">
// Hero reutilizable.
//
// DESKTOP (md+): banner completo con icono grande + titulo + subtitulo +
// acciones a la derecha. Es el "look" identitario de la app.
//
// MOVIL: el topnav YA muestra el titulo de la pagina, asi que el banner
// es redundante y come altura. En su lugar mostramos solo una barra
// compacta con las acciones (si las hay). Si la pagina no tiene
// acciones, no rendereamos nada en movil — el topnav basta.
import type { Component } from 'vue'
import { useSlots } from 'vue'

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

const slots = useSlots()
const hasActions = computed(() => !!slots.actions)
</script>

<template>
  <!-- Movil: solo barra de acciones, compacta. Sin titulo (lo da el topnav). -->
  <div
    v-if="hasActions"
    class="md:hidden shrink-0 -mx-1 px-1 flex items-center gap-1.5 overflow-x-auto hibi-no-sb"
  >
    <slot name="actions" />
  </div>

  <!-- Desktop: banner completo. -->
  <AppCard class="hidden md:block shrink-0 !p-0">
    <div class="relative overflow-hidden rounded-[22px] px-6 py-5" :class="TONE_MAP[tone].bg">
      <HibiCloud :size="84" float :duration="7" class="absolute -top-2 right-[20%] text-card opacity-60 pointer-events-none" aria-hidden="true" />
      <HibiCloud :size="56" float :duration="9" :delay="1" class="absolute bottom-0 right-4 text-card opacity-50 pointer-events-none" aria-hidden="true" />
      <HibiSparkle :size="14" twinkle :duration="2.6" class="absolute top-3 right-[40%] text-card opacity-70 pointer-events-none" />

      <div class="relative z-10 flex items-center gap-4">
        <HibiCloudIcon
          :size="70"
          :icon="icon"
          :icon-size="26"
          :cloud-color="TONE_MAP[tone].bg"
          :icon-color="TONE_MAP[tone].iconColor"
          :icon-stroke="1.9"
          class="shrink-0"
        />

        <div class="flex-1 min-w-0">
          <h1 class="text-[24px] font-extrabold leading-tight truncate" :class="TONE_MAP[tone].textColor">
            {{ title }}
          </h1>
          <p v-if="subtitle" class="text-[13px] font-semibold truncate opacity-80" :class="TONE_MAP[tone].textColor">
            {{ subtitle }}
          </p>
        </div>

        <div v-if="hasActions" class="flex items-center gap-2 shrink-0">
          <slot name="actions" />
        </div>
      </div>
    </div>
  </AppCard>
</template>

<style scoped>
.hibi-no-sb { scrollbar-width: none; }
.hibi-no-sb::-webkit-scrollbar { display: none; }
</style>
