self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open('tasktracker-cache').then(cache => {
            return cache.addAll([
                '/',
                '/index.html',
                '/base.html',
                '/login.html',
                '/register.html',
                '/users.html',
                '/static/js/admin.js',
                '/static/js/app.js',
                '/static/admin.css',
                '/static/desktop.css',
                '/static/style.css',
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
            response || fetch(event.request);
        })
    );
});