// Ispora Service Worker
// Handles push notifications and PWA offline caching.

const CACHE_NAME = 'ispora-app-v1';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
];

// VAPID public key for push subscription renewal.
const VAPID_PUBLIC_KEY =
  'BEl62iUYgUivV5p8jJyqJHqEJ9ZWZ7hH8bJhKJhKJhKJhKJhKJhKJhKJhKJhKJhKJhKJhKJhKJhKJhKJhKJhKJhKJhK';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  // SPA navigation: network-first, fallback to cached shell.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', responseClone));
          return response;
        })
        .catch(() => caches.match('/index.html')),
    );
    return;
  }

  // Static assets: cache-first with network fallback.
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
        return networkResponse;
      });
    }),
  );
});

// Handle push events.
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received:', event);

  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { title: 'Ispora Notification', body: event.data.text() };
    }
  }

  const title = data.title || 'Ispora';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/favicon.png',
    badge: '/favicon.png',
    tag: data.tag || 'default',
    data: data.data || {},
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [],
    vibrate: [200, 100, 200],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification click.
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event);

  event.notification.close();

  const data = event.notification.data;
  let urlToOpen = '/';

  if (data?.type === 'mentorship_request' && data?.requestId) {
    urlToOpen = '/dashboard?tab=requests';
  } else if (data?.type === 'mentorship_accepted') {
    urlToOpen = '/dashboard?tab=mentorships';
  } else if (data?.type === 'session_scheduled' || data?.type === 'session_cancelled') {
    urlToOpen = '/dashboard?tab=sessions';
  } else if (data?.type === 'new_message' && data?.mentorshipId) {
    urlToOpen = `/messages?mentorship=${data.mentorshipId}`;
  } else if (data?.url) {
    urlToOpen = data.url;
  }

  if (event.action) {
    if (event.action === 'view' && data?.id) {
      urlToOpen = data.url || urlToOpen;
    } else if (event.action === 'dismiss') {
      return;
    }
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('ispora') && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    }),
  );
});

self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] Notification closed:', event);
});

self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[Service Worker] Push subscription changed:', event);

  event.waitUntil(
    self.registration.pushManager
      .subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
      .then((subscription) => {
        return fetch('/make-server-b8526fa6/push/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(subscription),
        });
      }),
  );
});

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

console.log('[Service Worker] Ispora service worker loaded');
