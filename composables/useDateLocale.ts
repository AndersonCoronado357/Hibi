// Locale de date-fns que sigue al idioma de la app (i18n). Úsalo en cada
// `format(..., { locale: dateLocale.value })` para que las fechas también
// cambien a inglés cuando el usuario cambia el idioma.
import { es, enUS } from 'date-fns/locale'

export function useDateLocale() {
  const { locale } = useI18n()
  return computed(() => (locale.value === 'en' ? enUS : es))
}
