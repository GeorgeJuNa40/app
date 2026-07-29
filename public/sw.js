// Service worker de Move yA.
// - Habilita "instalar app" (PWA).
// - Prepara las notificaciones push (se activan en el siguiente paso).
// NO cachea la app: siempre se carga la versión más reciente (evita quedarse
// con una versión vieja tras publicar en Vercel).

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

// Passthrough sin caché: deja que el navegador cargue de la red normalmente.
self.addEventListener('fetch', () => {});

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
    icon: '/icon.svg',
    badge: '/icon.svg',
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
