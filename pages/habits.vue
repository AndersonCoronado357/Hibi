<script setup lang="ts">
import { Plus, Flame, Check, Droplet, BookOpen, Leaf, StretchHorizontal, Trophy, Dumbbell, Music, Brain, Sun, Moon, X, Sparkles, Repeat, FileText, BarChart3, ListChecks, Trash2,
  Heart, Apple, Coffee, Bike, Footprints, Pencil, Camera, PenTool, Smile, Wind, Headphones, Zap } from '@lucide/vue'
import { markRaw, type Component } from 'vue'
import { format, subDays, startOfWeek, addDays, addWeeks, subWeeks, isSameDay } from 'date-fns'

const { t } = useI18n()
const dateLocale = useDateLocale()

useHead({ title: t('habits.head.title') })

interface Habit {
  id: string; name: string; icon: Component; tone: string; iconColor: string; ringColor: string
  /** 49 días: últimos 7 semanas, true = hecho */
  log: boolean[]
  best: number
}
const ICONS: Record<string, { icon: Component; tone: string; iconColor: string; ringColor: string; label: string }> = {
  Droplet:           { icon: markRaw(Droplet),           tone: 'bg-sky-soft',     iconColor: 'text-sky-deep',         ringColor: 'var(--color-sky-deep)', label: t('habits.icons.Droplet') },
  BookOpen:          { icon: markRaw(BookOpen),          tone: 'bg-pink-soft',    iconColor: 'text-pink-deep',        ringColor: 'var(--color-pink-deep)', label: t('habits.icons.BookOpen') },
  Leaf:              { icon: markRaw(Leaf),              tone: 'bg-mint',         iconColor: 'text-[#34936a]',        ringColor: '#34936a', label: t('habits.icons.Leaf') },
  StretchHorizontal: { icon: markRaw(StretchHorizontal), tone: 'bg-peach',        iconColor: 'text-[#c5733f]',        ringColor: '#c5733f', label: t('habits.icons.StretchHorizontal') },
  Dumbbell:          { icon: markRaw(Dumbbell),          tone: 'bg-lavender',     iconColor: 'text-[#7a63c0]',        ringColor: '#7a63c0', label: t('habits.icons.Dumbbell') },
  Brain:             { icon: markRaw(Brain),             tone: 'bg-cream',        iconColor: 'text-[#bf8f2e]',        ringColor: '#bf8f2e', label: t('habits.icons.Brain') },
  Music:             { icon: markRaw(Music),             tone: 'bg-pink-soft',    iconColor: 'text-pink-deep',        ringColor: 'var(--color-pink-deep)', label: t('habits.icons.Music') },
  Sun:               { icon: markRaw(Sun),               tone: 'bg-cream',        iconColor: 'text-[#bf8f2e]',        ringColor: '#bf8f2e', label: t('habits.icons.Sun') },
  Moon:              { icon: markRaw(Moon),              tone: 'bg-lavender',     iconColor: 'text-[#7a63c0]',        ringColor: '#7a63c0', label: t('habits.icons.Moon') },
}
const ICON_KEYS = Object.keys(ICONS)

// Galería extendida para el form de creación (todos los iconos como solo Component)
const ICON_GALLERY: { key: string; icon: Component }[] = [
  { key: 'Droplet', icon: markRaw(Droplet) },
  { key: 'BookOpen', icon: markRaw(BookOpen) },
  { key: 'Leaf', icon: markRaw(Leaf) },
  { key: 'StretchHorizontal', icon: markRaw(StretchHorizontal) },
  { key: 'Dumbbell', icon: markRaw(Dumbbell) },
  { key: 'Brain', icon: markRaw(Brain) },
  { key: 'Music', icon: markRaw(Music) },
  { key: 'Sun', icon: markRaw(Sun) },
  { key: 'Moon', icon: markRaw(Moon) },
  { key: 'Heart', icon: markRaw(Heart) },
  { key: 'Apple', icon: markRaw(Apple) },
  { key: 'Coffee', icon: markRaw(Coffee) },
  { key: 'Bike', icon: markRaw(Bike) },
  { key: 'Footprints', icon: markRaw(Footprints) },
  { key: 'Pencil', icon: markRaw(Pencil) },
  { key: 'Camera', icon: markRaw(Camera) },
  { key: 'PenTool', icon: markRaw(PenTool) },
  { key: 'Smile', icon: markRaw(Smile) },
  { key: 'Wind', icon: markRaw(Wind) },
  { key: 'Headphones', icon: markRaw(Headphones) },
  { key: 'Zap', icon: markRaw(Zap) },
  { key: 'Sparkles', icon: markRaw(Sparkles) },
  { key: 'Flame', icon: markRaw(Flame) },
  { key: 'Repeat', icon: markRaw(Repeat) },
]

// Helper: cuando un hábito tiene tone='' (color personalizado), generamos
// background + color con su ringColor (hex). Si tiene tone, devuelve null y se usan
// las clases tone+iconColor que ya tiene.
function tileStyle(h: { tone: string; ringColor: string }) {
  if (h.tone) return undefined
  return { background: h.ringColor + '33', color: h.ringColor }
}

const { habits, completions, isLoading, createHabit, removeHabit: apiRemoveHabit, toggle: apiToggle } = useHabits()

// Set de "habitId|yyyy-MM-dd" para consulta O(1) de las marcas.
const doneSet = computed(() => {
  const s = new Set<string>()
  for (const c of completions.value) s.add(c.habitId + '|' + c.day)
  return s
})
function resolveIcon(name: string): Component {
  return ICON_GALLERY.find(g => g.key === name)?.icon || ICONS[name]?.icon || markRaw(Droplet)
}
function bestRun(log: boolean[]) {
  let s = 0, m = 0
  for (let k = log.length - 1; k >= 0; k--) { if (log[k]) { s++; m = Math.max(m, s) } else s = 0 }
  return m
}
// Cada hábito con su log[49] (índice 48 = hoy) derivado de las marcas + best.
const habitsData = computed<Habit[]>(() => habits.value.map((h) => {
  const log: boolean[] = []
  for (let i = 0; i < 49; i++) {
    const d = subDays(today, 48 - i)
    log.push(doneSet.value.has(h.id + '|' + format(d, 'yyyy-MM-dd')))
  }
  return { id: h.id, name: h.name, icon: resolveIcon(h.icon), tone: '', iconColor: '', ringColor: h.ringColor, log, best: bestRun(log) }
}))

// ───── Tracker semanal: 7 columnas (L–D) × N filas (hábitos) ─────
const weekCursor = ref(startOfWeek(new Date(), { weekStartsOn: 1 }))
const days = computed(() => Array.from({ length: 7 }, (_, i) => addDays(weekCursor.value, i)))
const WEEKDAY_LABELS = computed(() => Array.from({ length: 7 }, (_, i) =>
  format(addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), i), 'EEEEE', { locale: dateLocale.value }).toUpperCase()))
const today = new Date()

function dayIndex(d: Date) {
  // mapea fecha → índice dentro del log[0..48] donde 48 = HOY, 47 = ayer, …
  const diff = Math.round((today.getTime() - d.getTime()) / 86_400_000)
  return 48 - diff
}
function done(h: Habit, d: Date) {
  const i = dayIndex(d); if (i < 0 || i > 48) return false
  return h.log[i] === true
}
function toggle(h: Habit, d: Date) {
  if (!isSameDay(d, today)) return
  apiToggle(h.id, format(d, 'yyyy-MM-dd'))
}
function streak(h: Habit) {
  let s = 0
  for (let i = h.log.length - 1; i >= 0; i--) { if (h.log[i]) s++; else break }
  return s
}
function ratePct(h: Habit) {
  return Math.round((h.log.filter(Boolean).length / h.log.length) * 100)
}
const weekRange = computed(() => `${format(weekCursor.value, t('habits.weekRangeFormat'), { locale: dateLocale.value })} – ${format(addDays(weekCursor.value, 6), t('habits.weekRangeFormat'), { locale: dateLocale.value })}`)
const weekRangeShort = computed(() => {
  const s = weekCursor.value, e = addDays(weekCursor.value, 6)
  const sameMonth = format(s, 'MMM', { locale: dateLocale.value }) === format(e, 'MMM', { locale: dateLocale.value })
  return sameMonth
    ? `${format(s, 'd')}–${format(e, 'd')} ${format(e, 'MMM', { locale: dateLocale.value })}`
    : `${format(s, 'd MMM', { locale: dateLocale.value })} – ${format(e, 'd MMM', { locale: dateLocale.value })}`
})
const todayDoneCount = computed(() => habitsData.value.filter(h => done(h, today)).length)
const todayIdx = computed(() => days.value.findIndex(d => isSameDay(d, today)))

// Count-up animados para los stats de hábitos
const bestStreakReal = computed(() => Math.max(0, ...habitsData.value.map(h => h.best)))
const compliancePctReal = computed(() => habitsData.value.length ? Math.round(habitsData.value.reduce((a,h)=>a+ratePct(h),0)/habitsData.value.length) : 0)
const bestStreakAnim = useCountUp(bestStreakReal, { duration: 800 })
const compliancePctAnim = useCountUp(compliancePctReal, { duration: 900 })
const todayDoneAnim = useCountUp(todayDoneCount, { duration: 600 })
const totalHabitsAnim = useCountUp(computed(() => habitsData.value.length), { duration: 500 })

// Analítica: filtro por hábito (null = todos)
const selectedHabitId = ref<string | null>(null)
const filteredHabits = computed(() =>
  selectedHabitId.value ? habitsData.value.filter(h => h.id === selectedHabitId.value) : habitsData.value
)

// Heatmap GitHub-style: últimos 98 días = 14 semanas × 7 días
interface HeatCell { date: Date; pct: number }
const analyticsHeat = computed<HeatCell[]>(() => {
  const targets = selectedHabitId.value
    ? habitsData.value.filter(h => h.id === selectedHabitId.value)
    : habitsData.value
  if (!targets.length) return []
  const out: HeatCell[] = []
  // Empezamos hace 97 días hasta hoy
  for (let i = 0; i < 98; i++) {
    const d = subDays(today, 97 - i)
    // Calcular % de cumplimiento ese día = (hábitos hechos / total hábitos)
    let hits = 0
    for (const h of targets) {
      const idx = 48 - Math.round((today.getTime() - d.getTime()) / 86_400_000)
      if (idx >= 0 && idx < h.log.length && h.log[idx]) hits++
    }
    out.push({ date: d, pct: Math.round((hits / targets.length) * 100) })
  }
  return out
})
const heatHover = ref<(HeatCell & { idx: number }) | null>(null)
const heatColor = computed(() => {
  if (selectedHabitId.value) {
    const h = habitsData.value.find(x => x.id === selectedHabitId.value)
    return h?.ringColor || 'var(--color-sky-deep)'
  }
  return '#5aa6d2'
})
function cellStyle(c: HeatCell) {
  if (c.pct === 0) return { background: 'var(--bg-muted)' }
  // Opacidad proporcional al pct (0.25 - 1)
  const alpha = 0.25 + (c.pct / 100) * 0.75
  return { background: heatColor.value, opacity: alpha }
}

// Stats del hábito o del agregado
const analyticsStreak = computed(() => {
  if (selectedHabitId.value) {
    const h = habitsData.value.find(x => x.id === selectedHabitId.value)
    return h ? streak(h) : 0
  }
  return Math.max(0, ...habitsData.value.map(h => streak(h)))
})
const analyticsBest = computed(() => {
  if (selectedHabitId.value) {
    const h = habitsData.value.find(x => x.id === selectedHabitId.value)
    return h?.best || 0
  }
  return Math.max(0, ...habitsData.value.map(h => h.best))
})
const analyticsDone = computed(() => {
  if (selectedHabitId.value) {
    const h = habitsData.value.find(x => x.id === selectedHabitId.value)
    return h ? h.log.filter(Boolean).length : 0
  }
  return totalDone.value
})
const analyticsSlots = computed(() => {
  if (selectedHabitId.value) return 49
  return totalSlots.value
})

// ───── Vista ─────
const view = ref<'tracker' | 'analytics' | 'create'>('tracker')
const newName = ref('')
const newIconStr = ref('Droplet')
const newCustomColor = ref('#5aa6d2')
function openCreate() {
  newName.value = ''; newIconStr.value = 'Droplet'
  newCustomColor.value = '#5aa6d2'
  view.value = 'create'
}
function cancelCreate() { view.value = 'tracker' }
async function saveHabit() {
  const n = newName.value.trim(); if (!n) return
  await createHabit({ name: n, icon: newIconStr.value, ringColor: newCustomColor.value })
  view.value = 'tracker'
}

// ───── Analítica ─────
// Heatmap 7×7 últimas 7 semanas (= 49 días, alineado al log)
const WEEK_LABELS = computed(() => Array.from({ length: 7 }, (_, i) =>
  format(addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), i), 'EEEEE', { locale: dateLocale.value }).toUpperCase()))
const heatmap = computed(() => {
  // Para cada hábito, devuelve % de cumplimiento últimas 7 semanas
  return habitsData.value.map(h => {
    const lastWeeks = [] as { weekStart: Date; cells: { day: number; done: boolean }[]; pct: number }[]
    for (let w = 6; w >= 0; w--) {
      const cells = [] as { day: number; done: boolean }[]
      let done = 0
      for (let d = 0; d < 7; d++) {
        const idx = (6 - w) * 7 + d  // 0..48
        const isDone = h.log[idx] === true
        if (isDone) done++
        cells.push({ day: d, done: isDone })
      }
      lastWeeks.push({ weekStart: subDays(today, w * 7 + 6), cells, pct: Math.round((done / 7) * 100) })
    }
    return { habit: h, weeks: lastWeeks }
  })
})
const totalDone = computed(() => habitsData.value.reduce((a, h) => a + h.log.filter(Boolean).length, 0))
const totalSlots = computed(() => habitsData.value.length * 49)
const overallRate = computed(() => totalSlots.value ? Math.round((totalDone.value / totalSlots.value) * 100) : 0)
function removeHabit(id: string) { apiRemoveHabit(id) }
</script>

<template>
  <!-- VISTA DE CREACIÓN -->
  <AppCreateView v-if="view === 'create'"
    :title="t('habits.create.title')"
    :subtitle="t('habits.create.subtitle')"
    :disabled="!newName.trim()"
    @close="cancelCreate" @save="saveHabit">
    <div class="flex flex-col gap-2">
      <label class="text-[12.5px] font-bold text-fg-muted px-1">{{ t('habits.create.nameLabel') }}</label>
      <input v-model="newName" type="text" :placeholder="t('habits.create.namePlaceholder')" autofocus
        class="w-full h-14 rounded-[14px] bg-card px-4 text-[18px] font-semibold text-fg outline-none placeholder:text-fg-subtle" />
    </div>
    <div class="flex flex-col gap-2">
      <label class="text-[12.5px] font-bold text-fg-muted px-1">{{ t('habits.create.iconLabel') }}</label>
      <div class="flex items-center gap-1.5 flex-wrap">
        <button v-for="g in ICON_GALLERY" :key="g.key" type="button" :aria-label="g.key"
          class="grid place-items-center size-10 rounded-[10px] bg-card transition-[background-color,transform]"
          :class="newIconStr === g.key ? '' : 'hover:bg-muted'"
          :style="newIconStr === g.key ? { background: newCustomColor + '33', color: newCustomColor } : { color: 'var(--text-muted)' }"
          @click="newIconStr = g.key">
          <component :is="g.icon" class="size-[17px]" :stroke-width="2" />
        </button>
      </div>
    </div>
    <div class="flex flex-col gap-2 flex-1 min-h-0">
      <label class="text-[12.5px] font-bold text-fg-muted px-1 shrink-0">{{ t('habits.create.colorLabel') }}</label>
      <div class="flex-1 min-h-0">
        <AppColorPicker v-model="newCustomColor" format="hex" />
      </div>
    </div>
  </AppCreateView>

  <!-- VISTA NORMAL: TRACKER SEMANAL TIPO BULLET JOURNAL -->
  <div v-else class="h-full flex flex-col gap-2 md:gap-3 px-3 md:px-7 py-3 md:py-5 relative overflow-hidden">
    <!-- Decoración de nubes -->
    <HibiCloud :size="140" float :duration="7" class="hidden md:block absolute -top-4 -right-8 text-pink-soft opacity-15 pointer-events-none z-40" aria-hidden="true" />
    <HibiCloud :size="80" float :duration="9" :delay="1.2" class="hidden md:block absolute bottom-4 -left-4 text-sky-soft opacity-15 pointer-events-none z-40" aria-hidden="true" />
    <HibiSparkle :size="18" twinkle :duration="2.4" class="hidden md:block absolute top-[20%] left-[6%] text-fg-subtle opacity-25 pointer-events-none z-40" />
    <HibiSparkle :size="14" twinkle :duration="3" :delay="1" class="hidden md:block absolute top-[10%] right-[24%] text-fg-subtle opacity-25 pointer-events-none z-40" />
    <HibiHeart :size="18" beat :duration="2.6" class="hidden md:block absolute bottom-[18%] right-[8%] text-fg-subtle opacity-25 pointer-events-none z-40" />
    <!-- Toolbar -->
    <div class="relative z-10">
      <PageHero :icon="Flame" tone="pink" :title="t('habits.title')" :subtitle="t('habits.subtitle', { done: todayDoneCount, total: habitsData.length })">
        <template #actions>
          <!-- Controles que pueden hacer scroll horizontal -->
          <div class="flex-1 min-w-0 flex items-center gap-1.5 md:gap-2 overflow-x-auto hibi-no-sb">
            <AppSegmented v-model="view" :options="[
              { value: 'tracker', icon: ListChecks, ariaLabel: t('habits.views.tracker') },
              { value: 'analytics', icon: BarChart3, ariaLabel: t('habits.views.analytics') },
            ]" />
            <div v-if="view === 'tracker'" class="inline-flex items-center gap-1 shrink-0">
              <button class="h-9 px-3 rounded-[11px] bg-card text-[13px] font-semibold text-pink-deep hover:bg-inset" @click="weekCursor = subWeeks(weekCursor, 1)">‹</button>
              <button class="h-9 w-[112px] md:w-[170px] shrink-0 rounded-[11px] bg-card text-[13px] font-semibold text-pink-deep hover:bg-inset capitalize text-center truncate" @click="weekCursor = startOfWeek(new Date(), { weekStartsOn: 1 })"><span class="md:hidden">{{ weekRangeShort }}</span><span class="hidden md:inline">{{ weekRange }}</span></button>
              <button class="h-9 px-3 rounded-[11px] bg-card text-[13px] font-semibold text-pink-deep hover:bg-inset" @click="weekCursor = addWeeks(weekCursor, 1)">›</button>
            </div>
          </div>
          <!-- Nuevo: SIEMPRE fijo a la derecha -->
          <AppButton variant="primary" size="sm" class="shrink-0" @click="openCreate"><template #icon><Plus class="size-[16px]" :stroke-width="2.3" /></template>{{ t('habits.new') }}</AppButton>
        </template>
      </PageHero>
    </div>

    <!-- TRACKER -->
    <template v-if="view === 'tracker'">
    <div class="relative z-10 grid grid-cols-3 gap-2 md:gap-3 shrink-0">
      <div class="rounded-[14px] bg-sky-soft text-sky-deep px-3 py-2.5 md:px-4 md:py-3 flex flex-col md:flex-row md:items-center gap-1 md:gap-3 min-w-0">
        <HibiCloudIcon :size="56" :icon="Flame" :icon-size="18" cloud-color="text-sky-soft" icon-color="text-sky-deep" :icon-stroke="2" class="shrink-0 hidden md:flex" />
        <div class="min-w-0">
          <p class="text-[10px] md:text-[11px] font-bold uppercase tracking-wide opacity-80 truncate">{{ t('habits.stats.bestStreak') }}</p>
          <p class="text-[18px] md:text-[22px] font-extrabold leading-none tabular-nums mt-0.5">{{ bestStreakAnim }} <span class="text-[11px] md:text-[12px] font-bold opacity-70">{{ t('habits.stats.days') }}</span></p>
        </div>
      </div>
      <div class="rounded-[14px] bg-mint text-[#34936a] px-3 py-2.5 md:px-4 md:py-3 flex flex-col md:flex-row md:items-center gap-1 md:gap-3 min-w-0">
        <HibiCloudIcon :size="56" :icon="Trophy" :icon-size="18" cloud-color="text-mint" icon-color="text-[#34936a]" :icon-stroke="2" class="shrink-0 hidden md:flex" />
        <div class="min-w-0">
          <p class="text-[10px] md:text-[11px] font-bold uppercase tracking-wide opacity-80 truncate">{{ t('habits.stats.compliance') }}</p>
          <p class="text-[18px] md:text-[22px] font-extrabold leading-none tabular-nums mt-0.5">{{ compliancePctAnim }}<span class="text-[11px] md:text-[12px] font-bold opacity-70">%</span></p>
        </div>
      </div>
      <div class="rounded-[14px] bg-pink-soft text-pink-deep px-3 py-2.5 md:px-4 md:py-3 flex flex-col md:flex-row md:items-center gap-1 md:gap-3 min-w-0">
        <HibiCloudIcon :size="56" :icon="Check" :icon-size="18" cloud-color="text-pink-soft" icon-color="text-pink-deep" :icon-stroke="2.4" class="shrink-0 hidden md:flex" />
        <div class="min-w-0">
          <p class="text-[10px] md:text-[11px] font-bold uppercase tracking-wide opacity-80 truncate">{{ t('habits.stats.todayDone') }}</p>
          <p class="text-[18px] md:text-[22px] font-extrabold leading-none tabular-nums mt-0.5">{{ todayDoneAnim }} / {{ totalHabitsAnim }}</p>
        </div>
      </div>
    </div>

    <AppCard class="relative z-10 flex-1 min-h-0 flex flex-col" :padded="false">
      <div class="flex-1 min-h-0 overflow-y-auto scroll-area px-3 md:px-4 py-3 flex flex-col">
        <!-- Vacío -->
        <div v-if="!habitsData.length && !isLoading" class="flex-1 flex flex-col items-center justify-center text-center gap-3 py-10">
          <HibiCloudIcon :size="96" :icon="Flame" :icon-size="34" cloud-color="text-pink-soft" icon-color="text-pink-deep" :icon-stroke="1.8" />
          <div>
            <p class="text-[15px] font-extrabold text-fg">{{ t('habits.empty.title') }}</p>
            <p class="text-[13px] text-fg-muted mt-0.5">{{ t('habits.empty.hint') }}</p>
          </div>
        </div>
        <!-- ───── DESKTOP: tabla hábito × 7 días ───── -->
        <div v-if="habitsData.length" class="hidden md:flex md:flex-col">
          <!-- HEADER -->
          <div class="grid grid-cols-[minmax(180px,1fr)_repeat(7,minmax(0,1fr))] gap-x-1.5 shrink-0">
            <span class="text-[12px] font-bold text-fg-muted uppercase tracking-wide pb-3 self-end">{{ t('habits.table.header') }}</span>
            <div v-for="(d, i) in days" :key="'h'+i" class="text-center pt-3 pb-3 rounded-t-[12px]"
              :class="isSameDay(d, today) ? 'bg-sky-soft text-sky-deep' : 'text-fg-muted'">
              <p class="text-[10.5px] font-bold uppercase tracking-wide">{{ WEEKDAY_LABELS[i] }}</p>
              <p class="text-[14px] font-extrabold tabular-nums mt-0.5">{{ format(d, 'd') }}</p>
            </div>
          </div>
          <!-- FILAS -->
          <ul class="flex flex-col gap-1.5 shrink-0 mt-1.5">
            <li v-for="h in habitsData" :key="h.id"
              class="group/habit grid grid-cols-[minmax(180px,1fr)_repeat(7,minmax(0,1fr))] gap-x-1.5 items-center">
              <div class="flex items-center gap-2.5 min-w-0 pl-2">
                <HibiCloudIcon :size="48" :icon="h.icon" :icon-size="16" :cloud-color="h.tone || 'text-sky-soft'" :icon-color="h.iconColor || 'text-sky-deep'" :icon-stroke="2" class="shrink-0" :style="!h.tone ? { color: h.ringColor } : undefined" />
                <div class="flex-1 min-w-0">
                  <p class="text-[14px] font-bold text-fg truncate leading-tight">{{ h.name }}</p>
                  <p class="text-[11.5px] text-fg-muted inline-flex items-center gap-1.5 leading-tight mt-0.5">
                    <span class="inline-flex items-center gap-0.5"><Flame class="size-2.5 text-pink-deep" :stroke-width="2.4" />{{ streak(h) }}d</span>
                    <span>·</span>
                    <span>{{ ratePct(h) }}%</span>
                  </p>
                </div>
                <button type="button" class="shrink-0 grid place-items-center size-7 rounded-full text-fg-subtle opacity-0 group-hover/habit:opacity-100 hover:text-pink-deep hover:bg-pink-soft transition-[opacity,background-color,color]" :aria-label="t('habits.delete')" @click="removeHabit(h.id)"><Trash2 class="size-[14px]" :stroke-width="2" /></button>
              </div>
              <button v-for="(d, i) in days" :key="h.id+'-'+i" type="button"
                class="aspect-square max-h-10 w-full rounded-[10px] grid place-items-center transition-[background-color]"
                :class="[
                  isSameDay(d, today) ? 'cursor-pointer' : 'cursor-default',
                  done(h, d) ? '' : (isSameDay(d, today) ? 'bg-sky-soft hover:bg-inset' : 'bg-muted'),
                ]"
                :style="done(h, d) ? { background: h.ringColor } : undefined"
                :disabled="!isSameDay(d, today)"
                :aria-label="isSameDay(d, today) ? (done(h, d) ? t('habits.toggle.unmark') : t('habits.toggle.mark')) : format(d, 'EEEE d', { locale: dateLocale.value })"
                :title="format(d, 'EEEE d', { locale: dateLocale.value })"
                @click="isSameDay(d, today) && toggle(h, d)">
                <Check v-if="done(h, d)" class="size-[13px] text-white" :stroke-width="3" aria-hidden="true" />
              </button>
            </li>
          </ul>
        </div>

        <!-- ───── MÓVIL: una tarjeta por hábito, semana debajo a todo el ancho ───── -->
        <div v-if="habitsData.length" class="md:hidden flex flex-col gap-2">
          <article v-for="h in habitsData" :key="h.id" class="rounded-[14px] bg-muted/50 p-3">
            <div class="flex items-center gap-2.5 mb-3">
              <HibiCloudIcon :size="44" :icon="h.icon" :icon-size="16" :cloud-color="h.tone || 'text-sky-soft'" :icon-color="h.iconColor || 'text-sky-deep'" :icon-stroke="2" class="shrink-0" :style="!h.tone ? { color: h.ringColor } : undefined" />
              <div class="flex-1 min-w-0">
                <p class="text-[15px] font-bold text-fg truncate leading-tight">{{ h.name }}</p>
                <p class="text-[12px] text-fg-muted inline-flex items-center gap-1.5 mt-0.5">
                  <span class="inline-flex items-center gap-0.5"><Flame class="size-3 text-pink-deep" :stroke-width="2.4" />{{ streak(h) }}d</span>
                  <span>·</span><span>{{ ratePct(h) }}%</span>
                </p>
              </div>
              <button type="button" class="shrink-0 grid place-items-center size-8 rounded-full text-fg-subtle hover:text-pink-deep hover:bg-pink-soft transition-[background-color,color]" :aria-label="t('habits.delete')" @click="removeHabit(h.id)"><Trash2 class="size-[15px]" :stroke-width="2" /></button>
            </div>
            <div class="grid grid-cols-7 gap-1.5">
              <button v-for="(d, i) in days" :key="h.id+'m'+i" type="button"
                class="flex flex-col items-center gap-1"
                :disabled="!isSameDay(d, today)"
                :aria-label="isSameDay(d, today) ? (done(h, d) ? t('habits.toggle.unmark') : t('habits.toggle.mark')) : format(d, 'EEEE d', { locale: dateLocale.value })"
                @click="isSameDay(d, today) && toggle(h, d)">
                <span class="text-[10px] font-bold uppercase" :class="isSameDay(d, today) ? 'text-sky-deep' : 'text-fg-subtle'">{{ WEEKDAY_LABELS[i] }}</span>
                <span class="w-full aspect-square rounded-[10px] grid place-items-center transition-[background-color]"
                  :class="done(h, d) ? '' : (isSameDay(d, today) ? 'bg-sky-soft' : 'bg-card')"
                  :style="done(h, d) ? { background: h.ringColor } : undefined">
                  <Check v-if="done(h, d)" class="size-[14px] text-white" :stroke-width="3" aria-hidden="true" />
                </span>
              </button>
            </div>
          </article>
        </div>
      </div>
    </AppCard>
    </template>

    <!-- ANALÍTICA: heatmap GitHub-style + anillos + barras semanales -->
    <template v-if="view === 'analytics'">
      <div class="relative z-10 flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-[280px_1fr] gap-3 overflow-y-auto lg:overflow-hidden scroll-area">
        <!-- IZQUIERDA: lista de hábitos con anillos individuales -->
        <AppCard class="!p-4 flex flex-col overflow-hidden shrink-0 max-h-[42vh] lg:max-h-none lg:min-h-0">
          <h3 class="text-[13px] font-bold text-fg-muted mb-3 shrink-0 px-1">{{ t('habits.title') }}</h3>
          <ul class="flex-1 min-h-0 overflow-y-auto scroll-area flex flex-col gap-1.5 pr-1">
            <!-- "Todos" -->
            <li>
              <button type="button"
                class="w-full flex items-center gap-3 p-3 rounded-[12px] transition-[background-color] text-left"
                :class="!selectedHabitId ? 'bg-sky-soft' : 'hover:bg-muted'"
                @click="selectedHabitId = null">
                <!-- Anillo agregado -->
                <svg viewBox="0 0 36 36" class="size-11 shrink-0 -rotate-90">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="var(--bg-muted)" stroke-width="4" />
                  <circle cx="18" cy="18" r="15" fill="none" stroke="var(--color-sky-deep)" stroke-width="4" stroke-linecap="round"
                    :stroke-dasharray="`${overallRate * 0.942} 94.2`" />
                </svg>
                <div class="flex-1 min-w-0">
                  <p class="text-[13.5px] font-bold text-fg">{{ t('habits.analytics.all') }}</p>
                  <p class="text-[11.5px] text-fg-muted">{{ t('habits.analytics.habitsCount', { count: habitsData.length }) }}</p>
                </div>
                <span class="text-[14px] font-extrabold tabular-nums text-sky-deep">{{ overallRate }}%</span>
              </button>
            </li>
            <!-- Cada hábito -->
            <li v-for="h in habitsData" :key="h.id">
              <button type="button"
                class="w-full flex items-center gap-3 p-3 rounded-[12px] transition-[background-color] text-left"
                :class="selectedHabitId === h.id ? 'bg-sky-soft' : 'hover:bg-muted'"
                @click="selectedHabitId = h.id">
                <svg viewBox="0 0 36 36" class="size-11 shrink-0 -rotate-90">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="var(--bg-muted)" stroke-width="4" />
                  <circle cx="18" cy="18" r="15" fill="none" :stroke="h.ringColor" stroke-width="4" stroke-linecap="round"
                    :stroke-dasharray="`${ratePct(h) * 0.942} 94.2`" />
                </svg>
                <div class="flex-1 min-w-0">
                  <p class="text-[13.5px] font-bold text-fg truncate">{{ h.name }}</p>
                  <p class="text-[11.5px] text-fg-muted inline-flex items-center gap-1">
                    <Flame class="size-2.5 text-pink-deep" :stroke-width="2.4" />{{ streak(h) }} {{ t('habits.stats.days') }}
                  </p>
                </div>
                <span class="text-[14px] font-extrabold tabular-nums" :style="{ color: h.ringColor }">{{ ratePct(h) }}%</span>
              </button>
            </li>
          </ul>
        </AppCard>

        <!-- DERECHA: detalle del hábito (o agregado) -->
        <div class="flex flex-col gap-3 min-h-0 shrink-0 lg:shrink lg:min-h-0">
          <!-- Stats hero (3 cards) -->
          <div class="grid grid-cols-3 gap-2 md:gap-3 shrink-0">
            <AppCard class="!p-3 md:!p-4 flex flex-col md:flex-row md:items-center gap-1 md:gap-3 min-w-0">
              <HibiCloudIcon :size="58" :icon="Flame" :icon-size="18" cloud-color="text-pink-soft" icon-color="text-pink-deep" :icon-stroke="2" class="shrink-0 hidden md:flex" />
              <div class="min-w-0">
                <p class="text-[10px] md:text-[11px] font-bold text-fg-muted uppercase tracking-wide truncate">{{ t('habits.stats.currentStreak') }}</p>
                <p class="text-[19px] md:text-[24px] font-extrabold tabular-nums leading-none mt-0.5">{{ analyticsStreak }} <span class="text-[11px] md:text-[12px] text-fg-muted">{{ t('habits.stats.days') }}</span></p>
              </div>
            </AppCard>
            <AppCard class="!p-3 md:!p-4 flex flex-col md:flex-row md:items-center gap-1 md:gap-3 min-w-0">
              <HibiCloudIcon :size="58" :icon="Trophy" :icon-size="18" cloud-color="text-cream" icon-color="text-[#bf8f2e]" :icon-stroke="2" class="shrink-0 hidden md:flex" />
              <div class="min-w-0">
                <p class="text-[10px] md:text-[11px] font-bold text-fg-muted uppercase tracking-wide truncate">{{ t('habits.stats.bestStreak') }}</p>
                <p class="text-[19px] md:text-[24px] font-extrabold tabular-nums leading-none mt-0.5">{{ analyticsBest }} <span class="text-[11px] md:text-[12px] text-fg-muted">{{ t('habits.stats.days') }}</span></p>
              </div>
            </AppCard>
            <AppCard class="!p-3 md:!p-4 flex flex-col md:flex-row md:items-center gap-1 md:gap-3 min-w-0">
              <HibiCloudIcon :size="58" :icon="Check" :icon-size="18" cloud-color="text-mint" icon-color="text-[#34936a]" :icon-stroke="2.4" class="shrink-0 hidden md:flex" />
              <div class="min-w-0">
                <p class="text-[10px] md:text-[11px] font-bold text-fg-muted uppercase tracking-wide truncate">{{ t('habits.stats.totalDone') }}</p>
                <p class="text-[19px] md:text-[24px] font-extrabold tabular-nums leading-none mt-0.5">{{ analyticsDone }}<span class="text-[11px] md:text-[12px] text-fg-muted"> / {{ analyticsSlots }}</span></p>
              </div>
            </AppCard>
          </div>

          <!-- Heatmap GitHub-style: 14 semanas × 7 días -->
          <AppCard class="!p-4 md:!p-5 flex-1 min-h-[280px] lg:min-h-0 flex flex-col">
            <header class="shrink-0 flex items-center justify-between mb-3">
              <h3 class="text-[14px] font-bold text-fg">
                {{ selectedHabitId ? filteredHabits[0]?.name : t('habits.analytics.global') }}
              </h3>
              <p v-if="heatHover" class="text-[12px] font-semibold text-fg">
                <span class="capitalize">{{ format(heatHover.date, t('habits.heatHoverFormat'), { locale: dateLocale.value }) }}</span>
                <span class="ml-2 px-2 py-0.5 rounded-full text-[11px]"
                  :style="{ background: heatColor + '33', color: heatColor }">{{ heatHover.pct }}%</span>
              </p>
            </header>
            <div class="flex-1 min-h-0 grid grid-cols-[20px_1fr] gap-2 items-center">
              <div class="flex flex-col justify-around text-[9.5px] font-bold text-fg-subtle text-right h-full">
                <span v-for="(d, i) in WEEKDAY_LABELS" :key="i">{{ d }}</span>
              </div>
              <div class="hibi-anim-bars grid grid-rows-7 gap-1.5 h-full" style="grid-template-columns: repeat(14, minmax(0, 1fr));">
                <button v-for="(c, i) in analyticsHeat" :key="i" type="button"
                  class="rounded-[5px] transition-[filter]"
                  :class="heatHover?.idx === i ? 'brightness-125' : ''"
                  :style="cellStyle(c)"
                  :title="`${format(c.date, 'EEE d', { locale: dateLocale.value })}: ${c.pct}%`"
                  @mouseenter="heatHover = { ...c, idx: i }"
                  @mouseleave="heatHover = null"></button>
              </div>
            </div>
            <!-- Leyenda -->
            <div class="shrink-0 flex items-center justify-end gap-2 mt-4 pt-3 border-t border-[var(--bg-muted)]">
              <span class="text-[11px] text-fg-muted font-bold">{{ t('habits.analytics.less') }}</span>
              <span v-for="p in [0, 25, 50, 75, 100]" :key="p" class="size-3.5 rounded-[3px]"
                :style="{ background: p === 0 ? 'var(--bg-muted)' : heatColor + Math.round((p / 100) * 200 + 55).toString(16).padStart(2, '0') }"></span>
              <span class="text-[11px] text-fg-muted font-bold">{{ t('habits.analytics.more') }}</span>
            </div>
          </AppCard>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.hibi-no-sb { scrollbar-width: none; }
.hibi-no-sb::-webkit-scrollbar { display: none; }
</style>
