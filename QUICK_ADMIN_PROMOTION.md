# Quick Admin Promotion Guide

## ✅ CORS Issue Fixed!

The server now allows the `X-Admin-Key` header. Try `/admin-setup` again!

---

## Alternative: Manual Admin Promotion (If account already exists)

If `isporaproject@gmail.com` is already registered as a student or mentor, you can manually promote it to admin:

### Option 1: Using Supabase Dashboard (Easiest)

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your Ispora project**
3. **Navigate to**: Table Editor → `kv_store_b8526fa6` table
4. **Find the user entry**:
   - Look for a key starting with `user:` followed by a UUID
   - The value will be a JSON object containing the email
   - Find the one with `"email": "isporaproject@gmail.com"`
5. **Edit the entry**:
   - Click on the row to edit
   - In the JSON value, change `"role": "student"` (or `"diaspora"`) to `"role": "admin"`
   - Save the change
6. **Done!** Now sign in and go to `/admin`

### Option 2: Using SQL Editor

1. **Go to**: SQL Editor in Supabase Dashboard
2. **Run this query**:

```sql
-- First, find the user
SELECT * FROM kv_store_b8526fa6 
WHERE key LIKE 'user:%' 
AND value::jsonb->>'email' = 'isporaproject@gmail.com';

-- Copy the key from the result, then update:
UPDATE kv_store_b8526fa6
SET value = jsonb_set(value::jsonb, '{role}', '"admin"')
WHERE key = 'user:YOUR_USER_ID_HERE'  -- Replace with actual key
AND key LIKE 'user:%';
```

3. **Verify the change**:
```sql
SELECT * FROM kv_store_b8526fa6 
WHERE key LIKE 'user:%' 
AND value::jsonb->>'email' = 'isporaproject@gmail.com';
```

---

## 🎯 Steps After Promotion

1. **Sign out** (if currently signed in)
2. **Sign in again** with `isporaproject@gmail.com`
3. **Navigate to** `/admin`
4. **You're now an admin!** 🎉

---

## 🔧 What Was Fixed

✅ Added `X-Admin-Key` to CORS allowed headers
✅ Server now accepts custom headers for admin setup
✅ `/admin-setup` page should now work without CORS errors

---

## 📋 Summary

**Try this order**:
1. ✅ Try `/admin-setup` again (CORS is now fixed!)
2. If that fails, use manual promotion via Supabase Dashboard
3. Sign in and go to `/admin`

The backend is fully ready - just need to get your account promoted to admin! 🚀
