// Web Push Notification Service
// Handles push subscription management and sending notifications using web-push library

// @ts-expect-error Deno npm import
import webPush from "npm:web-push@3.6.7";

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  actions?: Array<{ action: string; title: string; icon?: string }>;
  requireInteraction?: boolean;
  vibrate?: number[];
}

// Initialize web-push with VAPID details
const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

if (vapidPublicKey && vapidPrivateKey) {
  webPush.setVapidDetails(
    'mailto:support@ispora.com',
    vapidPublicKey,
    vapidPrivateKey
  );
  console.log('✓ Web Push initialized with VAPID keys');
} else {
  console.warn('⚠️ VAPID keys not configured - push notifications will not work');
}

// Get VAPID public key for client
export function getVapidPublicKey(): string {
  return vapidPublicKey || '';
}

// Send push notification to a subscription
export async function sendPushNotification(
  subscription: PushSubscription,
  payload: PushPayload
): Promise<{ success: boolean; error?: string }> {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.error('VAPID keys not configured');
    return { success: false, error: 'VAPID keys not configured' };
  }

  try {
    const message = JSON.stringify(payload);
    
    await webPush.sendNotification({
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      }
    }, message);

    console.log('✓ Push notification sent successfully');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to send push notification:', error.message);
    
    // Check if subscription is expired
    if (error.statusCode === 410 || error.statusCode === 404) {
      return { success: false, error: 'SUBSCRIPTION_EXPIRED' };
    }
    
    return { success: false, error: error.message };
  }
}

// Send notification to multiple subscriptions
export async function broadcastPushNotification(
  subscriptions: PushSubscription[],
  payload: PushPayload
): Promise<{ success: number; failed: number; expiredSubscriptions: string[] }> {
  console.log(`Broadcasting push notification to ${subscriptions.length} subscriptions`);
  
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

  console.log(`Broadcast complete: ${success} success, ${failed} failed, ${expiredSubscriptions.length} expired`);
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
