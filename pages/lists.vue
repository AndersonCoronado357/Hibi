<script setup lang="ts">
import { Plus, ListChecks, ShoppingCart, Film, BookOpen, MapPin, Check, Star, X, Trash2, Tag, FileText, ListPlus, ChevronRight, ChevronLeft } from '@lucide/vue'
import type { Component } from 'vue'
import { useLists, type ListRecord, type ListItem } from '~/composables/useLists'

const { t } = useI18n()

useHead({ title: t('lists.head.title') })

const {
  lists, items, listsLoading, itemsLoading,
  createList, removeList,
  createItem, updateItem, removeItem, toggleItem,
} = useLists()

// Iconos lucide guardados como nombre → componente (para HibiCloudIcon).
const ICONS: Record<string, Component> = { ListChecks, ShoppingCart, Film, BookOpen, MapPin }
const iconOf = (name: string): Component => ICONS[name] ?? ListChecks

// tone/icon/iconName son valores lógicos; label es display → reactivo con t().
const TYPE_META = computed<Record<string, { tone: string; icon: Component; iconName: string; label: string }>>(() => ({
  shopping: { tone: 'bg-mint text-[#34936a]', icon: ShoppingCart, iconName: 'ShoppingCart', label: t('lists.types.shopping') },
  movies: { tone: 'bg-lavender text-[#7a63c0]', icon: Film, iconName: 'Film', label: t('lists.types.movies') },
  books: { tone: 'bg-pink-soft text-pink-deep', icon: BookOpen, iconName: 'BookOpen', label: t('lists.types.books') },
  places: { tone: 'bg-peach text-[#c5733f]', icon: MapPin, iconName: 'MapPin', label: t('lists.types.places') },
}))

// Listas para la UI: resuelve el icono (nombre → componente) y añade sus ítems.
const listsData = computed(() =>
  lists.value.map((l) => ({
    ...l,
    iconComp: iconOf(l.icon),
    items: items.value.filter((it) => it.listId === l.id),
  })),
)

const selectedId = ref<string>('')
watchEffect(() => {
  if (!listsData.value.length) { selectedId.value = ''; return }
  if (!listsData.value.some((l) => l.id === selectedId.value)) selectedId.value = listsData.value[0]!.id
})
const selected = computed(() => listsData.value.find((l) => l.id === selectedId.value) ?? null)
const selectedItems = computed<ListItem[]>(() => selected.value?.items ?? [])
const total = computed(() => selectedItems.value.length)
const done = computed(() => selectedItems.value.filter((i) => i.done).length)

const view = ref<'list' | 'create'>('list')
const newName = ref('')
const newType = ref<'shopping'|'movies'|'books'|'places'>('shopping')
const newInitialItems = ref<string[]>([])
const newInitialTitle = ref('')
const newNotes = ref('')
function openCreate() {
  newName.value = ''; newType.value = 'shopping'
  newInitialItems.value = []; newInitialTitle.value = ''; newNotes.value = ''
  view.value = 'create'
}
function cancelCreate() { view.value = 'list' }
function addInitial() {
  const title = newInitialTitle.value.trim(); if (!title) return
  newInitialItems.value.push(title)
  newInitialTitle.value = ''
}
function removeInitial(i: number) { newInitialItems.value.splice(i, 1) }
async function saveList() {
  const n = newName.value.trim(); if (!n) return
  const meta = TYPE_META.value[newType.value]!
  const initial = [...newInitialItems.value]
  const created = await createList({ name: n, type: newType.value, tone: meta.tone, icon: meta.iconName })
  selectedId.value = created.id
  view.value = 'list'
  for (let idx = 0; idx < initial.length; idx++) {
    await createItem({ listId: created.id, title: initial[idx]!, position: idx })
  }
}

const newItemTitle = ref('')
const itemsListRef = ref<HTMLElement | null>(null)
async function addItem() {
  const title = newItemTitle.value.trim(); if (!title || !selected.value) return
  const listId = selected.value.id
  const position = selectedItems.value.length
  newItemTitle.value = ''
  await createItem({ listId, title, position })
  nextTick(() => {
    if (itemsListRef.value) itemsListRef.value.scrollTop = itemsListRef.value.scrollHeight
  })
}
function onRemoveItem(id: string) { removeItem(id) }
function onToggleItem(item: ListItem) { toggleItem(item) }

// Rating type-específico vive en item.data.
const ratingOf = (i: ListItem) => Number(i.data?.rating) || 0

// Móvil: lista de listas → tocar abre sus ítems (drill-down).
const mobileListOpen = ref(false)
function openListMobile(id: string) {
  selectedId.value = id
  mobileListOpen.value = true
}

function onRemoveList(id: string) {
  removeList(id)
  if (selectedId.value === id) mobileListOpen.value = false
}

</script>

<template>
  <!-- VISTA DE CREACIÓN -->
  <AppCreateView v-if="view === 'create'"
    :title="t('lists.create.title')" :subtitle="t('lists.create.subtitle')"
    :disabled="!newName.trim()"
    @close="cancelCreate" @save="saveList">
    <div class="flex flex-col gap-2">
      <label class="text-[12.5px] font-bold text-fg-muted px-1">{{ t('lists.create.nameLabel') }}</label>
      <input v-model="newName" type="text" :placeholder="t('lists.create.namePlaceholder')" autofocus
        class="w-full h-14 rounded-[14px] bg-card px-4 text-[18px] font-semibold text-fg outline-none" />
    </div>
    <div class="flex flex-col gap-2">
      <label class="text-[12.5px] font-bold text-fg-muted px-1">{{ t('lists.create.typeLabel') }}</label>
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
      <label class="text-[12.5px] font-bold text-fg-muted px-1">{{ t('lists.create.initialLabel') }}</label>
      <!-- INPUT ARRIBA: añadir nuevo ítem -->
      <div class="flex items-center gap-2">
        <input v-model="newInitialTitle" type="text" :placeholder="t('lists.create.initialPlaceholder')"
          class="flex-1 h-12 rounded-[12px] bg-card px-3 text-[14.5px] text-fg outline-none"
          @keydown.enter.prevent="addInitial" />
        <button type="button" class="inline-flex items-center gap-1 h-12 px-4 rounded-[12px] bg-sky text-[#1f4661] hover:bg-sky-deep hover:text-white font-bold text-[13.5px] transition-[background-color,color]" @click="addInitial">
          <Plus class="size-[15px]" :stroke-width="2.3" />{{ t('common.add') }}
        </button>
      </div>
      <!-- LISTA DEBAJO: ítems agregados -->
      <ul v-if="newInitialItems.length" class="flex flex-col gap-1.5 mt-1">
        <li v-for="(title, i) in newInitialItems" :key="i"
          class="flex items-center gap-3 bg-card rounded-[12px] px-3 py-2.5">
          <span class="grid place-items-center size-7 rounded-full bg-muted text-fg-muted text-[12px] font-bold tabular-nums">{{ i + 1 }}</span>
          <p class="flex-1 text-[14px] font-semibold text-fg">{{ title }}</p>
          <button type="button" class="grid place-items-center size-8 rounded-[10px] text-fg-subtle hover:text-pink-deep hover:bg-pink-soft" :aria-label="t('lists.aria.removeInitial')" @click="removeInitial(i)"><X class="size-[15px]" :stroke-width="2" /></button>
        </li>
      </ul>
    </div>
  </AppCreateView>

  <div v-else class="h-full w-full flex flex-col gap-2 md:gap-3 px-3 md:px-7 py-3 md:py-5 overflow-hidden relative">
    <!-- Decoración cute -->
    <HibiCloud :size="150" float :duration="8" class="hidden md:block absolute -top-6 -right-8 text-sky-soft opacity-15 pointer-events-none z-40" aria-hidden="true" />
    <HibiCloud :size="90"  float :duration="10" :delay="1.2" class="hidden md:block absolute bottom-6 -left-6 text-pink-soft opacity-15 pointer-events-none z-40" aria-hidden="true" />
    <HibiSparkle :size="18" twinkle :duration="2.4" class="hidden md:block absolute top-[14%] left-[10%] text-fg-subtle opacity-25 pointer-events-none z-40" />
    <HibiSparkle :size="14" twinkle :duration="3" :delay="0.8" class="hidden md:block absolute top-[8%] right-[26%] text-fg-subtle opacity-25 pointer-events-none z-40" />
    <HibiHeart :size="16" beat :duration="2.6" class="hidden md:block absolute bottom-[20%] right-[8%] text-fg-subtle opacity-25 pointer-events-none z-40" />

    <div class="relative z-10">
      <PageHero :icon="ListChecks" tone="sky" :title="t('lists.title')" :subtitle="t('lists.subtitle', { count: listsData.length })">
        <template #actions>
          <AppButton variant="primary" size="sm" class="w-full md:w-auto" @click="openCreate"><template #icon><Plus class="size-[16px]" :stroke-width="2.3" /></template>{{ t('lists.new') }}</AppButton>
        </template>
      </PageHero>
    </div>

    <div class="relative z-10 flex-1 min-h-0 flex flex-col md:flex-row gap-2 md:gap-3 overflow-hidden">
      <!-- MÓVIL: SOLO la lista de listas; tocar una abre sus ítems -->
      <div class="md:hidden flex flex-col flex-1 min-h-0">
        <div class="flex-1 min-h-0 overflow-y-auto scroll-area flex flex-col gap-2">
          <!-- Cargando (pulse) -->
          <template v-if="listsLoading && !listsData.length">
            <div v-for="n in 4" :key="n" class="p-3 rounded-[14px] bg-card flex items-center gap-3 animate-pulse">
              <div class="size-[52px] rounded-full bg-muted shrink-0"></div>
              <div class="flex-1 min-w-0 flex flex-col gap-2">
                <div class="h-3.5 w-2/3 rounded-full bg-muted"></div>
                <div class="h-3 w-1/3 rounded-full bg-muted"></div>
              </div>
            </div>
          </template>
          <!-- Vacío -->
          <div v-else-if="!listsData.length" class="flex-1 grid place-items-center text-center px-6">
            <div class="flex flex-col items-center gap-3">
              <HibiCloudIcon :size="72" :icon="ListChecks" :icon-size="26" cloud-color="bg-sky-soft" icon-color="text-sky-deep" :icon-stroke="1.9" />
              <p class="text-[15px] font-bold text-fg">{{ t('lists.empty.mobileTitle') }}</p>
              <p class="text-[13px] text-fg-muted -mt-1">{{ t('lists.empty.mobileSubtitle') }}</p>
            </div>
          </div>
          <button v-else v-for="l in listsData" :key="l.id" type="button"
            class="text-left p-3 rounded-[14px] bg-card transition-[background-color] flex items-center gap-3 active:bg-muted"
            @click="openListMobile(l.id)">
            <HibiCloudIcon :size="52" :icon="l.iconComp" :icon-size="18" :cloud-color="l.tone.split(' ')[0]" :icon-color="l.tone.split(' ')[1]" :icon-stroke="1.9" class="shrink-0" />
            <div class="flex-1 min-w-0">
              <p class="text-[15px] font-bold text-fg break-words">{{ l.name }}</p>
              <p class="text-[12.5px] text-fg-muted">{{ t('lists.mobile.markedCount', { done: l.items.filter(x => x.done).length, total: l.items.length }) }}</p>
            </div>
            <ChevronRight class="size-[18px] text-fg-subtle shrink-0" :stroke-width="2" aria-hidden="true" />
          </button>
        </div>
      </div>

      <!-- DESKTOP: sidebar de listas -->
      <AppCard class="hidden md:flex md:w-[260px] shrink-0 flex-col" :padded="false">
        <h2 class="px-4 pt-4 pb-2 text-[13px] font-bold text-fg-muted">{{ t('lists.sidebar.heading') }}</h2>
        <div class="hibi-anim-slide-right flex-1 min-h-0 overflow-y-auto scroll-area px-2 pb-3 flex flex-col gap-1">
          <!-- Cargando (pulse) -->
          <template v-if="listsLoading && !listsData.length">
            <div v-for="n in 4" :key="n" class="p-3 rounded-[12px] flex items-center gap-3 animate-pulse">
              <div class="size-[52px] rounded-full bg-muted shrink-0"></div>
              <div class="flex-1 min-w-0 flex flex-col gap-2">
                <div class="h-3.5 w-2/3 rounded-full bg-muted"></div>
                <div class="h-3 w-1/3 rounded-full bg-muted"></div>
              </div>
            </div>
          </template>
          <!-- Vacío -->
          <div v-else-if="!listsData.length" class="flex-1 grid place-items-center text-center px-4 py-6">
            <div class="flex flex-col items-center gap-2.5">
              <HibiCloudIcon :size="60" :icon="ListChecks" :icon-size="22" cloud-color="bg-sky-soft" icon-color="text-sky-deep" :icon-stroke="1.9" />
              <p class="text-[13.5px] font-bold text-fg">{{ t('lists.empty.sidebarTitle') }}</p>
              <p class="text-[12px] text-fg-muted -mt-1">{{ t('lists.empty.sidebarSubtitle') }}</p>
            </div>
          </div>
          <button v-else v-for="l in listsData" :key="l.id" type="button"
            class="text-left p-3 rounded-[12px] flex items-center gap-3 transition-[background-color]"
            :class="selectedId === l.id ? 'bg-sky-soft' : 'hover:bg-muted'"
            @click="selectedId = l.id"
          >
            <HibiCloudIcon :size="52" :icon="l.iconComp" :icon-size="18" :cloud-color="l.tone.split(' ')[0]" :icon-color="l.tone.split(' ')[1]" :icon-stroke="1.9" class="shrink-0" />
            <div class="flex-1 min-w-0">
              <p class="text-[14px] font-bold text-fg truncate">{{ l.name }}</p>
              <p class="text-[12px] text-fg-muted">{{ t('lists.sidebar.itemsCount', { count: l.items.length }) }}</p>
            </div>
          </button>
        </div>
      </AppCard>

      <AppCard v-if="selected" class="flex-1 min-w-0 flex-col overflow-hidden" :padded="false"
        :class="mobileListOpen ? '!absolute inset-0 z-20 flex' : 'hidden md:flex'">
        <header class="px-4 md:px-5 pt-4 md:pt-5 pb-3 flex flex-col gap-3 shrink-0">
          <div class="flex items-center gap-2">
            <button type="button" class="md:hidden grid place-items-center size-9 rounded-full text-fg-muted hover:bg-muted shrink-0" :aria-label="t('lists.aria.backToLists')" @click="mobileListOpen = false"><ChevronLeft class="size-[18px]" :stroke-width="2" /></button>
            <div class="flex-1 min-w-0">
              <h2 class="text-[19px] md:text-[20px] font-extrabold text-fg truncate">{{ selected.name }}</h2>
              <p class="text-[12.5px] text-fg-muted">{{ t('lists.detail.markedCount', { done, total }) }}</p>
            </div>
            <button type="button" class="grid place-items-center size-9 rounded-full text-fg-subtle hover:text-pink-deep hover:bg-pink-soft transition-[background-color,color] shrink-0" :aria-label="t('lists.aria.removeList')" @click="onRemoveList(selected.id)"><Trash2 class="size-[16px]" :stroke-width="2" /></button>
          </div>
          <form class="flex items-center gap-2" @submit.prevent="addItem">
            <label for="new-list-item" class="sr-only">{{ t('lists.detail.newItemLabel') }}</label>
            <input id="new-list-item" v-model="newItemTitle" type="text" :placeholder="t('lists.detail.addItemPlaceholder')"
              class="flex-1 min-w-0 h-11 rounded-[12px] bg-muted px-3.5 text-[14.5px] text-fg outline-none" />
            <button type="submit" :disabled="!newItemTitle.trim()" class="shrink-0 grid place-items-center size-11 rounded-[12px] bg-sky text-[#1f4661] disabled:opacity-40 hover:brightness-[0.96] transition-[filter]" :aria-label="t('lists.aria.addItem')"><Plus class="size-[17px]" :stroke-width="2.3" /></button>
          </form>
        </header>
        <div ref="itemsListRef" class="flex-1 min-h-0 overflow-y-auto scroll-area px-3 pb-3">
          <!-- Cargando ítems (pulse) -->
          <ul v-if="itemsLoading && !selectedItems.length" class="flex flex-col gap-1">
            <li v-for="n in 5" :key="n" class="flex items-center gap-3 p-3 rounded-[12px] animate-pulse">
              <div class="size-[26px] w-[38px] rounded-full bg-muted shrink-0"></div>
              <div class="h-3.5 rounded-full bg-muted" :style="{ width: (40 + (n * 9) % 45) + '%' }"></div>
            </li>
          </ul>
          <!-- Vacío -->
          <div v-else-if="!selectedItems.length" class="grid place-items-center text-center px-6 py-10">
            <div class="flex flex-col items-center gap-2.5">
              <HibiCloudIcon :size="60" :icon="ListPlus" :icon-size="22" cloud-color="bg-mint" icon-color="text-[#34936a]" :icon-stroke="1.9" />
              <p class="text-[13.5px] font-bold text-fg">{{ t('lists.empty.itemsTitle') }}</p>
              <p class="text-[12px] text-fg-muted -mt-1">{{ t('lists.empty.itemsSubtitle') }}</p>
            </div>
          </div>
          <ul v-else class="hibi-anim-fade-up flex flex-col gap-1">
            <li v-for="i in selectedItems" :key="i.id"
              class="group/item flex items-center gap-3 p-3 rounded-[12px] hover:bg-muted cursor-pointer transition-[background-color,opacity]"
              :class="i.done ? 'opacity-60' : ''"
              @click="onToggleItem(i)">
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
              <p class="flex-1 min-w-0 text-[14px] font-semibold text-fg break-words" :class="{ 'line-through': i.done }">{{ i.title }}</p>
              <span v-if="ratingOf(i)" class="shrink-0 inline-flex items-center gap-0.5 text-[#bf8f2e]">
                <Star v-for="n in ratingOf(i)" :key="n" class="size-3 fill-current" :stroke-width="0" aria-hidden="true" />
              </span>
              <button type="button" class="shrink-0 grid place-items-center size-7 rounded-full text-fg-subtle md:opacity-0 md:group-hover/item:opacity-100 hover:text-pink-deep hover:bg-pink-soft transition-[opacity,background-color,color]" :aria-label="t('lists.aria.removeItem')" @click.stop="onRemoveItem(i.id)"><Trash2 class="size-[14px]" :stroke-width="2" /></button>
            </li>
          </ul>
        </div>
      </AppCard>
    </div>
  </div>
</template>

<style scoped>
.hibi-no-sb { scrollbar-width: none; }
.hibi-no-sb::-webkit-scrollbar { display: none; }
</style>
