<script setup lang="ts">
// Programa notificaciones del navegador para los recordatorios de HOY (solo si
// el usuario dio permiso en Ajustes). A prueba de fallos: cualquier error se ignora.
const { scheduleToday, permission } = useNotifications()
const { reminders } = useReminders()
function reschedule() {
  try { if (permission() === 'granted') scheduleToday(reminders.value as any) } catch { /* ignore */ }
}
onMounted(reschedule)
watch(reminders, reschedule, { deep: true })
</script>

<template>
  <div class="h-dvh w-screen flex flex-col overflow-hidden bg-base text-fg">
    <TheTopNav />
    <main class="relative flex-1 min-h-0 overflow-hidden">
      <slot />
    </main>
    <TheBottomNav />
    <MobileMoreSheet />
    <ClientOnly>
      <MascotFab />
    </ClientOnly>
  </div>
</template>
