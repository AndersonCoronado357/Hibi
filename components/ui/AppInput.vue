<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue?: string | number
    label?: string
    type?: string
    error?: string
    hint?: string
    disabled?: boolean
    autocomplete?: string
  }>(),
  { type: 'text' },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const id = useId()
const focused = ref(false)
const hasValue = computed(() => props.modelValue !== '' && props.modelValue != null)
const floated = computed(() => focused.value || hasValue.value)

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
}
</script>

<template>
  <div class="w-full">
    <div class="relative">
      <input
        :id="id"
        :type="type"
        :value="modelValue"
        :disabled="disabled"
        :autocomplete="autocomplete"
        :aria-invalid="!!error"
        :aria-describedby="error ? `${id}-err` : hint ? `${id}-hint` : undefined"
        class="w-full h-12 rounded-[14px] px-4 text-[15px] text-fg outline-none transition-[background-color] duration-200 ease-soft disabled:opacity-50"
        :class="[
          error ? 'bg-pink-soft' : 'bg-muted focus:bg-inset',
          label ? 'pt-4 pb-1' : '',
        ]"
        @input="onInput"
        @focus="focused = true"
        @blur="focused = false"
      />
      <label
        v-if="label"
        :for="id"
        class="pointer-events-none absolute left-4 transition-[top,font-size,transform] duration-200 ease-soft text-fg-subtle"
        :class="floated ? 'top-1.5 text-[11px]' : 'top-1/2 -translate-y-1/2 text-[15px]'"
        >{{ label }}</label
      >
    </div>
    <p v-if="error" :id="`${id}-err`" class="mt-1.5 px-1.5 text-[12px] text-pink-deep">{{ error }}</p>
    <p v-else-if="hint" :id="`${id}-hint`" class="mt-1.5 px-1.5 text-[12px] text-fg-subtle">
      {{ hint }}
    </p>
  </div>
</template>
