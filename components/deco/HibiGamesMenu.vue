<script setup lang="ts">
// Menú de juegos de Hibi: una FILA por juego, ancho completo (no tarjetas en grid).
import { X, Coins, Play } from '@lucide/vue'

const { t } = useI18n()
defineProps<{ lastGameCoins?: number }>()
const emit = defineEmits<{ pick: [id: string]; close: [] }>()

const GAMES: { id: string; tone: string; bg: string }[] = [
  { id: 'flip', tone: 'text-sky', bg: 'bg-sky-soft' },
  { id: 'memory', tone: 'text-pink', bg: 'bg-pink-soft' },
  { id: 'pop', tone: 'text-mint', bg: 'bg-mint' },
  { id: 'simon', tone: 'text-lavender', bg: 'bg-lavender' },
  { id: 'merge', tone: 'text-peach', bg: 'bg-peach' },
  { id: 'esquiva', tone: 'text-cream', bg: 'bg-cream' },
]
</script>

<template>
  <div class="relative w-full h-full overflow-hidden flex flex-col">
    <HibiCloud :size="130" float :duration="12" class="absolute -top-8 -right-8 text-sky-soft opacity-40 pointer-events-none" aria-hidden="true" />
    <HibiCloud :size="70" float :duration="15" :delay="1.3" class="absolute bottom-6 -left-5 text-pink-soft opacity-35 pointer-events-none" aria-hidden="true" />
    <HibiSparkle :size="18" twinkle class="absolute top-[18%] left-[10%] text-fg-subtle opacity-30 pointer-events-none" />
    <HibiSparkle :size="13" twinkle :delay="0.8" class="absolute bottom-[22%] right-[8%] text-fg-subtle opacity-25 pointer-events-none" />

    <!-- Cabecera -->
    <header class="shrink-0 flex items-center justify-between px-4 pt-4 pb-2 z-10">
      <div>
        <h2 class="text-[20px] font-extrabold text-fg leading-none">{{ t('hibi.games.menuTitle') }}</h2>
        <p v-if="lastGameCoins" class="mt-1 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-[#bf8f2e]"><Coins class="size-[14px]" :stroke-width="2.3" /> {{ t('hibi.games.won', { n: lastGameCoins, unit: t(lastGameCoins === 1 ? 'hibi.games.coinUnit.one' : 'hibi.games.coinUnit.other') }) }}</p>
        <p v-else class="mt-1 text-[12.5px] text-fg-muted">{{ t('hibi.games.menuHint') }}</p>
      </div>
      <button type="button" class="grid place-items-center size-10 rounded-full bg-muted text-fg-muted cursor-pointer" :aria-label="t('common.close')" @click="emit('close')"><X class="size-[19px]" :stroke-width="2.2" /></button>
    </header>

    <!-- Lista de juegos: una fila por juego, ancho completo -->
    <div class="flex-1 min-h-0 overflow-y-auto scroll-area px-3 pb-4 z-10">
      <ul class="flex flex-col gap-2">
        <li v-for="g in GAMES" :key="g.id">
          <button type="button"
            class="w-full flex items-center gap-3 p-2.5 rounded-[14px] bg-card cursor-pointer active:scale-[0.99] transition-transform text-left"
            @click="emit('pick', g.id)">
            <span class="grid place-items-center size-12 rounded-[14px] shrink-0" :class="g.bg">
              <HibiCloud :size="34" face :class="g.tone" aria-hidden="true" />
            </span>
            <div class="flex-1 min-w-0">
              <p class="text-[14.5px] font-extrabold text-fg leading-tight">{{ t('hibi.games.list.' + g.id + '.name') }}</p>
              <p class="text-[12px] text-fg-muted truncate">{{ t('hibi.games.list.' + g.id + '.tag') }}</p>
            </div>
            <span class="grid place-items-center size-9 rounded-full bg-muted text-fg-muted shrink-0" aria-hidden="true">
              <Play class="size-[15px] fill-current" :stroke-width="0" />
            </span>
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>
