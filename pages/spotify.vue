<script setup lang="ts">
import { Music, Play, Pause, Heart, Headphones, Plug, SkipBack, SkipForward, Shuffle, Repeat, Search, Disc3, ChevronDown, ListMusic, Volume2, VolumeX } from '@lucide/vue'

const { t } = useI18n()
useHead({ title: t('spotify.head.title') })

const route = useRoute()
const sp = useSpotify()
const { status, playlists: rawPlaylists, queue: sdkNext, current: sdkCurrent, paused, position, duration, volume } = sp

const loading = ref(true)
const liked = ref(false)
const subtab = ref<'playlists' | 'queue'>('playlists')
const detailOpen = ref(false)
const detailQueueOpen = ref(false)
const search = ref('')

onMounted(async () => {
  await sp.fetchStatus()
  if (status.value.connected) {
    await sp.fetchPlaylists()
    if (status.value.premium) sp.ensurePlayer()
  }
  loading.value = false
})

const connected = computed(() => status.value.connected)

// Playlists reales, mapeadas a la forma del diseño (con color de nube por índice).
const TONES = [
  ['bg-pink-soft', 'text-pink-deep'], ['bg-sky-soft', 'text-sky-deep'], ['bg-peach', 'text-[#c5733f]'],
  ['bg-cream', 'text-[#bf8f2e]'], ['bg-mint', 'text-[#34936a]'], ['bg-lavender', 'text-[#7a63c0]'],
]
const playlists = computed(() => (rawPlaylists.value || [])
  .filter((p) => !search.value || p.name.toLowerCase().includes(search.value.toLowerCase()))
  .map((p, i) => ({ id: p.id, name: p.name, count: p.tracks, uri: p.uri, image: p.image, tone: TONES[i % TONES.length]![0], iconTone: TONES[i % TONES.length]![1] })))

// Cola real: pista actual + siguientes del reproductor.
const queue = computed(() => {
  const list = [...(sdkCurrent.value ? [sdkCurrent.value] : []), ...(sdkNext.value || [])]
  return list.map((tr, i) => ({ id: tr.uri || String(i), title: tr.name, artist: tr.artists, uri: tr.uri, image: tr.image, tone: TONES[i % TONES.length]!.join(' '), mins: (tr.durationMs || 0) / 60000 }))
})
const currentIdx = computed(() => (sdkCurrent.value ? 0 : -1))
const hasNowPlaying = computed(() => !!sdkCurrent.value)
const current = computed(() => ({
  title: sdkCurrent.value?.name || '',
  artist: sdkCurrent.value?.artists || '',
  image: sdkCurrent.value?.image || null,
  tone: 'bg-sky-soft text-sky-deep',
  mins: (duration.value || 0) / 60000,
}))

const playing = computed({ get: () => !paused.value, set: () => sp.togglePlay() })
const progress = computed({
  get: () => (duration.value ? Math.min(100, (position.value / duration.value) * 100) : 0),
  set: (v: number) => sp.seek(Math.round((v / 100) * duration.value)),
})
const elapsedSec = computed(() => Math.round((position.value || 0) / 1000))
const totalSec = computed(() => Math.round((duration.value || 0) / 1000))
function fmt(s: number) { return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` }

function nextTrack() { sp.next() }
function prevTrack() { sp.prev() }
function play(idx: number) { const tr = queue.value[idx]; if (tr?.uri) sp.playUris([tr.uri]) }
function openInSpotify(uri: string) {
  const parts = (uri || '').split(':'); const id = parts.pop(); const type = parts[1]
  if (id && type && import.meta.client) window.open(`https://open.spotify.com/${type}/${id}`, '_blank')
}
async function onPlayPlaylist(p: { uri: string }) {
  if (status.value.premium) { const ok = await sp.playContext(p.uri); if (!ok) openInSpotify(p.uri) }
  else openInSpotify(p.uri)
}
function disconnect() { sp.disconnect() }
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
      <PageHero :icon="Music" tone="mint" title="Spotify" :subtitle="connected ? (status.displayName || t('spotify.status.connected')) : t('spotify.status.disconnected')">
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

    <!-- CARGANDO -->
    <div v-if="loading" class="flex-1 min-h-0 grid place-items-center relative z-10">
      <HibiCloud :size="120" face class="text-mint hibi-anim-pop" aria-hidden="true" />
    </div>

    <!-- NO CONECTADO: estado centrado, SIN scroll -->
    <div v-else-if="!connected" class="flex-1 min-h-0 grid place-items-center relative z-10 px-4">
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
        <button type="button" class="inline-flex items-center gap-2 h-[52px] px-8 rounded-full bg-sky text-[#1f4661] font-bold text-[16px]" @click="sp.connect()">
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
                @click="onPlayPlaylist(p)" @keydown.enter.prevent="onPlayPlaylist(p)" @keydown.space.prevent="onPlayPlaylist(p)">
                <HibiCloudImage :src="p.image" :size="56" :tone="p.tone.replace('bg-', 'text-')" />
                <div class="flex-1 min-w-0">
                  <p class="text-[15px] font-bold text-fg truncate">{{ p.name }}</p>
                  <p v-if="p.count" class="text-[12.5px] text-fg-muted">{{ t('spotify.songs', { count: p.count }) }}</p>
                </div>
                <span class="grid place-items-center size-9 rounded-full bg-sky-soft text-sky-deep shrink-0"><Play class="size-4 fill-current" :stroke-width="0" /></span>
              </div>
            </li>
          </ul>
          <!-- COLA -->
          <ul v-else class="hibi-anim-slide-left flex flex-col gap-1.5">
            <li v-if="!queue.length" class="text-center text-fg-muted text-[13.5px] py-6">{{ t('spotify.pickPlaylist') }}</li>
            <li v-for="(tr, i) in queue" :key="tr.id">
              <button type="button"
                class="w-full flex items-center gap-3 p-3 rounded-[14px] transition-[background-color] text-left"
                :class="i === currentIdx && hasNowPlaying ? 'bg-sky-soft' : 'bg-card active:bg-muted'"
                @click="play(i)">
                <HibiCloudImage :src="tr.image" :size="52" :tone="tr.tone.split(' ')[0].replace('bg-', 'text-')" />
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
          <HibiCloudImage :src="current.image" :size="48" tone="text-sky" class="shrink-0" />
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

      <!-- ═══ DESKTOP: reproductor + playlists + cola ═══ -->
      <div class="hidden lg:grid lg:grid-cols-[1fr_360px] lg:gap-3 flex-1 min-h-0 overflow-hidden">
        <div class="flex flex-col gap-3 min-h-0 overflow-y-auto scroll-area pr-1">
          <!-- Reproductor: solo cuando hay algo sonando -->
          <AppCard v-if="hasNowPlaying" class="!p-6 flex flex-row items-center gap-6 shrink-0 relative overflow-hidden">
            <HibiCloud :size="80" class="absolute top-2 right-2 text-card opacity-15 pointer-events-none z-40" aria-hidden="true" />
            <div class="shrink-0 flex flex-col items-center gap-2.5">
              <HibiCloudImage :src="current.image" :size="180" tone="text-sky-soft" />
              <div class="flex items-center gap-2 w-[180px]">
                <button type="button" class="grid place-items-center size-7 rounded-full text-fg-muted shrink-0 hover:text-sky-deep transition-colors" :aria-label="volume > 0 ? t('spotify.controls.mute') : t('spotify.controls.unmute')" @click="sp.toggleMute()">
                  <component :is="volume > 0 ? Volume2 : VolumeX" class="size-[16px]" :stroke-width="2" />
                </button>
                <input type="range" min="0" max="1" step="0.02" :value="volume" class="hibi-range flex-1" :aria-label="t('spotify.controls.volume')" @input="(e) => sp.setVolume(+(e.target as HTMLInputElement).value)" />
              </div>
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
                  <div class="h-full rounded-full bg-sky-deep" :style="{ width: progress + '%', transition: 'width 0.25s linear' }"></div>
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
                @click="onPlayPlaylist(p)">
                <HibiCloudImage :src="p.image" :size="58" :tone="p.tone.replace('bg-', 'text-')" />
                <div class="flex-1 min-w-0">
                  <p class="text-[14px] font-bold text-fg truncate">{{ p.name }}</p>
                  <p v-if="p.count" class="text-[12px] text-fg-muted">{{ t('spotify.songs', { count: p.count }) }}</p>
                </div>
                <button class="grid place-items-center size-9 rounded-full bg-card text-sky-deep shrink-0" :aria-label="t('spotify.controls.play')" @click.stop="onPlayPlaylist(p)">
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
            <li v-if="!queue.length" class="text-center text-fg-muted text-[13px] py-8 px-4">{{ t('spotify.pickPlaylist') }}</li>
            <li v-for="(tr, i) in queue" :key="tr.id">
              <button type="button"
                class="w-full flex items-center gap-3 p-2.5 rounded-[12px] transition-[background-color] text-left"
                :class="i === currentIdx && hasNowPlaying ? 'bg-sky-soft' : ''"
                @click="play(i)">
                <HibiCloudImage :src="tr.image" :size="54" :tone="tr.tone.split(' ')[0].replace('bg-', 'text-')" />
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
            <div class="flex-1 min-h-0 grid place-items-center py-4">
              <HibiCloudImage :src="current.image" :size="270" tone="text-sky-soft" />
            </div>
            <div class="shrink-0 text-center">
              <h2 class="text-[24px] font-extrabold text-fg leading-tight truncate">{{ current.title }}</h2>
              <p class="text-[14px] text-fg-muted mt-1">{{ current.artist }}</p>
            </div>
            <div class="shrink-0 flex items-center gap-3 mt-5">
              <span class="text-[11.5px] text-fg-muted tabular-nums w-10 text-right">{{ fmt(elapsedSec) }}</span>
              <div class="flex-1 h-2 rounded-full bg-muted overflow-hidden cursor-pointer"
                @click="(e) => { const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); progress = Math.round(((e.clientX - r.left) / r.width) * 100) }">
                <div class="h-full rounded-full bg-sky-deep" :style="{ width: progress + '%', transition: 'width 0.25s linear' }"></div>
              </div>
              <span class="text-[11.5px] text-fg-muted tabular-nums w-10">{{ fmt(totalSec) }}</span>
            </div>
            <div class="shrink-0 flex items-center justify-center gap-3 mt-5">
              <button class="grid place-items-center size-11 rounded-full text-fg-muted" :aria-label="t('spotify.controls.shuffle')"><Shuffle class="size-[18px]" :stroke-width="2" /></button>
              <button class="grid place-items-center size-12 rounded-full text-fg-muted" :aria-label="t('spotify.controls.prev')" @click="prevTrack"><SkipBack class="size-6" :stroke-width="2" /></button>
              <button class="grid place-items-center size-16 rounded-full bg-sky text-[#1f4661]" :aria-label="playing ? t('spotify.controls.pause') : t('spotify.controls.play')" @click="playing = !playing"><component :is="playing ? Pause : Play" class="size-7" :stroke-width="playing ? 2 : 0" :class="playing ? '' : 'fill-current'" /></button>
              <button class="grid place-items-center size-12 rounded-full text-fg-muted" :aria-label="t('spotify.controls.next')" @click="nextTrack"><SkipForward class="size-6" :stroke-width="2" /></button>
              <button class="grid place-items-center size-11 rounded-full text-fg-muted" :aria-label="t('spotify.controls.repeat')"><Repeat class="size-[18px]" :stroke-width="2" /></button>
            </div>
            <div class="shrink-0 flex items-center gap-2.5 mt-5 px-6">
              <button type="button" class="grid place-items-center size-8 rounded-full text-fg-muted shrink-0" :aria-label="volume > 0 ? t('spotify.controls.mute') : t('spotify.controls.unmute')" @click="sp.toggleMute()">
                <component :is="volume > 0 ? Volume2 : VolumeX" class="size-[18px]" :stroke-width="2" />
              </button>
              <input type="range" min="0" max="1" step="0.02" :value="volume" class="hibi-range flex-1" :aria-label="t('spotify.controls.volume')" @input="(e) => sp.setVolume(+(e.target as HTMLInputElement).value)" />
            </div>
            <button type="button" class="shrink-0 mt-5 mx-auto inline-flex items-center gap-2 h-10 px-5 rounded-full bg-muted text-fg-muted text-[13px] font-bold" @click="detailQueueOpen = true">
              <ListMusic class="size-[16px]" :stroke-width="2" /> {{ t('spotify.queue.view', { count: queue.length }) }}
            </button>

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
                        <HibiCloudImage :src="tr.image" :size="48" :tone="tr.tone.split(' ')[0].replace('bg-', 'text-')" />
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
/* Slider de volumen sin bordes, con la estética de Hibi. */
.hibi-range { -webkit-appearance: none; appearance: none; width: 100%; height: 4px; border-radius: 9999px; background: var(--bg-muted); cursor: pointer; outline: none; }
.hibi-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 13px; height: 13px; border-radius: 50%; background: var(--color-sky-deep); border: none; cursor: pointer; }
.hibi-range::-moz-range-thumb { width: 13px; height: 13px; border-radius: 50%; background: var(--color-sky-deep); border: none; cursor: pointer; }
.hibi-range::-moz-range-track { height: 4px; border-radius: 9999px; background: var(--bg-muted); }

.sheet-up-enter-active, .sheet-up-leave-active { transition: transform 0.32s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.25s ease; }
.sheet-up-enter-from, .sheet-up-leave-to { transform: translateY(100%); opacity: 0.6; }
@media (prefers-reduced-motion: reduce) {
  .sheet-up-enter-active, .sheet-up-leave-active { transition: opacity 0.2s ease; }
  .sheet-up-enter-from, .sheet-up-leave-to { transform: none; }
}
</style>
