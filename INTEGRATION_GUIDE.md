# Ispora Platform - Frontend-Backend Integration Guide

## 🎯 Quick Start

This guide shows how to connect existing frontend components to the new backend API.

## 📦 What You Have

✅ **Complete Backend API** - 41 endpoints ready to use  
✅ **API Client** - `/src/app/lib/api.ts` with typed methods  
✅ **Type Definitions** - `/src/app/types/index.ts` for TypeScript  
✅ **Authentication Context** - Already integrated with backend  

## 🔌 Integration Steps by Feature

### 1. Browse Students Page

**Current State:** Showing mock data  
**Goal:** Load real students from backend

**File:** `/src/app/components/BrowseStudents.tsx`

```typescript
import { useEffect, useState } from 'react';
import api from '../lib/api';
import { User } from '../types';

function BrowseStudents() {
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const response = await api.user.browseStudents();
      setStudents(response.students);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ... rest of component
}
```

### 2. Mentorship Requests

**Current State:** Mock accept/decline actions  
**Goal:** Real request management

**Add to component:**

```typescript
const handleAcceptRequest = async (requestId: string) => {
  try {
    await api.request.accept(requestId);
    // Refresh requests list
    await loadRequests();
    // Show success toast
  } catch (err: any) {
    console.error('Failed to accept request:', err);
  }
};

const handleDeclineRequest = async (requestId: string, reason: string) => {
  try {
    await api.request.decline(requestId, reason);
    // Refresh requests list
    await loadRequests();
    // Show success toast
  } catch (err: any) {
    console.error('Failed to decline request:', err);
  }
};

const loadRequests = async () => {
  try {
    const response = await api.request.getAll('received'); // For mentors
    setRequests(response.requests);
  } catch (err: any) {
    console.error('Failed to load requests:', err);
  }
};
```

### 3. Dashboard Stats

**Current State:** Hardcoded numbers  
**Goal:** Real-time statistics

**Add to MentorDashboard:**

```typescript
import { useEffect, useState } from 'react';
import api from '../lib/api';
import { MentorStats } from '../types';

function MentorDashboard() {
  const [stats, setStats] = useState<MentorStats | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await api.stats.getMentorStats();
      setStats(response.stats);
    } catch (err: any) {
      console.error('Failed to load stats:', err);
    }
  };

  return (
    <div className="stats-grid">
      <StatCard 
        label="Active Mentorships" 
        value={stats?.activeMentorships || 0} 
      />
      <StatCard 
        label="Total Sessions" 
        value={stats?.totalSessions || 0} 
      />
      <StatCard 
        label="Pending Requests" 
        value={stats?.pendingRequests || 0} 
      />
    </div>
  );
}
```

### 4. Opportunities

**Current State:** Mock opportunities  
**Goal:** Real opportunities with filtering

**Update Opportunities component:**

```typescript
import { useEffect, useState } from 'react';
import api from '../lib/api';
import { Opportunity } from '../types';

function Opportunities() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'internships' | 'jobs' | 'scholarships'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadOpportunities();
  }, [activeTab, searchQuery]);

  const loadOpportunities = async () => {
    try {
      const response = await api.opportunity.getAll({
        type: activeTab === 'all' ? undefined : activeTab,
        search: searchQuery || undefined,
      });
      setOpportunities(response.opportunities);
    } catch (err: any) {
      console.error('Failed to load opportunities:', err);
    }
  };

  const handleBookmark = async (opportunityId: string) => {
    try {
      await api.opportunity.bookmark(opportunityId);
      // Refresh list to show updated bookmark state
      await loadOpportunities();
    } catch (err: any) {
      console.error('Failed to bookmark:', err);
    }
  };

  const handleCreateOpportunity = async (data: any) => {
    try {
      await api.opportunity.create(data);
      await loadOpportunities();
      // Close modal, show success
    } catch (err: any) {
      console.error('Failed to create opportunity:', err);
    }
  };

  // ... rest of component
}
```

### 5. Profile Management

**Current State:** Form with no save functionality  
**Goal:** Save profile updates to backend

**Update Profile component:**

```typescript
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';

function Profile() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    company: '',
    jobTitle: '',
    expertise: [],
    // ... other fields
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName || '',
        bio: user.bio || '',
        company: user.company || '',
        // ... populate from user
      });
    }
  }, [user]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.user.updateUser(user!.id, formData);
      // Show success toast
      // Refresh user data in context
    } catch (err: any) {
      console.error('Failed to save profile:', err);
      // Show error toast
    } finally {
      setSaving(false);
    }
  };

  // ... rest of component
}
```

### 6. Settings

**Current State:** Settings UI without save  
**Goal:** Persist settings to backend

**Update Settings component:**

```typescript
import { useState, useEffect } from 'react';
import api from '../lib/api';
import { UserSettings } from '../types';

function Settings() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await api.settings.get();
      setSettings(response.settings);
    } catch (err: any) {
      console.error('Failed to load settings:', err);
    }
  };

  const handleSave = async () => {
    try {
      await api.settings.update(settings);
      setHasChanges(false);
      // Show success toast
    } catch (err: any) {
      console.error('Failed to save settings:', err);
    }
  };

  const updateSetting = (path: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [path]: value
    }));
    setHasChanges(true);
  };

  // ... rest of component
}
```

### 7. Notifications

**Goal:** Real-time notification display

**Create NotificationCenter component:**

```typescript
import { useEffect, useState } from 'react';
import api from '../lib/api';
import { Notification } from '../types';
import { Bell } from 'lucide-react';

function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await api.notification.getAll();
      setNotifications(response.notifications);
      setUnreadCount(response.notifications.filter((n: Notification) => !n.read).length);
    } catch (err: any) {
      console.error('Failed to load notifications:', err);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await api.notification.markAsRead(notificationId);
      await loadNotifications();
    } catch (err: any) {
      console.error('Failed to mark as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.notification.markAllAsRead();
      await loadNotifications();
    } catch (err: any) {
      console.error('Failed to mark all as read:', err);
    }
  };

  return (
    <div className="notification-center">
      <button onClick={() => setIsOpen(!isOpen)} className="notification-bell">
        <Bell />
        {unreadCount > 0 && (
          <span className="badge">{unreadCount}</span>
        )}
      </button>
      
      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead}>Mark all as read</button>
            )}
          </div>
          <div className="notification-list">
            {notifications.map(notification => (
              <div 
                key={notification.id} 
                className={`notification-item ${!notification.read ? 'unread' : ''}`}
                onClick={() => markAsRead(notification.id)}
              >
                <h4>{notification.title}</h4>
                <p>{notification.message}</p>
                <span>{new Date(notification.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

## 🔄 Common Patterns

### Loading States

```typescript
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');
const [data, setData] = useState(null);

useEffect(() => {
  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.someEndpoint();
      setData(response.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  loadData();
}, []);

if (loading) return <Spinner />;
if (error) return <ErrorMessage message={error} />;
```

### Form Submission

```typescript
const [submitting, setSubmitting] = useState(false);
const [formError, setFormError] = useState('');

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  try {
    setSubmitting(true);
    setFormError('');
    
    const response = await api.someEndpoint(formData);
    
    // Success
    onSuccess?.();
    // Show toast notification
    // Reset form or close modal
  } catch (err: any) {
    setFormError(err.message);
  } finally {
    setSubmitting(false);
  }
};
```

### Data Refresh

```typescript
// Manual refresh
const refreshData = async () => {
  await loadData();
};

// Auto-refresh every X seconds
useEffect(() => {
  const interval = setInterval(loadData, 30000); // 30 seconds
  return () => clearInterval(interval);
}, []);

// Refresh on window focus
useEffect(() => {
  const handleFocus = () => loadData();
  window.addEventListener('focus', handleFocus);
  return () => window.removeEventListener('focus', handleFocus);
}, []);
```

## 🎨 UI Feedback

### Success Toast

```typescript
const showSuccessToast = (message: string) => {
  // Use your toast library
  // toast.success(message);
};

// After successful API call
await api.request.accept(requestId);
showSuccessToast('Mentorship request accepted!');
```

### Error Handling

```typescript
const showErrorToast = (message: string) => {
  // Use your toast library
  // toast.error(message);
};

try {
  await api.someEndpoint();
} catch (err: any) {
  showErrorToast(err.message || 'Something went wrong');
}
```

## 🔍 Debugging Tips

### Log API Calls

```typescript
// In api.ts, add logging
async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  console.log(`API Call: ${endpoint}`, options);
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const data = await response.json();
    
    console.log(`API Response: ${endpoint}`, data);
    
    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }
    
    return data;
  } catch (error) {
    console.error(`API Error: ${endpoint}`, error);
    throw error;
  }
}
```

### Check Network Tab

1. Open DevTools → Network tab
2. Filter by "Fetch/XHR"
3. Look for requests to `make-server-b8526fa6`
4. Check request/response payloads

### Verify Authentication

```typescript
// Check if token exists
const token = localStorage.getItem('accessToken');
console.log('Auth token:', token ? 'Present' : 'Missing');

// Test session
const testAuth = async () => {
  try {
    const response = await api.auth.getSession();
    console.log('Session valid:', response.user);
  } catch (err) {
    console.error('Session invalid:', err);
  }
};
```

## 📋 Integration Checklist

### For Each Component:

- [ ] Import API client: `import api from '../lib/api'`
- [ ] Import types: `import { Type } from '../types'`
- [ ] Add loading state: `useState<boolean>(true)`
- [ ] Add error state: `useState<string>('')`
- [ ] Add data state: `useState<Type[]>([])`
- [ ] Create load function with try/catch
- [ ] Call load function in useEffect
- [ ] Handle loading UI
- [ ] Handle error UI
- [ ] Display data
- [ ] Add success/error toasts
- [ ] Test all user flows

## 🚀 Priority Order

Recommended order to integrate backend:

1. **Authentication** ✅ (Already done)
2. **Dashboard Stats** - Shows immediate value
3. **Browse Students/Mentors** - Core discovery feature
4. **Mentorship Requests** - Critical workflow
5. **Notifications** - Important for user engagement
6. **Profile Management** - Allow users to update info
7. **Opportunities** - Full CRUD operations
8. **Settings** - User preferences
9. **Messages** - Enable communication
10. **Sessions** - Complete the mentorship flow

## 📚 Resources

- **API Documentation**: `/API_DOCUMENTATION.md`
- **Backend Summary**: `/BACKEND_SUMMARY.md`
- **API Client**: `/src/app/lib/api.ts`
- **Type Definitions**: `/src/app/types/index.ts`
- **Server Code**: `/supabase/functions/server/index.tsx`

## 🎯 Next Steps

1. Pick a component to integrate
2. Follow the pattern from this guide
3. Test thoroughly
4. Move to next component
5. Repeat until all features are connected

**The backend is ready - now bring it to life in the UI!** 🚀
