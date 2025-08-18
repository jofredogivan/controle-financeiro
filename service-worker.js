self.addEventListener('install', e=>{
    e.waitUntil(
        caches.open('app-cache-v1').then(cache=>{
            return cache.addAll([
                '.',
                'index.html',
                'style.css',
                'script.js',
                'icon-192.png',
                'icon-512.png',
                'https://cdn.jsdelivr.net/npm/chart.js'
            ]);
        })
    );
});

self.addEventListener('fetch', e=>{
    e.respondWith(
        caches.match(e.request).then(response=>{
            return response || fetch(e.request);
        })
    );
});
