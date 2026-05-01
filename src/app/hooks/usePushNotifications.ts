// Push Notification Hook
// Handles service worker registration, push subscription, and notification permissions

import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

interface UsePushNotificationsReturn {
  isSupported: boolean;
  isSubscribed: boolean;
  permissionStatus: NotificationPermission | 'unsupported';
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  requestPermission: () => Promise<NotificationPermission>;
  isLoading: boolean;
  error: string | null;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'unsupported'>('default');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [vapidKey, setVapidKey] = useState<string | null>(null);

  // Check if push notifications are supported
  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);
    
    if (supported) {
      // Check current permission status
      setPermissionStatus(Notification.permission);
      
      // Register service worker and fetch VAPID key
      registerServiceWorker();
      fetchVapidKey();
    }
  }, []);

  // Fetch VAPID public key from server
  const fetchVapidKey = async () => {
    try {
      const response: any = await api.notification.getVapidKey();
      if (response.success && response.publicKey) {
        setVapidKey(response.publicKey);
        console.log('VAPID public key fetched from server');
      }
    } catch (err: any) {
      console.error('Failed to fetch VAPID key:', err);
    }
  };

  // Register service worker
  const registerServiceWorker = async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', reg);
      setRegistration(reg);
      
      // Check if already subscribed
      const subscription = await reg.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (err: any) {
      console.error('Service Worker registration failed:', err);
      setError('Failed to register service worker');
    }
  };

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      return permission;
    } catch (err: any) {
      console.error('Failed to request permission:', err);
      setError('Failed to request notification permission');
      return 'denied';
    }
  }, [isSupported]);

  // Convert base64 VAPID key to Uint8Array
  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !registration) {
      setError('Push notifications not supported');
      return false;
    }

    if (!vapidKey) {
      setError('VAPID key not loaded. Please refresh and try again.');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Request permission first
      const permission = await requestPermission();
      if (permission !== 'granted') {
        setError('Notification permission denied');
        setIsLoading(false);
        return false;
      }

      // Create push subscription
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey).buffer as ArrayBuffer
      });

      console.log('Push subscription created:', subscription);

      // Send subscription to server
      const response: any = await api.notification.subscribeToPush(subscription.toJSON() as any);

      if (!response.success) {
        throw new Error('Failed to save subscription on server');
      }

      setIsSubscribed(true);
      setIsLoading(false);
      return true;
    } catch (err: any) {
      console.error('Failed to subscribe:', err);
      setError(err.message || 'Failed to subscribe to push notifications');
      setIsLoading(false);
      return false;
    }
  }, [isSupported, registration, requestPermission, vapidKey]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !registration) {
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        // Remove from server first
        await api.notification.unsubscribeFromPush(subscription.endpoint);

        // Unsubscribe from push manager
        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
      setIsLoading(false);
      return true;
    } catch (err: any) {
      console.error('Failed to unsubscribe:', err);
      setError(err.message || 'Failed to unsubscribe from push notifications');
      setIsLoading(false);
      return false;
    }
  }, [isSupported, registration]);

  return {
    isSupported,
    isSubscribed,
    permissionStatus,
    subscribe,
    unsubscribe,
    requestPermission,
    isLoading,
    error
  };
}

// Utility function to show a local notification (for testing)
export async function showLocalNotification(title: string, options?: NotificationOptions): Promise<void> {
  if ('Notification' in window && Notification.permission === 'granted') {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      ...options
    });
  }
}
