# Custom Authentication System - Implementation Guide

## Overview

This document explains the custom authentication system implemented for Ispora. The system uses **custom session tokens stored in KV store** instead of relying on Supabase's JWT validation. This approach gives you full control over authentication and bypasses any issues with Supabase's "Verify JWT with legacy secret" toggle.

## Why Custom Authentication?

**Problem:** Supabase's "Verify JWT with legacy secret" toggle was automatically turning itself back ON, causing persistent "Invalid JWT" errors.

**Solution:** Turn OFF JWT validation completely and implement custom auth logic in the Edge Function code. This gives you:
- ✅ Full control over token validation
- ✅ No dependency on Supabase JWT settings
- ✅ Ability to customize session duration
- ✅ Better session management
- ✅ Backward compatibility with Supabase JWTs (fallback)

## Architecture

### How It Works

1. **User Signs In** → Supabase validates credentials → Custom session token generated → Token stored in KV → Token returned to client
2. **User Makes Request** → Custom token sent in Authorization header → Token validated against KV store → User authenticated
3. **User Signs Out** → Custom token deleted from KV store → User logged out

### Token Format

Custom session tokens follow this format:
```
ispora_session_{timestamp}_{random_string}
```

Example:
```
ispora_session_1234567890123_abc123def456gh
```

## Implementation Details

### 1. Authentication Function (`authenticateUser`)

Location: `/supabase/functions/server/index.tsx` (lines 36-138)

**Flow:**
```typescript
1. Extract token from Authorization header
2. Check if token starts with "ispora_session_"
   - YES: Validate against KV store
     - Check if token exists
     - Check if token has expired
     - Return user data from KV
   - NO: Fallback to Supabase JWT validation (backward compatibility)
```

**Key Features:**
- ✅ Validates custom session tokens from KV store
- ✅ Checks token expiration
- ✅ Updates last active timestamp
- ✅ Falls back to Supabase JWT for backward compatibility
- ✅ Returns user object matching Supabase structure

### 2. Sign In Endpoint

**Endpoint:** `POST /auth/signin`

**What Changed:**
- Still uses Supabase to validate email/password
- Generates custom session token instead of returning Supabase JWT
- Stores token in KV store with 30-day expiration
- Returns custom token to client

**Response:**
```json
{
  "success": true,
  "accessToken": "ispora_session_1234567890123_abc123def456gh",
  "refreshToken": "ispora_session_1234567890123_abc123def456gh",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "diaspora"
  }
}
```

### 3. Sign Out Endpoint

**Endpoint:** `POST /auth/signout`

**What Changed:**
- Detects custom session tokens
- Deletes token from KV store
- Falls back to Supabase signout for JWT tokens

### 4. Refresh Token Endpoint

**Endpoint:** `POST /auth/refresh`

**New endpoint** for refreshing session tokens before they expire.

**Request:**
```json
{
  "refreshToken": "ispora_session_1234567890123_abc123def456gh"
}
```

**Response:**
```json
{
  "success": true,
  "accessToken": "ispora_session_1234567890123_new_token",
  "refreshToken": "ispora_session_1234567890123_new_token"
}
```

## Frontend Integration

### No Changes Required!

The frontend code doesn't need to be updated because:
- Sign in endpoint returns `accessToken` (now contains custom token)
- Token is stored in localStorage as `ispora_accessToken`
- Token is sent in `Authorization: Bearer {token}` header
- All API calls work exactly the same way

### How Frontend Uses Tokens

From `/src/app/utils/api.ts`:
```typescript
// Token is stored after sign in
localStorage.setItem('ispora_accessToken', response.accessToken);

// Token is sent with every API request
headers: {
  'Authorization': `Bearer ${localStorage.getItem('ispora_accessToken')}`,
  'Content-Type': 'application/json'
}
```

## Session Management

### Session Data Structure

Stored in KV as `ispora_session_{token}`:
```typescript
{
  userId: "user-id",
  email: "user@example.com",
  createdAt: "2024-03-30T12:00:00.000Z",
  expiresAt: "2024-04-29T12:00:00.000Z",  // 30 days
  lastActiveAt: "2024-03-30T14:30:00.000Z"
}
```

### Session Duration

- Default: 30 days
- Configurable via `createSessionData()` function
- Can be extended on refresh

### Session Cleanup

Expired tokens are:
- Rejected during authentication
- Automatically deleted from KV when detected
- Should be cleaned up periodically (consider adding a cleanup job)

## Security Considerations

### ✅ What's Secure

1. **Token Randomness:** Tokens include timestamp + 16-char random string
2. **Token Expiration:** Sessions expire after 30 days
3. **Validation:** Every request validates token against KV store
4. **No Token Reuse:** Refresh generates new token and deletes old one
5. **Supabase Credentials:** Still validated via Supabase auth

### ⚠️ Recommendations

1. **HTTPS Only:** Always use HTTPS in production
2. **Token Storage:** Frontend stores tokens in localStorage (consider httpOnly cookies for enhanced security)
3. **Rate Limiting:** Add rate limiting to prevent brute force attacks
4. **Token Cleanup:** Implement periodic cleanup of expired tokens from KV
5. **IP Validation:** Consider adding IP address validation for additional security

## Supabase Dashboard Settings

### Required Configuration

1. **Authentication → JWT Settings**
   - ✅ Turn **OFF** "Verify JWT with legacy secret"
   - This is now safe because we're not relying on Supabase JWT validation

2. **Edge Functions → Environment Variables**
   - Ensure these are set:
     - `SUPABASE_URL`
     - `SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`

## Testing the System

### 1. Test Sign In

```bash
curl -X POST https://your-project.supabase.co/functions/v1/make-server-b8526fa6/auth/signin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Expected Response:** Custom session token in `accessToken` field

### 2. Test Authenticated Request

```bash
curl -X GET https://your-project.supabase.co/functions/v1/make-server-b8526fa6/auth/session \
  -H "Authorization: Bearer ispora_session_1234567890123_abc123def456gh"
```

**Expected Response:** User profile data

### 3. Test Sign Out

```bash
curl -X POST https://your-project.supabase.co/functions/v1/make-server-b8526fa6/auth/signout \
  -H "Authorization: Bearer ispora_session_1234567890123_abc123def456gh"
```

**Expected Response:** Success message

## Monitoring & Debugging

### Log Messages

The authentication function logs detailed information:

```
=== Custom Authentication (JWT validation OFF) ===
✓ Custom session token detected
✓ Session token valid for user: {userId}
✓ User authenticated via custom session token: {userId}
```

### Common Issues

**Issue:** "Invalid or expired session"
- **Cause:** Token not found in KV store or expired
- **Solution:** Sign in again to get new token

**Issue:** "User authentication required"
- **Cause:** Anon key sent instead of session token
- **Solution:** Use session token from signin response

## Migration Path

### From JWT to Custom Tokens

1. ✅ **Already Done:** Custom auth logic implemented
2. ✅ **Already Done:** Sign in generates custom tokens
3. **In Progress:** Users with JWT tokens will get custom tokens on next sign in
4. **Future:** All users will use custom tokens

### Backward Compatibility

The system maintains backward compatibility:
- JWT tokens are still validated (fallback)
- Gradually migrates users to custom tokens
- No breaking changes for existing sessions

## Helper Functions

### `generateSessionToken()`
Creates a new custom session token with format `ispora_session_{timestamp}_{random}`

### `createSessionData(userId, email, daysValid)`
Creates session data object with expiration date

**Parameters:**
- `userId`: User's ID
- `email`: User's email
- `daysValid`: Number of days token is valid (default: 30)

## Endpoints Summary

| Endpoint | Method | Auth Required | Purpose |
|----------|--------|---------------|---------|
| `/auth/signup` | POST | No | Create new user account |
| `/auth/signin` | POST | No | Sign in and get custom token |
| `/auth/signout` | POST | Yes | Sign out and delete token |
| `/auth/refresh` | POST | No | Refresh session token |
| `/auth/session` | GET | Yes | Get current user session |
| All other endpoints | * | Yes | Validated with custom tokens |

## Next Steps

1. ✅ **Implemented:** Custom authentication system
2. ✅ **Implemented:** Token generation and validation
3. ✅ **Implemented:** Sign in/out with custom tokens
4. ✅ **Implemented:** Refresh token endpoint
5. 🔄 **Recommended:** Test thoroughly with frontend
6. 🔄 **Recommended:** Monitor logs for any issues
7. 🔄 **Recommended:** Add periodic token cleanup job
8. 🔄 **Recommended:** Consider adding IP validation
9. 🔄 **Recommended:** Implement rate limiting

## Support

If you encounter any issues:
1. Check Edge Function logs in Supabase dashboard
2. Look for authentication log messages
3. Verify token format (should start with `ispora_session_`)
4. Ensure KV store is accessible
5. Check token hasn't expired

---

**Status:** ✅ Fully Implemented & Ready to Use

**Last Updated:** March 30, 2024
