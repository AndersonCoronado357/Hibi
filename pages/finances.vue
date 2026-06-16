<script setup lang="ts">
import { Plus, Wallet, TrendingDown, TrendingUp, Repeat, ShoppingBag, Home as HomeI, Utensils, Bus, Film, HeartPulse } from '@lucide/vue'

useHead({ title: 'Hibi — Finanzas' })

interface Category { key: string; name: string; amount: number; budget: number; color: string; icon: any; tone: string }
const categories: Category[] = [
  { key: 'food', name: 'Comida', amount: 320, budget: 400, color: '#5aa6d2', icon: Utensils, tone: 'bg-sky-soft text-sky-deep' },
  { key: 'home', name: 'Hogar', amount: 540, budget: 600, color: '#34936a', icon: HomeI, tone: 'bg-mint text-[#34936a]' },
  { key: 'transport', name: 'Transporte', amount: 120, budget: 150, color: '#c5733f', icon: Bus, tone: 'bg-peach text-[#c5733f]' },
  { key: 'ocio', name: 'Ocio', amount: 180, budget: 200, color: '#db8aa3', icon: Film, tone: 'bg-pink-soft text-pink-deep' },
  { key: 'health', name: 'Salud', amount: 90, budget: 100, color: '#7a63c0', icon: HeartPulse, tone: 'bg-lavender text-[#7a63c0]' },
  { key: 'others', name: 'Otros', amount: 60, budget: 100, color: '#bf8f2e', icon: ShoppingBag, tone: 'bg-cream text-[#bf8f2e]' },
]
const totalExpense = computed(() => categories.reduce((a, c) => a + c.amount, 0))
const income = 2150
const net = computed(() => income - totalExpense.value)

const arcs = computed(() => {
  const r = 60, cx = 80, cy = 80
  let acc = 0
  return categories.map(c => {
    const start = (acc / totalExpense.value) * Math.PI * 2 - Math.PI / 2
    acc += c.amount
    const end = (acc / totalExpense.value) * Math.PI * 2 - Math.PI / 2
    const large = end - start > Math.PI ? 1 : 0
    const x1 = cx + r * Math.cos(start), y1 = cy + r * Math.sin(start)
    const x2 = cx + r * Math.cos(end), y2 = cy + r * Math.sin(end)
    return { d: `M${cx} ${cy} L${x1} ${y1} A${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`, color: c.color }
  })
})

interface Tx { id: string; title: string; cat: string; date: string; amount: number; sub?: boolean }
const txs: Tx[] = [
  { id: 't1', title: 'Mercadona', cat: 'food', date: 'Hoy', amount: -38.40 },
  { id: 't2', title: 'Café con María', cat: 'ocio', date: 'Hoy', amount: -4.80 },
  { id: 't3', title: 'Alquiler junio', cat: 'home', date: 'Ayer', amount: -540 },
  { id: 't4', title: 'Spotify', cat: 'ocio', date: '2 jun', amount: -10.99, sub: true },
  { id: 't5', title: 'Nómina', cat: '', date: '1 jun', amount: 2150 },
  { id: 't6', title: 'Bus mensual', cat: 'transport', date: '1 jun', amount: -42 },
]
const txsData = ref(txs)
const subscriptions = computed(() => txsData.value.filter(t => t.sub))
const fmt = (v: number) => v.toLocaleString('es-ES', { style:'currency', currency:'EUR' })

const creating = ref(false)
const newTitle = ref(''); const newAmount = ref(0); const newCat = ref('food'); const newType = ref<'expense'|'income'>('expense'); const newDate = ref('Hoy')
let nextId = 100
function startCreate() { creating.value = true; nextTick(() => document.getElementById('new-tx-title')?.focus()) }
function cancelCreate() { creating.value = false; newTitle.value = ''; newAmount.value = 0 }
function saveTx() {
  const t = newTitle.value.trim(); if (!t || !newAmount.value) return
  const sign = newType.value === 'income' ? 1 : -1
  txsData.value.unshift({ id: 't' + (nextId++), title: t, cat: newType.value === 'income' ? '' : newCat.value, date: newDate.value, amount: sign * Math.abs(Number(newAmount.value)) })
  cancelCreate()
}
</script>

<template>
  <div class="h-full flex flex-col gap-3 px-4 md:px-7 py-5">
    <AppCard class="shrink-0 !p-3 md:!p-4 flex items-center justify-between gap-3">
      <div class="flex items-center gap-2.5">
        <span class="grid place-items-center size-10 rounded-[13px] bg-mint text-[#34936a]" aria-hidden="true"><Wallet class="size-5" :stroke-width="1.9" /></span>
        <div>
          <h1 class="text-[20px] md:text-[22px] font-extrabold text-fg leading-tight">Finanzas</h1>
          <p class="text-[12.5px] text-fg-muted leading-tight">Junio, {{ txsData.length }} movimientos</p>
        </div>
      </div>
      <AppButton variant="primary" size="sm" @click="startCreate"><template #icon><Plus class="size-[16px]" :stroke-width="2.3" /></template>Movimiento</AppButton>
    </AppCard>

    <div class="flex-1 min-h-0 overflow-y-auto scroll-area flex flex-col gap-3">
      <Transition name="inline-form">
        <AppCard v-if="creating" class="!p-4">
          <form aria-label="Nuevo movimiento" class="staggered flex flex-col gap-2.5" @submit.prevent="saveTx" @keydown.escape="cancelCreate">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label for="new-tx-title" class="sr-only">Concepto</label>
              <input id="new-tx-title" v-model="newTitle" type="text" placeholder="Concepto" class="h-10 rounded-[10px] bg-muted focus:bg-inset px-3 text-[14px] font-semibold text-fg outline-none" />
              <input v-model.number="newAmount" type="number" step="0.01" placeholder="Importe (€)" class="h-10 rounded-[10px] bg-muted focus:bg-inset px-3 text-[14px] text-fg outline-none tabular-nums" />
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <select v-model="newType" class="h-10 rounded-[10px] bg-muted focus:bg-inset px-3 text-[13px] text-fg outline-none">
                <option value="expense">Gasto</option><option value="income">Ingreso</option>
              </select>
              <select v-model="newCat" :disabled="newType === 'income'" class="h-10 rounded-[10px] bg-muted focus:bg-inset px-3 text-[13px] text-fg outline-none disabled:opacity-50">
                <option v-for="c in categories" :key="c.key" :value="c.key">{{ c.name }}</option>
              </select>
              <input v-model="newDate" type="text" placeholder="Hoy / 5 jun" class="h-10 rounded-[10px] bg-muted focus:bg-inset px-3 text-[13px] text-fg outline-none" />
            </div>
            <div class="flex items-center justify-end gap-2">
              <button type="button" class="h-9 px-3.5 rounded-[10px] text-[13px] font-semibold text-fg-muted hover:bg-muted" @click="cancelCreate">Cancelar</button>
              <button type="submit" :disabled="!newTitle.trim() || !newAmount" class="h-9 px-4 rounded-[10px] bg-sky text-[#1f4661] text-[13px] font-bold disabled:opacity-50">Guardar</button>
            </div>
          </form>
        </AppCard>
      </Transition>
      <div class="grid gap-3 grid-cols-1 lg:grid-cols-3">
        <!-- Resumen -->
        <AppCard class="!p-4 flex flex-col">
          <p class="text-[12.5px] font-bold text-fg-muted">Saldo del mes</p>
          <p class="text-[28px] font-extrabold text-fg mt-1 leading-none tabular-nums">{{ fmt(net) }}</p>
          <div class="mt-3 flex flex-col gap-1.5">
            <div class="flex items-center gap-2 text-[13px]">
              <span class="grid place-items-center size-6 rounded-[8px] bg-mint text-[#34936a]"><TrendingUp class="size-3.5" :stroke-width="2.4" aria-hidden="true" /></span>
              <span class="text-fg-muted">Ingresos</span>
              <span class="ml-auto font-bold text-fg tabular-nums">{{ fmt(income) }}</span>
            </div>
            <div class="flex items-center gap-2 text-[13px]">
              <span class="grid place-items-center size-6 rounded-[8px] bg-pink-soft text-pink-deep"><TrendingDown class="size-3.5" :stroke-width="2.4" aria-hidden="true" /></span>
              <span class="text-fg-muted">Gastos</span>
              <span class="ml-auto font-bold text-fg tabular-nums">{{ fmt(totalExpense) }}</span>
            </div>
          </div>
        </AppCard>

        <!-- Donut -->
        <AppCard class="!p-4 lg:col-span-2">
          <h3 class="text-[14px] font-bold text-fg mb-3">Gastos por categoría</h3>
          <div class="flex items-center gap-5">
            <div class="relative shrink-0">
              <svg width="160" height="160" viewBox="0 0 160 160" aria-label="Distribución de gastos">
                <path v-for="(a, i) in arcs" :key="i" :d="a.d" :fill="a.color" />
                <circle cx="80" cy="80" r="36" fill="var(--bg-card)" />
              </svg>
              <div class="absolute inset-0 grid place-items-center text-center">
                <div>
                  <p class="text-[10px] text-fg-muted font-bold">Total</p>
                  <p class="text-[14px] font-extrabold text-fg leading-none mt-0.5 tabular-nums">{{ totalExpense }} €</p>
                </div>
              </div>
            </div>
            <ul class="flex-1 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[12.5px]">
              <li v-for="c in categories" :key="c.key" class="flex items-center gap-2">
                <span class="size-3 rounded-full" :style="{ background: c.color }" aria-hidden="true" />
                <span class="text-fg-muted truncate">{{ c.name }}</span>
                <span class="ml-auto font-bold text-fg tabular-nums">{{ c.amount }} €</span>
              </li>
            </ul>
          </div>
        </AppCard>

        <!-- Budget bars -->
        <AppCard class="!p-4 lg:col-span-2">
          <h3 class="text-[14px] font-bold text-fg mb-3">Presupuesto del mes</h3>
          <div class="flex flex-col gap-2.5">
            <div v-for="c in categories" :key="c.key">
              <div class="flex items-center gap-2 mb-1">
                <span class="grid place-items-center size-7 rounded-[9px]" :class="c.tone" aria-hidden="true"><component :is="c.icon" class="size-[14px]" :stroke-width="2" /></span>
                <span class="text-[13px] font-semibold text-fg flex-1">{{ c.name }}</span>
                <span class="text-[12.5px] font-bold tabular-nums" :class="c.amount > c.budget ? 'text-pink-deep' : 'text-fg-muted'">{{ c.amount }} / {{ c.budget }} €</span>
              </div>
              <div class="h-2 rounded-full bg-muted overflow-hidden">
                <div class="h-full rounded-full" :style="{ width: Math.min(100, (c.amount / c.budget) * 100) + '%', background: c.color }" />
              </div>
            </div>
          </div>
        </AppCard>

        <!-- Suscripciones -->
        <AppCard class="!p-4">
          <h3 class="text-[14px] font-bold text-fg mb-2 inline-flex items-center gap-1.5"><Repeat class="size-[15px]" :stroke-width="1.9" aria-hidden="true" />Suscripciones</h3>
          <ul class="flex flex-col gap-1.5">
            <li v-for="s in subscriptions" :key="s.id" class="flex items-center justify-between p-2.5 rounded-[10px] bg-muted">
              <p class="text-[13.5px] font-semibold text-fg">{{ s.title }}</p>
              <span class="text-[13px] font-bold text-fg tabular-nums">{{ fmt(Math.abs(s.amount)) }}</span>
            </li>
          </ul>
        </AppCard>

        <!-- Transacciones -->
        <AppCard class="!p-4 lg:col-span-3">
          <h3 class="text-[14px] font-bold text-fg mb-2">Últimos movimientos</h3>
          <ul class="flex flex-col">
            <li v-for="t in txsData" :key="t.id" class="flex items-center gap-3 py-2.5">
              <span class="grid place-items-center size-9 rounded-[11px]" :class="t.cat ? (categories.find(c => c.key === t.cat)?.tone || 'bg-muted') : 'bg-sky text-[#1f4661]'" aria-hidden="true">
                <component :is="t.cat ? categories.find(c => c.key === t.cat)?.icon : TrendingUp" class="size-[16px]" :stroke-width="2" />
              </span>
              <div class="flex-1 min-w-0">
                <p class="text-[14px] font-semibold text-fg truncate">{{ t.title }}<span v-if="t.sub" class="inline-flex items-center gap-1 ml-2 text-[10.5px] font-bold text-sky-deep bg-sky-soft px-1.5 py-0.5 rounded-full"><Repeat class="size-3" :stroke-width="2.4" aria-hidden="true" /> susc.</span></p>
                <p class="text-[12px] text-fg-muted">{{ t.date }}</p>
              </div>
              <span class="text-[14.5px] font-bold tabular-nums" :class="t.amount > 0 ? 'text-[#34936a]' : 'text-fg'">{{ t.amount > 0 ? '+' : '' }}{{ fmt(t.amount) }}</span>
            </li>
          </ul>
        </AppCard>
      </div>
    </div>
  </div>
</template>
