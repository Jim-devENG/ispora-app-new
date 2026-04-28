import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";
import { ensureResourcesBucket, setupResourceRoutes } from "./resources.tsx";
import { setupAdminRoutes } from "./admin.tsx";
import * as notifications from "./notifications.tsx";
import { 
  calculateMentorImpactStats, 
  calculateYouthProgressStats,
  generateImpactCardData,
  generateMonthlyImpact 
} from "./impact-stats.tsx";
import { 
  checkEarnedBadges, 
  getNewBadges,
  getBadgeDisplayInfo 
} from "./badges.tsx";

const app = new Hono();

console.log('=== Ispora Server Starting ===');

// Add CORS middleware to allow requests from any origin
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length'],
  credentials: true,
}));

// Add logger middleware
app.use('*', logger(console.log));

// Health check endpoint (no auth required)
app.get("/make-server-b8526fa6/health", (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'Ispora server is running'
  });
});

// Initialize Supabase client with service role (for admin operations)
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Initialize Supabase client with anon key (for regular operations)
const getSupabaseClient = () => createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Helper function to authenticate user from request
async function authenticateUser(c: any) {
  const authHeader = c.req.header('Authorization');
  
  console.log('=== Authentication Debug ===');
  console.log('Authorization header:', authHeader);
  
  if (!authHeader) {
    console.log('❌ No authorization header');
    return { error: 'No authorization header', status: 401 };
  }

  // Extract the token from "Bearer <token>"
  const token = authHeader.replace('Bearer ', '');
  console.log('Token (first 30 chars):', token.substring(0, 30) + '...');
  
  // Check if this is the anon key (not a JWT token)
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  if (token === anonKey) {
    console.log('❌ Anon key provided instead of user JWT token');
    return { error: 'User authentication required. Please sign in.', status: 401 };
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: { Authorization: authHeader }
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  console.log('Calling supabase.auth.getUser()...');
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
    console.log('❌ Supabase auth error:', error.message);
    return { error: `Invalid session: ${error.message}`, status: 401 };
  }
  
  if (!user) {
    console.log('❌ No user returned from Supabase');
    return { error: 'Invalid session', status: 401 };
  }

  console.log('✓ User authenticated:', user.id);
  return { user, supabase };
}

// Helper function to check if user is admin
async function authenticateAdmin(c: any) {
  const auth = await authenticateUser(c);
  if ('error' in auth) {
    return auth;
  }

  const { user } = auth;
  const userProfile = await kv.get(`user:${user.id}`);
  
  if (!userProfile || userProfile.role !== 'admin') {
    console.log('❌ User is not an admin:', user.id);
    return { error: 'Admin access required', status: 403 };
  }

  console.log('✓ Admin authenticated:', user.id);
  return { user, userProfile, supabase: auth.supabase };
}

// Generate unique ID
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Generate unique short code for sessions (e.g., "jd123")
async function generateShortCode(mentorId: string): Promise<string> {
  try {
    // Get mentor profile to extract initials
    const mentor = await kv.get(`user:${mentorId}`);
    if (!mentor) {
      throw new Error('Mentor not found');
    }

    // Generate initials (lowercase)
    const firstName = mentor.firstName || '';
    const lastName = mentor.lastName || '';
    const initials = (firstName.charAt(0) + lastName.charAt(0)).toLowerCase();
    
    if (initials.length < 2) {
      throw new Error('Invalid mentor name for short code generation');
    }

    // Get all existing sessions to find the next available number
    const allSessions = await kv.getByPrefix('session:') || [];
    const existingShortCodes = new Set(
      (Array.isArray(allSessions) ? allSessions : [])
        .filter((s: any) => s.short_code)
        .map((s: any) => s.short_code)
    );

    // Start from 1 and find the first available number
    let counter = 1;
    let shortCode = `${initials}${counter}`;
    
    // Keep incrementing until we find a unique code
    while (existingShortCodes.has(shortCode)) {
      counter++;
      shortCode = `${initials}${counter}`;
      
      // Safety limit to prevent infinite loop
      if (counter > 999999) {
        throw new Error('Unable to generate unique short code');
      }
    }

    return shortCode;
  } catch (error: any) {
    console.log('Error generating short code:', error);
    throw error;
  }
}

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "X-Admin-Key"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Diagnostic endpoint (public, no auth required)
app.get("/make-server-b8526fa6/diagnostic", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: {
      hasSupabaseUrl: !!Deno.env.get('SUPABASE_URL'),
      hasServiceRole: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
      hasAnonKey: !!Deno.env.get('SUPABASE_ANON_KEY'),
    },
    message: "Edge Function is running with custom JWT validation"
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// ── AUTHENTICATION ROUTES ──
// ══════════════════════════════════════════════════════════════════════════════

// Sign up endpoint
app.post("/make-server-b8526fa6/auth/signup", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, firstName, lastName, role, mentorType } = body;

    if (!email || !password || !firstName || !lastName || !role) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // ✅ HARDCODED: Automatically set isporaproject@gmail.com as admin
    const finalRole = email === 'isporaproject@gmail.com' ? 'admin' : role;

    // Create user with Supabase Auth
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: { 
        firstName,
        lastName,
        role: finalRole, // 'diaspora', 'student', or 'admin'
        mentorType: mentorType, // 'diaspora' or 'home' (for mentors only)
        name: `${firstName} ${lastName}`,
      },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.log('Supabase Auth signup error:', error);
      return c.json({ error: error.message }, 400);
    }

    // Store user profile in KV store
    await kv.set(`user:${data.user.id}`, {
      id: data.user.id,
      email,
      firstName,
      lastName,
      role: finalRole,
      mentorType: mentorType, // Store mentor type
      createdAt: new Date().toISOString(),
      onboardingComplete: finalRole === 'admin' ? true : false, // Auto-complete onboarding for admin
    });

    console.log(`✅ User created: ${email} with role: ${finalRole}${mentorType ? ` (${mentorType} mentor)` : ''}`);

    return c.json({ 
      success: true, 
      userId: data.user.id,
      message: 'User created successfully' 
    });
  } catch (error: any) {
    console.log('Sign up error:', error);
    return c.json({ error: error.message || 'Sign up failed' }, 500);
  }
});

// Sign in endpoint
app.post("/make-server-b8526fa6/auth/signin", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;

    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.log('Supabase Auth signin error:', error);
      return c.json({ error: error.message }, 401);
    }

    // Get user profile from KV store
    let userProfile = await kv.get(`user:${data.user.id}`) || {};

    // ✅ HARDCODED: Force isporaproject@gmail.com to always be admin
    if (email === 'isporaproject@gmail.com' && userProfile.role !== 'admin') {
      userProfile.role = 'admin';
      userProfile.onboardingComplete = true;
      await kv.set(`user:${data.user.id}`, userProfile);
      console.log('✅ Auto-promoted isporaproject@gmail.com to admin');
    }

    // Track session
    const userAgent = c.req.header('user-agent') || '';
    const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent);
    const browser = userAgent.includes('Chrome') ? 'Chrome' : 
                    userAgent.includes('Safari') ? 'Safari' : 
                    userAgent.includes('Firefox') ? 'Firefox' : 'Browser';
    
    const newSession = {
      id: data.session.access_token.substring(0, 16),
      deviceType: isMobile ? 'mobile' : 'desktop',
      deviceName: `${isMobile ? 'Mobile Device' : 'Computer'} — ${browser}`,
      location: 'Unknown', // In production, use IP geolocation
      lastActive: 'Active now',
      isCurrent: true,
      createdAt: new Date().toISOString()
    };

    // Get existing sessions and add new one
    const existingSessions = await kv.get(`sessions:${data.user.id}`) || [];
    // Mark all other sessions as not current
    const updatedSessions = existingSessions.map((s: any) => ({ ...s, isCurrent: false }));
    updatedSessions.push(newSession);
    await kv.set(`sessions:${data.user.id}`, updatedSessions);

    return c.json({ 
      success: true,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        ...userProfile,
      }
    });
  } catch (error: any) {
    console.log('Sign in error:', error);
    return c.json({ error: error.message || 'Sign in failed' }, 500);
  }
});

// Sign out endpoint
app.post("/make-server-b8526fa6/auth/signout", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.log('Sign out error:', error);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ success: true, message: 'Signed out successfully' });
  } catch (error: any) {
    console.log('Sign out error:', error);
    return c.json({ error: error.message || 'Sign out failed' }, 500);
  }
});

// Get current session
app.get("/make-server-b8526fa6/auth/session", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const { user } = auth;
    
    console.log('=== Get Session ===');
    console.log('Auth user ID:', user.id);
    console.log('Auth user metadata:', user.user_metadata);
    
    // Get user profile from KV store
    let userProfile = await kv.get(`user:${user.id}`);
    console.log('User profile from KV:', userProfile ? 'Found' : 'Not found');
    
    // If profile doesn't exist in KV, create it from auth user metadata
    if (!userProfile) {
      console.log('Creating user profile from auth metadata...');
      
      userProfile = {
        id: user.id,
        email: user.email || '',
        firstName: user.user_metadata?.firstName || '',
        lastName: user.user_metadata?.lastName || '',
        role: user.user_metadata?.role || 'student',
        mentorType: user.user_metadata?.mentorType, // Include mentor type from metadata
        createdAt: user.created_at || new Date().toISOString(),
        onboardingComplete: false,
      };
      
      // Save the profile to KV store
      await kv.set(`user:${user.id}`, userProfile);
      console.log('✓ User profile created and saved to KV');
    }

    console.log('User authenticated successfully:', user.id);

    return c.json({ 
      success: true,
      user: {
        id: user.id,
        email: user.email,
        ...userProfile,
      }
    });
  } catch (error: any) {
    console.log('Get session error:', error);
    return c.json({ error: error.message || 'Failed to get session' }, 500);
  }
});

// Update user profile (onboarding)
app.post("/make-server-b8526fa6/auth/update-profile", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const { user } = auth;
    const body = await c.req.json();
    const { profileData } = body;

    // Get existing user profile
    const existingProfile = await kv.get(`user:${user.id}`) || {};

    // Update user profile in KV store
    await kv.set(`user:${user.id}`, {
      ...existingProfile,
      ...profileData,
      onboardingComplete: true,
      updatedAt: new Date().toISOString(),
    });

    const updatedProfile = await kv.get(`user:${user.id}`);
    console.log('Profile updated successfully for user:', user.id);

    return c.json({ 
      success: true, 
      user: updatedProfile,
      message: 'Profile updated successfully' 
    });
  } catch (error: any) {
    console.log('Update profile error:', error);
    return c.json({ error: error.message || 'Failed to update profile' }, 500);
  }
});

// Password reset request
app.post("/make-server-b8526fa6/auth/reset-password", async (c) => {
  try {
    const body = await c.req.json();
    const { email } = body;

    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }

    // In a real app, you would send a password reset email here
    // For now, we'll just return success
    // Note: Supabase handles password reset emails, but requires email configuration
    
    return c.json({ 
      success: true,
      message: 'Password reset instructions sent to email' 
    });
  } catch (error: any) {
    console.log('Password reset error:', error);
    return c.json({ error: error.message || 'Failed to send reset email' }, 500);
  }
});

// Upload profile picture
app.post("/make-server-b8526fa6/auth/upload-profile-picture", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const { user } = auth;
    const body = await c.req.json();
    const { imageData, fileName } = body;

    if (!imageData || !fileName) {
      return c.json({ error: 'Image data and file name are required' }, 400);
    }

    // Ensure profile pictures bucket exists
    const PROFILE_PICTURES_BUCKET = 'make-b8526fa6-profile-pictures';
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const bucketExists = buckets?.some((bucket: any) => bucket.name === PROFILE_PICTURES_BUCKET);
    
    if (!bucketExists) {
      console.log('Creating profile pictures bucket...');
      await supabaseAdmin.storage.createBucket(PROFILE_PICTURES_BUCKET, {
        public: true, // Make public so images can be displayed
        fileSizeLimit: 5242880, // 5MB limit
      });
      console.log('✓ Profile pictures bucket created');
    }

    // Convert base64 to buffer
    const base64Data = imageData.split(',')[1];
    const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // Create unique file path
    const fileExt = fileName.split('.').pop();
    const uniqueFileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `${uniqueFileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(PROFILE_PICTURES_BUCKET)
      .upload(filePath, buffer, {
        contentType: `image/${fileExt}`,
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return c.json({ error: 'Failed to upload profile picture' }, 500);
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(PROFILE_PICTURES_BUCKET)
      .getPublicUrl(filePath);

    const profilePictureUrl = urlData.publicUrl;

    // Update user profile with new profile picture URL
    const existingProfile = await kv.get(`user:${user.id}`) || {};
    await kv.set(`user:${user.id}`, {
      ...existingProfile,
      profilePicture: profilePictureUrl,
      updatedAt: new Date().toISOString(),
    });

    console.log('Profile picture uploaded successfully for user:', user.id);

    return c.json({ 
      success: true, 
      profilePicture: profilePictureUrl,
      message: 'Profile picture uploaded successfully' 
    });
  } catch (error: any) {
    console.log('Upload profile picture error:', error);
    return c.json({ error: error.message || 'Failed to upload profile picture' }, 500);
  }
});

// ¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬
// ¬¬ PUBLIC PROFILE ROUTES (No Auth Required) ¬¬
// ¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬

// Get public mentor profile
app.get("/make-server-b8526fa6/public/mentor/:userId", async (c) => {
  try {
    const userId = c.req.param('userId');
    
    const user = await kv.get(`user:${userId}`);
    
    if (!user) {
      return c.json({ error: 'Profile not found' }, 404);
    }
    
    // Only return public information
    const publicProfile = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      mentorType: user.mentorType,
      profilePicture: user.profilePicture,
      title: user.title,
      bio: user.bio,
      skills: user.skills || [],
      currentRole: user.currentRole,
      company: user.company,
      location: user.location,
      yearsOfExperience: user.yearsOfExperience,
      availableToMentor: user.availableToMentor,
      linkedin: user.linkedin,
      twitter: user.twitter,
      website: user.website,
      offers: user.offers || [],
      createdAt: user.createdAt,
    };
    
    return c.json({ success: true, profile: publicProfile });
  } catch (error: any) {
    console.log('Get public mentor profile error:', error);
    return c.json({ error: error.message || 'Failed to fetch profile' }, 500);
  }
});

// Get public student profile
app.get("/make-server-b8526fa6/public/student/:userId", async (c) => {
  try {
    const userId = c.req.param('userId');
    
    const user = await kv.get(`user:${userId}`);
    
    if (!user) {
      return c.json({ error: 'Profile not found' }, 404);
    }
    
    // Only return public information
    const publicProfile = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      profilePicture: user.profilePicture,
      title: user.title,
      bio: user.bio,
      skills: user.skills || [],
      currentRole: user.currentRole,
      company: user.company,
      location: user.location,
      education: user.education,
      goals: user.goals,
      linkedin: user.linkedin,
      twitter: user.twitter,
      createdAt: user.createdAt,
    };
    
    return c.json({ success: true, profile: publicProfile });
  } catch (error: any) {
    console.log('Get public student profile error:', error);
    return c.json({ error: error.message || 'Failed to fetch profile' }, 500);
  }
});

// ¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬
// ¬¬ USER PROFILE ROUTES ¬¬
// ¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬

// Browse students (for mentors) - MUST come before /users
app.get("/make-server-b8526fa6/users/browse/students", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    // Get all users with role 'student'
    const allUsers = await kv.getByPrefix('user:') || [];
    const students = (Array.isArray(allUsers) ? allUsers : [])
      .filter((u: any) => u.role === 'student')
      .map((student: any) => ({
        ...student,
        // Don't expose sensitive info
        password: undefined,
      }));

    return c.json({ success: true, students });
  } catch (error: any) {
    console.log('Browse students error:', error);
    return c.json({ error: error.message || 'Failed to browse students' }, 500);
  }
});

// Browse mentors (for students) - MUST come before /users
app.get("/make-server-b8526fa6/users/browse/mentors", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    // Get all users with role 'diaspora'
    const allUsers = await kv.getByPrefix('user:') || [];
    const mentors = (Array.isArray(allUsers) ? allUsers : [])
      .filter((u: any) => u.role === 'diaspora')
      .map((mentor: any) => ({
        ...mentor,
        // Don't expose sensitive info
        password: undefined,
      }));

    return c.json({ success: true, mentors });
  } catch (error: any) {
    console.log('Browse mentors error:', error);
    return c.json({ error: error.message || 'Failed to browse mentors' }, 500);
  }
});

// Get all users (with optional role filter)
app.get("/make-server-b8526fa6/users", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const role = c.req.query('role'); // 'diaspora' or 'student'

    // Get all users
    const allUsers = await kv.getByPrefix('user:') || [];
    
    let users = Array.isArray(allUsers) ? allUsers : [];
    
    // Filter by role if specified
    if (role) {
      users = allUsers.filter((u: any) => u.role === role);
    }
    
    // Map users and remove sensitive info
    const safeUsers = users.map((user: any) => ({
      ...user,
      password: undefined,
    }));

    return c.json({ success: true, users: safeUsers });
  } catch (error: any) {
    console.log('Get users error:', error);
    return c.json({ error: error.message || 'Failed to get users' }, 500);
  }
});

// Get user profile by ID (supports both authenticated and public access)
app.get("/make-server-b8526fa6/users/:userId", async (c) => {
  try {
    const userId = c.req.param('userId');
    const isPublicRequest = c.req.query('public') === 'true';
    
    // Try to authenticate, but don't require it for public requests
    let authUser = null;
    if (!isPublicRequest) {
      const auth = await authenticateUser(c);
      if (!('error' in auth)) {
        authUser = auth.user;
      }
    }
    
    console.log('=== Get User Profile ===');
    console.log('Requested user ID:', userId);
    console.log('Auth user ID:', authUser?.id || 'Public request');
    console.log('Is public request:', isPublicRequest);
    
    let userProfile = await kv.get(`user:${userId}`);
    console.log('User profile from KV:', userProfile ? 'Found' : 'Not found');

    // If profile doesn't exist in KV, create it from auth user metadata
    // This happens when accessing own profile (userId === authUser.id)
    if (!userProfile && authUser && userId === authUser.id) {
      console.log('Creating user profile from auth metadata...');
      console.log('Auth user metadata:', authUser.user_metadata);
      
      userProfile = {
        id: authUser.id,
        email: authUser.email || '',
        firstName: authUser.user_metadata?.firstName || '',
        lastName: authUser.user_metadata?.lastName || '',
        role: authUser.user_metadata?.role || 'student',
        createdAt: authUser.created_at || new Date().toISOString(),
        onboardingComplete: false,
      };
      
      // Save the profile to KV store
      await kv.set(`user:${authUser.id}`, userProfile);
      console.log('User profile created and saved to KV');
    }
    
    if (!userProfile) {
      console.log('User profile not found for userId:', userId);
      return c.json({ error: 'User not found' }, 404);
    }

    // For public requests, only return public fields
    if (isPublicRequest || !authUser) {
      const publicProfile = {
        id: userProfile.id,
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        role: userProfile.role,
        mentorType: userProfile.mentorType,
        profilePicture: userProfile.profilePicture,
        title: userProfile.title,
        bio: userProfile.bio,
        skills: userProfile.skills || [],
        currentRole: userProfile.currentRole,
        company: userProfile.company,
        location: userProfile.location,
        yearsOfExperience: userProfile.yearsOfExperience,
        availableToMentor: userProfile.availableToMentor,
        linkedin: userProfile.linkedin,
        twitter: userProfile.twitter,
        website: userProfile.website,
        offers: userProfile.offers || [],
        education: userProfile.education,
        goals: userProfile.goals,
        createdAt: userProfile.createdAt,
      };
      return c.json({ success: true, user: publicProfile, isPublic: true });
    }

    return c.json({ success: true, user: userProfile });
  } catch (error: any) {
    console.log('Get user profile error:', error);
    return c.json({ error: error.message || 'Failed to get user profile' }, 500);
  }
});

// Update default meeting link (MUST be before /:userId route)
app.put("/make-server-b8526fa6/users/default-meeting-link", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const { user } = auth;
    const { defaultMeetingLink } = await c.req.json();

    // Validate URL format
    if (defaultMeetingLink && defaultMeetingLink.trim()) {
      try {
        new URL(defaultMeetingLink);
      } catch {
        return c.json({ error: 'Invalid URL format' }, 400);
      }
    }

    const existingProfile = await kv.get(`user:${user.id}`) || {};

    await kv.set(`user:${user.id}`, {
      ...existingProfile,
      defaultMeetingLink: defaultMeetingLink || '',
      updatedAt: new Date().toISOString(),
    });

    const updatedProfile = await kv.get(`user:${user.id}`);
    return c.json({ success: true, user: updatedProfile });
  } catch (error: any) {
    console.log('Update default meeting link error:', error);
    return c.json({ error: error.message || 'Failed to update default meeting link' }, 500);
  }
});

// Update user profile
app.put("/make-server-b8526fa6/users/:userId", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const { user } = auth;
    const userId = c.req.param('userId');

    // Can only update own profile
    if (user.id !== userId) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const body = await c.req.json();
    const existingProfile = await kv.get(`user:${userId}`) || {};

    await kv.set(`user:${userId}`, {
      ...existingProfile,
      ...body,
      updatedAt: new Date().toISOString(),
    });

    const updatedProfile = await kv.get(`user:${userId}`);
    return c.json({ success: true, user: updatedProfile });
  } catch (error: any) {
    console.log('Update user profile error:', error);
    return c.json({ error: error.message || 'Failed to update user profile' }, 500);
  }
});

// Get user stats (for profile page)
app.get("/make-server-b8526fa6/users/stats", async (c) => {
  try {
    console.log('=== Get User Stats - Start (v2) ===');
    
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      console.log('❌ Auth failed in stats endpoint:', auth.error);
      return c.json({ error: auth.error }, auth.status);
    }

    const { user: authUser } = auth;

    console.log('✓ Auth successful. User ID:', authUser.id);
    console.log('User metadata:', JSON.stringify(authUser.user_metadata));

    // Get user profile from KV store
    console.log('Fetching user profile from KV...');
    let userProfile = await kv.get(`user:${authUser.id}`);
    console.log('User profile from KV:', userProfile ? 'Found' : 'Not found');
    
    // If profile doesn't exist in KV, create it from auth user metadata
    if (!userProfile) {
      console.log('Creating user profile from auth metadata...');
      
      userProfile = {
        id: authUser.id,
        email: authUser.email || '',
        firstName: authUser.user_metadata?.firstName || '',
        lastName: authUser.user_metadata?.lastName || '',
        role: authUser.user_metadata?.role || 'student',
        createdAt: authUser.created_at || new Date().toISOString(),
        onboardingComplete: false,
      };
      
      console.log('New profile object:', JSON.stringify(userProfile));
      
      // Save the profile to KV store
      try {
        await kv.set(`user:${authUser.id}`, userProfile);
        console.log('✓ User profile created and saved to KV');
        
        // Verify it was saved
        const verifyProfile = await kv.get(`user:${authUser.id}`);
        if (!verifyProfile) {
          console.error('❌ Profile save verification failed - profile not found after save');
          throw new Error('Failed to save user profile to database');
        }
        console.log('✓ Profile save verified');
      } catch (kvError: any) {
        console.error('❌ KV set error:', kvError);
        throw new Error(`Failed to save user profile: ${kvError.message}`);
      }
    }

    // Safety check - ensure userProfile exists
    if (!userProfile) {
      console.error('❌ User profile is still null after creation attempt');
      return c.json({ 
        error: 'User profile could not be created', 
        details: 'Please try signing out and signing in again' 
      }, 500);
    }

    console.log('User profile role:', userProfile.role);

    // Get all mentorships for this user
    console.log('Fetching mentorships...');
    const allMentorships = await kv.getByPrefix('mentorship:');
    const userMentorships = allMentorships.filter((m: any) => 
      m.mentorId === authUser.id || m.studentId === authUser.id
    );
    console.log(`Found ${userMentorships.length} mentorships`);

    // Get all sessions for this user
    console.log('Fetching sessions...');
    const allSessions = await kv.getByPrefix('session:');
    const userSessions = allSessions.filter((s: any) => {
      const mentorship = userMentorships.find((m: any) => m.id === s.mentorshipId);
      return !!mentorship;
    });
    console.log(`Found ${userSessions.length} sessions`);

    // Calculate stats
    const activeMentorships = userMentorships.filter((m: any) => m.status === 'active');
    const completedSessions = userSessions.filter((s: any) => s.status === 'completed');

    const stats = {
      totalMentees: userProfile.role === 'diaspora' ? activeMentorships.length : 0,
      totalMentors: userProfile.role === 'student' ? activeMentorships.length : 0,
      totalSessions: completedSessions.length,
      profileViews: Math.floor(Math.random() * 100) + 50,
      responseRate: 95
    };

    console.log('Returning stats:', JSON.stringify(stats));
    return c.json({ success: true, stats });
  } catch (error: any) {
    console.error('❌ Get user stats error:', error);
    console.error('Error stack:', error.stack);
    return c.json({ error: error.message || 'Failed to get stats' }, 500);
  }
});

// Get user activity feed
app.get("/make-server-b8526fa6/users/activity", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const { user: authUser } = auth;

    console.log('=== Get User Activity ===');
    console.log('Auth user ID:', authUser.id);

    // Get user profile from KV store
    let userProfile = await kv.get(`user:${authUser.id}`);
    
    // If profile doesn't exist in KV, create it from auth user metadata
    if (!userProfile) {
      console.log('Creating user profile from auth metadata...');
      
      userProfile = {
        id: authUser.id,
        email: authUser.email || '',
        firstName: authUser.user_metadata?.firstName || '',
        lastName: authUser.user_metadata?.lastName || '',
        role: authUser.user_metadata?.role || 'student',
        createdAt: authUser.created_at || new Date().toISOString(),
        onboardingComplete: false,
      };
      
      // Save the profile to KV store
      try {
        await kv.set(`user:${authUser.id}`, userProfile);
        console.log('✓ User profile created and saved to KV');
        
        // Verify it was saved
        const verifyProfile = await kv.get(`user:${authUser.id}`);
        if (!verifyProfile) {
          console.error('❌ Profile save verification failed');
          throw new Error('Failed to save user profile to database');
        }
      } catch (kvError: any) {
        console.error('❌ KV set error:', kvError);
        throw new Error(`Failed to save user profile: ${kvError.message}`);
      }
    }

    // Safety check
    if (!userProfile) {
      console.error('❌ User profile is null');
      return c.json({ 
        error: 'User profile could not be created' 
      }, 500);
    }

    const activities = [];

    // Get recent data
    const allSessions = await kv.getByPrefix('session:');
    const allMentorships = await kv.getByPrefix('mentorship:');
    const allRequests = await kv.getByPrefix('request:');
    
    const userMentorships = allMentorships.filter((m: any) => 
      m.mentorId === authUser.id || m.studentId === authUser.id
    );

    const userSessions = allSessions
      .filter((s: any) => userMentorships.find((m: any) => m.id === s.mentorshipId))
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);

    const userRequests = allRequests
      .filter((r: any) => r.mentorId === authUser.id || r.studentId === authUser.id)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 2);

    // Format activities
    for (const session of userSessions) {
      const mentorship = userMentorships.find((m: any) => m.id === session.mentorshipId);
      if (mentorship && session.status === 'completed') {
        const otherUserId = userProfile.role === 'diaspora' ? mentorship.studentId : mentorship.mentorId;
        const otherUser = await kv.get(`user:${otherUserId}`);
        activities.push({
          color: 'bg-[var(--ispora-success)]',
          text: `Session with <strong>${otherUser?.firstName} ${otherUser?.lastName}</strong> completed`,
          time: formatTimeAgo(session.completedAt || session.createdAt)
        });
      }
    }

    for (const request of userRequests) {
      if (request.status === 'pending' && userProfile.role === 'diaspora') {
        const otherUser = await kv.get(`user:${request.studentId}`);
        activities.push({
          color: 'bg-[var(--ispora-brand)]',
          text: `New request from <strong>${otherUser?.firstName} ${otherUser?.lastName}</strong>`,
          time: formatTimeAgo(request.createdAt)
        });
      }
    }

    if (activities.length > 0) {
      activities.push({
        color: 'bg-[var(--ispora-warn)]',
        text: 'Profile viewed <strong>14 times</strong> this week',
        time: 'This week'
      });
    }

    return c.json({ success: true, activities });
  } catch (error: any) {
    console.log('Get user activity error:', error);
    return c.json({ error: error.message || 'Failed to get activity' }, 500);
  }
});

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ══════════════════════════════════════════════════════════════════════════════
// ── MENTORSHIP REQUEST ROUTES ──
// ═════════════════════════════════════════════════���═════════��══════════════════

// Create mentorship request
app.post("/make-server-b8526fa6/requests", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const { user } = auth;
    const body = await c.req.json();
    const { mentorId, message } = body;

    console.log('=== CREATE MENTORSHIP REQUEST ===');
    console.log('Student ID:', user.id);
    console.log('Mentor ID:', mentorId);
    console.log('Message:', message);

    if (!mentorId || !message) {
      return c.json({ error: 'Mentor ID and message are required' }, 400);
    }

    const requestId = generateId('req');
    const request = {
      id: requestId,
      studentId: user.id,
      mentorId,
      message,
      status: 'pending', // pending, accepted, declined
      createdAt: new Date().toISOString(),
    };

    await kv.set(`request:${requestId}`, request);
    console.log('✓ Request created:', requestId);

    // Create notification for mentor
    const notificationId = generateId('notif');
    await kv.set(`notification:${notificationId}`, {
      id: notificationId,
      userId: mentorId,
      type: 'mentorship_request',
      title: 'New mentorship request',
      message: `You have a new mentorship request`,
      read: false,
      data: { requestId },
      createdAt: new Date().toISOString(),
    });
    console.log('✓ Notification created for mentor:', mentorId);

    // Send WhatsApp notification to mentor
    const mentorProfile = await kv.get(`user:${mentorId}`);
    const studentProfile = await kv.get(`user:${user.id}`);
    if (mentorProfile && studentProfile) {
      await notifications.sendMentorshipRequestNotification(request, mentorProfile, studentProfile, kv.get);
    }

    return c.json({ success: true, request });
  } catch (error: any) {
    console.log('Create request error:', error);
    return c.json({ error: error.message || 'Failed to create request' }, 500);
  }
});

// Get all requests for current user (sent or received)
app.get("/make-server-b8526fa6/requests", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const { user } = auth;
    const type = c.req.query('type'); // 'sent' or 'received'

    console.log('=== GET REQUESTS ===');
    console.log('User ID:', user.id);
    console.log('Type:', type);

    const allRequests = await kv.getByPrefix('request:') || [];
    console.log('Total requests in system:', (Array.isArray(allRequests) ? allRequests : []).length);
    
    let requests = allRequests;

    if (type === 'sent') {
      requests = allRequests.filter((r: any) => r.studentId === user.id);
      console.log('Sent requests found:', requests.length);
    } else if (type === 'received') {
      requests = allRequests.filter((r: any) => r.mentorId === user.id);
      console.log('Received requests found:', requests.length);
      console.log('Received request IDs:', requests.map((r: any) => ({ id: r.id, mentorId: r.mentorId })));
    } else {
      // Get both sent and received
      requests = allRequests.filter(
        (r: any) => r.studentId === user.id || r.mentorId === user.id
      );
      console.log('All user requests found:', requests.length);
    }

    // Enrich with user data
    const enrichedRequests = await Promise.all(
      requests.map(async (request: any) => {
        const student = await kv.get(`user:${request.studentId}`);
        const mentor = await kv.get(`user:${request.mentorId}`);
        return {
          ...request,
          student: student ? { id: student.id, firstName: student.firstName, lastName: student.lastName, email: student.email, profilePicture: student.profilePicture } : null,
          mentor: mentor ? { id: mentor.id, firstName: mentor.firstName, lastName: mentor.lastName, email: mentor.email, profilePicture: mentor.profilePicture } : null,
        };
      })
    );

    console.log('✓ Returning', enrichedRequests.length, 'enriched requests');
    return c.json({ success: true, requests: enrichedRequests });
  } catch (error: any) {
    console.log('Get requests error:', error);
    return c.json({ error: error.message || 'Failed to get requests' }, 500);
  }
});

// Get single request
app.get("/make-server-b8526fa6/requests/:requestId", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const requestId = c.req.param('requestId');
    const request = await kv.get(`request:${requestId}`);

    if (!request) {
      return c.json({ error: 'Request not found' }, 404);
    }

    // Enrich with user data
    const student = await kv.get(`user:${request.studentId}`);
    const mentor = await kv.get(`user:${request.mentorId}`);

    return c.json({
      success: true,
      request: {
        ...request,
        student: student ? { id: student.id, firstName: student.firstName, lastName: student.lastName, profilePicture: student.profilePicture } : null,
        mentor: mentor ? { id: mentor.id, firstName: mentor.firstName, lastName: mentor.lastName, profilePicture: mentor.profilePicture } : null,
      },
    });
  } catch (error: any) {
    console.log('Get request error:', error);
    return c.json({ error: error.message || 'Failed to get request' }, 500);
  }
});

// Accept mentorship request
app.post("/make-server-b8526fa6/requests/:requestId/accept", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const { user } = auth;
    const requestId = c.req.param('requestId');
    const request = await kv.get(`request:${requestId}`);

    if (!request) {
      return c.json({ error: 'Request not found' }, 404);
    }

    // Only mentor can accept
    if (request.mentorId !== user.id) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    // Update request status
    await kv.set(`request:${requestId}`, {
      ...request,
      status: 'accepted',
      acceptedAt: new Date().toISOString(),
    });

    // Create mentorship relationship
    const mentorshipId = generateId('mentorship');
    const mentorship = {
      id: mentorshipId,
      mentorId: request.mentorId,
      studentId: request.studentId,
      status: 'active',
      startedAt: new Date().toISOString(),
      requestId,
    };

    await kv.set(`mentorship:${mentorshipId}`, mentorship);

    // Create notification for student
    const notificationId = generateId('notif');
    await kv.set(`notification:${notificationId}`, {
      id: notificationId,
      userId: request.studentId,
      type: 'mentorship_accepted',
      title: 'Mentorship request accepted!',
      message: 'Your mentorship request has been accepted',
      read: false,
      data: { mentorshipId, requestId },
      createdAt: new Date().toISOString(),
    });

    // Send WhatsApp notification to student
    const mentorProfile = await kv.get(`user:${request.mentorId}`);
    const studentProfile = await kv.get(`user:${request.studentId}`);
    if (mentorProfile && studentProfile) {
      await notifications.sendMentorshipAcceptedNotification(mentorship, mentorProfile, studentProfile, kv.get);
    }

    return c.json({ success: true, mentorship });
  } catch (error: any) {
    console.log('Accept request error:', error);
    return c.json({ error: error.message || 'Failed to accept request' }, 500);
  }
});

// Decline mentorship request
app.post("/make-server-b8526fa6/requests/:requestId/decline", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const { user } = auth;
    const requestId = c.req.param('requestId');
    const body = await c.req.json();
    const { reason } = body;

    const request = await kv.get(`request:${requestId}`);

    if (!request) {
      return c.json({ error: 'Request not found' }, 404);
    }

    // Only mentor can decline
    if (request.mentorId !== user.id) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    // Update request status
    await kv.set(`request:${requestId}`, {
      ...request,
      status: 'declined',
      declinedAt: new Date().toISOString(),
      declineReason: reason,
    });

    // Create notification for student
    const notificationId = generateId('notif');
    await kv.set(`notification:${notificationId}`, {
      id: notificationId,
      userId: request.studentId,
      type: 'mentorship_declined',
      title: 'Mentorship request declined',
      message: 'Your mentorship request was declined',
      read: false,
      data: { requestId },
      createdAt: new Date().toISOString(),
    });

    return c.json({ success: true, message: 'Request declined' });
  } catch (error: any) {
    console.log('Decline request error:', error);
    return c.json({ error: error.message || 'Failed to decline request' }, 500);
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// ── MENTORSHIP ROUTES ──
// ════════════════════════════════════════════════════════════════════════════��═

// Get all mentorships for current user
app.get("/make-server-b8526fa6/mentorships", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const { user } = auth;

    const allMentorships = await kv.getByPrefix('mentorship:') || [];
    const mentorships = (Array.isArray(allMentorships) ? allMentorships : []).filter(
      (m: any) => m.mentorId === user.id || m.studentId === user.id
    );

    // Enrich with user data
    const enrichedMentorships = await Promise.all(
      mentorships.map(async (mentorship: any) => {
        const student = await kv.get(`user:${mentorship.studentId}`);
        const mentor = await kv.get(`user:${mentorship.mentorId}`);
        return {
          ...mentorship,
          student: student ? {
            id: student.id,
            firstName: student.firstName,
            lastName: student.lastName,
            email: student.email,
            university: student.university,
            fieldOfStudy: student.fieldOfStudy,
            profilePicture: student.profilePicture,
          } : null,
          mentor: mentor ? {
            id: mentor.id,
            firstName: mentor.firstName,
            lastName: mentor.lastName,
            email: mentor.email,
            company: mentor.company,
            jobTitle: mentor.jobTitle,
            profilePicture: mentor.profilePicture,
          } : null,
        };
      })
    );

    return c.json({ success: true, mentorships: enrichedMentorships });
  } catch (error: any) {
    console.log('Get mentorships error:', error);
    return c.json({ error: error.message || 'Failed to get mentorships' }, 500);
  }
});

// Get single mentorship
app.get("/make-server-b8526fa6/mentorships/:mentorshipId", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const { user } = auth;
    const mentorshipId = c.req.param('mentorshipId');
    const mentorship = await kv.get(`mentorship:${mentorshipId}`);

    if (!mentorship) {
      return c.json({ error: 'Mentorship not found' }, 404);
    }

    // Check authorization
    if (mentorship.mentorId !== user.id && mentorship.studentId !== user.id) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    // Enrich with user data
    const student = await kv.get(`user:${mentorship.studentId}`);
    const mentor = await kv.get(`user:${mentorship.mentorId}`);

    return c.json({
      success: true,
      mentorship: {
        ...mentorship,
        student,
        mentor,
      },
    });
  } catch (error: any) {
    console.log('Get mentorship error:', error);
    return c.json({ error: error.message || 'Failed to get mentorship' }, 500);
  }
});

// End mentorship
app.post("/make-server-b8526fa6/mentorships/:mentorshipId/end", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const { user } = auth;
    const mentorshipId = c.req.param('mentorshipId');
    const mentorship = await kv.get(`mentorship:${mentorshipId}`);

    if (!mentorship) {
      return c.json({ error: 'Mentorship not found' }, 404);
    }

    // Check authorization
    if (mentorship.mentorId !== user.id && mentorship.studentId !== user.id) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    // Update mentorship status
    await kv.set(`mentorship:${mentorshipId}`, {
      ...mentorship,
      status: 'ended',
      endedAt: new Date().toISOString(),
    });

    // Create notification for other party
    const otherUserId = user.id === mentorship.mentorId ? mentorship.studentId : mentorship.mentorId;
    const notificationId = generateId('notif');
    await kv.set(`notification:${notificationId}`, {
      id: notificationId,
      userId: otherUserId,
      type: 'mentorship_ended',
      title: 'Mentorship ended',
      message: 'A mentorship has been ended',
      read: false,
      data: { mentorshipId },
      createdAt: new Date().toISOString(),
    });

    return c.json({ success: true, message: 'Mentorship ended' });
  } catch (error: any) {
    console.log('End mentorship error:', error);
    return c.json({ error: error.message || 'Failed to end mentorship' }, 500);
  }
});

// ═════════════════════════════════════════════════════════════��════════════════
// ── OPPORTUNITIES ROUTES ──
// ══════════════════════════════════════════════════════════════════════════════

// Create opportunity
app.post("/make-server-b8526fa6/opportunities", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const { user } = auth;
    const body = await c.req.json();

    console.log('[Create Opportunity] Received body:', JSON.stringify(body, null, 2));

    // Validate required fields including applicationUrl
    if (!body.title || !body.company || !body.location || !body.description || !body.applicationUrl) {
      return c.json({ 
        error: 'Missing required fields. Please provide title, company, location, description, and application URL.' 
      }, 400);
    }

    // Basic URL validation - check for common URL patterns
    const hasValidUrlFormat = body.applicationUrl && 
      typeof body.applicationUrl === 'string' && 
      body.applicationUrl.length > 0 &&
      (body.applicationUrl.includes('.') || body.applicationUrl.startsWith('http'));
    
    if (!hasValidUrlFormat) {
      return c.json({ 
        error: 'Invalid application URL. Please provide a valid website link.' 
      }, 400);
    }

    const opportunityId = generateId('opp');
    const opportunity = {
      id: opportunityId,
      ...body,
      postedBy: user.id,
      status: 'active',
      createdAt: new Date().toISOString(),
      bookmarkedBy: [],
    };

    console.log('[Create Opportunity] Storing opportunity:', JSON.stringify(opportunity, null, 2));

    await kv.set(`opportunity:${opportunityId}`, opportunity);

    return c.json({ success: true, opportunity });
  } catch (error: any) {
    console.log('Create opportunity error:', error);
    return c.json({ error: error.message || 'Failed to create opportunity' }, 500);
  }
});

// Get all opportunities
app.get("/make-server-b8526fa6/opportunities", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const type = c.req.query('type'); // 'all', 'internships', 'jobs', 'scholarships'
    const search = c.req.query('search');

    let opportunities = await kv.getByPrefix('opportunity:') || [];
    opportunities = Array.isArray(opportunities) ? opportunities : [];

    // Filter by type
    if (type && type !== 'all') {
      opportunities = opportunities.filter((o: any) => o.type === type);
    }

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      opportunities = opportunities.filter((o: any) =>
        o.title?.toLowerCase().includes(searchLower) ||
        o.company?.toLowerCase().includes(searchLower) ||
        o.description?.toLowerCase().includes(searchLower)
      );
    }

    // Enrich with poster data
    const enrichedOpportunities = await Promise.all(
      opportunities.map(async (opp: any) => {
        const poster = await kv.get(`user:${opp.postedBy}`);
        return {
          ...opp,
          poster: poster ? {
            id: poster.id,
            firstName: poster.firstName,
            lastName: poster.lastName,
          } : null,
          postedByName: poster ? `${poster.firstName} ${poster.lastName}` : (opp.postedByAdmin ? 'Ispora Team' : null),
          postedByRole: poster ? (poster.role === 'diaspora' ? 'Mentor' : poster.role === 'student' ? 'Student' : poster.role === 'admin' ? 'Admin' : 'Member') : (opp.postedByAdmin ? 'Platform Admin' : null),
        };
      })
    );

    return c.json({ success: true, opportunities: enrichedOpportunities });
  } catch (error: any) {
    console.log('Get opportunities error:', error);
    return c.json({ error: error.message || 'Failed to get opportunities' }, 500);
  }
});

// Get single opportunity
app.get("/make-server-b8526fa6/opportunities/:opportunityId", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const opportunityId = c.req.param('opportunityId');
    const opportunity = await kv.get(`opportunity:${opportunityId}`);

    if (!opportunity) {
      return c.json({ error: 'Opportunity not found' }, 404);
    }

    // Increment view count
    const updatedOpportunity = {
      ...opportunity,
      views: (opportunity.views || 0) + 1,
    };
    await kv.set(`opportunity:${opportunityId}`, updatedOpportunity);

    // Enrich with poster data
    const poster = await kv.get(`user:${opportunity.postedBy}`);

    return c.json({
      success: true,
      opportunity: {
        ...updatedOpportunity,
        poster: poster ? {
          id: poster.id,
          firstName: poster.firstName,
          lastName: poster.lastName,
        } : null,
        postedByName: poster ? `${poster.firstName} ${poster.lastName}` : (updatedOpportunity.postedByAdmin ? 'Ispora Team' : null),
        postedByRole: poster ? (poster.role === 'diaspora' ? 'Mentor' : poster.role === 'student' ? 'Student' : poster.role === 'admin' ? 'Admin' : 'Member') : (updatedOpportunity.postedByAdmin ? 'Platform Admin' : null),
      },
    });
  } catch (error: any) {
    console.log('Get opportunity error:', error);
    return c.json({ error: error.message || 'Failed to get opportunity' }, 500);
  }
});

// Bookmark opportunity
app.post("/make-server-b8526fa6/opportunities/:opportunityId/bookmark", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const { user } = auth;
    const opportunityId = c.req.param('opportunityId');
    const opportunity = await kv.get(`opportunity:${opportunityId}`);

    if (!opportunity) {
      return c.json({ error: 'Opportunity not found' }, 404);
    }

    const bookmarkedBy = opportunity.bookmarkedBy || [];
    
    if (!bookmarkedBy.includes(user.id)) {
      bookmarkedBy.push(user.id);
      await kv.set(`opportunity:${opportunityId}`, {
        ...opportunity,
        bookmarkedBy,
      });
    }

    return c.json({ success: true, message: 'Opportunity bookmarked' });
  } catch (error: any) {
    console.log('Bookmark opportunity error:', error);
    return c.json({ error: error.message || 'Failed to bookmark opportunity' }, 500);
  }
});

// Unbookmark opportunity
app.delete("/make-server-b8526fa6/opportunities/:opportunityId/bookmark", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const { user } = auth;
    const opportunityId = c.req.param('opportunityId');
    const opportunity = await kv.get(`opportunity:${opportunityId}`);

    if (!opportunity) {
      return c.json({ error: 'Opportunity not found' }, 404);
    }

    const bookmarkedBy = opportunity.bookmarkedBy || [];
    const filtered = bookmarkedBy.filter((id: string) => id !== user.id);

    await kv.set(`opportunity:${opportunityId}`, {
      ...opportunity,
      bookmarkedBy: filtered,
    });

    return c.json({ success: true, message: 'Bookmark removed' });
  } catch (error: any) {
    console.log('Unbookmark opportunity error:', error);
    return c.json({ error: error.message || 'Failed to unbookmark opportunity' }, 500);
  }
});

// Track opportunity click (when user clicks apply/view link)
app.post("/make-server-b8526fa6/opportunities/:opportunityId/click", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const opportunityId = c.req.param('opportunityId');
    const opportunity = await kv.get(`opportunity:${opportunityId}`);

    if (!opportunity) {
      return c.json({ error: 'Opportunity not found' }, 404);
    }

    // Increment click count
    const updatedOpportunity = {
      ...opportunity,
      clicks: (opportunity.clicks || 0) + 1,
    };
    await kv.set(`opportunity:${opportunityId}`, updatedOpportunity);

    return c.json({ success: true, message: 'Click tracked' });
  } catch (error: any) {
    console.log('Track opportunity click error:', error);
    return c.json({ error: error.message || 'Failed to track click' }, 500);
  }
});

// Update opportunity (user can only update their own)
app.put("/make-server-b8526fa6/opportunities/:opportunityId", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const { user } = auth;
    const opportunityId = c.req.param('opportunityId');
    const body = await c.req.json();

    const opportunity = await kv.get(`opportunity:${opportunityId}`);
    if (!opportunity) {
      return c.json({ error: 'Opportunity not found' }, 404);
    }

    // Only allow owner or admin to update
    if (opportunity.postedBy !== user.id && user.role !== 'admin') {
      return c.json({ error: 'Unauthorized: You can only update your own opportunities' }, 403);
    }

    console.log('[Update Opportunity] Updating opportunity:', opportunityId);
    console.log('[Update Opportunity] New data:', JSON.stringify(body, null, 2));

    // Validate applicationUrl if it's being updated
    if (body.applicationUrl) {
      const hasValidUrlFormat = body.applicationUrl && 
        typeof body.applicationUrl === 'string' && 
        body.applicationUrl.length > 0 &&
        (body.applicationUrl.includes('.') || body.applicationUrl.startsWith('http'));
      
      if (!hasValidUrlFormat) {
        return c.json({ 
          error: 'Invalid application URL. Please provide a valid website link.' 
        }, 400);
      }
    }

    const updatedOpportunity = {
      ...opportunity,
      ...body,
      id: opportunityId, // Ensure ID doesn't change
      postedBy: opportunity.postedBy, // Ensure owner doesn't change
      updatedAt: new Date().toISOString()
    };

    await kv.set(`opportunity:${opportunityId}`, updatedOpportunity);

    return c.json({ success: true, opportunity: updatedOpportunity });
  } catch (error: any) {
    console.log('Update opportunity error:', error);
    return c.json({ error: error.message || 'Failed to update opportunity' }, 500);
  }
});

// Get user's bookmarked opportunities
app.get("/make-server-b8526fa6/opportunities/bookmarked/me", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const { user } = auth;
    const allOpportunities = await kv.getByPrefix('opportunity:');
    
    const bookmarked = allOpportunities.filter((o: any) =>
      o.bookmarkedBy && o.bookmarkedBy.includes(user.id)
    );

    // Enrich with poster data
    const enrichedBookmarked = await Promise.all(
      bookmarked.map(async (opp: any) => {
        const poster = await kv.get(`user:${opp.postedBy}`);
        return {
          ...opp,
          poster: poster ? {
            id: poster.id,
            firstName: poster.firstName,
            lastName: poster.lastName,
          } : null,
          postedByName: poster ? `${poster.firstName} ${poster.lastName}` : (opp.postedByAdmin ? 'Ispora Team' : null),
          postedByRole: poster ? (poster.role === 'diaspora' ? 'Mentor' : poster.role === 'student' ? 'Student' : poster.role === 'admin' ? 'Admin' : 'Member') : (opp.postedByAdmin ? 'Platform Admin' : null),
        };
      })
    );

    return c.json({ success: true, opportunities: enrichedBookmarked });
  } catch (error: any) {
    console.log('Get bookmarked opportunities error:', error);
    return c.json({ error: error.message || 'Failed to get bookmarked opportunities' }, 500);
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// ── NOTIFICATIONS ROUTES ──
// ══════════════════════════════════════════════════════════════════════════════

// Get user notifications
app.get("/make-server-b8526fa6/notifications", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const { user } = auth;
    const allNotifications = await kv.getByPrefix('notification:') || [];
    
    const userNotifications = (Array.isArray(allNotifications) ? allNotifications : [])
      .filter((n: any) => n.userId === user.id)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return c.json({ success: true, notifications: userNotifications });
  } catch (error: any) {
    console.log('Get notifications error:', error);
    return c.json({ error: error.message || 'Failed to get notifications' }, 500);
  }
});

// Mark notification as read
app.put("/make-server-b8526fa6/notifications/:notificationId/read", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const { user } = auth;
    const notificationId = c.req.param('notificationId');
    const notification = await kv.get(`notification:${notificationId}`);

    if (!notification) {
      return c.json({ error: 'Notification not found' }, 404);
    }

    if (notification.userId !== user.id) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    await kv.set(`notification:${notificationId}`, {
      ...notification,
      read: true,
      readAt: new Date().toISOString(),
    });

    return c.json({ success: true, message: 'Notification marked as read' });
  } catch (error: any) {
    console.log('Mark notification as read error:', error);
    return c.json({ error: error.message || 'Failed to mark notification as read' }, 500);
  }
});

// Mark all notifications as read
app.put("/make-server-b8526fa6/notifications/read-all", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const { user } = auth;
    const allNotifications = await kv.getByPrefix('notification:');
    const userNotifications = allNotifications.filter((n: any) => n.userId === user.id && !n.read);

    await Promise.all(
      userNotifications.map((notification: any) =>
        kv.set(`notification:${notification.id}`, {
          ...notification,
          read: true,
          readAt: new Date().toISOString(),
        })
      )
    );

    return c.json({ success: true, message: 'All notifications marked as read' });
  } catch (error: any) {
    console.log('Mark all notifications as read error:', error);
    return c.json({ error: error.message || 'Failed to mark all notifications as read' }, 500);
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// ── SESSIONS/BOOKINGS ROUTES ──
// ════════════════════════════���═════════════════════════════════════════════════

// Create session booking
app.post("/make-server-b8526fa6/sessions", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const { user } = auth;
    const body = await c.req.json();
    const { mentorshipId, scheduledAt, duration, topic, notes } = body;

    if (!mentorshipId || !scheduledAt || !duration) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Verify mentorship exists
    const mentorship = await kv.get(`mentorship:${mentorshipId}`);
    if (!mentorship) {
      return c.json({ error: 'Mentorship not found' }, 404);
    }

    // Check authorization
    if (mentorship.mentorId !== user.id && mentorship.studentId !== user.id) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const sessionId = generateId('session');
    
    // Generate short code for the session
    let shortCode: string | undefined;
    try {
      shortCode = await generateShortCode(mentorship.mentorId);
      console.log('✓ Generated short code:', shortCode);
    } catch (error: any) {
      console.log('Warning: Failed to generate short code:', error.message);
      // Continue without short code if generation fails
    }
    
    const session = {
      id: sessionId,
      mentorshipId,
      mentorId: mentorship.mentorId,
      studentId: mentorship.studentId,
      scheduledAt,
      duration,
      topic,
      notes,
      status: 'scheduled',
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      short_code: shortCode, // Add short code to session
    };

    await kv.set(`session:${sessionId}`, session);

    // Create notification for other party
    const otherUserId = user.id === mentorship.mentorId ? mentorship.studentId : mentorship.mentorId;
    const notificationId = generateId('notif');
    await kv.set(`notification:${notificationId}`, {
      id: notificationId,
      userId: otherUserId,
      type: 'session_scheduled',
      title: 'New session scheduled',
      message: `A session has been scheduled for ${new Date(scheduledAt).toLocaleDateString()}`,
      read: false,
      data: { sessionId },
      createdAt: new Date().toISOString(),
    });

    // Send WhatsApp notification to other party
    const creatorProfile = await kv.get(`user:${user.id}`);
    const participantProfile = await kv.get(`user:${otherUserId}`);
    if (creatorProfile && participantProfile) {
      await notifications.sendSessionScheduledNotification(session, creatorProfile, participantProfile, kv.get);
    }

    return c.json({ success: true, session });
  } catch (error: any) {
    console.log('Create session error:', error);
    return c.json({ error: error.message || 'Failed to create session' }, 500);
  }
});

// Get user sessions
app.get("/make-server-b8526fa6/sessions", async (c) => {
  try {
    console.log('=== Get Sessions Endpoint ===');
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const { user } = auth;
    console.log('Fetching sessions for user:', user.id);
    
    const allSessions = await kv.getByPrefix('session:') || [];
    console.log('Total sessions in database:', Array.isArray(allSessions) ? allSessions.length : 0);
    
    const userSessions = (Array.isArray(allSessions) ? allSessions : [])
      .filter((s: any) => {
        // Check if this is a public session first
        let isPublicSession = false;
        let registeredStudents: string[] = [];
        try {
          if (s.notes) {
            const sessionDetails = JSON.parse(s.notes);
            isPublicSession = sessionDetails.sessionType === 'public';
            registeredStudents = sessionDetails.registeredStudents || [];
          }
        } catch (e) {}
        
        // For PUBLIC sessions:
        // - Include if user is the MENTOR (host)
        // - Include if user is in registeredStudents array (registered participant)
        if (isPublicSession) {
          if (s.mentorId === user.id) {
            return true; // User is hosting this public session
          }
          if (registeredStudents.includes(user.id)) {
            return true; // User is registered for this public session
          }
          return false; // User is not involved in this public session
        }
        
        // For PRIVATE/GROUP sessions:
        // - Include if user is mentor OR student
        if (s.mentorId === user.id || s.studentId === user.id) {
          return true;
        }
        
        return false;
      })
      .sort((a: any, b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

    console.log('User sessions count:', userSessions.length);

    // Enrich with mentorship and user data - with error handling for each session
    const enrichedSessions = await Promise.all(
      userSessions.map(async (session: any) => {
        try {
          const [mentorship, student, mentor] = await Promise.all([
            kv.get(`mentorship:${session.mentorshipId}`).catch(() => null),
            session.studentId ? kv.get(`user:${session.studentId}`).catch(() => null) : null,
            session.mentorId ? kv.get(`user:${session.mentorId}`).catch(() => null) : null
          ]);
          
          return {
            ...session,
            mentorship,
            student: student ? { id: student.id, firstName: student.firstName, lastName: student.lastName, profilePicture: student.profilePicture } : null,
            mentor: mentor ? { id: mentor.id, firstName: mentor.firstName, lastName: mentor.lastName, profilePicture: mentor.profilePicture } : null,
          };
        } catch (error: any) {
          console.error('Error enriching session:', session.id, error.message);
          // Return session without enrichment if error occurs
          return session;
        }
      })
    );

    console.log('✓ Sessions enriched successfully');
    return c.json({ success: true, sessions: enrichedSessions });
  } catch (error: any) {
    console.error('Get sessions error:', error.message, error.stack);
    return c.json({ error: error.message || 'Failed to get sessions' }, 500);
  }
});

// Update session
app.put("/make-server-b8526fa6/sessions/:sessionId", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const { user } = auth;
    const sessionId = c.req.param('sessionId');
    const session = await kv.get(`session:${sessionId}`);

    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    // Check authorization
    if (session.mentorId !== user.id && session.studentId !== user.id) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const body = await c.req.json();
    await kv.set(`session:${sessionId}`, {
      ...session,
      ...body,
      updatedAt: new Date().toISOString(),
    });

    const updatedSession = await kv.get(`session:${sessionId}`);
    return c.json({ success: true, session: updatedSession });
  } catch (error: any) {
    console.log('Update session error:', error);
    return c.json({ error: error.message || 'Failed to update session' }, 500);
  }
});

// Cancel session
app.post("/make-server-b8526fa6/sessions/:sessionId/cancel", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const { user } = auth;
    const sessionId = c.req.param('sessionId');
    const session = await kv.get(`session:${sessionId}`);

    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    // Check authorization
    if (session.mentorId !== user.id && session.studentId !== user.id) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    await kv.set(`session:${sessionId}`, {
      ...session,
      status: 'cancelled',
      cancelledBy: user.id,
      cancelledAt: new Date().toISOString(),
    });

    // Notify other party
    const otherUserId = user.id === session.mentorId ? session.studentId : session.mentorId;
    const notificationId = generateId('notif');
    await kv.set(`notification:${notificationId}`, {
      id: notificationId,
      userId: otherUserId,
      type: 'session_cancelled',
      title: 'Session cancelled',
      message: 'A scheduled session has been cancelled',
      read: false,
      data: { sessionId },
      createdAt: new Date().toISOString(),
    });

    return c.json({ success: true, message: 'Session cancelled' });
  } catch (error: any) {
    console.log('Cancel session error:', error);
    return c.json({ error: error.message || 'Failed to cancel session' }, 500);
  }
});

// Delete session (permanent deletion)
app.delete("/make-server-b8526fa6/sessions/:sessionId", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const { user } = auth;
    const sessionId = c.req.param('sessionId');
    const session = await kv.get(`session:${sessionId}`);

    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    // Only the mentor who created the session can delete it
    if (session.mentorId !== user.id) {
      return c.json({ error: 'Only the session creator can delete this session' }, 403);
    }

    // Delete the session from KV store
    await kv.del(`session:${sessionId}`);

    // Notify registered students if any
    if (session.registeredUsers && session.registeredUsers.length > 0) {
      for (const studentId of session.registeredUsers) {
        const notificationId = generateId('notif');
        await kv.set(`notification:${notificationId}`, {
          id: notificationId,
          userId: studentId,
          type: 'session_deleted',
          title: 'Session deleted',
          message: `The session "${session.topic || 'Mentorship Session'}" has been deleted by the mentor`,
          read: false,
          data: { sessionId, sessionTopic: session.topic },
          createdAt: new Date().toISOString(),
        });
      }
    }

    // Also notify the student if it's a private session
    if (session.studentId && !session.registeredUsers?.includes(session.studentId)) {
      const notificationId = generateId('notif');
      await kv.set(`notification:${notificationId}`, {
        id: notificationId,
        userId: session.studentId,
        type: 'session_deleted',
        title: 'Session deleted',
        message: `The session "${session.topic || 'Mentorship Session'}" has been deleted by the mentor`,
        read: false,
        data: { sessionId, sessionTopic: session.topic },
        createdAt: new Date().toISOString(),
      });
    }

    return c.json({ success: true, message: 'Session deleted successfully' });
  } catch (error: any) {
    console.log('Delete session error:', error);
    return c.json({ error: error.message || 'Failed to delete session' }, 500);
  }
});

// Register for public session
app.post("/make-server-b8526fa6/sessions/:sessionId/register", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const { user } = auth;
    const sessionId = c.req.param('sessionId');
    const session = await kv.get(`session:${sessionId}`);

    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    // Parse session notes to check if it's public and has capacity
    let sessionDetails = { sessionType: 'private', capacity: 0, registeredStudents: [] };
    try {
      if (session.notes) {
        sessionDetails = { ...sessionDetails, ...JSON.parse(session.notes) };
      }
    } catch (e) {
      console.log('Error parsing session notes:', e);
    }

    // Check if session is public
    if (sessionDetails.sessionType !== 'public') {
      return c.json({ error: 'Only public sessions allow registration' }, 400);
    }

    // Check if user is already registered
    if (sessionDetails.registeredStudents.includes(user.id)) {
      return c.json({ error: 'Already registered for this session' }, 400);
    }

    // Check capacity
    if (sessionDetails.registeredStudents.length >= sessionDetails.capacity) {
      return c.json({ error: 'Session is full' }, 400);
    }

    // Check if this is part of a recurring series
    const seriesId = sessionDetails.seriesId;
    const sessionsToUpdate = [];
    
    if (seriesId) {
      // This is a recurring session - register user for ALL sessions in the series
      const allSessions = await kv.getByPrefix('session:') || [];
      const seriesSessions = (Array.isArray(allSessions) ? allSessions : []).filter((s: any) => {
        try {
          if (s.notes) {
            const notes = JSON.parse(s.notes);
            return notes.seriesId === seriesId && notes.sessionType === 'public' && s.status === 'scheduled';
          }
        } catch (e) {}
        return false;
      });
      
      // Add user to all sessions in the series
      for (const seriesSession of seriesSessions) {
        let seriesDetails: any = {};
        try {
          if (seriesSession.notes) {
            seriesDetails = JSON.parse(seriesSession.notes);
          }
        } catch (e) {}
        
        // Skip if already registered or full
        if (!seriesDetails.registeredStudents) {
          seriesDetails.registeredStudents = [];
        }
        
        if (!seriesDetails.registeredStudents.includes(user.id)) {
          seriesDetails.registeredStudents.push(user.id);
          seriesDetails.registeredCount = seriesDetails.registeredStudents.length;
          
          await kv.set(`session:${seriesSession.id}`, {
            ...seriesSession,
            notes: JSON.stringify(seriesDetails),
            updatedAt: new Date().toISOString(),
          });
          
          sessionsToUpdate.push(seriesSession.id);
        }
      }
    } else {
      // Single session - just register for this one
      sessionDetails.registeredStudents.push(user.id);
      sessionDetails.registeredCount = sessionDetails.registeredStudents.length;

      await kv.set(`session:${sessionId}`, {
        ...session,
        notes: JSON.stringify(sessionDetails),
        updatedAt: new Date().toISOString(),
      });
    }

    // Notify mentor
    const notificationId = generateId('notif');
    const sessionCount = seriesId ? sessionsToUpdate.length : 1;
    await kv.set(`notification:${notificationId}`, {
      id: notificationId,
      userId: session.mentorId,
      type: 'session_registration',
      title: 'New session registration',
      message: `${user.firstName} ${user.lastName} registered for your ${seriesId ? `recurring session series (${sessionCount} sessions)` : 'public session'}`,
      read: false,
      data: { sessionId },
      createdAt: new Date().toISOString(),
    });

    const updatedSession = await kv.get(`session:${sessionId}`);
    return c.json({ success: true, session: updatedSession });
  } catch (error: any) {
    console.log('Register for session error:', error);
    return c.json({ error: error.message || 'Failed to register for session' }, 500);
  }
});

// Unregister from public session
app.post("/make-server-b8526fa6/sessions/:sessionId/unregister", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const { user } = auth;
    const sessionId = c.req.param('sessionId');
    const session = await kv.get(`session:${sessionId}`);

    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    // Parse session notes
    let sessionDetails = { sessionType: 'private', capacity: 0, registeredStudents: [] };
    try {
      if (session.notes) {
        sessionDetails = { ...sessionDetails, ...JSON.parse(session.notes) };
      }
    } catch (e) {
      console.log('Error parsing session notes:', e);
    }

    // Check if session is public
    if (sessionDetails.sessionType !== 'public') {
      return c.json({ error: 'Only public sessions allow unregistration' }, 400);
    }

    // Check if user is registered
    if (!sessionDetails.registeredStudents.includes(user.id)) {
      return c.json({ error: 'Not registered for this session' }, 400);
    }

    // Check if this is part of a recurring series
    const seriesId = sessionDetails.seriesId;
    
    if (seriesId) {
      // This is a recurring session - unregister user from ALL sessions in the series
      const allSessions = await kv.getByPrefix('session:') || [];
      const seriesSessions = (Array.isArray(allSessions) ? allSessions : []).filter((s: any) => {
        try {
          if (s.notes) {
            const notes = JSON.parse(s.notes);
            return notes.seriesId === seriesId && notes.sessionType === 'public';
          }
        } catch (e) {}
        return false;
      });
      
      // Remove user from all sessions in the series
      for (const seriesSession of seriesSessions) {
        let seriesDetails: any = {};
        try {
          if (seriesSession.notes) {
            seriesDetails = JSON.parse(seriesSession.notes);
          }
        } catch (e) {}
        
        if (seriesDetails.registeredStudents?.includes(user.id)) {
          seriesDetails.registeredStudents = seriesDetails.registeredStudents.filter(
            (id: string) => id !== user.id
          );
          seriesDetails.registeredCount = seriesDetails.registeredStudents.length;
          
          await kv.set(`session:${seriesSession.id}`, {
            ...seriesSession,
            notes: JSON.stringify(seriesDetails),
            updatedAt: new Date().toISOString(),
          });
        }
      }
    } else {
      // Single session - just unregister from this one
      sessionDetails.registeredStudents = sessionDetails.registeredStudents.filter(
        (id: string) => id !== user.id
      );
      sessionDetails.registeredCount = sessionDetails.registeredStudents.length;

      await kv.set(`session:${sessionId}`, {
        ...session,
        notes: JSON.stringify(sessionDetails),
        updatedAt: new Date().toISOString(),
      });
    }

    const updatedSession = await kv.get(`session:${sessionId}`);
    return c.json({ success: true, session: updatedSession });
  } catch (error: any) {
    console.log('Unregister from session error:', error);
    return c.json({ error: error.message || 'Failed to unregister from session' }, 500);
  }
});

// Get all public sessions (for browsing)
app.get("/make-server-b8526fa6/sessions/public", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    console.log('Fetching all public sessions...');
    const { user } = auth;
    
    // Get all sessions
    const allSessions = await kv.getByPrefix('session:') || [];
    console.log(`Found ${allSessions.length} total sessions`);
    
    // Filter for public sessions only that are scheduled (not cancelled/completed)
    const publicSessions = (Array.isArray(allSessions) ? allSessions : []).filter((s: any) => {
      try {
        if (s.status === 'cancelled' || s.status === 'completed') {
          return false;
        }
        if (s.notes) {
          const parsed = JSON.parse(s.notes);
          return parsed.sessionType === 'public';
        }
      } catch (e) {
        // Invalid JSON
      }
      return false;
    }).sort((a: any, b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

    // Enrich with mentor data and social features
    const enrichedSessions = await Promise.all(
      publicSessions.map(async (session: any) => {
        const mentor = await kv.get(`user:${session.mentorId}`);
        
        // Check if current user has liked this session
        const userLike = await kv.get(`session_like:${session.id}:${user.id}`);
        
        // Ensure social feature counts are initialized (for backwards compatibility)
        return {
          ...session,
          likesCount: session.likesCount || 0,
          viewsCount: session.viewsCount || 0,
          isLikedByCurrentUser: !!userLike,
          mentor: mentor ? { 
            id: mentor.id, 
            firstName: mentor.firstName, 
            lastName: mentor.lastName,
            expertise: mentor.expertise,
            company: mentor.company 
          } : null,
        };
      })
    );

    return c.json({ success: true, sessions: enrichedSessions });
  } catch (error: any) {
    console.log('Get public sessions error:', error);
    return c.json({ error: error.message || 'Failed to get public sessions' }, 500);
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// ── SESSION SOCIAL FEATURES (LIKES & VIEWS) ──
// ══════════════════════════════════════════════════��═══════════════════════════

// Like a session
app.post("/make-server-b8526fa6/sessions/:sessionId/like", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const { user } = auth;
    const sessionId = c.req.param('sessionId');

    const session = await kv.get(`session:${sessionId}`);
    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    const existingLike = await kv.get(`session_like:${sessionId}:${user.id}`);
    if (existingLike) {
      // Already liked - return success to handle race conditions gracefully
      return c.json({ success: true, message: 'Session already liked', alreadyLiked: true });
    }

    const likeId = generateId('like');
    const like = {
      id: likeId,
      sessionId,
      userId: user.id,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`session_like:${sessionId}:${user.id}`, like);

    const updatedSession = {
      ...session,
      likesCount: (session.likesCount || 0) + 1,
    };
    await kv.set(`session:${sessionId}`, updatedSession);

    if (session.mentorId !== user.id) {
      const notificationId = generateId('notif');
      await kv.set(`notification:${notificationId}`, {
        id: notificationId,
        userId: session.mentorId,
        type: 'system',
        title: 'Session Liked',
        message: `${user.firstName} ${user.lastName} liked your session`,
        read: false,
        data: { sessionId, likeId },
        createdAt: new Date().toISOString(),
      });
    }

    return c.json({ success: true, like });
  } catch (error: any) {
    console.log('Like session error:', error);
    return c.json({ error: error.message || 'Failed to like session' }, 500);
  }
});

// Unlike a session
app.delete("/make-server-b8526fa6/sessions/:sessionId/like", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const { user } = auth;
    const sessionId = c.req.param('sessionId');

    const session = await kv.get(`session:${sessionId}`);
    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    const existingLike = await kv.get(`session_like:${sessionId}:${user.id}`);
    if (!existingLike) {
      // Not liked - return success to handle race conditions gracefully
      return c.json({ success: true, message: 'Session not liked', alreadyUnliked: true });
    }

    await kv.del(`session_like:${sessionId}:${user.id}`);

    const updatedSession = {
      ...session,
      likesCount: Math.max((session.likesCount || 0) - 1, 0),
    };
    await kv.set(`session:${sessionId}`, updatedSession);

    return c.json({ success: true });
  } catch (error: any) {
    console.log('Unlike session error:', error);
    return c.json({ error: error.message || 'Failed to unlike session' }, 500);
  }
});

// Get session likes
app.get("/make-server-b8526fa6/sessions/:sessionId/likes", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const sessionId = c.req.param('sessionId');

    const allLikes = await kv.getByPrefix(`session_like:${sessionId}:`) || [];
    
    const enrichedLikes = await Promise.all(
      (Array.isArray(allLikes) ? allLikes : []).map(async (like: any) => {
        const user = await kv.get(`user:${like.userId}`);
        return {
          ...like,
          user: user ? {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            avatar: user.avatar,
          } : null,
        };
      })
    );

    return c.json({ success: true, likes: enrichedLikes, count: enrichedLikes.length });
  } catch (error: any) {
    console.log('Get likes error:', error);
    return c.json({ error: error.message || 'Failed to get likes' }, 500);
  }
});

// Increment session view count
app.post("/make-server-b8526fa6/sessions/:sessionId/view", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const sessionId = c.req.param('sessionId');

    const session = await kv.get(`session:${sessionId}`);
    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    const updatedSession = {
      ...session,
      viewsCount: (session.viewsCount || 0) + 1,
    };
    await kv.set(`session:${sessionId}`, updatedSession);

    return c.json({ success: true, viewsCount: updatedSession.viewsCount });
  } catch (error: any) {
    console.log('Increment view error:', error);
    return c.json({ error: error.message || 'Failed to increment view' }, 500);
  }
});

// ════════════════════════════════════════════════════════════════════════��═════
// ── SESSION RECORDINGS ──
// ══════════════════════════════════════════════════════════════════════════════

// Get past sessions (completed sessions with recordings)
app.get("/make-server-b8526fa6/sessions/past", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const { user } = auth;
    console.log('📚 Fetching past sessions for user:', user.id);
    
    const allSessions = await kv.getByPrefix('session:') || [];
    
    // Filter for completed sessions only
    const pastSessions = (Array.isArray(allSessions) ? allSessions : [])
      .filter((s: any) => {
        // Must be completed
        if (s.status !== 'completed') {
          return false;
        }
        
        // Must have attended
        let isPublicSession = false;
        let registeredStudents: string[] = [];
        try {
          if (s.notes) {
            const sessionDetails = JSON.parse(s.notes);
            isPublicSession = sessionDetails.sessionType === 'public';
            registeredStudents = sessionDetails.registeredStudents || [];
          }
        } catch (e) {
          console.error('Error parsing session notes:', e);
        }
        
        // For public sessions - must be in registeredStudents or be mentor
        if (isPublicSession) {
          return s.mentorId === user.id || registeredStudents.includes(user.id);
        }
        
        // For private/group - must be mentor or student
        return s.mentorId === user.id || s.studentId === user.id;
      })
      .sort((a: any, b: any) => {
        // Sort by completion date (newest first)
        const dateA = new Date(a.completedAt || a.scheduledAt).getTime();
        const dateB = new Date(b.completedAt || b.scheduledAt).getTime();
        return dateB - dateA;
      });

    // Enrich with mentor/student data
    const enrichedSessions = await Promise.all(
      pastSessions.map(async (session: any) => {
        const mentor = await kv.get(`user:${session.mentorId}`);
        let student = null;
        if (session.studentId) {
          student = await kv.get(`user:${session.studentId}`);
        }
        
        return {
          ...session,
          mentor: mentor ? {
            id: mentor.id,
            firstName: mentor.firstName,
            lastName: mentor.lastName,
            email: mentor.email,
            profilePicture: mentor.profilePicture,
          } : null,
          student: student ? {
            id: student.id,
            firstName: student.firstName,
            lastName: student.lastName,
            email: student.email,
          } : null,
        };
      })
    );

    console.log(`✅ Found ${enrichedSessions.length} past sessions for user ${user.id}`);
    return c.json({ success: true, sessions: enrichedSessions });
  } catch (error: any) {
    console.log('Get past sessions error:', error);
    return c.json({ error: error.message || 'Failed to get past sessions' }, 500);
  }
});

// Add recording to a session
app.post("/make-server-b8526fa6/sessions/:sessionId/recording", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const { user } = auth;
    const sessionId = c.req.param('sessionId');
    const body = await c.req.json();
    const { recordingUrl, recordingType = 'link', recordingDuration } = body;

    console.log(`🎥 Adding recording to session ${sessionId}...`);

    if (!recordingUrl) {
      return c.json({ error: 'Recording URL is required' }, 400);
    }

    // Get session
    const session = await kv.get(`session:${sessionId}`);
    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    // Only mentor can add recording
    if (session.mentorId !== user.id) {
      return c.json({ error: 'Only the mentor can add recordings' }, 403);
    }

    // Update session with recording
    const updatedSession = {
      ...session,
      recordingUrl,
      recordingType,
      recordingDuration,
      recordingAddedAt: new Date().toISOString(),
      recordingAddedBy: user.id,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`session:${sessionId}`, updatedSession);

    // Send notifications to all attendees
    try {
      let attendeeIds: string[] = [];
      
      // Get attendee IDs based on session type
      const sessionDetails = JSON.parse(session.notes || '{}');
      if (sessionDetails.sessionType === 'public' || sessionDetails.sessionType === 'group') {
        attendeeIds = sessionDetails.registeredStudents || [];
      } else {
        // One-on-one
        if (session.studentId) {
          attendeeIds = [session.studentId];
        }
      }

      console.log(`📨 Notifying ${attendeeIds.length} attendees about recording...`);

      // Create notifications for each attendee
      const notificationPromises = attendeeIds.map(async (studentId) => {
        const notificationId = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const notification = {
          id: notificationId,
          userId: studentId,
          type: 'recording_added',
          title: '🎥 Recording Available',
          message: `${user.firstName} ${user.lastName} uploaded the recording for "${session.topic}"`,
          sessionId: session.id,
          recordingUrl: updatedSession.recordingUrl,
          read: false,
          createdAt: new Date().toISOString(),
        };
        await kv.set(`notification:${notificationId}`, notification);
      });

      await Promise.all(notificationPromises);
      console.log(`✅ Notified ${attendeeIds.length} attendees about recording`);
    } catch (error) {
      console.error('Failed to notify attendees:', error);
      // Don't fail the request if notifications fail
    }

    return c.json({ success: true, session: updatedSession });
  } catch (error: any) {
    console.log('Add recording error:', error);
    return c.json({ error: error.message || 'Failed to add recording' }, 500);
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// ── PUBLIC SESSION SHARING (NO AUTH REQUIRED) ──
// ══════════════════════════════════════════════════════════════════════════════

// Get public session details (for shareable links - no auth required)
app.get("/make-server-b8526fa6/public/session/:sessionId", async (c) => {
  try {
    const sessionId = c.req.param('sessionId');

    const session = await kv.get(`session:${sessionId}`);
    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    // Parse session notes to get additional details
    let sessionDetails = { 
      platform: 'Google Meet', 
      description: '', 
      capacity: 10, 
      registeredCount: 0,
      isRecurring: false,
      recurrence: null,
      sessionType: 'private'
    };
    
    try {
      if (session.notes) {
        const parsed = JSON.parse(session.notes);
        sessionDetails = { ...sessionDetails, ...parsed };
      }
    } catch (e) {
      console.log('Error parsing session notes:', e);
    }

    // Only show public sessions
    if (sessionDetails.sessionType !== 'public') {
      return c.json({ error: 'Session not available' }, 403);
    }

    // Get mentor details
    const mentor = await kv.get(`user:${session.mentorId}`);

    // Check if the request is from a social media crawler/bot
    const userAgent = c.req.header('user-agent') || '';
    const isSocialBot = /facebookexternalhit|LinkedInBot|WhatsApp|Twitterbot|Slackbot|TelegramBot/i.test(userAgent);

    // If it's a social media bot, return HTML with Open Graph meta tags
    if (isSocialBot) {
      const mentorName = mentor ? `${mentor.firstName} ${mentor.lastName}` : 'Ispora Mentor';
      const mentorTitle = mentor?.profileTitle || 'Professional Mentor';
      
      // Format date
      const sessionDate = new Date(session.start_time);
      const formattedDate = sessionDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      const formattedTime = sessionDate.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      });

      const sessionUrl = session.short_code 
        ? `https://ispora.app/${session.short_code}` 
        : `https://ispora.app/session/${sessionId}`;
      const title = `${session.topic} - Free Mentorship Session on Ispora`;
      const description = `Join ${mentorName}, ${mentorTitle}, for a free mentorship session on ${formattedDate} at ${formattedTime}. ${sessionDetails.description || 'Connect with African diaspora professionals mentoring students in Nigeria.'}`;
      
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  
  <!-- Open Graph Meta Tags -->
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:url" content="${sessionUrl}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Ispora - Mentorship Platform" />
  <meta property="og:image" content="https://ispora.app/og-image.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  
  <!-- Twitter Card Meta Tags -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="https://ispora.app/og-image.png" />
  
  <!-- LinkedIn specific -->
  <meta property="og:locale" content="en_US" />
  
  <!-- Auto-redirect for real browsers -->
  <meta http-equiv="refresh" content="0;url=${sessionUrl}">
</head>
<body>
  <h1>${session.topic}</h1>
  <p>${description}</p>
  <p><a href="${sessionUrl}">View Session Details</a></p>
</body>
</html>`;

      return c.html(html);
    }

    // Check if session is full
    const isFull = sessionDetails.registeredCount >= sessionDetails.capacity;
    const spotsLeft = sessionDetails.capacity - sessionDetails.registeredCount;

    return c.json({
      success: true,
      session: {
        id: session.id,
        topic: session.topic,
        scheduledAt: session.scheduledAt,
        duration: session.duration,
        status: session.status,
        visibility: 'public',
        likesCount: session.likesCount || 0,
        viewsCount: session.viewsCount || 0,
        ...sessionDetails,
        isFull,
        spotsLeft,
        mentor: mentor ? {
          id: mentor.id,
          firstName: mentor.firstName,
          lastName: mentor.lastName,
          avatar: mentor.profilePicture,
          currentRole: mentor.currentRole,
          currentCompany: mentor.currentCompany,
          linkedinProfile: mentor.linkedinProfile,
          bio: mentor.bio,
          expertiseAreas: mentor.expertiseAreas,
          whatICanHelpWith: mentor.whatICanHelpWith,
          industriesWorkedIn: mentor.industriesWorkedIn,
        } : null,
      }
    });
  } catch (error: any) {
    console.log('Get public session error:', error);
    return c.json({ error: error.message || 'Failed to fetch session' }, 500);
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// ── MESSAGES ROUTES ──
// ══════════════════════════════════════════════════════════════════════════════

// Send message
app.post("/make-server-b8526fa6/messages", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const { user } = auth;
    const body = await c.req.json();
    const { mentorshipId, content } = body;

    if (!mentorshipId || !content) {
      return c.json({ error: 'Mentorship ID and content are required' }, 400);
    }

    // Verify mentorship exists
    const mentorship = await kv.get(`mentorship:${mentorshipId}`);
    if (!mentorship) {
      return c.json({ error: 'Mentorship not found' }, 404);
    }

    // Check authorization
    if (mentorship.mentorId !== user.id && mentorship.studentId !== user.id) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const messageId = generateId('msg');
    const message = {
      id: messageId,
      mentorshipId,
      senderId: user.id,
      receiverId: user.id === mentorship.mentorId ? mentorship.studentId : mentorship.mentorId,
      content,
      read: false,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`message:${messageId}`, message);

    // Create notification for receiver
    const notificationId = generateId('notif');
    await kv.set(`notification:${notificationId}`, {
      id: notificationId,
      userId: message.receiverId,
      type: 'new_message',
      title: 'New message',
      message: 'You have a new message',
      read: false,
      data: { messageId, mentorshipId },
      createdAt: new Date().toISOString(),
    });

    // Send WhatsApp notification to receiver
    const senderProfile = await kv.get(`user:${message.senderId}`);
    const receiverProfile = await kv.get(`user:${message.receiverId}`);
    if (senderProfile && receiverProfile) {
      await notifications.sendNewMessageNotification(message, senderProfile, receiverProfile, kv.get);
    }

    return c.json({ success: true, message });
  } catch (error: any) {
    console.log('Send message error:', error);
    return c.json({ error: error.message || 'Failed to send message' }, 500);
  }
});

// Get messages for a mentorship
app.get("/make-server-b8526fa6/messages", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const { user } = auth;
    const mentorshipId = c.req.query('mentorshipId');

    if (!mentorshipId) {
      return c.json({ error: 'Mentorship ID is required' }, 400);
    }

    // Verify mentorship exists and user has access
    const mentorship = await kv.get(`mentorship:${mentorshipId}`);
    if (!mentorship) {
      return c.json({ error: 'Mentorship not found' }, 404);
    }

    if (mentorship.mentorId !== user.id && mentorship.studentId !== user.id) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const allMessages = await kv.getByPrefix('message:');
    const mentorshipMessages = allMessages
      .filter((m: any) => m.mentorshipId === mentorshipId)
      .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    // Enrich with sender data
    const enrichedMessages = await Promise.all(
      mentorshipMessages.map(async (msg: any) => {
        const sender = await kv.get(`user:${msg.senderId}`);
        return {
          ...msg,
          sender: sender ? { id: sender.id, firstName: sender.firstName, lastName: sender.lastName } : null,
        };
      })
    );

    return c.json({ success: true, messages: enrichedMessages });
  } catch (error: any) {
    console.log('Get messages error:', error);
    return c.json({ error: error.message || 'Failed to get messages' }, 500);
  }
});

// Mark message as read
app.put("/make-server-b8526fa6/messages/:messageId/read", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const { user } = auth;
    const messageId = c.req.param('messageId');
    const message = await kv.get(`message:${messageId}`);

    if (!message) {
      return c.json({ error: 'Message not found' }, 404);
    }

    // Only receiver can mark as read
    if (message.receiverId !== user.id) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    await kv.set(`message:${messageId}`, {
      ...message,
      read: true,
      readAt: new Date().toISOString(),
    });

    return c.json({ success: true, message: 'Message marked as read' });
  } catch (error: any) {
    console.log('Mark message as read error:', error);
    return c.json({ error: error.message || 'Failed to mark message as read' }, 500);
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// ── SETTINGS ROUTES ──
// ══════════════════════════════════════════════════════════════════════════════

// Get user settings
app.get("/make-server-b8526fa6/settings", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const { user } = auth;
    const settings = await kv.get(`settings:${user.id}`) || {
      notifications: {
        email: true,
        push: true,
        mentorshipRequests: true,
        sessionReminders: true,
        messages: true,
      },
      privacy: {
        profileVisibility: 'verified',
        showInDirectory: true,
        showEmployer: true,
        analyticsEnabled: true,
        marketingEnabled: false,
      },
      appearance: {
        theme: 'light',
      },
      preferences: {
        language: 'en',
      },
    };

    return c.json({ success: true, settings });
  } catch (error: any) {
    console.log('Get settings error:', error);
    return c.json({ error: error.message || 'Failed to get settings' }, 500);
  }
});

// Update user settings
app.put("/make-server-b8526fa6/settings", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const { user } = auth;
    const body = await c.req.json();
    
    const existingSettings = await kv.get(`settings:${user.id}`) || {};
    
    // Deep merge settings to preserve nested data
    const mergedSettings = { ...existingSettings };
    for (const key in body) {
      if (typeof body[key] === 'object' && !Array.isArray(body[key]) && body[key] !== null) {
        mergedSettings[key] = { ...(existingSettings[key] || {}), ...body[key] };
      } else {
        mergedSettings[key] = body[key];
      }
    }
    
    await kv.set(`settings:${user.id}`, {
      ...mergedSettings,
      updatedAt: new Date().toISOString(),
    });

    const updatedSettings = await kv.get(`settings:${user.id}`);
    return c.json({ success: true, settings: updatedSettings });
  } catch (error: any) {
    console.log('Update settings error:', error);
    return c.json({ error: error.message || 'Failed to update settings' }, 500);
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// ── ACCOUNT SECURITY ROUTES ──
// ════════════════════════��═════════════════════════════════════════════════════

// Change email
app.put("/make-server-b8526fa6/account/change-email", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const { user } = auth;
    const { newEmail } = await c.req.json();

    if (!newEmail) {
      return c.json({ error: 'New email is required' }, 400);
    }

    // Check if email is already in use
    const allUsers = await kv.getByPrefix('user:');
    const emailExists = allUsers.some((u: any) => u.email === newEmail && u.id !== user.id);
    
    if (emailExists) {
      return c.json({ error: 'Email already in use' }, 400);
    }

    // Update user email using Supabase Admin
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { email: newEmail }
    );

    if (updateError) {
      console.log('Email update error:', updateError);
      return c.json({ error: 'Failed to update email' }, 500);
    }

    // Update user in KV store
    user.email = newEmail;
    await kv.set(`user:${user.id}`, user);

    return c.json({ success: true, message: 'Email updated successfully' });
  } catch (error: any) {
    console.log('Change email error:', error);
    return c.json({ error: error.message || 'Failed to change email' }, 500);
  }
});

// Change password
app.put("/make-server-b8526fa6/account/change-password", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const { user } = auth;
    const { currentPassword, newPassword } = await c.req.json();

    if (!currentPassword || !newPassword) {
      return c.json({ error: 'Current and new password are required' }, 400);
    }

    if (newPassword.length < 8) {
      return c.json({ error: 'Password must be at least 8 characters' }, 400);
    }

    // Verify current password by attempting to sign in
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword
    });

    if (signInError) {
      return c.json({ error: 'Current password is incorrect' }, 400);
    }

    // Update password using Supabase Admin
    const adminSupabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { error: updateError } = await adminSupabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      console.log('Password update error:', updateError);
      return c.json({ error: 'Failed to update password' }, 500);
    }

    return c.json({ success: true, message: 'Password updated successfully' });
  } catch (error: any) {
    console.log('Change password error:', error);
    return c.json({ error: error.message || 'Failed to change password' }, 500);
  }
});

// Get active sessions
app.get("/make-server-b8526fa6/sessions/active", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const { user } = auth;

    // Get sessions from KV store
    const userSessions = await kv.get(`sessions:${user.id}`) || [];

    return c.json({ success: true, sessions: userSessions });
  } catch (error: any) {
    console.log('Get sessions error:', error);
    return c.json({ error: error.message || 'Failed to get sessions' }, 500);
  }
});

// Revoke a session
app.delete("/make-server-b8526fa6/sessions/revoke/:sessionId", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const { user } = auth;
    const sessionId = c.req.param('sessionId');

    // Get sessions from KV store
    const userSessions = await kv.get(`sessions:${user.id}`) || [];
    const updatedSessions = userSessions.filter((s: any) => s.id !== sessionId);

    await kv.set(`sessions:${user.id}`, updatedSessions);

    return c.json({ success: true, message: 'Session revoked successfully' });
  } catch (error: any) {
    console.log('Revoke session error:', error);
    return c.json({ error: error.message || 'Failed to revoke session' }, 500);
  }
});

// Sign out all other devices
app.delete("/make-server-b8526fa6/sessions/revoke-all", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const { user } = auth;

    // Get sessions from KV store
    const userSessions = await kv.get(`sessions:${user.id}`) || [];
    // Keep only the current session
    const currentSession = userSessions.find((s: any) => s.isCurrent);
    
    await kv.set(`sessions:${user.id}`, currentSession ? [currentSession] : []);

    return c.json({ success: true, message: 'All other sessions revoked successfully' });
  } catch (error: any) {
    console.log('Revoke all sessions error:', error);
    return c.json({ error: error.message || 'Failed to revoke sessions' }, 500);
  }
});

// Delete account
app.delete("/make-server-b8526fa6/account/delete", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const { user } = auth;

    // Delete user using Supabase Admin FIRST - this is critical
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.log('Delete user error:', deleteError);
      return c.json({ error: 'Failed to delete account from authentication system: ' + deleteError.message }, 500);
    }

    // Delete user data from KV store
    await kv.del(`user:${user.id}`);
    await kv.del(`profile:${user.id}`);
    await kv.del(`settings:${user.id}`);
    await kv.del(`sessions:${user.id}`);
    
    // Delete user's mentorships
    const allMentorships = await kv.getByPrefix('mentorship:');
    const userMentorships = allMentorships.filter((m: any) => m.mentorId === user.id || m.studentId === user.id);
    for (const mentorship of userMentorships) {
      await kv.del(`mentorship:${mentorship.id}`);
    }
    
    // Delete user's sessions
    const allSessions = await kv.getByPrefix('session:');
    const userSessions = allSessions.filter((s: any) => s.mentorId === user.id || s.studentId === user.id);
    for (const session of userSessions) {
      await kv.del(`session:${session.id}`);
    }
    
    // Delete user's notifications
    const allNotifications = await kv.getByPrefix('notification:');
    const userNotifications = allNotifications.filter((n: any) => n.userId === user.id);
    for (const notification of userNotifications) {
      await kv.del(`notification:${notification.id}`);
    }
    
    // Delete user's messages
    const allMessages = await kv.getByPrefix('message:');
    const userMessages = allMessages.filter((m: any) => m.senderId === user.id || m.receiverId === user.id);
    for (const message of userMessages) {
      await kv.del(`message:${message.id}`);
    }
    
    // Delete user's resources
    const allResources = await kv.getByPrefix('resource:');
    const userResources = allResources.filter((r: any) => r.userId === user.id);
    for (const resource of userResources) {
      await kv.del(`resource:${resource.id}`);
    }
    
    // Delete user's requests
    const allRequests = await kv.getByPrefix('request:');
    const userRequests = allRequests.filter((r: any) => r.mentorId === user.id || r.studentId === user.id);
    for (const request of userRequests) {
      await kv.del(`request:${request.id}`);
    }
    
    return c.json({ success: true, message: 'Account deleted successfully' });
  } catch (error: any) {
    console.log('Delete account error:', error);
    return c.json({ error: error.message || 'Failed to delete account' }, 500);
  }
});

// Export user data (GDPR compliance)
app.get("/make-server-b8526fa6/users/:userId/data-export", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const { user } = auth;
    const requestedUserId = c.req.param('userId');

    // Users can only export their own data
    if (user.id !== requestedUserId) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    // Gather all user data
    const userData = await kv.get(`user:${user.id}`);
    const profile = await kv.get(`profile:${user.id}`);
    const settings = await kv.get(`settings:${user.id}`);
    
    // Get mentorships
    const allMentorships = await kv.getByPrefix('mentorship:');
    const userMentorships = allMentorships.filter((m: any) => 
      m.mentorId === user.id || m.studentId === user.id
    );
    
    // Get sessions
    const allSessions = await kv.getByPrefix('session:');
    const userSessions = allSessions.filter((s: any) => 
      s.mentorId === user.id || s.studentId === user.id
    );
    
    // Get messages
    const allMessages = await kv.getByPrefix('message:');
    const userMessages = allMessages.filter((m: any) => 
      m.senderId === user.id || m.receiverId === user.id
    );
    
    // Get resources
    const allResources = await kv.getByPrefix('resource:');
    const userResources = allResources.filter((r: any) => r.userId === user.id);
    
    // Get requests (if mentor)
    const allRequests = await kv.getByPrefix('request:');
    const userRequests = allRequests.filter((r: any) => 
      r.mentorId === user.id || r.studentId === user.id
    );

    const exportData = {
      exportDate: new Date().toISOString(),
      user: userData,
      profile,
      settings,
      mentorships: userMentorships,
      sessions: userSessions,
      messages: userMessages,
      resources: userResources,
      requests: userRequests,
    };

    return c.json(exportData);
  } catch (error: any) {
    console.log('Export user data error:', error);
    return c.json({ error: error.message || 'Failed to export user data' }, 500);
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// ── ANALYTICS/STATS ROUTES ──
// ══════════════════════════════════════════════════════════════════════════════

// Get mentor stats
app.get("/make-server-b8526fa6/stats/mentor", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const { user } = auth;

    // Get all mentorships
    const allMentorships = await kv.getByPrefix('mentorship:');
    const userMentorships = allMentorships.filter((m: any) => m.mentorId === user.id);
    const activeMentorships = userMentorships.filter((m: any) => m.status === 'active');

    // Get all sessions
    const allSessions = await kv.getByPrefix('session:');
    const userSessions = allSessions.filter((s: any) => s.mentorId === user.id);
    const completedSessions = userSessions.filter((s: any) => s.status === 'completed');

    // Get pending requests
    const allRequests = await kv.getByPrefix('request:');
    const pendingRequests = allRequests.filter((r: any) => r.mentorId === user.id && r.status === 'pending');

    const stats = {
      totalMentorships: userMentorships.length,
      activeMentorships: activeMentorships.length,
      totalSessions: userSessions.length,
      completedSessions: completedSessions.length,
      pendingRequests: pendingRequests.length,
      profileViews: 0, // Could be tracked separately
      impactScore: activeMentorships.length * 10 + completedSessions.length * 5,
    };

    return c.json({ success: true, stats });
  } catch (error: any) {
    console.log('Get mentor stats error:', error);
    return c.json({ error: error.message || 'Failed to get mentor stats' }, 500);
  }
});

// Get student stats
app.get("/make-server-b8526fa6/stats/student", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const { user } = auth;

    // Get mentorships
    const allMentorships = await kv.getByPrefix('mentorship:');
    const userMentorships = allMentorships.filter((m: any) => m.studentId === user.id);
    const activeMentorships = userMentorships.filter((m: any) => m.status === 'active');

    // Get sessions
    const allSessions = await kv.getByPrefix('session:');
    const userSessions = allSessions.filter((s: any) => s.studentId === user.id);
    const upcomingSessions = userSessions.filter((s: any) => 
      s.status === 'scheduled' && new Date(s.scheduledAt) > new Date()
    );

    // Get requests
    const allRequests = await kv.getByPrefix('request:');
    const sentRequests = allRequests.filter((r: any) => r.studentId === user.id);
    const pendingRequests = sentRequests.filter((r: any) => r.status === 'pending');

    const stats = {
      totalMentorships: userMentorships.length,
      activeMentorships: activeMentorships.length,
      totalSessions: userSessions.length,
      upcomingSessions: upcomingSessions.length,
      pendingRequests: pendingRequests.length,
      opportunitiesApplied: 0, // Could be tracked separately
    };

    return c.json({ success: true, stats });
  } catch (error: any) {
    console.log('Get student stats error:', error);
    return c.json({ error: error.message || 'Failed to get student stats' }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════════════════���══
// ── GOALS API ──
// ══════════════════════════════════════════════════════════════════════════════

// Create a new goal
app.post("/make-server-b8526fa6/goals", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }
    const { user } = auth;

    const body = await c.req.json();
    const { title, category, priority, dueDate, notes } = body;

    if (!title || !category) {
      return c.json({ error: 'Title and category are required' }, 400);
    }

    const goalId = generateId('goal');
    const goal = {
      id: goalId,
      studentId: user.id,
      title,
      category, // career, technical, applications, personal
      completed: false,
      priority: priority || 'medium', // high, medium, low
      dueDate: dueDate || null,
      notes: notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await kv.set(`goal:${goalId}`, goal);
    console.log('✓ Goal created:', goalId);

    return c.json(goal, 201);
  } catch (error: any) {
    console.log('Create goal error:', error);
    return c.json({ error: error.message || 'Failed to create goal' }, 500);
  }
});

// Get all goals for current student
app.get("/make-server-b8526fa6/goals", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }
    const { user } = auth;

    const allGoals = await kv.getByPrefix('goal:');
    const userGoals = allGoals.filter((g: any) => g.studentId === user.id);

    // Sort by createdAt descending
    userGoals.sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return c.json(userGoals);
  } catch (error: any) {
    console.log('Get goals error:', error);
    return c.json({ error: error.message || 'Failed to get goals' }, 500);
  }
});

// Update a goal
app.put("/make-server-b8526fa6/goals/:goalId", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }
    const { user } = auth;

    const goalId = c.req.param('goalId');
    const existingGoal = await kv.get(`goal:${goalId}`);

    if (!existingGoal) {
      return c.json({ error: 'Goal not found' }, 404);
    }

    if (existingGoal.studentId !== user.id) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const body = await c.req.json();
    const updatedGoal = {
      ...existingGoal,
      ...body,
      id: goalId, // Prevent ID change
      studentId: user.id, // Prevent student change
      updatedAt: new Date().toISOString()
    };

    await kv.set(`goal:${goalId}`, updatedGoal);
    console.log('✓ Goal updated:', goalId);

    return c.json(updatedGoal);
  } catch (error: any) {
    console.log('Update goal error:', error);
    return c.json({ error: error.message || 'Failed to update goal' }, 500);
  }
});

// Delete a goal
app.delete("/make-server-b8526fa6/goals/:goalId", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }
    const { user } = auth;

    const goalId = c.req.param('goalId');
    const existingGoal = await kv.get(`goal:${goalId}`);

    if (!existingGoal) {
      return c.json({ error: 'Goal not found' }, 404);
    }

    if (existingGoal.studentId !== user.id) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    await kv.del(`goal:${goalId}`);
    console.log('✓ Goal deleted:', goalId);

    return c.json({ success: true });
  } catch (error: any) {
    console.log('Delete goal error:', error);
    return c.json({ error: error.message || 'Failed to delete goal' }, 500);
  }
});

// Get all resources for student (across all mentorships)
app.get("/make-server-b8526fa6/student/resources", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }
    const { user } = auth;

    // Get all mentorships where user is the student
    const allMentorships = await kv.getByPrefix('mentorship:');
    const userMentorships = allMentorships.filter((m: any) => 
      m.studentId === user.id && m.status === 'active'
    );

    // Get all resources for these mentorships
    const allResources = await kv.getByPrefix('resource:');
    const userResources = allResources.filter((r: any) => 
      userMentorships.some((m: any) => m.id === r.mentorshipId)
    );

    // Get mentor names for each resource
    const resourcesWithMentors = await Promise.all(
      userResources.map(async (resource: any) => {
        const mentorship = userMentorships.find((m: any) => m.id === resource.mentorshipId);
        if (!mentorship) return resource;

        const mentorProfile = await kv.get(`profile:${mentorship.mentorId}`);
        return {
          ...resource,
          mentorName: mentorProfile 
            ? `${mentorProfile.firstName || ''} ${mentorProfile.lastName || ''}`.trim()
            : 'Unknown Mentor'
        };
      })
    );

    // Sort by createdAt descending
    resourcesWithMentors.sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return c.json(resourcesWithMentors);
  } catch (error: any) {
    console.log('Get student resources error:', error);
    return c.json({ error: error.message || 'Failed to get resources' }, 500);
  }
});

// ���═════════════════════════════════════════════════════════════════════════════
// ── ADMIN ROUTES ──
// ══════════════════════════════════════════════════════════════════════════════

setupAdminRoutes(app, authenticateAdmin, generateId, kv, supabaseAdmin);

// ══════════════════════════════════════════════════════════════════════════════
// ── RESOURCES ROUTES ──
// ══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════��══════════════════════════════════════════════════════
// ── WHATSAPP NOTIFICATION ROUTES ──
// ════════════���═════════════════════════════════════════════════════════════════

// Cron endpoint to check and send session reminders
// This should be called periodically (e.g., every hour) by a cron job or scheduler
app.get("/make-server-b8526fa6/cron/session-reminders", async (c) => {
  try {
    console.log('🔔 Running session reminders cron job...');
    await notifications.checkAndSendSessionReminders(kv.getByPrefix, kv.get);
    return c.json({ success: true, message: 'Session reminders checked and sent' });
  } catch (error: any) {
    console.error('❌ Session reminders cron error:', error);
    return c.json({ error: error.message || 'Failed to process session reminders' }, 500);
  }
});

// Test endpoint to send a test WhatsApp notification
app.post("/make-server-b8526fa6/test-whatsapp", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const { user } = auth;
    const userProfile = await kv.get(`user:${user.id}`);

    if (!userProfile?.phoneNumber) {
      return c.json({ error: 'No phone number configured' }, 400);
    }

    const result = await notifications.sendWhatsAppNotification({
      to: userProfile.phoneNumber,
      message: '🎓 Test notification from Ispora! Your WhatsApp notifications are working correctly.',
      link: 'https://ispora.com',
    });

    if (result.success) {
      return c.json({ success: true, message: 'Test notification sent successfully' });
    } else {
      return c.json({ success: false, error: result.error }, 500);
    }
  } catch (error: any) {
    console.error('❌ Test WhatsApp error:', error);
    return c.json({ error: error.message || 'Failed to send test notification' }, 500);
  }
});

// Setup routes (bucket will be ensured on first resource operation)
setupResourceRoutes(app, authenticateUser, generateId, kv, supabaseAdmin);

// Initialize resources bucket in background (non-blocking)
ensureResourcesBucket(supabaseAdmin).catch(err => 
  console.error('Failed to ensure resources bucket:', err)
);

 ============================================
// SUPPORT REQUEST ROUTES
// ============================================

// Create support request
app.post("/make-server-b8526fa6/support-requests", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const { user } = auth;
    const { category, message } = await c.req.json();

    if (!category || !message) {
      return c.json({ error: 'Category and message are required' }, 400);
    }

    // Get user profile
    const userProfile = await kv.get(`user:${user.id}`);
    if (!userProfile) {
      return c.json({ error: 'User profile not found' }, 404);
    }

    const requestId = generateId('supreq');
    const supportRequest = {
      id: requestId,
      userId: user.id,
      userName: `${userProfile.firstName} ${userProfile.lastName}`,
      userEmail: userProfile.email,
      userRole: userProfile.role,
      category,
      message,
      status: 'pending',
      adminResponse: null,
      adminRespondedBy: null,
      adminRespondedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`supportrequest:${requestId}`, supportRequest);

    console.log('✓ Support request created:', requestId);
    console.log('✓ Support request data:', JSON.stringify(supportRequest, null, 2));
    console.log('✓ Support request key:', `supportrequest:${requestId}`);
    return c.json({ success: true, request: supportRequest });
  } catch (error: any) {
    console.log('Create support request error:', error);
    return c.json({ error: error.message || 'Failed to create support request' }, 500);
  }
});

// Get user's own support requests
app.get("/make-server-b8526fa6/support-requests/user", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const { user } = auth;
    const allRequests = await kv.getByPrefix('supportrequest:') || [];
    
    const userRequests = (Array.isArray(allRequests) ? allRequests : [])
      .filter((r: any) => r.userId === user.id)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return c.json({ success: true, requests: userRequests });
  } catch (error: any) {
    console.log('Get user support requests error:', error);
    return c.json({ error: error.message || 'Failed to get support requests' }, 500);
  }
});

// Get all support requests (admin only)
app.get("/make-server-b8526fa6/support-requests", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const { user } = auth;
    
    // Check if user is admin
    const userProfile = await kv.get(`user:${user.id}`);
    if (!userProfile || userProfile.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const allRequests = await kv.getByPrefix('supportrequest:') || [];
    console.log('✓ Fetched support requests count:', Array.isArray(allRequests) ? allRequests.length : 0);
    console.log('✓ Support requests data:', JSON.stringify(allRequests, null, 2));
    
    const requests = (Array.isArray(allRequests) ? allRequests : [])
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    console.log('✓ Returning requests to admin:', requests.length);
    return c.json({ success: true, requests });
  } catch (error: any) {
    console.log('Get all support requests error:', error);
    return c.json({ error: error.message || 'Failed to get support requests' }, 500);
  }
});

// Respond to support request (admin only)
app.post("/make-server-b8526fa6/support-requests/:requestId/respond", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const { user } = auth;
    
    // Check if user is admin
    const adminProfile = await kv.get(`user:${user.id}`);
    if (!adminProfile || adminProfile.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const requestId = c.req.param('requestId');
    const { response } = await c.req.json();

    if (!response) {
      return c.json({ error: 'Response is required' }, 400);
    }

    const supportRequest = await kv.get(`supportrequest:${requestId}`);
    if (!supportRequest) {
      return c.json({ error: 'Support request not found' }, 404);
    }

    const updatedRequest = {
      ...supportRequest,
      adminResponse: response,
      adminRespondedBy: `${adminProfile.firstName} ${adminProfile.lastName}`,
      adminRespondedAt: new Date().toISOString(),
      status: 'resolved',
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`supportrequest:${requestId}`, updatedRequest);

    // Create notification for the user
    const notificationId = generateId('notif');
    await kv.set(`notification:${notificationId}`, {
      id: notificationId,
      userId: supportRequest.userId,
      type: 'support_response',
      title: 'Support Request Response',
      message: 'An admin has responded to your support request',
      read: false,
      data: { requestId },
      createdAt: new Date().toISOString(),
    });

    console.log('✓ Support request responded:', requestId);
    return c.json({ success: true, request: updatedRequest });
  } catch (error: any) {
    console.log('Respond to support request error:', error);
    return c.json({ error: error.message || 'Failed to respond to support request' }, 500);
  }
});

// Update support request status (admin only)
app.patch("/make-server-b8526fa6/support-requests/:requestId/status", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const { user } = auth;
    
    // Check if user is admin
    const adminProfile = await kv.get(`user:${user.id}`);
    if (!adminProfile || adminProfile.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const requestId = c.req.param('requestId');
    const { status } = await c.req.json();

    if (!status || !['pending', 'resolved'].includes(status)) {
      return c.json({ error: 'Valid status is required (pending or resolved)' }, 400);
    }

    const supportRequest = await kv.get(`supportrequest:${requestId}`);
    if (!supportRequest) {
      return c.json({ error: 'Support request not found' }, 404);
    }

    const updatedRequest = {
      ...supportRequest,
      status,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`supportrequest:${requestId}`, updatedRequest);

    console.log('✓ Support request status updated:', requestId, status);
    return c.json({ success: true, request: updatedRequest });
  } catch (error: any) {
    console.log('Update support request status error:', error);
    return c.json({ error: error.message || 'Failed to update status' }, 500);
  }
});

// Debug endpoint to check support requests in database
app.get("/make-server-b8526fa6/debug/support-requests", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const { user } = auth;
    const userProfile = await kv.get(`user:${user.id}`);
    if (!userProfile || userProfile.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const allRequests = await kv.getByPrefix('supportrequest:') || [];
    
    return c.json({ 
      success: true, 
      count: Array.isArray(allRequests) ? allRequests.length : 0,
      requests: allRequests,
      type: Array.isArray(allRequests) ? 'array' : typeof allRequests
    });
  } catch (error: any) {
    console.log('Debug support requests error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================
// SHORT CODE RESOLVER (MUST BE LAST - catch-all route)
// ============================================

// Resolve short code to session details (e.g., /jd123 -> session info)
app.get("/make-server-b8526fa6/:shortCode", async (c) => {
  try {
    const shortCode = c.req.param('shortCode');
    
    // Validate short code format (2-3 letters + numbers)
    if (!/^[a-z]{2,3}\d+$/.test(shortCode)) {
      return c.json({ error: 'Invalid short code format' }, 400);
    }

    console.log('Resolving short code:', shortCode);

    // Find session by short code
    const allSessions = await kv.getByPrefix('session:') || [];
    const session = (Array.isArray(allSessions) ? allSessions : [])
      .find((s: any) => s.short_code === shortCode);

    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    // Parse session notes to check if it's public
    let sessionDetails = { sessionType: 'private' };
    try {
      if (session.notes) {
        sessionDetails = JSON.parse(session.notes);
      }
    } catch (e) {
      console.log('Error parsing session notes:', e);
    }

    // Only allow access to public sessions via short code
    if (sessionDetails.sessionType !== 'public') {
      return c.json({ error: 'Session not available' }, 403);
    }

    // Check if the request is from a social media crawler/bot
    const userAgent = c.req.header('user-agent') || '';
    const isSocialBot = /facebookexternalhit|LinkedInBot|WhatsApp|Twitterbot|Slackbot|TelegramBot/i.test(userAgent);

    // If it's a social media bot, return HTML with Open Graph meta tags
    if (isSocialBot) {
      // Get mentor details
      const mentor = await kv.get(`user:${session.mentor_id}`);
      const mentorName = mentor ? `${mentor.firstName} ${mentor.lastName}` : 'Ispora Mentor';
      const mentorTitle = mentor?.profileTitle || 'Professional Mentor';
      
      // Format date
      const sessionDate = new Date(session.start_time);
      const formattedDate = sessionDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      const formattedTime = sessionDate.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      });

      const sessionUrl = `https://ispora.app/${shortCode}`;
      const title = `${session.topic} - Free Mentorship Session on Ispora`;
      const description = `Join ${mentorName}, ${mentorTitle}, for a free mentorship session on ${formattedDate} at ${formattedTime}. ${session.description || 'Connect with African diaspora professionals mentoring students in Nigeria.'}`;
      
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  
  <!-- Open Graph Meta Tags -->
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:url" content="${sessionUrl}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Ispora - Mentorship Platform" />
  <meta property="og:image" content="https://ispora.app/og-image.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  
  <!-- Twitter Card Meta Tags -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="https://ispora.app/og-image.png" />
  
  <!-- LinkedIn specific -->
  <meta property="og:locale" content="en_US" />
  
  <!-- Auto-redirect for real browsers -->
  <meta http-equiv="refresh" content="0;url=${sessionUrl}">
</head>
<body>
  <h1>${session.topic}</h1>
  <p>${description}</p>
  <p><a href="${sessionUrl}">View Session Details</a></p>
</body>
</html>`;

      return c.html(html);
    }

    // Return the full session ID so frontend can redirect
    return c.json({ 
      success: true, 
      sessionId: session.id,
      shortCode: shortCode
    });
  } catch (error: any) {
    console.log('Resolve short code error:', error);
    return c.json({ error: error.message || 'Failed to resolve short code' }, 500);
  }
});

// ═══════════════════════════════════════════���══════════════════════════════════
// ── MEMBER & FOLLOW ROUTES ──
// ════════════════════════════════════��═��═══════════════════════════════════════

// Get all community members
app.get("/make-server-b8526fa6/community/members", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const { user } = auth;
    const { role, search, limit = '50' } = c.req.query();

    const allUsersKeys = await kv.getByPrefix('user:') || [];
    let users = (Array.isArray(allUsersKeys) ? allUsersKeys : []).filter((u: any) => u && u.id);

    // Map frontend role filter to actual DB roles
    // Frontend sends 'mentor' but DB stores 'diaspora'
    const dbRole = role === 'mentor' ? 'diaspora' : role;
    if (dbRole && dbRole !== 'all') users = users.filter((u: any) => u.role === dbRole);
    if (search) {
      const s = search.toLowerCase();
      users = users.filter((u: any) => {
        const name = `${u.firstName} ${u.lastName}`.toLowerCase();
        const exp = (u.expertise || []).join(' ').toLowerCase();
        const bio = (u.bio || '').toLowerCase();
        return name.includes(s) || exp.includes(s) || bio.includes(s);
      });
    }

    // Get all follows once to calculate counts efficiently
    const allFollows = await kv.getByPrefix('follow:') || [];
    const followsArray = Array.isArray(allFollows) ? allFollows : [];

    const members = await Promise.all(
      users.slice(0, parseInt(limit)).map(async (m: any) => {
        const isFollowing = await kv.get(`follow:${user.id}:${m.id}`);
        
        // Count followers (where this member is being followed)
        const followers = followsArray.filter((f: any) => f.followingId === m.id);
        
        // Count following (where this member is following others)
        const following = followsArray.filter((f: any) => f.followerId === m.id);
        
        return {
          id: m.id,
          firstName: m.firstName,
          lastName: m.lastName,
          role: m.role === 'diaspora' ? 'mentor' : 'student',
          expertise: m.expertise || [],
          bio: m.bio || '',
          university: m.university || '',
          company: m.company || '',
          location: m.location || '',
          achievements: m.achievements || [],
          profilePicture: m.profilePicture || '',
          isFollowing: !!isFollowing,
          followersCount: followers.length,
          followingCount: following.length,
        };
      })
    );

    return c.json({ success: true, members, total: users.length });
  } catch (error: any) {
    console.log('Get members error:', error);
    return c.json({ error: error.message || 'Failed to get members' }, 500);
  }
});

// Follow user
app.post("/make-server-b8526fa6/community/follow/:userId", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) return c.json({ error: auth.error }, auth.status);

    const { user } = auth;
    const targetUserId = c.req.param('userId');

    if (user.id === targetUserId) return c.json({ error: 'Cannot follow yourself' }, 400);

    const targetUser = await kv.get(`user:${targetUserId}`);
    if (!targetUser) return c.json({ error: 'User not found' }, 404);

    const followKey = `follow:${user.id}:${targetUserId}`;
    const existing = await kv.get(followKey);
    if (existing) return c.json({ error: 'Already following' }, 400);

    await kv.set(followKey, {
      followerId: user.id,
      followingId: targetUserId,
      createdAt: new Date().toISOString(),
    });

    const notifId = generateId('notif');
    await kv.set(`notification:${notifId}`, {
      id: notifId,
      userId: targetUserId,
      type: 'new_follower',
      title: 'New follower',
      message: `${user.firstName} ${user.lastName} started following you`,
      read: false,
      data: { followerId: user.id },
      createdAt: new Date().toISOString(),
    });

    return c.json({ success: true });
  } catch (error: any) {
    console.log('Follow error:', error);
    return c.json({ error: error.message || 'Failed to follow' }, 500);
  }
});

// Unfollow user
app.delete("/make-server-b8526fa6/community/unfollow/:userId", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) return c.json({ error: auth.error }, auth.status);

    await kv.del(`follow:${auth.user.id}:${c.req.param('userId')}`);
    return c.json({ success: true });
  } catch (error: any) {
    console.log('Unfollow error:', error);
    return c.json({ error: error.message || 'Failed to unfollow' }, 500);
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// ── COMMUNITY POSTS ROUTES ──
// ══════════════════════════════════════════════════════════════════════════════

// Get all posts
app.get("/make-server-b8526fa6/community/posts", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const { user } = auth;
    const { category, sort = 'recent' } = c.req.query();

    // Get all posts
    const allPosts = await kv.getByPrefix('post:') || [];
    let posts = (Array.isArray(allPosts) ? allPosts : []).filter((p: any) => p && p.id);

    // Filter by category if provided
    if (category && category !== 'all') {
      posts = posts.filter((p: any) => p.category === category);
    }

    // Get all likes to calculate counts
    const allLikes = await kv.getByPrefix('post_like:') || [];
    const likesArray = Array.isArray(allLikes) ? allLikes : [];

    // Get all comments to calculate counts
    const allComments = await kv.getByPrefix('post_comment:') || [];
    const commentsArray = Array.isArray(allComments) ? allComments : [];

    // Enrich posts with author info, like counts, and comment counts
    const enrichedPosts = await Promise.all(
      posts.map(async (post: any) => {
        const author = await kv.get(`user:${post.userId}`);
        const likesCount = likesArray.filter((l: any) => l.postId === post.id).length;
        const commentsCount = commentsArray.filter((c: any) => c.postId === post.id).length;
        const isLikedByUser = likesArray.some((l: any) => l.postId === post.id && l.userId === user.id);

        return {
          id: post.id,
          content: post.content,
          category: post.category,
          author: author ? {
            id: author.id,
            firstName: author.firstName,
            lastName: author.lastName,
            role: author.role,
            profilePicture: author.profilePicture
          } : null,
          likesCount,
          commentsCount,
          isLikedByUser,
          createdAt: post.createdAt,
          comments: []
        };
      })
    );

    // Sort posts
    if (sort === 'recent') {
      enrichedPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sort === 'popular') {
      enrichedPosts.sort((a, b) => b.likesCount - a.likesCount);
    }

    return c.json({ posts: enrichedPosts });
  } catch (error: any) {
    console.log('Get posts error:', error);
    return c.json({ error: error.message || 'Failed to fetch posts' }, 500);
  }
});

// Create a new post
app.post("/make-server-b8526fa6/community/posts", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) return c.json({ error: auth.error }, auth.status);

    const { content, category } = await c.req.json();

    if (!content || !content.trim()) {
      return c.json({ error: 'Post content is required' }, 400);
    }

    if (!category) {
      return c.json({ error: 'Post category is required' }, 400);
    }

    const postId = crypto.randomUUID();
    const post = {
      id: postId,
      userId: auth.user.id,
      content: content.trim(),
      category,
      createdAt: new Date().toISOString()
    };

    await kv.set(`post:${postId}`, post);

    // Return post with author info
    const author = await kv.get(`user:${auth.user.id}`);
    return c.json({
      post: {
        id: post.id,
        content: post.content,
        category: post.category,
        author: author ? {
          id: author.id,
          firstName: author.firstName,
          lastName: author.lastName,
          role: author.role,
          profilePicture: author.profilePicture
        } : null,
        likesCount: 0,
        commentsCount: 0,
        isLikedByUser: false,
        createdAt: post.createdAt,
        comments: []
      }
    });
  } catch (error: any) {
    console.log('Create post error:', error);
    return c.json({ error: error.message || 'Failed to create post' }, 500);
  }
});

// Delete a post
app.delete("/make-server-b8526fa6/community/posts/:postId", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) return c.json({ error: auth.error }, auth.status);

    const { user } = auth;
    const postId = c.req.param('postId');

    // Get the post
    const post = await kv.get(`post:${postId}`);
    if (!post) {
      return c.json({ error: 'Post not found' }, 404);
    }

    // Get user profile to check role
    const userProfile = await kv.get(`user:${user.id}`);

    // Check if user owns the post or is admin
    if (post.userId !== user.id && userProfile?.role !== 'admin') {
      return c.json({ error: 'Not authorized to delete this post' }, 403);
    }

    // Delete the post
    await kv.del(`post:${postId}`);

    // Delete all likes for this post
    const allLikes = await kv.getByPrefix('post_like:') || [];
    const likesToDelete = (Array.isArray(allLikes) ? allLikes : [])
      .filter((like: any) => like.postId === postId);
    
    for (const like of likesToDelete) {
      await kv.del(`post_like:${like.id}`);
    }

    // Delete all comments for this post
    const allComments = await kv.getByPrefix('comment:') || [];
    const commentsToDelete = (Array.isArray(allComments) ? allComments : [])
      .filter((comment: any) => comment.postId === postId);
    
    for (const comment of commentsToDelete) {
      await kv.del(`comment:${comment.id}`);
    }

    return c.json({ success: true });
  } catch (error: any) {
    console.log('Delete post error:', error);
    return c.json({ error: error.message || 'Failed to delete post' }, 500);
  }
});

// Like a post
app.post("/make-server-b8526fa6/community/posts/:postId/like", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) return c.json({ error: auth.error }, auth.status);

    const postId = c.req.param('postId');
    const post = await kv.get(`post:${postId}`);

    if (!post) {
      return c.json({ error: 'Post not found' }, 404);
    }

    const likeId = `${auth.user.id}:${postId}`;
    const existingLike = await kv.get(`post_like:${likeId}`);

    if (existingLike) {
      return c.json({ error: 'Already liked' }, 400);
    }

    await kv.set(`post_like:${likeId}`, {
      id: likeId,
      userId: auth.user.id,
      postId,
      createdAt: new Date().toISOString()
    });

    return c.json({ success: true });
  } catch (error: any) {
    console.log('Like post error:', error);
    return c.json({ error: error.message || 'Failed to like post' }, 500);
  }
});

// Unlike a post
app.delete("/make-server-b8526fa6/community/posts/:postId/like", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) return c.json({ error: auth.error }, auth.status);

    const postId = c.req.param('postId');
    const likeId = `${auth.user.id}:${postId}`;

    await kv.del(`post_like:${likeId}`);
    return c.json({ success: true });
  } catch (error: any) {
    console.log('Unlike post error:', error);
    return c.json({ error: error.message || 'Failed to unlike post' }, 500);
  }
});

// Add a comment to a post
app.post("/make-server-b8526fa6/community/posts/:postId/comments", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) return c.json({ error: auth.error }, auth.status);

    const postId = c.req.param('postId');
    const { content } = await c.req.json();

    if (!content || !content.trim()) {
      return c.json({ error: 'Comment content is required' }, 400);
    }

    const post = await kv.get(`post:${postId}`);
    if (!post) {
      return c.json({ error: 'Post not found' }, 404);
    }

    const commentId = crypto.randomUUID();
    const comment = {
      id: commentId,
      postId,
      userId: auth.user.id,
      content: content.trim(),
      createdAt: new Date().toISOString()
    };

    await kv.set(`post_comment:${commentId}`, comment);

    // Return comment with author info
    const author = await kv.get(`user:${auth.user.id}`);
    return c.json({
      comment: {
        id: comment.id,
        content: comment.content,
        author: author ? {
          id: author.id,
          firstName: author.firstName,
          lastName: author.lastName,
          role: author.role,
          profilePicture: author.profilePicture
        } : null,
        createdAt: comment.createdAt
      }
    });
  } catch (error: any) {
    console.log('Add comment error:', error);
    return c.json({ error: error.message || 'Failed to add comment' }, 500);
  }
});

// Get comments for a post
app.get("/make-server-b8526fa6/community/posts/:postId/comments", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const postId = c.req.param('postId');
    const post = await kv.get(`post:${postId}`);

    if (!post) {
      return c.json({ error: 'Post not found' }, 404);
    }

    // Get all comments for this post
    const allComments = await kv.getByPrefix('post_comment:') || [];
    const postComments = (Array.isArray(allComments) ? allComments : [])
      .filter((c: any) => c && c.postId === postId);

    // Enrich comments with author info
    const enrichedComments = await Promise.all(
      postComments.map(async (comment: any) => {
        const author = await kv.get(`user:${comment.userId}`);
        return {
          id: comment.id,
          content: comment.content,
          author: author ? {
            id: author.id,
            firstName: author.firstName,
            lastName: author.lastName,
            role: author.role,
            profilePicture: author.profilePicture
          } : null,
          createdAt: comment.createdAt
        };
      })
    );

    // Sort by most recent first
    enrichedComments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return c.json({ comments: enrichedComments });
  } catch (error: any) {
    console.log('Get comments error:', error);
    return c.json({ error: error.message || 'Failed to fetch comments' }, 500);
  }
});

console.log('✅ All routes registered successfully');
console.log('✅ Member & Follow routes are active');
console.log('✅ Community Posts routes are active');

// ══════════════════════════════════════════════════════════════════════════════
// ── IMPACT & ACHIEVEMENTS ENDPOINTS ──
// ══════════════════════════════════════════════════════════════════════════════

// Get comprehensive impact stats for current user
app.get("/make-server-b8526fa6/users/impact-stats", async (c) => {
  try {
    console.log('=== Get Impact Stats ===');
    
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const { user: authUser } = auth;
    
    // Get user profile
    const userProfile = await kv.get(`user:${authUser.id}`);
    if (!userProfile) {
      return c.json({ error: 'User profile not found' }, 404);
    }

    // Calculate stats based on role
    const stats = userProfile.role === 'diaspora'
      ? await calculateMentorImpactStats(authUser.id, userProfile)
      : await calculateYouthProgressStats(authUser.id, userProfile);

    return c.json({ success: true, stats });
  } catch (error: any) {
    console.error('❌ Get impact stats error:', error);
    return c.json({ error: error.message || 'Failed to get impact stats' }, 500);
  }
});

// Get user's earned badges
app.get("/make-server-b8526fa6/users/badges", async (c) => {
  try {
    console.log('=== Get User Badges ===');
    
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const { user: authUser } = auth;
    
    // Get user profile
    const userProfile = await kv.get(`user:${authUser.id}`);
    if (!userProfile) {
      return c.json({ error: 'User profile not found' }, 404);
    }

    // Get saved badges from profile
    const savedBadges = userProfile.badges || [];

    // Also check for newly earned badges
    const stats = userProfile.role === 'diaspora'
      ? await calculateMentorImpactStats(authUser.id, userProfile)
      : await calculateYouthProgressStats(authUser.id, userProfile);
    
    const allEarnedBadges = checkEarnedBadges(stats, userProfile.role);
    const newBadges = getNewBadges(savedBadges, allEarnedBadges);

    // Add display info to badges
    const badgesWithDisplay = allEarnedBadges.map(getBadgeDisplayInfo);

    return c.json({ 
      success: true, 
      badges: badgesWithDisplay,
      newBadges: newBadges.map(getBadgeDisplayInfo),
      totalBadges: allEarnedBadges.length
    });
  } catch (error: any) {
    console.error('❌ Get badges error:', error);
    return c.json({ error: error.message || 'Failed to get badges' }, 500);
  }
});

// Check and award new badges
app.post("/make-server-b8526fa6/users/badges/check", async (c) => {
  try {
    console.log('=== Check and Award Badges ===');
    
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const { user: authUser } = auth;
    
    // Get user profile
    const userProfile = await kv.get(`user:${authUser.id}`);
    if (!userProfile) {
      return c.json({ error: 'User profile not found' }, 404);
    }

    // Calculate current stats
    const stats = userProfile.role === 'diaspora'
      ? await calculateMentorImpactStats(authUser.id, userProfile)
      : await calculateYouthProgressStats(authUser.id, userProfile);
    
    // Check earned badges
    const earnedBadges = checkEarnedBadges(stats, userProfile.role);
    
    // Get previously saved badges
    const previousBadges = userProfile.badges || [];
    const newBadges = getNewBadges(previousBadges, earnedBadges);

    // Update user profile with all earned badges
    if (newBadges.length > 0) {
      await kv.set(`user:${authUser.id}`, {
        ...userProfile,
        badges: earnedBadges,
        updatedAt: new Date().toISOString(),
      });
      
      console.log(`✓ Awarded ${newBadges.length} new badges to user ${authUser.id}`);
    }

    return c.json({ 
      success: true, 
      newBadges: newBadges.map(getBadgeDisplayInfo),
      totalBadges: earnedBadges.length,
      message: newBadges.length > 0 
        ? `Congratulations! You earned ${newBadges.length} new badge${newBadges.length > 1 ? 's' : ''}!`
        : 'No new badges earned yet. Keep going!'
    });
  } catch (error: any) {
    console.error('❌ Check badges error:', error);
    return c.json({ error: error.message || 'Failed to check badges' }, 500);
  }
});

// Generate shareable impact card data
app.get("/make-server-b8526fa6/users/impact-card", async (c) => {
  try {
    console.log('=== Generate Impact Card ===');
    
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const { user: authUser } = auth;
    
    // Get user profile
    const userProfile = await kv.get(`user:${authUser.id}`);
    if (!userProfile) {
      return c.json({ error: 'User profile not found' }, 404);
    }

    // Calculate stats
    const stats = userProfile.role === 'diaspora'
      ? await calculateMentorImpactStats(authUser.id, userProfile)
      : await calculateYouthProgressStats(authUser.id, userProfile);
    
    // Generate card data
    const cardData = generateImpactCardData(userProfile, stats, userProfile.role);

    return c.json({ success: true, cardData });
  } catch (error: any) {
    console.error('❌ Generate impact card error:', error);
    return c.json({ error: error.message || 'Failed to generate impact card' }, 500);
  }
});

// Get monthly impact summary
app.get("/make-server-b8526fa6/users/monthly-impact", async (c) => {
  try {
    console.log('=== Get Monthly Impact ===');
    
    const auth = await authenticateUser(c);
    if ('error' in auth) {
      return c.json({ error: auth.error }, auth.status);
    }

    const { user: authUser } = auth;
    
    // Get user profile
    const userProfile = await kv.get(`user:${authUser.id}`);
    if (!userProfile) {
      return c.json({ error: 'User profile not found' }, 404);
    }

    // Generate monthly impact
    const monthlyImpact = await generateMonthlyImpact(authUser.id, userProfile.role);

    return c.json({ success: true, impact: monthlyImpact });
  } catch (error: any) {
    console.error('❌ Get monthly impact error:', error);
    return c.json({ error: error.message || 'Failed to get monthly impact' }, 500);
  }
});

// Global error handler - prevent server crashes
app.onError((err, c) => {
  console.error('❌ Server error:', err);
  return c.json({ 
    error: 'Internal server error', 
    message: err.message,
    timestamp: new Date().toISOString()
  }, 500);
});

// 404 handler for unknown routes
app.notFound((c) => {
  console.log('⚠️ 404 Not Found:', c.req.url);
  return c.json({ error: 'Not found', path: c.req.url }, 404);
});

// Export the app for the edge function wrapper
export default app;