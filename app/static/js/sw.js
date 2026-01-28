self.addEventListener("install", (event)=>{
    event.waitUntil(
        caches.open('tasktracker-cache').then(cache => {
            return cache.addAll([
                '/',
                '/index.html',
                '/base.html',
                '/login.html',
                '/register.html',
                '/login.html',
                '/static/js/admin.js',
                '/static/js/app.js',
                '/static/admin.css',
                '/static/desktop.css',
                '/static/style.css',
                '/static/icons/icon_T.png'
            ])
        })
    );
});

self.addEventListener('fetch', (event)=>{
    event.respondWith(
        caches.match(event.request).then(response => {
            response || fetch(event.request);
        })
    );
});