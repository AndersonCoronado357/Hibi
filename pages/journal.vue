<script setup lang="ts">
import { Plus, BookHeart, Frown, Meh, Smile, Laugh, Angry, Sparkles, ChevronLeft, ChevronRight, BarChart3, NotebookPen } from '@lucide/vue'
import { markRaw, type Component } from 'vue'
import { format, subDays, isSameDay, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, differenceInCalendarDays } from 'date-fns'
import { es } from 'date-fns/locale'

useHead({ title: 'Hibi — Diario' })

interface Entry { date: Date; mood: 1|2|3|4|5; energy: 1|2|3|4|5; preview: string; body: string }
const today = new Date()
const entries = ref<Entry[]>([
  { date: today, mood: 4, energy: 4, preview: 'Mañana productiva. Café temprano, lectura, paseo largo.', body: '<p>Mañana productiva. Café temprano, lectura, paseo largo por el parque.</p><p>Me senté en el banco de siempre con un libro. Volví a pensar en lo del trabajo. Mejor mañana.</p>' },
  { date: subDays(today, 1), mood: 3, energy: 3, preview: 'Día tranquilo, mucho trabajo de pantalla.', body: '<p>Día tranquilo, mucho trabajo de pantalla. Por la noche peli con Lu.</p>' },
  { date: subDays(today, 2), mood: 5, energy: 4, preview: 'Comida en casa de los abuelos.', body: '<p>Comida en casa de los abuelos. La luz de junio entrando por la ventana.</p>' },
  { date: subDays(today, 3), mood: 2, energy: 2, preview: 'Cabeza pesada, dormí mal.', body: '<p>Cabeza pesada, dormí mal. Salí poco. Cocinar me ordenó la tarde.</p>' },
  { date: subDays(today, 4), mood: 4, energy: 5, preview: 'Volví a correr 5K sin parar.', body: '<p>Volví a correr 5K sin parar. Muy buen ánimo, ganas de seguir.</p>' },
  { date: subDays(today, 5), mood: 3, energy: 3, preview: 'Domingo tranquilo.', body: '<p>Domingo tranquilo, descanso.</p>' },
  { date: subDays(today, 6), mood: 4, energy: 4, preview: 'Cena con amigos.', body: '<p>Cena con amigos. Hablamos mucho de viajes.</p>' },
  { date: subDays(today, 8), mood: 2, energy: 3, preview: 'Lluvia todo el día.', body: '<p>Lluvia todo el día. Día gris.</p>' },
  { date: subDays(today, 10), mood: 5, energy: 5, preview: 'Llegó la oferta de trabajo.', body: '<p>Llegó la oferta. Mucha alegría.</p>' },
])

interface Mood { v: 1|2|3|4|5; icon: Component; label: string; color: string; bg: string; hex: string }
const moods: Mood[] = [
  { v: 1, icon: markRaw(Angry), label: 'Mal',     color: 'text-pink-deep',  bg: 'bg-pink-soft', hex: '#db8aa3' },
  { v: 2, icon: markRaw(Frown), label: 'Bajo',    color: 'text-[#c5733f]',  bg: 'bg-peach',     hex: '#c5733f' },
  { v: 3, icon: markRaw(Meh),   label: 'Normal',  color: 'text-[#bf8f2e]',  bg: 'bg-cream',     hex: '#bf8f2e' },
  { v: 4, icon: markRaw(Smile), label: 'Bien',    color: 'text-[#34936a]',  bg: 'bg-mint',      hex: '#34936a' },
  { v: 5, icon: markRaw(Laugh), label: 'Genial',  color: 'text-sky-deep',   bg: 'bg-sky-soft',  hex: '#5aa6d2' },
]

const view = ref<'editor' | 'stats'>('editor')

const selectedDate = ref(today)
const selectedEntry = computed(() => entries.value.find(e => isSameDay(e.date, selectedDate.value)))
const draftMood = ref<Entry['mood']>(selectedEntry.value?.mood ?? 3)
const draftBody = ref(selectedEntry.value?.body || '')
watch(selectedDate, () => {
  const e = entries.value.find(x => isSameDay(x.date, selectedDate.value))
  draftMood.value = e?.mood ?? 3
  draftBody.value = e?.body || ''
})

const PROMPTS = [
  'Qué fue lo mejor del día.', 'Por qué te sentiste así.', 'Una persona por la que te sientes agradecido.',
  'Qué te gustaría recordar de hoy en un año.', 'Algo pequeño que te hizo sonreír.',
]
const prompt = ref(PROMPTS[0])
function newPrompt() {
  let next = prompt.value; let safety = 0
  while (next === prompt.value && safety++ < 10) next = PROMPTS[Math.floor(Math.random() * PROMPTS.length)]
  prompt.value = next
}
function insertPrompt() {
  draftBody.value += `<p><strong>${prompt.value}</strong></p><p></p>`
}

const cursor = ref(today)
const monthDays = computed(() => {
  const gs = startOfWeek(startOfMonth(cursor.value), { weekStartsOn: 1 })
  const ge = endOfWeek(endOfMonth(cursor.value), { weekStartsOn: 1 })
  const out: Date[] = []; let d = gs
  while (d <= ge) { out.push(d); d = addDays(d, 1) }
  return out
})
const moodOn = (d: Date) => entries.value.find(e => isSameDay(e.date, d))?.mood ?? null

function save() {
  const idx = entries.value.findIndex(e => isSameDay(e.date, selectedDate.value))
  const stripped = draftBody.value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 140)
  if (idx >= 0) {
    entries.value[idx]!.mood = draftMood.value
    entries.value[idx]!.body = draftBody.value
    entries.value[idx]!.preview = stripped
  } else {
    entries.value.unshift({ date: selectedDate.value, mood: draftMood.value, energy: 3, body: draftBody.value, preview: stripped })
  }
}

// ─── Gráfica de ánimo: barras horizontales últimos 30 días ───
const chartDays = computed(() => {
  return Array.from({ length: 30 }, (_, i) => {
    const d = subDays(today, 29 - i)
    const e = entries.value.find(x => isSameDay(x.date, d))
    return { date: d, mood: e?.mood ?? null }
  })
})
const moodAverage = computed(() => {
  const ms = entries.value.map(e => e.mood)
  if (!ms.length) return 0
  return ms.reduce((a, b) => a + b, 0) / ms.length
})
const moodDist = computed(() => {
  const total = entries.value.length || 1
  return moods.map(m => ({ ...m, count: entries.value.filter(e => e.mood === m.v).length, pct: Math.round((entries.value.filter(e => e.mood === m.v).length / total) * 100) }))
})
const hoveredMood = ref<number | null>(null)

// Heatmap: 12 semanas × 7 días. Empezamos en LUNES de la semana hace 12 semanas
// y fluimos por columnas (cada columna = una semana, cada fila = día L..D).
interface HeatCell { date: Date; mood: number | null }
const heatCells = computed<HeatCell[]>(() => {
  const out: HeatCell[] = []
  // 12 semanas atrás, alineado al lunes de esa semana
  const todayDow = (today.getDay() + 6) % 7 // 0=L .. 6=D
  const start = subDays(today, todayDow + 11 * 7)
  for (let i = 0; i < 84; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i)
    const e = entries.value.find(x => isSameDay(x.date, d))
    out.push({ date: d, mood: e?.mood ?? null })
  }
  return out
})
const heatSelected = ref<HeatCell | null>(null)

// Arc del donut: cada mood ocupa un ángulo proporcional a pct
function arcPath(idx: number, dist: typeof moodDist.value) {
  const total = dist.reduce((a, m) => a + m.count, 0) || 1
  let startAngle = -Math.PI / 2
  for (let i = 0; i < idx; i++) startAngle += (dist[i]!.count / total) * Math.PI * 2
  const sweep = (dist[idx]!.count / total) * Math.PI * 2
  const endAngle = startAngle + sweep
  const r1 = 100, r2 = 60
  const x1 = Math.cos(startAngle) * r1, y1 = Math.sin(startAngle) * r1
  const x2 = Math.cos(endAngle) * r1, y2 = Math.sin(endAngle) * r1
  const x3 = Math.cos(endAngle) * r2, y3 = Math.sin(endAngle) * r2
  const x4 = Math.cos(startAngle) * r2, y4 = Math.sin(startAngle) * r2
  const largeArc = sweep > Math.PI ? 1 : 0
  return `M ${x1} ${y1} A ${r1} ${r1} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${r2} ${r2} 0 ${largeArc} 0 ${x4} ${y4} Z`
}
</script>

<template>
  <div class="h-full flex flex-col gap-3 px-4 md:px-7 py-5 relative overflow-hidden">
    <HibiCloud :size="130" float :duration="7" class="hidden md:block absolute -top-6 -right-6 text-pink-soft opacity-15 pointer-events-none z-40" aria-hidden="true" />
    <HibiCloud :size="70" float :duration="9" :delay="1.3" class="hidden md:block absolute bottom-8 left-8 text-lavender opacity-15 pointer-events-none z-40" aria-hidden="true" />
    <HibiHeart :size="20" beat :duration="2.4" class="hidden md:block absolute top-[20%] left-[8%] text-fg-subtle opacity-25 pointer-events-none z-40" />
    <HibiSparkle :size="16" twinkle :duration="2.8" :delay="0.6" class="hidden md:block absolute top-[12%] right-[26%] text-fg-subtle opacity-25 pointer-events-none z-40" />
    <HibiSparkle :size="14" twinkle :duration="3" :delay="1.2" class="hidden md:block absolute bottom-[28%] right-[8%] text-lavender opacity-25 pointer-events-none z-40" />
    <!-- Toolbar -->
    <div class="relative z-10">
      <PageHero :icon="BookHeart" tone="pink" title="Diario" :subtitle="`${entries.length} entradas · ánimo medio ${moodAverage.toFixed(1)} / 5`">
        <template #actions>
          <AppSegmented v-model="view" :options="[
            { value: 'editor', icon: NotebookPen, ariaLabel: 'Editor' },
            { value: 'stats',  icon: BarChart3,   ariaLabel: 'Estadísticas' },
          ]" />
          <AppButton variant="primary" size="sm" @click="selectedDate = new Date(); view = 'editor'"><template #icon><Plus class="size-[16px]" :stroke-width="2.3" /></template>Hoy</AppButton>
        </template>
      </PageHero>
    </div>

    <!-- ─────── EDITOR ─────── -->
    <div v-if="view === 'editor'" class="flex-1 min-h-0 flex flex-col lg:flex-row gap-3 overflow-hidden">
      <AppCard class="flex-1 min-w-0 flex flex-col" :padded="false">
        <header class="shrink-0 px-6 pt-6 pb-3 flex flex-wrap items-end justify-between gap-3">
          <!-- Wrapper relative; el viejo sale en absolute mientras el nuevo entra en flujo normal -->
          <div class="relative">
            <Transition name="hibi-fade">
              <div :key="format(selectedDate, 'yyyy-MM-dd')">
                <p class="text-[12.5px] text-fg-muted font-semibold capitalize">{{ format(selectedDate, "EEEE", { locale: es }) }}</p>
                <h2 class="text-[32px] font-extrabold text-fg leading-none tabular-nums">{{ format(selectedDate, 'd') }} <span class="text-[18px] text-fg-muted font-bold">{{ format(selectedDate, "MMM", { locale: es }) }}</span></h2>
              </div>
            </Transition>
          </div>
          <div class="inline-flex items-center gap-1.5 p-1 rounded-full bg-muted">
            <button v-for="m in moods" :key="m.v" type="button"
              class="shrink-0 hibi-mood-btn"
              :aria-label="m.label" @click="draftMood = m.v as Entry['mood']">
              <HibiCloudIcon
                :size="46"
                :icon="m.icon"
                :icon-size="18"
                :cloud-color="draftMood === m.v ? m.bg : 'text-card'"
                :icon-color="draftMood === m.v ? m.color : 'text-fg-muted'"
                :icon-stroke="1.8" />
            </button>
          </div>
        </header>

        <!-- Prompt -->
        <div class="shrink-0 mx-6 mb-3 rounded-[12px] bg-sky-soft px-4 py-3 flex items-start gap-2.5">
          <Sparkles class="size-[16px] text-sky-deep shrink-0 mt-0.5" :stroke-width="2.1" aria-hidden="true" />
          <p class="flex-1 text-[14px] text-fg font-semibold">{{ prompt }}</p>
          <div class="flex items-center gap-2 shrink-0">
            <button class="text-[12px] font-bold text-sky-deep hover:underline" @click="insertPrompt">Usar</button>
            <button class="text-[12px] font-bold text-fg-muted hover:underline" @click="newPrompt">Otro</button>
          </div>
        </div>

        <!-- Editor enriquecido full — fade suave al cambiar de día, sin layout shift -->
        <div class="flex-1 min-h-0 flex mx-6 mb-2 relative">
          <Transition name="hibi-fade">
            <AppRichEditor
              :key="format(selectedDate, 'yyyy-MM-dd')"
              class="flex-1"
              :model-value="draftBody"
              placeholder="Escribe libre, o pulsa la sugerencia para empezar…"
              @update:model-value="draftBody = $event" />
          </Transition>
        </div>

        <footer class="shrink-0 px-6 pb-5 pt-1 flex justify-end gap-2">
          <AppButton variant="primary" size="sm" @click="save">Guardar</AppButton>
        </footer>
      </AppCard>

      <!-- Sidebar mes + entradas -->
      <aside class="lg:w-[300px] shrink-0 flex flex-col gap-3 min-h-0">
        <AppCard class="!p-4">
          <div class="flex items-center justify-between mb-2">
            <button class="grid place-items-center size-7 rounded-[8px] text-fg-muted hover:bg-muted hover:text-fg" aria-label="Mes anterior" @click="cursor = subMonths(cursor, 1)"><ChevronLeft class="size-4" :stroke-width="2" /></button>
            <p class="text-[14px] font-bold text-fg capitalize">{{ format(cursor, 'MMMM yyyy', { locale: es }) }}</p>
            <button class="grid place-items-center size-7 rounded-[8px] text-fg-muted hover:bg-muted hover:text-fg" aria-label="Mes siguiente" @click="cursor = addMonths(cursor, 1)"><ChevronRight class="size-4" :stroke-width="2" /></button>
          </div>
          <div class="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-wide text-fg-subtle mb-1">
            <span v-for="d in ['L','M','X','J','V','S','D']" :key="d">{{ d }}</span>
          </div>
          <!-- Grid del mes con fade SIMPLE al cambiar (solo opacity, sin layout shift) -->
          <div class="relative">
            <Transition name="hibi-fade">
              <div :key="format(cursor, 'yyyy-MM')" class="grid grid-cols-7 gap-1">
                <button v-for="d in monthDays" :key="d.toISOString()" type="button"
                  class="aspect-square grid place-items-center text-[12px] rounded-[8px] font-semibold transition-[background-color]"
                  :class="[
                    !isSameMonth(d, cursor) ? 'text-fg-subtle opacity-50 hover:bg-muted' : 'text-fg hover:bg-muted',
                    isSameDay(d, selectedDate) ? 'outline outline-2 outline-offset-[-2px] outline-sky-deep' : '',
                    moodOn(d) ? moods[moodOn(d)! - 1]!.bg + ' ' + moods[moodOn(d)! - 1]!.color : '',
                  ]"
                  @click="selectedDate = d">{{ format(d, 'd') }}</button>
              </div>
            </Transition>
          </div>
        </AppCard>
        <AppCard class="flex-1 min-h-0 flex flex-col" :padded="false">
          <h3 class="px-4 pt-4 pb-2 text-[13px] font-bold text-fg-muted shrink-0">Entradas</h3>
          <div class="hibi-anim-slide-right flex-1 min-h-0 overflow-y-auto scroll-area px-2 pb-3 flex flex-col gap-1">
            <button v-for="e in entries" :key="e.date.toISOString()"
              type="button" class="text-left p-3 rounded-[12px] flex gap-3 items-start transition-[background-color]"
              :class="isSameDay(e.date, selectedDate) ? 'bg-sky-soft' : 'hover:bg-muted'"
              @click="selectedDate = e.date">
              <HibiCloudIcon :size="52" :icon="moods[e.mood-1]!.icon" :icon-size="18" :cloud-color="moods[e.mood-1]!.bg" :icon-color="moods[e.mood-1]!.color" :icon-stroke="1.7" class="shrink-0" />
              <div class="flex-1 min-w-0">
                <p class="text-[13px] font-bold text-fg capitalize">{{ format(e.date, "EEEE d", { locale: es }) }}</p>
                <p class="text-[12px] text-fg-muted line-clamp-2 mt-0.5">{{ e.preview }}</p>
              </div>
            </button>
          </div>
        </AppCard>
      </aside>
    </div>

    <!-- ─────── GRÁFICA DE ÁNIMO ─────── usa todo el alto -->
    <div v-else class="flex-1 min-h-0 flex flex-col md:flex-row gap-3 overflow-hidden">
      <!-- Izquierda: hero + radial -->
      <AppCard class="!p-6 md:w-[420px] shrink-0 flex flex-col items-center gap-4 relative overflow-hidden">
        <HibiCloud :size="160" class="hidden md:block absolute -top-6 -right-6 text-pink-soft opacity-15 pointer-events-none z-40" aria-hidden="true" />
        <div class="text-center relative z-10">
          <p class="text-[11.5px] font-bold text-fg-muted uppercase tracking-wide">Ánimo medio</p>
          <p class="text-[64px] font-extrabold leading-none tabular-nums" :style="{ color: moods[Math.round(moodAverage) - 1]?.hex || 'var(--text-primary)' }">{{ moodAverage.toFixed(1) }}<span class="text-[24px] text-fg-muted font-bold">/5</span></p>
          <p class="text-[12.5px] text-fg-muted mt-1">{{ entries.length }} entradas</p>
        </div>
        <!-- Donut radial interactivo -->
        <svg viewBox="0 0 240 240" class="w-full max-w-[260px] relative z-10" aria-label="Distribución de ánimo">
          <g transform="translate(120 120)">
            <template v-for="(m, i) in moodDist" :key="m.v">
              <!-- Cada arco -->
              <path v-if="m.count"
                :d="arcPath(i, moodDist)"
                :fill="m.hex"
                class="cursor-pointer transition-[opacity,transform]"
                :style="{ opacity: hoveredMood === null || hoveredMood === m.v ? 1 : 0.35, transformOrigin: '0 0', transform: hoveredMood === m.v ? 'scale(1.04)' : 'scale(1)' }"
                @mouseenter="hoveredMood = m.v"
                @mouseleave="hoveredMood = null" />
            </template>
            <!-- Hueco centro con icono mood hovered -->
            <circle r="56" fill="var(--bg-card)" />
            <text v-if="hoveredMood" text-anchor="middle" y="6" fill="var(--text-primary)" class="text-[18px] font-extrabold">{{ moodDist.find(m => m.v === hoveredMood)?.pct }}%</text>
            <text v-else text-anchor="middle" y="6" fill="var(--text-muted)" class="text-[13px] font-bold">Total</text>
          </g>
        </svg>
        <!-- Leyenda con barras: cada mood -->
        <div class="w-full flex flex-col gap-1.5 relative z-10">
          <div v-for="m in moodDist" :key="m.v"
            class="flex items-center gap-2 px-2 py-1.5 rounded-[10px] cursor-pointer transition-[background-color]"
            :class="hoveredMood === m.v ? 'bg-muted' : 'hover:bg-muted'"
            @mouseenter="hoveredMood = m.v" @mouseleave="hoveredMood = null">
            <component :is="m.icon" class="size-[16px] shrink-0" :class="m.color" :stroke-width="1.9" aria-hidden="true" />
            <span class="text-[12.5px] font-semibold text-fg w-16 shrink-0">{{ m.label }}</span>
            <div class="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div class="h-full rounded-full transition-[width] duration-500" :style="{ width: m.pct + '%', background: m.hex }"></div>
            </div>
            <span class="text-[11.5px] font-bold text-fg-muted tabular-nums w-10 text-right">{{ m.pct }}%</span>
          </div>
        </div>
      </AppCard>

      <!-- Derecha: mapa de calor estilo GitHub interactivo -->
      <AppCard class="!p-6 flex-1 min-w-0 flex flex-col">
        <header class="flex items-center justify-between mb-4 shrink-0">
          <h3 class="text-[14px] font-bold text-fg-muted">Mapa de ánimo · últimos 84 días</h3>
          <p v-if="heatSelected" class="text-[12.5px] font-semibold text-fg">
            <span class="capitalize">{{ format(heatSelected.date, "EEEE d 'de' MMM", { locale: es }) }}</span>
            <span v-if="heatSelected.mood" class="ml-2" :style="{ color: moods[heatSelected.mood-1]!.hex }">· {{ moods[heatSelected.mood-1]!.label }}</span>
            <span v-else class="ml-2 text-fg-subtle">· sin entrada</span>
          </p>
        </header>
        <!-- Grid 7 filas (días de la semana) × 12 semanas -->
        <div class="flex-1 min-h-0 flex gap-2">
          <div class="flex flex-col justify-around text-[10px] font-bold text-fg-subtle pr-1">
            <span v-for="(d, i) in ['L','M','X','J','V','S','D']" :key="i">{{ d }}</span>
          </div>
          <div class="hibi-anim-bars flex-1 grid gap-1.5 min-h-0"
            style="grid-template-rows: repeat(7, minmax(0, 1fr)); grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr);">
            <button v-for="(c, i) in heatCells" :key="i" type="button"
              class="rounded-[5px] min-h-0 transition-[filter]"
              :class="[
                c.mood ? '' : 'bg-muted',
                heatSelected?.date === c.date ? 'brightness-125' : '',
              ]"
              :style="c.mood ? { background: moods[c.mood-1]!.hex, opacity: 0.4 + (c.mood / 5) * 0.6 } : undefined"
              :title="`${format(c.date, 'EEE d', { locale: es })}`"
              @click="heatSelected = c"
              @mouseenter="heatSelected = c"></button>
          </div>
        </div>
        <!-- Leyenda -->
        <div class="shrink-0 flex items-center justify-end gap-2 mt-4 pt-3 border-t border-[var(--bg-muted)]">
          <span class="text-[11px] text-fg-muted font-bold">Menos</span>
          <span v-for="m in moods" :key="m.v" class="size-3.5 rounded-[4px]" :style="{ background: m.hex, opacity: 0.4 + (m.v / 5) * 0.6 }"></span>
          <span class="text-[11px] text-fg-muted font-bold">Más</span>
        </div>
      </AppCard>
    </div>
  </div>
</template>
