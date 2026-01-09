const CACHE_NAME = 'craftsoft-offline-v1';
const OFFLINE_URL = '/offline.html';

const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/offline.html',
    '/favicon.svg',
    '/assets/css/master.css?v=2.0',
    'https://fonts.googleapis.com/css2?family=Italianno&family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css'
];

// Install Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Caching critical assets');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('[SW] Clearing old cache');
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch Interceptor
self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') return;

    event.respondWith(
        fetch(event.request)
            .catch(() => {
                return caches.match(event.request).then((response) => {
                    if (response) {
                        return response;
                    }

                    // Specific handling for navigation requests (HTML pages)
                    if (event.request.mode === 'navigate') {
                        return caches.match(OFFLINE_URL);
                    }

                    return null;
                });
            })
    );
});
