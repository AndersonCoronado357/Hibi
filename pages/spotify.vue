<script setup lang="ts">
import { Music, Play, Pause, Heart, Headphones, Plug, SkipBack, SkipForward, Shuffle, Repeat, Search, Disc3, Radio, Star, ChevronDown, ListMusic } from '@lucide/vue'

const { t } = useI18n()

useHead({ title: t('spotify.head.title') })

const connected = ref(false)
const playing = ref(false)
const liked = ref(false)
const progress = ref(38)
// El reproductor SOLO aparece cuando eliges una canción o playlist (como Spotify).
const hasNowPlaying = ref(false)
// Pestaña de la biblioteca (la cola ya no va debajo de las playlists).
const subtab = ref<'playlists' | 'queue'>('playlists')
// Vista detallada del reproductor (pantalla completa); el mini-reproductor abre esto.
const detailOpen = ref(false)
// Sheet de la cola dentro de la vista detallada.
const detailQueueOpen = ref(false)

interface Track { id: string; title: string; artist: string; tone: string; mins: number }
const queue = ref<Track[]>([
  { id: 't1', title: 'Sunset chillout', artist: 'Lofi & friends', tone: 'bg-sky-soft text-sky-deep', mins: 3.5 },
  { id: 't2', title: 'Focus deep work', artist: 'Hibi mix', tone: 'bg-mint text-[#34936a]', mins: 4 },
  { id: 't3', title: 'Café de domingo', artist: 'Indie folk', tone: 'bg-peach text-[#c5733f]', mins: 3.2 },
  { id: 't4', title: 'Para correr', artist: 'Beats x10', tone: 'bg-pink-soft text-pink-deep', mins: 3.8 },
  { id: 't5', title: 'Tarde lluviosa', artist: 'Piano relax', tone: 'bg-lavender text-[#7a63c0]', mins: 4.5 },
  { id: 't6', title: 'Mañana de niebla', artist: 'Ambient soft', tone: 'bg-cream text-[#bf8f2e]', mins: 5.1 },
  { id: 't7', title: 'Calles de Tokio', artist: 'City pop', tone: 'bg-sky-soft text-sky-deep', mins: 3.9 },
  { id: 't8', title: 'Bossa en la cocina', artist: 'Bossa nova', tone: 'bg-mint text-[#34936a]', mins: 4.2 },
  { id: 't9', title: 'Camino al mar', artist: 'Indie pop', tone: 'bg-peach text-[#c5733f]', mins: 3.4 },
  { id: 't10', title: 'Luces de neón', artist: 'Synthwave', tone: 'bg-pink-soft text-pink-deep', mins: 4.7 },
  { id: 't11', title: 'Lluvia y café', artist: 'Jazz suave', tone: 'bg-lavender text-[#7a63c0]', mins: 5.3 },
  { id: 't12', title: 'Domingo lento', artist: 'Acoustic', tone: 'bg-cream text-[#bf8f2e]', mins: 3.1 },
  { id: 't13', title: 'Vuelo nocturno', artist: 'Downtempo', tone: 'bg-sky-soft text-sky-deep', mins: 6.0 },
  { id: 't14', title: 'Brisa de verano', artist: 'Tropical house', tone: 'bg-mint text-[#34936a]', mins: 3.6 },
  { id: 't15', title: 'Estrellas fugaces', artist: 'Dream pop', tone: 'bg-lavender text-[#7a63c0]', mins: 4.0 },
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
  { id: 'pl6', name: 'Concentración total', count: 67, tone: 'bg-lavender', iconTone: 'text-[#7a63c0]' },
  { id: 'pl7', name: 'Cafetería', count: 45, tone: 'bg-cream', iconTone: 'text-[#bf8f2e]' },
  { id: 'pl8', name: 'Indie del bueno', count: 92, tone: 'bg-sky-soft', iconTone: 'text-sky-deep' },
  { id: 'pl9', name: 'Clásicos en español', count: 120, tone: 'bg-peach', iconTone: 'text-[#c5733f]' },
  { id: 'pl10', name: 'Noche tranquila', count: 38, tone: 'bg-lavender', iconTone: 'text-[#7a63c0]' },
  { id: 'pl11', name: 'Energía mañana', count: 54, tone: 'bg-mint', iconTone: 'text-[#34936a]' },
  { id: 'pl12', name: 'Fiesta en casa', count: 73, tone: 'bg-pink-soft', iconTone: 'text-pink-deep' },
  { id: 'pl13', name: 'Piano y lluvia', count: 29, tone: 'bg-sky-soft', iconTone: 'text-sky-deep' },
  { id: 'pl14', name: 'Viaje largo', count: 88, tone: 'bg-cream', iconTone: 'text-[#bf8f2e]' },
  { id: 'pl15', name: 'Descubrimiento semanal', count: 30, tone: 'bg-mint', iconTone: 'text-[#34936a]' },
]

const search = ref('')
function play(idx: number) { currentIdx.value = idx; playing.value = true; hasNowPlaying.value = true; progress.value = 0 }
function playPlaylist() { hasNowPlaying.value = true; playing.value = true; progress.value = 0 }
function disconnect() { connected.value = false; hasNowPlaying.value = false; playing.value = false; detailOpen.value = false }
const totalMins = computed(() => current.value.mins)
const elapsedSec = computed(() => Math.round(totalMins.value * 60 * progress.value / 100))
const totalSec = computed(() => Math.round(totalMins.value * 60))
function fmt(s: number) { return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}` }
</script>

<template>
  <div class="h-full flex flex-col gap-2 md:gap-3 px-3 md:px-7 py-3 md:py-5 relative overflow-hidden">
    <!-- Nubes decorativas de fondo (parte de la identidad de Hibi) -->
    <HibiCloud :size="180" float :duration="8" class="hidden md:block absolute -top-6 -right-10 text-sky-soft opacity-15 pointer-events-none z-40" aria-hidden="true" />
    <HibiCloud :size="120" float :duration="10" :delay="1.4" class="hidden md:block absolute bottom-10 -left-6 text-pink-soft opacity-15 pointer-events-none z-40" aria-hidden="true" />
    <HibiCloud :size="90" float :duration="12" :delay="0.7" class="hidden md:block absolute top-1/2 right-1/3 text-lavender opacity-15 pointer-events-none z-40" aria-hidden="true" />
    <HibiSparkle :size="20" twinkle :duration="2.4" class="hidden md:block absolute top-[14%] left-[8%] text-fg-subtle opacity-25 pointer-events-none z-40" />
    <HibiSparkle :size="14" twinkle :duration="3" :delay="0.8" class="hidden md:block absolute bottom-[28%] right-[10%] text-fg-subtle opacity-25 pointer-events-none z-40" />
    <HibiHeart :size="16" beat :duration="2.6" class="hidden md:block absolute top-[40%] left-[16%] text-fg-subtle opacity-25 pointer-events-none z-40" />

    <!-- Toolbar -->
    <div class="relative z-10">
      <PageHero :icon="Music" tone="mint" title="Spotify" :subtitle="connected ? t('spotify.status.connected') : t('spotify.status.disconnected')">
        <template #actions>
          <div v-if="connected" class="relative hidden lg:block">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 size-[16px] text-fg-subtle" :stroke-width="1.9" aria-hidden="true" />
            <input v-model="search" type="text" :placeholder="t('spotify.searchPlaceholder')"
              class="w-[260px] h-10 rounded-full bg-card pl-9 pr-3 text-[13.5px] text-fg outline-none" />
          </div>
          <div v-if="connected" class="hidden lg:block">
            <AppButton variant="secondary" size="sm" @click="disconnect">
              <template #icon><Plug class="size-[16px]" :stroke-width="2.2" /></template>
              {{ t('spotify.disconnect') }}
            </AppButton>
          </div>
        </template>
      </PageHero>
    </div>

    <!-- NO CONECTADO: estado centrado, SIN scroll -->
    <div v-if="!connected" class="flex-1 min-h-0 grid place-items-center relative z-10 px-4">
      <div class="text-center flex flex-col items-center gap-5 max-w-[360px]">
        <div class="relative">
          <HibiCloud :size="140" face class="text-mint" aria-hidden="true" />
          <HibiSparkle :size="20" twinkle :duration="2.2" class="absolute -top-1 right-6 text-[#34936a] opacity-90" />
          <span class="absolute -bottom-1 -right-2 grid place-items-center size-12 rounded-full bg-card text-[#34936a]">
            <Music class="size-6" :stroke-width="2" />
          </span>
        </div>
        <div>
          <h2 class="text-[22px] font-extrabold text-fg">{{ t('spotify.connect.title') }}</h2>
          <p class="text-[14px] text-fg-muted mt-1.5 leading-relaxed">{{ t('spotify.connect.desc') }}</p>
        </div>
        <button type="button" class="inline-flex items-center gap-2 h-[52px] px-8 rounded-full bg-sky text-[#1f4661] font-bold text-[16px]" @click="connected = true">
          <Plug class="size-[18px]" :stroke-width="2.2" /> {{ t('spotify.connect.cta') }}
        </button>
        <p class="text-[12px] text-fg-subtle">{{ t('spotify.connect.demo') }}</p>
      </div>
    </div>

    <!-- CONECTADO -->
    <div v-else class="flex flex-col flex-1 min-h-0 gap-2 md:gap-3 relative z-10">

      <!-- ═══ MÓVIL: pestañas Playlists/Cola + mini-reproductor (toca → vista detalle) ═══ -->
      <div class="lg:hidden flex flex-col flex-1 min-h-0 gap-2">
        <div class="shrink-0 flex items-center gap-2">
          <AppSegmented v-model="subtab" block class="flex-1 min-w-0" :options="[{ value: 'playlists', label: t('spotify.tabs.playlists') }, { value: 'queue', label: t('spotify.tabs.queue') }]" />
          <button type="button" class="shrink-0 grid place-items-center size-10 rounded-full bg-muted text-fg-muted active:bg-inset" :aria-label="t('spotify.disconnectAria')" @click="disconnect">
            <Plug class="size-[17px]" :stroke-width="2.2" />
          </button>
        </div>
        <div class="flex-1 min-h-0 overflow-y-auto scroll-area flex flex-col gap-2">
          <!-- PLAYLISTS -->
          <ul v-if="subtab === 'playlists'" class="hibi-anim-rotate flex flex-col gap-2">
            <li v-for="p in playlists" :key="p.id">
              <div role="button" tabindex="0"
                class="flex items-center gap-3 p-3 rounded-[14px] bg-card cursor-pointer active:bg-muted outline-none focus-visible:ring-2 focus-visible:ring-sky-deep"
                @click="playPlaylist" @keydown.enter.prevent="playPlaylist" @keydown.space.prevent="playPlaylist">
                <HibiCloudIcon :size="56" :icon="Disc3" :icon-size="19" :cloud-color="p.tone" :icon-color="p.iconTone" :icon-stroke="1.9" class="shrink-0" />
                <div class="flex-1 min-w-0">
                  <p class="text-[15px] font-bold text-fg truncate">{{ p.name }}</p>
                  <p class="text-[12.5px] text-fg-muted">{{ t('spotify.songs', { count: p.count }) }}</p>
                </div>
                <span class="grid place-items-center size-9 rounded-full bg-sky-soft text-sky-deep shrink-0"><Play class="size-4 fill-current" :stroke-width="0" /></span>
              </div>
            </li>
          </ul>
          <!-- COLA -->
          <ul v-else class="hibi-anim-slide-left flex flex-col gap-1.5">
            <li v-for="(tr, i) in queue" :key="tr.id">
              <button type="button"
                class="w-full flex items-center gap-3 p-3 rounded-[14px] transition-[background-color] text-left"
                :class="i === currentIdx && hasNowPlaying ? 'bg-sky-soft' : 'bg-card active:bg-muted'"
                @click="play(i)">
                <HibiCloudIcon :size="52" :icon="Headphones" :icon-size="17" :cloud-color="tr.tone.split(' ')[0]" :icon-color="tr.tone.split(' ')[1] || 'text-fg'" :icon-stroke="1.9" class="shrink-0" />
                <div class="flex-1 min-w-0">
                  <p class="text-[14.5px] font-semibold text-fg truncate">{{ tr.title }}</p>
                  <p class="text-[12.5px] text-fg-muted truncate">{{ tr.artist }}</p>
                </div>
                <span class="text-[12px] font-bold tabular-nums shrink-0" :class="i === currentIdx && hasNowPlaying ? 'text-sky-deep' : 'text-fg-subtle'">{{ tr.mins.toFixed(1) }} min</span>
              </button>
            </li>
          </ul>
        </div>
        <!-- Mini-reproductor fijo -->
        <div v-if="hasNowPlaying" role="button" tabindex="0"
          class="shrink-0 w-full flex items-center gap-3 p-2.5 rounded-[16px] bg-sky-soft cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-sky-deep"
          @click="detailOpen = true" @keydown.enter.prevent="detailOpen = true">
          <span class="grid place-items-center size-12 rounded-[12px] shrink-0" :class="current.tone"><Headphones class="size-6" :stroke-width="1.7" /></span>
          <div class="flex-1 min-w-0">
            <p class="text-[14px] font-bold text-fg truncate">{{ current.title }}</p>
            <p class="text-[12px] text-sky-deep/80 truncate">{{ current.artist }}</p>
          </div>
          <button type="button" class="grid place-items-center size-11 rounded-full bg-sky text-[#1f4661] shrink-0" :aria-label="playing ? t('spotify.controls.pause') : t('spotify.controls.play')" @click.stop="playing = !playing">
            <component :is="playing ? Pause : Play" class="size-5" :stroke-width="playing ? 2 : 0" :class="playing ? '' : 'fill-current'" />
          </button>
          <button type="button" class="grid place-items-center size-10 rounded-full text-sky-deep shrink-0" :aria-label="t('spotify.controls.next')" @click.stop="nextTrack"><SkipForward class="size-5" :stroke-width="2" /></button>
        </div>
      </div>

      <!-- ═══ DESKTOP: reproductor + playlists + cola (como estaba) ═══ -->
      <div class="hidden lg:grid lg:grid-cols-[1fr_360px] lg:gap-3 flex-1 min-h-0 overflow-hidden">
        <div class="flex flex-col gap-3 min-h-0 overflow-y-auto scroll-area pr-1">
          <!-- Reproductor: solo cuando hay algo sonando -->
          <AppCard v-if="hasNowPlaying" class="!p-6 flex flex-row items-center gap-6 shrink-0 relative overflow-hidden">
            <HibiCloud :size="80" class="absolute top-2 right-2 text-card opacity-15 pointer-events-none z-40" aria-hidden="true" />
            <div class="grid relative shrink-0 place-items-center w-[180px] h-[180px] rounded-[22px]" :class="current.tone">
              <Headphones class="size-12" :stroke-width="1.6" />
            </div>
            <div class="flex-1 min-w-0 flex flex-col gap-3">
              <div class="flex items-start gap-3">
                <div class="min-w-0 flex-1">
                  <p class="text-[12px] font-bold text-fg-muted uppercase tracking-wide">{{ t('spotify.nowPlaying') }}</p>
                  <h2 class="text-[26px] font-extrabold text-fg leading-tight truncate mt-0.5">{{ current.title }}</h2>
                  <p class="text-[14px] text-fg-muted truncate">{{ current.artist }}</p>
                </div>
                <button class="shrink-0 grid place-items-center size-10 rounded-full transition-[background-color,color]"
                  :class="liked ? 'bg-pink-soft text-pink-deep' : 'bg-muted text-fg-muted'"
                  @click="liked = !liked" :aria-label="liked ? t('spotify.controls.unlike') : t('spotify.controls.like')">
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
                <button class="grid place-items-center size-10 rounded-full text-fg-muted" :aria-label="t('spotify.controls.shuffle')"><Shuffle class="size-[17px]" :stroke-width="2" /></button>
                <button class="grid place-items-center size-11 rounded-full text-fg-muted" :aria-label="t('spotify.controls.prev')" @click="prevTrack"><SkipBack class="size-5" :stroke-width="2" /></button>
                <button class="grid place-items-center size-14 rounded-full bg-sky text-[#1f4661]" @click="playing = !playing" :aria-label="playing ? t('spotify.controls.pause') : t('spotify.controls.play')">
                  <component :is="playing ? Pause : Play" class="size-6" :stroke-width="playing ? 2 : 0" :class="playing ? '' : 'fill-current'" />
                </button>
                <button class="grid place-items-center size-11 rounded-full text-fg-muted" :aria-label="t('spotify.controls.next')" @click="nextTrack"><SkipForward class="size-5" :stroke-width="2" /></button>
                <button class="grid place-items-center size-10 rounded-full text-fg-muted" :aria-label="t('spotify.controls.repeat')"><Repeat class="size-[17px]" :stroke-width="2" /></button>
              </div>
            </div>
          </AppCard>

          <!-- Playlists -->
          <AppCard class="!p-5 flex-1 min-h-0 flex flex-col">
            <div class="flex items-center justify-between mb-3 shrink-0">
              <h3 class="text-[13px] font-bold text-fg-muted">{{ t('spotify.playlists.title') }}</h3>
              <span class="text-[11.5px] font-bold text-fg-subtle">{{ t('spotify.playlists.saved', { count: playlists.length }) }}</span>
            </div>
            <ul class="hibi-anim-rotate flex-1 min-h-0 overflow-y-auto scroll-area flex flex-col gap-2 pr-1">
              <li v-for="p in playlists" :key="p.id"
                class="flex items-center gap-3 p-3 rounded-[12px] bg-muted cursor-pointer"
                @click="playPlaylist">
                <HibiCloudIcon :size="58" :icon="Disc3" :icon-size="19" :cloud-color="p.tone" :icon-color="p.iconTone" :icon-stroke="1.9" class="shrink-0" />
                <div class="flex-1 min-w-0">
                  <p class="text-[14px] font-bold text-fg truncate">{{ p.name }}</p>
                  <p class="text-[12px] text-fg-muted">{{ t('spotify.songs', { count: p.count }) }}</p>
                </div>
                <button class="grid place-items-center size-9 rounded-full bg-card text-sky-deep shrink-0" :aria-label="t('spotify.controls.play')" @click.stop="playPlaylist">
                  <Play class="size-4 fill-current" :stroke-width="0" />
                </button>
              </li>
            </ul>
          </AppCard>
        </div>

        <!-- Cola -->
        <AppCard class="flex flex-col min-h-0" :padded="false">
          <header class="px-5 pt-5 pb-3 shrink-0 flex items-center justify-between">
            <h3 class="text-[14px] font-bold text-fg">{{ t('spotify.queue.title') }}</h3>
            <span class="text-[11.5px] text-fg-muted font-semibold">{{ t('spotify.songs', { count: queue.length }) }}</span>
          </header>
          <ul class="hibi-anim-slide-left flex-1 min-h-0 overflow-y-auto scroll-area px-2 pb-4 flex flex-col gap-1">
            <li v-for="(tr, i) in queue" :key="tr.id">
              <button type="button"
                class="w-full flex items-center gap-3 p-2.5 rounded-[12px] transition-[background-color] text-left"
                :class="i === currentIdx && hasNowPlaying ? 'bg-sky-soft' : ''"
                @click="play(i)">
                <HibiCloudIcon :size="54" :icon="Headphones" :icon-size="17" :cloud-color="tr.tone.split(' ')[0]" :icon-color="tr.tone.split(' ')[1] || 'text-fg'" :icon-stroke="1.9" class="shrink-0" />
                <div class="flex-1 min-w-0">
                  <p class="text-[14px] font-semibold text-fg truncate">{{ tr.title }}</p>
                  <p class="text-[12px] text-fg-muted truncate">{{ tr.artist }}</p>
                </div>
                <span class="text-[11.5px] font-bold tabular-nums" :class="i === currentIdx && hasNowPlaying ? 'text-sky-deep' : 'text-fg-subtle'">{{ tr.mins.toFixed(1) }} min</span>
              </button>
            </li>
          </ul>
        </AppCard>
      </div>
    </div>

    <!-- VISTA DETALLE: reproductor completo a pantalla completa -->
    <ClientOnly>
      <Teleport to="body">
        <Transition name="sheet-up">
          <div v-if="detailOpen && connected" class="fixed inset-0 z-[60] bg-base flex flex-col px-5 pb-8" style="padding-top: max(1rem, env(safe-area-inset-top))">
            <header class="shrink-0 flex items-center justify-between">
              <button type="button" class="grid place-items-center size-10 rounded-full bg-muted text-fg-muted" :aria-label="t('spotify.controls.minimize')" @click="detailOpen = false; detailQueueOpen = false"><ChevronDown class="size-[20px]" :stroke-width="2.2" /></button>
              <p class="text-[12px] font-bold text-fg-muted uppercase tracking-wide">{{ t('spotify.nowPlayingShort') }}</p>
              <button type="button" class="grid place-items-center size-10 rounded-full transition-[background-color,color]" :class="liked ? 'bg-pink-soft text-pink-deep' : 'bg-muted text-fg-muted'" :aria-label="liked ? t('spotify.controls.unlike') : t('spotify.controls.like')" @click="liked = !liked"><Heart class="size-[18px]" :class="liked ? 'fill-current' : ''" :stroke-width="liked ? 0 : 2" /></button>
            </header>
            <!-- Portada grande -->
            <div class="flex-1 min-h-0 grid place-items-center py-4">
              <div class="grid place-items-center w-full max-w-[300px] aspect-square rounded-[28px]" :class="current.tone">
                <Headphones class="size-20" :stroke-width="1.4" />
              </div>
            </div>
            <!-- Info -->
            <div class="shrink-0 text-center">
              <h2 class="text-[24px] font-extrabold text-fg leading-tight truncate">{{ current.title }}</h2>
              <p class="text-[14px] text-fg-muted mt-1">{{ current.artist }}</p>
            </div>
            <!-- Progreso -->
            <div class="shrink-0 flex items-center gap-3 mt-5">
              <span class="text-[11.5px] text-fg-muted tabular-nums w-10 text-right">{{ fmt(elapsedSec) }}</span>
              <div class="flex-1 h-2 rounded-full bg-muted overflow-hidden cursor-pointer"
                @click="(e) => { const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); progress = Math.round(((e.clientX - r.left) / r.width) * 100) }">
                <div class="h-full rounded-full bg-sky-deep" :style="{ width: progress + '%' }"></div>
              </div>
              <span class="text-[11.5px] text-fg-muted tabular-nums w-10">{{ fmt(totalSec) }}</span>
            </div>
            <!-- Controles -->
            <div class="shrink-0 flex items-center justify-center gap-3 mt-5">
              <button class="grid place-items-center size-11 rounded-full text-fg-muted" :aria-label="t('spotify.controls.shuffle')"><Shuffle class="size-[18px]" :stroke-width="2" /></button>
              <button class="grid place-items-center size-12 rounded-full text-fg-muted" :aria-label="t('spotify.controls.prev')" @click="prevTrack"><SkipBack class="size-6" :stroke-width="2" /></button>
              <button class="grid place-items-center size-16 rounded-full bg-sky text-[#1f4661]" :aria-label="playing ? t('spotify.controls.pause') : t('spotify.controls.play')" @click="playing = !playing"><component :is="playing ? Pause : Play" class="size-7" :stroke-width="playing ? 2 : 0" :class="playing ? '' : 'fill-current'" /></button>
              <button class="grid place-items-center size-12 rounded-full text-fg-muted" :aria-label="t('spotify.controls.next')" @click="nextTrack"><SkipForward class="size-6" :stroke-width="2" /></button>
              <button class="grid place-items-center size-11 rounded-full text-fg-muted" :aria-label="t('spotify.controls.repeat')"><Repeat class="size-[18px]" :stroke-width="2" /></button>
            </div>
            <!-- Ver cola desde el reproductor -->
            <button type="button" class="shrink-0 mt-5 mx-auto inline-flex items-center gap-2 h-10 px-5 rounded-full bg-muted text-fg-muted text-[13px] font-bold" @click="detailQueueOpen = true">
              <ListMusic class="size-[16px]" :stroke-width="2" /> {{ t('spotify.queue.view', { count: queue.length }) }}
            </button>

            <!-- Sheet de la cola (dentro del reproductor) -->
            <Transition name="sheet-up">
              <div v-if="detailQueueOpen" class="absolute inset-0 z-10 flex flex-col justify-end">
                <button type="button" class="absolute inset-0 bg-fg/20" :aria-label="t('spotify.queue.close')" @click="detailQueueOpen = false" />
                <div class="relative bg-base rounded-t-[26px] max-h-[78%] flex flex-col px-4 pt-2 pb-6">
                  <div class="shrink-0 flex flex-col items-center pb-1"><span class="block w-10 h-1.5 rounded-full bg-muted" /></div>
                  <header class="shrink-0 flex items-center justify-between px-1 pb-2">
                    <h3 class="text-[16px] font-extrabold text-fg">{{ t('spotify.queue.titleCount', { count: queue.length }) }}</h3>
                    <button type="button" class="grid place-items-center size-9 rounded-full bg-muted text-fg-muted" :aria-label="t('common.close')" @click="detailQueueOpen = false"><ChevronDown class="size-[18px]" :stroke-width="2.2" /></button>
                  </header>
                  <ul class="flex-1 min-h-0 overflow-y-auto scroll-area flex flex-col gap-1">
                    <li v-for="(tr, i) in queue" :key="tr.id">
                      <button type="button"
                        class="w-full flex items-center gap-3 p-2.5 rounded-[12px] transition-[background-color] text-left"
                        :class="i === currentIdx ? 'bg-sky-soft' : 'active:bg-muted'"
                        @click="play(i); detailQueueOpen = false">
                        <HibiCloudIcon :size="48" :icon="Headphones" :icon-size="16" :cloud-color="tr.tone.split(' ')[0]" :icon-color="tr.tone.split(' ')[1] || 'text-fg'" :icon-stroke="1.9" class="shrink-0" />
                        <div class="flex-1 min-w-0">
                          <p class="text-[14px] font-semibold text-fg truncate">{{ tr.title }}</p>
                          <p class="text-[12px] text-fg-muted truncate">{{ tr.artist }}</p>
                        </div>
                        <span class="text-[11.5px] font-bold tabular-nums shrink-0" :class="i === currentIdx ? 'text-sky-deep' : 'text-fg-subtle'">{{ tr.mins.toFixed(1) }} min</span>
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </Transition>
          </div>
        </Transition>
      </Teleport>
    </ClientOnly>
  </div>
</template>

<style scoped>
.sheet-up-enter-active, .sheet-up-leave-active { transition: transform 0.32s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.25s ease; }
.sheet-up-enter-from, .sheet-up-leave-to { transform: translateY(100%); opacity: 0.6; }
@media (prefers-reduced-motion: reduce) {
  .sheet-up-enter-active, .sheet-up-leave-active { transition: opacity 0.2s ease; }
  .sheet-up-enter-from, .sheet-up-leave-to { transform: none; }
}
</style>
