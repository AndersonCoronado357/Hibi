<script setup lang="ts">
// Carita de Hibi que aparece centrada al hover de un botón.
// Requiere que el botón padre tenga clase `group/hibibtn` y `relative`.
// Coloca este componente como ÚLTIMO hijo dentro del botón.
withDefaults(defineProps<{
  /** Variante de color: 'primary' (sky/navy) o 'danger' (pink/granate). */
  variant?: 'primary' | 'danger'
}>(), { variant: 'primary' })
</script>

<template>
  <span
    class="hibi-face pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 group-hover/hibibtn:opacity-100 transition-opacity duration-200 ease-soft"
    aria-hidden="true"
  >
    <svg width="56" height="20" viewBox="0 0 56 20" fill="none">
      <ellipse cx="8" cy="13" rx="4" ry="2.4" :fill="variant === 'danger' ? '#f0a8bc' : 'var(--color-pink)'" opacity="0.75" />
      <ellipse cx="48" cy="13" rx="4" ry="2.4" :fill="variant === 'danger' ? '#f0a8bc' : 'var(--color-pink)'" opacity="0.75" />
      <ellipse class="hibi-eye" cx="20" cy="10" rx="2.6" ry="3.4" :fill="variant === 'danger' ? '#6e2230' : '#1f4660'" />
      <ellipse class="hibi-eye" cx="36" cy="10" rx="2.6" ry="3.4" :fill="variant === 'danger' ? '#6e2230' : '#1f4660'" />
      <ellipse class="hibi-eye-shine" cx="20.7" cy="9" rx="0.8" ry="1" fill="white" opacity="0.9" />
      <ellipse class="hibi-eye-shine" cx="36.7" cy="9" rx="0.8" ry="1" fill="white" opacity="0.9" />
      <path d="M24 13 Q28 16 32 13" :stroke="variant === 'danger' ? '#6e2230' : '#1f4660'" stroke-width="1.6" stroke-linecap="round" fill="none" />
    </svg>
  </span>
</template>

