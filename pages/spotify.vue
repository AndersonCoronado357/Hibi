<script setup lang="ts">
import { Music, Play, Pause, Plug, SkipBack, SkipForward, Disc3, ExternalLink } from '@lucide/vue'

const { t } = useI18n()
useHead({ title: t('spotify.head.title') })

const route = useRoute()
const sp = useSpotify()
const { status, playlists, current, paused, position, duration } = sp

const loading = ref(true)
const notice = ref<'' | 'connected' | 'error'>('')

onMounted(async () => {
  const q = String(route.query.spotify || '')
  if (q === 'connected' || q === 'error') {
    notice.value = q
    setTimeout(() => { notice.value = '' }, 3200)
  }
  await sp.fetchStatus()
  if (status.value.connected) {
    await sp.fetchPlaylists()
    if (status.value.premium) sp.ensurePlayer()
  }
  loading.value = false
})

const pct = computed(() => (duration.value ? Math.min(100, (position.value / duration.value) * 100) : 0))
function fmt(ms: number) { const s = Math.round((ms || 0) / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` }

const PL_TONES = ['bg-sky-soft text-sky-deep', 'bg-mint text-[#34936a]', 'bg-peach text-[#c5733f]', 'bg-pink-soft text-pink-deep', 'bg-lavender text-[#7a63c0]', 'bg-cream text-[#bf8f2e]']
function tone(i: number) { return PL_TONES[i % PL_TONES.length]! }

function openInSpotify(uri: string) {
  const id = (uri || '').split(':').pop()
  const type = (uri || '').split(':')[1]
  if (id && type && import.meta.client) window.open(`https://open.spotify.com/${type}/${id}`, '_blank')
}
async function onPlayPlaylist(p: { uri: string }) {
  if (status.value.premium) { const ok = await sp.playContext(p.uri); if (!ok) openInSpotify(p.uri) }
  else openInSpotify(p.uri)
}
</script>

<template>
  <div class="h-full flex flex-col gap-2 md:gap-3 px-3 md:px-7 py-3 md:py-5 relative overflow-hidden">
    <!-- Nubes decorativas (identidad de Hibi) -->
    <HibiCloud :size="180" float :duration="8" class="hidden md:block absolute -top-6 -right-10 text-sky-soft opacity-15 pointer-events-none z-40" aria-hidden="true" />
    <HibiCloud :size="120" float :duration="10" :delay="1.4" class="hidden md:block absolute bottom-10 -left-6 text-pink-soft opacity-15 pointer-events-none z-40" aria-hidden="true" />
    <HibiSparkle :size="20" twinkle :duration="2.4" class="hidden md:block absolute top-[14%] left-[8%] text-fg-subtle opacity-25 pointer-events-none z-40" />

    <!-- Header -->
    <div class="relative z-10">
      <PageHero :icon="Music" tone="mint" title="Spotify" :subtitle="status.connected ? (status.displayName || t('spotify.status.connected')) : t('spotify.status.disconnected')">
        <template #actions>
          <div v-if="status.connected" class="hidden lg:block">
            <AppButton variant="secondary" size="sm" @click="sp.disconnect()">
              <template #icon><Plug class="size-[16px]" :stroke-width="2.2" /></template>
              {{ t('spotify.disconnect') }}
            </AppButton>
          </div>
        </template>
      </PageHero>
    </div>

    <!-- Aviso conexión (toast simple) -->
    <Transition name="chips">
      <p v-if="notice" class="relative z-10 shrink-0 rounded-[12px] px-3.5 py-2.5 text-[13px] font-semibold"
        :class="notice === 'connected' ? 'bg-mint text-[#34936a]' : 'bg-pink-soft text-pink-deep'">
        {{ notice === 'connected' ? t('spotify.linked') : t('spotify.linkError') }}
      </p>
    </Transition>

    <!-- CARGANDO -->
    <div v-if="loading" class="flex-1 min-h-0 grid place-items-center relative z-10">
      <HibiCloud :size="120" face class="text-mint hibi-anim-pop" aria-hidden="true" />
    </div>

    <!-- NO CONECTADO -->
    <div v-else-if="!status.connected" class="flex-1 min-h-0 grid place-items-center relative z-10 px-4">
      <div class="text-center flex flex-col items-center gap-5 max-w-[360px]">
        <div class="relative">
          <HibiCloud :size="140" face class="text-mint" aria-hidden="true" />
          <span class="absolute -bottom-1 -right-2 grid place-items-center size-12 rounded-full bg-card text-[#34936a]"><Music class="size-6" :stroke-width="2" /></span>
        </div>
        <div>
          <h2 class="text-[22px] font-extrabold text-fg">{{ t('spotify.connect.title') }}</h2>
          <p class="text-[14px] text-fg-muted mt-1.5 leading-relaxed">{{ t('spotify.connect.desc') }}</p>
        </div>
        <button type="button" class="inline-flex items-center gap-2 h-[52px] px-8 rounded-full bg-sky text-[#1f4661] font-bold text-[16px] hover:brightness-[0.97] transition-[filter]" @click="sp.connect()">
          <Plug class="size-[18px]" :stroke-width="2.2" /> {{ t('spotify.connect.cta') }}
        </button>
        <p class="text-[12px] text-fg-subtle">{{ t('spotify.connect.demo') }}</p>
      </div>
    </div>

    <!-- CONECTADO -->
    <div v-else class="flex flex-col flex-1 min-h-0 gap-2 md:gap-3 relative z-10">
      <!-- Playlists reales -->
      <div class="flex-1 min-h-0 overflow-y-auto scroll-area">
        <div v-if="!playlists.length" class="h-full grid place-items-center text-center text-fg-muted text-[14px] px-6">
          {{ t('spotify.pickPlaylist') }}
        </div>
        <ul v-else class="hibi-anim-rotate grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 md:gap-3 pb-2">
          <li v-for="(p, i) in playlists" :key="p.id">
            <button type="button"
              class="w-full flex items-center gap-3 p-3 rounded-[14px] bg-card hover:bg-muted transition-[background-color] text-left"
              @click="onPlayPlaylist(p)">
              <img v-if="p.image" :src="p.image" :alt="p.name" class="size-[56px] rounded-[12px] object-cover shrink-0" loading="lazy" />
              <HibiCloudIcon v-else :size="56" :icon="Disc3" :icon-size="19" :cloud-color="tone(i).split(' ')[0]" :icon-color="tone(i).split(' ')[1]" :icon-stroke="1.9" class="shrink-0" />
              <div class="flex-1 min-w-0">
                <p class="text-[15px] font-bold text-fg truncate">{{ p.name }}</p>
                <p class="text-[12.5px] text-fg-muted">{{ t('spotify.songs', { count: p.tracks }) }}</p>
              </div>
              <span class="grid place-items-center size-9 rounded-full bg-sky-soft text-sky-deep shrink-0">
                <Play class="size-4 fill-current" :stroke-width="0" />
              </span>
            </button>
          </li>
        </ul>
      </div>

      <!-- Reproductor (aparece al empezar a sonar algo) -->
      <div v-if="current" class="shrink-0 rounded-[16px] bg-sky-soft p-2.5 flex items-center gap-3">
        <img v-if="current.image" :src="current.image" :alt="current.name" class="size-12 rounded-[12px] object-cover shrink-0" />
        <span v-else class="grid place-items-center size-12 rounded-[12px] bg-sky text-[#1f4661] shrink-0"><Music class="size-6" :stroke-width="1.8" /></span>
        <div class="flex-1 min-w-0">
          <p class="text-[14px] font-bold text-fg truncate">{{ current.name }}</p>
          <p class="text-[12px] text-sky-deep/80 truncate">{{ current.artists }}</p>
          <div class="mt-1 flex items-center gap-2">
            <span class="text-[10.5px] text-sky-deep/70 tabular-nums">{{ fmt(position) }}</span>
            <div class="flex-1 h-1.5 rounded-full bg-sky/50 overflow-hidden"><div class="h-full rounded-full bg-sky-deep" :style="{ width: pct + '%' }" /></div>
            <span class="text-[10.5px] text-sky-deep/70 tabular-nums">{{ fmt(duration) }}</span>
          </div>
        </div>
        <div class="flex items-center gap-1 shrink-0">
          <button type="button" class="grid place-items-center size-10 rounded-full text-sky-deep" :aria-label="t('spotify.controls.prev')" @click="sp.prev()"><SkipBack class="size-5" :stroke-width="2" /></button>
          <button type="button" class="grid place-items-center size-12 rounded-full bg-sky text-[#1f4661]" :aria-label="paused ? t('spotify.controls.play') : t('spotify.controls.pause')" @click="sp.togglePlay()">
            <component :is="paused ? Play : Pause" class="size-5" :stroke-width="paused ? 0 : 2" :class="paused ? 'fill-current' : ''" />
          </button>
          <button type="button" class="grid place-items-center size-10 rounded-full text-sky-deep" :aria-label="t('spotify.controls.next')" @click="sp.next()"><SkipForward class="size-5" :stroke-width="2" /></button>
        </div>
      </div>

      <!-- Aviso si no es premium: la reproducción abre Spotify -->
      <p v-if="status.connected && status.premium === false" class="shrink-0 text-center text-[12px] text-fg-subtle inline-flex items-center justify-center gap-1.5">
        <ExternalLink class="size-3.5" :stroke-width="2" /> {{ t('spotify.premiumHint') }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.chips-enter-active, .chips-leave-active { transition: opacity 0.2s ease, transform 0.24s ease; }
.chips-enter-from, .chips-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
