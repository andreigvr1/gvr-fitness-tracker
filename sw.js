const CACHE_VERSION = 'gvr-v43';
const BASE = '/gvr-fitness-tracker';
const PRECACHE = [
  BASE + '/',
  BASE + '/index.html',
  BASE + '/data/exercises.json',
  BASE + '/manifest.json',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_VERSION)
      .then(c => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // HTML, JS și CSS: network first, cache fallback (mereu fișiere proaspete când ești online)
  if (e.request.mode === 'navigate' || url.match(/\.(js|css|html)(\?.*)?$/)) {
    e.respondWith(
      fetch(e.request)
        .then(r => {
          caches.open(CACHE_VERSION).then(c => c.put(e.request, r.clone()));
          return r;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Restul (imagini, JSON, manifest): cache first, network fallback
  e.respondWith(
    caches.match(e.request).then(cached => {
      const networkFetch = fetch(e.request).then(r => {
        caches.open(CACHE_VERSION).then(c => c.put(e.request, r.clone()));
        return r;
      });
      return cached || networkFetch;
    })
  );
});
