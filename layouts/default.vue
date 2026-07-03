<script setup lang="ts">
// Programa notificaciones del navegador para los recordatorios de HOY (solo si
// el usuario dio permiso en Ajustes). A prueba de fallos: cualquier error se ignora.
const { scheduleToday, scheduleDailySummary, permission } = useNotifications()
const { reminders } = useReminders()
const { summary } = useInicioSummary()
const { t } = useI18n()
function summaryText() {
  const s = summary.value
  if (!s) return ''
  return t('settings.notifSummaryBody', { tasks: s.todayTasks ?? 0, events: s.todayEvents ?? 0, reminders: s.reminders ?? 0 })
}
function reschedule() {
  try {
    if (permission() !== 'granted') return
    scheduleToday(reminders.value as any)     // tipo "Recordatorios"
    scheduleDailySummary(summaryText())        // tipo "Resumen diario"
  } catch { /* ignore */ }
}
onMounted(reschedule)
watch([reminders, summary], reschedule, { deep: true })
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
