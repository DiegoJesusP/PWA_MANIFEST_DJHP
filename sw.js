const STATIC_CACHE = 'static-cache-v2';
const DYNAMIC_CACHE = 'dynamic-cache-v1';

const APP_SHELL = [
  '/',
  '/index.html',
  '/calendar.html',
  '/form.html',
  '/offline.html',
  '/main.js',
  '/estilos.css'
];

self.addEventListener('install', event => {
  console.log('[SW] Instalando...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      console.log('[SW] Cacheando App Shell');
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('[SW] Activando...');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== STATIC_CACHE && key !== DYNAMIC_CACHE) {
            console.log('[SW] Borrando caché viejo:', key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.url.startsWith('chrome-extension')) return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        console.log(`[Cache] Sirviendo desde caché: ${event.request.url}`);
        return cachedResponse;
      }

      return fetch(event.request)
        .then(networkResponse => {
          if (
            event.request.url.includes('fullcalendar') ||
            event.request.url.includes('select2')
          ) {
            caches.open(DYNAMIC_CACHE).then(cache => {
              cache.put(event.request, networkResponse.clone());
              console.log(`[SW] Guardado dinámicamente: ${event.request.url}`);
            });
          }

          return networkResponse;
        })
        .catch(err => {
          console.warn('[SW] Sin conexión o recurso no disponible:', event.request.url);

          if (event.request.destination === 'document') {
            return caches.match('/offline.html');
          }

          return new Response('', {
            status: 503,
            statusText: 'Sin conexión y sin caché disponible.'
          });
        });
    })
  );
});
