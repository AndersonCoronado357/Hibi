<script setup lang="ts">
// Reemplazo de cuadrados/círculos con icono: una nubecita Hibi como
// fondo + un icono Lucide (u otro) centrado encima. Misma proporción que
// HibiCloud (140:95). Útil como "feature pill" cute en cards, filas, checks.
import type { Component } from 'vue'

const props = withDefaults(defineProps<{
  /** Ancho de la nube en px. La altura sale auto (size * 95/140). */
  size?: number
  /** Componente icono a centrar (Lucide u otro). Opcional. */
  icon?: Component
  /** Tamaño del icono en px. */
  iconSize?: number
  /** Color de la NUBE. Acepta `text-X` o `bg-X` (se autoconvierte) o un hex. */
  cloudColor?: string
  /** Color del ICONO. Acepta `text-X` o un hex. */
  iconColor?: string
  /** Stroke-width del icono Lucide. */
  iconStroke?: number
  /** Mostrar carita cinnamoroll en la nube SIEMPRE. */
  face?: boolean
  /** Mostrar carita Hibi al hover (mejillas + ojos + sonrisa). El icono
   *  se desvanece. Útil en botones principales como interacción cute. */
  hoverFace?: boolean
}>(), {
  size: 44,
  iconSize: 18,
  cloudColor: 'text-sky-soft',
  iconColor: 'text-sky-deep',
  iconStroke: 2,
  face: false,
  hoverFace: false,
})

// Convierte automáticamente 'bg-X' a 'text-X' (HibiCloud usa currentColor).
// Si el color empieza con '#' o 'rgb', lo pasamos por estilo en vez de clase.
function isHex(c: string) { return c.startsWith('#') || c.startsWith('rgb') }
const cloudCls = computed(() => {
  const c = props.cloudColor
  if (isHex(c)) return ''
  return c.startsWith('bg-') ? c.replace(/^bg-/, 'text-') : c
})
const cloudStyle = computed(() => isHex(props.cloudColor) ? { color: props.cloudColor } : undefined)
const iconCls = computed(() => {
  const c = props.iconColor
  if (isHex(c)) return ''
  return c.startsWith('bg-') ? c.replace(/^bg-/, 'text-') : c
})
const iconStyle = computed(() => {
  const base: Record<string, string> = { width: props.iconSize + 'px', height: props.iconSize + 'px' }
  if (isHex(props.iconColor)) base.color = props.iconColor
  return base
})
</script>

<template>
  <span
    class="hibi-cloud-icon group/cloudicon relative inline-block shrink-0"
    :style="{ width: size + 'px', height: Math.round(size * 95 / 140) + 'px' }"
  >
    <HibiCloud :size="size" :face="face" :class="cloudCls" :style="cloudStyle" class="absolute inset-0" />
    <component
      v-if="icon"
      :is="icon"
      :class="[iconCls, hoverFace ? 'transition-opacity duration-150 group-hover/cloudicon:opacity-0' : '']"
      :stroke-width="iconStroke"
      class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
      :style="iconStyle"
    />
    <!-- Cara cute Hibi (ojitos + mejillas + sonrisa) que aparece al hover -->
    <svg
      v-if="hoverFace"
      viewBox="0 0 140 95"
      :width="size"
      :height="Math.round(size * 95 / 140)"
      class="absolute inset-0 opacity-0 transition-opacity duration-150 group-hover/cloudicon:opacity-100 pointer-events-none"
      aria-hidden="true"
    >
      <ellipse cx="60" cy="52" rx="3" ry="3.7" fill="var(--color-sky-deep)" />
      <ellipse cx="80" cy="52" rx="3" ry="3.7" fill="var(--color-sky-deep)" />
      <ellipse cx="51" cy="59" rx="4.2" ry="2.8" fill="var(--color-pink)" opacity="0.85" />
      <ellipse cx="89" cy="59" rx="4.2" ry="2.8" fill="var(--color-pink)" opacity="0.85" />
      <path d="M64 57 Q70 62 76 57" stroke="var(--color-sky-deep)" stroke-width="1.9" stroke-linecap="round" fill="none" />
    </svg>
  </span>
</template>
