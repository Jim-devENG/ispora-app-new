# Custom Authentication Flow Diagram

## Overview

This document provides visual flow diagrams for the custom authentication system.

---

## 1. Sign In Flow

```
┌─────────────┐
│   Frontend  │
│   (User)    │
└──────┬──────┘
       │
       │ POST /auth/signin
       │ { email, password }
       │ + Authorization: Bearer {ANON_KEY}
       │
       ▼
┌─────────────────────────────────────┐
│         Edge Function               │
│                                     │
│  1. Validate with Supabase Auth    │
│     (email/password check)          │
│                                     │
│  2. Generate custom token          │
│     ispora_session_{time}_{rand}   │
│                                     │
│  3. Store in KV:                   │
│     Key: ispora_session_XXX        │
│     Value: {                       │
│       userId, email,               │
│       createdAt, expiresAt,        │
│       lastActiveAt                 │
│     }                              │
│                                     │
│  4. Return custom token            │
└──────────┬──────────────────────────┘
           │
           │ Response:
           │ {
           │   accessToken: "ispora_session_XXX",
           │   user: { ... }
           │ }
           │
           ▼
    ┌──────────────┐
    │  Frontend    │
    │  Stores in   │
    │  localStorage│
    └──────────────┘
```

---

## 2. Authenticated Request Flow

```
┌─────────────┐
│   Frontend  │
└──────┬──────┘
       │
       │ GET /users/stats
       │ Authorization: Bearer ispora_session_XXX
       │
       ▼
┌─────────────────────────────────────────────┐
│         authenticateUser()                  │
│                                             │
│  1. Extract token from header              │
│     token = "ispora_session_XXX"           │
│                                             │
│  2. Check token format                     │
│     if starts with "ispora_session_":      │
│                                             │
│       ┌─────────────────────────┐          │
│       │  CUSTOM AUTH PATH       │          │
│       │                         │          │
│       │  3. Get from KV:        │          │
│       │     kv.get(token)       │          │
│       │                         │          │
│       │  4. Check if exists     │          │
│       │     ✓ or ✗              │          │
│       │                         │          │
│       │  5. Check expiration    │          │
│       │     if expired → 401    │          │
│       │     if valid → continue │          │
│       │                         │          │
│       │  6. Get user profile    │          │
│       │     kv.get(user:XXX)    │          │
│       │                         │          │
│       │  7. Update lastActive   │          │
│       │     kv.set(token, ...)  │          │
│       │                         │          │
│       │  8. Return user object  │          │
│       └─────────────────────────┘          │
│                                             │
│     else:                                  │
│       ┌─────────────────────────┐          │
│       │  FALLBACK (JWT) PATH    │          │
│       │                         │          │
│       │  3. Validate with       │          │
│       │     Supabase JWT        │          │
│       │     auth.getUser()      │          │
│       │                         │          │
│       │  4. Return user         │          │
│       └─────────────────────────┘          │
│                                             │
└──────────┬──────────────────────────────────┘
           │
           │ { user: {...} }
           │
           ▼
    ┌──────────────┐
    │  Process     │
    │  Request     │
    └──────────────┘
```

---

## 3. Sign Out Flow

```
┌─────────────┐
│   Frontend  │
└──────┬──────┘
       │
       │ POST /auth/signout
       │ Authorization: Bearer ispora_session_XXX
       │
       ▼
┌──────────────────────────────────┐
│     Edge Function                │
│                                  │
│  1. Extract token                │
│     token = "ispora_session_XXX" │
│                                  │
│  2. Check if custom token        │
│     if starts with "ispora_":    │
│                                  │
│       3. Delete from KV:         │
│          kv.del(token)           │
│                                  │
│       4. Return success          │
│                                  │
└──────────┬───────────────────────┘
           │
           │ { success: true }
           │
           ▼
    ┌──────────────┐
    │  Frontend    │
    │  Removes from│
    │  localStorage│
    │  Redirects   │
    └──────────────┘
```

---

## 4. Token Refresh Flow

```
┌─────────────┐
│   Frontend  │
│  (Optional) │
└──────┬──────┘
       │
       │ POST /auth/refresh
       │ { refreshToken: "ispora_session_XXX" }
       │
       ▼
┌──────────────────────────────────────┐
│         Edge Function                │
│                                      │
│  1. Get old token data from KV      │
│     oldData = kv.get(oldToken)      │
│                                      │
│  2. Validate old token exists       │
│                                      │
│  3. Generate new token              │
│     newToken = ispora_session_YYY   │
│                                      │
│  4. Create new session data         │
│     (30 days from now)              │
│                                      │
│  5. Store new token in KV           │
│     kv.set(newToken, newData)       │
│                                      │
│  6. Delete old token from KV        │
│     kv.del(oldToken)                │
│                                      │
│  7. Return new token                │
└──────────┬───────────────────────────┘
           │
           │ {
           │   accessToken: "ispora_session_YYY",
           │   refreshToken: "ispora_session_YYY"
           │ }
           │
           ▼
    ┌──────────────┐
    │  Frontend    │
    │  Updates     │
    │  localStorage│
    └──────────────┘
```

---

## 5. Token Validation Decision Tree

```
                    Token Received
                          |
                          ▼
              ┌───────────────────────┐
              │ Starts with           │
              │ "ispora_session_"?    │
              └───────────┬───────────┘
                          |
                ┌─────────┴─────────┐
                │                   │
               YES                 NO
                │                   │
                ▼                   ▼
    ┌──────────────────┐   ┌──────────────────┐
    │  Custom Token    │   │  JWT Token       │
    │  Validation      │   │  (Fallback)      │
    └────────┬─────────┘   └────────┬─────────┘
             │                      │
             ▼                      ▼
    ┌──────────────────┐   ┌──────────────────┐
    │ kv.get(token)    │   │ supabase.auth    │
    │                  │   │ .getUser()       │
    └────────┬─────────┘   └────────┬─────────┘
             │                      │
             ▼                      ▼
    ┌──────────────────┐   ┌──────────────────┐
    │ Token exists?    │   │ JWT valid?       │
    └────────┬─────────┘   └────────┬─────────┘
             │                      │
       ┌─────┴─────┐          ┌─────┴─────┐
       │           │          │           │
      YES         NO         YES         NO
       │           │          │           │
       ▼           ▼          ▼           ▼
    ┌──────┐   ┌──────┐   ┌──────┐   ┌──────┐
    │ Check│   │ 401  │   │Return│   │ 401  │
    │ Exp. │   │Error │   │User  │   │Error │
    └───┬──┘   └──────┘   └──────┘   └──────┘
        │
        ▼
    ┌────────────┐
    │ Expired?   │
    └─────┬──────┘
          │
    ┌─────┴─────┐
    │           │
   YES         NO
    │           │
    ▼           ▼
┌──────┐   ┌────────────┐
│ 401  │   │ Return User│
│Error │   │ + Update   │
└──────┘   │ lastActive │
           └────────────┘
```

---

## 6. Data Storage Structure

### KV Store Keys

```
Key Format                          Value
────────────────────────────────────────────────────────────
ispora_session_{timestamp}_{rand}   Session Data
user:{userId}                       User Profile
sessions:{userId}                   User's Session List
request:{requestId}                 Mentorship Request
mentorship:{mentorshipId}           Mentorship Data
session:{sessionId}                 Mentorship Session
notification:{notificationId}       Notification
resource:{resourceId}               Resource
donation:{donationId}               Donation
message:{messageId}                 Message
```

### Session Data Structure

```json
// Key: ispora_session_1234567890123_abc123def456gh
{
  "userId": "uuid-user-id",
  "email": "user@example.com",
  "createdAt": "2024-03-30T12:00:00.000Z",
  "expiresAt": "2024-04-29T12:00:00.000Z",
  "lastActiveAt": "2024-03-30T14:30:00.000Z"
}
```

### User Profile Structure

```json
// Key: user:uuid-user-id
{
  "id": "uuid-user-id",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "diaspora",
  "mentorType": "diaspora",
  "onboardingComplete": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-03-30T12:00:00.000Z"
}
```

---

## 7. Security Flow

```
┌──────────────────────────────────────────────────────────┐
│                    Security Layers                       │
└──────────────────────────────────────────────────────────┘

Layer 1: HTTPS Transport
─────────────────────────
All requests encrypted in transit

        ▼

Layer 2: Token Format Validation
─────────────────────────────────
Token must start with "ispora_session_"
Reject anon key, reject malformed tokens

        ▼

Layer 3: KV Store Lookup
────────────────────────
Token must exist in KV store
No token = No access

        ▼

Layer 4: Expiration Check
─────────────────────────
Token must not be expired
expiresAt > now()

        ▼

Layer 5: User Profile Validation
────────────────────────────────
User must exist in KV store
user:{userId} must be valid

        ▼

Layer 6: Role-Based Access (where applicable)
─────────────────────────────────────────────
Admin endpoints: role === 'admin'
Mentor endpoints: role === 'diaspora'
Student endpoints: role === 'student'

        ▼

✓ Request Authorized
```

---

## 8. Comparison: Old vs New System

### Old System (Supabase JWT)

```
┌─────────┐
│  Sign   │ → Supabase Auth → JWT Token
│   In    │                    │
└─────────┘                    │
                               ▼
                    ┌──────────────────┐
                    │  Edge Function   │
                    │  Validates JWT   │
                    │  via Supabase    │
                    └──────────────────┘
                               │
                               ▼
                    Problem: "Invalid JWT"
                    when toggle turns ON
```

### New System (Custom Tokens)

```
┌─────────┐
│  Sign   │ → Supabase Auth → Custom Token
│   In    │   (verify pwd)      │
└─────────┘                     │
                                ▼
                    ┌──────────────────┐
                    │    KV Store      │
                    │  Stores Token    │
                    └──────────────────┘
                                │
                                ▼
                    ┌──────────────────┐
                    │  Edge Function   │
                    │  Validates via   │
                    │  KV Lookup       │
                    └──────────────────┘
                                │
                                ▼
                    ✓ No JWT validation
                    ✓ Full control
```

---

## Key Differences

| Aspect | Old (JWT) | New (Custom) |
|--------|-----------|--------------|
| **Token Format** | Supabase JWT | `ispora_session_XXX` |
| **Validation** | Supabase auth.getUser() | KV store lookup |
| **Storage** | Supabase Auth | KV Store |
| **Expiration** | Supabase controlled | Custom (30 days) |
| **Control** | Supabase dashboard | Your code |
| **Issues** | Toggle resets | None |

---

## Summary

**How Custom Auth Works:**

1. **Sign In:** User credentials validated → Custom token generated → Stored in KV → Returned to frontend
2. **Requests:** Custom token sent → Looked up in KV → Validated → User authenticated
3. **Sign Out:** Custom token deleted from KV → User logged out
4. **Refresh:** Old token exchanged for new token → Old deleted → New stored

**Key Benefits:**

- ✅ No dependency on Supabase JWT validation
- ✅ No "Invalid JWT" errors
- ✅ Full control over token lifecycle
- ✅ Custom expiration (30 days)
- ✅ Easy to extend (add IP validation, device info, etc.)

---

**Last Updated:** March 30, 2024
