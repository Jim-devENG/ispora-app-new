# Edge Function Deployment Guide - JWT Custom Auth

## ✅ Code Changes Complete

All necessary code changes have been made to support custom JWT authentication with the "Verify JWT" toggle OFF.

## 🔧 Required Supabase Dashboard Configuration

### Step 1: Turn OFF JWT Verification

1. Go to: https://supabase.com/dashboard/project/xyqdwrqiduxpxmszwhwb/functions
2. Find the `make-server-b8526fa6` function
3. **Turn OFF** the "Verify JWT with legacy secret" toggle
4. Click "Save" or "Update"

### Step 2: Redeploy the Edge Function

Since the function structure has been updated, you need to redeploy it:

**Option A: Via Supabase Dashboard**
1. Go to Edge Functions page
2. Click on `make-server-b8526fa6`
3. Click "Deploy" or "Redeploy"
4. Wait for deployment to complete

**Option B: Via CLI (if you have Supabase CLI installed)**
```bash
supabase functions deploy make-server-b8526fa6
```

**Option C: Via Figma Make "Deploy" button**
- Use Figma Make's built-in deployment button to redeploy the function

### Step 3: Verify Deployment

Test the health endpoint:
```bash
curl https://xyqdwrqiduxpxmszwhwb.supabase.co/functions/v1/make-server-b8526fa6/health
```

Expected response:
```json
{"status":"ok"}
```

## 🎯 What Changed

### 1. Entry Point Structure (`/supabase/functions/make-server-b8526fa6/index.ts`)
- Added proper error handling wrapper
- Ensures function responds even if there are initialization errors
- Added startup logging for debugging

### 2. Server Initialization (`/supabase/functions/server/index.tsx`)
- Removed blocking `await` on bucket initialization (was preventing function startup)
- Made bucket initialization non-blocking (runs in background)
- Added proper export for Edge Function deployment

### 3. Authentication Flow (No Changes Needed)
Your authentication is already correctly implemented:
- ✅ Public endpoints (signup/signin) send anon key
- ✅ Protected endpoints send user JWT
- ✅ Custom validation in `authenticateUser` function
- ✅ Proper error handling for expired/invalid tokens

## 🔍 Troubleshooting

### If you still get NetworkError after redeployment:

1. **Check Function Logs**
   - Go to: https://supabase.com/dashboard/project/xyqdwrqiduxpxmszwhwb/functions/make-server-b8526fa6/logs
   - Look for startup errors or runtime errors

2. **Verify Environment Variables**
   Ensure these are set in your Edge Function:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_ANON_KEY`

3. **Test with curl**
   ```bash
   # Test health endpoint (no auth required)
   curl https://xyqdwrqiduxpxmszwhwb.supabase.co/functions/v1/make-server-b8526fa6/health
   
   # Test with anon key (signup endpoint)
   curl -X POST https://xyqdwrqiduxpxmszwhwb.supabase.co/functions/v1/make-server-b8526fa6/auth/signup \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test123","firstName":"Test","lastName":"User","role":"student"}'
   ```

4. **Check CORS**
   The function should respond with proper CORS headers. Verify in browser network tab.

## 📊 How Authentication Works Now

```
Frontend                    Edge Function                 Supabase Auth
   |                              |                            |
   |-- signIn(email, pass) ------>|                            |
   |                              |--- validateUser ---------> |
   |                              |<-- JWT access_token ------ |
   |<-- accessToken, user --------|                            |
   |                              |                            |
   |-- API call with JWT -------->|                            |
   |                              |--- authenticateUser() ---> |
   |                              |    (validates JWT)         |
   |                              |<-- user object ----------- |
   |<-- API response -------------|                            |
```

### Key Points:
- ✅ No automatic JWT verification at gateway (toggle OFF)
- ✅ All requests reach your function code
- ✅ Your `authenticateUser()` validates JWTs manually
- ✅ Public endpoints work with anon key
- ✅ Protected endpoints require valid user JWT

## 🎉 Expected Behavior After Deployment

Once deployed with JWT toggle OFF:

1. **Signup**: Works with anon key
2. **Signin**: Returns Supabase JWT access token
3. **Protected endpoints**: Validate JWT in function code
4. **No more "Invalid JWT" errors** from automatic verification
5. **All 78+ endpoints** work correctly with custom auth logic

## ⚠️ Important Notes

- **DO NOT** turn the JWT toggle back ON - it causes the persistent JWT errors
- **Environment variables** are automatically provided by Supabase
- **No code changes needed** on frontend - it already sends correct tokens
- **Session management** works via Supabase's standard JWT tokens

## 🚀 Next Steps

1. Turn OFF JWT toggle in dashboard
2. Redeploy the function
3. Test the application
4. Check function logs if issues persist

The code is ready - you just need to deploy with the new structure and toggle configuration!
