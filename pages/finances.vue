<script setup lang="ts">
import { Plus, Wallet, Repeat, ShoppingBag, Home as HomeI, Utensils, Bus, Film, HeartPulse, TrendingDown, TrendingUp, Settings2,
  Car, Coffee, Pizza, Gift, Plane, Book, Shirt, Sparkles, Heart, Music, Gamepad2, Dog, Baby, Banknote, Trash2, Check, X, ArrowLeft } from '@lucide/vue'
import { markRaw, type Component } from 'vue'

useHead({ title: 'Hibi — Finanzas' })

const {
  categories, expenses, subscriptions,
  categoriesLoading, expensesLoading, subscriptionsLoading,
  createCategory, updateCategory, removeCategory,
  createExpense, updateExpense, removeExpense,
  createSubscription, updateSubscription, removeSubscription,
} = useFinances()

interface Category { name: string; icon: Component; color: string }
// Galería de iconos disponibles para personalizar categorías
const ICON_GALLERY: { key: string; icon: Component }[] = [
  { key: 'Utensils', icon: markRaw(Utensils) }, { key: 'Pizza', icon: markRaw(Pizza) },
  { key: 'Coffee', icon: markRaw(Coffee) }, { key: 'ShoppingBag', icon: markRaw(ShoppingBag) },
  { key: 'Home', icon: markRaw(HomeI) }, { key: 'Bus', icon: markRaw(Bus) },
  { key: 'Car', icon: markRaw(Car) }, { key: 'Plane', icon: markRaw(Plane) },
  { key: 'Film', icon: markRaw(Film) }, { key: 'Music', icon: markRaw(Music) },
  { key: 'Gamepad2', icon: markRaw(Gamepad2) }, { key: 'Book', icon: markRaw(Book) },
  { key: 'HeartPulse', icon: markRaw(HeartPulse) }, { key: 'Heart', icon: markRaw(Heart) },
  { key: 'Sparkles', icon: markRaw(Sparkles) }, { key: 'Shirt', icon: markRaw(Shirt) },
  { key: 'Gift', icon: markRaw(Gift) }, { key: 'Dog', icon: markRaw(Dog) },
  { key: 'Baby', icon: markRaw(Baby) }, { key: 'Banknote', icon: markRaw(Banknote) },
]
// Resuelve un nombre lucide (guardado como string) a su componente. Cubre la
// galería + alias del seed inicial (p. ej. 'HomeI' → Home).
const ICON_MAP: Record<string, Component> = Object.fromEntries(ICON_GALLERY.map(g => [g.key, g.icon]))
ICON_MAP.HomeI = markRaw(HomeI)
function iconOf(name?: string | null): Component { return (name && ICON_MAP[name]) || markRaw(ShoppingBag) }

// Metadata de categorías DERIVADA de las filas reales, indexada por id, para que
// el resto de la plantilla siga resolviendo icono/color/nombre por categoryId.
const CAT_META = computed<Record<string, Category>>(() => {
  const map: Record<string, Category> = {}
  for (const c of categories.value) map[c.id] = { name: c.name, icon: iconOf(c.icon), color: c.color }
  return map
})
const CAT_OPTS = computed(() => categories.value.map(c => ({ value: c.id, label: c.name })))
// Categoría por defecto para altas (primera disponible).
const defaultCatId = computed(() => categories.value[0]?.id ?? '')

// Formato COP manual: garantiza el punto de miles ($ 180.000) en cualquier
// entorno (algunos webviews no agrupan con toLocaleString('es-CO')).
const fmt = (v: number) => {
  const neg = v < 0
  const digits = Math.abs(Math.round(v)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return (neg ? '-' : '') + '$ ' + digits
}
// Fecha yyyy-MM-dd → etiqueta corta (Hoy / Ayer / "3 jun") para la lista.
const todayIso = () => new Date().toISOString().slice(0, 10)
const shiftIso = (n: number) => { const x = new Date(); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10) }
function fmtDate(iso?: string | null) {
  if (!iso) return ''
  if (iso === todayIso()) return 'Hoy'
  if (iso === shiftIso(-1)) return 'Ayer'
  try {
    return new Date(iso + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  } catch { return iso }
}

const totalMonth = computed(() => expenses.value.reduce((a, t) => a + Math.abs(t.amount), 0))
const totalSubs = computed(() => subscriptions.value.reduce((a, s) => a + s.amount, 0))

type Tab = 'expenses' | 'subs'
type View = 'list' | 'categories'
const tab = ref<Tab>('expenses')
const view = ref<View>('list')
const showForm = ref(false) // formulario colapsable de alta

// Desglose por categoría para la tarjeta de resumen
const byCat = computed(() => {
  const map: Record<string, number> = {}
  for (const t of expenses.value) { const k = t.categoryId || ''; map[k] = (map[k] || 0) + Math.abs(t.amount) }
  return Object.entries(map)
    .map(([key, amount]) => ({ key, amount, meta: CAT_META.value[key], pct: Math.round((amount / (totalMonth.value || 1)) * 100) }))
    .filter(c => c.meta)
    .sort((a, b) => b.amount - a.amount)
})

// CRUD categorías
const editingCatKey = ref<string | null>(null)
const catDraft = ref<{ name: string; color: string; iconKey: string }>({ name: '', color: '#5aa6d2', iconKey: 'ShoppingBag' })
function startEditCat(key: string) {
  editingCatKey.value = key
  const c = categories.value.find(x => x.id === key)
  if (!c) return
  const iconKey = ICON_MAP[c.icon] ? (c.icon === 'HomeI' ? 'Home' : c.icon) : 'ShoppingBag'
  catDraft.value = { name: c.name, color: c.color, iconKey }
}
function startNewCat() {
  editingCatKey.value = '__new__'
  catDraft.value = { name: '', color: '#5aa6d2', iconKey: 'ShoppingBag' }
}
function saveCat() {
  const n = catDraft.value.name.trim(); if (!n) return
  const key = editingCatKey.value
  if (key === '__new__') {
    createCategory({ name: n, icon: catDraft.value.iconKey, color: catDraft.value.color })
  } else if (key) {
    updateCategory(key, { name: n, icon: catDraft.value.iconKey, color: catDraft.value.color })
  }
  editingCatKey.value = null
}
function deleteCat(key: string) {
  if (categories.value.length <= 1) return
  removeCategory(key)
  if (editingCatKey.value === key) editingCatKey.value = null
}

const newTitle = ref(''); const newAmount = ref<number | null>(null); const newCat = ref(''); const newDate = ref('')
const newSubTitle = ref(''); const newSubAmount = ref<number | null>(null); const newSubDate = ref(''); const newSubCat = ref('')
const editId = ref<string | null>(null) // si != null, el form edita ese ítem

function resetForm() {
  editId.value = null
  newTitle.value = ''; newAmount.value = null; newCat.value = defaultCatId.value; newDate.value = ''
  newSubTitle.value = ''; newSubAmount.value = null; newSubCat.value = defaultCatId.value; newSubDate.value = ''
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
  const amount = -Math.abs(Number(a))
  const categoryId = newCat.value || null
  if (editId.value) {
    const patch: Record<string, unknown> = { title: t, amount, categoryId }
    if (newDate.value) patch.spentDate = newDate.value
    updateExpense(editId.value, patch)
  } else {
    createExpense({ title: t, amount, categoryId, spentDate: newDate.value || todayIso() })
  }
  showForm.value = false; resetForm()
}
function startEditExpense(t: Expense) {
  editId.value = t.id; newTitle.value = t.title; newAmount.value = Math.abs(t.amount); newCat.value = t.categoryId || ''; newDate.value = t.spentDate || ''
  showForm.value = true
}

function addSub() {
  const t = newSubTitle.value.trim(); const a = newSubAmount.value
  if (!t || !a) return
  const amount = Math.abs(Number(a))
  const categoryId = newSubCat.value || null
  if (editId.value) {
    const patch: Record<string, unknown> = { title: t, amount, categoryId }
    if (newSubDate.value) patch.nextCharge = newSubDate.value
    updateSubscription(editId.value, patch)
  } else {
    createSubscription({ title: t, amount, categoryId, nextCharge: newSubDate.value || null })
  }
  showForm.value = false; resetForm()
}
function startEditSub(s: Subscription) {
  editId.value = s.id; newSubTitle.value = s.title; newSubAmount.value = s.amount; newSubCat.value = s.categoryId || ''; newSubDate.value = s.nextCharge || ''
  showForm.value = true
}

// Estados de carga (primer fetch, sin datos aún)
const expensesLoadingEmpty = computed(() => expensesLoading.value && !expenses.value.length)
const subsLoadingEmpty = computed(() => subscriptionsLoading.value && !subscriptions.value.length)
const catsLoadingEmpty = computed(() => categoriesLoading.value && !categories.value.length)
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
        <!-- Carga inicial -->
        <ul v-if="catsLoadingEmpty" class="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
          <li v-for="n in 4" :key="n" class="p-3 rounded-[16px] bg-muted flex items-center gap-3">
            <span class="size-12 rounded-[14px] bg-inset/70 animate-pulse shrink-0" />
            <div class="flex-1 min-w-0 flex flex-col gap-2">
              <div class="h-[14px] w-1/2 rounded-full bg-inset/70 animate-pulse" />
              <div class="h-[11px] w-1/3 rounded-full bg-inset/50 animate-pulse" />
            </div>
          </li>
        </ul>
        <!-- Lista de categorías: filas amplias (sin nada inline) -->
        <ul v-else class="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
          <li v-for="(meta, key) in CAT_META" :key="key" class="p-3 rounded-[16px] bg-muted flex items-center gap-3">
            <div role="button" tabindex="0" class="flex items-center gap-3 flex-1 min-w-0 cursor-pointer outline-none rounded-[12px] focus-visible:ring-2 focus-visible:ring-sky-deep" @click="startEditCat(key)" @keydown.enter.prevent="startEditCat(key)" @keydown.space.prevent="startEditCat(key)">
              <span class="grid place-items-center size-12 rounded-[14px] shrink-0" :style="{ background: meta.color + '22', color: meta.color }">
                <component :is="meta.icon" class="size-[22px]" :stroke-width="1.9" />
              </span>
              <div class="flex-1 min-w-0">
                <p class="text-[15px] font-bold text-fg truncate">{{ meta.name }}</p>
                <p class="text-[12px] text-fg-muted">{{ expenses.filter(t => t.categoryId === key).length }} movimientos</p>
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
        <!-- Carga inicial -->
        <div v-if="expensesLoadingEmpty" class="flex-1 min-h-0 overflow-hidden px-2 md:px-3 pb-3 flex flex-col gap-1">
          <div v-for="n in 6" :key="n" class="flex items-center gap-2.5 p-2">
            <span class="w-[54px] h-[37px] rounded-[12px] bg-muted animate-pulse shrink-0" />
            <div class="flex-1 min-w-0 flex flex-col gap-2">
              <div class="h-[13px] w-2/5 rounded-full bg-muted animate-pulse" />
              <div class="h-[11px] w-1/4 rounded-full bg-muted/70 animate-pulse" />
            </div>
            <div class="h-[14px] w-16 rounded-full bg-muted animate-pulse shrink-0" />
          </div>
        </div>
        <!-- Vacío -->
        <div v-else-if="!expenses.length" class="flex-1 min-h-0 grid place-items-center px-6 pb-6 text-center">
          <div class="flex flex-col items-center gap-2">
            <span class="relative inline-block" :style="{ width: '72px', height: '49px' }" aria-hidden="true">
              <HibiCloud :size="72" :body-opacity="0.3" class="absolute inset-0 text-mint" />
              <Wallet class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#34936a]" :style="{ width: '22px', height: '22px' }" :stroke-width="2" />
            </span>
            <p class="text-[14px] font-bold text-fg">Sin movimientos todavía</p>
            <p class="text-[12.5px] text-fg-muted max-w-[220px]">Anota tu primer gasto con el botón de arriba.</p>
          </div>
        </div>
        <ul v-else class="flex-1 min-h-0 overflow-y-auto scroll-area px-2 md:px-3 pb-3 flex flex-col">
          <li v-for="t in expenses" :key="t.id" class="group/tx flex items-center gap-2 p-2 rounded-[12px] hover:bg-muted transition-[background-color]">
            <div role="button" tabindex="0" class="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer text-left outline-none rounded-[10px] focus-visible:ring-2 focus-visible:ring-sky-deep" @click="startEditExpense(t)" @keydown.enter.prevent="startEditExpense(t)" @keydown.space.prevent="startEditExpense(t)">
              <span class="relative inline-block shrink-0" :style="{ width: '54px', height: '37px' }" aria-hidden="true">
                <HibiCloud :size="54" :body-opacity="0.25" :style="{ color: CAT_META[t.categoryId || '']?.color || '#bf8f2e' }" class="absolute inset-0" />
                <component :is="CAT_META[t.categoryId || '']?.icon || ShoppingBag" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                  :style="{ width: '17px', height: '17px', color: CAT_META[t.categoryId || '']?.color || '#bf8f2e' }" :stroke-width="2" />
              </span>
              <div class="flex-1 min-w-0">
                <p class="text-[14px] font-semibold text-fg truncate">{{ t.title }}</p>
                <p class="text-[12px] text-fg-muted truncate">{{ fmtDate(t.spentDate) }}<template v-if="CAT_META[t.categoryId || '']"> · {{ CAT_META[t.categoryId || '']?.name }}</template></p>
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
        <!-- Carga inicial -->
        <div v-if="subsLoadingEmpty" class="flex-1 min-h-0 overflow-hidden px-2 md:px-3 pb-3 flex flex-col gap-1">
          <div v-for="n in 5" :key="n" class="flex items-center gap-2.5 p-2">
            <span class="w-[54px] h-[37px] rounded-[12px] bg-muted animate-pulse shrink-0" />
            <div class="flex-1 min-w-0 flex flex-col gap-2">
              <div class="h-[13px] w-2/5 rounded-full bg-muted animate-pulse" />
              <div class="h-[11px] w-1/3 rounded-full bg-muted/70 animate-pulse" />
            </div>
            <div class="h-[14px] w-16 rounded-full bg-muted animate-pulse shrink-0" />
          </div>
        </div>
        <!-- Vacío -->
        <div v-else-if="!subscriptions.length" class="flex-1 min-h-0 grid place-items-center px-6 pb-6 text-center">
          <div class="flex flex-col items-center gap-2">
            <span class="relative inline-block" :style="{ width: '72px', height: '49px' }" aria-hidden="true">
              <HibiCloud :size="72" :body-opacity="0.3" class="absolute inset-0 text-mint" />
              <Repeat class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#34936a]" :style="{ width: '22px', height: '22px' }" :stroke-width="2" />
            </span>
            <p class="text-[14px] font-bold text-fg">Sin suscripciones</p>
            <p class="text-[12.5px] text-fg-muted max-w-[220px]">Agrega tus servicios recurrentes con el botón de arriba.</p>
          </div>
        </div>
        <ul v-else class="flex-1 min-h-0 overflow-y-auto scroll-area px-2 md:px-3 pb-3 flex flex-col">
          <li v-for="s in subscriptions" :key="s.id" class="group/sub flex items-center gap-2 p-2 rounded-[12px] hover:bg-muted transition-[background-color]">
            <div role="button" tabindex="0" class="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer text-left outline-none rounded-[10px] focus-visible:ring-2 focus-visible:ring-sky-deep" @click="startEditSub(s)" @keydown.enter.prevent="startEditSub(s)" @keydown.space.prevent="startEditSub(s)">
              <span class="relative inline-block shrink-0" :style="{ width: '54px', height: '37px' }" aria-hidden="true">
                <HibiCloud :size="54" :body-opacity="0.25" :style="{ color: CAT_META[s.categoryId || '']?.color || '#bf8f2e' }" class="absolute inset-0" />
                <Repeat class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                  :style="{ width: '17px', height: '17px', color: CAT_META[s.categoryId || '']?.color || '#bf8f2e' }" :stroke-width="2" />
              </span>
              <div class="flex-1 min-w-0">
                <p class="text-[14px] font-semibold text-fg truncate">{{ s.title }}</p>
                <p class="text-[12px] text-fg-muted truncate"><template v-if="s.nextCharge">Próximo cobro {{ fmtDate(s.nextCharge) }}</template><template v-if="s.nextCharge && CAT_META[s.categoryId || '']"> · </template><template v-if="CAT_META[s.categoryId || '']">{{ CAT_META[s.categoryId || '']?.name }}</template></p>
              </div>
              <span class="text-[15px] font-bold text-fg tabular-nums shrink-0">{{ fmt(s.amount) }}</span>
            </div>
            <button type="button" class="shrink-0 grid place-items-center size-8 rounded-[9px] text-fg-subtle md:opacity-0 md:group-hover/sub:opacity-100 hover:text-pink-deep hover:bg-pink-soft transition-[opacity,background-color,color]" aria-label="Eliminar suscripción" @click.stop="removeSubscription(s.id)"><Trash2 class="size-[15px]" :stroke-width="2" /></button>
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
