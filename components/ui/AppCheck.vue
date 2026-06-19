<script setup lang="ts">
// Switch toggle pill: gris cuando off, color sky-deep cuando on, círculo blanco
// que se desliza dentro. NO es un checkbox cuadrado tradicional.
const props = withDefaults(defineProps<{
  modelValue: boolean
  label?: string
  disabled?: boolean
}>(), { disabled: false })
const emit = defineEmits<{ 'update:modelValue': [v: boolean] }>()
function toggle() { if (!props.disabled) emit('update:modelValue', !props.modelValue) }
</script>

<template>
  <button type="button" role="switch" :aria-checked="modelValue" :aria-label="label" :disabled="disabled"
    class="relative inline-flex items-center w-12 h-7 rounded-full transition-[background-color] duration-200 ease-soft disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
    :class="modelValue ? 'bg-sky-deep' : 'bg-muted'"
    @click="toggle">
    <span class="absolute left-0.5 grid place-items-center size-6 rounded-full bg-card shadow-[0_1px_3px_rgba(0,0,0,0.2)] transition-transform duration-200 ease-soft"
      :class="modelValue ? 'translate-x-5' : 'translate-x-0'"></span>
  </button>
</template>
