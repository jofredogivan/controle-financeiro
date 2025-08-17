const CACHE_NAME = 'controle-financeiro-cache-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/manifest.json'
];

self.addEventListener('install', (event) => {
    // Ação de instalação: abre o cache e adiciona todos os arquivos
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Cache aberto com sucesso. Adicionando arquivos...');
                return cache.addAll(urlsToCache);
            })
            .catch((error) => {
                console.error('Falha ao abrir cache ou adicionar arquivos:', error);
            })
    );
});

self.addEventListener('fetch', (event) => {
    // Ação de busca: intercepta requisições de rede
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Retorna o arquivo do cache se ele for encontrado
                if (response) {
                    return response;
                }

                // Caso contrário, busca na rede
                return fetch(event.request);
            })
            .catch((error) => {
                console.error('Falha na busca:', error);
            })
    );
});

self.addEventListener('activate', (event) => {
    // Ação de ativação: limpa caches antigos
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});