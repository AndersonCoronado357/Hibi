<script setup lang="ts">
import { Plus, BookHeart, CloudSun, Frown, Meh, Smile, Laugh, Angry, Sparkles } from '@lucide/vue'
import { markRaw, type Component } from 'vue'
import { format, subDays, isSameDay, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth } from 'date-fns'
import { es } from 'date-fns/locale'

useHead({ title: 'Hibi — Diario' })

interface Entry { date: Date; mood: 1|2|3|4|5; energy: 1|2|3|4|5; weather?: string; preview: string }
const today = new Date()
const entries: Entry[] = [
  { date: today, mood: 4, energy: 4, weather: 'soleado', preview: 'Mañana productiva. Café temprano, lectura, paseo largo por el parque…' },
  { date: subDays(today, 1), mood: 3, energy: 3, weather: 'nublado', preview: 'Día tranquilo, mucho trabajo de pantalla. Por la noche peli con Lu.' },
  { date: subDays(today, 2), mood: 5, energy: 4, weather: 'soleado', preview: 'Comida en casa de los abuelos. La luz de junio entrando por la ventana…' },
  { date: subDays(today, 3), mood: 2, energy: 2, weather: 'lluvia', preview: 'Cabeza pesada, dormí mal. Salí poco. Cocinar me ordenó la tarde.' },
  { date: subDays(today, 4), mood: 4, energy: 5, preview: 'Volví a correr 5K sin parar. Muy buen ánimo, ganas de seguir.' },
]
const todayEntry = computed(() => entries.find(e => isSameDay(e.date, today)))
const mood = ref<Entry['mood']>(todayEntry.value?.mood ?? 3)

interface Mood { v: 1|2|3|4|5; icon: Component; label: string; color: string }
const moods: Mood[] = [
  { v: 1, icon: markRaw(Angry), label: 'Mal', color: 'bg-pink-soft text-pink-deep' },
  { v: 2, icon: markRaw(Frown), label: 'Bajo', color: 'bg-peach text-[#c5733f]' },
  { v: 3, icon: markRaw(Meh), label: 'Normal', color: 'bg-cream text-[#bf8f2e]' },
  { v: 4, icon: markRaw(Smile), label: 'Bien', color: 'bg-mint text-[#34936a]' },
  { v: 5, icon: markRaw(Laugh), label: 'Genial', color: 'bg-sky-soft text-sky-deep' },
]

const PROMPTS = [
  '¿Qué fue lo mejor del día?',
  '¿Por qué te sentiste así?',
  'Una persona por la que te sientes agradecido.',
  '¿Qué te gustaría recordar de hoy en un año?',
  'Algo pequeño que te hizo sonreír.',
]
const prompt = ref(PROMPTS[Math.floor(Math.random() * PROMPTS.length)])

// Mini calendario del mes con días marcados
const monthDays = computed(() => {
  const gs = startOfWeek(startOfMonth(today), { weekStartsOn: 1 })
  const ge = endOfWeek(endOfMonth(today), { weekStartsOn: 1 })
  const out: Date[] = []; let d = gs
  while (d <= ge) { out.push(d); d = addDays(d, 1) }
  return out
})
const hasEntryOn = (d: Date) => entries.some(e => isSameDay(e.date, d))

// Sparkline
const sparkData = computed(() => {
  const xs: { x: number; y: number }[] = []
  for (let i = 13; i >= 0; i--) {
    const d = subDays(today, i)
    const e = entries.find(x => isSameDay(x.date, d))
    xs.push({ x: 13 - i, y: e?.mood ?? 0 })
  }
  return xs
})
const sparkPath = computed(() => {
  const pts = sparkData.value
  const w = 280, h = 60, pad = 4
  const stepX = (w - pad * 2) / Math.max(1, pts.length - 1)
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${pad + i * stepX} ${pad + (h - pad*2) * (1 - p.y / 5)}`).join(' ')
})
</script>

<template>
  <div class="h-full flex flex-col gap-3 px-4 md:px-7 py-5">
    <!-- Toolbar -->
    <AppCard class="shrink-0 !p-3 md:!p-4 flex items-center justify-between gap-3">
      <div class="flex items-center gap-2.5">
        <span class="grid place-items-center size-10 rounded-[13px] bg-pink-soft text-pink-deep" aria-hidden="true"><BookHeart class="size-5" :stroke-width="1.9" /></span>
        <div>
          <h1 class="text-[20px] md:text-[22px] font-extrabold text-fg leading-tight">Diario</h1>
          <p class="text-[12.5px] text-fg-muted leading-tight">{{ entries.length }} entradas este mes</p>
        </div>
      </div>
      <AppButton variant="primary" size="sm"><template #icon><Plus class="size-[16px]" :stroke-width="2.3" /></template>Hoy</AppButton>
    </AppCard>

    <div class="flex-1 min-h-0 flex flex-col lg:flex-row gap-3 overflow-y-auto lg:overflow-hidden scroll-area">
      <!-- Entrada de hoy -->
      <section class="flex-1 min-w-0 flex flex-col gap-3 min-h-0">
        <AppCard>
          <p class="text-[12.5px] font-bold text-sky-deep capitalize">{{ format(today, "EEEE d 'de' MMMM", { locale: es }) }}</p>
          <h2 class="text-[24px] font-extrabold text-fg mt-1">¿Cómo estás hoy?</h2>
          <div class="flex items-center justify-between mt-4 gap-2">
            <button v-for="m in moods" :key="m.v" type="button"
              class="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-[14px] transition-[background-color,color]"
              :class="mood === m.v ? m.color : 'bg-muted text-fg-muted hover:text-fg'"
              :aria-label="m.label" @click="mood = m.v as Entry['mood']"
            ><component :is="m.icon" class="size-[26px]" :stroke-width="1.7" aria-hidden="true" /><span class="text-[11px] font-bold">{{ m.label }}</span></button>
          </div>

          <div class="mt-5 rounded-[12px] bg-sky-soft px-4 py-3 flex items-start gap-2.5">
            <Sparkles class="size-[16px] text-sky-deep shrink-0 mt-0.5" :stroke-width="2.1" aria-hidden="true" />
            <div class="flex-1">
              <p class="text-[11.5px] font-bold text-sky-deep uppercase tracking-wide">Para empezar</p>
              <p class="text-[14px] text-fg font-semibold mt-0.5">{{ prompt }}</p>
            </div>
            <button class="text-[12px] font-bold text-sky-deep hover:underline shrink-0" @click="prompt = PROMPTS[Math.floor(Math.random()*PROMPTS.length)]">Otro</button>
          </div>

          <label for="journal-body" class="sr-only">Escribe tu entrada</label>
          <textarea id="journal-body" rows="6"
            class="w-full mt-4 rounded-[12px] bg-muted focus:bg-inset px-4 py-3 text-[15px] text-fg outline-none resize-none transition-[background-color]"
            placeholder="¿Cómo ha ido el día? Qué tal te sientes, qué te ha pasado…"></textarea>
        </AppCard>

        <AppCard class="!p-4 flex-1 min-h-0 flex flex-col">
          <div class="flex items-center justify-between mb-2 shrink-0">
            <h3 class="text-[14px] font-bold text-fg">Ánimo, últimos 14 días</h3>
            <CloudSun class="size-4 text-sky-deep" :stroke-width="1.8" aria-hidden="true" />
          </div>
          <svg viewBox="0 0 280 60" class="w-full flex-1 min-h-0" preserveAspectRatio="none" aria-label="Gráfico de ánimo">
            <path :d="sparkPath" fill="none" stroke="var(--color-sky-deep)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
            <circle v-for="(p, i) in sparkData" :key="i" :cx="4 + (272/13) * i" :cy="4 + 52 * (1 - p.y/5)" r="2.5" fill="var(--color-sky-deep)" />
          </svg>
        </AppCard>
      </section>

      <!-- Sidebar: mini-calendario con días marcados + entradas -->
      <aside class="lg:w-[340px] shrink-0 flex flex-col gap-3 min-h-0">
        <AppCard class="!p-4">
          <h3 class="text-[14px] font-bold text-fg mb-3 capitalize">{{ format(today, 'MMMM yyyy', { locale: es }) }}</h3>
          <div class="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-wide text-fg-subtle mb-1">
            <span v-for="d in ['L','M','X','J','V','S','D']" :key="d">{{ d }}</span>
          </div>
          <div class="grid grid-cols-7 gap-1">
            <div v-for="d in monthDays" :key="d.toISOString()" class="aspect-square grid place-items-center text-[12px] rounded-[8px]"
              :class="[
                !isSameMonth(d, today) ? 'text-fg-subtle opacity-50' : 'text-fg',
                isSameDay(d, today) ? 'bg-sky text-[#1f4661] font-bold' : '',
                hasEntryOn(d) && !isSameDay(d, today) ? 'bg-pink-soft text-pink-deep font-bold' : '',
              ]">{{ format(d, 'd') }}</div>
          </div>
        </AppCard>
        <AppCard class="flex-1 min-h-0 flex flex-col" :padded="false">
          <h3 class="px-4 pt-4 pb-2 text-[14px] font-bold text-fg shrink-0">Anteriores</h3>
          <div class="flex-1 min-h-0 overflow-y-auto scroll-area px-2 pb-3 flex flex-col gap-1">
            <button v-for="e in entries.slice(1)" :key="e.date.toISOString()" class="text-left p-3 rounded-[12px] hover:bg-muted flex gap-3 items-start transition-[background-color]">
              <span class="grid place-items-center size-11 rounded-[12px] shrink-0" :class="moods[e.mood-1]!.color" aria-hidden="true"><component :is="moods[e.mood-1]!.icon" class="size-[20px]" :stroke-width="1.7" /></span>
              <div class="flex-1 min-w-0">
                <p class="text-[13px] font-bold text-fg capitalize">{{ format(e.date, "EEEE d", { locale: es }) }} <span class="text-fg-muted font-medium ml-1">· energía {{ e.energy }}/5</span></p>
                <p class="text-[12.5px] text-fg-muted line-clamp-2 mt-0.5">{{ e.preview }}</p>
              </div>
            </button>
          </div>
        </AppCard>
      </aside>
    </div>
  </div>
</template>
