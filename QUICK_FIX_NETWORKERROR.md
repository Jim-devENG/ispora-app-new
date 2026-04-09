# Quick Fix: NetworkError After JWT Toggle Change

## 🔴 Current Problem
You're seeing these errors:
- `TypeError: NetworkError when attempting to fetch resource`
- `AuthRetryableFetchError: NetworkError`
- `Failed to load messages`

## ✅ Solution: The function needs to be REDEPLOYED

### Why?
The Edge Function code structure was updated to support custom JWT auth, but **the deployed version is still running the old code**. The NetworkError means the function isn't responding because it hasn't been redeployed with the new structure.

## 🚀 How to Fix (Choose ONE method)

### Method 1: Figma Make Deploy Button (Easiest)
1. In Figma Make interface, look for the "Deploy" button
2. Click it to redeploy your Edge Function
3. Wait for deployment to complete (~30-60 seconds)
4. Refresh your app and try again

### Method 2: Supabase Dashboard
1. Go to: https://supabase.com/dashboard/project/xyqdwrqiduxpxmszwhwb/functions
2. Click on `make-server-b8526fa6`
3. Click the "Deploy" or "Redeploy" button
4. Wait for green checkmark/success message
5. Test your app

### Method 3: Supabase CLI (if installed)
```bash
supabase functions deploy make-server-b8526fa6
```

## 🧪 Verify the Fix

After redeploying, test these URLs in your browser or with curl:

### Test 1: Health Check
```
https://xyqdwrqiduxpxmszwhwb.supabase.co/functions/v1/make-server-b8526fa6/health
```
Expected: `{"status":"ok"}`

### Test 2: Diagnostic Endpoint
```
https://xyqdwrqiduxpxmszwhwb.supabase.co/functions/v1/make-server-b8526fa6/diagnostic
```
Expected: JSON with status, timestamp, and environment info

### Test 3: Your App
1. Sign out (if signed in)
2. Sign in again
3. Navigate to Messages or any other feature
4. Should work without NetworkError!

## 📋 Checklist

- [ ] JWT "Verify with legacy secret" toggle is OFF in Supabase dashboard
- [ ] Edge Function has been REDEPLOYED (using one of the methods above)
- [ ] Health endpoint returns `{"status":"ok"}`
- [ ] Diagnostic endpoint returns environment info
- [ ] App sign-in works
- [ ] Messages and other features load without NetworkError

## ❓ Still Not Working?

If you still get NetworkError after redeployment:

1. **Check Function Logs**
   - Go to: https://supabase.com/dashboard/project/xyqdwrqiduxpxmszwhwb/functions/make-server-b8526fa6/logs
   - Look for errors in red
   - Share any error messages

2. **Verify Environment Variables** (should be automatic)
   - `SUPABASE_URL` ✓
   - `SUPABASE_SERVICE_ROLE_KEY` ✓
   - `SUPABASE_ANON_KEY` ✓

3. **Check Function Status**
   - In Supabase dashboard, function should show "Active" or "Deployed"
   - If showing "Error" or "Failed", check logs

4. **Try Redeploying Again**
   - Sometimes the first deployment doesn't complete properly
   - Redeploy a second time

## 🎯 What's Different Now?

### Before (With JWT Toggle ON)
```
Browser → Edge Function Gateway (JWT check) ❌ Invalid JWT → Function never reached
```

### After (With JWT Toggle OFF + Redeployed)
```
Browser → Edge Function Gateway → Your Function Code → Custom JWT Validation ✅
```

## 💡 Key Points

1. **Code changes are already complete** ✅
2. **You just need to REDEPLOY** the function
3. **JWT toggle should be OFF** in dashboard
4. **No frontend changes needed** - it already sends correct tokens

The NetworkError will disappear once the function is redeployed with the updated code!

---

## 🆘 Emergency Fallback

If redeployment keeps failing, you can temporarily:

1. Turn JWT toggle back ON
2. But this will bring back the "Invalid JWT" error
3. So redeployment is the proper solution

The redeployment MUST happen for the custom JWT auth to work properly!
