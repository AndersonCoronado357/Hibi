<script setup lang="ts">
import { Check } from '@lucide/vue'

interface SwatchOption { value: string; label: string; swatch: string; ring?: string }
defineProps<{
  modelValue: string
  options: SwatchOption[]
  size?: 'sm' | 'md' | 'lg'
  label?: string
}>()
defineEmits<{ (e: 'update:modelValue', v: string): void }>()
</script>

<template>
  <div class="flex flex-col gap-2">
    <label v-if="label" class="text-[12.5px] font-bold text-fg-muted px-1">{{ label }}</label>
    <div class="flex items-center gap-3 flex-wrap">
      <button v-for="o in options" :key="o.value" type="button"
        :aria-label="o.label" :title="o.label"
        class="hibi-swatch"
        :class="[
          o.swatch,
          modelValue === o.value ? 'is-active' : '',
          size === 'lg' ? 'size-12' : size === 'sm' ? 'size-8' : 'size-10',
        ]"
        @click="$emit('update:modelValue', o.value)">
        <Check v-if="modelValue === o.value" class="size-[18px] text-white drop-shadow-sm" :stroke-width="3" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>
