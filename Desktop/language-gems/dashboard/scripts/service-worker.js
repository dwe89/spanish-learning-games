const CACHE_NAME = 'spanish-learning-v1.0.2';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './styles/main.css',
    './styles/dashboard.css',
    './styles/menu.css',
    './styles/assignments.css',
    './styles/flashcards.css',
    './styles/notes.css',
    './styles/vocabulary.css',
    './styles/achievements.css',
    './styles/leaderboard.css',
    './styles/resources.css',
    './scripts/dashboard-auth.js',
    './scripts/api-service.js',
    './scripts/load-menu.js',
    './scripts/dashboard.js',
    './scripts/flashcards.js',
    './scripts/assignments.js',
    './scripts/vocabulary.js',
    './scripts/games.js',
    './scripts/achievements.js',
    './scripts/notes.js',
    './scripts/leaderboard.js',
    './scripts/resources.js',
    './assets/avatars/default-avatar.png'
];

self.addEventListener('install', (event) => {
    console.log('[ServiceWorker] Installing new version:', CACHE_NAME);
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(ASSETS_TO_CACHE)
                    .catch(error => {
                        console.error('Some assets failed to cache:', error);
                    });
            })
    );
});

self.addEventListener('activate', (event) => {
    console.log('[ServiceWorker] Activate new version:', CACHE_NAME);
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
}); 