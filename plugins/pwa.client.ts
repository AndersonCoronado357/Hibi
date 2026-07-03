// Registra el service worker para que Hibi sea instalable como PWA.
export default defineNuxtPlugin(() => {
  if (!import.meta.client || !('serviceWorker' in navigator)) return
  const register = () => navigator.serviceWorker.register('/sw.js').catch(() => { /* ignore */ })
  if (document.readyState === 'complete') register()
  else window.addEventListener('load', register, { once: true })
})
