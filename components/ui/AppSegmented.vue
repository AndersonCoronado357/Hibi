<script setup lang="ts">
import type { Component } from 'vue'

interface Option {
  value: string | number
  label?: string
  icon?: Component
  ariaLabel?: string
}

defineProps<{
  modelValue: string | number
  options: Option[]
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string | number] }>()
</script>

<template>
  <div role="tablist" class="inline-flex items-center gap-1 p-1 rounded-full bg-muted">
    <button
      v-for="opt in options"
      :key="String(opt.value)"
      type="button"
      role="tab"
      :aria-selected="opt.value === modelValue"
      :aria-label="opt.ariaLabel ?? opt.label"
      class="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-full text-sm font-semibold transition-[background-color,color] duration-200 ease-soft"
      :class="
        opt.value === modelValue
          ? 'bg-card text-sky-deep'
          : 'text-fg-muted hover:text-fg'
      "
      @click="emit('update:modelValue', opt.value)"
    >
      <component :is="opt.icon" v-if="opt.icon" class="size-4" :stroke-width="1.9" />
      <span v-if="opt.label">{{ opt.label }}</span>
    </button>
  </div>
</template>
