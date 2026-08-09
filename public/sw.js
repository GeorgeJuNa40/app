// Service worker de Move yA.
// - Habilita "instalar app" (PWA) y notificaciones push.
// - AUTO-ACTUALIZA: en cada despliegue toma la versión fresca. En las
//   navegaciones va "a la red primero" para nunca quedarse con un index.html
//   viejo, y al activarse borra cualquier caché anterior. Así se evita quedar
//   pegado en una versión pasada (el problema de la caché de Chrome/Android).

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Borra cachés viejas de versiones anteriores del SW.
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

// Navegaciones (cargar la app): RED PRIMERO → siempre baja el index.html más
// reciente y, por tanto, los archivos nuevos. Si no hay red, cae a la caché.
// El resto de peticiones: passthrough (el navegador usa su caché normal; los
// archivos con hash cambian de nombre en cada despliegue, así que es seguro).
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(() => caches.match(req)));
  }
});

// --- Notificaciones push ---
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { body: event.data ? event.data.text() : '' };
  }
  const title = data.title || 'Move yA';
  const options = {
    body: data.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: data.url || '/' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      // Si la app ya está abierta, la llevamos a la sección de la notificación
      // (antes solo la enfocaba y se quedaba en el inicio).
      for (const client of list) {
        if ('focus' in client) {
          if ('navigate' in client) {
            return client
              .navigate(url)
              .then((c) => (c || client).focus())
              .catch(() => client.focus());
          }
          return client.focus();
        }
      }
      // Si no hay ninguna ventana abierta, abrimos una en la sección correcta.
      if (self.clients.openWindow) return self.clients.openWindow(url);
    }),
  );
});
