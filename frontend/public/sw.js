/* DAIMUZ — Service Worker para Web Push */
self.addEventListener('push', function (event) {
  let data = {}
  try { data = event.data ? event.data.json() : {} } catch (e) { data = { title: 'DAIMUZ', body: event.data && event.data.text ? event.data.text() : '' } }
  const title = data.title || 'DAIMUZ'
  const options = {
    body: data.body || '',
    icon: '/daimuz-icon.png',
    badge: '/daimuz-icon.png',
    tag: data.tag || 'daimuz',
    data: { url: data.url || '/' },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      for (const c of list) { if ('focus' in c) { c.navigate(url); return c.focus() } }
      if (self.clients.openWindow) return self.clients.openWindow(url)
    })
  )
})
