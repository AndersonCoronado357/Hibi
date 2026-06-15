<script setup lang="ts">
import { Plus, Flame, Check, TrendingUp, Award, Droplet, BookOpen, Leaf, StretchHorizontal } from '@lucide/vue'
import { markRaw, type Component } from 'vue'
import { subDays, addDays } from 'date-fns'

useHead({ title: 'Hibi — Hábitos' })

interface Habit {
  id: string; name: string; icon: Component; color: string
  streak: number; best: number; rate: number; log: number[]
}
function genLog(target: number) {
  return Array.from({ length: 91 }, () => (Math.random() < target ? Math.ceil(Math.random() * 3) : 0))
}
const ICON_OPTIONS = [
  { v: 'Droplet', icon: markRaw(Droplet), color: 'bg-sky-soft text-sky-deep' },
  { v: 'BookOpen', icon: markRaw(BookOpen), color: 'bg-pink-soft text-pink-deep' },
  { v: 'Leaf', icon: markRaw(Leaf), color: 'bg-mint text-[#34936a]' },
  { v: 'StretchHorizontal', icon: markRaw(StretchHorizontal), color: 'bg-peach text-[#c5733f]' },
  { v: 'Flame', icon: markRaw(Flame), color: 'bg-lavender text-[#7a63c0]' },
]

const habitsData = ref<Habit[]>([
  { id: 'h1', name: 'Beber agua', icon: markRaw(Droplet), color: 'bg-sky-soft text-sky-deep', streak: 12, best: 28, rate: 86, log: genLog(0.85) },
  { id: 'h2', name: 'Leer 20 min', icon: markRaw(BookOpen), color: 'bg-pink-soft text-pink-deep', streak: 5, best: 18, rate: 64, log: genLog(0.62) },
  { id: 'h3', name: 'Meditar', icon: markRaw(Leaf), color: 'bg-mint text-[#34936a]', streak: 3, best: 21, rate: 52, log: genLog(0.5) },
  { id: 'h4', name: 'Estiramientos', icon: markRaw(StretchHorizontal), color: 'bg-peach text-[#c5733f]', streak: 0, best: 14, rate: 38, log: genLog(0.36) },
])

const selectedId = ref<string>('h1')
const selected = computed(() => habitsData.value.find(h => h.id === selectedId.value)!)

const creating = ref(false)
const newName = ref(''); const newIcon = ref(ICON_OPTIONS[0]!)
let nextId = 100
function startCreate() { creating.value = true; nextTick(() => document.getElementById('new-hab-name')?.focus()) }
function cancelCreate() { creating.value = false; newName.value = '' }
function saveHabit() {
  const n = newName.value.trim(); if (!n) return
  const id = 'h' + (nextId++)
  habitsData.value.push({ id, name: n, icon: newIcon.value.icon, color: newIcon.value.color, streak: 0, best: 0, rate: 0, log: genLog(0) })
  selectedId.value = id
  cancelCreate()
}

const cells = computed(() => {
  const out: { v: number; date: Date }[][] = []
  const start = subDays(new Date(), 90)
  for (let w = 0; w < 13; w++) {
    const col: { v: number; date: Date }[] = []
    for (let r = 0; r < 7; r++) {
      const i = w * 7 + r
      col.push({ v: selected.value.log[i] ?? 0, date: addDays(start, i) })
    }
    out.push(col)
  }
  return out
})
const cellColor = (v: number) => v === 0 ? 'bg-muted' : v === 1 ? 'bg-sky-soft' : v === 2 ? 'bg-sky' : 'bg-sky-deep'
const todayDone = (h: Habit) => h.log[h.log.length - 1]! > 0
const weekDays = ['L','M','X','J','V','S','D']
const badges = computed(() => [
  { earned: selected.value.best >= 7, label: '7 días' },
  { earned: selected.value.best >= 21, label: '21 días' },
  { earned: selected.value.best >= 30, label: 'Un mes' },
  { earned: selected.value.best >= 100, label: '100 días' },
])
</script>

<template>
  <div class="h-full flex flex-col gap-3 px-4 md:px-7 py-5">
    <!-- Toolbar -->
    <AppCard class="shrink-0 !p-3 md:!p-4 flex items-center justify-between gap-3">
      <div class="flex items-center gap-2.5">
        <span class="grid place-items-center size-10 rounded-[13px] bg-pink-soft text-pink-deep" aria-hidden="true"><Flame class="size-5" :stroke-width="1.9" /></span>
        <div>
          <h1 class="text-[20px] md:text-[22px] font-extrabold text-fg leading-tight">Hábitos</h1>
          <p class="text-[12.5px] text-fg-muted leading-tight">{{ habitsData.length }} hábitos, racha media {{ habitsData.length ? Math.round(habitsData.reduce((a,h)=>a+h.streak,0)/habitsData.length) : 0 }} días</p>
        </div>
      </div>
      <AppButton variant="primary" size="sm" @click="startCreate"><template #icon><Plus class="size-[16px]" :stroke-width="2.3" /></template>Nuevo</AppButton>
    </AppCard>

    <div class="flex-1 min-h-0 flex flex-col lg:flex-row gap-3 overflow-y-auto lg:overflow-hidden scroll-area">
      <!-- Lista -->
      <AppCard class="lg:w-[340px] shrink-0 flex flex-col" :padded="false">
        <h2 class="px-4 pt-4 pb-2 text-[13px] font-bold text-fg-muted">Tus hábitos</h2>
        <div class="flex-1 min-h-0 overflow-y-auto scroll-area px-2 pb-3 flex flex-col gap-1">
          <Transition name="inline-form">
            <form v-if="creating" aria-label="Nuevo hábito" class="staggered bg-muted rounded-[14px] p-3 mx-1 mb-1 flex flex-col gap-2" @submit.prevent="saveHabit" @keydown.escape="cancelCreate">
              <label for="new-hab-name" class="sr-only">Nombre</label>
              <input id="new-hab-name" v-model="newName" type="text" placeholder="Nombre del hábito" class="w-full h-10 rounded-[10px] bg-card focus:bg-inset px-3 text-[14px] font-semibold text-fg outline-none" />
              <div class="flex items-center gap-1.5">
                <button v-for="o in ICON_OPTIONS" :key="o.v" type="button" :aria-label="o.v"
                  class="grid place-items-center size-10 rounded-[12px] transition-[outline-width]"
                  :class="[o.color, newIcon.v === o.v ? 'outline outline-2 outline-offset-2 outline-sky-deep' : '']"
                  @click="newIcon = o"><component :is="o.icon" class="size-[18px]" :stroke-width="1.9" /></button>
              </div>
              <div class="flex items-center justify-end gap-2">
                <button type="button" class="h-9 px-3.5 rounded-[10px] text-[13px] font-semibold text-fg-muted hover:bg-card" @click="cancelCreate">Cancelar</button>
                <button type="submit" :disabled="!newName.trim()" class="h-9 px-4 rounded-[10px] bg-sky text-[#1f4661] text-[13px] font-bold disabled:opacity-50">Crear</button>
              </div>
            </form>
          </Transition>
          <button v-for="h in habitsData" :key="h.id" type="button"
            class="flex items-center gap-3 p-3 rounded-[12px] transition-[background-color] text-left"
            :class="selectedId === h.id ? 'bg-sky-soft' : 'hover:bg-muted'"
            @click="selectedId = h.id"
          >
            <span class="grid place-items-center size-11 rounded-[13px]" :class="h.color" aria-hidden="true"><component :is="h.icon" class="size-[20px]" :stroke-width="1.9" /></span>
            <div class="flex-1 min-w-0">
              <p class="text-[14.5px] font-bold text-fg truncate">{{ h.name }}</p>
              <p class="text-[12px] text-fg-muted inline-flex items-center gap-1">
                <Flame class="size-[12px] text-pink-deep" :stroke-width="2.2" aria-hidden="true" />
                {{ h.streak }} días, {{ h.rate }}%
              </p>
            </div>
            <button type="button"
              class="grid place-items-center size-8 rounded-full transition-[background-color,color]"
              :class="todayDone(h) ? 'bg-mint text-[#34936a]' : 'bg-card text-fg-subtle hover:bg-sky-soft hover:text-sky-deep'"
              :aria-label="todayDone(h) ? 'Hecho hoy' : 'Marcar hoy'" @click.stop
            ><Check class="size-4" :stroke-width="2.4" /></button>
          </button>
        </div>
      </AppCard>

      <!-- Detalle: stats + heatmap -->
      <section class="flex-1 min-w-0 flex flex-col gap-3 min-h-0">
        <!-- Hero del hábito con racha -->
        <AppCard class="!p-5">
          <div class="flex items-center gap-4">
            <span class="grid place-items-center size-14 rounded-[16px]" :class="selected.color" aria-hidden="true"><component :is="selected.icon" class="size-[24px]" :stroke-width="1.9" /></span>
            <div class="flex-1">
              <h2 class="text-[22px] font-extrabold text-fg leading-tight">{{ selected.name }}</h2>
              <p class="text-[13px] text-fg-muted">Hoy {{ todayDone(selected) ? 'completado' : 'pendiente' }}</p>
            </div>
            <div class="inline-flex items-center gap-1.5 bg-pink-soft text-pink-deep h-9 px-3 rounded-full font-extrabold text-[15px]">
              <Flame class="size-[16px]" :stroke-width="2.3" aria-hidden="true" />{{ selected.streak }} <span class="font-semibold text-[12px] opacity-80 ml-0.5">en racha</span>
            </div>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5">
            <div v-for="(b, i) in badges" :key="i"
              class="rounded-[12px] px-3 py-2.5 text-center"
              :class="b.earned ? 'bg-[#fff1cf] text-[#bf8f2e]' : 'bg-muted text-fg-subtle opacity-60'"
            >
              <Award class="size-[18px] mx-auto" :stroke-width="b.earned ? 2.2 : 1.6" aria-hidden="true" />
              <p class="text-[11.5px] font-bold mt-1">{{ b.label }}</p>
            </div>
          </div>
        </AppCard>

        <!-- Heatmap + stats -->
        <AppCard class="flex flex-col flex-1 min-h-0">
          <div class="flex items-center justify-between mb-3 shrink-0">
            <h3 class="text-[14px] font-bold text-fg">Últimas 13 semanas</h3>
            <div class="flex items-center gap-1.5 text-[11px] text-fg-subtle">
              Menos
              <span class="size-3 rounded bg-muted" /><span class="size-3 rounded bg-sky-soft" /><span class="size-3 rounded bg-sky" /><span class="size-3 rounded bg-sky-deep" />
              Más
            </div>
          </div>
          <div class="flex-1 min-h-0 overflow-x-auto scroll-area">
            <div class="flex gap-1.5 items-start">
              <div class="flex flex-col gap-1 mr-1">
                <span v-for="(d,i) in weekDays" :key="i" class="text-[10px] font-semibold text-fg-subtle h-3.5 grid place-items-center">{{ i % 2 === 0 ? d : '' }}</span>
              </div>
              <div v-for="(col, ci) in cells" :key="ci" class="flex flex-col gap-1">
                <span v-for="(cell, ri) in col" :key="ri" class="size-3.5 rounded-[4px]" :class="cellColor(cell.v)" />
              </div>
            </div>
          </div>
          <div class="grid grid-cols-3 gap-3 mt-4 shrink-0">
            <div class="rounded-[12px] bg-muted px-3 py-3 flex items-center gap-2">
              <span class="grid place-items-center size-9 rounded-[10px] bg-pink-soft text-pink-deep"><Flame class="size-[17px]" :stroke-width="1.9" /></span>
              <div><p class="text-[11px] text-fg-muted font-semibold">Actual</p><p class="text-[18px] font-extrabold text-fg leading-none">{{ selected.streak }} días</p></div>
            </div>
            <div class="rounded-[12px] bg-muted px-3 py-3 flex items-center gap-2">
              <span class="grid place-items-center size-9 rounded-[10px] bg-mint text-[#34936a]"><Award class="size-[17px]" :stroke-width="1.9" /></span>
              <div><p class="text-[11px] text-fg-muted font-semibold">Mejor</p><p class="text-[18px] font-extrabold text-fg leading-none">{{ selected.best }} días</p></div>
            </div>
            <div class="rounded-[12px] bg-muted px-3 py-3 flex items-center gap-2">
              <span class="grid place-items-center size-9 rounded-[10px] bg-sky-soft text-sky-deep"><TrendingUp class="size-[17px]" :stroke-width="1.9" /></span>
              <div><p class="text-[11px] text-fg-muted font-semibold">Cumplimiento</p><p class="text-[18px] font-extrabold text-fg leading-none">{{ selected.rate }}%</p></div>
            </div>
          </div>
        </AppCard>
      </section>
    </div>
  </div>
</template>
