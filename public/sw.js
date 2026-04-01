// DT's Terminal — Minimal Service Worker
// Purpose: Enable PWA installability only.
// NO aggressive caching — live stock data must always come from network.

const CACHE_NAME = 'dt-terminal-v1'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  // Clean up old caches if cache name changes
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url)

  // NEVER intercept API calls — live data must always go to network
  if (url.pathname.startsWith('/api/')) return

  // NEVER intercept non-GET requests
  if (e.request.method !== 'GET') return

  // For everything else — network first, no caching
  // (handler must exist for PWA installability, but we don't cache)
  e.respondWith(fetch(e.request))
})
