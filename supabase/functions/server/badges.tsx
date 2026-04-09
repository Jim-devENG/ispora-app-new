// ══════════════════════════════════════════════════════════════════════════════
// ── BADGE DEFINITIONS & ACHIEVEMENT SYSTEM ──
// ══════════════════════════════════════════════════════════════════════════════

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'milestone' | 'impact' | 'time' | 'special' | 'engagement' | 'progress' | 'community';
  tier?: 'bronze' | 'silver' | 'gold' | 'platinum';
  earnedAt?: string;
}

export interface BadgeCriteria {
  id: string;
  check: (stats: any) => boolean;
  badge: Omit<Badge, 'earnedAt'>;
}

// ══════════════════════════════════════════════════════════════════════════════
// ── MENTOR BADGES ──
// ══════════════════════════════════════════════════════════════════════════════

export const MENTOR_BADGES: BadgeCriteria[] = [
  // Milestone Badges - Session Count
  {
    id: 'first-session',
    check: (stats) => stats.totalSessionsCompleted >= 1,
    badge: {
      id: 'first-session',
      name: 'Journey Begins',
      description: 'Completed your first mentoring session',
      icon: '⭐',
      category: 'milestone',
      tier: 'bronze',
    },
  },
  {
    id: 'rising-star',
    check: (stats) => stats.totalSessionsCompleted >= 10,
    badge: {
      id: 'rising-star',
      name: 'Rising Star',
      description: 'Completed 10 mentoring sessions',
      icon: '🔥',
      category: 'milestone',
      tier: 'silver',
    },
  },
  {
    id: 'impact-maker',
    check: (stats) => stats.totalSessionsCompleted >= 50,
    badge: {
      id: 'impact-maker',
      name: 'Impact Maker',
      description: 'Completed 50 mentoring sessions',
      icon: '💎',
      category: 'milestone',
      tier: 'gold',
    },
  },
  {
    id: 'legend',
    check: (stats) => stats.totalSessionsCompleted >= 100,
    badge: {
      id: 'legend',
      name: 'Legend',
      description: 'Completed 100 mentoring sessions',
      icon: '👑',
      category: 'milestone',
      tier: 'platinum',
    },
  },
  {
    id: 'transformational-leader',
    check: (stats) => stats.totalSessionsCompleted >= 250,
    badge: {
      id: 'transformational-leader',
      name: 'Transformational Leader',
      description: 'Completed 250 mentoring sessions',
      icon: '🌟',
      category: 'milestone',
      tier: 'platinum',
    },
  },

  // Impact Badges - Youth Count
  {
    id: 'first-mentee',
    check: (stats) => stats.totalYouthsMentored >= 1,
    badge: {
      id: 'first-mentee',
      name: 'First Connection',
      description: 'Mentored your first youth',
      icon: '🤝',
      category: 'impact',
      tier: 'bronze',
    },
  },
  {
    id: 'community-builder',
    check: (stats) => stats.totalYouthsMentored >= 5,
    badge: {
      id: 'community-builder',
      name: 'Community Builder',
      description: 'Mentored 5 youths',
      icon: '🏗️',
      category: 'impact',
      tier: 'silver',
    },
  },
  {
    id: 'career-launcher',
    check: (stats) => stats.totalYouthsMentored >= 10,
    badge: {
      id: 'career-launcher',
      name: 'Career Launcher',
      description: 'Mentored 10+ youths',
      icon: '🎓',
      category: 'impact',
      tier: 'gold',
    },
  },
  {
    id: 'impact-champion',
    check: (stats) => stats.totalYouthsMentored >= 25,
    badge: {
      id: 'impact-champion',
      name: 'Impact Champion',
      description: 'Mentored 25+ youths',
      icon: '🏆',
      category: 'impact',
      tier: 'platinum',
    },
  },

  // Resource & Communication Badges
  {
    id: 'resource-champion',
    check: (stats) => stats.totalResourcesShared >= 50,
    badge: {
      id: 'resource-champion',
      name: 'Resource Champion',
      description: 'Shared 50+ valuable resources',
      icon: '📚',
      category: 'impact',
      tier: 'gold',
    },
  },
  {
    id: 'quick-responder',
    check: (stats) => stats.responseRate >= 95 && stats.totalMessages >= 50,
    badge: {
      id: 'quick-responder',
      name: 'Quick Responder',
      description: '95%+ response rate with 50+ messages',
      icon: '⚡',
      category: 'impact',
      tier: 'gold',
    },
  },
  {
    id: 'communication-master',
    check: (stats) => stats.totalMessages >= 500,
    badge: {
      id: 'communication-master',
      name: 'Communication Master',
      description: 'Exchanged 500+ messages',
      icon: '💬',
      category: 'impact',
      tier: 'gold',
    },
  },

  // Geographic Impact
  {
    id: 'pan-nigeria-mentor',
    check: (stats) => stats.statesReached >= 10,
    badge: {
      id: 'pan-nigeria-mentor',
      name: 'Pan-Nigeria Mentor',
      description: 'Mentored youths from 10+ Nigerian states',
      icon: '🌍',
      category: 'impact',
      tier: 'gold',
    },
  },

  // Time-Based Badges
  {
    id: 'six-month-veteran',
    check: (stats) => stats.monthsActive >= 6,
    badge: {
      id: 'six-month-veteran',
      name: '6-Month Veteran',
      description: 'Mentoring for 6 months',
      icon: '📅',
      category: 'time',
      tier: 'bronze',
    },
  },
  {
    id: 'one-year-champion',
    check: (stats) => stats.monthsActive >= 12,
    badge: {
      id: 'one-year-champion',
      name: '1-Year Champion',
      description: 'Mentoring for 1 year',
      icon: '🗓️',
      category: 'time',
      tier: 'silver',
    },
  },
  {
    id: 'two-year-legend',
    check: (stats) => stats.monthsActive >= 24,
    badge: {
      id: 'two-year-legend',
      name: '2-Year Legend',
      description: 'Mentoring for 2 years',
      icon: '🏅',
      category: 'time',
      tier: 'gold',
    },
  },

  // Hours Contributed
  {
    id: 'time-giver',
    check: (stats) => stats.totalHoursGiven >= 50,
    badge: {
      id: 'time-giver',
      name: 'Time Giver',
      description: 'Contributed 50+ hours of mentorship',
      icon: '⏰',
      category: 'impact',
      tier: 'silver',
    },
  },
  {
    id: 'dedicated-mentor',
    check: (stats) => stats.totalHoursGiven >= 100,
    badge: {
      id: 'dedicated-mentor',
      name: 'Dedicated Mentor',
      description: 'Contributed 100+ hours of mentorship',
      icon: '⌚',
      category: 'impact',
      tier: 'gold',
    },
  },

  // Special Recognition (calculated separately based on ratings/reviews)
  {
    id: 'five-star-rated',
    check: (stats) => stats.averageRating >= 4.8 && stats.totalReviews >= 10,
    badge: {
      id: 'five-star-rated',
      name: '5-Star Rated',
      description: 'Maintained 4.8+ rating with 10+ reviews',
      icon: '⭐⭐⭐⭐⭐',
      category: 'special',
      tier: 'platinum',
    },
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// ── YOUTH BADGES ──
// ══════════════════════════════════════════════════════════════════════════════

export const YOUTH_BADGES: BadgeCriteria[] = [
  // Engagement Badges - Session Count
  {
    id: 'first-session-youth',
    check: (stats) => stats.sessionsAttended >= 1,
    badge: {
      id: 'first-session-youth',
      name: 'Journey Begins',
      description: 'Attended your first mentoring session',
      icon: '🌱',
      category: 'engagement',
      tier: 'bronze',
    },
  },
  {
    id: 'committed-learner',
    check: (stats) => stats.sessionsAttended >= 10,
    badge: {
      id: 'committed-learner',
      name: 'Committed Learner',
      description: 'Attended 10 mentoring sessions',
      icon: '🔥',
      category: 'engagement',
      tier: 'silver',
    },
  },
  {
    id: 'dedicated-student',
    check: (stats) => stats.sessionsAttended >= 25,
    badge: {
      id: 'dedicated-student',
      name: 'Dedicated Youth',
      description: 'Attended 25 mentoring sessions',
      icon: '💪',
      category: 'engagement',
      tier: 'gold',
    },
  },
  {
    id: 'learning-champion',
    check: (stats) => stats.sessionsAttended >= 50,
    badge: {
      id: 'learning-champion',
      name: 'Learning Champion',
      description: 'Attended 50 mentoring sessions',
      icon: '🏆',
      category: 'engagement',
      tier: 'platinum',
    },
  },

  // Progress Badges - Goals
  {
    id: 'goal-setter',
    check: (stats) => stats.goalsCompleted >= 1,
    badge: {
      id: 'goal-setter',
      name: 'Goal Setter',
      description: 'Completed your first goal',
      icon: '🎯',
      category: 'progress',
      tier: 'bronze',
    },
  },
  {
    id: 'goal-crusher',
    check: (stats) => stats.goalsCompleted >= 5,
    badge: {
      id: 'goal-crusher',
      name: 'Goal Crusher',
      description: 'Completed 5 personal goals',
      icon: '🎯',
      category: 'progress',
      tier: 'gold',
    },
  },
  {
    id: 'goal-master',
    check: (stats) => stats.goalsCompleted >= 10,
    badge: {
      id: 'goal-master',
      name: 'Goal Master',
      description: 'Completed 10 personal goals',
      icon: '🎖️',
      category: 'progress',
      tier: 'platinum',
    },
  },

  // Learning Resources
  {
    id: 'knowledge-seeker',
    check: (stats) => stats.resourcesAccessed >= 20,
    badge: {
      id: 'knowledge-seeker',
      name: 'Knowledge Seeker',
      description: 'Accessed 20+ resources',
      icon: '📖',
      category: 'engagement',
      tier: 'silver',
    },
  },
  {
    id: 'resource-master',
    check: (stats) => stats.resourcesAccessed >= 50,
    badge: {
      id: 'resource-master',
      name: 'Resource Master',
      description: 'Accessed 50+ resources',
      icon: '📚',
      category: 'engagement',
      tier: 'gold',
    },
  },

  // Career Milestones
  {
    id: 'interview-pro',
    check: (stats) => stats.hasCompletedInterviewPrep === true,
    badge: {
      id: 'interview-pro',
      name: 'Interview Pro',
      description: 'Completed interview preparation sessions',
      icon: '🎤',
      category: 'progress',
      tier: 'gold',
    },
  },
  {
    id: 'job-secured',
    check: (stats) => stats.hasSecuredJob === true,
    badge: {
      id: 'job-secured',
      name: 'Job Secured',
      description: 'Secured your first job!',
      icon: '💼',
      category: 'progress',
      tier: 'platinum',
    },
  },
  {
    id: 'internship-winner',
    check: (stats) => stats.hasSecuredInternship === true,
    badge: {
      id: 'internship-winner',
      name: 'Internship Winner',
      description: 'Secured an internship placement',
      icon: '🚀',
      category: 'progress',
      tier: 'gold',
    },
  },
  {
    id: 'career-ready',
    check: (stats) => stats.hasCompletedCareerProgram === true,
    badge: {
      id: 'career-ready',
      name: 'Career Ready',
      description: 'Completed career development program',
      icon: '💼',
      category: 'progress',
      tier: 'gold',
    },
  },

  // Community Engagement
  {
    id: 'active-communicator',
    check: (stats) => stats.totalMessages >= 100,
    badge: {
      id: 'active-communicator',
      name: 'Active Communicator',
      description: 'Exchanged 100+ messages',
      icon: '💬',
      category: 'community',
      tier: 'silver',
    },
  },
  {
    id: 'connector',
    check: (stats) => stats.groupSessionsAttended >= 5,
    badge: {
      id: 'connector',
      name: 'Connector',
      description: 'Attended 5+ group sessions',
      icon: '🤝',
      category: 'community',
      tier: 'silver',
    },
  },

  // Multi-Mentor Engagement
  {
    id: 'multi-mentor',
    check: (stats) => stats.mentorsConnected >= 3,
    badge: {
      id: 'multi-mentor',
      name: 'Multi-Mentor',
      description: 'Working with 3+ mentors',
      icon: '👥',
      category: 'engagement',
      tier: 'gold',
    },
  },

  // Time-Based
  {
    id: 'three-month-learner',
    check: (stats) => stats.monthsActive >= 3,
    badge: {
      id: 'three-month-learner',
      name: '3-Month Learner',
      description: 'Learning for 3 months',
      icon: '📅',
      category: 'engagement',
      tier: 'bronze',
    },
  },
  {
    id: 'six-month-learner',
    check: (stats) => stats.monthsActive >= 6,
    badge: {
      id: 'six-month-learner',
      name: '6-Month Learner',
      description: 'Learning for 6 months',
      icon: '🗓️',
      category: 'engagement',
      tier: 'silver',
    },
  },
  {
    id: 'one-year-learner',
    check: (stats) => stats.monthsActive >= 12,
    badge: {
      id: 'one-year-learner',
      name: '1-Year Learner',
      description: 'Learning for 1 year',
      icon: '🏅',
      category: 'engagement',
      tier: 'gold',
    },
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// ── BADGE CHECKING & AWARDING FUNCTIONS ──
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Check which badges a user has earned based on their stats
 */
export function checkEarnedBadges(stats: any, role: 'diaspora' | 'student'): Badge[] {
  const badgeCriteria = role === 'diaspora' ? MENTOR_BADGES : YOUTH_BADGES;
  const earnedBadges: Badge[] = [];

  for (const criteria of badgeCriteria) {
    if (criteria.check(stats)) {
      earnedBadges.push({
        ...criteria.badge,
        earnedAt: new Date().toISOString(),
      });
    }
  }

  return earnedBadges;
}

/**
 * Get newly earned badges (badges that weren't earned before)
 */
export function getNewBadges(
  currentBadges: Badge[],
  allEarnedBadges: Badge[]
): Badge[] {
  const currentBadgeIds = new Set(currentBadges.map((b) => b.id));
  return allEarnedBadges.filter((badge) => !currentBadgeIds.has(badge.id));
}

/**
 * Get badge display info for UI
 */
export function getBadgeDisplayInfo(badge: Badge) {
  const tierColors = {
    bronze: '#CD7F32',
    silver: '#C0C0C0',
    gold: '#FFD700',
    platinum: '#E5E4E2',
  };

  const categoryLabels = {
    milestone: 'Milestone',
    impact: 'Impact',
    time: 'Tenure',
    special: 'Special Recognition',
    engagement: 'Engagement',
    progress: 'Progress',
    community: 'Community',
  };

  return {
    ...badge,
    tierColor: badge.tier ? tierColors[badge.tier] : '#666',
    categoryLabel: categoryLabels[badge.category],
  };
}
