<script setup lang="ts">
import { Plus, Wallet, Repeat, ShoppingBag, Home as HomeI, Utensils, Bus, Film, HeartPulse, TrendingDown, TrendingUp, Settings2,
  Car, Coffee, Pizza, Gift, Plane, Book, Shirt, Sparkles, Heart, Music, Gamepad2, Dog, Baby, Banknote, Trash2, Check, X, ArrowLeft } from '@lucide/vue'
import { markRaw, type Component } from 'vue'

useHead({ title: 'Hibi — Finanzas' })

interface Category { name: string; icon: Component; color: string }
// Galería de iconos disponibles para personalizar categorías
const ICON_GALLERY: { key: string; icon: Component }[] = [
  { key: 'Utensils', icon: markRaw(Utensils) }, { key: 'Pizza', icon: markRaw(Pizza) },
  { key: 'Coffee', icon: markRaw(Coffee) }, { key: 'ShoppingBag', icon: markRaw(ShoppingBag) },
  { key: 'HomeI', icon: markRaw(HomeI) }, { key: 'Bus', icon: markRaw(Bus) },
  { key: 'Car', icon: markRaw(Car) }, { key: 'Plane', icon: markRaw(Plane) },
  { key: 'Film', icon: markRaw(Film) }, { key: 'Music', icon: markRaw(Music) },
  { key: 'Gamepad2', icon: markRaw(Gamepad2) }, { key: 'Book', icon: markRaw(Book) },
  { key: 'HeartPulse', icon: markRaw(HeartPulse) }, { key: 'Heart', icon: markRaw(Heart) },
  { key: 'Sparkles', icon: markRaw(Sparkles) }, { key: 'Shirt', icon: markRaw(Shirt) },
  { key: 'Gift', icon: markRaw(Gift) }, { key: 'Dog', icon: markRaw(Dog) },
  { key: 'Baby', icon: markRaw(Baby) }, { key: 'Banknote', icon: markRaw(Banknote) },
]
const CAT_META = reactive<Record<string, Category>>({
  food: { name: 'Comida', icon: markRaw(Utensils), color: '#5aa6d2' },
  home: { name: 'Hogar', icon: markRaw(HomeI), color: '#34936a' },
  transport: { name: 'Transporte', icon: markRaw(Bus), color: '#c5733f' },
  ocio: { name: 'Ocio', icon: markRaw(Film), color: '#db8aa3' },
  health: { name: 'Salud', icon: markRaw(HeartPulse), color: '#7a63c0' },
  others: { name: 'Otros', icon: markRaw(ShoppingBag), color: '#bf8f2e' },
})
const CAT_OPTS = computed(() => Object.entries(CAT_META).map(([k, v]) => ({ value: k, label: v.name })))
function catChipStyle(catKey: string) {
  const c = CAT_META[catKey]; if (!c) return {}
  return { background: c.color + '22', color: c.color }
}

interface Tx { id: string; title: string; cat: string; date: string; amount: number }
interface Sub { id: string; title: string; amount: number; nextCharge: string; cat: string }

const expenses = ref<Tx[]>([
  { id: 't1', title: 'Éxito', cat: 'food', date: 'Hoy', amount: -180000 },
  { id: 't2', title: 'Café con María', cat: 'ocio', date: 'Hoy', amount: -22000 },
  { id: 't3', title: 'Arriendo junio', cat: 'home', date: 'Ayer', amount: -2_400_000 },
  { id: 't6', title: 'TransMilenio', cat: 'transport', date: '1 jun', amount: -180000 },
])
const subscriptions = ref<Sub[]>([
  { id: 's1', title: 'Spotify', amount: 17900, nextCharge: '15 jun', cat: 'ocio' },
  { id: 's2', title: 'Netflix', amount: 38900, nextCharge: '20 jun', cat: 'ocio' },
  { id: 's3', title: 'Gimnasio', amount: 120000, nextCharge: '1 jul', cat: 'health' },
])

const totalMonth = computed(() => expenses.value.reduce((a, t) => a + Math.abs(t.amount), 0))
const totalSubs = computed(() => subscriptions.value.reduce((a, s) => a + s.amount, 0))
// Formato COP manual: garantiza el punto de miles ($ 180.000) en cualquier
// entorno (algunos webviews no agrupan con toLocaleString('es-CO')).
const fmt = (v: number) => {
  const neg = v < 0
  const digits = Math.abs(Math.round(v)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return (neg ? '-' : '') + '$ ' + digits
}

type Tab = 'expenses' | 'subs'
type View = 'list' | 'categories'
const tab = ref<Tab>('expenses')
const view = ref<View>('list')
const showForm = ref(false) // formulario colapsable de alta

// Desglose por categoría para la tarjeta de resumen
const byCat = computed(() => {
  const map: Record<string, number> = {}
  for (const t of expenses.value) map[t.cat] = (map[t.cat] || 0) + Math.abs(t.amount)
  return Object.entries(map)
    .map(([key, amount]) => ({ key, amount, meta: CAT_META[key], pct: Math.round((amount / (totalMonth.value || 1)) * 100) }))
    .filter(c => c.meta)
    .sort((a, b) => b.amount - a.amount)
})

// CRUD categorías
const editingCatKey = ref<string | null>(null)
const catDraft = ref<{ name: string; color: string; iconKey: string }>({ name: '', color: '#5aa6d2', iconKey: 'ShoppingBag' })
function startEditCat(key: string) {
  editingCatKey.value = key
  const c = CAT_META[key]!
  const iconKey = ICON_GALLERY.find(g => g.icon === c.icon)?.key || 'ShoppingBag'
  catDraft.value = { name: c.name, color: c.color, iconKey }
}
function startNewCat() {
  editingCatKey.value = '__new__'
  catDraft.value = { name: '', color: '#5aa6d2', iconKey: 'ShoppingBag' }
}
function saveCat() {
  const n = catDraft.value.name.trim(); if (!n) return
  const iconObj = ICON_GALLERY.find(g => g.key === catDraft.value.iconKey)?.icon || markRaw(ShoppingBag)
  if (editingCatKey.value === '__new__') {
    const key = 'cat_' + Date.now()
    CAT_META[key] = { name: n, icon: iconObj, color: catDraft.value.color }
  } else if (editingCatKey.value) {
    CAT_META[editingCatKey.value] = { name: n, icon: iconObj, color: catDraft.value.color }
  }
  editingCatKey.value = null
}
function deleteCat(key: string) {
  if (Object.keys(CAT_META).length <= 1) return
  delete CAT_META[key]
  if (editingCatKey.value === key) editingCatKey.value = null
}

const newTitle = ref(''); const newAmount = ref<number | null>(null); const newCat = ref('food'); const newDate = ref('')
const newSubTitle = ref(''); const newSubAmount = ref<number | null>(null); const newSubDate = ref(''); const newSubCat = ref('ocio')
const editId = ref<string | null>(null) // si != null, el form edita ese ítem
let nextId = 100

function resetForm() {
  editId.value = null
  newTitle.value = ''; newAmount.value = null; newCat.value = 'food'; newDate.value = ''
  newSubTitle.value = ''; newSubAmount.value = null; newSubCat.value = 'ocio'; newSubDate.value = ''
}
function switchTab(v: Tab) { tab.value = v; view.value = 'list'; showForm.value = false; resetForm() }
function toggleForm() { if (showForm.value) { showForm.value = false; resetForm() } else { resetForm(); showForm.value = true } }
// El botón "+ Gasto/Suscripción" se mantiene SIEMPRE visible (incluso en
// Categorías) para que la barra no se mueva; desde Categorías vuelve a la lista.
function newEntry() {
  if (view.value === 'categories') { view.value = 'list'; resetForm(); showForm.value = true; return }
  toggleForm()
}

// Editor único (gasto o suscripción) según la pestaña activa → un solo overlay
const entryTitle = computed<string>({
  get: () => tab.value === 'subs' ? newSubTitle.value : newTitle.value,
  set: (v) => { if (tab.value === 'subs') newSubTitle.value = v; else newTitle.value = v },
})
const entryAmount = computed<number | null>({
  get: () => tab.value === 'subs' ? newSubAmount.value : newAmount.value,
  set: (v) => { if (tab.value === 'subs') newSubAmount.value = v; else newAmount.value = v },
})
const entryDate = computed<string>({
  get: () => tab.value === 'subs' ? newSubDate.value : newDate.value,
  set: (v) => { if (tab.value === 'subs') newSubDate.value = v; else newDate.value = v },
})
const entryCat = computed<string>({
  get: () => tab.value === 'subs' ? newSubCat.value : newCat.value,
  set: (v) => { if (tab.value === 'subs') newSubCat.value = v; else newCat.value = v },
})
// Monto mostrado con punto de miles EN VIVO (el input type="number" no lo permite)
const entryAmountDisplay = computed<string>({
  get: () => {
    const v = entryAmount.value
    if (v === null || v === undefined || Number.isNaN(v)) return ''
    return Math.abs(Math.round(v)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  },
  set: (s) => {
    const digits = (s || '').replace(/\D/g, '')
    entryAmount.value = digits ? Number(digits) : null
  },
})
const entryValid = computed(() => !!entryTitle.value.trim() && !!entryAmount.value)
function saveEntry() { if (tab.value === 'subs') addSub(); else addExpense() }
function closeForm() { showForm.value = false; resetForm() }

function addExpense() {
  const t = newTitle.value.trim(); const a = newAmount.value
  if (!t || !a) return
  if (editId.value) {
    const it = expenses.value.find(x => x.id === editId.value)
    if (it) { it.title = t; it.cat = newCat.value; it.date = newDate.value || it.date; it.amount = -Math.abs(Number(a)) }
  } else {
    expenses.value.unshift({ id: 't' + (nextId++), title: t, cat: newCat.value, date: newDate.value || 'Hoy', amount: -Math.abs(Number(a)) })
  }
  showForm.value = false; resetForm()
}
function startEditExpense(t: Tx) {
  editId.value = t.id; newTitle.value = t.title; newAmount.value = Math.abs(t.amount); newCat.value = t.cat; newDate.value = ''
  showForm.value = true
}
function removeExpense(id: string) {
  expenses.value = expenses.value.filter(x => x.id !== id)
  if (editId.value === id) { showForm.value = false; resetForm() }
}

function addSub() {
  const t = newSubTitle.value.trim(); const a = newSubAmount.value
  if (!t || !a) return
  if (editId.value) {
    const it = subscriptions.value.find(x => x.id === editId.value)
    if (it) { it.title = t; it.amount = Math.abs(Number(a)); it.cat = newSubCat.value; it.nextCharge = newSubDate.value || it.nextCharge }
  } else {
    subscriptions.value.unshift({ id: 's' + (nextId++), title: t, amount: Math.abs(Number(a)), nextCharge: newSubDate.value || 'Próximo mes', cat: newSubCat.value })
  }
  showForm.value = false; resetForm()
}
function startEditSub(s: Sub) {
  editId.value = s.id; newSubTitle.value = s.title; newSubAmount.value = s.amount; newSubCat.value = s.cat; newSubDate.value = ''
  showForm.value = true
}
function removeSub(id: string) {
  subscriptions.value = subscriptions.value.filter(x => x.id !== id)
  if (editId.value === id) { showForm.value = false; resetForm() }
}
</script>

<template>
  <div class="h-full w-full flex flex-col gap-2 md:gap-3 px-3 md:px-7 py-3 md:py-5 overflow-hidden relative">
    <!-- Decoración cute -->
    <HibiCloud :size="150" float :duration="8" class="hidden md:block absolute -top-6 -right-8 text-mint opacity-15 pointer-events-none z-40" aria-hidden="true" />
    <HibiCloud :size="90"  float :duration="10" :delay="1.2" class="hidden md:block absolute bottom-6 -left-6 text-cream opacity-15 pointer-events-none z-40" aria-hidden="true" />
    <HibiSparkle :size="18" twinkle :duration="2.4" class="hidden md:block absolute top-[14%] left-[10%] text-fg-subtle opacity-25 pointer-events-none z-40" />
    <HibiSparkle :size="14" twinkle :duration="3" :delay="0.8" class="hidden md:block absolute top-[8%] right-[26%] text-fg-subtle opacity-25 pointer-events-none z-40" />
    <HibiHeart :size="16" beat :duration="2.6" class="hidden md:block absolute bottom-[20%] right-[8%] text-fg-subtle opacity-25 pointer-events-none z-40" />

    <!-- Toolbar -->
    <div class="relative z-10">
      <PageHero :icon="Wallet" tone="mint" title="Finanzas" :subtitle="`Junio · ${fmt(totalMonth)} gastado`">
        <template #actions>
          <AppSegmented :model-value="tab" :options="[{ value: 'expenses', label: 'Gastos' }, { value: 'subs', label: 'Suscripciones' }]" @update:model-value="(v) => switchTab(v as Tab)" />
          <AppButton variant="primary" size="sm" class="ml-auto shrink-0" @click="newEntry">
            <template #icon><Plus class="size-[16px]" :stroke-width="2.3" /></template>
            {{ tab === 'subs' ? 'Suscripción' : 'Gasto' }}
          </AppButton>
        </template>
      </PageHero>
    </div>

    <!-- VISTA CATEGORÍAS: CRUD real -->
    <AppCard v-if="view === 'categories'" class="relative z-10 flex-1 min-h-0 flex flex-col" :padded="false">
      <header class="px-5 pt-4 pb-3 shrink-0 flex items-center gap-3">
        <button type="button"
          class="inline-flex items-center gap-2 h-10 pl-2.5 pr-4 rounded-full bg-muted text-fg hover:bg-inset transition-[background-color] shrink-0"
          @click="view = 'list'">
          <ArrowLeft class="size-[17px]" :stroke-width="2" />
          <span class="text-[13.5px] font-bold">Atrás</span>
        </button>
        <div class="flex-1 min-w-0">
          <h2 class="text-[16px] font-extrabold text-fg truncate">Categorías</h2>
          <p class="hidden sm:block text-[12.5px] text-fg-muted truncate">Crea, edita y elimina; cada una con su icono y color.</p>
        </div>
        <AppButton variant="primary" size="sm" class="shrink-0" @click="startNewCat">
          <template #icon><Plus class="size-[15px]" :stroke-width="2.3" /></template>Nueva
        </AppButton>
      </header>

      <div class="flex-1 min-h-0 overflow-y-auto scroll-area px-3 md:px-5 pb-5">
        <!-- Lista de categorías: filas amplias (sin nada inline) -->
        <ul class="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
          <li v-for="(meta, key) in CAT_META" :key="key" class="p-3 rounded-[16px] bg-muted flex items-center gap-3">
            <div role="button" tabindex="0" class="flex items-center gap-3 flex-1 min-w-0 cursor-pointer outline-none rounded-[12px] focus-visible:ring-2 focus-visible:ring-sky-deep" @click="startEditCat(key)" @keydown.enter.prevent="startEditCat(key)" @keydown.space.prevent="startEditCat(key)">
              <span class="grid place-items-center size-12 rounded-[14px] shrink-0" :style="{ background: meta.color + '22', color: meta.color }">
                <component :is="meta.icon" class="size-[22px]" :stroke-width="1.9" />
              </span>
              <div class="flex-1 min-w-0">
                <p class="text-[15px] font-bold text-fg truncate">{{ meta.name }}</p>
                <p class="text-[12px] text-fg-muted">{{ expenses.filter(t => t.cat === key).length }} movimientos</p>
              </div>
            </div>
            <button type="button" class="grid place-items-center size-10 rounded-[11px] bg-card text-fg-subtle active:text-pink-deep shrink-0" aria-label="Eliminar categoría" @click.stop="deleteCat(key)"><Trash2 class="size-[16px]" :stroke-width="2" /></button>
          </li>
        </ul>
      </div>
    </AppCard>

    <!-- GASTOS -->
    <div v-else-if="tab === 'expenses'" class="relative z-10 flex-1 min-h-0 flex flex-col gap-2 md:gap-3 overflow-hidden">
      <!-- Resumen compacto: total + barra (sin saturar) -->
      <AppCard class="shrink-0 !p-4 md:!p-5 flex flex-col gap-2.5">
        <div class="flex items-end justify-between gap-3">
          <div class="min-w-0">
            <p class="text-[11.5px] font-bold text-fg-muted uppercase tracking-wide">Gastado en junio</p>
            <p class="text-[26px] md:text-[28px] font-extrabold text-fg leading-none tabular-nums mt-0.5">{{ fmt(totalMonth) }}</p>
          </div>
          <button type="button" class="shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-muted text-fg-muted text-[12.5px] font-bold" @click="view = 'categories'">
            <Settings2 class="size-[14px]" :stroke-width="2.2" /> Categorías
          </button>
        </div>
        <div class="h-3 rounded-full overflow-hidden flex bg-muted">
          <div v-for="c in byCat" :key="c.key" class="h-full first:rounded-l-full last:rounded-r-full" :style="{ width: c.pct + '%', background: c.meta!.color }" :title="`${c.meta!.name} ${c.pct}%`" />
        </div>
      </AppCard>

      <!-- Lista de movimientos: llena el alto disponible -->
      <AppCard class="flex-1 min-h-0 min-w-0 flex flex-col" :padded="false">
        <header class="px-4 md:px-5 pt-4 md:pt-5 pb-2 md:pb-3 shrink-0 flex items-center justify-between">
          <h2 class="text-[14px] font-bold text-fg">Movimientos</h2>
          <span class="text-[12.5px] font-bold text-fg-muted tabular-nums">{{ expenses.length }} este mes</span>
        </header>
        <ul class="flex-1 min-h-0 overflow-y-auto scroll-area px-2 md:px-3 pb-3 flex flex-col">
          <li v-for="t in expenses" :key="t.id" class="group/tx flex items-center gap-2 p-2 rounded-[12px] hover:bg-muted transition-[background-color]">
            <div role="button" tabindex="0" class="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer text-left outline-none rounded-[10px] focus-visible:ring-2 focus-visible:ring-sky-deep" @click="startEditExpense(t)" @keydown.enter.prevent="startEditExpense(t)" @keydown.space.prevent="startEditExpense(t)">
              <span class="relative inline-block shrink-0" :style="{ width: '54px', height: '37px' }" aria-hidden="true">
                <HibiCloud :size="54" :body-opacity="0.25" :style="{ color: CAT_META[t.cat]?.color || '#bf8f2e' }" class="absolute inset-0" />
                <component :is="CAT_META[t.cat]?.icon || ShoppingBag" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                  :style="{ width: '17px', height: '17px', color: CAT_META[t.cat]?.color || '#bf8f2e' }" :stroke-width="2" />
              </span>
              <div class="flex-1 min-w-0">
                <p class="text-[14px] font-semibold text-fg truncate">{{ t.title }}</p>
                <p class="text-[12px] text-fg-muted truncate">{{ t.date }} · {{ CAT_META[t.cat]?.name }}</p>
              </div>
              <span class="text-[15px] font-bold text-fg tabular-nums shrink-0">{{ fmt(t.amount) }}</span>
            </div>
            <button type="button" class="shrink-0 grid place-items-center size-8 rounded-[9px] text-fg-subtle md:opacity-0 md:group-hover/tx:opacity-100 hover:text-pink-deep hover:bg-pink-soft transition-[opacity,background-color,color]" aria-label="Eliminar gasto" @click.stop="removeExpense(t.id)"><Trash2 class="size-[15px]" :stroke-width="2" /></button>
          </li>
        </ul>
      </AppCard>
    </div>

    <!-- SUSCRIPCIONES -->
    <div v-else class="relative z-10 flex-1 min-h-0 flex flex-col gap-2 md:gap-3 overflow-hidden">
      <!-- Resumen suscripciones (compacto) -->
      <AppCard class="shrink-0 !p-4 md:!p-5 flex items-end justify-between gap-3">
        <div class="min-w-0">
          <p class="text-[11.5px] font-bold text-fg-muted uppercase tracking-wide">Gasto mensual recurrente</p>
          <p class="text-[26px] md:text-[28px] font-extrabold text-fg leading-none tabular-nums mt-0.5">{{ fmt(totalSubs) }}<span class="text-[15px] text-fg-muted font-bold">/mes</span></p>
        </div>
        <span class="shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-mint text-[#34936a] text-[12.5px] font-bold">
          <Repeat class="size-[14px]" :stroke-width="2.2" /> {{ subscriptions.length }} activas
        </span>
      </AppCard>

      <!-- Lista: llena el alto disponible -->
      <AppCard class="flex-1 min-h-0 min-w-0 flex flex-col" :padded="false">
        <header class="px-4 md:px-5 pt-4 md:pt-5 pb-2 md:pb-3 shrink-0">
          <h2 class="text-[14px] font-bold text-fg">Suscripciones activas</h2>
        </header>
        <ul class="flex-1 min-h-0 overflow-y-auto scroll-area px-2 md:px-3 pb-3 flex flex-col">
          <li v-for="s in subscriptions" :key="s.id" class="group/sub flex items-center gap-2 p-2 rounded-[12px] hover:bg-muted transition-[background-color]">
            <div role="button" tabindex="0" class="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer text-left outline-none rounded-[10px] focus-visible:ring-2 focus-visible:ring-sky-deep" @click="startEditSub(s)" @keydown.enter.prevent="startEditSub(s)" @keydown.space.prevent="startEditSub(s)">
              <span class="relative inline-block shrink-0" :style="{ width: '54px', height: '37px' }" aria-hidden="true">
                <HibiCloud :size="54" :body-opacity="0.25" :style="{ color: CAT_META[s.cat]?.color || '#bf8f2e' }" class="absolute inset-0" />
                <Repeat class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                  :style="{ width: '17px', height: '17px', color: CAT_META[s.cat]?.color || '#bf8f2e' }" :stroke-width="2" />
              </span>
              <div class="flex-1 min-w-0">
                <p class="text-[14px] font-semibold text-fg truncate">{{ s.title }}</p>
                <p class="text-[12px] text-fg-muted truncate">Próximo cobro {{ s.nextCharge }} · {{ CAT_META[s.cat]?.name }}</p>
              </div>
              <span class="text-[15px] font-bold text-fg tabular-nums shrink-0">{{ fmt(s.amount) }}</span>
            </div>
            <button type="button" class="shrink-0 grid place-items-center size-8 rounded-[9px] text-fg-subtle md:opacity-0 md:group-hover/sub:opacity-100 hover:text-pink-deep hover:bg-pink-soft transition-[opacity,background-color,color]" aria-label="Eliminar suscripción" @click.stop="removeSub(s.id)"><Trash2 class="size-[15px]" :stroke-width="2" /></button>
          </li>
        </ul>
      </AppCard>
    </div>

    <!-- EDITOR DE GASTO / SUSCRIPCIÓN: pantalla completa (móvil) / modal (PC). Nada inline. -->
    <ClientOnly>
      <Teleport to="body">
        <Transition name="hibi-fade">
          <div v-if="showForm" class="fixed inset-0 z-[60] bg-base md:bg-fg/30 md:grid md:place-items-center md:p-6">
            <div class="h-full md:h-auto md:max-h-[88vh] w-full md:max-w-[460px] bg-base md:rounded-[24px] flex flex-col overflow-hidden">
              <header class="shrink-0 flex items-center justify-between px-4 pb-3" style="padding-top: max(1rem, env(safe-area-inset-top))">
                <button type="button" class="grid place-items-center size-10 rounded-full bg-muted text-fg-muted" aria-label="Cerrar" @click="closeForm"><X class="size-[19px]" :stroke-width="2.2" /></button>
                <h2 class="text-[16px] font-extrabold text-fg">{{ tab === 'subs' ? (editId ? 'Editar suscripción' : 'Nueva suscripción') : (editId ? 'Editar gasto' : 'Nuevo gasto') }}</h2>
                <div class="size-10" aria-hidden="true" />
              </header>
              <form class="flex-1 min-h-0 overflow-y-auto scroll-area px-5 pb-4 flex flex-col gap-5" @submit.prevent="saveEntry">
                <!-- Concepto / Servicio -->
                <div>
                  <label class="block text-[12.5px] font-bold text-fg-muted mb-2 px-1">{{ tab === 'subs' ? 'Servicio' : 'Concepto' }}</label>
                  <input v-model="entryTitle" type="text" :placeholder="tab === 'subs' ? 'Nombre del servicio' : 'Concepto del gasto'" autofocus
                    class="w-full h-[52px] rounded-[14px] bg-muted px-4 text-[16px] font-semibold text-fg outline-none placeholder:text-fg-subtle"
                    @keydown.enter.prevent="entryValid && saveEntry()" />
                </div>
                <!-- Monto (formato COP con punto de miles en vivo) -->
                <div>
                  <label class="block text-[12.5px] font-bold text-fg-muted mb-2 px-1">{{ tab === 'subs' ? 'Monto mensual' : 'Monto' }}</label>
                  <div class="relative">
                    <span class="absolute left-4 top-1/2 -translate-y-1/2 text-[16px] font-semibold text-fg-muted pointer-events-none">$</span>
                    <input v-model="entryAmountDisplay" type="text" inputmode="numeric" placeholder="0"
                      class="w-full h-[52px] rounded-[14px] bg-muted pl-9 pr-4 text-[16px] font-semibold text-fg outline-none tabular-nums placeholder:text-fg-subtle" />
                  </div>
                </div>
                <!-- Fecha / Próximo cobro -->
                <div>
                  <label class="block text-[12.5px] font-bold text-fg-muted mb-2 px-1">{{ tab === 'subs' ? 'Próximo cobro' : 'Fecha' }}</label>
                  <AppDate v-model="entryDate" :placeholder="tab === 'subs' ? 'Próximo cobro' : 'Fecha'" tone="muted" class="w-full" />
                </div>
                <!-- Categoría -->
                <div>
                  <label class="block text-[12.5px] font-bold text-fg-muted mb-2 px-1">Categoría</label>
                  <AppSelect v-model="entryCat" :options="CAT_OPTS" placeholder="Categoría" tone="muted" class="w-full" />
                </div>
              </form>
              <div class="shrink-0 flex gap-2 px-5 pt-3" style="padding-bottom: max(1.25rem, env(safe-area-inset-bottom))">
                <button type="button" class="flex-1 h-12 rounded-[14px] bg-muted text-fg font-bold text-[15px]" @click="closeForm">Cancelar</button>
                <button type="button" :disabled="!entryValid" class="flex-1 h-12 rounded-[14px] bg-sky-deep text-white font-bold text-[15px] disabled:opacity-40 inline-flex items-center justify-center gap-2" @click="saveEntry">
                  <Check class="size-[17px]" :stroke-width="2.4" /> {{ editId ? 'Guardar' : (tab === 'subs' ? 'Crear' : 'Anotar') }}
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>
    </ClientOnly>

    <!-- EDITOR DE CATEGORÍA: pantalla completa (móvil) / modal (PC). Nada inline. -->
    <ClientOnly>
      <Teleport to="body">
        <Transition name="hibi-fade">
          <div v-if="editingCatKey" class="fixed inset-0 z-[60] bg-base md:bg-fg/30 md:grid md:place-items-center md:p-6">
            <div class="h-full md:h-auto md:max-h-[88vh] w-full md:max-w-[460px] bg-base md:rounded-[24px] flex flex-col overflow-hidden">
              <header class="shrink-0 flex items-center justify-between px-4 pb-3" style="padding-top: max(1rem, env(safe-area-inset-top))">
                <button type="button" class="grid place-items-center size-10 rounded-full bg-muted text-fg-muted" aria-label="Cerrar" @click="editingCatKey = null"><X class="size-[19px]" :stroke-width="2.2" /></button>
                <h2 class="text-[16px] font-extrabold text-fg">{{ editingCatKey === '__new__' ? 'Nueva categoría' : 'Editar categoría' }}</h2>
                <div class="size-10" aria-hidden="true" />
              </header>
              <div class="flex-1 min-h-0 overflow-y-auto scroll-area px-5 pb-4 flex flex-col gap-5">
                <!-- Vista previa grande -->
                <div class="flex justify-center pt-1">
                  <span class="grid place-items-center size-20 rounded-[24px]" :style="{ background: catDraft.color + '22', color: catDraft.color }">
                    <component :is="ICON_GALLERY.find(g => g.key === catDraft.iconKey)?.icon || ShoppingBag" class="size-9" :stroke-width="1.8" />
                  </span>
                </div>
                <!-- Nombre -->
                <div>
                  <label class="block text-[12.5px] font-bold text-fg-muted mb-2 px-1">Nombre</label>
                  <input v-model="catDraft.name" type="text" placeholder="Nombre de la categoría" autofocus
                    class="w-full h-[52px] rounded-[14px] bg-muted px-4 text-[16px] font-semibold text-fg outline-none placeholder:text-fg-subtle"
                    @keydown.enter.prevent="saveCat" />
                </div>
                <!-- Icono -->
                <div>
                  <label class="block text-[12.5px] font-bold text-fg-muted mb-2 px-1">Icono</label>
                  <div class="grid grid-cols-5 sm:grid-cols-6 gap-2">
                    <button v-for="g in ICON_GALLERY" :key="g.key" type="button"
                      class="grid place-items-center aspect-square rounded-[14px] bg-muted transition-[background-color]"
                      :class="catDraft.iconKey === g.key ? 'ring-2 ring-offset-2 ring-offset-base' : ''"
                      :style="catDraft.iconKey === g.key ? { '--tw-ring-color': catDraft.color, color: catDraft.color, background: catDraft.color + '22' } : {}"
                      @click="catDraft.iconKey = g.key">
                      <component :is="g.icon" class="size-[21px]" :class="catDraft.iconKey === g.key ? '' : 'text-fg'" :stroke-width="2" />
                    </button>
                  </div>
                </div>
                <!-- Color -->
                <div>
                  <label class="block text-[12.5px] font-bold text-fg-muted mb-2 px-1">Color</label>
                  <AppColorPicker v-model="catDraft.color" format="hex" />
                </div>
              </div>
              <div class="shrink-0 flex gap-2 px-5 pt-3" style="padding-bottom: max(1.25rem, env(safe-area-inset-bottom))">
                <button type="button" class="flex-1 h-12 rounded-[14px] bg-muted text-fg font-bold text-[15px]" @click="editingCatKey = null">Cancelar</button>
                <button type="button" :disabled="!catDraft.name.trim()" class="flex-1 h-12 rounded-[14px] bg-sky-deep text-white font-bold text-[15px] disabled:opacity-40 inline-flex items-center justify-center gap-2" @click="saveCat">
                  <Check class="size-[17px]" :stroke-width="2.4" /> Guardar
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>
    </ClientOnly>
  </div>
</template>
