const CACHE = 'saras-site-shell-v2';
const SHELL = ['/', '/offline.html', '/manifest.webmanifest', '/assets/site.css', '/assets/extra.css', '/assets/pwa.css', '/assets/theme.js', '/assets/site.js', '/assets/pwa.js', '/assets/logo.svg', '/assets/logo-mark.svg', '/assets/apple-touch-icon.png', '/assets/pwa-192.png', '/assets/pwa-512.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('saras-site-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/downloads/') || /\.(exe|msi|zip|bin)$/i.test(url.pathname)) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(response => {
      if (response.ok) caches.open(CACHE).then(cache => cache.put(request, response.clone()));
      return response;
    }).catch(async () => (await caches.match(request, {ignoreSearch:true})) || (await caches.match('/offline.html'))));
    return;
  }
  if (url.pathname.startsWith('/api/')) return;
  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
    if (response.ok && response.type === 'basic') caches.open(CACHE).then(cache => cache.put(request, response.clone()));
    return response;
  })));
});
