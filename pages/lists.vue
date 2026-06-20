<script setup lang="ts">
import { Plus, ListChecks, ShoppingCart, Film, BookOpen, MapPin, Check, Star, X, Trash2, Tag, FileText, ListPlus } from '@lucide/vue'

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

const view = ref<'list' | 'create'>('list')
const newName = ref('')
const newType = ref<'shopping'|'movies'|'books'|'places'>('shopping')
const newInitialItems = ref<string[]>([])
const newInitialTitle = ref('')
const newNotes = ref('')
const TYPE_META: Record<string, { tone: string; icon: any; label: string }> = {
  shopping: { tone: 'bg-mint text-[#34936a]', icon: ShoppingCart, label: 'Compra' },
  movies: { tone: 'bg-lavender text-[#7a63c0]', icon: Film, label: 'Pelis / series' },
  books: { tone: 'bg-pink-soft text-pink-deep', icon: BookOpen, label: 'Libros' },
  places: { tone: 'bg-peach text-[#c5733f]', icon: MapPin, label: 'Sitios' },
}
const TYPE_OPTS = Object.entries(TYPE_META).map(([k, v]) => ({ value: k, label: v.label }))
let nextId = 100
let nextItemId = 500
function openCreate() {
  newName.value = ''; newType.value = 'shopping'
  newInitialItems.value = []; newInitialTitle.value = ''; newNotes.value = ''
  view.value = 'create'
}
function cancelCreate() { view.value = 'list' }
function addInitial() {
  const t = newInitialTitle.value.trim(); if (!t) return
  newInitialItems.value.push(t)
  newInitialTitle.value = ''
}
function removeInitial(i: number) { newInitialItems.value.splice(i, 1) }
function saveList() {
  const n = newName.value.trim(); if (!n) return
  const id = 'l' + (nextId++)
  const meta = TYPE_META[newType.value]!
  const items: AnyItem[] = newInitialItems.value.map(t => ({ id: 'it' + (nextItemId++), title: t }))
  listsData.value.unshift({ id, name: n, type: newType.value, tone: meta.tone, icon: meta.icon, items })
  selectedId.value = id
  view.value = 'list'
}

const newItemTitle = ref('')
const itemsListRef = ref<HTMLElement | null>(null)
function addItem() {
  const t = newItemTitle.value.trim(); if (!t) return
  selected.value.items.push({ id: 'it' + (nextItemId++), title: t })
  newItemTitle.value = ''
  nextTick(() => {
    if (itemsListRef.value) itemsListRef.value.scrollTop = itemsListRef.value.scrollHeight
  })
}

</script>

<template>
  <!-- VISTA DE CREACIÓN -->
  <AppCreateView v-if="view === 'create'"
    title="Nueva lista" subtitle="Para no dejarte nada"
    :disabled="!newName.trim()"
    @close="cancelCreate" @save="saveList">
    <div class="flex flex-col gap-2">
      <label class="text-[12.5px] font-bold text-fg-muted px-1">Nombre</label>
      <input v-model="newName" type="text" placeholder="Compra semanal, viaje a Japón…" autofocus
        class="w-full h-14 rounded-[14px] bg-card focus:bg-muted px-4 text-[18px] font-semibold text-fg outline-none" />
    </div>
    <div class="flex flex-col gap-2">
      <label class="text-[12.5px] font-bold text-fg-muted px-1">Tipo</label>
      <div class="flex items-center gap-2 flex-wrap">
        <button v-for="(meta, key) in TYPE_META" :key="key" type="button"
          class="hibi-chip" :class="[meta.tone, newType === key ? 'is-active' : '']"
          @click="newType = key as any">
          <component :is="meta.icon" class="size-[18px]" :stroke-width="1.9" />
          {{ meta.label }}
        </button>
      </div>
    </div>

    <div class="flex flex-col gap-2">
      <label class="text-[12.5px] font-bold text-fg-muted px-1">Ítems iniciales</label>
      <!-- INPUT ARRIBA: añadir nuevo ítem -->
      <div class="flex items-center gap-2">
        <input v-model="newInitialTitle" type="text" placeholder="Pan, leche, manzanas…"
          class="flex-1 h-12 rounded-[12px] bg-card focus:bg-inset px-3 text-[14.5px] text-fg outline-none"
          @keydown.enter.prevent="addInitial" />
        <button type="button" class="inline-flex items-center gap-1 h-12 px-4 rounded-[12px] bg-sky text-[#1f4661] hover:bg-sky-deep hover:text-white font-bold text-[13.5px] transition-[background-color,color]" @click="addInitial">
          <Plus class="size-[15px]" :stroke-width="2.3" />Añadir
        </button>
      </div>
      <!-- LISTA DEBAJO: ítems agregados -->
      <ul v-if="newInitialItems.length" class="flex flex-col gap-1.5 mt-1">
        <li v-for="(t, i) in newInitialItems" :key="i"
          class="flex items-center gap-3 bg-card rounded-[12px] px-3 py-2.5">
          <span class="grid place-items-center size-7 rounded-full bg-muted text-fg-muted text-[12px] font-bold tabular-nums">{{ i + 1 }}</span>
          <p class="flex-1 text-[14px] font-semibold text-fg">{{ t }}</p>
          <button type="button" class="grid place-items-center size-8 rounded-[10px] text-fg-subtle hover:text-pink-deep hover:bg-pink-soft" aria-label="Eliminar" @click="removeInitial(i)"><X class="size-[15px]" :stroke-width="2" /></button>
        </li>
      </ul>
    </div>
  </AppCreateView>

  <div v-else class="h-full w-full flex flex-col gap-3 px-4 md:px-7 py-5 overflow-hidden relative">
    <!-- Decoración cute -->
    <HibiCloud :size="150" float :duration="8" class="hidden md:block absolute -top-6 -right-8 text-sky-soft opacity-15 pointer-events-none z-40" aria-hidden="true" />
    <HibiCloud :size="90"  float :duration="10" :delay="1.2" class="hidden md:block absolute bottom-6 -left-6 text-pink-soft opacity-15 pointer-events-none z-40" aria-hidden="true" />
    <HibiSparkle :size="18" twinkle :duration="2.4" class="hidden md:block absolute top-[14%] left-[10%] text-fg-subtle opacity-25 pointer-events-none z-40" />
    <HibiSparkle :size="14" twinkle :duration="3" :delay="0.8" class="hidden md:block absolute top-[8%] right-[26%] text-fg-subtle opacity-25 pointer-events-none z-40" />
    <HibiHeart :size="16" beat :duration="2.6" class="hidden md:block absolute bottom-[20%] right-[8%] text-fg-subtle opacity-25 pointer-events-none z-40" />

    <div class="relative z-10">
      <PageHero :icon="ListChecks" tone="sky" title="Listas" :subtitle="`${listsData.length} listas activas`">
        <template #actions>
          <AppButton variant="primary" size="sm" @click="openCreate"><template #icon><Plus class="size-[16px]" :stroke-width="2.3" /></template>Nueva</AppButton>
        </template>
      </PageHero>
    </div>

    <div class="relative z-10 flex-1 min-h-0 flex flex-col md:flex-row gap-3 overflow-hidden">
      <AppCard class="md:w-[260px] shrink-0 flex flex-col" :padded="false">
        <h2 class="px-4 pt-4 pb-2 text-[13px] font-bold text-fg-muted">Tus listas</h2>
        <div class="hibi-anim-slide-right flex-1 min-h-0 overflow-y-auto scroll-area px-2 pb-3 flex flex-col gap-1">
          <button v-for="l in listsData" :key="l.id" type="button"
            class="text-left p-3 rounded-[12px] flex items-center gap-3 transition-[background-color]"
            :class="selectedId === l.id ? 'bg-sky-soft' : 'hover:bg-muted'"
            @click="selectedId = l.id"
          >
            <HibiCloudIcon :size="52" :icon="l.icon" :icon-size="18" :cloud-color="l.tone.split(' ')[0]" :icon-color="l.tone.split(' ')[1]" :icon-stroke="1.9" class="shrink-0" />
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
        <div ref="itemsListRef" class="flex-1 min-h-0 overflow-y-auto scroll-area px-3 pb-3">
          <ul class="hibi-anim-fade-up flex flex-col gap-1">
            <li v-for="i in selected.items" :key="i.id"
              class="flex items-center gap-3 p-3 rounded-[12px] hover:bg-muted cursor-pointer transition-[background-color,opacity]"
              :class="i.done ? 'opacity-60' : ''"
              @click="i.done = !i.done">
              <span class="shrink-0 relative inline-block" :style="{ width: '38px', height: '26px' }">
                <Transition name="hibi-check">
                  <HibiCloudIcon
                    :key="i.done ? 'on' : 'off'"
                    :size="38"
                    :icon="Check"
                    :icon-size="14"
                    :cloud-color="i.done ? 'text-mint' : 'text-card'"
                    :icon-color="i.done ? 'text-[#34936a]' : 'text-transparent'"
                    :icon-stroke="2.4"
                    class="absolute inset-0" />
                </Transition>
              </span>
              <p class="flex-1 text-[14px] font-semibold text-fg" :class="{ 'line-through': i.done }">{{ i.title }}</p>
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
