<script setup lang="ts">
import { Music, Play, Pause, Heart, Headphones, Plug, SkipBack, SkipForward, Shuffle, Repeat, Search, Disc3, Radio, Star } from '@lucide/vue'

useHead({ title: 'Hibi — Spotify' })

const connected = ref(false)
const playing = ref(false)
const liked = ref(false)
const progress = ref(38)

interface Track { id: string; title: string; artist: string; tone: string; mins: number }
const queue = ref<Track[]>([
  { id: 't1', title: 'Sunset chillout', artist: 'Lofi & friends', tone: 'bg-sky-soft text-sky-deep', mins: 3.5 },
  { id: 't2', title: 'Focus deep work', artist: 'Hibi mix', tone: 'bg-mint text-[#34936a]', mins: 4 },
  { id: 't3', title: 'Café de domingo', artist: 'Indie folk', tone: 'bg-peach text-[#c5733f]', mins: 3.2 },
  { id: 't4', title: 'Para correr', artist: 'Beats x10', tone: 'bg-pink-soft text-pink-deep', mins: 3.8 },
  { id: 't5', title: 'Tarde lluviosa', artist: 'Piano relax', tone: 'bg-lavender text-[#7a63c0]', mins: 4.5 },
])
const currentIdx = ref(0)
const current = computed(() => queue.value[currentIdx.value]!)
function nextTrack() { currentIdx.value = (currentIdx.value + 1) % queue.value.length; progress.value = 0 }
function prevTrack() { currentIdx.value = (currentIdx.value - 1 + queue.value.length) % queue.value.length; progress.value = 0 }

interface Mood { id: string; name: string; tone: string; iconTone: string; icon: any }
const moods: Mood[] = [
  { id: 'm1', name: 'Concentración', tone: 'bg-sky-soft', iconTone: 'text-sky-deep', icon: Headphones },
  { id: 'm2', name: 'Relax', tone: 'bg-lavender', iconTone: 'text-[#7a63c0]', icon: Radio },
  { id: 'm3', name: 'Energía', tone: 'bg-peach', iconTone: 'text-[#c5733f]', icon: Disc3 },
  { id: 'm4', name: 'Buen rollo', tone: 'bg-mint', iconTone: 'text-[#34936a]', icon: Music },
]

interface Playlist { id: string; name: string; count: number; tone: string; iconTone: string }
const playlists: Playlist[] = [
  { id: 'pl1', name: 'Favoritos', count: 84, tone: 'bg-pink-soft', iconTone: 'text-pink-deep' },
  { id: 'pl2', name: 'Lofi infinito', count: 142, tone: 'bg-sky-soft', iconTone: 'text-sky-deep' },
  { id: 'pl3', name: 'Para correr', count: 28, tone: 'bg-peach', iconTone: 'text-[#c5733f]' },
  { id: 'pl4', name: 'Domingo lento', count: 36, tone: 'bg-cream', iconTone: 'text-[#bf8f2e]' },
  { id: 'pl5', name: 'Coches y carretera', count: 51, tone: 'bg-mint', iconTone: 'text-[#34936a]' },
]

const search = ref('')
function play(idx: number) { currentIdx.value = idx; playing.value = true }
const totalMins = computed(() => current.value.mins)
const elapsedSec = computed(() => Math.round(totalMins.value * 60 * progress.value / 100))
const totalSec = computed(() => Math.round(totalMins.value * 60))
function fmt(s: number) { return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}` }
</script>

<template>
  <div class="h-full flex flex-col gap-3 px-4 md:px-7 py-5 relative overflow-hidden">
    <!-- Nubes decorativas de fondo (parte de la identidad de Hibi) -->
    <HibiCloud :size="180" float :duration="8" class="hidden md:block absolute -top-6 -right-10 text-sky-soft opacity-15 pointer-events-none z-40" aria-hidden="true" />
    <HibiCloud :size="120" float :duration="10" :delay="1.4" class="hidden md:block absolute bottom-10 -left-6 text-pink-soft opacity-15 pointer-events-none z-40" aria-hidden="true" />
    <HibiCloud :size="90" float :duration="12" :delay="0.7" class="hidden md:block absolute top-1/2 right-1/3 text-lavender opacity-15 pointer-events-none z-40" aria-hidden="true" />
    <HibiSparkle :size="20" twinkle :duration="2.4" class="hidden md:block absolute top-[14%] left-[8%] text-fg-subtle opacity-25 pointer-events-none z-40" />
    <HibiSparkle :size="14" twinkle :duration="3" :delay="0.8" class="hidden md:block absolute bottom-[28%] right-[10%] text-fg-subtle opacity-25 pointer-events-none z-40" />
    <HibiHeart :size="16" beat :duration="2.6" class="hidden md:block absolute top-[40%] left-[16%] text-fg-subtle opacity-25 pointer-events-none z-40" />

    <!-- Toolbar -->
    <div class="relative z-10">
      <PageHero :icon="Music" tone="mint" title="Spotify" :subtitle="connected ? 'Conectado' : 'No conectado'">
        <template #actions>
          <div class="relative hidden md:block">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 size-[16px] text-fg-subtle" :stroke-width="1.9" aria-hidden="true" />
            <input v-model="search" type="text" placeholder="Buscar canción, artista, álbum…"
              class="w-[260px] h-10 rounded-full bg-card focus:bg-inset pl-9 pr-3 text-[13.5px] text-fg outline-none" />
          </div>
          <AppButton :variant="connected ? 'secondary' : 'primary'" size="sm" @click="connected = !connected">
            <template #icon><Plug class="size-[16px]" :stroke-width="2.2" /></template>
            {{ connected ? 'Desconectar' : 'Conectar' }}
          </AppButton>
        </template>
      </PageHero>
    </div>

    <div class="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-3 relative z-10">
      <div class="flex flex-col gap-3 min-h-0 overflow-y-auto scroll-area">
        <!-- Player hero -->
        <AppCard class="!p-6 flex flex-col md:flex-row items-center gap-6 shrink-0 relative overflow-hidden">
          <HibiCloud :size="80" class="hidden md:block absolute top-2 right-2 text-card opacity-15 pointer-events-none z-40" aria-hidden="true" />
          <div class="relative shrink-0 grid place-items-center w-[180px] h-[180px] rounded-[22px]" :class="current.tone">
            <Headphones class="size-12" :stroke-width="1.6" />
          </div>
          <div class="flex-1 min-w-0 w-full flex flex-col gap-3">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="text-[12px] font-bold text-fg-muted uppercase tracking-wide">Reproduciendo ahora</p>
                <h2 class="text-[26px] font-extrabold text-fg leading-tight truncate mt-0.5">{{ current.title }}</h2>
                <p class="text-[14px] text-fg-muted truncate">{{ current.artist }}</p>
              </div>
              <button class="grid place-items-center size-10 rounded-full transition-[background-color,color]"
                :class="liked ? 'bg-pink-soft text-pink-deep' : 'bg-muted text-fg-muted hover:text-fg'"
                @click="liked = !liked" :aria-label="liked ? 'Quitar de favoritos' : 'Añadir a favoritos'">
                <Heart class="size-[18px]" :class="liked ? 'fill-current' : ''" :stroke-width="liked ? 0 : 2" />
              </button>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-[11.5px] text-fg-muted tabular-nums w-10 text-right">{{ fmt(elapsedSec) }}</span>
              <div class="flex-1 h-2 rounded-full bg-muted overflow-hidden cursor-pointer"
                @click="(e) => { const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); progress = Math.round(((e.clientX - r.left) / r.width) * 100) }">
                <div class="h-full rounded-full bg-sky-deep transition-[width] duration-150" :style="{ width: progress + '%' }"></div>
              </div>
              <span class="text-[11.5px] text-fg-muted tabular-nums w-10">{{ fmt(totalSec) }}</span>
            </div>
            <div class="flex items-center justify-center gap-2">
              <button class="grid place-items-center size-10 rounded-full text-fg-muted hover:text-fg hover:bg-muted" aria-label="Aleatorio"><Shuffle class="size-[17px]" :stroke-width="2" /></button>
              <button class="grid place-items-center size-11 rounded-full text-fg-muted hover:text-fg hover:bg-muted" aria-label="Anterior" @click="prevTrack"><SkipBack class="size-5" :stroke-width="2" /></button>
              <button class="grid place-items-center size-14 rounded-full bg-sky text-[#1f4661] hover:bg-sky-deep hover:text-white transition-[background-color,color]"
                @click="playing = !playing" :aria-label="playing ? 'Pausar' : 'Reproducir'">
                <component :is="playing ? Pause : Play" class="size-6" :stroke-width="playing ? 2 : 0" :class="playing ? '' : 'fill-current'" />
              </button>
              <button class="grid place-items-center size-11 rounded-full text-fg-muted hover:text-fg hover:bg-muted" aria-label="Siguiente" @click="nextTrack"><SkipForward class="size-5" :stroke-width="2" /></button>
              <button class="grid place-items-center size-10 rounded-full text-fg-muted hover:text-fg hover:bg-muted" aria-label="Repetir"><Repeat class="size-[17px]" :stroke-width="2" /></button>
            </div>
          </div>
        </AppCard>

        <!-- Tus playlists: ocupan todo el alto restante -->
        <AppCard class="!p-5 flex-1 min-h-0 flex flex-col">
          <div class="flex items-center justify-between mb-3 shrink-0">
            <h3 class="text-[13px] font-bold text-fg-muted">Tus playlists</h3>
            <span class="text-[11.5px] font-bold text-fg-subtle">{{ playlists.length }} guardadas</span>
          </div>
          <ul class="hibi-anim-rotate flex-1 min-h-0 overflow-y-auto scroll-area flex flex-col gap-2 pr-1">
            <li v-for="p in playlists" :key="p.id"
              class="flex items-center gap-3 p-3 rounded-[12px] bg-muted hover:bg-inset transition-[background-color] cursor-pointer">
              <HibiCloudIcon :size="58" :icon="Disc3" :icon-size="19" :cloud-color="p.tone" :icon-color="p.iconTone" :icon-stroke="1.9" class="shrink-0" />
              <div class="flex-1 min-w-0">
                <p class="text-[14px] font-bold text-fg truncate">{{ p.name }}</p>
                <p class="text-[12px] text-fg-muted">{{ p.count }} canciones</p>
              </div>
              <button class="grid place-items-center size-9 rounded-full bg-card text-sky-deep hover:bg-sky-soft transition-[background-color]" aria-label="Reproducir">
                <Play class="size-4 fill-current" :stroke-width="0" />
              </button>
            </li>
          </ul>
        </AppCard>
      </div>

      <!-- Cola -->
      <AppCard class="flex flex-col min-h-0" :padded="false">
        <header class="px-5 pt-5 pb-3 shrink-0 flex items-center justify-between">
          <h3 class="text-[14px] font-bold text-fg">Cola</h3>
          <span class="text-[11.5px] text-fg-muted font-semibold">{{ queue.length }} canciones</span>
        </header>
        <ul class="hibi-anim-slide-left flex-1 min-h-0 overflow-y-auto scroll-area px-2 pb-4 flex flex-col gap-1">
          <li v-for="(t, i) in queue" :key="t.id">
            <button type="button"
              class="w-full flex items-center gap-3 p-2.5 rounded-[12px] transition-[background-color] text-left"
              :class="i === currentIdx ? 'bg-sky-soft' : 'hover:bg-muted'"
              @click="play(i)">
              <HibiCloudIcon :size="54" :icon="Headphones" :icon-size="17" :cloud-color="t.tone.split(' ')[0]" :icon-color="t.tone.split(' ')[1] || 'text-fg'" :icon-stroke="1.9" class="shrink-0" />
              <div class="flex-1 min-w-0">
                <p class="text-[14px] font-semibold text-fg truncate">{{ t.title }}</p>
                <p class="text-[12px] text-fg-muted truncate">{{ t.artist }}</p>
              </div>
              <span class="text-[11.5px] font-bold tabular-nums" :class="i === currentIdx ? 'text-sky-deep' : 'text-fg-subtle'">{{ t.mins.toFixed(1) }} min</span>
            </button>
          </li>
        </ul>
      </AppCard>
    </div>
  </div>
</template>
