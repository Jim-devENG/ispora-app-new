# Ispora Platform - Backend API Documentation

## Overview

This document provides comprehensive documentation for the Ispora mentorship platform backend API. The API is built using Hono (edge functions) and Supabase, with data stored in a key-value store.

## Base URL

```
https://{projectId}.supabase.co/functions/v1/make-server-b8526fa6
```

## Authentication

Most endpoints require authentication via Bearer token in the Authorization header:

```
Authorization: Bearer {accessToken}
```

Get the access token from the signin endpoint and store it in localStorage.

---

## Authentication Endpoints

### POST `/auth/signup`

Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "diaspora" // or "student"
}
```

**Response:**
```json
{
  "success": true,
  "userId": "user_id_here",
  "message": "User created successfully"
}
```

---

### POST `/auth/signin`

Sign in to an existing account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "accessToken": "jwt_token_here",
  "refreshToken": "refresh_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "diaspora",
    "onboardingComplete": false
  }
}
```

---

### POST `/auth/signout`

Sign out from current session.

**Headers:** Requires Authorization

**Response:**
```json
{
  "success": true,
  "message": "Signed out successfully"
}
```

---

### GET `/auth/session`

Get current user session.

**Headers:** Requires Authorization

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "diaspora",
    "onboardingComplete": true
  }
}
```

---

### POST `/auth/update-profile`

Update user profile (used for onboarding).

**Headers:** Requires Authorization

**Request Body:**
```json
{
  "profileData": {
    "bio": "Software engineer with 8 years experience",
    "company": "Barclays",
    "jobTitle": "Senior Software Engineer",
    "location": "London, UK",
    "expertise": ["React", "Node.js", "TypeScript"],
    "mentorshipAreas": ["Career Development", "Technical Skills"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "user": { /* updated user object */ },
  "message": "Profile updated successfully"
}
```

---

### POST `/auth/reset-password`

Request password reset (email functionality requires Supabase email configuration).

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset instructions sent to email"
}
```

---

## User Endpoints

### GET `/users/:userId`

Get user profile by ID.

**Headers:** Requires Authorization

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "firstName": "John",
    "lastName": "Doe",
    "role": "diaspora",
    "company": "Barclays",
    "jobTitle": "Senior Software Engineer",
    "bio": "Software engineer with 8 years experience"
  }
}
```

---

### PUT `/users/:userId`

Update user profile (can only update own profile).

**Headers:** Requires Authorization

**Request Body:**
```json
{
  "bio": "Updated bio",
  "jobTitle": "Lead Software Engineer",
  "expertise": ["React", "Node.js", "TypeScript", "AWS"]
}
```

**Response:**
```json
{
  "success": true,
  "user": { /* updated user object */ }
}
```

---

### GET `/users/browse/students`

Browse all students (for mentors).

**Headers:** Requires Authorization

**Response:**
```json
{
  "success": true,
  "students": [
    {
      "id": "student_id",
      "firstName": "Jane",
      "lastName": "Smith",
      "university": "University of Lagos",
      "fieldOfStudy": "Computer Science",
      "yearOfStudy": "3rd Year"
    }
  ]
}
```

---

### GET `/users/browse/mentors`

Browse all mentors (for students).

**Headers:** Requires Authorization

**Response:**
```json
{
  "success": true,
  "mentors": [
    {
      "id": "mentor_id",
      "firstName": "John",
      "lastName": "Doe",
      "company": "Barclays",
      "jobTitle": "Senior Software Engineer",
      "expertise": ["React", "Node.js"]
    }
  ]
}
```

---

## Mentorship Request Endpoints

### POST `/requests`

Create a mentorship request.

**Headers:** Requires Authorization

**Request Body:**
```json
{
  "mentorId": "mentor_user_id",
  "message": "I would love to learn about fintech and your career journey..."
}
```

**Response:**
```json
{
  "success": true,
  "request": {
    "id": "req_123",
    "studentId": "student_id",
    "mentorId": "mentor_id",
    "message": "I would love to learn...",
    "status": "pending",
    "createdAt": "2024-03-27T10:00:00Z"
  }
}
```

---

### GET `/requests`

Get all mentorship requests (sent or received).

**Headers:** Requires Authorization

**Query Parameters:**
- `type` (optional): `sent` or `received`

**Response:**
```json
{
  "success": true,
  "requests": [
    {
      "id": "req_123",
      "studentId": "student_id",
      "mentorId": "mentor_id",
      "message": "I would love to learn...",
      "status": "pending",
      "createdAt": "2024-03-27T10:00:00Z",
      "student": {
        "id": "student_id",
        "firstName": "Jane",
        "lastName": "Smith"
      },
      "mentor": {
        "id": "mentor_id",
        "firstName": "John",
        "lastName": "Doe"
      }
    }
  ]
}
```

---

### GET `/requests/:requestId`

Get single mentorship request.

**Headers:** Requires Authorization

**Response:**
```json
{
  "success": true,
  "request": {
    "id": "req_123",
    "studentId": "student_id",
    "mentorId": "mentor_id",
    "message": "I would love to learn...",
    "status": "pending",
    "createdAt": "2024-03-27T10:00:00Z",
    "student": { /* student details */ },
    "mentor": { /* mentor details */ }
  }
}
```

---

### POST `/requests/:requestId/accept`

Accept a mentorship request (mentor only).

**Headers:** Requires Authorization

**Response:**
```json
{
  "success": true,
  "mentorship": {
    "id": "mentorship_123",
    "mentorId": "mentor_id",
    "studentId": "student_id",
    "status": "active",
    "startedAt": "2024-03-27T10:00:00Z",
    "requestId": "req_123"
  }
}
```

---

### POST `/requests/:requestId/decline`

Decline a mentorship request (mentor only).

**Headers:** Requires Authorization

**Request Body:**
```json
{
  "reason": "Current capacity full"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Request declined"
}
```

---

## Mentorship Endpoints

### GET `/mentorships`

Get all mentorships for current user.

**Headers:** Requires Authorization

**Response:**
```json
{
  "success": true,
  "mentorships": [
    {
      "id": "mentorship_123",
      "mentorId": "mentor_id",
      "studentId": "student_id",
      "status": "active",
      "startedAt": "2024-03-27T10:00:00Z",
      "student": {
        "id": "student_id",
        "firstName": "Jane",
        "lastName": "Smith",
        "university": "University of Lagos"
      },
      "mentor": {
        "id": "mentor_id",
        "firstName": "John",
        "lastName": "Doe",
        "company": "Barclays"
      }
    }
  ]
}
```

---

### GET `/mentorships/:mentorshipId`

Get single mentorship.

**Headers:** Requires Authorization

**Response:**
```json
{
  "success": true,
  "mentorship": {
    "id": "mentorship_123",
    "mentorId": "mentor_id",
    "studentId": "student_id",
    "status": "active",
    "startedAt": "2024-03-27T10:00:00Z",
    "student": { /* full student details */ },
    "mentor": { /* full mentor details */ }
  }
}
```

---

### POST `/mentorships/:mentorshipId/end`

End a mentorship.

**Headers:** Requires Authorization

**Response:**
```json
{
  "success": true,
  "message": "Mentorship ended"
}
```

---

## Opportunities Endpoints

### POST `/opportunities`

Create a new opportunity.

**Headers:** Requires Authorization

**Request Body:**
```json
{
  "title": "Software Engineering Intern",
  "company": "Google",
  "type": "internship",
  "location": "London, UK",
  "locationType": "hybrid",
  "description": "Exciting internship opportunity...",
  "requirements": ["Python", "Data Structures"],
  "deadline": "2024-05-01",
  "applicationUrl": "https://careers.google.com/apply"
}
```

**Response:**
```json
{
  "success": true,
  "opportunity": {
    "id": "opp_123",
    "title": "Software Engineering Intern",
    "company": "Google",
    "type": "internship",
    "location": "London, UK",
    "postedBy": "user_id",
    "status": "active",
    "createdAt": "2024-03-27T10:00:00Z",
    "bookmarkedBy": []
  }
}
```

---

### GET `/opportunities`

Get all opportunities with optional filtering.

**Headers:** Requires Authorization

**Query Parameters:**
- `type` (optional): `internship`, `job`, `scholarship`, `other`, or `all`
- `search` (optional): Search text

**Response:**
```json
{
  "success": true,
  "opportunities": [
    {
      "id": "opp_123",
      "title": "Software Engineering Intern",
      "company": "Google",
      "type": "internship",
      "location": "London, UK",
      "poster": {
        "id": "user_id",
        "firstName": "John",
        "lastName": "Doe"
      }
    }
  ]
}
```

---

### GET `/opportunities/:opportunityId`

Get single opportunity.

**Headers:** Requires Authorization

**Response:**
```json
{
  "success": true,
  "opportunity": {
    "id": "opp_123",
    "title": "Software Engineering Intern",
    "company": "Google",
    "type": "internship",
    "location": "London, UK",
    "description": "Exciting internship opportunity...",
    "requirements": ["Python", "Data Structures"],
    "deadline": "2024-05-01",
    "applicationUrl": "https://careers.google.com/apply",
    "poster": { /* poster details */ }
  }
}
```

---

### POST `/opportunities/:opportunityId/bookmark`

Bookmark an opportunity.

**Headers:** Requires Authorization

**Response:**
```json
{
  "success": true,
  "message": "Opportunity bookmarked"
}
```

---

### DELETE `/opportunities/:opportunityId/bookmark`

Remove bookmark from an opportunity.

**Headers:** Requires Authorization

**Response:**
```json
{
  "success": true,
  "message": "Bookmark removed"
}
```

---

### GET `/opportunities/bookmarked/me`

Get current user's bookmarked opportunities.

**Headers:** Requires Authorization

**Response:**
```json
{
  "success": true,
  "opportunities": [ /* array of bookmarked opportunities */ ]
}
```

---

## Sessions Endpoints

### POST `/sessions`

Create a session booking.

**Headers:** Requires Authorization

**Request Body:**
```json
{
  "mentorshipId": "mentorship_123",
  "scheduledAt": "2024-04-01T14:00:00Z",
  "duration": 60,
  "topic": "Career planning discussion",
  "notes": "Prepare questions about UK job market"
}
```

**Response:**
```json
{
  "success": true,
  "session": {
    "id": "session_123",
    "mentorshipId": "mentorship_123",
    "mentorId": "mentor_id",
    "studentId": "student_id",
    "scheduledAt": "2024-04-01T14:00:00Z",
    "duration": 60,
    "topic": "Career planning discussion",
    "status": "scheduled",
    "createdAt": "2024-03-27T10:00:00Z"
  }
}
```

---

### GET `/sessions`

Get all sessions for current user.

**Headers:** Requires Authorization

**Response:**
```json
{
  "success": true,
  "sessions": [
    {
      "id": "session_123",
      "mentorshipId": "mentorship_123",
      "scheduledAt": "2024-04-01T14:00:00Z",
      "duration": 60,
      "topic": "Career planning discussion",
      "status": "scheduled",
      "student": { /* student details */ },
      "mentor": { /* mentor details */ }
    }
  ]
}
```

---

### PUT `/sessions/:sessionId`

Update a session.

**Headers:** Requires Authorization

**Request Body:**
```json
{
  "scheduledAt": "2024-04-01T15:00:00Z",
  "topic": "Updated topic"
}
```

**Response:**
```json
{
  "success": true,
  "session": { /* updated session */ }
}
```

---

### POST `/sessions/:sessionId/cancel`

Cancel a session.

**Headers:** Requires Authorization

**Response:**
```json
{
  "success": true,
  "message": "Session cancelled"
}
```

---

## Messages Endpoints

### POST `/messages`

Send a message.

**Headers:** Requires Authorization

**Request Body:**
```json
{
  "mentorshipId": "mentorship_123",
  "content": "Hello! Looking forward to our session."
}
```

**Response:**
```json
{
  "success": true,
  "message": {
    "id": "msg_123",
    "mentorshipId": "mentorship_123",
    "senderId": "user_id",
    "receiverId": "other_user_id",
    "content": "Hello! Looking forward to our session.",
    "read": false,
    "createdAt": "2024-03-27T10:00:00Z"
  }
}
```

---

### GET `/messages`

Get messages for a mentorship.

**Headers:** Requires Authorization

**Query Parameters:**
- `mentorshipId` (required): The mentorship ID

**Response:**
```json
{
  "success": true,
  "messages": [
    {
      "id": "msg_123",
      "mentorshipId": "mentorship_123",
      "senderId": "user_id",
      "content": "Hello! Looking forward to our session.",
      "read": false,
      "createdAt": "2024-03-27T10:00:00Z",
      "sender": {
        "id": "user_id",
        "firstName": "John",
        "lastName": "Doe"
      }
    }
  ]
}
```

---

### PUT `/messages/:messageId/read`

Mark a message as read.

**Headers:** Requires Authorization

**Response:**
```json
{
  "success": true,
  "message": "Message marked as read"
}
```

---

## Notifications Endpoints

### GET `/notifications`

Get all notifications for current user.

**Headers:** Requires Authorization

**Response:**
```json
{
  "success": true,
  "notifications": [
    {
      "id": "notif_123",
      "userId": "user_id",
      "type": "mentorship_request",
      "title": "New mentorship request",
      "message": "You have a new mentorship request",
      "read": false,
      "createdAt": "2024-03-27T10:00:00Z",
      "data": { "requestId": "req_123" }
    }
  ]
}
```

---

### PUT `/notifications/:notificationId/read`

Mark a notification as read.

**Headers:** Requires Authorization

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

---

### PUT `/notifications/read-all`

Mark all notifications as read.

**Headers:** Requires Authorization

**Response:**
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

---

## Settings Endpoints

### GET `/settings`

Get user settings.

**Headers:** Requires Authorization

**Response:**
```json
{
  "success": true,
  "settings": {
    "notifications": {
      "email": true,
      "push": true,
      "sms": false
    },
    "privacy": {
      "profileVisibility": "verified",
      "showInDirectory": true,
      "showEmployer": true
    },
    "preferences": {
      "theme": "light",
      "language": "en"
    }
  }
}
```

---

### PUT `/settings`

Update user settings.

**Headers:** Requires Authorization

**Request Body:**
```json
{
  "notifications": {
    "email": true,
    "push": false
  },
  "privacy": {
    "profileVisibility": "everyone"
  }
}
```

**Response:**
```json
{
  "success": true,
  "settings": { /* updated settings */ }
}
```

---

## Stats Endpoints

### GET `/stats/mentor`

Get mentor statistics.

**Headers:** Requires Authorization

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalMentorships": 12,
    "activeMentorships": 5,
    "totalSessions": 48,
    "completedSessions": 42,
    "pendingRequests": 3,
    "profileViews": 156,
    "impactScore": 260
  }
}
```

---

### GET `/stats/student`

Get student statistics.

**Headers:** Requires Authorization

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalMentorships": 2,
    "activeMentorships": 1,
    "totalSessions": 8,
    "upcomingSessions": 2,
    "pendingRequests": 1,
    "opportunitiesApplied": 5
  }
}
```

---

## Error Responses

All endpoints return errors in the following format:

```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad Request (missing or invalid parameters)
- `401` - Unauthorized (missing or invalid authentication)
- `403` - Forbidden (user doesn't have permission)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

---

## Data Models

### Key-Value Store Structure

Data is stored in the KV store with the following key patterns:

- `user:{userId}` - User profile data
- `request:{requestId}` - Mentorship request
- `mentorship:{mentorshipId}` - Mentorship relationship
- `session:{sessionId}` - Session booking
- `message:{messageId}` - Message
- `opportunity:{opportunityId}` - Opportunity posting
- `notification:{notificationId}` - Notification
- `settings:{userId}` - User settings

### Querying by Prefix

The API uses `kv.getByPrefix()` to query data efficiently:

```typescript
// Get all mentorships
const allMentorships = await kv.getByPrefix('mentorship:');

// Filter user-specific mentorships
const userMentorships = allMentorships.filter(
  (m) => m.mentorId === userId || m.studentId === userId
);
```

---

## Frontend Integration

### Using the API Client

The frontend includes a comprehensive API client at `/src/app/lib/api.ts`:

```typescript
import api from '@/lib/api';

// Example: Sign in
const response = await api.auth.signin({
  email: 'user@example.com',
  password: 'password123'
});

// Example: Get mentorships
const { mentorships } = await api.mentorship.getAll();

// Example: Create opportunity
const opportunity = await api.opportunity.create({
  title: 'Software Engineering Intern',
  company: 'Google',
  type: 'internship',
  location: 'London, UK',
  description: '...'
});
```

---

## Best Practices

1. **Always validate input** - Check for required fields before making API calls
2. **Handle errors gracefully** - Display user-friendly error messages
3. **Store tokens securely** - Use localStorage for access tokens
4. **Refresh tokens** - Implement token refresh logic for better UX
5. **Optimize queries** - Use query parameters to filter data on the server
6. **Enrich data** - The API automatically enriches responses with related user data

---

## Future Enhancements

Potential backend improvements:

1. **Real-time updates** - WebSocket support for live messages/notifications
2. **File uploads** - Support for profile pictures and documents
3. **Search indexing** - Full-text search for opportunities and users
4. **Analytics** - Detailed analytics and reporting
5. **Email notifications** - Integration with email service
6. **Rate limiting** - Protect against abuse
7. **Caching** - Improve performance with Redis/caching layer
8. **Data validation** - Schema validation with Zod or similar

---

## Support

For questions or issues with the API, please contact the development team or refer to the main project documentation.
