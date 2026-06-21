<script setup lang="ts">
import type { Component } from 'vue'

interface Option {
  value: string | number
  label?: string
  icon?: Component
  ariaLabel?: string
}

const props = withDefaults(defineProps<{
  modelValue: string | number
  options: Option[]
  /** En movil ocupa todo el ancho disponible (botones flex-1). En desktop
   *  vuelve a su tamaño natural. Util cuando va en una barra full-width. */
  block?: boolean
  /** Modo interruptor: CUALQUIER tap (incluso sobre la opción ya activa)
   *  avanza a la siguiente opción. Con 2 opciones, alterna como un switch real. */
  toggle?: boolean
}>(), { block: false, toggle: false })

const emit = defineEmits<{ 'update:modelValue': [value: string | number] }>()

function pick(value: string | number) {
  if (!props.toggle) { emit('update:modelValue', value); return }
  // Switch: avanza a la siguiente opción (cicla), sin importar cuál se tocó.
  const idx = props.options.findIndex(o => o.value === props.modelValue)
  const next = props.options[(idx + 1) % props.options.length]
  emit('update:modelValue', next.value)
}
</script>

<template>
  <div
    role="tablist"
    class="items-center gap-1 p-1 rounded-full bg-muted"
    :class="block ? 'flex flex-1 min-w-0 md:inline-flex md:flex-none' : 'inline-flex'"
  >
    <button
      v-for="opt in options"
      :key="String(opt.value)"
      type="button"
      role="tab"
      :aria-selected="opt.value === modelValue"
      :aria-label="opt.ariaLabel ?? opt.label"
      class="inline-flex items-center justify-center gap-1.5 h-9 rounded-full text-sm font-semibold transition-[background-color,color] duration-200 ease-soft"
      :class="[
        opt.value === modelValue ? 'bg-card text-sky-deep' : 'text-fg-muted hover:text-fg',
        // Con icono, en movil el label se oculta → boton compacto (sin px de sobra).
        opt.icon ? 'px-2 md:px-3.5' : 'px-3.5',
        block ? 'flex-1 min-w-0 md:flex-none' : '',
      ]"
      @click="pick(opt.value)"
    >
      <component :is="opt.icon" v-if="opt.icon" class="size-4" :stroke-width="1.9" />
      <span v-if="opt.label" :class="opt.icon ? 'hidden md:inline' : ''">{{ opt.label }}</span>
    </button>
  </div>
</template>
