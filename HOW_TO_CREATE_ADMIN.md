# 🚀 How to Create Admin Account

## ❌ The Error You're Seeing

```
Supabase sign in error: AuthApiError: Invalid login credentials
```

**This means:** The admin account doesn't exist yet! You need to **SIGN UP first**, not sign in.

---

## ✅ STEP-BY-STEP: Create Your Admin Account

### **Step 1: Go to the Auth Page**
Navigate to: **`/auth`**

### **Step 2: Start the Sign Up Flow**
1. Click **"Join as a Mentor"** (or "Join as a Student" - doesn't matter!)
2. You'll see the role selection screen

### **Step 3: Fill in the Sign Up Form**
Enter these exact details:

| Field | Value |
|-------|-------|
| **First Name** | `Ispora` |
| **Last Name** | `Admin` |
| **Email** | `isporaproject@gmail.com` |
| **Password** | `iSpora@admin1234*` |

### **Step 4: Submit the Form**
Click the **"Continue"** or **"Sign Up"** button

### **Step 5: Automatic Magic! ✨**
The backend will automatically:
- ✅ Detect that the email is `isporaproject@gmail.com`
- ✅ Override the role to `admin` (not mentor/student)
- ✅ Skip the onboarding process
- ✅ Redirect you to `/admin`

---

## 🎯 After First Sign Up

Once you've created the account, you can **sign in** anytime with:
- **Email**: `isporaproject@gmail.com`
- **Password**: `iSpora@admin1234*`

And you'll be automatically redirected to the admin dashboard!

---

## 🔧 What's Happening Behind the Scenes

### **Backend Code** (`/supabase/functions/server/index.tsx`):

```typescript
// During Sign Up:
const finalRole = email === 'isporaproject@gmail.com' ? 'admin' : role;

// During Sign In:
if (email === 'isporaproject@gmail.com' && userProfile.role !== 'admin') {
  userProfile.role = 'admin';
  userProfile.onboardingComplete = true;
  await kv.set(`user:${data.user.id}`, userProfile);
}
```

### **Frontend Code** (`/src/app/components/AuthFlow.tsx`):

```typescript
// Auto-redirect admin to /admin
if (user.role === 'admin') {
  navigate('/admin');
  return;
}
```

---

## 📝 Quick Checklist

- [ ] Navigate to `/auth`
- [ ] Click "Join as a Mentor" or "Join as a Student"
- [ ] Fill in:
  - First Name: `Ispora`
  - Last Name: `Admin`
  - Email: `isporaproject@gmail.com`
  - Password: `iSpora@admin1234*`
- [ ] Click "Continue" or "Sign Up"
- [ ] Watch as you're automatically redirected to `/admin`!

---

## 🎉 That's It!

After signing up once, you can always sign in with the same credentials and you'll be taken straight to the admin dashboard!

**Don't click "Sign In" yet - click "Create Account" / "Join as a Mentor" first!**
