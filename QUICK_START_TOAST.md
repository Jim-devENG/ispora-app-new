# 🚀 Quick Start: Profile Completion Toast

## ✅ What You Got

A **smart toast notification** that appears in the bottom-right corner of the student dashboard, encouraging profile completion for better mentor matches.

---

## 🎬 How It Works

### Visual Flow:

```
Student Logs In
      ↓
Loads Dashboard
      ↓
⏱️ Wait 3.5 seconds...
      ↓
┌──────────────────────────────────┐
│  🎯 Unlock Better Matches!       │
│  ────────────────────────────    │
│  Profile Progress: 35% ▓▓▓▓░░░░  │
│                                  │
│  Quick Wins:                     │
│  🎯 Add your bio                 │
│  🎯 Add career interests         │
│                                  │
│  [    Later    ] [✨ Complete ]  │
│                                  │
│  🌱 Getting started · 65% to go  │
└──────────────────────────────────┘
      ↓
User chooses:
  • Later → Snoozes based on completion %
  • Complete → Goes to profile page
```

---

## 🎯 Three Reminder Modes

### Mode 1: Critical (0-30% complete)
```
Status: 🌱 Just getting started
Frequency: Every login (max 3 times)
Then: 24-hour cooldown
```

**Example:**
- Login 1 → Toast shows → Click "Later"
- Login 2 → Toast shows → Click "Later"
- Login 3 → Toast shows → Click "Later"
- Login 4+ → 24-hour snooze activated

---

### Mode 2: Progress (30-70% complete)
```
Status: 🚀 You're making progress!
Frequency: Every 3 days
No limit on snoozes
```

**Example:**
- Day 1 → Toast shows → Click "Later"
- Day 2-3 → No toast (snoozed)
- Day 4 → Toast shows again

---

### Mode 3: Complete (70%+ complete)
```
Status: ✨ Almost there!
Frequency: NEVER SHOWS ✅
Toast is hidden permanently
```

---

## 🧪 Testing Right Now

### Method 1: Fresh Test
```javascript
// Open browser console on dashboard
localStorage.removeItem('profileCompletionToast');
location.reload();
// Wait 3.5 seconds → Toast appears!
```

### Method 2: Force Show (Bypass Snooze)
```javascript
// Open browser console
localStorage.setItem('profileCompletionToast', JSON.stringify({
  lastDismissed: 0,
  snoozeCount: 0,
  completion: 30
}));
location.reload();
// Wait 3.5 seconds → Toast appears!
```

### Method 3: Test 70% Threshold
```javascript
// Make sure profile is 70%+ complete
// Toast should NEVER appear
// Complete: Bio, Skills, Career Interests, University, Major, Location
```

---

## 📊 What Counts as "Complete"?

| Complete This | Get Points | Running Total |
|---------------|------------|---------------|
| Bio           | +20%       | 20%          |
| Skills        | +15%       | 35%          |
| Career Int.   | +15%       | 50%          |
| University    | +10%       | 60%          |
| Major         | +10%       | 70% ✅       |

**70% = Toast stops showing!**

---

## 🎨 Customization Guide

### Want to change the delay? (Currently 3.5s)
**File:** `/src/app/components/ProfileCompletionToast.tsx`
**Line:** 33
```typescript
setTimeout(() => {
  setIsVisible(true);
}, 3500); // Change this number (milliseconds)
```

### Want to change the 70% threshold?
**File:** `/src/app/components/ProfileCompletionToast.tsx`
**Line:** 84
```typescript
if (completion >= 70) { // Change 70 to your desired %
  return false;
}
```

### Want to change snooze durations?
**File:** `/src/app/components/ProfileCompletionToast.tsx`
**Lines:** 98-105
```typescript
if (completion < 30) {
  if (snoozeCount < 3) {
    snoozeDuration = 0; // Every login
  } else {
    snoozeDuration = 24 * 60 * 60 * 1000; // 24 hours
  }
} else if (completion < 70) {
  snoozeDuration = 3 * 24 * 60 * 60 * 1000; // 3 days
}
```

---

## 🔍 Troubleshooting

### Toast not appearing?
1. ✅ Check if profile is 70%+ complete (won't show)
2. ✅ Check localStorage: Open Console → Type `localStorage.getItem('profileCompletionToast')`
3. ✅ Clear snooze: `localStorage.removeItem('profileCompletionToast')`
4. ✅ Reload page and wait 3.5 seconds

### Toast appearing too often?
- Snooze logic might not be working
- Check browser console for errors
- Verify localStorage is enabled

### Want to disable completely?
**Option 1:** Comment out in StudentDashboard.tsx
```typescript
// {currentPage === 'dashboard' && (
//   <ProfileCompletionToast 
//     onNavigateToProfile={() => setCurrentPage('profile')} 
//   />
// )}
```

**Option 2:** Set threshold to 0%
```typescript
if (completion >= 0) { // Will never show
  return false;
}
```

---

## 💡 Pro Tips

### Tip 1: Test Different Profiles
Create multiple test accounts with different completion levels:
- Account A: 15% (critical mode)
- Account B: 50% (progress mode)
- Account C: 80% (no toast)

### Tip 2: Monitor User Behavior
Add console logs to track:
```typescript
console.log('Toast dismissed:', {
  completion: profileCompletion,
  action: type, // 'snooze' or 'complete'
  timestamp: Date.now()
});
```

### Tip 3: Analytics Integration
Track in backend:
- How many students see the toast
- How many click "Complete Profile"
- Profile completion rate before/after toast

---

## 📱 Mobile Behavior

Currently optimized for desktop. On mobile:
- Toast appears in **bottom-right** corner
- Width: **340px** (may overflow on very small screens)

**Optional Enhancement:**
```typescript
// Add responsive width
<div className="fixed bottom-6 right-6 z-50 w-[340px] md:w-[340px] sm:w-[90vw]">
```

---

## 🎁 What's Different from Before?

### Old Approach (ProfileImprovementBanner):
- ❌ Large banner in dashboard
- ❌ Always visible (annoying)
- ❌ Takes up valuable space
- ❌ Banner blindness

### New Approach (ProfileCompletionToast):
- ✅ Small toast (bottom-right)
- ✅ Appears after 3.5s (natural)
- ✅ Smart snooze logic
- ✅ Respects user choice
- ✅ More effective engagement

---

## 🚀 One-Minute Setup Test

```bash
# 1. Open Ispora student dashboard
# 2. Open browser console (F12)
# 3. Clear any existing snooze data
localStorage.removeItem('profileCompletionToast');

# 4. Reload page
location.reload();

# 5. Wait 3.5 seconds
# 6. Toast slides up from bottom-right! 🎉
```

---

## 📞 Quick Reference

| Action | Command |
|--------|---------|
| **Clear snooze** | `localStorage.removeItem('profileCompletionToast')` |
| **Check snooze status** | `localStorage.getItem('profileCompletionToast')` |
| **Force show** | Set `lastDismissed: 0` in localStorage |
| **Hide forever** | Complete profile to 70%+ |

---

## ✨ Success Metrics

Track these to measure impact:

1. **Profile Completion Rate**
   - Before: X% students with 70%+ complete
   - After: Y% students with 70%+ complete
   - Goal: +15% improvement

2. **Engagement Rate**
   - How many click "Complete Profile" vs "Later"
   - Goal: >30% click-through rate

3. **Recommendation Quality**
   - More complete profiles → Better matches
   - Track match scores before/after

---

**You're all set!** 🎉

The toast is now live on your student dashboard. Test it out and watch those profile completion rates soar! 📈

---

**Last Updated:** April 6, 2026
**Status:** ✅ Production Ready
**Questions?** Check the full docs at `/PROFILE_TOAST_IMPLEMENTATION_SUMMARY.md`
