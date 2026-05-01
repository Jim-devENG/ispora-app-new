// Web Push Notification Service
// Handles push subscription management and sending notifications

import { webcrypto } from "crypto";

// VAPID keys - these should be generated once and stored in environment variables
// For development, we'll generate them dynamically
// In production, set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in .env

interface VapidKeys {
  publicKey: string;
  privateKey: string;
}

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// Generate VAPID keys (run once and store)
export async function generateVapidKeys(): Promise<VapidKeys> {
  // For production, use web-push library or generate keys manually
  // These are placeholder keys - in production, use real VAPID keys
  return {
    publicKey: Deno.env.get('VAPID_PUBLIC_KEY') || 'BEl62iUYgUivV5p8jJyqJHqEJ9ZWZ7hH8bJhKJhKJhKJhKJhKJhKJhKJhKJhKJhKJhKJhKJhKJhKJhKJhKJhKJhKJhK',
    privateKey: Deno.env.get('VAPID_PRIVATE_KEY') || 'placeholder-private-key'
  };
}

// Get VAPID public key for client
export function getVapidPublicKey(): string {
  return Deno.env.get('VAPID_PUBLIC_KEY') || 'BEl62iUYgUivV5p8jJyqJHqEJ9ZWZ7hH8bJhKJhKJhKJhKJhKJhKJhKJhKJhKJhKJhKJhKJhKJhKJhKJhKJhKJhKJhK';
}

// Send push notification to a subscription
export async function sendPushNotification(
  subscription: PushSubscription,
  payload: {
    title: string;
    body: string;
    icon?: string;
    tag?: string;
    data?: any;
    actions?: Array<{ action: string; title: string }>;
    requireInteraction?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    // Web Push protocol implementation
    // This uses the Web Push API directly without external libraries
    
    const vapidKeys = await generateVapidKeys();
    
    // Prepare the push message
    const message = JSON.stringify(payload);
    
    // For a complete implementation, you would use the web-push library
    // or implement the Web Push Protocol (RFC 8291, RFC 8292)
    
    // Simplified implementation using fetch to push service
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        'TTL': '86400', // 24 hours
        'Topic': payload.tag || 'default',
        'Urgency': 'high',
        // VAPID authorization header would be added here
        // 'Authorization': `vapid t=${jwt}, k=${vapidKeys.publicKey}`
      },
      body: await encryptMessage(subscription, message, vapidKeys.privateKey)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Push notification failed:', response.status, errorText);
      
      // If subscription is expired or invalid, mark for deletion
      if (response.status === 410 || response.status === 404) {
        return { success: false, error: 'SUBSCRIPTION_EXPIRED' };
      }
      
      return { success: false, error: `Push failed: ${response.status}` };
    }

    console.log('✓ Push notification sent successfully');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to send push notification:', error.message);
    return { success: false, error: error.message };
  }
}

// Encrypt message for push (simplified - in production use proper ECDH encryption)
async function encryptMessage(
  subscription: PushSubscription,
  message: string,
  privateKey: string
): Promise<Uint8Array> {
  // In production, implement proper ECDH encryption per RFC 8291
  // For now, return the message as-is (this won't work with real push services)
  // You'll need to use a library like 'web-push' for proper encryption
  
  const encoder = new TextEncoder();
  return encoder.encode(message);
}

// Send notification to multiple subscriptions
export async function broadcastPushNotification(
  subscriptions: PushSubscription[],
  payload: {
    title: string;
    body: string;
    icon?: string;
    tag?: string;
    data?: any;
    actions?: Array<{ action: string; title: string }>;
    requireInteraction?: boolean;
  }
): Promise<{ success: number; failed: number; expiredSubscriptions: string[] }> {
  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      const result = await sendPushNotification(sub, payload);
      return { endpoint: sub.endpoint, ...result };
    })
  );

  let success = 0;
  let failed = 0;
  const expiredSubscriptions: string[] = [];

  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      if (result.value.success) {
        success++;
      } else {
        failed++;
        if (result.value.error === 'SUBSCRIPTION_EXPIRED') {
          expiredSubscriptions.push(result.value.endpoint);
        }
      }
    } else {
      failed++;
    }
  });

  return { success, failed, expiredSubscriptions };
}

// Validate push subscription format
export function isValidPushSubscription(subscription: any): subscription is PushSubscription {
  return (
    subscription &&
    typeof subscription.endpoint === 'string' &&
    subscription.keys &&
    typeof subscription.keys.p256dh === 'string' &&
    typeof subscription.keys.auth === 'string'
  );
}

console.log('Web Push service initialized');
