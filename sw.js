// sw.js
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
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cacheResponse => {
      if (cacheResponse) {
        console.log(`[Cache] Usando: ${event.request.url}`);
        return cacheResponse;
      }

      return fetch(event.request)
        .then(networkResponse => {
          if (
            event.request.url.includes('fullcalendar') ||
            event.request.url.includes('select2')
          ) {
            caches.open(DYNAMIC_CACHE).then(cache => {
              cache.put(event.request, networkResponse.clone());
              console.log(`[SW] Guardado en caché dinámico: ${event.request.url}`);
            });
          }
          return networkResponse;
        })
        .catch(err => {
          console.warn('[SW] Sin conexión. Mostrando fallback.');
          if (event.request.destination === 'document') {
            return caches.match('/offline.html');
          }
        });
    })
  );
});
