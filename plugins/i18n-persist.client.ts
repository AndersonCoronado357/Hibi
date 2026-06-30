// Recuerda el idioma elegido entre recargas (cookie propia). Por defecto
// español; si el usuario cambia a inglés se guarda y se reaplica al recargar.
export default defineNuxtPlugin((nuxtApp) => {
  const i18n = nuxtApp.$i18n as any
  const cookie = useCookie<string>('hibi_lang', { maxAge: 60 * 60 * 24 * 365, sameSite: 'lax', path: '/' })

  const saved = cookie.value
  if (saved && (saved === 'es' || saved === 'en') && i18n?.locale?.value !== saved) {
    i18n.setLocale(saved)
  }

  watch(() => i18n?.locale?.value, (v: string) => {
    if (v) cookie.value = v
  })
})
