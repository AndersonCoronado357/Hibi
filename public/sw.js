// Service worker mínimo para que Hibi sea instalable (PWA). Passthrough puro:
// NO interceptamos las respuestas (no llamamos a respondWith), así el navegador
// maneja la red con normalidad y evitamos el error "Failed to convert value to
// 'Response'" que aparecía cuando fetch fallaba y no había nada en caché.
// La instalabilidad solo exige que exista un listener de 'fetch'. Offline = futuro.
self.addEventListener('install', () => { self.skipWaiting() })
self.addEventListener('activate', (event) => { event.waitUntil(self.clients.claim()) })
self.addEventListener('fetch', () => { /* passthrough: sin respondWith */ })

// Web Push real: el navegador despierta este worker aunque la app esté
// cerrada. El payload lo manda el servidor como JSON { title, body }.
// IMPORTANTE: `icon`/`badge` son OBLIGATORIOS en la práctica — en Android un
// push del navegador SIN icono se descarta en silencio (uno llega, el otro no).
// `tag` agrupa/reemplaza en vez de acumular. `renotify` vuelve a avisar.
self.addEventListener('push', (event) => {
  let data = { title: 'Hibi', body: '' }
  try { if (event.data) data = { ...data, ...event.data.json() } } catch { /* ignore */ }
  event.waitUntil(self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/icon-512-v3.png',
    badge: '/icon-512-v3.png',
    tag: 'hibi',
    renotify: true,
  }))
})

// Tocar la notificación enfoca una pestaña de Hibi ya abierta, o abre una nueva.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) { if ('focus' in client) return client.focus() }
      if (self.clients.openWindow) return self.clients.openWindow('/')
    }),
  )
})
