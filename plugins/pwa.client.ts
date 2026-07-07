// Registra el service worker para que Hibi sea instalable como PWA.
export default defineNuxtPlugin(() => {
  if (!import.meta.client || !('serviceWorker' in navigator)) return
  // ?v= salta la caché vieja de Cloudflare (que guardaba /sw.js 4h sin
  // propagar cambios). Súbelo cuando cambie sw.js para forzar actualización.
  const register = () => navigator.serviceWorker.register('/sw.js?v=2').catch(() => { /* ignore */ })
  if (document.readyState === 'complete') register()
  else window.addEventListener('load', register, { once: true })
})
