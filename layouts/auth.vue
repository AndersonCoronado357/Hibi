<script setup lang="ts">
// Login: SIEMPRE modo claro, sin importar la preferencia guardada.
// 1) Fuerza data-theme="light" en <html> al entrar y restaura al salir.
// 2) El wrapper también lleva data-theme="light" como fallback (CSS añade
//    [data-theme="light"] al :root para que las variables se hereden bien).
let prevHtmlTheme: string | null = null

onMounted(() => {
  if (!import.meta.client) return
  prevHtmlTheme = document.documentElement.getAttribute('data-theme')
  document.documentElement.setAttribute('data-theme', 'light')
})

onBeforeUnmount(() => {
  if (!import.meta.client) return
  if (prevHtmlTheme) document.documentElement.setAttribute('data-theme', prevHtmlTheme)
  else document.documentElement.removeAttribute('data-theme')
})
</script>

<template>
  <div data-theme="light" class="h-dvh w-screen overflow-hidden bg-base text-fg">
    <slot />
  </div>
</template>
