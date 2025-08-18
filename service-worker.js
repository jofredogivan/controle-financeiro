// Service Worker simples: cache-first com atualização em segundo plano
const CACHE_NAME = 'financeiro-cache-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
  // Obs.: libs externas via CDN não são colocadas aqui para evitar falha no install.
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((networkRes) => {
          // Atualiza o cache em background
          caches.open(CACHE_NAME).then((cache) => cache.put(req, networkRes.clone()));
          return networkRes;
        })
        .catch(() => cached); // offline => usa cache se existir

      return cached || fetchPromise;
    })
  );
});
