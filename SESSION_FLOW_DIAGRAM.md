# 📊 Public Session Flow - Visual Guide

## 🔄 Complete User Journey

### Initial State: User Not Registered

```
┌─────────────────────────────────────────────────────────────────┐
│ DASHBOARD                                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 📅 MY SESSIONS (0)                                              │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ No upcoming sessions                                    │   │
│ │ 🎯 Browse available sessions below!                     │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│ 🌟 AVAILABLE PUBLIC SESSIONS                                    │
│ ┌───────────────────────────────┬─────────────────────────┐   │
│ │ 💼 Career Q&A Session         │ 🚀 RECURRING PROGRAM    │   │
│ │ By Sarah Johnson              │ Tech Interview Prep     │   │
│ │ Apr 10, 2026 · 2:00 PM        │ Every Mon & Wed         │   │
│ │ 15 spots left                 │ 8 sessions · 12 spots   │   │
│ │ [Count Me In!] ←─────────────┐│ [Count Me In!]          │   │
│ └───────────────────────────────┴─────────────────────────┘   │
│                                  │                              │
└──────────────────────────────────┼──────────────────────────────┘
                                   │
                                   │ Click "Count Me In!"
                                   ↓
```

---

### After Registration: Session Moves to "My Sessions"

```
                                   ↓
                    🎉 SUCCESS! Registered!
                                   ↓
┌─────────────────────────────────────────────────────────────────┐
│ DASHBOARD                                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 📅 MY SESSIONS (1)                                              │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ ✅ 💼 Career Q&A Session                                │   │
│ │    By Sarah Johnson                                     │   │
│ │    Apr 10, 2026 · 2:00 PM                              │   │
│ │    PUBLIC SESSION · You're In!                          │   │
│ │    [View Details] ←──────────────────────────────────┐  │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                              │                  │
│ 📆 CALENDAR                                  │                  │
│ ┌───────────────────────┐                   │                  │
│ │ April 2026            │                   │                  │
│ │  S  M  T  W  T  F  S  │                   │                  │
│ │           1  2  3  4  │                   │                  │
│ │  5  6  7  8  9 [10]11 │← Date appears!    │                  │
│ │ 12 13 14 15 16 17 18  │                   │                  │
│ └───────────────────────┘                   │                  │
│                                              │                  │
│ 🌟 AVAILABLE PUBLIC SESSIONS                │                  │
│ ┌───────────────────────────────────────────┐                  │
│ │ 🚀 RECURRING PROGRAM                      │                  │
│ │ Tech Interview Prep                       │                  │
│ │ Every Mon & Wed                           │                  │
│ │ 8 sessions · 12 spots                     │                  │
│ │ [Count Me In!]                            │                  │
│ └───────────────────────────────────────────┘                  │
│                                                                 │
│ ❌ Career Q&A Session NO LONGER HERE!                          │
│                                                                 │
└─────────────────────────────────────────────┼───────────────────┘
                                              │
                                              │ Click "View Details"
                                              ↓
```

---

### Session Details Modal

```
                                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 📋 SESSION DETAILS                                         [X]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 👤 Sarah Johnson                                                │
│    Mentor · Diaspora Professional                               │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ PUBLIC SESSION                                          │   │
│ │ 15/20 students registered · 5 spots left                │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│ 📅 Apr 10, 2026 · 2:00 PM                                      │
│ ⏱️  60 minutes                                                  │
│ 🎯 Career Q&A Session                                          │
│ 💻 Google Meet                                                 │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ [Join Session Now]                                      │   │
│ │ [View Meeting Details]                                  │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│ ─────────────────────────────────────────────────────────────  │
│                                                                 │
│ [Message Mentor]  [Leave Session] ←─────────────────┐          │
│                                                      │          │
└──────────────────────────────────────────────────────┼──────────┘
                                                       │
                                                       │ Click "Leave Session"
                                                       ↓
```

---

### Confirmation Dialog

```
                                                       ↓
                        ┌──────────────────────────────────────┐
                        │ ⚠️  Confirm Action                   │
                        ├──────────────────────────────────────┤
                        │                                      │
                        │ Are you sure you want to leave      │
                        │ this public session?                 │
                        │                                      │
                        │ This action cannot be undone.        │
                        │                                      │
                        │        [Cancel]  [Yes, Leave] ←──┐  │
                        └──────────────────────────────────┼───┘
                                                           │
                                                           │ Click "Yes, Leave"
                                                           ↓
```

---

### After Leaving: Session Returns to "Available"

```
                                                           ↓
           🎉 SUCCESS! Left session · Reappears in Available
                                                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ DASHBOARD                                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 📅 MY SESSIONS (0)                                              │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ No upcoming sessions                                    │   │
│ │ 🎯 Browse available sessions below!                     │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│ ❌ Career Q&A Session NO LONGER IN "MY SESSIONS"               │
│                                                                 │
│ 📆 CALENDAR                                                     │
│ ┌───────────────────────┐                                      │
│ │ April 2026            │                                      │
│ │  S  M  T  W  T  F  S  │                                      │
│ │           1  2  3  4  │                                      │
│ │  5  6  7  8  9  10 11 │← Date REMOVED!                      │
│ │ 12 13 14 15 16 17 18  │                                      │
│ └───────────────────────┘                                      │
│                                                                 │
│ 🌟 AVAILABLE PUBLIC SESSIONS                                    │
│ ┌───────────────────────────────┬─────────────────────────┐   │
│ │ ✨ 💼 Career Q&A Session       │ 🚀 RECURRING PROGRAM    │   │
│ │ By Sarah Johnson              │ Tech Interview Prep     │   │
│ │ Apr 10, 2026 · 2:00 PM        │ Every Mon & Wed         │   │
│ │ 14 spots left (was 15)        │ 8 sessions · 12 spots   │   │
│ │ [Count Me In!] ←─────────────────── Back again!         │   │
│ └───────────────────────────────┴─────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

✅ Session available for registration again!
✅ Spot count updated (one more spot available)
✅ Can rejoin if desired
```

---

## 🔄 Recurring Series Flow

### Registering for Recurring Series

```
AVAILABLE PUBLIC SESSIONS
┌─────────────────────────────────────────────┐
│ 🚀 RECURRING PROGRAM                        │
│ Tech Interview Prep                         │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ 📅 Apr 8, 2026 - May 1, 2026               │
│ 🔁 Every Monday & Wednesday                 │
│ 📊 8 total sessions                         │
│ 👥 12/20 spots · 8 spots left               │
│                                             │
│ [Count Me In!] ←───────────────┐           │
└─────────────────────────────────┼───────────┘
                                  │
                                  │ Click
                                  ↓
         Registers for ALL 8 sessions!
                                  ↓
MY SESSIONS
┌─────────────────────────────────────────────┐
│ ✅ Tech Interview Prep - Session 1          │
│    Mon, Apr 8 · 6:00 PM                     │
│                                             │
│ ✅ Tech Interview Prep - Session 2          │
│    Wed, Apr 10 · 6:00 PM                    │
│                                             │
│ ✅ Tech Interview Prep - Session 3          │
│    Mon, Apr 15 · 6:00 PM                    │
│                                             │
│ ... (5 more sessions)                       │
└─────────────────────────────────────────────┘

CALENDAR
┌───────────────────────┐
│ April 2026            │
│  S  M  T  W  T  F  S  │
│        1  2  3  4  5  │
│  6  7 [8] 9[10]11 12  │ ← All dates appear!
│ 13 14[15]16 17 18 19  │
│ 20 21[22]23 24 25 26  │
│ 27 28[29]30           │
└───────────────────────┘
```

---

### Leaving Recurring Series

```
MY SESSIONS (click any session in series)
┌─────────────────────────────────────────────┐
│ ✅ Tech Interview Prep - Session 3          │
│    Mon, Apr 15 · 6:00 PM                    │
│    [View Details] ←────────────────┐        │
└─────────────────────────────────────┼───────┘
                                      │
                                      ↓
SESSION DETAILS MODAL
┌─────────────────────────────────────────────┐
│ 🚀 RECURRING PROGRAM                        │
│ Part of "Tech Interview Prep" series        │
│ Session 3 of 8                              │
│                                             │
│ [Message Mentor]  [Leave Session] ←────┐   │
└─────────────────────────────────────────┼───┘
                                          │
                                          ↓
                     Leaves ALL 8 sessions!
                                          ↓
MY SESSIONS
┌─────────────────────────────────────────────┐
│ No upcoming sessions                        │
│                                             │
│ ❌ All 8 sessions removed!                  │
└─────────────────────────────────────────────┘

CALENDAR
┌───────────────────────┐
│ April 2026            │
│  S  M  T  W  T  F  S  │
│        1  2  3  4  5  │
│  6  7  8  9 10 11 12  │ ← All dates removed!
│ 13 14 15 16 17 18 19  │
│ 20 21 22 23 24 25 26  │
│ 27 28 29 30           │
└───────────────────────┘

AVAILABLE PUBLIC SESSIONS
┌─────────────────────────────────────────────┐
│ 🚀 RECURRING PROGRAM                        │
│ Tech Interview Prep                         │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ 📅 Apr 8, 2026 - May 1, 2026               │
│ 🔁 Every Monday & Wednesday                 │
│ 📊 8 total sessions                         │
│ 👥 11/20 spots · 9 spots left (one more!)   │
│                                             │
│ [Count Me In!] ← Series reappears!          │
└─────────────────────────────────────────────┘
```

---

## 🎯 Key Rules

### Rule 1: Mutual Exclusivity
```
IF session in "My Sessions"
  THEN NOT in "Available Public Sessions"

IF session in "Available Public Sessions"  
  THEN NOT in "My Sessions"

✅ A session is ONLY in ONE place at a time!
```

### Rule 2: Calendar Synchronization
```
IF session in "My Sessions"
  THEN date on calendar

IF session NOT in "My Sessions"
  THEN date NOT on calendar

✅ Calendar reflects "My Sessions" only!
```

### Rule 3: Series All-or-Nothing
```
For Recurring Series:
  - Register → ALL sessions added to "My Sessions"
  - Leave → ALL sessions removed from "My Sessions"
  - Can't register for individual sessions in a series

✅ Series registration is atomic!
```

---

## 🔍 Status Indicators

### In "Available Public Sessions"

```
NOT Registered:
┌─────────────────────────┐
│ Session Name            │
│ 5 spots left            │
│ [Count Me In!]          │ ← Blue button, clickable
└─────────────────────────┘

Registered (should NOT appear!):
❌ This session won't be shown
✅ Filtering prevents display
```

### In "My Sessions"

```
Registered Public Session:
┌─────────────────────────┐
│ ✅ Session Name          │
│ PUBLIC SESSION          │
│ You're In!              │
│ [View Details]          │
└─────────────────────────┘
```

---

## 💡 User Mental Model

### Simple Rules for Students:

1. **"Available Public Sessions" = Can Join**
   - If I see it here, I can click "Count Me In!"
   - If I don't see it, either I'm registered or it's full

2. **"My Sessions" = Already Joined**
   - These are sessions I'm attending
   - I can leave them if needed
   - Calendar shows these dates

3. **Leaving = Undo Registration**
   - Session goes back to "Available"
   - I can rejoin later (if spots available)
   - Calendar date disappears

4. **Recurring = All-or-Nothing**
   - Join once = Join all sessions in series
   - Leave once = Leave all sessions in series
   - Can't pick and choose individual sessions

---

## ✅ Success Criteria

### After Registration:
- [ ] Session disappears from "Available Public Sessions"
- [ ] Session appears in "My Sessions"
- [ ] Calendar shows the date(s)
- [ ] Button changes to "You're In!"
- [ ] Toast notification confirms success

### After Leaving:
- [ ] Session disappears from "My Sessions"
- [ ] Session reappears in "Available Public Sessions"
- [ ] Calendar no longer shows the date(s)
- [ ] Button changes to "Count Me In!"
- [ ] Toast notification confirms leaving

### After Page Refresh:
- [ ] Changes persist (not just UI state)
- [ ] Sessions still in correct sections
- [ ] Calendar still accurate
- [ ] Registration status maintained

---

**Last Updated:** April 6, 2026  
**Visual Guide Version:** 1.0  
**Purpose:** Clear understanding of session flow for developers & testers
