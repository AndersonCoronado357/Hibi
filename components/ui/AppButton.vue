<script setup lang="ts">
import { Loader2 } from '@lucide/vue'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

withDefaults(
  defineProps<{
    variant?: Variant
    size?: Size
    type?: 'button' | 'submit' | 'reset'
    loading?: boolean
    disabled?: boolean
    block?: boolean
  }>(),
  {
    variant: 'primary',
    size: 'md',
    type: 'button',
    loading: false,
    disabled: false,
    block: false,
  },
)

// Plano: relleno sólido, sin borde ni sombra. El texto sobre pastel es
// de contraste fijo (no usa text-fg porque el fondo es constante).
const variantClass: Record<Variant, string> = {
  primary: 'bg-sky text-[#1f4660] hover:bg-sky-deep hover:text-white',
  secondary: 'bg-muted text-fg hover:bg-sky-soft hover:text-sky-deep',
  ghost: 'bg-transparent text-fg-muted hover:bg-muted hover:text-fg',
  danger: 'bg-danger text-[#6e2230] hover:brightness-[0.92]',
}

const sizeClass: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-sm gap-1.5 rounded-[12px]',
  md: 'h-11 px-5 text-[15px] gap-2 rounded-[14px]',
  lg: 'h-13 px-6 text-[16px] gap-2 rounded-[16px]',
}
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    class="hibi-btn inline-flex items-center justify-center font-semibold select-none transition-[background-color,filter,opacity] duration-200 ease-soft disabled:opacity-50 disabled:pointer-events-none"
    :class="[variantClass[variant], sizeClass[size], block ? 'w-full' : '']"
  >
    <Loader2 v-if="loading" class="size-[18px] animate-spin" :stroke-width="2.2" />
    <slot v-else name="icon" />
    <span v-if="$slots.default" class="leading-none"><slot /></span>
  </button>
</template>

<style scoped>
.h-13 {
  height: 3.25rem;
}
</style>
