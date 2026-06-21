<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    name?: string
    src?: string
    size?: number
  }>(),
  { size: 36 },
)

const palette = ['#A8D8F0', '#F5C6D0', '#DCD0F0', '#C8EBD8', '#FFD8C2', '#FFE9A8']

const initials = computed(() => {
  const n = (props.name ?? '').trim()
  if (!n) return '?'
  const parts = n.split(/\s+/)
  return (parts[0]![0]! + (parts[1]?.[0] ?? '')).toUpperCase()
})

const bg = computed(() => {
  const n = props.name ?? ''
  let h = 0
  for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) >>> 0
  return palette[h % palette.length]
})
</script>

<template>
  <span
    class="inline-flex items-center justify-center rounded-full overflow-hidden font-medium text-fg select-none shrink-0"
    :style="{
      width: `${size}px`,
      height: `${size}px`,
      backgroundColor: src ? undefined : bg,
      fontSize: `${Math.round(size * 0.4)}px`,
    }"
    :title="name"
  >
    <img v-if="src" :src="src" :alt="name" class="w-full h-full object-cover" />
    <template v-else>{{ initials }}</template>
  </span>
</template>
