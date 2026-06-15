<script setup lang="ts">
import { Plus, Target, Calendar } from '@lucide/vue'

useHead({ title: 'Hibi — Objetivos' })

interface Goal { id: string; title: string; target: string; progress: number; tone: string; ringColor: string; projects: string[] }
const goals: Goal[] = [
  { id: 'g1', title: 'Leer 12 libros en el año', target: 'Dic 2026', progress: 58, tone: 'bg-sky-soft text-sky-deep', ringColor: 'var(--color-sky-deep)', projects: ['Lecturas'] },
  { id: 'g2', title: 'Aprender japonés básico', target: 'Sep 2026', progress: 32, tone: 'bg-pink-soft text-pink-deep', ringColor: 'var(--color-pink-deep)', projects: ['Japonés', 'Personal'] },
  { id: 'g3', title: 'Correr una media maratón', target: 'Oct 2026', progress: 71, tone: 'bg-mint text-[#34936a]', ringColor: '#34936a', projects: ['Salud'] },
  { id: 'g4', title: 'Ahorrar 3000€', target: 'Dic 2026', progress: 45, tone: 'bg-peach text-[#c5733f]', ringColor: '#c5733f', projects: ['Finanzas'] },
  { id: 'g5', title: 'Acabar curso de UX', target: 'Ago 2026', progress: 90, tone: 'bg-lavender text-[#7a63c0]', ringColor: '#7a63c0', projects: ['Trabajo'] },
  { id: 'g6', title: 'Visitar 5 países', target: 'Dic 2026', progress: 20, tone: 'bg-sky-soft text-sky-deep', ringColor: 'var(--color-sky-deep)', projects: ['Viajes'] },
]
const goalsData = ref(goals)
function ringDash(p: number, r = 40) {
  const c = 2 * Math.PI * r
  return { dash: (p / 100) * c, total: c }
}

const creating = ref(false)
const newTitle = ref(''); const newTarget = ref(''); const newTone = ref(0)
const TONES = [
  { tone: 'bg-sky-soft text-sky-deep', ringColor: 'var(--color-sky-deep)' },
  { tone: 'bg-pink-soft text-pink-deep', ringColor: 'var(--color-pink-deep)' },
  { tone: 'bg-mint text-[#34936a]', ringColor: '#34936a' },
  { tone: 'bg-peach text-[#c5733f]', ringColor: '#c5733f' },
  { tone: 'bg-lavender text-[#7a63c0]', ringColor: '#7a63c0' },
]
let nextId = 100
function startCreate() { creating.value = true; nextTick(() => document.getElementById('new-goal-title')?.focus()) }
function cancelCreate() { creating.value = false; newTitle.value = ''; newTarget.value = '' }
function saveGoal() {
  const t = newTitle.value.trim(); if (!t) return
  const c = TONES[newTone.value]!
  goalsData.value.unshift({ id: 'g' + (nextId++), title: t, target: newTarget.value || 'Sin fecha', progress: 0, tone: c.tone, ringColor: c.ringColor, projects: [] })
  cancelCreate()
}
</script>

<template>
  <div class="h-full flex flex-col gap-3 px-4 md:px-7 py-5">
    <AppCard class="shrink-0 !p-3 md:!p-4 flex items-center justify-between gap-3">
      <div class="flex items-center gap-2.5">
        <span class="grid place-items-center size-10 rounded-[13px] bg-lavender text-[#7a63c0]" aria-hidden="true"><Target class="size-5" :stroke-width="1.9" /></span>
        <div>
          <h1 class="text-[20px] md:text-[22px] font-extrabold text-fg leading-tight">Objetivos</h1>
          <p class="text-[12.5px] text-fg-muted leading-tight">{{ goalsData.length }} activos, progreso medio {{ goalsData.length ? Math.round(goalsData.reduce((a,g)=>a+g.progress,0)/goalsData.length) : 0 }}%</p>
        </div>
      </div>
      <AppButton variant="primary" size="sm" @click="startCreate"><template #icon><Plus class="size-[16px]" :stroke-width="2.3" /></template>Nuevo</AppButton>
    </AppCard>

    <div class="flex-1 min-h-0 overflow-y-auto scroll-area flex flex-col gap-3">
      <Transition name="inline-form">
        <AppCard v-if="creating" class="!p-4">
          <form aria-label="Nuevo objetivo" class="staggered flex flex-col gap-2.5" @submit.prevent="saveGoal" @keydown.escape="cancelCreate">
            <label for="new-goal-title" class="sr-only">Título</label>
            <input id="new-goal-title" v-model="newTitle" type="text" placeholder="¿Qué objetivo te marcas?" class="w-full h-10 rounded-[10px] bg-muted focus:bg-inset px-3 text-[14.5px] font-semibold text-fg outline-none" />
            <div class="grid grid-cols-2 gap-2">
              <input v-model="newTarget" type="text" placeholder="Para cuándo (ej. Dic 2026)" class="h-10 rounded-[10px] bg-muted focus:bg-inset px-3 text-[13px] text-fg outline-none" />
              <div class="flex items-center gap-1.5 px-1">
                <span class="text-[12px] text-fg-muted shrink-0">Color:</span>
                <button v-for="(c, i) in TONES" :key="i" type="button" :aria-label="`Color ${i+1}`"
                  class="size-6 rounded-full transition-[outline-width]" :class="[c.tone.split(' ')[0], newTone === i ? 'outline outline-2 outline-offset-2 outline-sky-deep' : '']"
                  @click="newTone = i"></button>
              </div>
            </div>
            <div class="flex items-center justify-end gap-2">
              <button type="button" class="h-9 px-3.5 rounded-[10px] text-[13px] font-semibold text-fg-muted hover:bg-muted" @click="cancelCreate">Cancelar</button>
              <button type="submit" :disabled="!newTitle.trim()" class="h-9 px-4 rounded-[10px] bg-sky text-[#1f4661] text-[13px] font-bold disabled:opacity-50">Crear</button>
            </div>
          </form>
        </AppCard>
      </Transition>
      <div class="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 auto-rows-fr">
        <AppCard v-for="g in goalsData" :key="g.id" interactive class="flex gap-4 !p-5">
          <div class="shrink-0 relative">
            <svg width="96" height="96" viewBox="0 0 100 100" aria-label="Progreso">
              <circle cx="50" cy="50" r="40" fill="none" stroke="var(--bg-muted)" stroke-width="10" />
              <circle cx="50" cy="50" r="40" fill="none"
                :stroke="g.ringColor" stroke-width="10" stroke-linecap="round"
                :stroke-dasharray="`${ringDash(g.progress).dash} ${ringDash(g.progress).total}`"
                transform="rotate(-90 50 50)" />
            </svg>
            <div class="absolute inset-0 grid place-items-center">
              <p class="text-[20px] font-extrabold text-fg leading-none">{{ g.progress }}<span class="text-[11px] text-fg-muted">%</span></p>
            </div>
          </div>
          <div class="flex-1 min-w-0 flex flex-col">
            <h3 class="text-[15.5px] font-extrabold text-fg leading-snug">{{ g.title }}</h3>
            <p class="text-[12.5px] text-fg-muted inline-flex items-center gap-1 mt-1"><Calendar class="size-3" :stroke-width="2" aria-hidden="true" />{{ g.target }}</p>
            <div class="flex flex-wrap gap-1 mt-auto pt-2">
              <span v-for="p in g.projects" :key="p" class="text-[11px] font-bold px-2 h-6 grid place-items-center rounded-full" :class="g.tone">{{ p }}</span>
            </div>
          </div>
        </AppCard>
      </div>
    </div>
  </div>
</template>
