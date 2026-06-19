<script setup lang="ts">
import { ChevronDown } from '@lucide/vue'

const props = defineProps<{
  label: string
  value?: string
  icon?: any
  iconTone?: string
  defaultOpen?: boolean
}>()

const open = ref(props.defaultOpen ?? false)
function toggle() { open.value = !open.value }
</script>

<template>
  <div class="w-full rounded-[16px] bg-card hover:bg-muted transition-[background-color] overflow-hidden"
    :class="open ? 'bg-muted' : ''">
    <button type="button"
      class="w-full h-14 flex items-center gap-3 px-4 text-left"
      :aria-expanded="open"
      @click="toggle">
      <span v-if="icon" class="grid place-items-center size-9 rounded-[11px] shrink-0"
        :class="iconTone || 'bg-sky-soft text-sky-deep'" aria-hidden="true">
        <component :is="icon" class="size-[18px]" :stroke-width="1.9" />
      </span>
      <div class="flex-1 min-w-0">
        <p class="text-[12.5px] font-bold text-fg-muted uppercase tracking-wide">{{ label }}</p>
        <p v-if="value" class="text-[14.5px] font-bold text-fg truncate mt-0.5">{{ value }}</p>
        <p v-else class="text-[13.5px] text-fg-subtle truncate mt-0.5">Sin definir</p>
      </div>
      <ChevronDown class="size-[18px] text-fg-muted transition-[transform] duration-200" :class="open ? 'rotate-180' : ''" :stroke-width="2.2" aria-hidden="true" />
    </button>
    <Transition name="hibi-acc">
      <div v-show="open" class="px-4 pb-4 pt-1">
        <slot />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.hibi-acc-enter-active, .hibi-acc-leave-active {
  transition: opacity 0.22s var(--ease-soft), transform 0.22s var(--ease-soft);
}
.hibi-acc-enter-from, .hibi-acc-leave-to {
  opacity: 0; transform: translateY(-4px);
}
</style>
