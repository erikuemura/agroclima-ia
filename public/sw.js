const CACHE = 'campoclima-v4'

// Rotas que variam por cookie (perfil demo) ou são streaming — nunca cachear
const UNCACHEABLE_API = ['/api/farm-intelligence', '/api/ai-chat', '/api/ai-alerts']

const STATIC = [
  '/offline',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/manifest.json',
]

// Install: pre-cache critical shell
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting())
  )
})

// Activate: clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

// Clique em notificação → abre/foca a página da ação
self.addEventListener('notificationclick', e => {
  e.notification.close()
  const url = e.notification.data?.url || '/app'
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if ('focus' in client) { client.navigate(url); return client.focus() }
      }
      return clients.openWindow(url)
    })
  )
})

// Web Push (pronto para VAPID — payload JSON {title, body, url})
self.addEventListener('push', e => {
  if (!e.data) return
  let payload = {}
  try { payload = e.data.json() } catch { payload = { title: 'CampoClima', body: e.data.text() } }
  e.waitUntil(
    self.registration.showNotification(payload.title || 'CampoClima', {
      body: payload.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url: payload.url || '/app' },
    })
  )
})

self.addEventListener('fetch', e => {
  const { request } = e
  const url = new URL(request.url)

  // Skip non-GET and cross-origin
  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  // API routes → Network First (fresh data, fallback to cache)
  if (url.pathname.startsWith('/api/')) {
    if (UNCACHEABLE_API.some(p => url.pathname.startsWith(p))) return
    e.respondWith(
      fetch(request)
        .then(res => {
          if (res.ok) {
            const clone = res.clone()
            caches.open(CACHE).then(c => c.put(request, clone))
          }
          return res
        })
        .catch(() => caches.match(request))
    )
    return
  }

  // Static assets (_next/static, icons, fonts) → Cache First
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.match(/\.(png|jpg|svg|woff2?|css|js)$/)
  ) {
    e.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached
        return fetch(request).then(res => {
          if (res.ok) {
            const clone = res.clone()
            caches.open(CACHE).then(c => c.put(request, clone))
          }
          return res
        })
      })
    )
    return
  }

  // HTML pages → Network First, offline fallback
  e.respondWith(
    fetch(request)
      .then(res => {
        if (res.ok) {
          const clone = res.clone()
          caches.open(CACHE).then(c => c.put(request, clone))
        }
        return res
      })
      .catch(() => caches.match(request) || caches.match('/offline'))
  )
})
