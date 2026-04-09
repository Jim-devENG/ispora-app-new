# 🚀 Quick Integration Guide: Add Impact Dashboard to Existing Dashboards

## For Student Dashboard

### Step 1: Update Type Definition
Find this line in `/src/app/components/StudentDashboard.tsx`:
```typescript
type StudentPage = 'dashboard' | 'find-mentor' | 'messages' | 'my-progress' | 'opportunities' | 'community' | 'profile' | 'settings';
```

Change to:
```typescript
type StudentPage = 'dashboard' | 'find-mentor' | 'messages' | 'my-progress' | 'opportunities' | 'community' | 'profile' | 'settings' | 'impact';
```

### Step 2: Import Component
Add this import at the top with other imports:
```typescript
import { ImpactDashboard } from './ImpactDashboard';
```

### Step 3: Add Navigation Button
Find the sidebar navigation section and add:
```tsx
<button
  onClick={() => setCurrentPage('impact')}
  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
    currentPage === 'impact'
      ? 'bg-[var(--ispora-brand)] text-white'
      : 'text-[var(--ispora-text2)] hover:bg-[var(--ispora-card-hover)]'
  }`}
>
  <Award className="w-5 h-5" strokeWidth={2} />
  <span className="font-medium text-[15px]">My Journey</span>
</button>
```

Don't forget to import Award icon:
```typescript
import { Award, /* other icons */ } from 'lucide-react';
```

### Step 4: Add Page Render
Find the section where pages are rendered (look for `{currentPage === 'dashboard' && ...}`), and add:
```tsx
{currentPage === 'impact' && (
  <ImpactDashboard userRole="student" />
)}
```

### Step 5: Update Mobile Navigation
In the mobile bottom nav (if applicable), add:
```tsx
<button
  onClick={() => setCurrentPage('impact')}
  className={`flex flex-col items-center gap-1 ${
    currentPage === 'impact' ? 'text-[var(--ispora-brand)]' : 'text-gray-600'
  }`}
>
  <Award className="w-6 h-6" />
  <span className="text-xs">Journey</span>
</button>
```

---

## For Mentor Dashboard

### Step 1: Identify Navigation System
The Mentor Dashboard might use a different pattern. Look for:
- `activeView` state
- Tab components
- Page routing

### Step 2: Import Component
```typescript
import { ImpactDashboard } from './ImpactDashboard';
```

### Step 3: Add Navigation (Example for similar structure)
```tsx
<button
  onClick={() => setActiveView('impact')}
  className={/* your existing button styles */}
>
  <Award className="w-5 h-5" />
  <span>My Impact</span>
</button>
```

### Step 4: Add Render Section
```tsx
{activeView === 'impact' && (
  <ImpactDashboard userRole="diaspora" />
)}
```

---

## Testing Checklist

After integration, test:

1. ✅ Navigation button appears
2. ✅ Clicking shows Impact Dashboard
3. ✅ Stats load correctly
4. ✅ Badges display (if any earned)
5. ✅ "Check for Badges" button works
6. ✅ Share functionality works
7. ✅ Mobile responsive layout
8. ✅ Loading states appear
9. ✅ Error handling works

---

## Troubleshooting

**Issue: "Failed to load impact data"**
- Check that user is signed in
- Verify `ispora_access_token` in localStorage
- Check browser console for API errors

**Issue: No badges showing**
- Badges only appear after completing activities
- Click "Check for Badges" to award eligible badges
- Some badges require manual milestone tracking (Phase 2 enhancement)

**Issue: Stats show 0**
- This is normal for new users
- Stats update as sessions are completed
- Monthly impact updates at month start

---

## Alternative: Add as Tab Inside Existing Page

If you want to add Impact as a tab within "My Progress" instead of a separate page:

```tsx
// In MyProgress.tsx or similar
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ImpactDashboard } from './ImpactDashboard';

<Tabs defaultValue="progress">
  <TabsList>
    <TabsTrigger value="progress">Progress</TabsTrigger>
    <TabsTrigger value="impact">Impact & Badges</TabsTrigger>
  </TabsList>
  
  <TabsContent value="progress">
    {/* Existing progress content */}
  </TabsContent>
  
  <TabsContent value="impact">
    <ImpactDashboard userRole={user.role} />
  </TabsContent>
</Tabs>
```

---

## Quick Win: Add Badge Count to Header

Show badge count in the app header for motivation:

```tsx
const [badgeCount, setBadgeCount] = useState(0);

useEffect(() => {
  const fetchBadges = async () => {
    const accessToken = localStorage.getItem('ispora_access_token');
    if (!accessToken) return;
    
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-b8526fa6/users/badges`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      setBadgeCount(data.totalBadges || 0);
    }
  };
  
  fetchBadges();
}, []);

// In your header:
<div className="flex items-center gap-2 text-sm">
  <Award className="w-4 h-4 text-yellow-500" />
  <span>{badgeCount} Badges</span>
</div>
```

---

## Next Steps

1. Integrate into dashboards (this guide)
2. Test with real data
3. Encourage users to share their impact
4. Monitor viral metrics
5. Build Phase 3 & 4 features (see IMPACT_ACHIEVEMENTS_SYSTEM.md)

**Need help?** Check the full documentation in `/IMPACT_ACHIEVEMENTS_SYSTEM.md`
