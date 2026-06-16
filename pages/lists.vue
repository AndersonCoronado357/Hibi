<script setup lang="ts">
import { Plus, ListChecks, ShoppingCart, Film, BookOpen, MapPin, Check, Star } from '@lucide/vue'

useHead({ title: 'Hibi — Listas' })

interface ItemBase { id: string; title: string; done?: boolean }
interface ShoppingItem extends ItemBase { qty?: string }
interface MovieItem extends ItemBase { year?: number; rating?: number }
interface BookItem extends ItemBase { author?: string; rating?: number }
interface PlaceItem extends ItemBase { city?: string }
type AnyItem = ShoppingItem | MovieItem | BookItem | PlaceItem

interface List { id: string; name: string; type: 'shopping' | 'movies' | 'books' | 'places'; tone: string; icon: any; items: AnyItem[] }
const lists: List[] = [
  { id: 'l1', name: 'Compra semanal', type: 'shopping', tone: 'bg-mint text-[#34936a]', icon: ShoppingCart, items: [
    { id: 'i1', title: 'Pan', qty: '2 ud.' }, { id: 'i2', title: 'Leche', qty: '1 L', done: true }, { id: 'i3', title: 'Manzanas', qty: '5 ud.' }, { id: 'i4', title: 'Tomates', qty: '500 g' }, { id: 'i5', title: 'Yogur natural', qty: '4 ud.', done: true },
  ]},
  { id: 'l2', name: 'Pelis pendientes', type: 'movies', tone: 'bg-lavender text-[#7a63c0]', icon: Film, items: [
    { id: 'm1', title: 'Past Lives', year: 2023, rating: 4 }, { id: 'm2', title: 'La sociedad de la nieve', year: 2023 }, { id: 'm3', title: 'Anatomía de una caída', year: 2023, rating: 5 },
  ]},
  { id: 'l3', name: 'Libros del año', type: 'books', tone: 'bg-pink-soft text-pink-deep', icon: BookOpen, items: [
    { id: 'b1', title: 'Klara y el sol', author: 'Kazuo Ishiguro', rating: 4, done: true }, { id: 'b2', title: 'El infinito en un junco', author: 'Irene Vallejo' }, { id: 'b3', title: 'Tokio blues', author: 'Haruki Murakami' },
  ]},
  { id: 'l4', name: 'Sitios para visitar', type: 'places', tone: 'bg-peach text-[#c5733f]', icon: MapPin, items: [
    { id: 'p1', title: 'Granada', city: 'España' }, { id: 'p2', title: 'Kioto', city: 'Japón' }, { id: 'p3', title: 'Bath', city: 'Reino Unido' },
  ]},
]
const listsData = ref(lists)
const selectedId = ref<string>('l1')
const selected = computed(() => listsData.value.find(l => l.id === selectedId.value)!)
const total = computed(() => selected.value.items.length)
const done = computed(() => selected.value.items.filter(i => i.done).length)

const creating = ref(false)
const newName = ref(''); const newType = ref<'shopping'|'movies'|'books'|'places'>('shopping')
const TYPE_META: Record<string, { tone: string; icon: any }> = {
  shopping: { tone: 'bg-mint text-[#34936a]', icon: ShoppingCart },
  movies: { tone: 'bg-lavender text-[#7a63c0]', icon: Film },
  books: { tone: 'bg-pink-soft text-pink-deep', icon: BookOpen },
  places: { tone: 'bg-peach text-[#c5733f]', icon: MapPin },
}
let nextId = 100
function startCreate() { creating.value = true; nextTick(() => document.getElementById('new-list-name')?.focus()) }
function cancelCreate() { creating.value = false; newName.value = '' }
function saveList() {
  const n = newName.value.trim(); if (!n) return
  const id = 'l' + (nextId++)
  const meta = TYPE_META[newType.value]!
  listsData.value.unshift({ id, name: n, type: newType.value, tone: meta.tone, icon: meta.icon, items: [] })
  selectedId.value = id
  cancelCreate()
}

// Form rápido para item
const newItemTitle = ref('')
let nextItemId = 500
function addItem() {
  const t = newItemTitle.value.trim(); if (!t) return
  selected.value.items.push({ id: 'it' + (nextItemId++), title: t })
  newItemTitle.value = ''
}
</script>

<template>
  <div class="h-full flex flex-col gap-3 px-4 md:px-7 py-5">
    <AppCard class="shrink-0 !p-3 md:!p-4 flex items-center justify-between gap-3">
      <div class="flex items-center gap-2.5">
        <span class="grid place-items-center size-10 rounded-[13px] bg-sky-soft text-sky-deep" aria-hidden="true"><ListChecks class="size-5" :stroke-width="1.9" /></span>
        <div>
          <h1 class="text-[20px] md:text-[22px] font-extrabold text-fg leading-tight">Listas</h1>
          <p class="text-[12.5px] text-fg-muted leading-tight">{{ lists.length }} listas activas</p>
        </div>
      </div>
      <AppButton variant="primary" size="sm" @click="startCreate"><template #icon><Plus class="size-[16px]" :stroke-width="2.3" /></template>Nueva</AppButton>
    </AppCard>

    <div class="flex-1 min-h-0 flex flex-col md:flex-row gap-3 overflow-y-auto md:overflow-hidden scroll-area">
      <AppCard class="md:w-[260px] shrink-0 flex flex-col" :padded="false">
        <h2 class="px-4 pt-4 pb-2 text-[13px] font-bold text-fg-muted">Tus listas</h2>
        <div class="flex-1 min-h-0 overflow-y-auto scroll-area px-2 pb-3 flex flex-col gap-1">
          <Transition name="inline-form">
            <form v-if="creating" aria-label="Nueva lista" class="staggered bg-muted rounded-[12px] p-3 mb-1 mx-1 flex flex-col gap-2" @submit.prevent="saveList" @keydown.escape="cancelCreate">
              <label for="new-list-name" class="sr-only">Nombre</label>
              <input id="new-list-name" v-model="newName" type="text" placeholder="Nombre de la lista" class="w-full h-9 rounded-[10px] bg-card focus:bg-inset px-3 text-[14px] font-semibold text-fg outline-none" />
              <div class="flex items-center gap-1.5">
                <button v-for="(meta, key) in TYPE_META" :key="key" type="button" :aria-label="key"
                  class="grid place-items-center size-9 rounded-[10px] transition-[outline-width]"
                  :class="[meta.tone, newType === key ? 'outline outline-2 outline-offset-2 outline-sky-deep' : '']"
                  @click="newType = key as any"><component :is="meta.icon" class="size-[15px]" :stroke-width="1.9" /></button>
              </div>
              <div class="flex items-center justify-end gap-2">
                <button type="button" class="h-8 px-3 rounded-[8px] text-[12.5px] font-semibold text-fg-muted hover:bg-card" @click="cancelCreate">Cancelar</button>
                <button type="submit" :disabled="!newName.trim()" class="h-8 px-3 rounded-[8px] bg-sky text-[#1f4661] text-[12.5px] font-bold disabled:opacity-50">Crear</button>
              </div>
            </form>
          </Transition>
          <button v-for="l in listsData" :key="l.id" type="button"
            class="text-left p-3 rounded-[12px] flex items-center gap-3 transition-[background-color]"
            :class="selectedId === l.id ? 'bg-sky-soft' : 'hover:bg-muted'"
            @click="selectedId = l.id"
          >
            <span class="grid place-items-center size-10 rounded-[12px]" :class="l.tone" aria-hidden="true"><component :is="l.icon" class="size-[18px]" :stroke-width="1.9" /></span>
            <div class="flex-1 min-w-0">
              <p class="text-[14px] font-bold text-fg truncate">{{ l.name }}</p>
              <p class="text-[12px] text-fg-muted">{{ l.items.length }} ítems</p>
            </div>
          </button>
        </div>
      </AppCard>

      <AppCard class="flex-1 min-w-0 flex flex-col overflow-hidden" :padded="false">
        <header class="px-5 pt-5 pb-3 flex flex-col gap-3 shrink-0">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-[20px] font-extrabold text-fg">{{ selected.name }}</h2>
              <p class="text-[12.5px] text-fg-muted">{{ done }} de {{ total }} marcados</p>
            </div>
          </div>
          <form class="relative" @submit.prevent="addItem">
            <label for="new-list-item" class="sr-only">Nuevo ítem</label>
            <input id="new-list-item" v-model="newItemTitle" type="text" placeholder="Añadir un ítem y pulsar Enter…"
              class="w-full h-10 rounded-[12px] bg-muted focus:bg-inset pl-3 pr-11 text-[14px] text-fg outline-none transition-[background-color]" />
            <button type="submit" :disabled="!newItemTitle.trim()" class="absolute right-1 top-1/2 -translate-y-1/2 grid place-items-center size-8 rounded-[9px] bg-sky text-[#1f4661] disabled:opacity-40 hover:brightness-[0.96] transition-[filter]" aria-label="Añadir"><Plus class="size-[16px]" :stroke-width="2.3" /></button>
          </form>
        </header>
        <div class="flex-1 min-h-0 overflow-y-auto scroll-area px-3 pb-3">
          <ul class="flex flex-col gap-1">
            <li v-for="i in selected.items" :key="i.id" class="flex items-center gap-3 p-3 rounded-[12px] hover:bg-muted transition-[background-color]">
              <button type="button"
                class="grid place-items-center size-6 rounded-md transition-[background-color] shrink-0"
                :class="i.done ? 'bg-mint text-[#34936a]' : 'bg-muted text-fg-subtle hover:bg-sky-soft hover:text-sky-deep'"
                :aria-label="i.done ? 'Desmarcar' : 'Marcar'"
              ><Check v-if="i.done" class="size-4" :stroke-width="2.4" /></button>
              <p class="flex-1 text-[14px] font-semibold text-fg" :class="{ 'line-through opacity-50': i.done }">{{ i.title }}</p>
              <span v-if="(i as ShoppingItem).qty" class="text-[12px] text-fg-muted">{{ (i as ShoppingItem).qty }}</span>
              <span v-if="(i as MovieItem).year" class="text-[12px] text-fg-muted">{{ (i as MovieItem).year }}</span>
              <span v-if="(i as BookItem).author" class="text-[12px] text-fg-muted">{{ (i as BookItem).author }}</span>
              <span v-if="(i as PlaceItem).city" class="text-[12px] text-fg-muted">{{ (i as PlaceItem).city }}</span>
              <span v-if="(i as MovieItem).rating || (i as BookItem).rating" class="inline-flex items-center gap-0.5 text-[#bf8f2e]">
                <Star v-for="n in ((i as MovieItem).rating || (i as BookItem).rating)" :key="n" class="size-3 fill-current" :stroke-width="0" aria-hidden="true" />
              </span>
            </li>
          </ul>
        </div>
      </AppCard>
    </div>
  </div>
</template>
