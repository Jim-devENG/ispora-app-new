// Ispora Push Notification Service Worker
// Handles push events and notification interactions

// VAPID public key will be injected from environment
const VAPID_PUBLIC_KEY = 'BEl62iUYgUivV5p8jJyqJHqEJ9ZWZ7hH8bJhKJhKJhKJhKJhKJhKJhKJhKJhKJhKJhKJhKJhKJhKJhKJhKJhKJhKJhK';

// Handle push events
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received:', event);
  
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Ispora Notification', body: event.data.text() };
    }
  }

  const title = data.title || 'Ispora';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: data.tag || 'default',
    data: data.data || {},
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [],
    vibrate: [200, 100, 200],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event);
  
  event.notification.close();

  const data = event.notification.data;
  let urlToOpen = '/';

  // Determine URL based on notification type
  if (data?.type === 'mentorship_request' && data?.requestId) {
    urlToOpen = `/dashboard?tab=requests`;
  } else if (data?.type === 'mentorship_accepted') {
    urlToOpen = `/dashboard?tab=mentorships`;
  } else if (data?.type === 'session_scheduled' && data?.sessionId) {
    urlToOpen = `/dashboard?tab=sessions`;
  } else if (data?.type === 'session_cancelled') {
    urlToOpen = `/dashboard?tab=sessions`;
  } else if (data?.type === 'new_message' && data?.mentorshipId) {
    urlToOpen = `/messages?mentorship=${data.mentorshipId}`;
  } else if (data?.url) {
    urlToOpen = data.url;
  }

  // Handle action button clicks
  if (event.action) {
    if (event.action === 'view' && data?.id) {
      urlToOpen = data.url || urlToOpen;
    } else if (event.action === 'dismiss') {
      return;
    }
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If a window is already open, focus it
        for (const client of clientList) {
          if (client.url.includes('ispora') && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // Otherwise, open a new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] Notification closed:', event);
  // Could send analytics here
});

// Handle push subscription change
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[Service Worker] Push subscription changed:', event);
  
  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    }).then((subscription) => {
      // Send new subscription to server
      return fetch('/make-server-b8526fa6/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription)
      });
    })
  );
});

// Helper function to convert base64 to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

console.log('[Service Worker] Ispora push notification service worker loaded');
