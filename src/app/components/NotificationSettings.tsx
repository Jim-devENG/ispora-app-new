// Notification Settings Component
// Allows users to enable/disable push notifications

import { useState } from 'react';
import { Bell, BellOff, Smartphone, X, Loader2 } from 'lucide-react';
import { usePushNotifications, showLocalNotification } from '../hooks/usePushNotifications';
import { toast } from 'sonner';

export function NotificationSettings() {
  const {
    isSupported,
    isSubscribed,
    permissionStatus,
    subscribe,
    unsubscribe,
    isLoading,
    error
  } = usePushNotifications();

  const [preferences, setPreferences] = useState({
    sessionReminders: true,
    newRequests: true,
    newMessages: true,
    sessionUpdates: true,
  });

  const handleSubscribe = async () => {
    const success = await subscribe();
    if (success) {
      toast.success('Push notifications enabled!', {
        description: 'You will now receive notifications even when the app is closed.'
      });
      // Test notification
      setTimeout(() => {
        showLocalNotification('Notifications Enabled! 🎉', {
          body: 'You will now receive push notifications from Ispora.',
          icon: '/favicon.svg',
        });
      }, 1000);
    } else {
      toast.error('Failed to enable push notifications', {
        description: error || 'Please try again or check your browser settings.'
      });
    }
  };

  const handleUnsubscribe = async () => {
    const success = await unsubscribe();
    if (success) {
      toast.success('Push notifications disabled');
    } else {
      toast.error('Failed to disable push notifications');
    }
  };

  const handlePreferenceChange = (key: keyof typeof preferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    // TODO: Save preferences to backend
  };

  if (!isSupported) {
    return (
      <div className="p-6 bg-white rounded-xl border border-[var(--ispora-border)]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <BellOff className="w-5 h-5 text-gray-400" />
          </div>
          <div>
            <h3 className="font-syne font-bold text-[var(--ispora-text)]">Push Notifications</h3>
            <p className="text-xs text-[var(--ispora-text3)]">Not supported in this browser</p>
          </div>
        </div>
        <p className="text-sm text-[var(--ispora-text2)]">
          Your browser doesn't support push notifications. Try using a modern browser like Chrome, Firefox, or Safari.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-xl border border-[var(--ispora-border)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isSubscribed ? 'bg-[var(--ispora-brand-light)]' : 'bg-gray-100'
          }`}>
            <Bell className={`w-5 h-5 ${
              isSubscribed ? 'text-[var(--ispora-brand)]' : 'text-gray-400'
            }`} />
          </div>
          <div>
            <h3 className="font-syne font-bold text-[var(--ispora-text)]">Push Notifications</h3>
            <p className="text-xs text-[var(--ispora-text3)]">
              {isSubscribed ? 'Enabled' : 'Disabled'}
            </p>
          </div>
        </div>
        
        {/* Toggle Button */}
        <button
          onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
          disabled={isLoading || permissionStatus === 'denied'}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
            isSubscribed
              ? 'bg-red-50 text-red-600 hover:bg-red-100'
              : 'bg-[var(--ispora-brand)] text-white hover:bg-[#1a35f8]'
          } ${(isLoading || permissionStatus === 'denied') ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isSubscribed ? (
            <>
              <BellOff className="w-4 h-4" />
              Disable
            </>
          ) : (
            <>
              <Bell className="w-4 h-4" />
              Enable
            </>
          )}
        </button>
      </div>

      {/* Permission Denied Warning */}
      {permissionStatus === 'denied' && (
        <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex items-start gap-3">
            <X className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Notifications Blocked</p>
              <p className="text-xs text-amber-700 mt-1">
                Push notifications are blocked in your browser settings. To enable them, go to your browser's site settings and allow notifications.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Notification Preferences */}
      {isSubscribed && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-[var(--ispora-text)] mb-3">Notification Preferences</h4>
          
          <label className="flex items-center justify-between p-3 bg-[var(--ispora-bg)] rounded-lg cursor-pointer hover:bg-[var(--ispora-brand-light)] transition-colors">
            <div className="flex items-center gap-3">
              <Smartphone className="w-4 h-4 text-[var(--ispora-text2)]" />
              <span className="text-sm text-[var(--ispora-text)]">Session Reminders</span>
            </div>
            <input
              type="checkbox"
              checked={preferences.sessionReminders}
              onChange={() => handlePreferenceChange('sessionReminders')}
              className="w-4 h-4 accent-[var(--ispora-brand)]"
            />
          </label>

          <label className="flex items-center justify-between p-3 bg-[var(--ispora-bg)] rounded-lg cursor-pointer hover:bg-[var(--ispora-brand-light)] transition-colors">
            <div className="flex items-center gap-3">
              <Smartphone className="w-4 h-4 text-[var(--ispora-text2)]" />
              <span className="text-sm text-[var(--ispora-text)]">New Mentorship Requests</span>
            </div>
            <input
              type="checkbox"
              checked={preferences.newRequests}
              onChange={() => handlePreferenceChange('newRequests')}
              className="w-4 h-4 accent-[var(--ispora-brand)]"
            />
          </label>

          <label className="flex items-center justify-between p-3 bg-[var(--ispora-bg)] rounded-lg cursor-pointer hover:bg-[var(--ispora-brand-light)] transition-colors">
            <div className="flex items-center gap-3">
              <Smartphone className="w-4 h-4 text-[var(--ispora-text2)]" />
              <span className="text-sm text-[var(--ispora-text)]">New Messages</span>
            </div>
            <input
              type="checkbox"
              checked={preferences.newMessages}
              onChange={() => handlePreferenceChange('newMessages')}
              className="w-4 h-4 accent-[var(--ispora-brand)]"
            />
          </label>

          <label className="flex items-center justify-between p-3 bg-[var(--ispora-bg)] rounded-lg cursor-pointer hover:bg-[var(--ispora-brand-light)] transition-colors">
            <div className="flex items-center gap-3">
              <Smartphone className="w-4 h-4 text-[var(--ispora-text2)]" />
              <span className="text-sm text-[var(--ispora-text)]">Session Updates</span>
            </div>
            <input
              type="checkbox"
              checked={preferences.sessionUpdates}
              onChange={() => handlePreferenceChange('sessionUpdates')}
              className="w-4 h-4 accent-[var(--ispora-brand)]"
            />
          </label>
        </div>
      )}

      {/* Test Notification Button */}
      {isSubscribed && (
        <button
          onClick={() => showLocalNotification('Test Notification 🔔', {
            body: 'This is a test notification from Ispora!',
            icon: '/favicon.svg',
          })}
          className="mt-4 w-full py-2 text-sm text-[var(--ispora-brand)] font-semibold hover:bg-[var(--ispora-brand-light)] rounded-lg transition-colors"
        >
          Send Test Notification
        </button>
      )}
    </div>
  );
}

export default NotificationSettings;
