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
// Primary: por defecto texto SIEMPRE visible (en claro azul oscuro sobre cielo,
// en oscuro override CSS aclara el texto). El hover INVIERTE: fondo profundo +
// texto blanco. Nunca queda sin contraste.
const variantClass: Record<Variant, string> = {
  primary: 'bg-sky text-[#1f4660] hover:bg-sky-deep hover:text-white',
  secondary: 'bg-muted text-fg hover:bg-sky-soft hover:text-sky-deep',
  ghost: 'bg-transparent text-fg-muted hover:bg-muted hover:text-fg',
  danger: 'bg-danger text-[#6e2230] hover:brightness-[0.92]',
}

const sizeClass: Record<Size, string> = {
  sm: 'h-9 px-4 text-sm gap-1.5 rounded-full',
  md: 'h-11 px-5 text-[15px] gap-2 rounded-full',
  lg: 'h-13 px-7 text-[16px] gap-2 rounded-full',
}
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    class="hibi-btn group/hibibtn relative inline-flex items-center justify-center font-semibold select-none transition-[background-color,filter,opacity,transform] duration-200 ease-soft disabled:opacity-50 disabled:pointer-events-none active:scale-[0.97]"
    :class="[variantClass[variant], sizeClass[size], block ? 'w-full' : '']"
  >
    <!-- Contenido normal del botón. En hover de primary/danger se desvanece
         para dejar ver los ojitos. -->
    <span
      class="inline-flex items-center justify-center gap-2 leading-none transition-opacity duration-200"
      :class="(variant === 'primary' || variant === 'danger') ? 'group-hover/hibibtn:opacity-0' : ''"
    >
      <Loader2 v-if="loading" class="size-[18px] animate-spin" :stroke-width="2.2" />
      <slot v-else name="icon" />
      <!-- Slot del label SIN wrapper: si el contenido va `hidden` (p.ej. en
           movil), al ser display:none deja de contar como item flex y el
           gap NO reserva espacio → el icono queda centrado. -->
      <slot />
    </span>

    <!-- CARITA DE HIBI: aparece centrada al hover (solo primary/danger).
         Ojos + mejillas pink + sonrisa. Si te quedas mucho rato hover,
         los ojos parpadean cada ~3s. -->
    <span
      v-if="variant === 'primary' || variant === 'danger'"
      class="hibi-face pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 group-hover/hibibtn:opacity-100 transition-opacity duration-200 ease-soft"
      aria-hidden="true"
    >
      <svg width="56" height="20" viewBox="0 0 56 20" fill="none">
        <!-- Mejillas pink (atrás) -->
        <ellipse cx="8" cy="13" rx="4" ry="2.4" :fill="variant === 'danger' ? '#f0a8bc' : 'var(--color-pink)'" opacity="0.75" />
        <ellipse cx="48" cy="13" rx="4" ry="2.4" :fill="variant === 'danger' ? '#f0a8bc' : 'var(--color-pink)'" opacity="0.75" />
        <!-- Ojos (con clase para parpadeo) -->
        <ellipse class="hibi-eye" cx="20" cy="10" rx="2.6" ry="3.4" :fill="variant === 'danger' ? '#6e2230' : '#1f4660'" />
        <ellipse class="hibi-eye" cx="36" cy="10" rx="2.6" ry="3.4" :fill="variant === 'danger' ? '#6e2230' : '#1f4660'" />
        <!-- Brillos blancos en los ojos -->
        <ellipse class="hibi-eye-shine" cx="20.7" cy="9" rx="0.8" ry="1" fill="white" opacity="0.9" />
        <ellipse class="hibi-eye-shine" cx="36.7" cy="9" rx="0.8" ry="1" fill="white" opacity="0.9" />
        <!-- Sonrisa -->
        <path d="M24 13 Q28 16 32 13" :stroke="variant === 'danger' ? '#6e2230' : '#1f4660'" stroke-width="1.6" stroke-linecap="round" fill="none" />
      </svg>
    </span>
  </button>
</template>

<style scoped>
.h-13 {
  height: 3.25rem;
}
/* La animación de parpadeo está en main.css globalmente para que funcione
   también en botones raw (AppCreateView, etc.) usando la clase group/hibibtn. */
</style>
