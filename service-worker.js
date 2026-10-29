const CACHE_NAME = "map-music-v2";
const FILES_TO_CACHE = [
    "./",
    "./index.html",
    "./manifest.json",
    "./icon-192.png",
    "./icon-512.png"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(FILES_TO_CACHE))
    );
    self.skipWaiting();
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys()
            .then(keys => {
                return Promise.all(
                    keys
                        .filter(key => key !== CACHE_NAME)
                        .map(key => caches.delete(key))
                );
            })
    );
    self.clients.claim();
});

self.addEventListener("fetch", event => {
    // Não coloca os dados da API no cache — sempre busca atualizado
    if (event.request.url.includes("/api/") || event.request.url.includes("supabase")) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(resp => {
                return resp || fetch(event.request);
            })
    );
});
