<script setup lang="ts">
import { Play, Pause, RotateCcw, Timer, ChevronDown, Sparkles } from '@lucide/vue'

useHead({ title: 'Hibi — Enfoque' })

type Mode = 'focus' | 'short' | 'long'
const MODES: { key: Mode; label: string; minutes: number; color: string }[] = [
  { key: 'focus', label: 'Foco', minutes: 25, color: 'text-sky-deep' },
  { key: 'short', label: 'Descanso corto', minutes: 5, color: 'text-[#34936a]' },
  { key: 'long', label: 'Descanso largo', minutes: 15, color: 'text-pink-deep' },
]
const mode = ref<Mode>('focus')
const totalSec = computed(() => MODES.find(m => m.key === mode.value)!.minutes * 60)
const remaining = ref(totalSec.value)
const running = ref(false)
const task = ref('Preparar la presentación del jueves')

let interval: ReturnType<typeof setInterval> | undefined
function start() { if (running.value) return; running.value = true; interval = setInterval(() => { remaining.value -= 1; if (remaining.value <= 0) { remaining.value = 0; stop() } }, 1000) }
function stop() { running.value = false; if (interval) clearInterval(interval) }
function reset() { stop(); remaining.value = totalSec.value }
watch(mode, () => { reset() })
onBeforeUnmount(() => { if (interval) clearInterval(interval) })

const mm = computed(() => String(Math.floor(remaining.value / 60)).padStart(2, '0'))
const ss = computed(() => String(remaining.value % 60).padStart(2, '0'))
const progress = computed(() => 1 - remaining.value / totalSec.value)
const r = 120; const c = 2 * Math.PI * r

const sessions = [
  { id: 's1', task: 'Diseñar dashboard', mins: 25, ago: 'Hace 1 h' },
  { id: 's2', task: 'Leer documentación', mins: 25, ago: 'Hace 2 h' },
  { id: 's3', task: 'Stand-up equipo', mins: 15, ago: 'Hace 3 h' },
]
</script>

<template>
  <div class="h-full flex flex-col gap-3 px-4 md:px-7 py-5">
    <AppCard class="flex-1 min-h-0 flex flex-col items-center justify-center !p-6 md:!p-8">
      <div class="inline-flex p-1 rounded-full bg-muted gap-1 mb-6">
        <button v-for="m in MODES" :key="m.key" type="button"
          class="h-9 px-4 rounded-full text-[13px] font-semibold transition-[background-color,color]"
          :class="mode === m.key ? 'bg-card ' + m.color : 'text-fg-muted hover:text-fg'"
          @click="mode = m.key">{{ m.label }}</button>
      </div>

      <div class="relative">
        <svg :width="280" :height="280" viewBox="0 0 280 280" aria-label="Temporizador">
          <circle cx="140" cy="140" :r="r" fill="none" stroke="var(--bg-muted)" stroke-width="16" />
          <circle cx="140" cy="140" :r="r" fill="none"
            stroke="var(--color-sky-deep)" stroke-width="16" stroke-linecap="round"
            :stroke-dasharray="`${c * progress} ${c}`"
            transform="rotate(-90 140 140)"
            style="transition: stroke-dasharray 0.6s ease;" />
        </svg>
        <div class="absolute inset-0 grid place-items-center text-center">
          <div>
            <p class="text-[80px] md:text-[96px] font-extrabold text-fg leading-none tabular-nums tracking-tight">{{ mm }}<span class="text-fg-subtle">:</span>{{ ss }}</p>
            <p class="text-[13px] text-fg-muted mt-1 font-bold">{{ running ? 'En foco' : 'Listo' }}</p>
          </div>
        </div>
      </div>

      <button class="mt-6 inline-flex items-center gap-2 h-10 px-4 rounded-full bg-muted text-fg hover:bg-sky-soft hover:text-sky-deep transition-[background-color,color]">
        <Sparkles class="size-4" :stroke-width="1.9" aria-hidden="true" />
        <span class="text-[14px] font-semibold truncate max-w-[260px]">{{ task }}</span>
        <ChevronDown class="size-4 text-fg-subtle" :stroke-width="2" aria-hidden="true" />
      </button>

      <div class="flex items-center gap-3 mt-6">
        <button class="grid place-items-center size-12 rounded-full bg-muted text-fg-muted hover:text-fg hover:bg-inset transition-[background-color]" aria-label="Reiniciar" @click="reset"><RotateCcw class="size-5" :stroke-width="1.9" /></button>
        <button class="inline-flex items-center gap-2 h-14 px-8 rounded-full bg-sky text-[#1f4661] font-bold text-[16px] hover:brightness-[0.96] transition-[filter]" @click="running ? stop() : start()">
          <component :is="running ? Pause : Play" class="size-5" :stroke-width="2.2" aria-hidden="true" />
          {{ running ? 'Pausar' : 'Empezar' }}
        </button>
      </div>
    </AppCard>

    <AppCard class="shrink-0 !p-3 md:!p-4">
      <h3 class="text-[13px] font-bold text-fg-muted mb-2 px-1">Sesiones de hoy</h3>
      <div class="flex flex-col gap-1.5">
        <div v-for="s in sessions" :key="s.id" class="flex items-center gap-3 p-3 rounded-[12px] bg-muted">
          <span class="grid place-items-center size-9 rounded-[11px] bg-sky-soft text-sky-deep" aria-hidden="true"><Timer class="size-[16px]" :stroke-width="2" /></span>
          <div class="flex-1 min-w-0">
            <p class="text-[14px] font-semibold text-fg truncate">{{ s.task }}</p>
            <p class="text-[12px] text-fg-muted">{{ s.ago }}</p>
          </div>
          <span class="text-[13px] font-bold text-fg tabular-nums">{{ s.mins }} min</span>
        </div>
      </div>
    </AppCard>
  </div>
</template>
