<script setup lang="ts">
// Sheet lateral reutilizable. Cero modal: el resto de la app sigue
// visible y operable. En desktop entra desde la derecha; en móvil desde
// abajo. Cierra con Esc, clic fuera, swipe abajo (móvil) o el botón X.
import { X } from '@lucide/vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    title?: string
    /** ancho desktop, p.ej. 'md:w-[420px]' o 'md:w-[520px]' */
    desktopWidth?: string
    /** mostrar botón X */
    closeable?: boolean
  }>(),
  { desktopWidth: 'md:w-[420px]', closeable: true },
)
const emit = defineEmits<{ 'update:open': [v: boolean] }>()

function close() {
  emit('update:open', false)
}

onMounted(() => {
  if (!import.meta.client) return
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && props.open) close()
  }
  window.addEventListener('keydown', onKey)
  onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
})
</script>

<template>
  <Teleport to="body">
    <!-- velo muy ligero, NO oscuro -->
    <Transition name="sh-fade">
      <button
        v-if="open"
        type="button"
        class="fixed inset-0 z-[60] bg-fg/8 cursor-default"
        aria-label="Cerrar panel"
        @click="close"
      />
    </Transition>
    <!-- Panel: bottom en móvil / right en desktop -->
    <Transition name="sh-slide">
      <aside
        v-if="open"
        class="fixed z-[61] bg-card flex flex-col left-0 right-0 bottom-0 max-h-[90vh] rounded-t-[26px] md:left-auto md:top-0 md:bottom-0 md:max-h-none md:h-full md:rounded-none md:rounded-l-[26px]"
        :class="desktopWidth"
        role="dialog"
        :aria-label="title || 'Panel'"
        :style="{ paddingBottom: 'env(safe-area-inset-bottom)' }"
      >
        <!-- handle móvil -->
        <div class="md:hidden flex justify-center pt-2 pb-1">
          <span class="block w-10 h-1.5 rounded-full bg-muted" />
        </div>
        <!-- cabecera -->
        <header
          class="flex items-center gap-3 px-5 md:px-6 pt-3 md:pt-6 pb-3"
          v-if="$slots.header || title || closeable"
        >
          <div class="flex-1 min-w-0">
            <slot name="header">
              <h2 v-if="title" class="text-[18px] font-extrabold text-fg truncate">{{ title }}</h2>
            </slot>
          </div>
          <button
            v-if="closeable"
            type="button"
            class="grid place-items-center size-9 rounded-[12px] text-fg-subtle hover:text-fg hover:bg-muted transition-colors"
            aria-label="Cerrar"
            @click="close"
          >
            <X class="size-[18px]" :stroke-width="2" />
          </button>
        </header>
        <div class="flex-1 min-h-0 overflow-y-auto scroll-area">
          <slot />
        </div>
        <footer v-if="$slots.footer" class="shrink-0 px-5 md:px-6 py-3 bg-card">
          <slot name="footer" />
        </footer>
      </aside>
    </Transition>
  </Teleport>
</template>

<style scoped>
.sh-fade-enter-active,
.sh-fade-leave-active {
  transition: opacity 0.24s ease;
}
.sh-fade-enter-from,
.sh-fade-leave-to {
  opacity: 0;
}
.sh-slide-enter-active,
.sh-slide-leave-active {
  transition: transform 0.42s cubic-bezier(0.33, 1, 0.68, 1);
}
.sh-slide-enter-from,
.sh-slide-leave-to {
  transform: translateY(110%);
}
@media (min-width: 768px) {
  .sh-slide-enter-from,
  .sh-slide-leave-to {
    transform: translateX(110%);
  }
}
</style>
