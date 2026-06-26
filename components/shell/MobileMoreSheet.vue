<script setup lang="ts">
// Sheet inferior con TODOS los módulos restantes. Cero modal: el resto de
// la app sigue visible y operable. Se cierra con tap fuera, swipe abajo,
// Esc, o al navegar.
import { X } from '@lucide/vue'

const open = useMoreSheetOpen()
const { items, settings } = useNav()
const { t } = useI18n()
const route = useRoute()
const router = useRouter()

// Las que ya están en la bottom-nav (no repetir).
const PRIMARY_KEYS = new Set(['calendar', 'tasks', 'notes', 'habits'])
const rest = computed(() => items.filter((i) => !PRIMARY_KEYS.has(i.key)))

function close() {
  open.value = false
}

function navigate(to: string) {
  close()
  router.push(to)
}

// Esc cierra
onMounted(() => {
  if (!import.meta.client) return
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && open.value) close()
  }
  window.addEventListener('keydown', onKey)
  onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
})

function isActive(to: string) {
  return route.path.startsWith(to)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="ms-fade">
      <button
        v-if="open"
        type="button"
        class="md:hidden fixed inset-0 z-[60] bg-fg/10 cursor-default"
        aria-label="Cerrar"
        @click="close"
      />
    </Transition>
    <Transition name="ms-slide">
      <section
        v-if="open"
        class="md:hidden fixed left-0 right-0 bottom-0 z-[61] bg-card rounded-t-[26px] px-4 pt-2 pb-6"
        role="dialog"
        aria-label="Más opciones"
        style="padding-bottom: max(1.5rem, env(safe-area-inset-bottom))"
      >
        <!-- handle / cabecera -->
        <div class="flex flex-col items-center pb-3">
          <span class="block w-10 h-1.5 rounded-full bg-muted" />
        </div>
        <div class="flex items-center justify-between mb-3 px-1">
          <h2 class="text-[16px] font-extrabold text-fg">Más</h2>
          <button
            type="button"
            class="grid place-items-center size-9 rounded-[12px] text-fg-subtle hover:text-fg hover:bg-muted transition-colors"
            aria-label="Cerrar"
            @click="close"
          >
            <X class="size-[18px]" :stroke-width="2" />
          </button>
        </div>
        <div class="grid grid-cols-3 gap-2.5 pb-1">
          <button
            v-for="item in rest"
            :key="item.key"
            type="button"
            class="flex flex-col items-center justify-center gap-1.5 h-[88px] rounded-[18px] transition-colors"
            :class="isActive(item.to) ? 'bg-sky-soft' : 'bg-muted hover:bg-sky-soft'"
            @click="navigate(item.to)"
          >
            <span class="grid place-items-center size-10 rounded-[13px] bg-card text-sky-deep">
              <component :is="item.icon" class="size-[20px]" :stroke-width="1.9" />
            </span>
            <span class="text-[12px] font-semibold text-fg leading-none">{{ t(`nav.${item.key}`) }}</span>
          </button>
        </div>
      </section>
    </Transition>
  </Teleport>
</template>

<style scoped>
.ms-fade-enter-active,
.ms-fade-leave-active {
  transition: opacity 0.24s ease;
}
.ms-fade-enter-from,
.ms-fade-leave-to {
  opacity: 0;
}
.ms-slide-enter-active,
.ms-slide-leave-active {
  transition: transform 0.36s cubic-bezier(0.33, 1, 0.68, 1);
}
.ms-slide-enter-from,
.ms-slide-leave-to {
  transform: translateY(110%);
}
</style>
