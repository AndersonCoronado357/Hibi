/** Saludo según la hora del día, traducido. */
export function useGreeting() {
  const { t } = useI18n()
  const now = useNow({ interval: 60_000 })

  const greeting = computed(() => {
    // now = hora LOCAL del dispositivo → toma automáticamente la zona horaria
    // (ubicación) del usuario, sin depender de la hora del servidor.
    const h = now.value.getHours()
    if (h >= 5 && h < 12) return t('today.greetingMorning')
    if (h >= 12 && h < 19) return t('today.greetingAfternoon')
    return t('today.greetingEvening') // tarde-noche y madrugada
  })

  return { greeting, now }
}
