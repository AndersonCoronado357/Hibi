<script setup lang="ts">
// Bottom nav móvil: 4 destinos primarios + botón "Más" que abre el sheet
// con el resto. "Hoy" no aparece como módulo: se accede tocando el logo
// arriba a la izquierda.
import { Calendar, ListTodo, NotebookPen, Flame, LayoutGrid } from '@lucide/vue'

const { t } = useI18n()
const route = useRoute()
const open = useMoreSheetOpen()

const items = [
  { key: 'calendar', to: '/calendar', icon: Calendar },
  { key: 'tasks', to: '/tasks', icon: ListTodo },
  { key: 'notes', to: '/notes', icon: NotebookPen },
  { key: 'habits', to: '/habits', icon: Flame },
]

function isActive(to: string) {
  return route.path.startsWith(to)
}
</script>

<template>
  <nav
    class="md:hidden shrink-0 bg-card flex items-stretch px-2 pt-1.5 z-10"
    style="padding-bottom: max(0.375rem, env(safe-area-inset-bottom))"
  >
    <NuxtLink
      v-for="item in items"
      :key="item.key"
      :to="item.to"
      class="flex-1 flex flex-col items-center justify-center gap-1 py-1.5 rounded-[16px] transition-colors duration-200"
    >
      <span
        class="grid place-items-center size-9 rounded-[13px] transition-colors duration-200"
        :class="isActive(item.to) ? 'bg-sky-soft text-sky-deep' : 'text-fg-subtle'"
      >
        <component :is="item.icon" class="size-[21px]" :stroke-width="isActive(item.to) ? 2.1 : 1.7" />
      </span>
      <span
        class="text-[10px] font-semibold"
        :class="isActive(item.to) ? 'text-sky-deep' : 'text-fg-subtle'"
      >{{ t(`nav.${item.key}`) }}</span>
    </NuxtLink>

    <button
      type="button"
      class="flex-1 flex flex-col items-center justify-center gap-1 py-1.5 rounded-[16px] transition-colors duration-200"
      :aria-label="open ? 'Cerrar más opciones' : 'Más opciones'"
      :aria-expanded="open"
      @click="open = !open"
    >
      <span
        class="grid place-items-center size-9 rounded-[13px] transition-colors duration-200"
        :class="open ? 'bg-sky-soft text-sky-deep' : 'text-fg-subtle'"
      >
        <LayoutGrid class="size-[21px]" :stroke-width="open ? 2.1 : 1.7" />
      </span>
      <span class="text-[10px] font-semibold" :class="open ? 'text-sky-deep' : 'text-fg-subtle'">Más</span>
    </button>
  </nav>
</template>
