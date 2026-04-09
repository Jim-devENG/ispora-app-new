# Custom Authentication - Setup Checklist

## ✅ What's Been Implemented

This checklist shows what has been completed and what you need to do to fully activate the custom authentication system.

---

## Backend Implementation (✅ COMPLETE)

### 1. ✅ Core Authentication Function
- **File:** `/supabase/functions/server/index.tsx`
- **Function:** `authenticateUser()`
- **Features:**
  - ✅ Custom session token validation
  - ✅ KV store integration
  - ✅ Token expiration checking
  - ✅ Backward compatibility with JWT
  - ✅ Last active timestamp updates

### 2. ✅ Helper Functions
- **File:** `/supabase/functions/server/index.tsx`
- **Functions:**
  - ✅ `generateSessionToken()` - Creates new custom tokens
  - ✅ `createSessionData()` - Creates session data with expiration

### 3. ✅ Updated Endpoints

#### Sign In Endpoint
- **Path:** `POST /auth/signin`
- **Changes:**
  - ✅ Generates custom session token
  - ✅ Stores token in KV store
  - ✅ Returns custom token instead of Supabase JWT
  - ✅ 30-day token expiration

#### Sign Out Endpoint
- **Path:** `POST /auth/signout`
- **Changes:**
  - ✅ Detects custom session tokens
  - ✅ Deletes token from KV store
  - ✅ Maintains backward compatibility

#### Refresh Token Endpoint (NEW)
- **Path:** `POST /auth/refresh`
- **Features:**
  - ✅ Generates new token
  - ✅ Invalidates old token
  - ✅ Extends session

### 4. ✅ Documentation
- ✅ `/CUSTOM_AUTH_GUIDE.md` - Complete implementation guide
- ✅ `/API_DOCUMENTATION.md` - Updated with custom auth details
- ✅ `/CUSTOM_AUTH_SETUP_CHECKLIST.md` - This checklist

---

## Supabase Dashboard Configuration (⚠️ ACTION REQUIRED)

### Step 1: Turn OFF JWT Validation

**CRITICAL:** This is the most important step!

1. Go to your Supabase Dashboard
2. Navigate to: **Authentication → JWT Settings**
3. Find: **"Verify JWT with legacy secret"** toggle
4. **Turn it OFF** ⚠️

**Why this matters:**
- ✅ Disables Supabase's built-in JWT validation
- ✅ Allows custom auth logic to take over
- ✅ Prevents automatic re-enabling issues
- ✅ Your custom tokens won't be validated by Supabase

**Screenshot/Location:**
```
Dashboard → Authentication → JWT Settings → Verify JWT with legacy secret [OFF]
```

### Step 2: Verify Environment Variables

Ensure these are set in your Edge Function environment:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**How to check:**
1. Supabase Dashboard → Edge Functions
2. Select function → Environment Variables
3. Verify all three variables exist

---

## Frontend Configuration (✅ NO CHANGES NEEDED)

### Good News!

The frontend code doesn't need any changes because:
- ✅ Sign in API response format unchanged (`accessToken`, `refreshToken`, `user`)
- ✅ Token storage logic unchanged (localStorage)
- ✅ Authorization header format unchanged (`Bearer {token}`)
- ✅ All API calls work exactly the same

### What Happens Automatically

1. **User signs in** → Gets custom token → Stored in localStorage
2. **User makes request** → Custom token sent → Validated by backend
3. **Token validated** → Request processed normally
4. **User signs out** → Token deleted from KV and localStorage

---

## Testing the System

### Pre-Deployment Testing

Before going live, test these scenarios:

#### Test 1: Sign In
```bash
curl -X POST https://your-project.supabase.co/functions/v1/make-server-b8526fa6/auth/signin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

**Expected:** Response with `accessToken` starting with `ispora_session_`

#### Test 2: Authenticated Request
```bash
curl -X GET https://your-project.supabase.co/functions/v1/make-server-b8526fa6/auth/session \
  -H "Authorization: Bearer ispora_session_XXXXXX"
```

**Expected:** User profile data

#### Test 3: Sign Out
```bash
curl -X POST https://your-project.supabase.co/functions/v1/make-server-b8526fa6/auth/signout \
  -H "Authorization: Bearer ispora_session_XXXXXX"
```

**Expected:** Success message

### Post-Deployment Testing

1. **Frontend Sign In:**
   - Open your app
   - Sign in with test credentials
   - Check browser console for custom token
   - Verify token starts with `ispora_session_`

2. **Make Authenticated Requests:**
   - Navigate to dashboard
   - Check Network tab in browser DevTools
   - Verify API calls succeed
   - Check Authorization header contains custom token

3. **Sign Out:**
   - Click sign out
   - Verify redirect to login page
   - Confirm token removed from localStorage

---

## Monitoring & Verification

### Check Edge Function Logs

1. Supabase Dashboard → Edge Functions → Logs
2. Look for these messages:

**Successful Authentication:**
```
=== Custom Authentication (JWT validation OFF) ===
✓ Custom session token detected
✓ Session token valid for user: {userId}
✓ User authenticated via custom session token: {userId}
```

**Token Generation:**
```
✓ Custom session token created: ispora_session_...
```

**Token Deletion:**
```
✓ Deleting custom session token from KV store
```

### Check KV Store

Verify tokens are being stored:
1. Look for keys starting with `ispora_session_`
2. Verify session data contains: `userId`, `email`, `createdAt`, `expiresAt`

---

## Common Issues & Solutions

### Issue: "Invalid JWT" Error

**Cause:** JWT validation still enabled in Supabase dashboard

**Solution:**
1. Go to Authentication → JWT Settings
2. Turn OFF "Verify JWT with legacy secret"
3. Save changes
4. Test again

### Issue: "Invalid or expired session"

**Cause:** Token not found in KV or expired

**Solution:**
1. Sign in again to get new token
2. Check token hasn't expired (30-day limit)
3. Verify KV store is accessible

### Issue: "User authentication required"

**Cause:** Anon key sent instead of session token

**Solution:**
1. Verify frontend is sending session token (not anon key)
2. Check localStorage for `ispora_accessToken`
3. Confirm token starts with `ispora_session_`

---

## Migration Plan

### Phase 1: Deployment (NOW)
- ✅ Code deployed to Edge Functions
- ⚠️ Turn OFF JWT validation in dashboard
- ⚠️ Test with new sign-ins

### Phase 2: User Migration (AUTOMATIC)
- Users with old JWT tokens still work (fallback)
- New sign-ins get custom tokens
- All users eventually migrate to custom tokens

### Phase 3: Cleanup (LATER)
- Monitor for JWT token usage
- After all users migrated, optionally remove JWT fallback
- Implement periodic token cleanup job

---

## Security Checklist

### ✅ Already Implemented
- ✅ Token randomness (timestamp + 16-char random)
- ✅ Token expiration (30 days)
- ✅ Token validation on every request
- ✅ Automatic expired token deletion
- ✅ Supabase credential validation

### 🔄 Recommended Enhancements
- 🔄 Add rate limiting to auth endpoints
- 🔄 Implement IP address validation
- 🔄 Add periodic cleanup job for expired tokens
- 🔄 Consider httpOnly cookies (vs localStorage)
- 🔄 Add session activity logging

---

## Support & Troubleshooting

### Where to Look

1. **Edge Function Logs:**
   - Supabase Dashboard → Edge Functions → Logs
   - Look for authentication-related messages

2. **Browser Console:**
   - Check for API errors
   - Verify token format
   - Check localStorage values

3. **Network Tab:**
   - Inspect Authorization headers
   - Check API responses
   - Verify token being sent

### Getting Help

If you encounter issues:
1. Check Edge Function logs first
2. Verify JWT validation is OFF in Supabase
3. Test with curl commands (see Testing section)
4. Check token format (must start with `ispora_session_`)
5. Verify KV store is accessible

---

## Final Checklist

Before considering setup complete:

- [ ] JWT validation turned OFF in Supabase dashboard
- [ ] Environment variables verified in Edge Functions
- [ ] Test sign in → custom token returned
- [ ] Test authenticated request → success
- [ ] Test sign out → token deleted
- [ ] Frontend sign in works
- [ ] Frontend dashboard loads
- [ ] Edge Function logs show custom auth messages
- [ ] No "Invalid JWT" errors in logs

---

## Summary

**What You Need to Do:**
1. ⚠️ **Turn OFF JWT validation** in Supabase Dashboard (Authentication → JWT Settings)
2. ✅ Deploy the code (already done)
3. ✅ Test thoroughly
4. ✅ Monitor logs

**What's Already Done:**
- ✅ Custom authentication logic
- ✅ Token generation and validation
- ✅ All endpoints updated
- ✅ Documentation complete
- ✅ Frontend compatible

**Status:** 🎯 Ready to deploy! Just turn OFF JWT validation in Supabase dashboard.

---

**Last Updated:** March 30, 2024
