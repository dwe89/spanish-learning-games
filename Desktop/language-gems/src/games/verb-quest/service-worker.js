// Replace the existing service worker with this simplified version
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
            .catch(() => fetch(event.request))
    );
}); 