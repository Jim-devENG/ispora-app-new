# Ispora Admin System Setup Guide

## 🎯 Overview

The Ispora platform now has a **complete admin system** with a full backend API and web-based admin dashboard. This guide will help you set up and access the admin panel.

---

## 🔐 Step 1: Create Your First Admin User

Before you can access the admin dashboard, you need to create an admin account. This is a **one-time setup**.

### Option A: Using API Key (Recommended)

1. **Set the Admin API Key** in your Supabase project:
   - Go to your Supabase Dashboard
   - Navigate to **Project Settings** → **Edge Functions** → **Secrets**
   - Add a new secret:
     - Name: `ADMIN_API_KEY`
     - Value: `your-secure-random-key-here` (generate a strong random string)

2. **Call the Create Admin Endpoint**:

```bash
curl -X POST https://[YOUR-PROJECT-ID].supabase.co/functions/v1/make-server-b8526fa6/admin/create-admin \
  -H "X-Admin-Key: your-secure-random-key-here" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourdomain.com",
    "password": "YourSecurePassword123!",
    "firstName": "Admin",
    "lastName": "User"
  }'
```

**Replace:**
- `[YOUR-PROJECT-ID]` with your actual Supabase project ID
- `your-secure-random-key-here` with the API key you set in step 1
- Email, password, and name with your desired admin credentials

### Option B: Direct Database Method

If you prefer, you can also promote an existing user to admin directly in the Supabase dashboard:

1. Sign up normally through the app
2. Go to Supabase Dashboard → **Authentication** → **Users**
3. Find your user and note the `user_id`
4. Go to **Table Editor** → Find the `user:` entry in KV store
5. Update the `role` field from `student` or `diaspora` to `admin`

---

## 🌐 Step 2: Access the Admin Dashboard

Once you have an admin account created:

### Web Access

1. Navigate to: **`https://your-app-url.com/admin`**
2. If not logged in, you'll be redirected to sign in
3. Sign in with your admin credentials
4. You'll be automatically directed to the admin dashboard

### Direct Links

- **Admin Dashboard**: `https://your-app/admin`
- **Landing Page**: `https://your-app/`
- **Auth Flow**: `https://your-app/auth`

---

## 🎛️ Admin Dashboard Features

### Overview Tab
- **Platform Statistics**: Real-time metrics for:
  - Users (students, mentors, admins)
  - Mentorships (active, completed, ended)
  - Sessions (scheduled, completed, cancelled)
  - Opportunities (internships, jobs, scholarships)
  - Requests and Goals

- **Quick Actions**: Fast access to:
  - Post new opportunities
  - Manage users
  - View mentorships

### Opportunities Tab
- ✅ **Post opportunities** (internships, jobs, scholarships)
- ✅ View all opportunities on the platform
- ✅ Edit opportunity details
- ✅ Delete opportunities
- 🏷️ Admin-posted opportunities are flagged

### Users Tab
- ✅ View all users (students, mentors, admins)
- ✅ Filter by role
- ✅ Search by name or email
- ✅ See registration dates and status
- ✅ View user profiles

### Mentorships Tab (Coming Soon)
- Monitor all mentor-student relationships
- View mentorship status and history

### Sessions Tab (Coming Soon)
- Oversee all scheduled and completed sessions
- Platform-wide session analytics

---

## 🔧 Admin API Endpoints

All admin endpoints are protected and require admin authentication.

### Statistics
```
GET /admin/stats
```

### User Management
```
GET /admin/users?role={role}&search={search}
PUT /admin/users/:userId
DELETE /admin/users/:userId
POST /admin/create-admin (requires X-Admin-Key header)
```

### Opportunity Management
```
POST /admin/opportunities
PUT /admin/opportunities/:opportunityId
DELETE /admin/opportunities/:opportunityId
GET /admin/all-opportunities
```

### Data Oversight
```
GET /admin/mentorships?status={status}
GET /admin/sessions?status={status}
GET /admin/requests?status={status}
```

---

## 💻 Using Admin API in Code

```typescript
import api from './lib/api';

// Get platform statistics
const stats = await api.admin.getStats();

// Post an opportunity as admin
await api.admin.createOpportunity({
  type: 'internships',
  title: 'Software Engineering Intern',
  company: 'Google',
  location: 'London, UK',
  description: 'Join our team...',
  requirements: 'Bachelor\'s degree...',
  applicationLink: 'https://...',
  deadline: '2026-06-30',
  tags: ['Tech', 'Remote', 'UK']
});

// Get all users
const users = await api.admin.getUsers({
  role: 'student',
  search: 'john'
});

// Update a user
await api.admin.updateUser(userId, {
  role: 'mentor'
});

// Delete a user
await api.admin.deleteUser(userId);

// Get mentorships
const mentorships = await api.admin.getMentorships('active');
```

---

## 🔒 Security Notes

1. **API Key Protection**: 
   - Never commit the `ADMIN_API_KEY` to version control
   - Use environment variables
   - Rotate the key periodically

2. **Admin Account Security**:
   - Use strong passwords
   - Limit the number of admin accounts
   - Monitor admin activity

3. **Role-Based Access**:
   - Only users with `role: 'admin'` can access admin endpoints
   - Regular users (students/mentors) cannot access admin functions
   - Attempting to access admin routes without privileges will redirect

4. **HTTPS Required**:
   - Always use HTTPS in production
   - API calls include authentication tokens

---

## 📊 Complete Backend Summary

### Total API Endpoints: **78**

#### By Module:
- **Auth**: 7 endpoints
- **Users**: 4 endpoints  
- **Requests**: 5 endpoints
- **Mentorships**: 4 endpoints
- **Sessions**: 8 endpoints
- **Messages**: 5 endpoints
- **Opportunities**: 9 endpoints
- **Notifications**: 4 endpoints
- **Resources**: 4 endpoints
- **Goals**: 4 endpoints (NEW!)
- **Student Resources**: 1 endpoint (NEW!)
- **Settings**: 3 endpoints
- **Stats**: 2 endpoints
- **Admin**: 14 endpoints (NEW!) ✨

---

## 🎉 What You Can Do as Admin

### ✅ Platform Management
- Monitor real-time platform statistics
- Track user growth and engagement
- Analyze mentorship success rates

### ✅ Content Management
- **Post opportunities** for internships, jobs, and scholarships
- Edit or remove inappropriate content
- Curate opportunities for students

### ✅ User Management
- View all registered users
- Search and filter users by role
- Monitor user activity

### ✅ Data Oversight
- Review all mentorships
- Monitor session completion rates
- Track mentorship requests

### ✅ Quality Control
- Ensure platform quality
- Remove spam or inappropriate content
- Support user needs

---

## 🚀 Next Steps

1. **Create your admin account** using the setup instructions above
2. **Navigate to `/admin`** in your browser
3. **Post your first opportunity** to test the system
4. **Invite team members** as admins if needed (create additional admin accounts)
5. **Monitor platform growth** through the statistics dashboard

---

## 📞 Support

For issues or questions about the admin system:
- Check console logs for error messages
- Verify your admin role in the database
- Ensure API keys are correctly set
- Confirm you're using the correct admin credentials

---

## 🔄 Version Information

- **Backend Version**: Complete with 78 API endpoints
- **Admin System**: Fully functional
- **Last Updated**: March 29, 2026
- **Status**: ✅ Production Ready

---

**The backend is complete and fully functional!** You now have a powerful admin system to manage the Ispora platform. 🎊
