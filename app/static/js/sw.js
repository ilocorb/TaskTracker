self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open('tasktracker-cache').then(cache => {
            return cache.addAll([
                '/static/style.css',
                '/static/desktop.css',
                '/static/admin.css',
                '/static/js/app.js',
                '/static/js/admin.js',
                '/static/json/manifest.json',
                '/static/icons/icon-192.png',
                '/static/icons/icon-512.png',
                '/static/icons/favicon.png'
            ])
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});