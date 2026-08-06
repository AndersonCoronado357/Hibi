<script setup lang="ts">
// Programa notificaciones del navegador para los recordatorios de HOY (solo si
// el usuario dio permiso en Ajustes). A prueba de fallos: cualquier error se ignora.
const { scheduleToday, scheduleDailySummary, permission, hasPushSubscription } = useNotifications()
const { reminders } = useReminders()
const { summary } = useInicioSummary()
const { t } = useI18n()
function summaryText() {
  const s = summary.value
  if (!s) return ''
  return t('settings.notifSummaryBody', { tasks: s.todayTasks ?? 0, events: s.todayEvents ?? 0, reminders: s.reminders ?? 0 })
}
async function reschedule() {
  try {
    if (permission() !== 'granted') return
    // Si hay push real, el servidor manda los avisos → NO agendar locales
    // (si no, llegan dos veces: push al estar cerrada + local al abrir).
    if (await hasPushSubscription()) return
    scheduleToday(reminders.value as any)     // respaldo sin push: tipo "Recordatorios"
    scheduleDailySummary(summaryText())        // respaldo sin push: tipo "Resumen diario"
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
