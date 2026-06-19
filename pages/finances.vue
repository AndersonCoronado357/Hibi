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
const fmt = (v: number) => v.toLocaleString('es-CO', { style:'currency', currency:'COP', maximumFractionDigits: 0 })

type Tab = 'expenses' | 'subs'
type View = 'list' | 'categories'
const tab = ref<Tab>('expenses')
const view = ref<View>('list')

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
let nextId = 100

function addExpense() {
  const t = newTitle.value.trim(); const a = newAmount.value
  if (!t || !a) return
  expenses.value.unshift({ id: 't' + (nextId++), title: t, cat: newCat.value, date: newDate.value || 'Hoy', amount: -Math.abs(Number(a)) })
  newTitle.value = ''; newAmount.value = null
}
function addSub() {
  const t = newSubTitle.value.trim(); const a = newSubAmount.value
  if (!t || !a) return
  subscriptions.value.unshift({ id: 's' + (nextId++), title: t, amount: Math.abs(Number(a)), nextCharge: newSubDate.value || 'Próximo mes', cat: newSubCat.value })
  newSubTitle.value = ''; newSubAmount.value = null
}
</script>

<template>
  <div class="h-full w-full flex flex-col gap-3 px-4 md:px-7 py-5 overflow-hidden relative">
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
          <AppSegmented :model-value="tab" :options="[{ value: 'expenses', label: 'Gastos' }, { value: 'subs', label: 'Suscripciones' }]" @update:model-value="(v) => { tab = v as Tab; view = 'list' }" />
          <AppButton variant="secondary" size="sm" @click="view = view === 'categories' ? 'list' : 'categories'">
            <template #icon><Settings2 class="size-[15px]" :stroke-width="2.2" /></template>
            Categorías
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
          <h2 class="text-[16px] font-extrabold text-fg truncate">Parametrizar categorías</h2>
          <p class="text-[12.5px] text-fg-muted truncate">Crea, edita y elimina categorías. Cada una con su icono y color.</p>
        </div>
        <AppButton variant="primary" size="sm" @click="startNewCat">
          <template #icon><Plus class="size-[15px]" :stroke-width="2.3" /></template>Nueva
        </AppButton>
      </header>

      <div class="flex-1 min-h-0 overflow-y-auto scroll-area px-5 pb-5">
        <!-- Editor inline cuando se crea/edita -->
        <div v-if="editingCatKey" class="rounded-[16px] bg-muted p-4 mb-4 flex flex-col gap-3">
          <div class="flex items-center gap-3">
            <span class="grid place-items-center size-12 rounded-[14px] shrink-0" :style="{ background: catDraft.color + '22', color: catDraft.color }">
              <component :is="ICON_GALLERY.find(g => g.key === catDraft.iconKey)?.icon || ShoppingBag" class="size-[20px]" :stroke-width="1.9" />
            </span>
            <input v-model="catDraft.name" type="text" placeholder="Nombre de la categoría"
              class="flex-1 h-12 rounded-[12px] bg-card focus:bg-inset px-3 text-[14.5px] font-semibold text-fg outline-none" />
            <button class="grid place-items-center size-12 rounded-[12px] text-fg-muted hover:text-fg hover:bg-card" aria-label="Cancelar" @click="editingCatKey = null"><X class="size-[18px]" :stroke-width="2.2" /></button>
            <button class="grid place-items-center size-12 rounded-[12px] bg-sky text-[#1f4661] hover:bg-sky-deep hover:text-white" aria-label="Guardar" @click="saveCat"><Check class="size-[18px]" :stroke-width="2.4" /></button>
          </div>
          <div>
            <p class="text-[11.5px] font-bold text-fg-muted uppercase tracking-wide mb-2">Icono</p>
            <!-- Galería: iconos compactos, NO cuadrados gigantes -->
            <div class="flex items-center gap-1.5 flex-wrap">
              <button v-for="g in ICON_GALLERY" :key="g.key" type="button"
                class="grid place-items-center size-9 rounded-[10px] bg-card transition-[background-color]"
                :class="catDraft.iconKey === g.key ? 'ring-2 ring-fg' : 'hover:bg-inset'"
                @click="catDraft.iconKey = g.key">
                <component :is="g.icon" class="size-[15px] text-fg" :stroke-width="2" />
              </button>
            </div>
          </div>
          <div>
            <p class="text-[11.5px] font-bold text-fg-muted uppercase tracking-wide mb-2">Color</p>
            <AppColorPicker v-model="catDraft.color" format="hex" />
          </div>
        </div>

        <!-- Galería de categorías -->
        <ul class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <li v-for="(meta, key) in CAT_META" :key="key" class="p-3 rounded-[14px] bg-muted flex items-center gap-3 group">
            <span class="grid place-items-center size-12 rounded-[14px] shrink-0" :style="{ background: meta.color + '22', color: meta.color }">
              <component :is="meta.icon" class="size-[20px]" :stroke-width="1.9" />
            </span>
            <div class="flex-1 min-w-0">
              <p class="text-[14px] font-bold text-fg truncate">{{ meta.name }}</p>
              <p class="text-[11.5px] text-fg-muted">Click para editar</p>
            </div>
            <button class="grid place-items-center size-8 rounded-[9px] text-fg-subtle hover:text-fg hover:bg-card opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Editar" @click="startEditCat(key)"><Settings2 class="size-[14px]" :stroke-width="2" /></button>
            <button class="grid place-items-center size-8 rounded-[9px] text-fg-subtle hover:text-pink-deep hover:bg-pink-soft opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Eliminar" @click="deleteCat(key)"><Trash2 class="size-[14px]" :stroke-width="2" /></button>
          </li>
        </ul>
      </div>
    </AppCard>

    <!-- GASTOS -->
    <div v-else-if="tab === 'expenses'" class="relative z-10 flex-1 min-h-0 flex flex-col gap-3 overflow-hidden">
      <!-- Form inline siempre visible -->
      <AppCard class="shrink-0 !p-3">
        <form class="grid grid-cols-1 md:grid-cols-[1fr_130px_200px_200px_auto] gap-2 items-center" @submit.prevent="addExpense">
          <input v-model="newTitle" type="text" placeholder="Concepto del gasto"
            class="h-12 rounded-[12px] bg-muted focus:bg-inset px-3 text-[14.5px] font-semibold text-fg outline-none" />
          <input v-model.number="newAmount" type="number" step="1000" placeholder="0 COP"
            class="h-12 rounded-[12px] bg-muted focus:bg-inset px-3 text-[14.5px] text-fg outline-none tabular-nums text-right" />
          <AppDate v-model="newDate" placeholder="Fecha" />
          <AppSelect v-model="newCat" :options="CAT_OPTS" placeholder="Categoría" />
          <button type="submit" :disabled="!newTitle.trim() || !newAmount"
            class="h-12 px-4 rounded-[12px] bg-sky text-[#1f4661] hover:bg-sky-deep hover:text-white font-bold text-[13.5px] disabled:opacity-40 transition-[background-color,color] inline-flex items-center gap-1.5">
            <TrendingDown class="size-[15px]" :stroke-width="2.2" />Anotar
          </button>
        </form>
      </AppCard>
      <AppCard class="flex-1 min-w-0 flex flex-col" :padded="false">
        <header class="px-5 pt-5 pb-3 shrink-0 flex items-center justify-between">
          <h2 class="text-[14px] font-bold text-fg">Movimientos de junio</h2>
          <span class="text-[13px] font-extrabold text-fg tabular-nums">{{ fmt(totalMonth) }}</span>
        </header>
        <ul class="flex-1 min-h-0 overflow-y-auto scroll-area px-3 pb-3 flex flex-col">
          <li v-for="t in expenses" :key="t.id" class="flex items-center gap-3 p-3 rounded-[12px] hover:bg-muted transition-[background-color]">
            <!-- Icono dentro de NUBE Hibi, color de la categoría -->
            <span class="relative inline-block shrink-0" :style="{ width: '54px', height: '37px' }" aria-hidden="true">
              <HibiCloud :size="54" :body-opacity="0.25" :style="{ color: CAT_META[t.cat]?.color || '#bf8f2e' }" class="absolute inset-0" />
              <component :is="CAT_META[t.cat]?.icon || ShoppingBag" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                :style="{ width: '17px', height: '17px', color: CAT_META[t.cat]?.color || '#bf8f2e' }" :stroke-width="2" />
            </span>
            <div class="flex-1 min-w-0">
              <p class="text-[14px] font-semibold text-fg truncate">{{ t.title }}</p>
              <p class="text-[12px] text-fg-muted">{{ t.date }} · {{ CAT_META[t.cat]?.name }}</p>
            </div>
            <span class="text-[15px] font-bold text-fg tabular-nums">{{ fmt(t.amount) }}</span>
          </li>
        </ul>
      </AppCard>
    </div>

    <!-- SUSCRIPCIONES -->
    <div v-else class="relative z-10 flex-1 min-h-0 flex flex-col gap-3 overflow-hidden">
      <AppCard class="shrink-0 !p-3">
        <form class="grid grid-cols-1 md:grid-cols-[1fr_130px_200px_200px_auto] gap-2 items-center" @submit.prevent="addSub">
          <input v-model="newSubTitle" type="text" placeholder="Nombre del servicio"
            class="h-12 rounded-[12px] bg-muted focus:bg-inset px-3 text-[14.5px] font-semibold text-fg outline-none" />
          <input v-model.number="newSubAmount" type="number" step="1000" placeholder="0 COP/mes"
            class="h-12 rounded-[12px] bg-muted focus:bg-inset px-3 text-[14.5px] text-fg outline-none tabular-nums text-right" />
          <AppDate v-model="newSubDate" placeholder="Próximo cobro" />
          <AppSelect v-model="newSubCat" :options="CAT_OPTS" placeholder="Categoría" />
          <button type="submit" :disabled="!newSubTitle.trim() || !newSubAmount"
            class="h-12 px-4 rounded-[12px] bg-sky text-[#1f4661] hover:bg-sky-deep hover:text-white font-bold text-[13.5px] disabled:opacity-40 transition-[background-color,color] inline-flex items-center gap-1.5">
            <Repeat class="size-[15px]" :stroke-width="2.2" />Crear
          </button>
        </form>
      </AppCard>
      <AppCard class="flex-1 min-w-0 flex flex-col" :padded="false">
        <header class="px-5 pt-5 pb-3 shrink-0 flex items-center justify-between">
          <h2 class="text-[14px] font-bold text-fg">Suscripciones activas</h2>
          <span class="text-[13px] font-extrabold text-fg tabular-nums">{{ fmt(totalSubs) }}/mes</span>
        </header>
        <ul class="flex-1 min-h-0 overflow-y-auto scroll-area px-3 pb-3 flex flex-col">
          <li v-for="s in subscriptions" :key="s.id" class="flex items-center gap-3 p-3 rounded-[12px] hover:bg-muted transition-[background-color]">
            <span class="relative inline-block shrink-0" :style="{ width: '54px', height: '37px' }" aria-hidden="true">
              <HibiCloud :size="54" :body-opacity="0.25" :style="{ color: CAT_META[s.cat]?.color || '#bf8f2e' }" class="absolute inset-0" />
              <Repeat class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                :style="{ width: '17px', height: '17px', color: CAT_META[s.cat]?.color || '#bf8f2e' }" :stroke-width="2" />
            </span>
            <div class="flex-1 min-w-0">
              <p class="text-[14px] font-semibold text-fg truncate">{{ s.title }}</p>
              <p class="text-[12px] text-fg-muted">Próximo cobro {{ s.nextCharge }}</p>
            </div>
            <span class="text-[15px] font-bold text-fg tabular-nums">{{ fmt(s.amount) }}</span>
          </li>
        </ul>
      </AppCard>
    </div>
  </div>
</template>
