# Custom Authentication - Quick Reference Card

## 🎯 Quick Setup (1 Step!)

**Turn OFF JWT validation in Supabase Dashboard:**
```
Dashboard → Authentication → JWT Settings → "Verify JWT with legacy secret" [OFF]
```

That's it! Everything else is already implemented.

---

## 🔑 Token Format

**Custom Session Token:**
```
ispora_session_1234567890123_abc123def456gh
├─ Prefix: ispora_session_
├─ Timestamp: 1234567890123
└─ Random: abc123def456gh
```

**Storage:**
- **Key:** `ispora_session_{timestamp}_{random}`
- **Value:** `{ userId, email, createdAt, expiresAt, lastActiveAt }`
- **Location:** KV Store
- **TTL:** 30 days

---

## 📡 API Endpoints

### Public (No Auth)
```
POST /auth/signup    → Create account
POST /auth/signin    → Get custom token
POST /auth/refresh   → Refresh token
```

### Protected (Auth Required)
```
GET  /auth/session   → Get current user
POST /auth/signout   → Delete token & logout
GET  /users          → List users
...all other endpoints
```

---

## 💻 Code Snippets

### Frontend - Sign In
```typescript
const response = await fetch(`${API_URL}/auth/signin`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}` // For gateway
  },
  body: JSON.stringify({ email, password })
});

const { accessToken, user } = await response.json();

// Store token
localStorage.setItem('ispora_accessToken', accessToken);
// Token format: ispora_session_...
```

### Frontend - Authenticated Request
```typescript
const response = await fetch(`${API_URL}/users/stats`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('ispora_accessToken')}`
  }
});

const data = await response.json();
```

### Frontend - Sign Out
```typescript
await fetch(`${API_URL}/auth/signout`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('ispora_accessToken')}`
  }
});

localStorage.removeItem('ispora_accessToken');
```

### Backend - Validate Token
```typescript
// This happens automatically in authenticateUser()

// 1. Extract token
const token = c.req.header('Authorization')?.replace('Bearer ', '');

// 2. Check format
if (token.startsWith('ispora_session_')) {
  
  // 3. Lookup in KV
  const sessionData = await kv.get(token);
  
  // 4. Verify exists & not expired
  if (sessionData && new Date(sessionData.expiresAt) > new Date()) {
    
    // 5. Get user profile
    const userProfile = await kv.get(`user:${sessionData.userId}`);
    
    // 6. User authenticated ✓
    return { user: {...}, supabase };
  }
}

// 7. Fallback to JWT validation
```

---

## 🔍 Testing Commands

### Test Sign In
```bash
curl -X POST https://PROJECT.supabase.co/functions/v1/make-server-b8526fa6/auth/signin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Test Authenticated Request
```bash
curl -X GET https://PROJECT.supabase.co/functions/v1/make-server-b8526fa6/auth/session \
  -H "Authorization: Bearer ispora_session_XXX"
```

### Test Sign Out
```bash
curl -X POST https://PROJECT.supabase.co/functions/v1/make-server-b8526fa6/auth/signout \
  -H "Authorization: Bearer ispora_session_XXX"
```

---

## 📊 Authentication Flow

```
Sign In Flow:
───────────────────────────────────────────────────
User → Email/Password → Supabase validates
                     ↓
         Generate: ispora_session_XXX
                     ↓
         Store in KV: token → {userId, ...}
                     ↓
         Return: { accessToken: "ispora_session_XXX" }
                     ↓
         Frontend: localStorage.setItem(...)


Authenticated Request Flow:
───────────────────────────────────────────────────
Frontend → Bearer ispora_session_XXX
                     ↓
         authenticateUser()
                     ↓
         kv.get(token)
                     ↓
         Check expiration
                     ↓
         kv.get(user:XXX)
                     ↓
         Return user → Request processed


Sign Out Flow:
───────────────────────────────────────────────────
Frontend → Bearer ispora_session_XXX
                     ↓
         kv.del(token)
                     ↓
         Token deleted ✓
                     ↓
         localStorage.removeItem(...)
```

---

## 🐛 Debugging

### Check Token Format
```javascript
// Frontend console
const token = localStorage.getItem('ispora_accessToken');
console.log('Token:', token);
console.log('Is custom?', token.startsWith('ispora_session_'));
```

### Check Edge Function Logs
```
Supabase Dashboard → Edge Functions → Logs

Look for:
✓ "Custom session token detected"
✓ "Session token valid for user: XXX"
✓ "User authenticated via custom session token"

Errors:
✗ "Session token not found in KV store"
✗ "Session token expired"
```

### Verify KV Storage
```typescript
// In Edge Function
const sessionData = await kv.get(token);
console.log('Session data:', sessionData);
```

---

## ⚠️ Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| "Invalid JWT" | JWT validation ON | Turn OFF in dashboard |
| "Invalid or expired session" | Token not in KV | Sign in again |
| "User authentication required" | Anon key sent | Send session token |
| Token not working | Wrong format | Check starts with `ispora_session_` |
| Request fails | Token expired | Use refresh endpoint or sign in |

---

## 🔐 Security Checklist

- ✅ Token includes random component (16 chars)
- ✅ Token expires after 30 days
- ✅ Token validated on every request
- ✅ Expired tokens auto-deleted
- ✅ User credentials validated by Supabase
- ✅ KV store provides isolation
- ✅ Backward compatible with JWT (fallback)

**Recommended:**
- 🔄 Add rate limiting
- 🔄 Add IP validation
- 🔄 Implement token cleanup job
- 🔄 Monitor session activity

---

## 📝 Key Files

| File | Purpose |
|------|---------|
| `/supabase/functions/server/index.tsx` | Main auth logic |
| `/CUSTOM_AUTH_GUIDE.md` | Complete guide |
| `/CUSTOM_AUTH_SETUP_CHECKLIST.md` | Setup steps |
| `/CUSTOM_AUTH_FLOW_DIAGRAM.md` | Visual flows |
| `/API_DOCUMENTATION.md` | API reference |

---

## 🎓 Helper Functions

```typescript
// Generate new session token
function generateSessionToken(): string {
  return `ispora_session_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
}

// Create session data
function createSessionData(userId: string, email: string, daysValid = 30) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + daysValid);
  
  return {
    userId,
    email,
    createdAt: new Date().toISOString(),
    expiresAt: expiresAt.toISOString(),
    lastActiveAt: new Date().toISOString(),
  };
}

// Authenticate user (main function)
async function authenticateUser(c: any) {
  // Extracts token, validates against KV, returns user
  // See full implementation in index.tsx
}
```

---

## 🚀 Deployment Steps

1. ✅ Code already deployed
2. ⚠️  **Turn OFF JWT validation** (Dashboard → Auth → JWT Settings)
3. ✅ Test sign in (get custom token)
4. ✅ Test authenticated request (use token)
5. ✅ Monitor logs (verify custom auth working)
6. ✅ Users automatically migrated on next sign in

---

## 📞 Quick Support

**Not working?**

1. Check JWT validation is **OFF**
2. Check Edge Function logs
3. Verify token format: `ispora_session_...`
4. Test with curl commands
5. Check KV store access

**Still stuck?**

- Review `/CUSTOM_AUTH_GUIDE.md`
- Check `/CUSTOM_AUTH_SETUP_CHECKLIST.md`
- Inspect Edge Function logs in detail

---

## 💡 Pro Tips

**Tip 1:** Token format is the key
- Custom: `ispora_session_...` → KV validation
- JWT: `eyJ...` → Supabase validation (fallback)

**Tip 2:** Frontend doesn't know the difference
- Same API, same response format
- Just works™

**Tip 3:** Monitor Edge Function logs
- See exactly what's happening
- Catch issues early

**Tip 4:** Test with curl first
- Isolate frontend issues
- Verify backend works

**Tip 5:** JWT validation OFF = Freedom
- No more toggle resetting
- Full control over auth

---

**Status:** ✅ Ready to use!

**Last Updated:** March 30, 2024
