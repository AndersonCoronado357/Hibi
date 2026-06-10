/** Saludo según la hora del día, traducido. */
export function useGreeting() {
  const { t } = useI18n()
  const now = useNow({ interval: 60_000 })

  const greeting = computed(() => {
    const h = now.value.getHours()
    if (h < 12) return t('today.greetingMorning')
    if (h < 19) return t('today.greetingAfternoon')
    return t('today.greetingEvening')
  })

  return { greeting, now }
}
