// ══════════════════════════════════════════════════════════════════════════════
// ── USER TYPES ──
// ══════════════════════════════════════════════════════════════════════════════

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'diaspora' | 'student';
  mentorType?: 'diaspora' | 'home'; // Type of mentor: diaspora (abroad) or home (local)
  createdAt: string;
  updatedAt?: string;
  onboardingComplete: boolean;
  
  // Optional profile fields
  displayName?: string;
  bio?: string;
  avatar?: string;
  phone?: string;
  location?: string;
  countryOfOrigin?: string;
  linkedIn?: string;
  website?: string;
  
  // Mentor-specific fields
  company?: string;
  jobTitle?: string;
  industry?: string;
  yearsOfExperience?: number;
  expertise?: string[];
  mentorshipAreas?: string[];
  maxMentees?: number;
  acceptingMentees?: boolean;
  
  // NEW: Enhanced Mentor Profile Fields (MentorCruise-style)
  nigerianCityOfOrigin?: string; // e.g., "Lagos", "Abuja", "Enugu", etc.
  expertiseAreas?: string[]; // e.g., ["Software Engineering", "Product Management"]
  whatICanHelpWith?: string[]; // e.g., ["Technical interview prep", "Resume reviews"]
  industriesWorkedIn?: string[]; // e.g., ["Tech/Software", "Finance", "Healthcare"]
  languagesSpoken?: string[]; // e.g., ["English", "Yoruba", "Igbo"]
  availabilityHoursPerMonth?: number; // e.g., 4, 8, 10
  preferredMenteeLevel?: string[]; // e.g., ["Undergraduate", "Graduate", "Early Career"]
  currentRole?: string; // Legacy field for backwards compatibility
  title?: string; // Legacy field for backwards compatibility
  
  // Student-specific fields
  university?: string;
  fieldOfStudy?: string;
  yearOfStudy?: string;
  graduationYear?: number;
  interests?: string[];
  goals?: string[];
  careerAspirations?: string;
  
  // NEW: Enhanced Student Profile Fields
  careerInterests?: string[]; // e.g., ["Software Engineering", "Data Science"]
  learningGoals?: string[]; // e.g., ["Land internship", "Prepare for interviews"]
  lookingForHelpWith?: string; // Free text field for what they're seeking
  
  // Achievement & Impact Tracking
  badges?: Badge[];
}

// ══════════════════════════════════════════════════════════════════════════════
// ── BADGE & ACHIEVEMENT TYPES ──
// ══════════════════════════════════════════════════════════════════════════════

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'milestone' | 'impact' | 'time' | 'special' | 'engagement' | 'progress' | 'community';
  tier?: 'bronze' | 'silver' | 'gold' | 'platinum';
  earnedAt?: string;
  tierColor?: string;
  categoryLabel?: string;
}

export interface ImpactStats {
  // Mentor stats
  totalYouthsMentored?: number;
  totalSessionsCompleted?: number;
  totalHoursGiven?: number;
  activeMentorships?: number;
  totalMessages?: number;
  responseRate?: number;
  totalResourcesShared?: number;
  statesReached?: number;
  monthsActive?: number;
  activeSince?: string;
  averageRating?: number;
  totalReviews?: number;
  completionRate?: number;
  
  // Youth stats
  sessionsAttended?: number;
  mentorsConnected?: number;
  skillsDeveloped?: string[];
  resourcesAccessed?: number;
  goalsCompleted?: number;
  totalGoals?: number;
  goalsProgress?: number;
  groupSessionsAttended?: number;
  hasCompletedInterviewPrep?: boolean;
  hasSecuredJob?: boolean;
  hasSecuredInternship?: boolean;
  hasCompletedCareerProgram?: boolean;
  upcomingSessions?: number;
}

export interface ImpactCardData {
  name: string;
  title: string;
  company?: string;
  university?: string;
  stats: Array<{
    label: string;
    value: string | number;
  }>;
  quote: string;
  activeSince: string;
}

export interface MonthlyImpact {
  month: string;
  // Mentor fields
  sessionsCompleted?: number;
  hoursGiven?: number;
  newYouthsConnected?: number;
  messagesSent?: number;
  // Youth fields
  sessionsAttended?: number;
  skillsPracticed?: string[];
}

// ══════════════════════════════════════════════════════════════════════════════
// ── MENTORSHIP REQUEST TYPES ──
// ══════════════════════════════════════════════════════════════════════════════

export interface MentorshipRequest {
  id: string;
  studentId: string;
  mentorId: string;
  message: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  acceptedAt?: string;
  declinedAt?: string;
  declineReason?: string;
  
  // Enriched data (from API)
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    university?: string;
    fieldOfStudy?: string;
    avatar?: string;
  };
  mentor?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    company?: string;
    jobTitle?: string;
    avatar?: string;
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// ── MENTORSHIP TYPES ──
// ══════════════════════════════════════════════════════════════════════════════

export interface Mentorship {
  id: string;
  mentorId: string;
  studentId: string;
  status: 'active' | 'ended' | 'paused';
  startedAt: string;
  endedAt?: string;
  requestId: string;
  
  // Optional fields
  goals?: string[];
  notes?: string;
  
  // Enriched data (from API)
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    university?: string;
    fieldOfStudy?: string;
    avatar?: string;
  };
  mentor?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    company?: string;
    jobTitle?: string;
    avatar?: string;
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// ── SESSION TYPES ──
// ══════════════════════════════════════════════════════════════════════════════

export interface Session {
  id: string;
  mentorshipId: string;
  mentorId: string;
  studentId: string;
  scheduledAt: string;
  duration: number; // in minutes
  topic?: string;
  notes?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'missed';
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  cancelledBy?: string;
  cancelledAt?: string;
  completedAt?: string;
  
  // Social features
  likesCount?: number;
  commentsCount?: number;
  viewsCount?: number;
  isLikedByCurrentUser?: boolean;
  
  // Enriched data (from API)
  mentorship?: Mentorship;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  mentor?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// ── SESSION SOCIAL TYPES ──
// ══════════════════════════════════════════════════════════════════════════════

export interface SessionLike {
  id: string;
  sessionId: string;
  userId: string;
  createdAt: string;
  
  // Enriched data
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

export interface SessionComment {
  id: string;
  sessionId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  isPinned?: boolean;
  
  // Enriched data
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    role?: string;
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// ── MESSAGE TYPES ──
// ══════════════════════════════════════════════════════════════════════════════

export interface Message {
  id: string;
  mentorshipId: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  createdAt: string;
  readAt?: string;
  
  // Enriched data (from API)
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// ── RESOURCE TYPES ──
// ══════════════════════════════════════════════════════════════════════════════

export interface Resource {
  id: string;
  mentorshipId: string;
  mentorId: string;
  studentId: string;
  type: 'file' | 'link' | 'note';
  title: string;
  description?: string;
  
  // For file type
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  
  // For link type
  linkUrl?: string;
  
  // For note type
  content?: string;
  
  createdAt: string;
  
  // Enriched data (from API)
  mentor?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// ── OPPORTUNITY TYPES ──
// ══════════════════════════════════════════════════════════════════════════════

export interface Opportunity {
  id: string;
  title: string;
  company: string;
  type: 'internship' | 'job' | 'scholarship' | 'other';
  location: string;
  locationType?: 'remote' | 'hybrid' | 'onsite';
  description: string;
  requirements?: string[];
  benefits?: string[];
  salary?: string;
  deadline?: string;
  applicationUrl?: string;
  postedBy: string;
  status: 'active' | 'closed' | 'draft';
  createdAt: string;
  bookmarkedBy: string[];
  tags?: string[];
  
  // Enriched data (from API)
  poster?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// ── NOTIFICATION TYPES ──
// ══════════════════════════════════════════════════════════════════════════════

export interface Notification {
  id: string;
  userId: string;
  type:
    | 'mentorship_request'
    | 'mentorship_accepted'
    | 'mentorship_declined'
    | 'mentorship_ended'
    | 'session_scheduled'
    | 'session_cancelled'
    | 'session_reminder'
    | 'new_message'
    | 'opportunity_posted'
    | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  readAt?: string;
  data?: any; // Additional data specific to notification type
}

// ══════════════════════════════════════════════════════════════════════════════
// ── SETTINGS TYPES ──
// ══════════════════════════════════════════════════════════════════════════════

export interface UserSettings {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    mentorshipRequests?: boolean;
    messages?: boolean;
    sessions?: boolean;
    opportunities?: boolean;
  };
  privacy: {
    profileVisibility: 'everyone' | 'verified' | 'mentees';
    showInDirectory: boolean;
    showEmployer: boolean;
    allowDirectMessages?: boolean;
    showActivityStatus?: boolean;
  };
  preferences: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    timezone?: string;
  };
  updatedAt?: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// ── STATS TYPES ──
// ══════════════════════════════════════════════════════════════════════════════

export interface MentorStats {
  totalMentorships: number;
  activeMentorships: number;
  totalSessions: number;
  completedSessions: number;
  pendingRequests: number;
  profileViews: number;
  impactScore: number;
}

export interface StudentStats {
  totalMentorships: number;
  activeMentorships: number;
  totalSessions: number;
  upcomingSessions: number;
  pendingRequests: number;
  opportunitiesApplied: number;
}

// ══════════════════════════════════════════════════════════════════════════════
// ── API RESPONSE TYPES ──
// ══════════════════════════════════════════════════════════════════════════════

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthResponse {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  user?: User;
  error?: string;
  message?: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// ── FORM DATA TYPES ──
// ══════════════════════════════════════════════════════════════════════════════

export interface SignupFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  role: 'diaspora' | 'student';
}

export interface SigninFormData {
  email: string;
  password: string;
}

export interface OnboardingFormData {
  // Common fields
  bio?: string;
  phone?: string;
  location?: string;
  countryOfOrigin?: string;
  linkedIn?: string;
  
  // Mentor fields
  company?: string;
  jobTitle?: string;
  industry?: string;
  yearsOfExperience?: number;
  expertise?: string[];
  mentorshipAreas?: string[];
  
  // Student fields
  university?: string;
  fieldOfStudy?: string;
  yearOfStudy?: string;
  graduationYear?: number;
  interests?: string[];
  goals?: string[];
  careerAspirations?: string;
}

export interface CreateRequestFormData {
  mentorId: string;
  message: string;
}

export interface CreateOpportunityFormData {
  title: string;
  company: string;
  type: 'internship' | 'job' | 'scholarship' | 'other';
  location: string;
  locationType?: 'remote' | 'hybrid' | 'onsite';
  description: string;
  requirements?: string[];
  benefits?: string[];
  salary?: string;
  deadline?: string;
  applicationUrl?: string;
  tags?: string[];
}

export interface CreateSessionFormData {
  mentorshipId: string;
  scheduledAt: string;
  duration: number;
  topic?: string;
  notes?: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// ── UTILITY TYPES ──
// ══════════════════════════════════════════════════════════════════════════════

export type UserRole = 'diaspora' | 'student';
export type RequestStatus = 'pending' | 'accepted' | 'declined';
export type MentorshipStatus = 'active' | 'ended' | 'paused';
export type SessionStatus = 'scheduled' | 'completed' | 'cancelled' | 'missed';
export type OpportunityType = 'internship' | 'job' | 'scholarship' | 'other';
export type LocationType = 'remote' | 'hybrid' | 'onsite';
export type OpportunityStatus = 'active' | 'closed' | 'draft';
export type ResourceType = 'file' | 'link' | 'note';
export type NotificationType =
  | 'mentorship_request'
  | 'mentorship_accepted'
  | 'mentorship_declined'
  | 'mentorship_ended'
  | 'session_scheduled'
  | 'session_cancelled'
  | 'session_reminder'
  | 'new_message'
  | 'opportunity_posted'
  | 'system';
export type ProfileVisibility = 'everyone' | 'verified' | 'mentees';
export type Theme = 'light' | 'dark' | 'system';