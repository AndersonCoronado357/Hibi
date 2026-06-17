<script setup lang="ts">
import { Music, Play, Heart, ListMusic, Headphones, Plug } from '@lucide/vue'

useHead({ title: 'Hibi — Spotify' })

const recent = [
  { id: 's1', title: 'Sunset chillout', artist: 'Lofi & friends', tone: 'bg-sky-soft text-sky-deep' },
  { id: 's2', title: 'Focus deep work', artist: 'Hibi mix', tone: 'bg-mint text-[#34936a]' },
  { id: 's3', title: 'Café de domingo', artist: 'Indie folk', tone: 'bg-peach text-[#c5733f]' },
  { id: 's4', title: 'Para correr', artist: 'Beats x10', tone: 'bg-pink-soft text-pink-deep' },
]
const mood = [
  { id: 'm1', name: 'Concentración', color: 'bg-sky' },
  { id: 'm2', name: 'Relax', color: 'bg-lavender' },
  { id: 'm3', name: 'Energía', color: 'bg-peach' },
  { id: 'm4', name: 'Buen rollo', color: 'bg-mint' },
]
</script>

<template>
  <div class="h-full flex flex-col gap-3 px-4 md:px-7 py-5">
    <AppCard class="shrink-0 !p-3 md:!p-4 flex items-center justify-between gap-3">
      <div class="flex items-center gap-2.5">
        <span class="grid place-items-center size-10 rounded-[13px] bg-mint text-[#34936a]" aria-hidden="true"><Music class="size-5" :stroke-width="1.9" /></span>
        <div>
          <h1 class="text-[20px] md:text-[22px] font-extrabold text-fg leading-tight">Spotify</h1>
          <p class="text-[12.5px] text-fg-muted leading-tight">Tu música para cada momento</p>
        </div>
      </div>
      <AppButton variant="secondary" size="sm"><template #icon><Plug class="size-[16px]" :stroke-width="2.2" /></template>Conectar</AppButton>
    </AppCard>

    <div class="flex-1 min-h-0 overflow-y-auto scroll-area">
      <AppCard class="!p-5 mb-4 flex flex-col md:flex-row md:items-center gap-4">
        <span class="grid place-items-center size-14 rounded-[18px] bg-mint text-[#34936a]"><Headphones class="size-7" :stroke-width="1.9" /></span>
        <div class="flex-1">
          <h2 class="text-[18px] font-extrabold text-fg">Conecta tu cuenta de Spotify</h2>
          <p class="text-[13.5px] text-fg-muted mt-0.5">Reproduce listas según tu enfoque, ánimo o rutina. Sugerencias automáticas de la nubecita.</p>
        </div>
        <AppButton variant="primary" size="sm">Conectar Spotify</AppButton>
      </AppCard>

      <h3 class="text-[13px] font-bold text-fg-muted mb-2 px-1">Recientes</h3>
      <div class="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 mb-6">
        <AppCard v-for="r in recent" :key="r.id" interactive class="!p-3.5 flex flex-col gap-3">
          <div class="relative aspect-square rounded-[14px]" :class="r.tone">
            <button class="absolute right-2 bottom-2 grid place-items-center size-9 rounded-full bg-card text-sky-deep" aria-label="Reproducir"><Play class="size-4 fill-current" :stroke-width="0" /></button>
          </div>
          <div>
            <p class="text-[14px] font-bold text-fg truncate">{{ r.title }}</p>
            <p class="text-[12px] text-fg-muted truncate">{{ r.artist }}</p>
          </div>
        </AppCard>
      </div>

      <h3 class="text-[13px] font-bold text-fg-muted mb-2 px-1">Por ánimo</h3>
      <div class="grid gap-3 grid-cols-2 sm:grid-cols-4">
        <button v-for="m in mood" :key="m.id" class="rounded-[18px] p-5 text-left text-[#1c4258] font-extrabold hover:brightness-[0.96] transition" :class="m.color">
          <p class="text-[14px] opacity-80 font-bold">Modo</p>
          <p class="text-[19px] mt-0.5 leading-tight">{{ m.name }}</p>
        </button>
      </div>
    </div>
  </div>
</template>
