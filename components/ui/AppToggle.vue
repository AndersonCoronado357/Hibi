<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: boolean
  label?: string
  disabled?: boolean
}>(), { disabled: false })
const emit = defineEmits<{ 'update:modelValue': [v: boolean] }>()
function toggle() { if (!props.disabled) emit('update:modelValue', !props.modelValue) }
</script>

<template>
  <button type="button" role="switch" :aria-checked="modelValue" :aria-label="label"
    :disabled="disabled"
    class="hibi-toggle relative inline-flex items-center w-12 h-7 rounded-full transition-[background-color] duration-200 ease-soft disabled:opacity-50 disabled:cursor-not-allowed"
    :class="modelValue ? 'bg-sky-deep' : 'bg-muted'"
    @click="toggle">
    <span class="absolute left-0.5 grid place-items-center size-6 rounded-full bg-card shadow-[0_1px_3px_rgba(0,0,0,0.18)] transition-transform duration-200 ease-soft"
      :class="modelValue ? 'translate-x-5' : 'translate-x-0'"></span>
  </button>
</template>
