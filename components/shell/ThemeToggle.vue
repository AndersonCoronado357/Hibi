<script setup lang="ts">
import { Sun, Moon } from '@lucide/vue'

const colorMode = useColorMode()
const { t } = useI18n()

// Solo claro/oscuro (sin 'auto'): no seguimos el modo del dispositivo.
const options = computed(() => [
  { value: 'light', icon: Sun, ariaLabel: t('theme.light') },
  { value: 'dark', icon: Moon, ariaLabel: t('theme.dark') },
])

const model = computed({
  get: () => colorMode.preference,
  set: (v: string | number) => {
    colorMode.preference = String(v)
  },
})
</script>

<template>
  <AppSegmented v-model="model" :options="options" toggle />
</template>
