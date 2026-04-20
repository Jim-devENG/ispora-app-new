import { Hono } from 'https://deno.land/x/hono@3.10.3/mod.ts';
import { cors } from 'https://deno.land/x/hono@3.10.3/middleware.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const app = new Hono();

// Enable CORS
app.use('*', cors({ origin: '*', allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] }));

// Supabase client with service role for KV access
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

// Simple KV store helpers
const kv = {
  get: async (key: string) => {
    const { data, error } = await supabase
      .from('kv_store')
      .select('value')
      .eq('key', key)
      .single();
    if (error) return null;
    return typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
  }
};

// Get public profile (no auth required)
app.get('/public-profile/:userId', async (c) => {
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
