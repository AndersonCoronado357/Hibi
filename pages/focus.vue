<script setup lang="ts">
import { Play, Pause, RotateCcw, Timer, ChevronDown, Sparkles, ListChecks, Plus, X, Pencil, Check, Trash2, ArrowLeft, Settings2 } from '@lucide/vue'

useHead({ title: 'Hibi — Enfoque' })

interface Preset { id: string; label: string; focus: number; short: number; long: number; color: string; ringColor: string }
type View = 'timer' | 'presets'
const view = ref<View>('timer')
const presets = ref<Preset[]>([
  { id: 'p1', label: 'Clásico',  focus: 25, short: 5, long: 15, color: 'bg-sky-soft text-sky-deep',  ringColor: 'var(--color-sky-deep)' },
  { id: 'p2', label: 'Largo',    focus: 50, short: 10, long: 20, color: 'bg-mint text-[#34936a]',    ringColor: '#34936a' },
  { id: 'p3', label: 'Sprint',   focus: 15, short: 3, long: 10, color: 'bg-pink-soft text-pink-deep', ringColor: 'var(--color-pink-deep)' },
])

type Mode = 'focus' | 'short' | 'long'
const activePresetId = ref('p1')
const activePreset = computed(() => presets.value.find(p => p.id === activePresetId.value) || presets.value[0]!)
const mode = ref<Mode>('focus')
const totalSec = computed(() => {
  const p = activePreset.value
  return (mode.value === 'focus' ? p.focus : mode.value === 'short' ? p.short : p.long) * 60
})
const remaining = ref(totalSec.value)
const running = ref(false)
const task = ref('Preparar la presentación del jueves')
const sessionsToday = ref(3)

let interval: ReturnType<typeof setInterval> | undefined
function start() { if (running.value) return; running.value = true; interval = setInterval(() => { remaining.value -= 1; if (remaining.value <= 0) { remaining.value = 0; stop(); sessionsToday.value++ } }, 1000) }
function stop() { running.value = false; if (interval) clearInterval(interval) }
function reset() { stop(); remaining.value = totalSec.value }
watch([mode, activePresetId], () => { reset() })
onBeforeUnmount(() => { if (interval) clearInterval(interval) })

const mm = computed(() => String(Math.floor(remaining.value / 60)).padStart(2, '0'))
const ss = computed(() => String(remaining.value % 60).padStart(2, '0'))
const progress = computed(() => 1 - remaining.value / totalSec.value)
const r = 160
const c = 2 * Math.PI * r

// ─── CRUD de presets ───
const editingId = ref<string | null>(null)
const editLabel = ref(''); const editFocus = ref(25); const editShort = ref(5); const editLong = ref(15)
const TONES = [
  { tone: 'bg-sky-soft text-sky-deep',  ringColor: 'var(--color-sky-deep)' },
  { tone: 'bg-mint text-[#34936a]',     ringColor: '#34936a' },
  { tone: 'bg-pink-soft text-pink-deep', ringColor: 'var(--color-pink-deep)' },
  { tone: 'bg-peach text-[#c5733f]',    ringColor: '#c5733f' },
  { tone: 'bg-lavender text-[#7a63c0]', ringColor: '#7a63c0' },
]
function startEdit(p: Preset) {
  editingId.value = p.id
  editLabel.value = p.label
  editFocus.value = p.focus; editShort.value = p.short; editLong.value = p.long
}
function startNew() {
  editingId.value = 'new'
  editLabel.value = ''
  editFocus.value = 25; editShort.value = 5; editLong.value = 15
}
function cancelEdit() { editingId.value = null }
function saveEdit() {
  const label = editLabel.value.trim(); if (!label) return
  if (editingId.value === 'new') {
    const next = TONES[presets.value.length % TONES.length]!
    presets.value.push({ id: 'p' + Math.random().toString(36).slice(2, 7), label, focus: editFocus.value, short: editShort.value, long: editLong.value, color: next.tone, ringColor: next.ringColor })
  } else {
    const p = presets.value.find(x => x.id === editingId.value); if (!p) return
    p.label = label; p.focus = editFocus.value; p.short = editShort.value; p.long = editLong.value
  }
  editingId.value = null
}
function deletePreset(p: Preset) {
  if (presets.value.length <= 1) return
  presets.value = presets.value.filter(x => x.id !== p.id)
  if (activePresetId.value === p.id) activePresetId.value = presets.value[0]!.id
}

const sessions = [
  { id: 's1', task: 'Diseñar dashboard', mins: 25, ago: 'Hace 1 hora' },
  { id: 's2', task: 'Leer documentación', mins: 25, ago: 'Hace 2 horas' },
  { id: 's3', task: 'Stand-up equipo', mins: 15, ago: 'Hace 3 horas' },
]
</script>

<template>
  <div class="h-full flex flex-col lg:flex-row gap-2 lg:gap-3 px-3 md:px-7 py-3 md:py-5 relative overflow-y-auto lg:overflow-hidden scroll-area">
    <HibiCloud :size="160" float :duration="8" class="hidden md:block absolute -top-8 -right-10 text-sky-soft opacity-15 pointer-events-none z-40" aria-hidden="true" />
    <HibiCloud :size="100" float :duration="10" :delay="1.4" class="hidden md:block absolute bottom-6 -left-6 text-pink-soft opacity-15 pointer-events-none z-40" aria-hidden="true" />
    <HibiSparkle :size="18" twinkle :duration="2.6" class="hidden md:block absolute top-[12%] left-[10%] text-fg-subtle opacity-25 pointer-events-none z-40" />
    <HibiSparkle :size="14" twinkle :duration="3" :delay="0.9" class="hidden md:block absolute bottom-[22%] right-[16%] text-lavender opacity-25 pointer-events-none z-40" />
    <HibiHeart :size="16" beat :duration="2.6" class="hidden md:block absolute top-[40%] right-[8%] text-fg-subtle opacity-25 pointer-events-none z-40" />

    <!-- VISTA: PRESETS (CRUD aparte) -->
    <template v-if="view === 'presets'">
      <AppCard class="relative z-10 flex-1 min-w-0 flex flex-col" :padded="false">
        <header class="shrink-0 px-5 pt-5 pb-3 flex items-center justify-between gap-3">
          <button class="inline-flex items-center gap-2 h-10 pl-2.5 pr-4 rounded-full bg-muted text-fg hover:bg-inset transition-[background-color]" @click="view = 'timer'">
            <ArrowLeft class="size-[17px]" :stroke-width="2" /> <span class="text-[13.5px] font-bold">Volver</span>
          </button>
          <div class="text-center">
            <h2 class="text-[18px] font-extrabold text-fg">Presets de pomodoro</h2>
            <p class="text-[12.5px] text-fg-muted">{{ presets.length }} guardados</p>
          </div>
          <button class="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-sky text-[#1f4661] hover:bg-sky-deep hover:text-white font-bold text-[13.5px] transition-[background-color,color]" @click="startNew"><Plus class="size-[15px]" :stroke-width="2.4" />Nuevo</button>
        </header>
        <ul class="flex-1 min-h-0 overflow-y-auto scroll-area px-5 pb-5 flex flex-col gap-2">
          <li v-for="p in presets" :key="p.id">
            <div v-if="editingId === p.id" class="bg-muted rounded-[14px] p-2 flex items-center gap-2 flex-wrap">
              <input v-model="editLabel" type="text" placeholder="Nombre" class="flex-1 h-11 rounded-[10px] bg-card px-3 text-[14px] font-semibold text-fg outline-none" />
              <input v-model.number="editFocus" type="number" min="1" max="180" class="h-11 w-16 rounded-[10px] bg-card px-2 text-center text-[13px] text-fg outline-none tabular-nums" title="Foco (min)" />
              <input v-model.number="editShort" type="number" min="1" max="60" class="h-11 w-16 rounded-[10px] bg-card px-2 text-center text-[13px] text-fg outline-none tabular-nums" title="Corto (min)" />
              <input v-model.number="editLong" type="number" min="1" max="120" class="h-11 w-16 rounded-[10px] bg-card px-2 text-center text-[13px] text-fg outline-none tabular-nums" title="Largo (min)" />
              <button class="grid place-items-center size-11 rounded-[10px] text-fg-muted hover:bg-card hover:text-fg" aria-label="Cancelar" @click="cancelEdit"><X class="size-4" :stroke-width="2.4" /></button>
              <button class="grid place-items-center size-11 rounded-[10px] bg-sky text-[#1f4661] hover:bg-sky-deep hover:text-white" aria-label="Guardar" @click="saveEdit"><Check class="size-4" :stroke-width="2.5" /></button>
            </div>
            <div v-else
              role="button"
              tabindex="0"
              :aria-pressed="activePresetId === p.id"
              class="w-full flex items-center gap-3 p-3 rounded-[14px] transition-[background-color] text-left cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-sky-deep"
              :class="activePresetId === p.id ? 'bg-sky-soft' : 'bg-muted hover:bg-inset'"
              @click="activePresetId = p.id"
              @keydown.enter.prevent="activePresetId = p.id"
              @keydown.space.prevent="activePresetId = p.id">
              <HibiCloudIcon :size="60" :icon="Timer" :icon-size="20" :cloud-color="p.color.split(' ')[0]" :icon-color="p.color.split(' ')[1]" :icon-stroke="1.9" class="shrink-0" />
              <div class="flex-1 min-w-0">
                <p class="text-[15px] font-extrabold text-fg truncate">{{ p.label }}</p>
                <p class="text-[12.5px] text-fg-muted tabular-nums">Foco {{ p.focus }} · Corto {{ p.short }} · Largo {{ p.long }}</p>
              </div>
              <span v-if="activePresetId === p.id" class="text-[11px] font-bold text-sky-deep bg-card px-2 h-6 rounded-full grid place-items-center">ACTIVO</span>
              <button type="button" class="grid place-items-center size-9 rounded-[10px] text-fg-subtle hover:text-fg hover:bg-card" aria-label="Editar" @click.stop="startEdit(p)"><Pencil class="size-[15px]" :stroke-width="2" /></button>
              <button v-if="presets.length > 1" type="button" class="grid place-items-center size-9 rounded-[10px] text-fg-subtle hover:text-pink-deep hover:bg-pink-soft" aria-label="Eliminar" @click.stop="deletePreset(p)"><Trash2 class="size-[15px]" :stroke-width="2" /></button>
            </div>
          </li>
          <li v-if="editingId === 'new'">
            <div class="bg-muted rounded-[14px] p-2 flex items-center gap-2 flex-wrap">
              <input v-model="editLabel" type="text" placeholder="Nombre del preset" autofocus class="flex-1 h-11 rounded-[10px] bg-card px-3 text-[14px] font-semibold text-fg outline-none" />
              <input v-model.number="editFocus" type="number" min="1" max="180" class="h-11 w-16 rounded-[10px] bg-card px-2 text-center text-[13px] text-fg outline-none tabular-nums" title="Foco (min)" />
              <input v-model.number="editShort" type="number" min="1" max="60" class="h-11 w-16 rounded-[10px] bg-card px-2 text-center text-[13px] text-fg outline-none tabular-nums" title="Corto (min)" />
              <input v-model.number="editLong" type="number" min="1" max="120" class="h-11 w-16 rounded-[10px] bg-card px-2 text-center text-[13px] text-fg outline-none tabular-nums" title="Largo (min)" />
              <button class="grid place-items-center size-11 rounded-[10px] text-fg-muted hover:bg-card hover:text-fg" aria-label="Cancelar" @click="cancelEdit"><X class="size-4" :stroke-width="2.4" /></button>
              <button class="grid place-items-center size-11 rounded-[10px] bg-sky text-[#1f4661] hover:bg-sky-deep hover:text-white" aria-label="Crear" @click="saveEdit"><Check class="size-4" :stroke-width="2.5" /></button>
            </div>
          </li>
        </ul>
      </AppCard>
    </template>

    <!-- VISTA: TIMER -->
    <template v-if="view === 'timer'">
    <!-- Columna principal: timer hero -->
    <AppCard class="relative z-10 shrink-0 lg:flex-1 min-w-0 lg:min-h-0 flex flex-col items-center justify-center gap-1 !p-4 md:!p-8 overflow-hidden">
      <div class="relative w-full mb-3 md:mb-0 md:absolute md:top-6 md:left-6 md:right-6 md:w-auto flex items-center justify-between gap-3">
        <div class="inline-flex p-1 rounded-full bg-muted gap-0.5 md:gap-1">
          <button type="button" class="h-9 px-2.5 md:px-4 rounded-full text-[12px] md:text-[13px] font-semibold whitespace-nowrap transition-[background-color,color]"
            :class="mode === 'focus' ? `bg-card ${activePreset.color.split(' ')[1]}` : 'text-fg-muted hover:text-fg'"
            @click="mode = 'focus'">Foco ({{ activePreset.focus }})</button>
          <button type="button" class="h-9 px-2.5 md:px-4 rounded-full text-[12px] md:text-[13px] font-semibold whitespace-nowrap transition-[background-color,color]"
            :class="mode === 'short' ? 'bg-card text-[#34936a]' : 'text-fg-muted hover:text-fg'"
            @click="mode = 'short'">Corto ({{ activePreset.short }})</button>
          <button type="button" class="h-9 px-2.5 md:px-4 rounded-full text-[12px] md:text-[13px] font-semibold whitespace-nowrap transition-[background-color,color]"
            :class="mode === 'long' ? 'bg-card text-pink-deep' : 'text-fg-muted hover:text-fg'"
            @click="mode = 'long'">Largo ({{ activePreset.long }})</button>
        </div>
        <div class="text-right shrink-0">
          <p class="text-[11px] md:text-[12px] font-bold text-fg-muted leading-tight">Sesiones</p>
          <p class="text-[20px] md:text-[22px] font-extrabold text-fg leading-none tabular-nums mt-0.5">{{ sessionsToday }}</p>
        </div>
      </div>

      <!-- Pomodoro con CONTORNO de nube (no se rellena). El trazo va
           apareciendo a lo largo del outline conforme avanza el tiempo,
           igual que el anillo circular original lo hacía. -->
      <div class="relative shrink-0 w-full max-w-[270px] sm:max-w-[400px] md:max-w-[520px] aspect-[152/107]" aria-label="Temporizador">
        <div class="absolute inset-0 flex items-center justify-center">
          <HibiCloudRing
            :size="520"
            :stroke-width="5"
            track-color="var(--bg-muted)"
            :progress-color="activePreset.ringColor"
            :progress="progress"
            class="w-full h-auto max-w-full"
          />
        </div>
        <!-- Tiempo en el centro -->
        <div class="absolute inset-0 grid place-items-center text-center">
          <div>
            <p class="text-[clamp(48px,7vw,88px)] font-extrabold text-fg leading-none tabular-nums tracking-tight">{{ mm }}<span class="text-fg-subtle">:</span>{{ ss }}</p>
            <p class="text-[12px] text-fg-muted mt-1.5 font-bold uppercase tracking-wide">{{ running ? 'En foco' : 'Listo' }}</p>
          </div>
        </div>
      </div>

      <!-- Tarea en foco: editable, se guarda al escribir -->
      <div class="mt-4 md:mt-6 relative w-full max-w-[340px]">
        <Sparkles class="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-sky-deep" :stroke-width="1.9" aria-hidden="true" />
        <input v-model="task" type="text" placeholder="¿En qué te enfocas?"
          class="w-full h-11 rounded-full bg-muted pl-10 pr-4 text-center text-[14.5px] font-semibold text-fg outline-none placeholder:text-fg-subtle" />
      </div>

      <div class="flex items-center gap-3 mt-4 md:mt-6">
        <button class="grid place-items-center size-12 rounded-full bg-muted text-fg-muted hover:text-fg hover:bg-inset transition-[background-color,color]" aria-label="Reiniciar" @click="reset"><RotateCcw class="size-5" :stroke-width="1.9" /></button>
        <button class="inline-flex items-center gap-2 h-14 px-10 rounded-full bg-sky text-[#1f4661] hover:bg-sky-deep hover:text-white font-bold text-[17px] transition-[background-color,color]" @click="running ? stop() : start()">
          <component :is="running ? Pause : Play" class="size-5" :stroke-width="2.2" aria-hidden="true" />
          {{ running ? 'Pausar' : 'Empezar' }}
        </button>
      </div>
    </AppCard>

    <!-- Lateral: preset activo + sesiones (en móvil se apila debajo) -->
    <div class="relative z-10 flex flex-col w-full lg:w-[320px] shrink-0 gap-2 lg:gap-3 lg:min-h-0">
      <AppCard class="!p-4 flex flex-col shrink-0">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-[14px] font-bold text-fg inline-flex items-center gap-2"><Timer class="size-4 text-sky-deep" :stroke-width="2" />Modo</h3>
          <button class="inline-flex items-center gap-1 h-8 px-2.5 rounded-[9px] bg-muted text-fg-muted hover:text-fg hover:bg-inset text-[12px] font-bold" @click="view = 'presets'">
            <Settings2 class="size-[13px]" :stroke-width="2.2" /> Personalizar
          </button>
        </div>
        <!-- Select con todos los presets (scroll si hay muchos) -->
        <AppSelect v-model="activePresetId" :options="presets.map(p => ({ value: p.id, label: `${p.label} · ${p.focus}/${p.short}/${p.long}` }))" />
      </AppCard>

      <AppCard class="lg:flex-1 lg:min-h-0 flex flex-col" :padded="false">
        <header class="px-5 pt-5 pb-3 shrink-0 flex items-center gap-2">
          <ListChecks class="size-[18px] text-fg-muted" :stroke-width="1.9" aria-hidden="true" />
          <h3 class="text-[14px] font-bold text-fg">Sesiones de hoy</h3>
        </header>
        <div class="lg:flex-1 lg:min-h-0 lg:overflow-y-auto lg:scroll-area px-3 pb-4 flex flex-col gap-1.5">
          <div v-for="s in sessions" :key="s.id" class="flex items-center gap-3 p-3 rounded-[12px] bg-muted">
            <span class="grid place-items-center size-9 rounded-[11px] bg-sky-soft text-sky-deep" aria-hidden="true"><Timer class="size-[16px]" :stroke-width="2" /></span>
            <div class="flex-1 min-w-0">
              <p class="text-[13.5px] font-semibold text-fg truncate">{{ s.task }}</p>
              <p class="text-[11.5px] text-fg-muted">{{ s.ago }}</p>
            </div>
            <span class="text-[12.5px] font-bold text-fg tabular-nums">{{ s.mins }} min</span>
          </div>
        </div>
      </AppCard>
    </div>
    </template>
  </div>
</template>
