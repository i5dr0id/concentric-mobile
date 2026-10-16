// Offline support. The app's own files come from the network when it's there,
// so updates show up on the next launch, and from the cache when it isn't.
// Google Fonts files never change, so they're served from the cache first.

const VERSION = 'concentric-mobile-v1'

const FILES = [
  './',
  'index.html',
  'panel.html',
  'clock.html',
  'horizon.html',
  'css/base.css',
  'css/index.css',
  'css/panel.css',
  'css/clock.css',
  'css/horizon.css',
  'js/concentric.js',
  'js/panel.js',
  'js/clock.js',
  'js/horizon.js',
  'panel.webmanifest',
  'clock.webmanifest',
  'horizon.webmanifest',
  'icons/icon.svg',
  'icons/icon-180.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(FILES)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com'
  if (url.origin !== location.origin && !isFont) return

  event.respondWith(isFont ? cacheFirst(request) : networkFirst(request))
})

async function networkFirst(request) {
  try {
    const response = await fetch(request)
    if (response.ok) keep(request, response.clone())
    return response
  } catch {
    const cached = await caches.match(request, { ignoreSearch: true })
    if (cached) return cached
    throw new Error(`Offline and not cached: ${request.url}`)
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok || response.type === 'opaque') keep(request, response.clone())
  return response
}

async function keep(request, response) {
  const cache = await caches.open(VERSION)
  await cache.put(request, response)
}
