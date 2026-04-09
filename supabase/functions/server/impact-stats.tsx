// ══════════════════════════════════════════════════════════════════════════════
// ── IMPACT STATS CALCULATION ──
// ══════════════════════════════════════════════════════════════════════════════

import * as kv from "./kv_store.tsx";

/**
 * Calculate comprehensive mentor impact statistics
 */
export async function calculateMentorImpactStats(userId: string, userProfile: any) {
  console.log('=== Calculating Mentor Impact Stats ===');
  
  try {
    // Get all mentorships with error handling
    const allMentorships = await kv.getByPrefix('mentorship:').catch(() => []);
    const mentorMentorships = (Array.isArray(allMentorships) ? allMentorships : []).filter((m: any) => m.mentorId === userId);
    console.log(`Found ${mentorMentorships.length} mentorships`);
    
    // Get all sessions with error handling
    const allSessions = await kv.getByPrefix('session:').catch(() => []);
    const mentorSessions = (Array.isArray(allSessions) ? allSessions : []).filter((s: any) => s.mentorId === userId);
    console.log(`Found ${mentorSessions.length} sessions`);
    
    // Get all messages with error handling
    const allMessages = await kv.getByPrefix('message:').catch(() => []);
    const mentorMessages = (Array.isArray(allMessages) ? allMessages : []).filter((m: any) => m.senderId === userId);
    console.log(`Found ${mentorMessages.length} messages`);
    
    // Get all resources with error handling
    const allResources = await kv.getByPrefix('resource:').catch(() => []);
    const mentorResources = (Array.isArray(allResources) ? allResources : []).filter((r: any) => r.mentorId === userId);
    console.log(`Found ${mentorResources.length} resources`);
  
  // Basic counts
  const totalYouthsMentored = new Set(mentorMentorships.map((m: any) => m.studentId)).size;
  const activeMentorships = mentorMentorships.filter((m: any) => m.status === 'active');
  const completedSessions = mentorSessions.filter((s: any) => s.status === 'completed');
  const totalSessionsCompleted = completedSessions.length;
  
  // Calculate total hours (based on session duration)
  const totalHoursGiven = completedSessions.reduce((sum: number, session: any) => {
    return sum + (session.duration || 60); // default 60 minutes if not set
  }, 0) / 60; // convert to hours
  
  // Calculate response rate (simplified - can be enhanced)
  const responseRate = mentorMessages.length > 0 ? 95 : 0; // Placeholder logic
  
  // Get unique states reached (based on student locations)
  const studentIds = new Set(mentorMentorships.map((m: any) => m.studentId));
  const studentProfiles = await Promise.all(
    Array.from(studentIds).map((id) => kv.get(`user:${id}`))
  );
  const statesReached = new Set(
    studentProfiles
      .filter((p: any) => p && p.location)
      .map((p: any) => {
        // Extract state from location string (assuming format like "Lagos, Nigeria")
        const parts = p.location.split(',');
        return parts[0]?.trim();
      })
      .filter(Boolean)
  ).size;
  
  // Calculate months active
  const createdAt = new Date(userProfile.createdAt || Date.now());
  const now = new Date();
  const monthsActive = Math.floor(
    (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );
  
  // Calculate average rating (placeholder - needs review system)
  const averageRating = 0;
  const totalReviews = 0;
  
    const stats = {
      // Core metrics
      totalYouthsMentored,
      totalSessionsCompleted,
      totalHoursGiven: Math.round(totalHoursGiven * 10) / 10, // Round to 1 decimal
      activeMentorships: activeMentorships.length,
      
      // Communication
      totalMessages: mentorMessages.length,
      responseRate,
      
      // Resources
      totalResourcesShared: mentorResources.length,
      
      // Geographic reach
      statesReached,
      
      // Time-based
      monthsActive,
      activeSince: userProfile.createdAt,
      
      // Ratings (placeholder)
      averageRating,
      totalReviews,
      
      // Session breakdown
      scheduledSessions: mentorSessions.filter((s: any) => s.status === 'scheduled').length,
      cancelledSessions: mentorSessions.filter((s: any) => s.status === 'cancelled').length,
      completionRate: mentorSessions.length > 0 
        ? Math.round((completedSessions.length / mentorSessions.length) * 100) 
        : 0,
    };
    
    console.log('✓ Mentor stats calculated successfully');
    return stats;
  } catch (error: any) {
    console.error('❌ Error calculating mentor stats:', error.message);
    // Return default stats on error
    return {
      totalYouthsMentored: 0,
      totalSessionsCompleted: 0,
      totalHoursGiven: 0,
      activeMentorships: 0,
      totalMessages: 0,
      responseRate: 0,
      totalResourcesShared: 0,
      statesReached: 0,
      monthsActive: 0,
      activeSince: userProfile.createdAt,
      averageRating: 0,
      totalReviews: 0,
      scheduledSessions: 0,
      cancelledSessions: 0,
      completionRate: 0,
    };
  }
}

/**
 * Calculate comprehensive youth progress statistics
 */
export async function calculateYouthProgressStats(userId: string, userProfile: any) {
  console.log('=== Calculating Youth Progress Stats ===');
  
  try {
    // Get all mentorships with error handling
    const allMentorships = await kv.getByPrefix('mentorship:').catch(() => []);
    const youthMentorships = (Array.isArray(allMentorships) ? allMentorships : []).filter((m: any) => m.studentId === userId);
    console.log(`Found ${youthMentorships.length} mentorships`);
    
    // Get all sessions with error handling
    const allSessions = await kv.getByPrefix('session:').catch(() => []);
    const youthSessions = (Array.isArray(allSessions) ? allSessions : []).filter((s: any) => s.studentId === userId);
    console.log(`Found ${youthSessions.length} sessions`);
    
    // Get all messages with error handling
    const allMessages = await kv.getByPrefix('message:').catch(() => []);
    const youthMessages = (Array.isArray(allMessages) ? allMessages : []).filter((m: any) => m.senderId === userId);
    console.log(`Found ${youthMessages.length} messages`);
    
    // Get all resources accessed (resources shared with this youth) with error handling
    const allResources = await kv.getByPrefix('resource:').catch(() => []);
    const youthResources = (Array.isArray(allResources) ? allResources : []).filter((r: any) => r.studentId === userId);
    console.log(`Found ${youthResources.length} resources`);
  
  // Basic counts
  const mentorsConnected = new Set(youthMentorships.map((m: any) => m.mentorId)).size;
  const activeMentorships = youthMentorships.filter((m: any) => m.status === 'active');
  const completedSessions = youthSessions.filter((s: any) => s.status === 'completed');
  const sessionsAttended = completedSessions.length;
  
  // Skills developed (from profile or sessions)
  const skillsDeveloped = userProfile.interests || [];
  
  // Calculate goals completed (placeholder - needs goal tracking system)
  const goalsCompleted = 0;
  const totalGoals = userProfile.goals?.length || 0;
  
  // Group sessions attended (placeholder - needs session type tracking)
  const groupSessionsAttended = 0;
  
  // Calculate months active
  const createdAt = new Date(userProfile.createdAt || Date.now());
  const now = new Date();
  const monthsActive = Math.floor(
    (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );
  
  // Career milestones (placeholder - needs milestone tracking)
  const hasCompletedInterviewPrep = false;
  const hasSecuredJob = false;
  const hasSecuredInternship = false;
  const hasCompletedCareerProgram = false;
  
    const stats = {
      // Core metrics
      sessionsAttended,
      mentorsConnected,
      activeMentorships: activeMentorships.length,
      
      // Learning
      skillsDeveloped,
      resourcesAccessed: youthResources.length,
      
      // Goals
      goalsCompleted,
      totalGoals,
      goalsProgress: totalGoals > 0 ? Math.round((goalsCompleted / totalGoals) * 100) : 0,
      
      // Communication
      totalMessages: youthMessages.length,
      
      // Community
      groupSessionsAttended,
      
      // Time-based
      monthsActive,
      activeSince: userProfile.createdAt,
      
      // Career milestones
      hasCompletedInterviewPrep,
      hasSecuredJob,
      hasSecuredInternship,
      hasCompletedCareerProgram,
      
      // Session breakdown
      scheduledSessions: youthSessions.filter((s: any) => s.status === 'scheduled').length,
      upcomingSessions: youthSessions.filter((s: any) => 
        s.status === 'scheduled' && new Date(s.scheduledAt) > new Date()
      ).length,
    };
    
    console.log('✓ Youth stats calculated successfully');
    return stats;
  } catch (error: any) {
    console.error('❌ Error calculating youth stats:', error.message);
    // Return default stats on error
    return {
      sessionsAttended: 0,
      mentorsConnected: 0,
      activeMentorships: 0,
      skillsDeveloped: [],
      resourcesAccessed: 0,
      goalsCompleted: 0,
      totalGoals: 0,
      goalsProgress: 0,
      totalMessages: 0,
      groupSessionsAttended: 0,
      monthsActive: 0,
      activeSince: userProfile.createdAt,
      hasCompletedInterviewPrep: false,
      hasSecuredJob: false,
      hasSecuredInternship: false,
      hasCompletedCareerProgram: false,
      scheduledSessions: 0,
      upcomingSessions: 0,
    };
  }
}

/**
 * Generate shareable impact card data
 */
export function generateImpactCardData(
  user: any,
  stats: any,
  role: 'diaspora' | 'student'
) {
  if (role === 'diaspora') {
    return {
      name: `${user.firstName} ${user.lastName}`,
      title: user.jobTitle || 'Mentor',
      company: user.company,
      stats: [
        { label: 'Youths Mentored', value: stats.totalYouthsMentored },
        { label: 'Sessions Completed', value: stats.totalSessionsCompleted },
        { label: 'Hours Given', value: `${stats.totalHoursGiven}h` },
        { label: 'States Reached', value: stats.statesReached },
      ],
      quote: user.bio || 'Empowering the next generation of African leaders',
      activeSince: stats.activeSince,
    };
  } else {
    return {
      name: `${user.firstName} ${user.lastName}`,
      title: user.fieldOfStudy || 'Aspiring Professional',
      university: user.university,
      stats: [
        { label: 'Sessions Attended', value: stats.sessionsAttended },
        { label: 'Mentors Connected', value: stats.mentorsConnected },
        { label: 'Goals Achieved', value: stats.goalsCompleted },
        { label: 'Skills Learned', value: stats.skillsDeveloped.length },
      ],
      quote: user.careerAspirations || 'Building my future, one session at a time',
      activeSince: stats.activeSince,
    };
  }
}

/**
 * Generate monthly impact summary
 */
export async function generateMonthlyImpact(userId: string, role: 'diaspora' | 'student') {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // Get sessions this month
  const allSessions = await kv.getByPrefix('session:');
  const userSessions = allSessions.filter((s: any) => {
    const sessionDate = new Date(s.scheduledAt);
    const isUserSession = role === 'diaspora' 
      ? s.mentorId === userId 
      : s.studentId === userId;
    return isUserSession && sessionDate >= monthStart && s.status === 'completed';
  });
  
  // Get messages this month
  const allMessages = await kv.getByPrefix('message:');
  const userMessages = allMessages.filter((m: any) => {
    const messageDate = new Date(m.createdAt);
    return m.senderId === userId && messageDate >= monthStart;
  });
  
  if (role === 'diaspora') {
    // Get new mentorships this month
    const allMentorships = await kv.getByPrefix('mentorship:');
    const newMentorships = allMentorships.filter((m: any) => {
      const startDate = new Date(m.startedAt);
      return m.mentorId === userId && startDate >= monthStart;
    });
    
    const totalHours = userSessions.reduce((sum: number, s: any) => 
      sum + (s.duration || 60), 0) / 60;
    
    return {
      month: now.toLocaleString('default', { month: 'long', year: 'numeric' }),
      sessionsCompleted: userSessions.length,
      hoursGiven: Math.round(totalHours * 10) / 10,
      newYouthsConnected: newMentorships.length,
      messagesSent: userMessages.length,
    };
  } else {
    return {
      month: now.toLocaleString('default', { month: 'long', year: 'numeric' }),
      sessionsAttended: userSessions.length,
      messagesSent: userMessages.length,
      skillsPracticed: [], // Placeholder
    };
  }
}
