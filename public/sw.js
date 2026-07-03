// Service worker mínimo para que Hibi sea instalable (PWA). Passthrough puro:
// NO interceptamos las respuestas (no llamamos a respondWith), así el navegador
// maneja la red con normalidad y evitamos el error "Failed to convert value to
// 'Response'" que aparecía cuando fetch fallaba y no había nada en caché.
// La instalabilidad solo exige que exista un listener de 'fetch'. Offline = futuro.
self.addEventListener('install', () => { self.skipWaiting() })
self.addEventListener('activate', (event) => { event.waitUntil(self.clients.claim()) })
self.addEventListener('fetch', () => { /* passthrough: sin respondWith */ })
