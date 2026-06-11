const CACHE_VERSION = 'gvr-v1';
const BASE = '/gvr-fitness-tracker';
const CACHE_FILES = [
  BASE + '/',
  BASE + '/index.html',
  BASE + '/css/main.css',
  BASE + '/js/app.js',
  BASE + '/js/storage.js',
  BASE + '/js/generator.js',
  BASE + '/js/onboarding.js',
  BASE + '/data/exercises.json',
  BASE + '/manifest.json',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_VERSION)
      .then(c => c.addAll(CACHE_FILES))
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
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});

self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
