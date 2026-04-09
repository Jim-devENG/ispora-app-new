# 🏗️ Impact & Achievements System - Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           IMPACT & ACHIEVEMENTS SYSTEM                       │
│                              Architecture Overview                           │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                                  FRONTEND                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────┐    ┌──────────────────────┐                      │
│  │  MENTOR DASHBOARD    │    │  YOUTH DASHBOARD     │                      │
│  │                      │    │                      │                      │
│  │  ┌────────────────┐ │    │  ┌────────────────┐ │                      │
│  │  │ Impact Button  │ │    │  │ Journey Button │ │                      │
│  │  └────────┬───────┘ │    │  └────────┬───────┘ │                      │
│  └───────────┼──────────┘    └───────────┼──────────┘                      │
│              │                            │                                 │
│              └────────────────┬───────────┘                                 │
│                               │                                             │
│                               ▼                                             │
│                    ┌──────────────────────┐                                 │
│                    │  IMPACT DASHBOARD    │                                 │
│                    │  Component           │                                 │
│                    │                      │                                 │
│                    │  • ImpactDashboard   │                                 │
│                    │  • BadgeDisplay      │                                 │
│                    │  • ShareableCard     │                                 │
│                    └──────────┬───────────┘                                 │
│                               │                                             │
└───────────────────────────────┼─────────────────────────────────────────────┘
                                │
                                │ API Calls
                                │
┌───────────────────────────────▼─────────────────────────────────────────────┐
│                              API LAYER                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  GET  /users/impact-stats     →  Calculate comprehensive stats             │
│  GET  /users/badges           →  Get earned badges                         │
│  POST /users/badges/check     →  Check and award new badges                │
│  GET  /users/impact-card      →  Generate shareable card data              │
│  GET  /users/monthly-impact   →  Get monthly summary                       │
│                                                                              │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │
                                │
┌───────────────────────────────▼─────────────────────────────────────────────┐
│                            BACKEND LOGIC                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  IMPACT STATS MODULE (impact-stats.tsx)                             │  │
│  │                                                                      │  │
│  │  calculateMentorImpactStats()                                       │  │
│  │    ├─ Total youths mentored                                         │  │
│  │    ├─ Total sessions completed                                      │  │
│  │    ├─ Total hours given                                             │  │
│  │    ├─ Active mentorships                                            │  │
│  │    ├─ Messages sent                                                 │  │
│  │    ├─ Resources shared                                              │  │
│  │    ├─ States reached                                                │  │
│  │    ├─ Response rate                                                 │  │
│  │    └─ Completion rate                                               │  │
│  │                                                                      │  │
│  │  calculateYouthProgressStats()                                      │  │
│  │    ├─ Sessions attended                                             │  │
│  │    ├─ Mentors connected                                             │  │
│  │    ├─ Goals completed                                               │  │
│  │    ├─ Skills developed                                              │  │
│  │    ├─ Resources accessed                                            │  │
│  │    ├─ Career milestones                                             │  │
│  │    └─ Group sessions                                                │  │
│  │                                                                      │  │
│  │  generateImpactCardData()                                           │  │
│  │  generateMonthlyImpact()                                            │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  BADGE SYSTEM MODULE (badges.tsx)                                   │  │
│  │                                                                      │  │
│  │  MENTOR_BADGES (20 badges)                                          │  │
│  │    ├─ Milestones: ⭐🔥💎👑🌟                                         │  │
│  │    ├─ Impact: 🤝🏗️🎓🏆📚⚡💬🌍                                     │  │
│  │    ├─ Time: 📅🗓️🏅⏰⌚                                                │  │
│  │    └─ Special: ⭐⭐⭐⭐⭐                                              │  │
│  │                                                                      │  │
│  │  YOUTH_BADGES (15 badges)                                           │  │
│  │    ├─ Engagement: 🌱🔥💪🏆📖📚💬👥📅🗓️🏅                           │  │
│  │    ├─ Progress: 🎯🎖️🎤💼🚀💼                                        │  │
│  │    └─ Community: 🤝                                                  │  │
│  │                                                                      │  │
│  │  checkEarnedBadges(stats, role)                                     │  │
│  │  getNewBadges(currentBadges, allBadges)                             │  │
│  │  getBadgeDisplayInfo(badge)                                         │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │
                                │
┌───────────────────────────────▼─────────────────────────────────────────────┐
│                           DATA LAYER (KV STORE)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  user:{userId}                                                              │
│    ├─ Profile data (name, role, etc.)                                      │
│    ├─ badges: Badge[]                                                      │
│    └─ createdAt, updatedAt                                                 │
│                                                                              │
│  mentorship:{mentorshipId}                                                  │
│    ├─ mentorId, studentId                                                  │
│    ├─ status: active | ended | paused                                      │
│    └─ startedAt, endedAt                                                   │
│                                                                              │
│  session:{sessionId}                                                        │
│    ├─ mentorshipId, mentorId, studentId                                    │
│    ├─ scheduledAt, duration                                                │
│    ├─ status: scheduled | completed | cancelled                            │
│    └─ completedAt                                                          │
│                                                                              │
│  message:{messageId}                                                        │
│    ├─ senderId, receiverId                                                 │
│    ├─ content, read                                                        │
│    └─ createdAt, readAt                                                    │
│                                                                              │
│  resource:{resourceId}                                                      │
│    ├─ mentorId, studentId                                                  │
│    ├─ type, title, content                                                 │
│    └─ createdAt                                                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                          USER FLOW: MENTOR                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. Mentor completes 10th session                                           │
│                    ↓                                                         │
│  2. Mentor navigates to "My Impact"                                         │
│                    ↓                                                         │
│  3. System fetches /users/impact-stats                                      │
│        → calculateMentorImpactStats()                                       │
│        → Returns: totalSessionsCompleted: 10                                │
│                    ↓                                                         │
│  4. System fetches /users/badges                                            │
│        → checkEarnedBadges(stats, 'diaspora')                               │
│        → Badge criteria: Rising Star needs 10 sessions ✓                    │
│        → Returns: New badge "Rising Star" 🔥                                │
│                    ↓                                                         │
│  5. Toast notification: "🎉 You earned a new badge!"                        │
│                    ↓                                                         │
│  6. Badge appears in dashboard with silver border                           │
│                    ↓                                                         │
│  7. Mentor clicks "Share Impact" tab                                        │
│        → generateImpactCardData()                                           │
│        → Shows: "47 youths, 127 sessions, 89 hours"                         │
│                    ↓                                                         │
│  8. Mentor clicks "Share" button                                            │
│        → Pre-filled LinkedIn post generated                                 │
│        → Copy to clipboard or native share                                  │
│                    ↓                                                         │
│  9. Mentor posts on LinkedIn                                                │
│                    ↓                                                         │
│  10. New users discover Ispora → VIRAL GROWTH! 🚀                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                          USER FLOW: YOUTH                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. Youth completes 5th goal                                                │
│                    ↓                                                         │
│  2. Youth navigates to "My Journey"                                         │
│                    ↓                                                         │
│  3. System fetches /users/impact-stats                                      │
│        → calculateYouthProgressStats()                                      │
│        → Returns: goalsCompleted: 5                                         │
│                    ↓                                                         │
│  4. System fetches /users/badges                                            │
│        → checkEarnedBadges(stats, 'student')                                │
│        → Badge criteria: Goal Crusher needs 5 goals ✓                       │
│        → Returns: New badge "Goal Crusher" 🎯                               │
│                    ↓                                                         │
│  5. Toast notification: "🎉 You earned a new badge!"                        │
│                    ↓                                                         │
│  6. Badge appears with gold border                                          │
│                    ↓                                                         │
│  7. Youth sees progress: "5/10 goals completed" (50%)                       │
│                    ↓                                                         │
│  8. Youth clicks "Share Journey" tab                                        │
│        → Shows: "15 sessions, 3 mentors, 8 goals achieved"                  │
│                    ↓                                                         │
│  9. Youth shares on Twitter/WhatsApp                                        │
│                    ↓                                                         │
│  10. Friends see success → Sign up for mentorship! 🎓                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                     BADGE AWARDING ALGORITHM                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  function checkEarnedBadges(stats, role) {                                  │
│    const criteria = role === 'diaspora' ? MENTOR_BADGES : YOUTH_BADGES      │
│    const earnedBadges = []                                                  │
│                                                                              │
│    for (const badge of criteria) {                                          │
│      if (badge.check(stats)) {  // Example: stats.totalSessions >= 10       │
│        earnedBadges.push({                                                  │
│          ...badge,                                                          │
│          earnedAt: new Date().toISOString()                                 │
│        })                                                                   │
│      }                                                                      │
│    }                                                                        │
│                                                                              │
│    return earnedBadges                                                      │
│  }                                                                          │
│                                                                              │
│  Example Badge Criteria:                                                    │
│    {                                                                        │
│      id: 'rising-star',                                                     │
│      check: (stats) => stats.totalSessionsCompleted >= 10,                  │
│      badge: {                                                               │
│        name: 'Rising Star',                                                 │
│        description: 'Completed 10 mentoring sessions',                      │
│        icon: '🔥',                                                           │
│        tier: 'silver'                                                       │
│      }                                                                      │
│    }                                                                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                        SHARING MECHANISM                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Impact Card (Visual)                                                       │
│  ┌────────────────────────────────────────────────┐                        │
│  │  🌟 MY ISPORA IMPACT 🌟                       │                        │
│  │                                                │                        │
│  │  Chukwu Emeka                                 │                        │
│  │  Senior Software Engineer                     │                        │
│  │                                                │                        │
│  │  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐    │                        │
│  │  │  47   │ │  127  │ │ 89h   │ │  12   │    │                        │
│  │  │Youths │ │Sessions│ │Hours │ │States │    │                        │
│  │  └───────┘ └───────┘ └───────┘ └───────┘    │                        │
│  │                                                │                        │
│  │  "Empowering the next generation"             │                        │
│  │                                                │                        │
│  │  🔗 Join me at ispora.com                     │                        │
│  └────────────────────────────────────────────────┘                        │
│                                                                              │
│  Share Options:                                                             │
│    • Copy Text → Clipboard                                                  │
│    • Share → Native share (mobile) or clipboard (desktop)                   │
│    • Copy Link → ispora.com                                                 │
│                                                                              │
│  Pre-filled LinkedIn Post:                                                  │
│    "Just reviewed my impact on @Ispora! 🌟                                  │
│     ✓ 47 youths mentored                                                    │
│     ✓ 127 sessions completed                                                │
│     ✓ 89 hours of mentorship given                                          │
│     ✓ Reached 12 Nigerian states                                            │
│                                                                              │
│     Proud to be empowering Nigeria's next generation                        │
│     of professionals. Join me!"                                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                     TECHNOLOGY STACK                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Backend:                                                                   │
│    • Hono - Web framework                                                   │
│    • Deno - Runtime environment                                             │
│    • TypeScript - Type safety                                               │
│    • Supabase KV Store - Data persistence                                   │
│                                                                              │
│  Frontend:                                                                  │
│    • React - UI library                                                     │
│    • TypeScript - Type safety                                               │
│    • Tailwind CSS - Styling                                                 │
│    • Lucide Icons - Icon library                                            │
│    • Sonner - Toast notifications                                           │
│                                                                              │
│  Components:                                                                │
│    • shadcn/ui - Card, Tabs, Badge, Button, Tooltip                         │
│    • Custom - BadgeDisplay, ImpactDashboard, ShareableCard                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Key Design Decisions

### 1. **Server-Side Badge Logic**
- Prevents client-side manipulation
- Ensures data integrity
- Centralized criteria management

### 2. **Real-Time Calculation**
- Stats calculated on-demand from actual data
- No cached/stale data
- Always accurate

### 3. **Emoji Icons**
- Universal, no asset loading
- Accessible across all platforms
- Lightweight

### 4. **Tier System**
- Bronze → Silver → Gold → Platinum
- Visual progression
- Motivates users to achieve higher tiers

### 5. **Share-First Design**
- Every achievement is shareable
- Pre-filled text for ease
- Multiple sharing channels

---

**This architecture supports viral growth while maintaining data integrity and user engagement!**
