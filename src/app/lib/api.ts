import { projectId, publicAnonKey } from '/utils/supabase/info';
import { supabase } from '../utils/supabase';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-b8526fa6`;

// Cache for token refresh to prevent simultaneous calls
let tokenRefreshPromise: Promise<string | null> | null = null;
let lastTokenFetch: number = 0;
let cachedToken: string | null = null;
let cachedUserId: string | null = null; // Track which user the token belongs to
const TOKEN_CACHE_MS = 2000; // Cache token for 2 seconds to prevent multiple simultaneous refreshes

// Clear cache when user changes - call this on sign out or user change
export function clearApiCache() {
  cachedToken = null;
  cachedUserId = null;
  lastTokenFetch = 0;
  tokenRefreshPromise = null;
  console.log('API cache cleared');
}

// Helper function to ensure we have a valid token
async function getValidToken(): Promise<string | null> {
  try {
    // If a refresh is already in progress, wait for it
    if (tokenRefreshPromise) {
      console.log('Token refresh already in progress, waiting...');
      return await tokenRefreshPromise;
    }
    
    // If we have a recently cached token, return it immediately
    const now = Date.now();
    if (cachedToken && (now - lastTokenFetch < TOKEN_CACHE_MS)) {
      console.log('✓ Using cached token (within cache window)');
      return cachedToken;
    }
    
    // Start a new refresh operation
    console.log('Getting valid token...');
    tokenRefreshPromise = (async () => {
      try {
        // Use getSession instead of refreshSession to avoid lock conflicts
        // Supabase will auto-refresh if the token is expired
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          return null;
        }
        
        if (session && session.access_token) {
          console.log('✓ Token refreshed and obtained');
          lastTokenFetch = Date.now();
          cachedToken = session.access_token;
          // Update localStorage with the fresh token
          localStorage.setItem('ispora_access_token', session.access_token);
          return session.access_token;
        }
        
        console.log('No valid session found');
        cachedToken = null;
        return null;
      } finally {
        // Clear the promise after a short delay to allow for brief caching
        setTimeout(() => {
          tokenRefreshPromise = null;
        }, 100);
      }
    })();
    
    return await tokenRefreshPromise;
  } catch (error) {
    console.error('Error in getValidToken:', error);
    tokenRefreshPromise = null;
    cachedToken = null;
    return null;
  }
}

// Helper function to get auth header
async function getAuthHeader(token?: string): Promise<HeadersInit> {
  let accessToken = token;
  
  // If no token provided, try to get a valid one
  if (!accessToken) {
    accessToken = await getValidToken() || undefined;
  }
  
  return {
    'Content-Type': 'application/json',
    'Authorization': accessToken ? `Bearer ${accessToken}` : `Bearer ${publicAnonKey}`,
  };
}

// Helper function for API calls with retry logic
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {},
  retryCount = 0
): Promise<T> {
  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 1000; // Start with 1 second
  
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`API Call: ${options.method || 'GET'} ${url}`);
    
    const headers = await getAuthHeader();
    
    console.log('Authorization header being sent:', headers['Authorization']?.substring(0, 50) + '...');
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    // Handle 502 Bad Gateway errors (HTML response from Cloudflare) with retry
    if (response.status === 502) {
      console.error(`❌ 502 Bad Gateway - Supabase Edge Function is down or crashed (Attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);
      
      if (retryCount < MAX_RETRIES) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = RETRY_DELAY_MS * Math.pow(2, retryCount);
        console.log(`⏳ Retrying in ${delay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return apiCall<T>(endpoint, options, retryCount + 1);
      }
      
      throw new Error('Backend server is temporarily unavailable. Please try again in a few minutes or contact support.');
    }

    // Try to parse JSON, but handle cases where it might not be JSON
    let data;
    const contentType = response.headers.get('content-type');
    
    // If response is HTML (like Cloudflare error page), don't try to parse as JSON
    if (contentType?.includes('text/html')) {
      console.error(`❌ Received HTML response instead of JSON for ${endpoint} (Status: ${response.status})`);
      console.error('⚠️  This usually means the Supabase Edge Function crashed or is not deployed.');
      throw new Error(`Backend server error (${response.status}). The API may not be deployed or is experiencing issues.`);
    }
    
    try {
      data = await response.json();
      console.log(`API Response (${endpoint}):`, data);
    } catch (jsonError) {
      // Suppress errors for community endpoints (backend not implemented yet)
      if (!endpoint.includes('/community/')) {
        console.error(`Failed to parse JSON response for ${endpoint}:`, jsonError);
      }
      
      // For community endpoints, provide a helpful message
      if (endpoint.includes('/community/')) {
        console.log(`⚠️  Community backend not yet deployed for ${endpoint}`);
        throw new Error('Community feature is not yet available. Please deploy the backend endpoints.');
      }
      
      data = { error: 'Invalid response from server' };
    }

    // If we get a 401 and haven't retried yet, try to refresh the token and retry
    if (response.status === 401 && retryCount === 0) {
      console.log('Got 401, attempting token refresh and retry...');
      
      // Clear cached token on 401 to force a fresh fetch
      cachedToken = null;
      lastTokenFetch = 0;
      
      // Use getValidToken which has proper caching to avoid lock conflicts
      const newToken = await getValidToken();
      
      if (newToken) {
        console.log('✓ Token refreshed successfully, retrying request');
        
        // Retry the request with the new token
        return apiCall<T>(endpoint, options, retryCount + 1);
      } else {
        console.log('❌ Token refresh failed - clearing session');
        // Clear all auth data if refresh fails
        localStorage.removeItem('ispora_access_token');
        localStorage.removeItem('ispora_refresh_token');
        await supabase.auth.signOut();
        throw new Error('Your session has expired. Please sign in again.');
      }
    }

    if (!response.ok) {
      const errorMessage = data.error || data.message || `API request failed with status ${response.status}`;
      
      // Suppress errors for community endpoints (backend not implemented yet)
      // Also suppress "Already registered" errors as they're expected behavior
      if (!endpoint.includes('/community/') && !errorMessage.includes('Already registered')) {
        console.error(`API Error (${endpoint}):`, errorMessage);
      }
      
      // Handle Invalid JWT specifically
      if (errorMessage.includes('Invalid JWT') || errorMessage.includes('Invalid session')) {
        console.log('❌ Invalid JWT detected - clearing session');
        localStorage.removeItem('ispora_access_token');
        localStorage.removeItem('ispora_refresh_token');
        cachedToken = null;
        lastTokenFetch = 0;
        await supabase.auth.signOut();
        throw new Error('Your session has expired. Please sign in again.');
      }
      
      throw new Error(errorMessage);
    }

    return data;
  } catch (error: any) {
    // Suppress errors for community endpoints (backend not implemented yet)
    // Also suppress "Already registered" errors as they're expected behavior
    if (!endpoint.includes('/community/') && !error.message?.includes('Already registered')) {
      console.error(`API Error (${endpoint}):`, error);
    }
    
    // Provide more helpful error messages
    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      // Check if this is a Supabase edge function deployment issue
      console.error('⚠️  Backend API is not accessible. Please ensure the Supabase Edge Function is deployed.');
      console.error('📝 To deploy, run: supabase functions deploy make-server-b8526fa6');
      throw new Error('Backend service unavailable. The API server may not be deployed yet.');
    } else if (error.message?.includes('Invalid session')) {
      throw new Error('Your session has expired. Please sign in again.');
    } else if (error.message?.includes('Unauthorized')) {
      throw new Error('Authentication required. Please sign in to continue.');
    } else if (error.message?.includes('Invalid JWT')) {
      throw new Error('Your session is invalid. Please sign out and sign in again.');
    }
    
    throw error;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// ── AUTHENTICATION API ──
// ══════════════════════════════════════════════════════════════════════════════

export const authApi = {
  signup: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'diaspora' | 'student';
  }) => apiCall('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  signin: (data: { email: string; password: string }) =>
    apiCall('/auth/signin', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  signout: () => apiCall('/auth/signout', { method: 'POST' }),

  getSession: () => apiCall('/auth/session'),

  updateProfile: (profileData: any) =>
    apiCall('/auth/update-profile', {
      method: 'POST',
      body: JSON.stringify({ profileData }),
    }),

  resetPassword: (email: string) =>
    apiCall('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  uploadProfilePicture: (imageData: string, fileName: string) =>
    apiCall('/auth/upload-profile-picture', {
      method: 'POST',
      body: JSON.stringify({ imageData, fileName }),
    }),
};

// ══════════════════════════════════════════════════════════════════════════════
// ── USER API ──
// ══════════════════════════════════════════════════════════════════════════════

export const userApi = {
  getUser: (userId: string) => apiCall(`/users/${userId}`),

  updateUser: (userId: string, data: any) =>
    apiCall(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getAll: (params?: { role?: 'diaspora' | 'student' }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiCall(`/users${query ? `?${query}` : ''}`);
  },

  browseStudents: () => apiCall('/users/browse/students'),

  browseMentors: () => apiCall('/users/browse/mentors'),

  getStats: () => apiCall('/users/stats'),

  getActivity: () => apiCall('/users/activity'),
};

// ══════════════════════════════════════════════════════════════════════════════
// ── MENTORSHIP REQUEST API ──
// ══════════════════════════════════════════════════════════════════════════════

export const requestApi = {
  create: (data: { mentorId: string; message: string }) =>
    apiCall('/requests', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getAll: (type?: 'sent' | 'received') => {
    const query = type ? `?type=${type}` : '';
    return apiCall(`/requests${query}`);
  },

  getOne: (requestId: string) => apiCall(`/requests/${requestId}`),

  accept: (requestId: string) =>
    apiCall(`/requests/${requestId}/accept`, { method: 'POST' }),

  decline: (requestId: string, reason?: string) =>
    apiCall(`/requests/${requestId}/decline`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
};

// ══════════════════════════════════════════════════════════════════════════════
// ── MENTORSHIP API ──
// ══════════════════════════════════════════════════════════════════════════════

export const mentorshipApi = {
  getAll: () => apiCall('/mentorships'),

  getOne: (mentorshipId: string) => apiCall(`/mentorships/${mentorshipId}`),

  end: (mentorshipId: string) =>
    apiCall(`/mentorships/${mentorshipId}/end`, { method: 'POST' }),
};

// ══════════════════════════════════════════════════════════════════════════════
// ── OPPORTUNITIES API ──
// ═════════════════════════════════════════════════════════════════════════════

export const opportunityApi = {
  create: (data: {
    title: string;
    company: string;
    type: string;
    location: string;
    description: string;
    requirements?: string[];
    deadline?: string;
    applicationUrl?: string;
  }) =>
    apiCall('/opportunities', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getAll: (params?: { type?: string; search?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiCall(`/opportunities${query ? `?${query}` : ''}`);
  },

  getOne: (opportunityId: string) => apiCall(`/opportunities/${opportunityId}`),

  bookmark: (opportunityId: string) =>
    apiCall(`/opportunities/${opportunityId}/bookmark`, { method: 'POST' }),

  unbookmark: (opportunityId: string) =>
    apiCall(`/opportunities/${opportunityId}/bookmark`, { method: 'DELETE' }),

  getBookmarked: () => apiCall('/opportunities/bookmarked/me'),

  delete: (opportunityId: number) =>
    apiCall(`/opportunities/${opportunityId}`, { method: 'DELETE' }),

  update: (opportunityId: number, data: any) =>
    apiCall(`/opportunities/${opportunityId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// ══════════════════════════════════════════════════════════════════════════════
// ── NOTIFICATIONS API ──
// ══════════════════════════════════════════════════════════════════════════════

export const notificationApi = {
  getAll: () => apiCall('/notifications'),

  markAsRead: (notificationId: string) =>
    apiCall(`/notifications/${notificationId}/read`, { method: 'PUT' }),

  markAllAsRead: () =>
    apiCall('/notifications/read-all', { method: 'PUT' }),

  // Push notification methods
  getVapidKey: () => apiCall('/push/vapid-key'),

  subscribeToPush: (subscription: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  }) =>
    apiCall('/push/subscribe', {
      method: 'POST',
      body: JSON.stringify(subscription),
    }),

  unsubscribeFromPush: (endpoint: string) =>
    apiCall('/push/unsubscribe', {
      method: 'DELETE',
      body: JSON.stringify({ endpoint }),
    }),

  getPushSubscriptions: () => apiCall('/push/subscriptions'),
};

// ═════════════════════════════════════════════════════════════════════════════
// ── SESSIONS API ──
// ══════════════════════════════════════════════════════════════════════════��═══

export const sessionApi = {
  create: (data: {
    mentorshipId: string;
    scheduledAt: string;
    duration: number;
    topic?: string;
    notes?: string;
  }) =>
    apiCall('/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getAll: () => apiCall('/sessions'),

  getAllPublic: () => apiCall('/sessions/public'),

  update: (sessionId: string, data: any) =>
    apiCall(`/sessions/${sessionId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  cancel: (sessionId: string) =>
    apiCall(`/sessions/${sessionId}/cancel`, { method: 'POST' }),

  delete: (sessionId: string) =>
    apiCall(`/sessions/${sessionId}`, { method: 'DELETE' }),

  register: (sessionId: string) =>
    apiCall(`/sessions/${sessionId}/register`, { method: 'POST' }),

  unregister: (sessionId: string) =>
    apiCall(`/sessions/${sessionId}/unregister`, { method: 'POST' }),

  // Social features
  like: (sessionId: string) =>
    apiCall(`/sessions/${sessionId}/like`, { method: 'POST' }),

  unlike: (sessionId: string) =>
    apiCall(`/sessions/${sessionId}/like`, { method: 'DELETE' }),

  getLikes: (sessionId: string) =>
    apiCall(`/sessions/${sessionId}/likes`),

  incrementView: (sessionId: string) =>
    apiCall(`/sessions/${sessionId}/view`, { method: 'POST' }),

  // Past sessions
  getPastSessions: () => apiCall('/sessions/past'),

  // Recording management
  addRecording: (sessionId: string, data: {
    recordingUrl: string;
    recordingType?: 'link' | 'upload';
    recordingDuration?: number;
  }) =>
    apiCall(`/sessions/${sessionId}/recording`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Public session (no auth required)
  getPublicSession: async (sessionId: string) => {
    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-b8526fa6/public/session/${sessionId}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch session');
    }
    return response.json();
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// ── PUBLIC OPPORTUNITY API (no auth) ──
// ═════════════════════════════════════════════════════════════════════════════

export const publicOpportunityApi = {
  // Public opportunity (no auth required)
  getPublicOpportunity: async (opportunityId: string) => {
    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-b8526fa6/public/opportunity/${opportunityId}`, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch opportunity');
    }
    return response.json();
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// ── MESSAGES API ──
// ═════════════════════════════════════════════════════════════════════════════

export const messageApi = {
  send: (data: { mentorshipId: string; content: string }) =>
    apiCall('/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getAll: (mentorshipId: string) =>
    apiCall(`/messages?mentorshipId=${mentorshipId}`),

  markAsRead: (messageId: string) =>
    apiCall(`/messages/${messageId}/read`, { method: 'PUT' }),
};

// ══════════════════════════════════════════════════════════════════════════════
// ── SETTINGS API ──
// ══════════════════════════════════════════════════════════════════════════════

export const settingsApi = {
  get: () => apiCall('/settings'),

  update: (data: any) =>
    apiCall('/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// ══════════════════════════════════════════════════════════════════════════════
// ── STATS API ──
// ══════════════════════════════════════════════════════════════════════════════

export const statsApi = {
  getMentorStats: () => apiCall('/stats/mentor'),

  getStudentStats: () => apiCall('/stats/student'),
};

// ═════════════════════════════════════════════════════════════════════════════
// ── RESOURCES API ──
// ══════════════════════════════════════════════════════════════════════════════

export const resourceApi = {
  // Create a new resource (link or note)
  create: (data: {
    mentorshipId: string;
    type: 'link' | 'note';
    title: string;
    description?: string;
    linkUrl?: string;
    content?: string;
  }) =>
    apiCall('/resources', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Upload a file resource
  uploadFile: async (data: {
    mentorshipId: string;
    title: string;
    description?: string;
    file: File;
  }) => {
    const formData = new FormData();
    formData.append('mentorshipId', data.mentorshipId);
    formData.append('title', data.title);
    if (data.description) {
      formData.append('description', data.description);
    }
    formData.append('file', data.file);

    const token = await getValidToken();
    const response = await fetch(`${API_BASE_URL}/resources/upload`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : `Bearer ${publicAnonKey}`,
      },
      body: formData,
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'File upload failed');
    }
    return result;
  },

  // Get all resources for a mentorship
  getAll: (mentorshipId: string) =>
    apiCall(`/resources?mentorshipId=${mentorshipId}`),

  // Delete a resource
  delete: (resourceId: string) =>
    apiCall(`/resources/${resourceId}`, { method: 'DELETE' }),
};

// ══════════════════════════════════════════════════════════════════════════════
// ── GOALS API ──
// ══════════════════════════════════════════════════════════════════════════════

export const goalApi = {
  // Create a new goal
  create: (data: {
    title: string;
    category: string;
    priority?: string;
    dueDate?: string;
    notes?: string;
  }) =>
    apiCall('/goals', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Get all goals for current student
  getAll: () => apiCall('/goals'),

  // Update a goal
  update: (goalId: string, data: {
    title?: string;
    category?: string;
    completed?: boolean;
    priority?: string;
    dueDate?: string;
    notes?: string;
  }) =>
    apiCall(`/goals/${goalId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Delete a goal
  delete: (goalId: string) =>
    apiCall(`/goals/${goalId}`, { method: 'DELETE' }),
};

// ══════════════════════════════════════════════════════════════════════════════
// ── STUDENT RESOURCES API ──
// ══════════════════════════════════════════════════════════════════════════════

export const studentResourceApi = {
  // Get all resources across all mentorships for current student
  getAll: () => apiCall('/student/resources'),
};

// ══════════════════════════════════════════════════════════════════════════════
// ── ADMIN API ──
// ══════════════════════════════════════════════════════════════════════════════

export const adminApi = {
  // Get platform statistics
  getStats: () => apiCall('/admin/stats'),

  // User management
  getUsers: (params?: { role?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.role) query.append('role', params.role);
    if (params?.search) query.append('search', params.search);
    return apiCall(`/admin/users${query.toString() ? '?' + query.toString() : ''}`);
  },

  updateUser: (userId: string, data: any) =>
    apiCall(`/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteUser: (userId: string) =>
    apiCall(`/admin/users/${userId}`, { method: 'DELETE' }),

  // Create admin user
  createAdmin: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    adminApiKey: string;
  }) =>
    apiCall('/admin/create-admin', {
      method: 'POST',
      headers: {
        'X-Admin-Key': data.adminApiKey,
      },
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      }),
    }),

  // Opportunity management
  createOpportunity: (data: {
    type: string;
    title: string;
    company: string;
    location: string;
    description: string;
    requirements?: string;
    applicationLink?: string;
    deadline?: string;
    tags?: string[];
  }) =>
    apiCall('/admin/opportunities', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateOpportunity: (opportunityId: string, data: any) =>
    apiCall(`/admin/opportunities/${opportunityId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteOpportunity: (opportunityId: string) =>
    apiCall(`/admin/opportunities/${opportunityId}`, { method: 'DELETE' }),

  getAllOpportunities: () => apiCall('/admin/all-opportunities'),

  // Data management
  getMentorships: (status?: string) => {
    const query = status ? `?status=${status}` : '';
    return apiCall(`/admin/mentorships${query}`);
  },

  getSessions: (status?: string) => {
    const query = status ? `?status=${status}` : '';
    return apiCall(`/admin/sessions${query}`);
  },

  getAllRequests: (status?: string) => {
    const query = status ? `?status=${status}` : '';
    return apiCall(`/admin/requests${query}`);
  },
  getDonationLinks: () => {
    return apiCall(`/donation-links`);
  },
  updateDonationLinks: (links: any) => {
    return apiCall(`/admin/donation-links`, {
      method: 'PUT',
      body: JSON.stringify(links),
    });
  },
};

// Donation API (public)
const donationApi = {
  getLinks: async () => {
    return apiCall(`/donation-links`);
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// ── COMMUNITY API ──
// ══════════════════════════════════════════════════════════════════════════════

export const communityApi = {
  // ── POSTS (FEED) ──
  
  // Create a new post
  createPost: (data: {
    content: string;
    category?: string;
    linkUrl?: string;
    linkTitle?: string;
  }) =>
    apiCall('/community/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Get all posts (with pagination)
  getPosts: (params?: {
    category?: string;
    sort?: 'recent' | 'popular';
    limit?: number;
    offset?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.sort) query.append('sort', params.sort);
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.offset) query.append('offset', params.offset.toString());
    const queryString = query.toString();
    return apiCall(`/community/posts${queryString ? `?${queryString}` : ''}`);
  },

  // Get a single post with comments
  getPost: (postId: string) => apiCall(`/community/posts/${postId}`),

  // Like a post
  likePost: (postId: string) =>
    apiCall(`/community/posts/${postId}/like`, { method: 'POST' }),

  // Unlike a post
  unlikePost: (postId: string) =>
    apiCall(`/community/posts/${postId}/unlike`, { method: 'POST' }),

  // Add comment to a post (supports replies via parentId)
  addComment: (postId: string, content: string, parentId?: string) =>
    apiCall(`/community/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, parentId }),
    }),

  // Get comments for a post
  getComments: (postId: string) =>
    apiCall(`/community/posts/${postId}/comments`),

  // Delete a post
  deletePost: (postId: string) =>
    apiCall(`/community/posts/${postId}`, { method: 'DELETE' }),

  // ── DISCUSSIONS (FORUM) ──
  
  // Create a discussion thread
  createDiscussion: (data: {
    title: string;
    content: string;
    category: string;
  }) =>
    apiCall('/community/discussions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Get all discussions
  getDiscussions: (params?: {
    category?: string;
    sort?: 'recent' | 'popular';
    limit?: number;
    offset?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.sort) query.append('sort', params.sort);
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.offset) query.append('offset', params.offset.toString());
    const queryString = query.toString();
    return apiCall(`/community/discussions${queryString ? `?${queryString}` : ''}`);
  },

  // Get a single discussion with replies
  getDiscussion: (discussionId: string) =>
    apiCall(`/community/discussions/${discussionId}`),

  // Reply to a discussion
  replyToDiscussion: (discussionId: string, content: string) =>
    apiCall(`/community/discussions/${discussionId}/replies`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  // Like a discussion or reply
  likeDiscussion: (discussionId: string) =>
    apiCall(`/community/discussions/${discussionId}/like`, { method: 'POST' }),

  // Unlike a discussion
  unlikeDiscussion: (discussionId: string) =>
    apiCall(`/community/discussions/${discussionId}/like`, { method: 'DELETE' }),

  // Mark reply as best answer (discussion creator or mentor only)
  markBestAnswer: (discussionId: string, replyId: string) =>
    apiCall(`/community/discussions/${discussionId}/best-answer`, {
      method: 'POST',
      body: JSON.stringify({ replyId }),
    }),

  // Delete a discussion
  deleteDiscussion: (discussionId: string) =>
    apiCall(`/community/discussions/${discussionId}`, { method: 'DELETE' }),

  // ── MEMBERS & FOLLOW ──

  // Get all community members
  getMembers: (params?: {
    role?: string;
    search?: string;
    expertise?: string;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.role) query.append('role', params.role);
    if (params?.search) query.append('search', params.search);
    if (params?.expertise) query.append('expertise', params.expertise);
    if (params?.limit) query.append('limit', params.limit.toString());
    const queryString = query.toString();
    return apiCall(`/community/members${queryString ? `?${queryString}` : ''}`);
  },

  // Follow a user
  followUser: (userId: string) =>
    apiCall(`/community/follow/${userId}`, { method: 'POST' }),

  // Unfollow a user
  unfollowUser: (userId: string) =>
    apiCall(`/community/unfollow/${userId}`, { method: 'DELETE' }),

  // Get user's followers
  getFollowers: (userId: string) =>
    apiCall(`/community/followers/${userId}`),

  // Get user's following
  getFollowing: (userId: string) =>
    apiCall(`/community/following/${userId}`),
};

// ═════════════════════════════════════════════════════════════════════════════
// ── EXPORT ALL ──
// ══════════════════════════════════════════════════════════════════════════════

export const api = {
  auth: authApi,
  user: userApi,
  request: requestApi,
  mentorship: mentorshipApi,
  opportunity: opportunityApi,
  notification: notificationApi,
  session: sessionApi,
  message: messageApi,
  settings: settingsApi,
  stats: statsApi,
  resource: resourceApi,
  goal: goalApi,
  studentResource: studentResourceApi,
  admin: adminApi,
  donation: donationApi,
  community: communityApi,
};

export default api;