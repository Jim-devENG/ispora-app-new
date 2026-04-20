import { Hono } from 'npm:hono@4';
import { cors } from 'npm:hono@4/cors';
import { createClient } from 'jsr:@supabase/supabase-js@2.49.8';

const app = new Hono();

// Enable CORS
app.use('*', cors({ origin: '*', allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] }));

// Supabase client with service role for KV access
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

console.log('=== Public Profile Function Starting ===');
console.log('SUPABASE_URL:', supabaseUrl ? 'Set' : 'NOT SET');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

// KV store helper - uses the correct table name
const kv = {
  get: async (key: string) => {
    console.log('KV get - looking for key:', key);
    const { data, error } = await supabase
      .from('kv_store_b8526fa6')
      .select('value')
      .eq('key', key)
      .maybeSingle();
    if (error) {
      console.log('KV get error:', error);
      return null;
    }
    console.log('KV get result:', data ? 'Found' : 'Not found');
    return data?.value;
  }
};

// Health check endpoint
app.get('/health', async (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'Public profile function is running'
  });
});

// Get public profile (no auth required)
app.get('/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    console.log('=== Get Public Profile ===');
    console.log('Requested userId:', userId);
    
    const user = await kv.get(`user:${userId}`);
    
    if (!user) {
      console.log('User not found in KV store');
      return c.json({ error: 'Profile not found', userId }, 404);
    }
    
    console.log('User found:', user.firstName, user.lastName);
    
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
      education: user.education,
      goals: user.goals,
      createdAt: user.createdAt,
    };
    
    return c.json({ success: true, profile: publicProfile });
  } catch (error: any) {
    console.log('Get public profile error:', error);
    return c.json({ error: error.message || 'Failed to fetch profile' }, 500);
  }
});

Deno.serve(app.fetch);
