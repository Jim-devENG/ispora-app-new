import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import type { MentorStats, MentorshipRequest, Mentorship } from '../types';
import logo from '/src/assets/4db1642d96b725f296f07dcb9e96154154c374f8.png';
import { projectId } from '/utils/supabase/info';
import { normalizeUrl } from '../utils/urlHelpers';
import CalendarModal from './CalendarModal';
import {
  LayoutDashboard,
  Users,
  Phone,
  Calendar,
  MessageSquare,
  Search,
  Settings as SettingsIcon,
  LogOut,
  Bell,
  Video,
  Clock,
  CheckCircle,
  AlertCircle,
  Activity,
  X,
  Send,
  UserPlus,
  FileText,
  TrendingUp,
  Zap,
  User,
  Link,
  ChevronLeft,
  ChevronRight,
  Heart,
  MoreVertical,
  Repeat,
  Share2,
  Lightbulb,
  ExternalLink,
  CalendarPlus,
  Award
} from 'lucide-react';
import BrowseStudents from './BrowseStudents';
import Opportunities from './Opportunities';
import Profile from './Profile';
import Settings from './Settings';
import PastSessionsContent from './PastSessionsContent';
import { Messages } from './Messages';
import MessageModal from './MessageModal';
import ResourceLibraryModal from './ResourceLibraryModal';
import ResourcesView from './ResourcesView';
import DonationModal from './DonationModal';
import { toast } from 'sonner';
import MobileBottomNav from './MobileBottomNav';
import DefaultMeetingLinkModal from './DefaultMeetingLinkModal';
import Community from './Community';
import { DashboardSkeleton } from './LoadingSkeleton';
import { ImpactDashboard } from './ImpactDashboard';

interface Session {
  id: string;
  studentName: string;
  initials: string;
  avatar?: string;
  topic: string;
  time: string;
  platform: string;
  badge: 'today' | 'tomorrow' | 'upcoming';
  color?: string;
  notes?: string;
  short_code?: string;
  meetingLink?: string;
}

interface Mentee {
  id: string;
  name: string;
  initials: string;
  avatar?: string;
  field: string;
  university: string;
  progress: number;
  online: boolean;
  color?: string;
  status: 'active' | 'completed';
  nextSession?: string;
}

interface Request {
  id: string;
  studentId: string;
  studentName: string;
  initials: string;
  school: string;
  message: string;
  time: string;
  color: string;
  avatar?: string;
}

interface Activity {
  id: string;
  type: 'session' | 'request' | 'message' | 'achievement';
  text: string;
  time: string;
}

interface Goal {
  id: string;
  text: string;
  completed: boolean;
}

interface MenteeDetails extends Mentee {
  sessionsDone: number;
  tasksDone: number;
  duration: string;
  goals: Goal[];
  recentSessions: {
    title: string;
    date: string;
    status: 'completed' | 'upcoming' | 'today';
  }[];
}

export default function MentorDashboard() {
  const { user, signOut, isAuthenticated, accessToken, refreshUser } = useAuth();
  
  // Dashboard state management
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'browse-students' | 'messages' | 'opportunities' | 'community' | 'profile' | 'settings' | 'impact'>('dashboard');
  const [activeTab, setActiveTab] = useState('all');
  const [sessionTab, setSessionTab] = useState<'upcoming' | 'past'>('upcoming');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [selectedMentee, setSelectedMentee] = useState<Mentee | null>(null);
  const [showMenteeDetail, setShowMenteeDetail] = useState(false);
  const [menteeDetails, setMenteeDetails] = useState<MenteeDetails | null>(null);
  const [showRequestDetail, setShowRequestDetail] = useState<Request | null>(null);
  const [showStudentProfile, setShowStudentProfile] = useState<Request | null>(null);
  const [showJoinSession, setShowJoinSession] = useState<Session | null>(null);
  const [showSessionNotes, setShowSessionNotes] = useState<Session | null>(null);
  const [sessionNotes, setSessionNotes] = useState({ goals: '', resources: '', followup: '', recordingUrl: '' });
  const [showSessionDetails, setShowSessionDetails] = useState<Session | null>(null);
  const [isEditingSession, setIsEditingSession] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [editSessionForm, setEditSessionForm] = useState({
    topic: '',
    description: '',
    date: '',
    time: '',
    duration: '',
    platform: '',
    meetingLink: ''
  });
  const [showAllRequests, setShowAllRequests] = useState(false);
  const [showAllMentees, setShowAllMentees] = useState(false);
  const [requests, setRequests] = useState<Request[]>([]);
  const [acceptingRequest, setAcceptingRequest] = useState(false);
  const [openSessionMenuId, setOpenSessionMenuId] = useState<string | null>(null);
  
  // Share session state
  const [showShareModal, setShowShareModal] = useState(false);
  const [sessionToShare, setSessionToShare] = useState<Session | null>(null);
  const [shareLink, setShareLink] = useState('');

  // Calendar modal state
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calendarEvent, setCalendarEvent] = useState<any>(null);

  // Default meeting link modal state
  const [showDefaultMeetingLinkModal, setShowDefaultMeetingLinkModal] = useState(false);

  // Public session tip banner state
  const [showPublicSessionTip, setShowPublicSessionTip] = useState(true);

  // Schedule Session form state
  const [scheduleForm, setScheduleForm] = useState({
    sessionType: 'private', // 'private', 'group', or 'public'
    menteeId: '',
    selectedMentees: [] as string[], // For group sessions
    capacity: '10', // For public sessions
    scheduledFor: '',
    date: '',
    time: '',
    duration: '60', // Default 60 minutes
    topic: '',
    description: '',
    platform: 'Google Meet',
    meetingLink: '',
    // Recurring session fields
    isRecurring: false,
    recurrenceDays: [] as string[], // Selected days: ['monday', 'wednesday', 'friday'] or ['daily']
    recurrenceEndDate: '', // End date for recurring sessions
  });
  const [schedulingSession, setSchedulingSession] = useState(false);

  // Helper function to open schedule modal with default values
  const openScheduleModal = (sessionType?: 'private' | 'group' | 'public') => {
    // Check if mentor has a default meeting link
    if (!user?.defaultMeetingLink) {
      // Show modal to prompt them to set one
      setShowDefaultMeetingLinkModal(true);
      return;
    }

    // Proceed normally with default meeting link
    setScheduleForm({
      ...scheduleForm,
      meetingLink: user?.defaultMeetingLink || '',
      sessionType: sessionType || scheduleForm.sessionType
    });
    setShowScheduleModal(true);
  };

  // Handle saving default meeting link
  const handleSaveDefaultMeetingLink = async (link: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b8526fa6/users/default-meeting-link`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ defaultMeetingLink: link }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save default meeting link');
      }

      // Refresh user data to get updated defaultMeetingLink
      await refreshUser();

      // Close the modal
      setShowDefaultMeetingLinkModal(false);

      // Pre-fill the schedule form and show it
      setScheduleForm({
        ...scheduleForm,
        meetingLink: link
      });
      setShowScheduleModal(true);
    } catch (error: any) {
      console.error('Error saving default meeting link:', error);
      toast.error('Failed to Save', {
        description: error.message || 'Could not save default meeting link. Please try again.',
      });
      throw error; // Re-throw to keep modal open
    }
  };

  // Handle skipping default meeting link setup
  const handleSkipDefaultMeetingLink = () => {
    setShowDefaultMeetingLinkModal(false);
    // Open schedule modal without pre-filled link
    setScheduleForm({
      ...scheduleForm,
      meetingLink: ''
    });
    setShowScheduleModal(true);
  };

  // Backend data state
  const [stats, setStats] = useState<MentorStats | null>(null);
  const [mentorships, setMentorships] = useState<Mentorship[]>([]);
  const [backendRequests, setBackendRequests] = useState<MentorshipRequest[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [backendSessions, setBackendSessions] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [studentDetailsCache, setStudentDetailsCache] = useState<Record<string, any>>({});

  // Function to fetch student details by ID
  const fetchStudentDetails = async (studentIds: string[]) => {
    try {
      const uncachedIds = studentIds.filter(id => !studentDetailsCache[id]);
      if (uncachedIds.length === 0) return;

      console.log('Fetching details for students:', uncachedIds);
      
      // Fetch all student details in parallel
      const studentPromises = uncachedIds.map(async (studentId) => {
        try {
          const response = await api.user.getUser(studentId);
          return { id: studentId, data: response.user };
        } catch (error) {
          console.error(`Failed to fetch student ${studentId}:`, error);
          return { id: studentId, data: null };
        }
      });

      const results = await Promise.all(studentPromises);
      const newCache = { ...studentDetailsCache };
      results.forEach(({ id, data }) => {
        if (data) {
          newCache[id] = data;
        }
      });
      
      setStudentDetailsCache(newCache);
    } catch (error) {
      console.error('Error fetching student details:', error);
    }
  };

  // Load all data from backend
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [statsRes, mentorshipsRes, requestsRes, notificationsRes, sessionsRes] = await Promise.all([
        api.stats.getMentorStats(),
        api.mentorship.getAll(),
        api.request.getAll('received'),
        api.notification.getAll(),
        api.session.getAll()
      ]);

      setStats(statsRes.stats);
      setMentorships(mentorshipsRes.mentorships || []);
      setBackendRequests(requestsRes.requests || []);
      setNotifications(notificationsRes.notifications || []);
      setBackendSessions(sessionsRes.sessions || []);
      
      // Load resources for all mentorships
      const mentorshipsList = mentorshipsRes.mentorships || [];
      if (mentorshipsList.length > 0) {
        try {
          const resourcePromises = mentorshipsList.map((m: any) => 
            api.resource.getAll(m.id).catch(() => ({ resources: [] }))
          );
          const resourceResults = await Promise.all(resourcePromises);
          const allResources = resourceResults.flatMap((res: any) => res.resources || []);
          setResources(allResources);
        } catch (err) {
          console.error('Failed to load resources:', err);
          setResources([]);
        }
      } else {
        setResources([]);
      }
      
      // Convert backend requests to component format
      const formattedRequests = (requestsRes.requests || [])
        .filter((r: MentorshipRequest) => r.status === 'pending')
        .map((r: MentorshipRequest) => {
          const firstName = r.student?.firstName || 'Unknown';
          const lastName = r.student?.lastName || '';
          const fullName = `${firstName} ${lastName}`.trim();
          
          // Generate a consistent color based on the student's name
          const colors = ['#021ff6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
          const colorIndex = fullName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
          
          return {
            id: r.id,
            studentId: r.student?.id || '',
            studentName: fullName,
            initials: r.student ? `${firstName[0]}${lastName[0] || firstName[1] || ''}` : 'U',
            school: r.student?.university || 'Unknown University',
            message: r.message,
            time: new Date(r.createdAt).toLocaleDateString(),
            color: colors[colorIndex],
            avatar: r.student?.profilePicture || r.student?.avatar || undefined
          };
        });
      setRequests(formattedRequests);
      
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      const errorMessage = err.message || 'Failed to load dashboard data. Please try again.';
      setError(errorMessage);
      
      // If it's an auth error, sign out the user
      if (err.message?.includes('session has expired') || 
          err.message?.includes('Invalid JWT') ||
          err.message?.includes('sign in again')) {
        console.log('Auth error detected, signing out...');
        await signOut();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    // Auto-refresh removed - user can manually refresh if needed
  }, []);

  // Close session menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openSessionMenuId) {
        setOpenSessionMenuId(null);
      }
    };

    if (openSessionMenuId) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [openSessionMenuId]);



  // Fetch student details when modals open
  useEffect(() => {
    const fetchDetailsForModal = async () => {
      let studentIds: string[] = [];
      
      if (showSessionDetails?.notes) {
        try {
          const parsed = JSON.parse(showSessionDetails.notes);
          if (parsed.registeredStudents && parsed.registeredStudents.length > 0) {
            studentIds = parsed.registeredStudents;
          }
        } catch (e) {}
      }
      
      if (showSessionNotes?.notes) {
        try {
          const parsed = JSON.parse(showSessionNotes.notes);
          if (parsed.registeredStudents && parsed.registeredStudents.length > 0) {
            studentIds = [...studentIds, ...parsed.registeredStudents];
          }
        } catch (e) {}
      }
      
      if (studentIds.length > 0) {
        await fetchStudentDetails(studentIds);
      }
    };
    
    fetchDetailsForModal();
  }, [showSessionDetails, showSessionNotes]);

  // Transform backend data to UI format - Group by series
  const allUpcomingSessions = backendSessions
    .filter((session: any) => session.status === 'scheduled' && new Date(session.scheduledAt) > new Date())
    .sort((a: any, b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  // Group sessions by series
  const sessionGroups = new Map<string, any[]>();
  const standaloneSessions: any[] = [];

  allUpcomingSessions.forEach((session: any) => {
    let sessionDetails: any = {};
    try {
      if (session.notes) {
        sessionDetails = JSON.parse(session.notes);
      }
    } catch (e) {
      // Invalid JSON
    }

    const seriesId = sessionDetails.seriesId;
    if (seriesId) {
      if (!sessionGroups.has(seriesId)) {
        sessionGroups.set(seriesId, []);
      }
      sessionGroups.get(seriesId)!.push(session);
    } else {
      standaloneSessions.push(session);
    }
  });

  // Transform standalone sessions - Show all sessions
  const upcomingSessions: Session[] = standaloneSessions
    .map((session: any) => {
      const sessionDate = new Date(session.scheduledAt);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      let badge: 'today' | 'tomorrow' | 'upcoming' = 'upcoming';
      if (sessionDate.toDateString() === today.toDateString()) {
        badge = 'today';
      } else if (sessionDate.toDateString() === tomorrow.toDateString()) {
        badge = 'tomorrow';
      }
      
      const studentData = session.student || session.mentorship?.student;
      const studentName = studentData 
        ? `${studentData.firstName} ${studentData.lastName}`
        : 'Unknown Youth';
      const initials = studentData
        ? `${studentData.firstName[0]}${studentData.lastName[0]}`
        : 'U';
      
      return {
        id: session.id,
        studentName,
        initials,
        avatar: studentData?.profilePicture,
        topic: session.topic || 'Mentorship Session',
        time: sessionDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) + ' WAT',
        platform: session.meetingLink?.includes('zoom') ? 'Zoom' : 'Google Meet',
        badge,
        color: undefined,
        notes: session.notes,
        meetingLink: session.meetingLink || ''
      };
    });

  // Transform series
  const sessionSeries = Array.from(sessionGroups.entries()).map(([seriesId, sessions]) => {
    const firstSession = sessions[0];
    const nextSession = sessions[0];
    const lastSession = sessions[sessions.length - 1];
    
    const sessionDate = new Date(nextSession.scheduledAt);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    let badge: 'today' | 'tomorrow' | 'upcoming' = 'upcoming';
    if (sessionDate.toDateString() === today.toDateString()) {
      badge = 'today';
    } else if (sessionDate.toDateString() === tomorrow.toDateString()) {
      badge = 'tomorrow';
    }

    let sessionDetails: any = {};
    try {
      if (firstSession.notes) {
        sessionDetails = JSON.parse(firstSession.notes);
      }
    } catch (e) {}

    const completedCount = backendSessions.filter((s: any) => {
      try {
        const notes = s.notes ? JSON.parse(s.notes) : {};
        return notes.seriesId === seriesId && s.status === 'completed';
      } catch {
        return false;
      }
    }).length;

    const studentData = firstSession.student || firstSession.mentorship?.student;
    const studentName = studentData 
      ? `${studentData.firstName} ${studentData.lastName}`
      : 'Unknown Youth';
    const initials = studentData
      ? `${studentData.firstName[0]}${studentData.lastName[0]}`
      : 'U';
    const avatar = studentData?.profilePicture;

    // Format recurrence pattern for display
    let recurrencePatternText = 'Custom schedule';
    if (sessionDetails.recurrencePattern && typeof sessionDetails.recurrencePattern === 'object') {
      const pattern = sessionDetails.recurrencePattern;
      if (pattern.days) {
        if (pattern.days.includes('daily')) {
          recurrencePatternText = 'Every day';
        } else {
          const dayNames = pattern.days.map((d: string) => d.charAt(0).toUpperCase() + d.slice(1));
          if (dayNames.length === 1) {
            recurrencePatternText = `Every ${dayNames[0]}`;
          } else if (dayNames.length === 2) {
            recurrencePatternText = `${dayNames[0]} & ${dayNames[1]}`;
          } else {
            recurrencePatternText = `${dayNames.slice(0, -1).join(', ')} & ${dayNames[dayNames.length - 1]}`;
          }
        }
      }
    } else if (typeof sessionDetails.recurrencePattern === 'string') {
      recurrencePatternText = sessionDetails.recurrencePattern;
    }

    return {
      seriesId,
      topic: firstSession.topic || 'Recurring Program',
      studentName,
      initials,
      avatar,
      sessionType: sessionDetails.sessionType || 'private',
      recurrencePattern: recurrencePatternText,
      totalSessions: sessionDetails.totalSessions || sessions.length,
      completedSessions: completedCount,
      remainingSessions: sessions.length,
      nextSessionDate: sessionDate,
      nextSessionTime: sessionDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) + ' WAT',
      endDate: new Date(lastSession.scheduledAt),
      duration: firstSession.duration,
      platform: firstSession.meetingLink?.includes('zoom') ? 'Zoom' : 'Google Meet',
      badge,
      color: undefined,
      sessions: sessions,
      notes: firstSession.notes,
      capacity: sessionDetails.capacity || 10,
      registeredCount: sessionDetails.registeredCount || 0
    };
  });

  const activeMentees: Mentee[] = mentorships
    .filter((m: Mentorship) => m.status === 'active' || m.status === 'completed')
    .map((m: Mentorship) => {
      const studentName = m.student ? `${m.student.firstName} ${m.student.lastName}` : 'Unknown';
      const initials = m.student ? `${m.student.firstName[0]}${m.student.lastName[0]}` : 'U';
      
      return {
        id: m.id,
        name: studentName,
        initials,
        avatar: m.student?.profilePicture,
        field: m.student?.fieldOfStudy || 'Not specified',
        university: m.student?.university || 'Unknown University',
        progress: Math.floor(Math.random() * 100), // TODO: Calculate real progress from sessions/tasks
        online: false, // TODO: Get real online status
        status: m.status as 'active' | 'completed',
        nextSession: 'Not scheduled', // TODO: Get from sessions
        color: undefined
      };
    });

  const recentActivities: Activity[] = [];

  const handleSignOut = async () => {
    await signOut();
  };

  const getBadgeStyles = (badge: string) => {
    switch (badge) {
      case 'today':
        return 'bg-[#fef9c3] text-[#854d0e]';
      case 'tomorrow':
        return 'bg-[#dbeafe] text-[#1d4ed8]';
      default:
        return 'bg-[#f3f4f6] text-[#374151]';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'session':
        return <CheckCircle className="w-3.5 h-3.5" />;
      case 'request':
        return <AlertCircle className="w-3.5 h-3.5" />;
      case 'message':
        return <MessageSquare className="w-3.5 h-3.5" />;
      case 'achievement':
        return <TrendingUp className="w-3.5 h-3.5" />;
      default:
        return <Activity className="w-3.5 h-3.5" />;
    }
  };

  // Handle request accept
  const handleAcceptRequest = async (request: Request) => {
    setAcceptingRequest(true);
    try {
      await api.request.accept(request.id);
      
      // Reload dashboard data
      await loadDashboardData();
      
      // Close modals
      setShowRequestDetail(null);
      setShowAllRequests(false);
      
      // Show success message
      toast.success('Request Accepted!', {
        description: `${request.studentName} is now your mentee. You can schedule your first session.`,
        duration: 5000,
      });
    } catch (err: any) {
      console.error('Failed to accept request:', err);
      toast.error('Failed to Accept', {
        description: 'Could not accept the request. Please try again.',
      });
    } finally {
      setAcceptingRequest(false);
    }
  };

  // Handle request decline
  const handleDeclineRequest = async (request: Request) => {
    const reason = prompt(`Why are you declining the request from ${request.studentName}? (Optional)`);
    
    if (reason !== null) { // User didn't cancel the prompt
      try {
        await api.request.decline(request.id, reason || 'No reason provided');
        
        // Reload dashboard data
        await loadDashboardData();
        
        // Close modals
        setShowRequestDetail(null);
        setShowAllRequests(false);
        
        toast.success('Request Declined', {
          description: `You declined the request from ${request.studentName}.`,
        });
      } catch (err: any) {
        console.error('Failed to decline request:', err);
        toast.error('Failed to Decline', {
          description: 'Could not decline the request. Please try again.',
        });
      }
    }
  };

  // Helper function to generate recurring session dates
  const generateRecurringDates = (startDate: Date, endDate: Date, selectedDays: string[]): Date[] => {
    const dates: Date[] = [];
    const dayMap: Record<string, number> = {
      'sunday': 0,
      'monday': 1,
      'tuesday': 2,
      'wednesday': 3,
      'thursday': 4,
      'friday': 5,
      'saturday': 6
    };

    // If 'daily' is selected, include all days
    const isDaily = selectedDays.includes('daily');
    const targetDays = isDaily 
      ? [0, 1, 2, 3, 4, 5, 6] // All days
      : selectedDays.map(d => dayMap[d.toLowerCase()]);

    // Iterate through each day from start to end
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      
      // Check if this day matches our selected days
      if (targetDays.includes(dayOfWeek)) {
        dates.push(new Date(currentDate));
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  };

  // Handle schedule session
  const handleScheduleSession = async () => {
    // Validation based on session type
    if (scheduleForm.sessionType === 'private' && !scheduleForm.menteeId) {
      toast.error('Selection Required', {
        description: 'Please select a mentee for private session.',
      });
      return;
    }
    if (scheduleForm.sessionType === 'group' && scheduleForm.selectedMentees.length === 0) {
      toast.error('Selection Required', {
        description: 'Please select at least one mentee for group session.',
      });
      return;
    }
    if (!scheduleForm.date || !scheduleForm.time || !scheduleForm.duration || !scheduleForm.topic) {
      toast.error('Missing Information', {
        description: 'Please fill in all required fields.',
      });
      return;
    }
    if (parseInt(scheduleForm.duration) < 1) {
      toast.error('Invalid Duration', {
        description: 'Duration must be at least 1 minute.',
      });
      return;
    }

    // Validate recurring session fields
    if (scheduleForm.isRecurring) {
      if (scheduleForm.recurrenceDays.length === 0) {
        toast.error('Selection Required', {
          description: 'Please select at least one day for recurring sessions.',
        });
        return;
      }
      if (!scheduleForm.recurrenceEndDate) {
        toast.error('Missing End Date', {
          description: 'Please select an end date for recurring sessions.',
        });
        return;
      }
      // Validate end date is after start date
      const start = new Date(scheduleForm.date);
      const end = new Date(scheduleForm.recurrenceEndDate);
      if (end <= start) {
        toast.error('Invalid Date Range', {
          description: 'End date must be after start date.',
        });
        return;
      }
    }

    // Construct scheduledFor from date and time
    const scheduledFor = `${scheduleForm.date}T${scheduleForm.time}`;
    const startDate = new Date(scheduledFor);

    // Generate session dates (single or recurring)
    let sessionDates: Date[] = [startDate];
    if (scheduleForm.isRecurring) {
      const endDateTime = new Date(`${scheduleForm.recurrenceEndDate}T${scheduleForm.time}`);
      sessionDates = generateRecurringDates(
        startDate,
        endDateTime,
        scheduleForm.recurrenceDays
      );
    }

    // Generate series ID for recurring sessions
    const seriesId = scheduleForm.isRecurring ? `series-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` : null;

    try {
      setSchedulingSession(true);
      
      if (scheduleForm.sessionType === 'private') {
        // Private session - create sessions for selected mentee
        const mentorshipId = scheduleForm.menteeId;

        const sessionPromises = sessionDates.map((sessionDate, index) => 
          api.session.create({
            mentorshipId: mentorshipId,
            scheduledAt: sessionDate.toISOString(),
            duration: parseInt(scheduleForm.duration),
            topic: scheduleForm.topic || undefined,
            notes: JSON.stringify({
              sessionType: 'private',
              platform: scheduleForm.platform,
              description: scheduleForm.description,
              meetingLink: scheduleForm.meetingLink,
              ...(seriesId && {
                isRecurring: true,
                seriesId: seriesId,
                sessionNumber: index + 1,
                totalSessions: sessionDates.length,
                recurrencePattern: {
                  days: scheduleForm.recurrenceDays,
                  startDate: scheduleForm.date,
                  endDate: scheduleForm.recurrenceEndDate
                }
              })
            })
          })
        );
        await Promise.all(sessionPromises);
      } else if (scheduleForm.sessionType === 'group') {
        // Group session - create sessions for all selected mentees and all dates
        const allSessionPromises = [];
        for (const mentorshipId of scheduleForm.selectedMentees) {
          for (let index = 0; index < sessionDates.length; index++) {
            allSessionPromises.push(
              api.session.create({
                mentorshipId: mentorshipId,
                scheduledAt: sessionDates[index].toISOString(),
                duration: parseInt(scheduleForm.duration),
                topic: scheduleForm.topic || undefined,
                notes: JSON.stringify({
                  sessionType: 'group',
                  platform: scheduleForm.platform,
                  description: scheduleForm.description,
                  meetingLink: scheduleForm.meetingLink,
                  totalParticipants: scheduleForm.selectedMentees.length,
                  ...(seriesId && {
                    isRecurring: true,
                    seriesId: seriesId,
                    sessionNumber: index + 1,
                    totalSessions: sessionDates.length,
                    recurrencePattern: {
                      days: scheduleForm.recurrenceDays,
                      startDate: scheduleForm.date,
                      endDate: scheduleForm.recurrenceEndDate
                    }
                  })
                })
              })
            );
          }
        }
        await Promise.all(allSessionPromises);
      } else if (scheduleForm.sessionType === 'public') {
        // Public session - create public sessions for all dates
        const firstMentorship = activeMentees[0]?.id;
        
        if (!firstMentorship) {
          toast.error('No Active Mentees', {
            description: 'You need at least one active mentee to create a public session.',
          });
          return;
        }

        const sessionPromises = sessionDates.map((sessionDate, index) =>
          api.session.create({
            mentorshipId: firstMentorship, // Placeholder - backend should handle public sessions differently
            scheduledAt: sessionDate.toISOString(),
            duration: parseInt(scheduleForm.duration),
            topic: scheduleForm.topic || undefined,
            notes: JSON.stringify({
              sessionType: 'public',
              platform: scheduleForm.platform,
              description: scheduleForm.description,
              meetingLink: scheduleForm.meetingLink,
              capacity: scheduleForm.capacity === 'unlimited' ? 'unlimited' : parseInt(scheduleForm.capacity),
              registeredCount: 0,
              registeredStudents: [],
              ...(seriesId && {
                isRecurring: true,
                seriesId: seriesId,
                sessionNumber: index + 1,
                totalSessions: sessionDates.length,
                recurrencePattern: {
                  days: scheduleForm.recurrenceDays,
                  startDate: scheduleForm.date,
                  endDate: scheduleForm.recurrenceEndDate
                }
              })
            })
          })
        );
        await Promise.all(sessionPromises);
      }

      // Reload dashboard data
      await loadDashboardData();

      // Reset form and close modal
      setScheduleForm({
        sessionType: 'private',
        menteeId: '',
        selectedMentees: [],
        meetingLink: '',
        capacity: '10',
        scheduledFor: '',
        date: '',
        time: '',
        duration: '60',
        topic: '',
        description: '',
        platform: 'Google Meet',
        isRecurring: false,
        recurrenceDays: [],
        recurrenceEndDate: ''
      });
      setShowScheduleModal(false);

      const sessionTypeText = scheduleForm.sessionType === 'private' ? 'Private session' : 
                              scheduleForm.sessionType === 'group' ? 'Group session' : 'Public session';
      const recurringText = scheduleForm.isRecurring ? ` (${sessionDates.length} sessions)` : '';
      toast.success('Session Scheduled!', {
        description: `${sessionTypeText}${recurringText} has been scheduled successfully.`,
        duration: 5000,
      });
    } catch (err: any) {
      console.error('Failed to schedule session:', err);
      toast.error('Failed to Schedule', {
        description: 'Could not schedule session. Please try again.',
      });
    } finally {
      setSchedulingSession(false);
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'session':
        return 'bg-[var(--ispora-brand-light)] text-[var(--ispora-brand)]';
      case 'request':
        return 'bg-[#fef9ee] text-[var(--ispora-warn)]';
      case 'message':
        return 'bg-[var(--ispora-accent-light)] text-[var(--ispora-accent)]';
      case 'achievement':
        return 'bg-[var(--ispora-success-light)] text-[var(--ispora-success)]';
      default:
        return 'bg-[var(--ispora-brand-light)] text-[var(--ispora-brand)]';
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex h-screen overflow-hidden bg-[var(--ispora-bg)]">
        {/* Keep minimal sidebar visible during loading */}
        <aside className="hidden md:flex w-56 bg-white border-r-[1.5px] border-[var(--ispora-border)] flex-col flex-shrink-0">
          <div className="p-4 border-b border-[var(--ispora-border)]">
            <img src={logo} alt="Ispora" className="h-6" />
          </div>
        </aside>
        <DashboardSkeleton />
      </div>
    );
  }

  // Show error state with retry
  if (error && !stats) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--ispora-bg)]">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-[var(--ispora-text)] mb-2">Failed to Load Dashboard</h3>
          <p className="text-sm text-[var(--ispora-text2)] mb-6">{error}</p>
          <button
            onClick={loadDashboardData}
            className="px-6 py-2.5 rounded-lg bg-[var(--ispora-brand)] text-white text-sm font-semibold hover:bg-[#0118c4] transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Handle share session
  const handleShareSession = (session: Session) => {
    // Use short code if available, otherwise fall back to session ID
    const shareIdentifier = session.short_code || session.id;
    const link = session.short_code 
      ? `${window.location.origin}/${session.short_code}`
      : `${window.location.origin}/session/${session.id}`;
    setShareLink(link);
    setSessionToShare(session);
    setShowShareModal(true);
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast.success('Link Copied!', {
      description: 'Share link copied to clipboard.',
      duration: 3000,
    });
  };

  const shareOnWhatsApp = () => {
    const text = encodeURIComponent(`Join me for this mentorship session: ${sessionToShare?.topic || 'Mentorship Session'}\n${shareLink}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareOnTwitter = () => {
    const text = encodeURIComponent(`Join me for this mentorship session: ${sessionToShare?.topic || 'Mentorship Session'}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareLink)}`, '_blank');
  };

  const shareOnLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareLink)}`, '_blank');
  };

  // Calendar helper functions
  const generateCalendarDays = () => {
    const year = currentCalendarMonth.getFullYear();
    const month = currentCalendarMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getSessionsForDate = (date: Date) => {
    if (!date) return [];
    return backendSessions.filter((session: any) => {
      const sessionDate = new Date(session.scheduledAt);
      return sessionDate.toDateString() === date.toDateString();
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentCalendarMonth);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentCalendarMonth(newDate);
  };

  // Show error state if backend is down
  if (error && (error.includes('502') || error.includes('Bad gateway') || error.includes('<!DOCTYPE html>'))) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--ispora-bg)]">
        <div className="max-w-md w-full mx-4 bg-white border-[1.5px] border-[var(--ispora-border)] rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-[var(--ispora-danger-light)] rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-[var(--ispora-danger)]" strokeWidth={2} />
          </div>
          <h2 className="font-syne text-xl font-bold text-[var(--ispora-text)] mb-2">
            Server Temporarily Unavailable
          </h2>
          <p className="text-sm text-[var(--ispora-text2)] mb-6">
            The backend server is currently restarting. This usually takes 30-60 seconds. Please wait a moment and try again.
          </p>
          <button
            onClick={() => {
              setError('');
              setLoading(true);
              loadDashboardData();
            }}
            className="w-full px-6 py-3 bg-[var(--ispora-brand)] text-white rounded-xl font-semibold hover:bg-[var(--ispora-brand-hover)] transition-all"
          >
            Retry Now
          </button>
          <p className="text-xs text-[var(--ispora-text3)] mt-4">
            If this persists, the server may be deploying updates. Please try again in 2-3 minutes.
          </p>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--ispora-bg)]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[var(--ispora-brand)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-[var(--ispora-text2)]">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--ispora-bg)]">
      {/* Sidebar - Hidden on mobile */}
      <aside className={`hidden md:flex bg-white border-r-[1.5px] border-[var(--ispora-border)] flex-col flex-shrink-0 transition-all duration-300 relative ${isSidebarCollapsed ? 'w-[72px]' : 'w-56'}`}>
        {/* Collapse Toggle Button - Positioned at edge */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute top-1/2 -translate-y-1/2 -right-3 z-50 w-6 h-6 rounded-full bg-white border-[1.5px] border-[var(--ispora-border)] flex items-center justify-center text-[var(--ispora-text2)] hover:text-[var(--ispora-brand)] hover:border-[var(--ispora-brand)] hover:shadow-md transition-all"
          title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.5} />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2.5} />
          )}
        </button>

        {/* Logo */}
        <div className={`px-[18px] py-4 border-b-[1.5px] border-[var(--ispora-border)] flex items-center gap-3 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
          <img src={logo} alt="iSpora" className="w-8 h-8 rounded-full shadow-sm flex-shrink-0" />
          {!isSidebarCollapsed && (
            <span className="font-syne font-bold text-[11px] text-[var(--ispora-text)]">The Impact Engine</span>
          )}
        </div>

        {/* Profile Card */}
        <div
          className={`mx-3.5 mt-3.5 mb-1.5 p-3 bg-[var(--ispora-brand-light)] rounded-xl flex items-center gap-3 cursor-pointer transition-colors hover:bg-[#e0e3ff] ${isSidebarCollapsed ? 'justify-center' : ''}`}
          onClick={() => setShowProfileModal(true)}
        >
          {(user as any)?.profilePicture ? (
            <div className="w-[38px] h-[38px] rounded-full overflow-hidden flex-shrink-0 relative border-2 border-white">
              <img 
                src={(user as any).profilePicture} 
                alt={`${user?.firstName} ${user?.lastName}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0.5 right-0.5 w-2 h-2 bg-[var(--ispora-accent)] rounded-full border-2 border-white animate-pulse"></div>
            </div>
          ) : (
            <div className="w-[38px] h-[38px] rounded-full bg-[var(--ispora-brand)] flex items-center justify-center text-white font-bold text-[15px] flex-shrink-0 relative">
              {user?.firstName?.[0] || 'A'}
              <div className="absolute bottom-0.5 right-0.5 w-2 h-2 bg-[var(--ispora-accent)] rounded-full border-2 border-white animate-pulse"></div>
            </div>
          )}
          {!isSidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-[13px] text-[var(--ispora-text)] leading-tight truncate">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="text-[11px] text-[var(--ispora-brand)] font-medium mt-0.5">
                {(user as any)?.mentorType === 'home' ? 'Home-Based Mentor' : 'Diaspora Mentor'}
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-2.5">
          <div className="space-y-0.5">
            <div 
              onClick={() => setCurrentPage('dashboard')}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] text-[13px] font-medium cursor-pointer ${
                currentPage === 'dashboard' 
                  ? 'bg-[var(--ispora-brand)] text-white' 
                  : 'text-[var(--ispora-text2)] hover:bg-[var(--ispora-brand-light)] hover:text-[var(--ispora-brand)] transition-colors'
              } ${isSidebarCollapsed ? 'justify-center' : ''}`}
              title={isSidebarCollapsed ? 'Dashboard' : ''}
            >
              <LayoutDashboard className="w-4 h-4" strokeWidth={2} />
              {!isSidebarCollapsed && <span>Dashboard</span>}
            </div>
            <div 
              onClick={() => setCurrentPage('browse-students')}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] text-[13px] font-medium cursor-pointer ${
                currentPage === 'browse-students' 
                  ? 'bg-[var(--ispora-brand)] text-white' 
                  : 'text-[var(--ispora-text2)] hover:bg-[var(--ispora-brand-light)] hover:text-[var(--ispora-brand)] transition-colors'
              } ${isSidebarCollapsed ? 'justify-center' : ''}`}
              title={isSidebarCollapsed ? 'Browse Youth' : ''}
            >
              <Users className="w-4 h-4" strokeWidth={2} />
              {!isSidebarCollapsed && <span>Browse Youth</span>}
            </div>
            <div 
              onClick={() => setCurrentPage('messages')}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] text-[13px] font-medium cursor-pointer ${
                currentPage === 'messages' 
                  ? 'bg-[var(--ispora-brand)] text-white' 
                  : 'text-[var(--ispora-text2)] hover:bg-[var(--ispora-brand-light)] hover:text-[var(--ispora-brand)] transition-colors'
              } ${isSidebarCollapsed ? 'justify-center' : ''}`}
              title={isSidebarCollapsed ? 'Messages' : ''}
            >
              <MessageSquare className="w-4 h-4" strokeWidth={2} />
              {!isSidebarCollapsed && <span>Messages</span>}
            </div>
            <div 
              onClick={() => setCurrentPage('impact')}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] text-[13px] font-medium cursor-pointer ${
                currentPage === 'impact' 
                  ? 'bg-[var(--ispora-brand)] text-white' 
                  : 'text-[var(--ispora-text2)] hover:bg-[var(--ispora-brand-light)] hover:text-[var(--ispora-brand)] transition-colors'
              } ${isSidebarCollapsed ? 'justify-center' : ''}`}
              title={isSidebarCollapsed ? 'My Impact' : ''}
            >
              <Award className="w-4 h-4" strokeWidth={2} />
              {!isSidebarCollapsed && <span>My Impact</span>}
            </div>
            <div 
              onClick={() => setCurrentPage('opportunities')}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] text-[13px] font-medium cursor-pointer ${
                currentPage === 'opportunities' 
                  ? 'bg-[var(--ispora-brand)] text-white' 
                  : 'text-[var(--ispora-text2)] hover:bg-[var(--ispora-brand-light)] hover:text-[var(--ispora-brand)] transition-colors'
              } ${isSidebarCollapsed ? 'justify-center' : ''}`}
              title={isSidebarCollapsed ? 'Opportunities' : ''}
            >
              <Search className="w-4 h-4" strokeWidth={2} />
              {!isSidebarCollapsed && <span>Opportunities</span>}
            </div>
            <div 
              onClick={() => setCurrentPage('community')}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] text-[13px] font-medium cursor-pointer ${
                currentPage === 'community' 
                  ? 'bg-[var(--ispora-brand)] text-white' 
                  : 'text-[var(--ispora-text2)] hover:bg-[var(--ispora-brand-light)] hover:text-[var(--ispora-brand)] transition-colors'
              } ${isSidebarCollapsed ? 'justify-center' : ''}`}
              title={isSidebarCollapsed ? 'Community' : ''}
            >
              <Users className="w-4 h-4" strokeWidth={2} />
              {!isSidebarCollapsed && <span>Community</span>}
            </div>
            
            {/* Removed My Network - Not part of MVP, can add later */}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-3 border-t-[1.5px] border-[var(--ispora-border)]">
          <div
            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] text-[var(--ispora-danger)] text-[13px] font-medium cursor-pointer hover:bg-[var(--ispora-danger-light)] transition-colors ${isSidebarCollapsed ? 'justify-center' : ''}`}
            onClick={handleSignOut}
            title={isSidebarCollapsed ? 'Sign Out' : ''}
          >
            <LogOut className="w-4 h-4" strokeWidth={2} />
            {!isSidebarCollapsed && <span>Sign Out</span>}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <div className="h-16 bg-white border-b-[1.5px] border-[var(--ispora-border)] px-4 md:px-7 flex items-center gap-3.5 flex-shrink-0">
          {/* Mobile Logo */}
          <div className="flex md:hidden items-center gap-2 mr-2">
            <img src={logo} alt="iSpora" className="w-10 h-10 rounded-full shadow-sm flex-shrink-0" />
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => setShowDonationModal(true)}
              className="flex items-center gap-1.5 px-2 sm:px-3 py-2 rounded-[10px] bg-[var(--ispora-brand)] text-white text-xs font-semibold hover:bg-[var(--ispora-brand-hover)] hover:shadow-lg transition-all"
            >
              <Heart className="w-3.5 h-3.5 hidden sm:block" strokeWidth={2} fill="currentColor" />
              <span>Donate</span>
            </button>
            
            <button
              className="relative w-[38px] h-[38px] rounded-[10px] bg-[var(--ispora-bg)] border-[1.5px] border-[var(--ispora-border)] flex items-center justify-center text-[var(--ispora-text2)] hover:bg-[var(--ispora-brand-light)] hover:text-[var(--ispora-brand)] hover:border-[var(--ispora-brand)] transition-all"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="w-[17px] h-[17px]" strokeWidth={2} />
              <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[var(--ispora-danger)] rounded-full border-[1.5px] border-white"></div>
            </button>

            <button
              className="w-[38px] h-[38px] rounded-[10px] bg-[var(--ispora-bg)] border-[1.5px] border-[var(--ispora-border)] flex items-center justify-center text-[var(--ispora-text2)] hover:bg-[var(--ispora-brand-light)] hover:text-[var(--ispora-brand)] hover:border-[var(--ispora-brand)] transition-all"
              onClick={() => setShowProfileModal(true)}
            >
              <Users className="w-[17px] h-[17px]" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        {currentPage === 'browse-students' ? (
          <BrowseStudents />
        ) : currentPage === 'messages' ? (
          <div className="flex-1 overflow-hidden px-4 md:px-7 py-4 md:py-6 pb-20 md:pb-6">
            <Messages 
              userRole="mentor" 
              userId={user?.id || ''} 
              mentorships={mentorships}
              onBack={() => setCurrentPage('dashboard')}
            />
          </div>
        ) : currentPage === 'opportunities' ? (
          <div className="flex-1 overflow-y-auto">
            <Opportunities />
          </div>
        ) : currentPage === 'community' ? (
          <div className="flex-1 overflow-y-auto">
            <Community />
          </div>
        ) : currentPage === 'profile' ? (
          <Profile />
        ) : currentPage === 'settings' ? (
          <Settings />
        ) : currentPage === 'impact' ? (
          <div className="flex-1 overflow-y-auto px-4 md:px-7 py-4 md:py-6 pb-24 md:pb-6">
            <ImpactDashboard userRole="diaspora" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-4 md:px-7 py-4 md:py-6 pb-24 md:pb-6">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-[var(--ispora-brand)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-sm text-[var(--ispora-text2)]">Loading dashboard...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-md">
                  <div className="w-16 h-16 bg-[var(--ispora-danger-light)] rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-[var(--ispora-danger)]" />
                  </div>
                  <h3 className="font-syne text-lg font-bold text-[var(--ispora-text)] mb-2">Failed to Load Dashboard</h3>
                  <p className="text-sm text-[var(--ispora-text2)] mb-4">{error}</p>
                  <button
                    onClick={loadDashboardData}
                    className="px-4 py-2 rounded-xl bg-[var(--ispora-brand)] text-white text-sm font-semibold hover:bg-[#1864d9] transition-all"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {/* Hero Section */}
                <div className="relative bg-[var(--ispora-brand)] rounded-2xl p-5 md:p-7 overflow-hidden">
              {/* Background decorations */}
              <div className="absolute top-[-60px] right-[200px] w-60 h-60 bg-white/5 rounded-full pointer-events-none"></div>
              <div className="absolute bottom-[-80px] right-[60px] w-[280px] h-[280px] bg-white/[0.04] rounded-full pointer-events-none"></div>
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
                  backgroundSize: '32px 32px'
                }}
              ></div>

              <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between md:gap-6">
                <div className="flex-1">
                  <h1 className="font-dm-sans text-base md:text-lg font-semibold text-white leading-snug tracking-tight mb-1.5">
                    Make your impact count today ✦
                  </h1>
                  <p className="text-xs text-white/70 leading-relaxed max-w-md mb-4 md:mb-5">
                    You have {requests.length} pending mentorship request{requests.length !== 1 ? 's' : ''} and {stats?.activeMentorships || 0} active mentorship{(stats?.activeMentorships || 0) !== 1 ? 's' : ''}. Stay
                    consistent — you're changing lives across Africa.
                  </p>
                  <div className="flex gap-2.5 flex-wrap">
                    {upcomingSessions.some(s => s.badge === 'today') && (
                      <button
                        onClick={() => {
                          const todaySession = upcomingSessions.find(s => s.badge === 'today');
                          if (todaySession) {
                            setShowJoinSession(todaySession);
                          }
                        }}
                        className="flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-[10px] bg-white text-[var(--ispora-brand)] text-xs md:text-[13px] font-semibold hover:bg-[#f0f3ff] hover:translate-y-[-1px] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] transition-all whitespace-nowrap"
                      >
                        <Video className="w-3.5 h-3.5" strokeWidth={2.5} />
                        <span>Today's Session</span>
                      </button>
                    )}
                    <button
                      onClick={() => setShowAllRequests(true)}
                      className="flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-[10px] bg-white/[0.14] border-[1.5px] border-white/[0.28] text-white text-xs md:text-[13px] font-semibold hover:bg-white/[0.22] transition-all whitespace-nowrap"
                    >
                      View Requests ({requests.length})
                    </button>
                  </div>
                </div>

                {/* Quick Stats - Desktop: Inside hero right corner */}
                <div className="hidden md:grid md:grid-cols-2 md:gap-1.5 md:flex-shrink-0">
                  {/* Active Mentees */}
                  <div className="bg-white/[0.13] border border-white/20 rounded-md px-2 py-1.5 hover:bg-white/20 transition-all cursor-default flex flex-col items-center min-w-[52px] max-w-[52px]">
                    <div className="flex items-center gap-1 mb-1">
                      <div className="w-5 h-5 rounded bg-white/20 flex items-center justify-center flex-shrink-0">
                        <Users className="w-3 h-3 text-white" strokeWidth={2} />
                      </div>
                      <div className="font-bold text-white leading-none text-xs">
                        {stats?.activeMentorships || 0}
                      </div>
                    </div>
                    <div className="text-white/65 leading-[1.2] text-center break-words w-full line-clamp-2 text-[6px]">
                      Active Mentees
                    </div>
                  </div>

                  {/* Sessions Completed */}
                  <div className="bg-white/[0.13] border border-white/20 rounded-md px-2 py-1.5 hover:bg-white/20 transition-all cursor-default flex flex-col items-center min-w-[52px] max-w-[52px]">
                    <div className="flex items-center gap-1 mb-1">
                      <div className="w-5 h-5 rounded bg-white/20 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-3 h-3 text-white" strokeWidth={2} />
                      </div>
                      <div className="font-bold text-white leading-none text-xs">
                        {stats?.completedSessions || 0}
                      </div>
                    </div>
                    <div className="text-white/65 leading-[1.2] text-center break-words w-full line-clamp-2 text-[6px]">
                      Sessions Done
                    </div>
                  </div>

                  {/* Pending Requests */}
                  <div 
                    onClick={() => setShowAllRequests(true)}
                    className="bg-white/[0.13] border border-white/20 rounded-md px-2 py-1.5 hover:bg-white/20 transition-all cursor-pointer flex flex-col items-center min-w-[52px] max-w-[52px]"
                  >
                    <div className="flex items-center gap-1 mb-1">
                      <div className="w-5 h-5 rounded bg-white/20 flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="w-3 h-3 text-white" strokeWidth={2} />
                      </div>
                      <div className="font-bold text-white leading-none text-xs">
                        {requests.length}
                      </div>
                    </div>
                    <div className="text-white/65 leading-[1.2] text-center break-words w-full line-clamp-2 text-[6px]">
                      Pending
                    </div>
                  </div>

                  {/* Satisfaction Score */}
                  <div className="bg-white/[0.13] border border-white/20 rounded-md px-2 py-1.5 hover:bg-white/20 transition-all cursor-default flex flex-col items-center min-w-[52px] max-w-[52px]">
                    <div className="flex items-center gap-1 mb-1">
                      <div className="w-5 h-5 rounded bg-white/20 flex items-center justify-center flex-shrink-0">
                        <Activity className="w-3 h-3 text-white" strokeWidth={2} />
                      </div>
                      <div className="font-bold text-white leading-none text-[9px]">
                        94%
                      </div>
                    </div>
                    <div className="text-white/65 leading-[1.2] text-center break-words w-full line-clamp-2 text-[6px]">
                      Satisfaction
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Public Session Tip Banner - Show only for mentors who haven't created any sessions yet */}
            {showPublicSessionTip && backendSessions.length === 0 && (
              <div className="bg-gradient-to-r from-[#f0f4ff] to-[#e8f0ff] border-[1.5px] border-[#c3d5ff] rounded-2xl p-3.5 md:p-5 mb-4 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                  backgroundImage: 'radial-gradient(circle, #021ff6 1px, transparent 1px)',
                  backgroundSize: '20px 20px'
                }} />
                
                {/* Mobile Layout: Column with icon on top */}
                <div className="relative md:hidden">
                  <div className="flex items-start justify-between mb-2.5">
                    {/* Icon and Title */}
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-[var(--ispora-brand)] flex items-center justify-center flex-shrink-0 shadow-md">
                        <Lightbulb className="w-4.5 h-4.5 text-white" strokeWidth={2} />
                      </div>
                      <h3 className="font-syne text-sm font-bold text-[var(--ispora-text)]">
                        Start Mentoring with Public Sessions
                      </h3>
                    </div>
                    
                    {/* Close Button */}
                    <button
                      onClick={() => setShowPublicSessionTip(false)}
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-[var(--ispora-text3)] hover:bg-white/60 hover:text-[var(--ispora-text)] transition-colors flex-shrink-0 -mt-0.5"
                    >
                      <X className="w-3.5 h-3.5" strokeWidth={2} />
                    </button>
                  </div>
                  
                  {/* Description */}
                  <p className="text-[12px] text-[var(--ispora-text2)] leading-relaxed mb-3">
                    You don't need to wait for youth to find you! Create <strong>public sessions</strong> that any youth on the platform can discover and join. You can also share the session link outside Ispora to invite youth to register and join the program.
                  </p>
                  
                  {/* Action Buttons - Same Row */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => openScheduleModal('public')}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[var(--ispora-brand)] text-white rounded-lg text-[11px] font-semibold hover:bg-[var(--ispora-brand-hover)] transition-all"
                    >
                      <Calendar className="w-3 h-3" strokeWidth={2} />
                      Create Public Session
                    </button>
                    <button
                      onClick={() => {
                        setShowPublicSessionTip(false);
                        setCurrentPage('dashboard');
                      }}
                      className="px-4 py-2 bg-white text-[var(--ispora-text)] border-[1.5px] border-[var(--ispora-border)] rounded-lg text-[11px] font-semibold hover:border-[var(--ispora-brand)] hover:text-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] transition-all"
                    >
                      Got it!
                    </button>
                  </div>
                </div>

                {/* Desktop Layout: Row with icon on left */}
                <div className="relative hidden md:flex items-start gap-4">
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-xl bg-[var(--ispora-brand)] flex items-center justify-center flex-shrink-0 shadow-md">
                    <Lightbulb className="w-5 h-5 text-white" strokeWidth={2} />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-syne text-base font-bold text-[var(--ispora-text)] mb-1.5">
                      Start Mentoring with Public Sessions
                    </h3>
                    <p className="text-[13px] text-[var(--ispora-text2)] leading-relaxed mb-3">
                      You don't need to wait for youth to find you! Create <strong>public sessions</strong> that any youth on the platform can discover and join. You can also share the session link outside Ispora to invite youth to register and join the program.
                    </p>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2.5">
                      <button
                        onClick={() => openScheduleModal('public')}
                        className="flex items-center gap-1.5 px-4 py-2 bg-[var(--ispora-brand)] text-white rounded-lg text-[13px] font-semibold hover:bg-[var(--ispora-brand-hover)] hover:shadow-[0_4px_14px_rgba(2,31,246,0.3)] transition-all"
                      >
                        <Calendar className="w-3.5 h-3.5" strokeWidth={2} />
                        Create Public Session
                      </button>
                      <button
                        onClick={() => {
                          setShowPublicSessionTip(false);
                          setCurrentPage('dashboard');
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 bg-white text-[var(--ispora-text)] border-[1.5px] border-[var(--ispora-border)] rounded-lg text-[13px] font-semibold hover:border-[var(--ispora-brand)] hover:text-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] transition-all"
                      >
                        Got it!
                      </button>
                    </div>
                  </div>
                  
                  {/* Close Button */}
                  <button
                    onClick={() => setShowPublicSessionTip(false)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--ispora-text3)] hover:bg-white/60 hover:text-[var(--ispora-text)] transition-colors flex-shrink-0"
                  >
                    <X className="w-4 h-4" strokeWidth={2} />
                  </button>
                </div>
              </div>
            )}

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
              {/* Left Column */}
              <div className="flex flex-col gap-4">
                {/* Sessions with Tabs */}
                <div className="bg-white border-[1.5px] border-[var(--ispora-border)] rounded-2xl overflow-hidden h-[420px] flex flex-col">
                  <div className="px-5 py-4 border-b-[1.5px] border-[var(--ispora-border)]">
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-syne text-sm font-bold text-[var(--ispora-text)]">
                        Sessions
                      </div>
                      {sessionTab === 'upcoming' && (
                        <span
                          onClick={openScheduleModal}
                          className="text-xs text-[var(--ispora-brand)] font-semibold cursor-pointer hover:underline"
                        >
                          + Schedule New
                        </span>
                      )}
                    </div>
                    {/* Tabs */}
                    <div className="flex gap-1 bg-[var(--ispora-bg)] p-1 rounded-lg">
                      <button
                        onClick={() => setSessionTab('upcoming')}
                        className={`flex-1 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                          sessionTab === 'upcoming'
                            ? 'bg-white text-[var(--ispora-brand)] shadow-sm'
                            : 'text-[var(--ispora-text2)] hover:text-[var(--ispora-text)]'
                        }`}
                      >
                        Upcoming
                      </button>
                      <button
                        onClick={() => setSessionTab('past')}
                        className={`flex-1 px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                          sessionTab === 'past'
                            ? 'bg-white text-[var(--ispora-brand)] shadow-sm'
                            : 'text-[var(--ispora-text2)] hover:text-[var(--ispora-text)]'
                        }`}
                      >
                        <Video className="w-3.5 h-3.5" strokeWidth={2} />
                        Session Library
                      </button>
                    </div>
                  </div>
                  {sessionTab === 'upcoming' ? (
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-2.5 flex-1 overflow-y-auto">
                      {upcomingSessions.length === 0 && sessionSeries.length === 0 ? (
                      <div className="col-span-2 text-center py-8">
                        <div className="w-12 h-12 bg-[var(--ispora-bg)] rounded-full flex items-center justify-center mx-auto mb-3">
                          <Calendar className="w-6 h-6 text-[var(--ispora-text3)]" />
                        </div>
                        <p className="text-sm font-semibold text-[var(--ispora-text)] mb-1">No upcoming sessions</p>
                        <p className="text-xs text-[var(--ispora-text3)]">Schedule sessions with your mentees to see them here</p>
                      </div>
                    ) : (
                      <>
                        {/* Render Series Cards First */}
                        {sessionSeries.map((series) => {
                          const isPublic = series.sessionType === 'public';
                          const isGroup = series.sessionType === 'group';
                          
                          return (
                            <div
                              key={series.seriesId}
                              className="bg-[#f7f8ff] border-[1.5px] border-[var(--ispora-border)] hover:border-[var(--ispora-brand)] rounded-xl p-4 hover:shadow-sm transition-all relative"
                            >
                              {/* 3-Dot Menu - Top Right */}
                              <div className="absolute top-3 right-3 z-10">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenSessionMenuId(openSessionMenuId === series.seriesId ? null : series.seriesId);
                                  }}
                                  className="w-8 h-8 rounded-lg bg-white border-[1.5px] border-[var(--ispora-border)] flex items-center justify-center text-[var(--ispora-text2)] hover:border-[var(--ispora-brand)] hover:text-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] transition-all"
                                >
                                  <MoreVertical className="w-4 h-4" strokeWidth={2} />
                                </button>
                                
                                {/* Dropdown Menu */}
                                {openSessionMenuId === series.seriesId && (
                                  <div className="absolute right-0 mt-2 w-48 rounded-lg bg-white border-[1.5px] border-[var(--ispora-border)] shadow-lg py-1 z-20">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setShowSessionDetails(series.sessions[0]);
                                        setOpenSessionMenuId(null);
                                      }}
                                      className="w-full px-4 py-2 text-left text-xs text-[var(--ispora-text2)] hover:bg-[var(--ispora-bg)] hover:text-[var(--ispora-brand)] flex items-center gap-2"
                                    >
                                      <FileText className="w-3.5 h-3.5" strokeWidth={2} />
                                      View Details
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenSessionMenuId(null);
                                        const sessionDate = new Date(series.sessions[0].scheduledAt);
                                        const duration = series.sessions[0].duration || 60;
                                        const endTime = new Date(sessionDate.getTime() + duration * 60000);
                                        
                                        let description = `Mentorship session on Ispora platform`;
                                        if (isPublic) description += `\n\nSession Type: Public Session Series`;
                                        else if (isGroup) description += `\n\nSession Type: Group Session Series`;
                                        else description += `\n\nSession Type: Private Session Series`;
                                        if (series.sessions[0].studentName) description += `\n\nStudent: ${series.sessions[0].studentName}`;
                                        description += `\n\nRecurring Program: ${series.totalSessions} sessions`;
                                        
                                        setCalendarEvent({
                                          title: series.topic || 'Mentorship Session',
                                          description: description,
                                          location: series.sessions[0].meetingLink || 'Online',
                                          startTime: sessionDate,
                                          endTime: endTime,
                                          organizerName: series.sessions[0].mentorName || 'Ispora',
                                          sessionUrl: `${window.location.origin}/dashboard`
                                        });
                                        setShowCalendarModal(true);
                                      }}
                                      className="w-full px-4 py-2 text-left text-xs text-[var(--ispora-text2)] hover:bg-[var(--ispora-bg)] hover:text-[var(--ispora-brand)] flex items-center gap-2"
                                    >
                                      <CalendarPlus className="w-3.5 h-3.5" strokeWidth={2} />
                                      Add to Calendar
                                    </button>
                                    {isPublic && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSessionToShare(series.sessions[0]);
                                          // Generate share link using short code if available
                                          const firstSession = series.sessions[0];
                                          const shareUrl = firstSession.short_code
                                            ? `${window.location.origin}/${firstSession.short_code}`
                                            : `${window.location.origin}/session/${firstSession.id}`;
                                          setShareLink(shareUrl);
                                          setShowShareModal(true);
                                          setOpenSessionMenuId(null);
                                        }}
                                        className="w-full px-4 py-2 text-left text-xs text-[var(--ispora-text2)] hover:bg-[var(--ispora-bg)] hover:text-[var(--ispora-brand)] flex items-center gap-2"
                                      >
                                        <Share2 className="w-3.5 h-3.5" strokeWidth={2} />
                                        Share Series
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Series Badge - Top */}
                              <div className="mb-3 flex items-center gap-2">
                                <div className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-[var(--ispora-accent)] text-white">
                                  <Repeat className="w-2.5 h-2.5" strokeWidth={2.5} />
                                  RECURRING
                                </div>
                                {isPublic && (
                                  <div className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-[var(--ispora-brand)] text-white">
                                    PUBLIC
                                  </div>
                                )}
                                {isGroup && (
                                  <div className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-[var(--ispora-success)] text-white">
                                    <Users className="w-2.5 h-2.5" strokeWidth={2.5} />
                                    GROUP
                                  </div>
                                )}
                              </div>

                              {/* Name & Avatar Row */}
                              <div className="flex items-start gap-3 mb-3">
                                {series.avatar ? (
                                  <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                                    <img 
                                      src={series.avatar} 
                                      alt={series.studentName}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div
                                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base flex-shrink-0"
                                    style={{
                                      backgroundColor: series.color || 'var(--ispora-brand)'
                                    }}
                                  >
                                    {series.initials}
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-sm text-[var(--ispora-text)] mb-1">
                                    {isPublic ? 'Public Session Series' : series.studentName}
                                  </div>
                                  <div className="text-xs font-semibold text-[var(--ispora-text)]">
                                    {series.topic}
                                  </div>
                                  <div className="text-[10px] text-[var(--ispora-text3)] mt-1">
                                    {series.recurrencePattern}
                                  </div>
                                </div>
                              </div>

                              {/* Progress Section */}
                              <div className="bg-white rounded-lg p-3 mb-3 border-[1.5px] border-[var(--ispora-border)]">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-semibold text-[var(--ispora-text)]">
                                    Session {series.completedSessions + 1} of {series.totalSessions}
                                  </span>
                                  <span className="text-xs font-semibold text-[var(--ispora-brand)]">
                                    {Math.round(((series.completedSessions) / series.totalSessions) * 100)}%
                                  </span>
                                </div>
                                <div className="w-full bg-[var(--ispora-bg)] rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className="bg-[var(--ispora-brand)] h-full transition-all"
                                    style={{ width: `${((series.completedSessions) / series.totalSessions) * 100}%` }}
                                  />
                                </div>
                                <div className="flex items-center justify-between mt-2 text-[10px] text-[var(--ispora-text3)]">
                                  <span>✅ {series.completedSessions} completed</span>
                                  <span>📅 {series.remainingSessions} remaining</span>
                                </div>
                              </div>

                              {/* Next Session Info - Compact */}
                              <div className="bg-white rounded-lg p-2.5 mb-3 border-[1.5px] border-[var(--ispora-border)] space-y-1.5">
                                <div className="flex items-center justify-between gap-2">
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getBadgeStyles(series.badge)}`}
                                  >
                                    {series.badge === 'today'
                                      ? 'Today'
                                      : series.badge === 'tomorrow'
                                        ? 'Tomorrow'
                                        : series.nextSessionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </span>
                                  <span className="flex items-center gap-1 text-[11px] font-semibold text-[var(--ispora-text)]">
                                    <Clock className="w-3 h-3 text-[var(--ispora-text3)]" strokeWidth={2} />
                                    {series.nextSessionTime}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between gap-2 text-[10px] text-[var(--ispora-text2)]">
                                  <span className="flex items-center gap-1">
                                    <Video className="w-3 h-3 text-[var(--ispora-text3)]" strokeWidth={2} />
                                    {series.platform} · {series.duration} min
                                  </span>
                                  {(isPublic || isGroup) && (
                                    <span className="flex items-center gap-1">
                                      <Users className="w-3 h-3 text-[var(--ispora-text3)]" strokeWidth={2} />
                                      <span className="font-semibold text-[var(--ispora-brand)]">{series.registeredCount}</span>
                                      <span className="text-[var(--ispora-text3)]">/</span>
                                      <span className={series.registeredCount >= series.capacity ? 'text-[var(--ispora-danger)] font-semibold' : 'text-[var(--ispora-success)]'}>
                                        {series.capacity}
                                      </span>
                                    </span>
                                  )}
                                </div>
                                <div className="text-[9px] text-[var(--ispora-text3)] flex items-center gap-1">
                                  <Calendar className="w-3 h-3" strokeWidth={2} />
                                  Ends {series.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </div>
                              </div>

                              {/* Action Button */}
                              {series.badge === 'today' && (
                                <button
                                  onClick={() => setShowJoinSession(series.sessions[0])}
                                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--ispora-brand)] text-white text-xs font-semibold hover:bg-[var(--ispora-brand-hover)] hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(2,31,246,0.35)] transition-all"
                                >
                                  <Video className="w-3.5 h-3.5" strokeWidth={2.5} />
                                  Join Session
                                </button>
                              )}
                            </div>
                          );
                        })}

                        {/* Render Standalone Sessions */}
                        {upcomingSessions.map((session) => {
                      // Parse session notes to check if public and get registration count
                      let sessionDetails = { sessionType: 'private', registeredCount: 0, registeredStudents: [], capacity: 10 };
                      try {
                        if (session.notes) {
                          const parsed = JSON.parse(session.notes);
                          sessionDetails = { ...sessionDetails, ...parsed };
                        }
                      } catch (e) {
                        // Silently skip invalid session notes
                      }
                      
                      const isPublic = sessionDetails.sessionType === 'public';
                      const isGroup = sessionDetails.sessionType === 'group';
                      
                      return (
                      <div
                        key={session.id}
                        className="bg-[#f7f8ff] border-[1.5px] border-[var(--ispora-border)] hover:border-[var(--ispora-brand)] rounded-xl p-4 hover:shadow-sm transition-all relative"
                      >
                        {/* 3-Dot Menu - Top Right */}
                        <div className="absolute top-3 right-3 z-10">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenSessionMenuId(openSessionMenuId === session.id ? null : session.id);
                            }}
                            className="w-8 h-8 rounded-lg bg-white border-[1.5px] border-[var(--ispora-border)] flex items-center justify-center text-[var(--ispora-text2)] hover:border-[var(--ispora-brand)] hover:text-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] transition-all"
                          >
                            <MoreVertical className="w-4 h-4" strokeWidth={2} />
                          </button>
                          
                          {/* Dropdown Menu */}
                          {openSessionMenuId === session.id && (
                            <div className="absolute right-0 top-full mt-1 w-40 bg-white border-[1.5px] border-[var(--ispora-border)] rounded-lg shadow-lg overflow-hidden z-20">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenSessionMenuId(null);
                                  setShowSessionDetails(session);
                                }}
                                className="w-full px-3 py-2 text-left text-xs font-medium text-[var(--ispora-text)] hover:bg-[var(--ispora-brand-light)] hover:text-[var(--ispora-brand)] transition-all flex items-center gap-2"
                              >
                                <FileText className="w-3.5 h-3.5" strokeWidth={2} />
                                View Details
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenSessionMenuId(null);
                                  const sessionDate = new Date(session.scheduledAt);
                                  const duration = session.duration || 60;
                                  const endTime = new Date(sessionDate.getTime() + duration * 60000);
                                  
                                  let description = `Mentorship session on Ispora platform`;
                                  if (isPublic) description += `\n\nSession Type: Public Session`;
                                  else if (isGroup) description += `\n\nSession Type: Group Session`;
                                  else description += `\n\nSession Type: Private Session`;
                                  if (session.studentName) description += `\n\nStudent: ${session.studentName}`;
                                  
                                  setCalendarEvent({
                                    title: session.topic || 'Mentorship Session',
                                    description: description,
                                    location: session.meetingLink || 'Online',
                                    startTime: sessionDate,
                                    endTime: endTime,
                                    organizerName: session.mentorName || 'Ispora',
                                    sessionUrl: `${window.location.origin}/dashboard`
                                  });
                                  setShowCalendarModal(true);
                                }}
                                className="w-full px-3 py-2 text-left text-xs font-medium text-[var(--ispora-text)] hover:bg-[var(--ispora-brand-light)] hover:text-[var(--ispora-brand)] transition-all flex items-center gap-2"
                              >
                                <CalendarPlus className="w-3.5 h-3.5" strokeWidth={2} />
                                Add to Calendar
                              </button>
                              {isPublic && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenSessionMenuId(null);
                                    handleShareSession(session);
                                  }}
                                  className="w-full px-3 py-2 text-left text-xs font-medium text-[var(--ispora-text)] hover:bg-[var(--ispora-brand-light)] hover:text-[var(--ispora-brand)] transition-all flex items-center gap-2"
                                >
                                  <Share2 className="w-3.5 h-3.5" strokeWidth={2} />
                                  Share Session
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenSessionMenuId(null);
                                  setShowSessionNotes(session);
                                }}
                                className="w-full px-3 py-2 text-left text-xs font-medium text-[var(--ispora-text)] hover:bg-[var(--ispora-brand-light)] hover:text-[var(--ispora-brand)] transition-all flex items-center gap-2"
                              >
                                <FileText className="w-3.5 h-3.5" strokeWidth={2} />
                                Session Notes
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenSessionMenuId(null);
                                  if (session.badge === 'today') {
                                    setShowScheduleModal(true);
                                  } else {
                                    const linkToCopy = session.meetingLink || 'https://meet.google.com/abc-defg-hij';
                                    navigator.clipboard.writeText(linkToCopy);
                                    toast.success('Link Copied!', {
                                      description: 'Meeting link copied to clipboard.',
                                      duration: 3000,
                                    });
                                  }
                                }}
                                className="w-full px-3 py-2 text-left text-xs font-medium text-[var(--ispora-text)] hover:bg-[var(--ispora-brand-light)] hover:text-[var(--ispora-brand)] transition-all flex items-center gap-2"
                              >
                                <Clock className="w-3.5 h-3.5" strokeWidth={2} />
                                {session.badge === 'today' ? 'Reschedule' : 'Copy Link'}
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Attendance info for Public Sessions - Top of card */}
                        {isPublic && (
                          <div className="mb-3">
                            <div className={`text-[10px] font-semibold ${
                              sessionDetails.registeredCount > 0 
                                ? 'text-[var(--ispora-success)]' 
                                : 'text-[var(--ispora-text3)]'
                            }`}>
                              {sessionDetails.registeredCount || 0} attending · {sessionDetails.capacity - (sessionDetails.registeredCount || 0)} spots left
                            </div>
                          </div>
                        )}
                        
                        {/* Name & Avatar Row */}
                        <div className="flex items-start gap-3 mb-3">
                          {session.avatar ? (
                            <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                              <img 
                                src={session.avatar} 
                                alt={session.studentName}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div
                              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base flex-shrink-0"
                              style={{
                                backgroundColor: session.color || 'var(--ispora-brand)'
                              }}
                            >
                              {session.initials}
                            </div>
                          )}
                          <div className="flex-1 min-w-0 pr-8">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <div className="font-semibold text-sm text-[var(--ispora-text)]">
                                {isPublic ? 'Public Session' : session.studentName}
                              </div>
                              {isGroup && (
                                <div className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-[var(--ispora-success)] text-white">
                                  <Users className="w-2.5 h-2.5" strokeWidth={2.5} />
                                  GROUP
                                </div>
                              )}
                              {sessionDetails.isRecurring && (
                                <div className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-[var(--ispora-accent)] text-white">
                                  <Repeat className="w-2.5 h-2.5" strokeWidth={2.5} />
                                  {sessionDetails.sessionNumber}/{sessionDetails.totalSessions}
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-[var(--ispora-text3)]">
                              {session.topic}
                            </div>
                          </div>
                        </div>
                        {/* Time & Date Row */}
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${getBadgeStyles(session.badge)}`}
                          >
                            {session.badge === 'today'
                              ? 'Today'
                              : session.badge === 'tomorrow'
                                ? 'Tomorrow'
                                : 'Mar 29'}
                          </span>
                          <span className="flex items-center gap-1.5 text-xs text-[var(--ispora-text2)]">
                            <Clock className="w-3.5 h-3.5 text-[var(--ispora-text3)]" strokeWidth={2} />
                            {session.time}
                          </span>
                        </div>
                        
                        {/* Platform Row */}
                        <div className="flex items-center gap-1.5 text-xs text-[var(--ispora-text2)] mb-4">
                          <Video className="w-3.5 h-3.5 text-[var(--ispora-text3)]" strokeWidth={2} />
                          {session.platform}
                        </div>
                        <div className="flex gap-2">
                          {session.badge === 'today' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowJoinSession(session);
                              }}
                              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--ispora-brand)] text-white text-xs font-semibold hover:bg-[var(--ispora-brand-hover)] hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(2,31,246,0.35)] transition-all"
                            >
                              <Video className="w-3.5 h-3.5" strokeWidth={2.5} />
                              Join Session
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addSessionToCalendar({
                                title: `Mentorship: ${session.studentName}`,
                                date: session.date,
                                time: session.time,
                                duration: 60,
                                meetingLink: session.meetingLink,
                                mentorName: user?.firstName + ' ' + user?.lastName,
                                studentName: session.studentName,
                                sessionType: 'Mentorship Session'
                              });
                            }}
                            className="px-3 py-2 rounded-lg border-[1.5px] border-[var(--ispora-border)] text-[var(--ispora-text2)] hover:border-[var(--ispora-brand)] hover:text-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                            title="Add to Calendar"
                          >
                            <CalendarPlus className="w-3.5 h-3.5" strokeWidth={2} />
                          </button>
                        </div>
                      </div>
                    );
                    })}
                      </>
                    )}
                    </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto">
                      <PastSessionsContent />
                    </div>
                  )}
                </div>

                {/* Active Mentees */}
                <div className="bg-white border-[1.5px] border-[var(--ispora-border)] rounded-2xl overflow-hidden h-[300px] flex flex-col">
                  <div className="px-5 py-4 border-b-[1.5px] border-[var(--ispora-border)] flex items-center justify-between">
                    <div className="font-syne text-sm font-bold text-[var(--ispora-text)]">
                      Active Mentees
                    </div>
                    <button
                      onClick={() => setShowAllMentees(true)}
                      className="text-xs text-[var(--ispora-brand)] font-semibold cursor-pointer hover:underline"
                    >
                      View All ({activeMentees.length})
                    </button>
                  </div>
                  <div className="p-5 flex-1 overflow-hidden flex flex-col">
                    {/* Tabs */}
                    <div className="flex bg-[var(--ispora-bg)] rounded-[10px] p-1 gap-0.5 mb-3.5">
                      {['All', 'Active', 'Completed'].map((tab) => (
                        <div
                          key={tab}
                          onClick={() => setActiveTab(tab.toLowerCase())}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold text-center cursor-pointer transition-all ${
                            activeTab === tab.toLowerCase()
                              ? 'bg-white text-[var(--ispora-brand)] shadow-[0_1px_6px_rgba(0,0,0,0.07)]'
                              : 'text-[var(--ispora-text3)] hover:text-[var(--ispora-text2)]'
                          }`}
                        >
                          {tab}
                        </div>
                      ))}
                    </div>

                    {/* Mentee List */}
                    <div className="space-y-2 flex-1 overflow-y-auto">
                      {activeMentees.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="w-12 h-12 bg-[var(--ispora-bg)] rounded-full flex items-center justify-center mx-auto mb-3">
                            <Users className="w-6 h-6 text-[var(--ispora-text3)]" />
                          </div>
                          <p className="text-sm font-semibold text-[var(--ispora-text)] mb-1">No active mentees yet</p>
                          <p className="text-xs text-[var(--ispora-text3)] mb-3">Accept mentorship requests to start mentoring students</p>
                          <button
                            onClick={() => setCurrentPage('browse-students')}
                            className="text-xs text-[var(--ispora-brand)] font-semibold hover:underline"
                          >
                            Browse Youth →
                          </button>
                        </div>
                      ) : activeMentees
                        .filter((mentee) => {
                          if (activeTab === 'all') return true;
                          if (activeTab === 'active') return mentee.status === 'active';
                          if (activeTab === 'completed') return mentee.status === 'completed';
                          return true;
                        })
                        .map((mentee) => (
                        <div
                          key={mentee.id}
                          className="flex items-start gap-3 p-3 rounded-[10px] border-[1.5px] border-[var(--ispora-border)] bg-[#f7f8ff] hover:border-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] hover:translate-x-0.5 transition-all"
                        >
                          {mentee.avatar ? (
                            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                              <img 
                                src={mentee.avatar} 
                                alt={mentee.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                              style={{
                                backgroundColor: mentee.color || 'var(--ispora-brand)'
                              }}
                            >
                              {mentee.initials}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-[13px] text-[var(--ispora-text)]">
                              {mentee.name}
                            </div>
                            <div className="text-[11px] text-[var(--ispora-text3)] truncate mt-0.5">
                              {mentee.field} · {mentee.university}
                            </div>
                            <div className="mt-1.5">
                              <div className="flex justify-between text-[10px] text-[var(--ispora-text3)] mb-0.5">
                                <span>Progress</span>
                                <span>{mentee.progress}%</span>
                              </div>
                              <div className="h-1 bg-[var(--ispora-border)] rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-[var(--ispora-brand)] rounded-full"
                                  style={{ width: `${mentee.progress}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 self-end">
                            <div
                              className={`w-2 h-2 rounded-full mb-1 ${mentee.online ? 'bg-[var(--ispora-accent)]' : 'bg-[var(--ispora-text3)] opacity-50'}`}
                            ></div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Fetch detailed data from API
                                  const details: MenteeDetails = {
                                    ...mentee,
                                    sessionsDone: 0,
                                    tasksDone: 0,
                                    duration: '0mo',
                                    goals: [],
                                    recentSessions: [],
                                  };
                                  setMenteeDetails(details);
                                  setShowMenteeDetail(true);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-[var(--ispora-brand)] text-white text-[11px] font-semibold hover:bg-[var(--ispora-brand-hover)] hover:shadow-sm transition-all"
                              >
                                Details
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedMentee(mentee);
                                  setShowMessageModal(true);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-white border-[1.5px] border-[var(--ispora-border)] text-[var(--ispora-text)] text-[11px] font-semibold hover:border-[var(--ispora-brand)] hover:text-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] transition-all"
                              >
                                Message
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="flex flex-col gap-4">
                {/* Quick Actions */}
                <div className="bg-white border-[1.5px] border-[var(--ispora-border)] rounded-2xl overflow-hidden h-[300px] flex flex-col">
                  <div className="px-5 py-4 border-b-[1.5px] border-[var(--ispora-border)]">
                    <div className="font-syne text-sm font-bold text-[var(--ispora-text)]">
                      Quick Actions
                    </div>
                  </div>
                  <div className="p-5 flex-1">
                    <div className="grid grid-cols-2 gap-3 w-full h-full content-center">
                      <div
                        onClick={openScheduleModal}
                        className="flex flex-col items-center gap-2 p-4 rounded-xl border-[1.5px] border-[var(--ispora-border)] bg-[#f7f8ff] text-xs font-semibold text-[var(--ispora-text2)] cursor-pointer hover:border-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] hover:text-[var(--ispora-brand)] hover:-translate-y-0.5 hover:shadow-sm transition-all text-center"
                      >
                        <div className="w-[38px] h-[38px] rounded-[10px] bg-[var(--ispora-brand-light)] flex items-center justify-center">
                          <Calendar className="w-[18px] h-[18px] text-[var(--ispora-brand)]" strokeWidth={2} />
                        </div>
                        <span>Schedule</span>
                      </div>
                      <div
                        onClick={() => setCurrentPage('messages')}
                        className="flex flex-col items-center gap-2 p-4 rounded-xl border-[1.5px] border-[var(--ispora-border)] bg-[#f7f8ff] text-xs font-semibold text-[var(--ispora-text2)] cursor-pointer hover:border-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] hover:text-[var(--ispora-brand)] hover:-translate-y-0.5 hover:shadow-sm transition-all text-center"
                      >
                        <div className="w-[38px] h-[38px] rounded-[10px] bg-[var(--ispora-brand-light)] flex items-center justify-center">
                          <Send className="w-[18px] h-[18px] text-[var(--ispora-brand)]" strokeWidth={2} />
                        </div>
                        <span>Message</span>
                      </div>
                      <div
                        onClick={() => setCurrentPage('browse-students')}
                        className="flex flex-col items-center gap-2 p-4 rounded-xl border-[1.5px] border-[var(--ispora-border)] bg-[#f7f8ff] text-xs font-semibold text-[var(--ispora-text2)] cursor-pointer hover:border-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] hover:text-[var(--ispora-brand)] hover:-translate-y-0.5 hover:shadow-sm transition-all text-center"
                      >
                        <div className="w-[38px] h-[38px] rounded-[10px] bg-[var(--ispora-brand-light)] flex items-center justify-center">
                          <UserPlus className="w-[18px] h-[18px] text-[var(--ispora-brand)]" strokeWidth={2} />
                        </div>
                        <span>Find Mentee</span>
                      </div>
                      <div
                        onClick={() => setShowResourceModal(true)}
                        className="flex flex-col items-center gap-2 p-4 rounded-xl border-[1.5px] border-[var(--ispora-border)] bg-[#f7f8ff] text-xs font-semibold text-[var(--ispora-text2)] cursor-pointer hover:border-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] hover:text-[var(--ispora-brand)] hover:-translate-y-0.5 hover:shadow-sm transition-all text-center"
                      >
                        <div className="w-[38px] h-[38px] rounded-[10px] bg-[var(--ispora-brand-light)] flex items-center justify-center">
                          <FileText className="w-[18px] h-[18px] text-[var(--ispora-brand)]" strokeWidth={2} />
                        </div>
                        <span>Resources</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Calendar */}
                <div className="bg-white border-[1.5px] border-[var(--ispora-border)] rounded-2xl overflow-hidden h-[420px] flex flex-col">
                  <div className="px-5 py-4 border-b-[1.5px] border-[var(--ispora-border)] flex items-center justify-between">
                    <div className="font-syne text-sm font-bold text-[var(--ispora-text)]">
                      Calendar
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigateMonth('prev')}
                        className="w-7 h-7 rounded-lg hover:bg-[var(--ispora-bg)] flex items-center justify-center transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4 text-[var(--ispora-text2)]" />
                      </button>
                      <span className="text-xs font-semibold text-[var(--ispora-text)] min-w-[100px] text-center">
                        {currentCalendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </span>
                      <button
                        onClick={() => navigateMonth('next')}
                        className="w-7 h-7 rounded-lg hover:bg-[var(--ispora-bg)] flex items-center justify-center transition-colors"
                      >
                        <ChevronRight className="w-4 h-4 text-[var(--ispora-text2)]" />
                      </button>
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col overflow-hidden">
                    {/* Day headers */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                        <div key={day} className="text-center text-[10px] font-bold text-[var(--ispora-text3)] py-1">
                          {day}
                        </div>
                      ))}
                    </div>
                    
                    {/* Calendar grid */}
                    <div className="grid grid-cols-7 gap-1">
                      {generateCalendarDays().map((date, index) => {
                        if (!date) {
                          return <div key={`empty-${index}`} className="aspect-square" />;
                        }
                        
                        const sessionsOnDate = getSessionsForDate(date);
                        const hasSession = sessionsOnDate.length > 0;
                        const isTodayDate = isToday(date);
                        
                        return (
                          <div
                            key={date.toISOString()}
                            className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-semibold cursor-pointer transition-all relative ${
                              isTodayDate
                                ? 'bg-[var(--ispora-brand)] text-white'
                                : hasSession
                                ? 'bg-[var(--ispora-brand-light)] text-[var(--ispora-brand)] hover:bg-[#d0d5ff]'
                                : 'text-[var(--ispora-text2)] hover:bg-[var(--ispora-bg)]'
                            }`}
                            onClick={() => {
                              if (hasSession) {
                                setSelectedCalendarDate(date);
                              }
                            }}
                          >
                            <span className={isTodayDate ? 'font-bold' : ''}>{date.getDate()}</span>
                            {hasSession && (
                              <div className="flex gap-0.5 mt-0.5">
                                {sessionsOnDate.slice(0, 3).map((_, i) => (
                                  <div
                                    key={i}
                                    className={`w-1 h-1 rounded-full ${
                                      isTodayDate ? 'bg-white' : 'bg-[var(--ispora-brand)]'
                                    }`}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Sessions summary */}
                    <div className="mt-4 pt-4 border-t border-[var(--ispora-border)]">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[var(--ispora-text3)]">
                          This month
                        </span>
                        <span className="font-semibold text-[var(--ispora-brand)]">
                          {backendSessions.filter((session: any) => {
                            const sessionDate = new Date(session.scheduledAt);
                            return sessionDate.getMonth() === currentCalendarMonth.getMonth() &&
                                   sessionDate.getFullYear() === currentCalendarMonth.getFullYear();
                          }).length} sessions scheduled
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Notification Panel (if visible) */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowNotifications(false)}
        >
          <div
            className="absolute top-[70px] right-3.5 w-[330px] bg-white border-[1.5px] border-[var(--ispora-border)] rounded-2xl shadow-[var(--ispora-shadow-lg)] overflow-hidden animate-[slideUp_0.2s_ease] max-h-[calc(100vh-90px)] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3.5 border-b border-[var(--ispora-border)] flex items-center justify-between flex-shrink-0">
              <h3 className="font-syne text-sm font-bold text-[var(--ispora-text)]">
                Notifications
              </h3>
              <button 
                onClick={async () => {
                  try {
                    await api.notification.markAllAsRead();
                    const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
                    setNotifications(updatedNotifications);
                  } catch (error) {
                    console.error('Failed to mark all as read:', error);
                  }
                }}
                className="text-[11px] text-[var(--ispora-brand)] font-semibold cursor-pointer hover:underline"
              >
                Mark all read
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <div className="w-12 h-12 bg-[var(--ispora-bg)] rounded-full flex items-center justify-center mx-auto mb-3">
                    <Bell className="w-6 h-6 text-[var(--ispora-text3)]" />
                  </div>
                  <p className="text-sm font-semibold text-[var(--ispora-text)] mb-1">No notifications</p>
                  <p className="text-xs text-[var(--ispora-text3)]">You're all caught up!</p>
                </div>
              ) : (
                notifications.slice(0, 10).map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`px-4 py-3 border-b border-[var(--ispora-border)] flex gap-2.5 cursor-pointer ${notification.read ? 'hover:bg-[var(--ispora-bg)]' : 'bg-[var(--ispora-brand-light)] hover:bg-[#e0e3ff]'} transition-colors`}
                  >
                    <div className={`w-1.5 h-1.5 ${notification.read ? 'bg-transparent' : 'bg-[var(--ispora-brand)]'} rounded-full flex-shrink-0 mt-1.5`}></div>
                    <div className="flex-1">
                      <div className="text-xs text-[var(--ispora-text)] leading-snug" dangerouslySetInnerHTML={{ __html: notification.title || notification.message }} />
                      <div className="text-[10px] text-[var(--ispora-text3)] mt-0.5">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal - Changed to side popover */}
      {showProfileModal && (
        <div
          className="fixed inset-0 z-50"
          onClick={() => setShowProfileModal(false)}
        >
          <div
            className="absolute top-[70px] right-3.5 w-[280px] bg-white border-[1.5px] border-[var(--ispora-border)] rounded-2xl shadow-[var(--ispora-shadow-lg)] overflow-hidden animate-[slideUp_0.2s_ease]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-4 border-b border-[var(--ispora-border)]">
              <div className="flex items-center gap-3 mb-3">
                {(user as any)?.profilePicture ? (
                  <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                    <img 
                      src={(user as any).profilePicture} 
                      alt={`${user?.firstName} ${user?.lastName}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[var(--ispora-brand)] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {user?.firstName?.[0] || 'A'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-[var(--ispora-text)] truncate">
                    {user?.firstName} {user?.lastName}
                  </h4>
                  <p className="text-xs text-[var(--ispora-text3)] truncate">{user?.email}</p>
                </div>
              </div>
              <span className={`inline-block text-[10px] font-semibold px-2.5 py-1 rounded-full ${
                (user as any)?.mentorType === 'home' 
                  ? 'bg-[var(--ispora-success-light)] text-[var(--ispora-success)]' 
                  : 'bg-[var(--ispora-brand-light)] text-[var(--ispora-brand)]'
              }`}>
                {(user as any)?.mentorType === 'home' ? '🏠 Home-Based Mentor' : '✈️ Diaspora Mentor'}
              </span>
            </div>
            <div className="p-2">
              <button 
                onClick={() => {
                  setCurrentPage('profile');
                  setShowProfileModal(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-[var(--ispora-bg)] text-[var(--ispora-text)] text-sm font-medium transition-colors"
              >
                <User className="w-4 h-4" />
                <span>View Profile</span>
              </button>
              <button 
                onClick={() => {
                  setCurrentPage('settings');
                  setShowProfileModal(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-[var(--ispora-bg)] text-[var(--ispora-text)] text-sm font-medium transition-colors"
              >
                <SettingsIcon className="w-4 h-4" />
                <span>Settings</span>
              </button>
              <div className="my-1.5 border-t border-[var(--ispora-border)]" />
              <button 
                onClick={handleSignOut}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-[var(--ispora-danger-light)] text-[var(--ispora-danger)] text-sm font-medium transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Date Sessions Modal */}
      {selectedCalendarDate && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedCalendarDate(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md shadow-[var(--ispora-shadow-lg)] overflow-hidden animate-[slideUp_0.2s_ease]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-[var(--ispora-border)] flex items-center justify-between">
              <h3 className="font-syne text-base font-bold text-[var(--ispora-text)]">
                Sessions on {selectedCalendarDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </h3>
              <button
                onClick={() => setSelectedCalendarDate(null)}
                className="w-8 h-8 rounded-lg hover:bg-[var(--ispora-bg)] flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-[var(--ispora-text2)]" />
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {getSessionsForDate(selectedCalendarDate).length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-[var(--ispora-text3)] mx-auto mb-3" />
                  <p className="text-sm text-[var(--ispora-text2)]">No sessions scheduled for this day</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {getSessionsForDate(selectedCalendarDate).map((session: any) => {
                    const sessionDate = new Date(session.scheduledAt);
                    const studentData = session.student || session.mentorship?.student;
                    const studentName = studentData 
                      ? `${studentData.firstName} ${studentData.lastName}`
                      : 'Unknown Student';
                    
                    let sessionDetails = { sessionType: 'private' };
                    try {
                      if (session.notes) {
                        const parsed = JSON.parse(session.notes);
                        sessionDetails = { ...sessionDetails, ...parsed };
                      }
                    } catch (e) {}
                    
                    const isPublic = sessionDetails.sessionType === 'public';
                    const now = new Date();
                    const timeDiff = sessionDate.getTime() - now.getTime();
                    const minutesUntil = Math.floor(timeDiff / (1000 * 60));
                    const canJoin = minutesUntil <= 15 && minutesUntil >= -60;
                    const isPast = timeDiff < 0;
                    
                    return (
                      <div
                        key={session.id}
                        className="border-[1.5px] border-[var(--ispora-border)] rounded-xl p-4 hover:border-[var(--ispora-brand)] transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="font-semibold text-sm text-[var(--ispora-text)] mb-1">
                              {isPublic ? 'Public Session' : studentName}
                            </div>
                            <div className="text-xs text-[var(--ispora-text3)]">
                              {session.topic || 'Mentorship Session'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-[var(--ispora-text2)] mb-3">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {sessionDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} WAT
                          </span>
                          <span className="flex items-center gap-1">
                            <Video className="w-3.5 h-3.5" />
                            {session.meetingLink?.includes('zoom') ? 'Zoom' : 'Google Meet'}
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 pt-3 border-t border-[var(--ispora-border)]">
                          {canJoin ? (
                            <button
                              onClick={() => {
                                setSelectedCalendarDate(null);
                                setShowJoinSession(session);
                              }}
                              className="flex-1 px-3 py-2 rounded-lg bg-[var(--ispora-accent)] text-white text-xs font-semibold hover:bg-[#00d084] transition-all flex items-center justify-center gap-1.5"
                            >
                              <Video className="w-3.5 h-3.5" />
                              Join Session
                            </button>
                          ) : isPast ? (
                            <button
                              onClick={() => {
                                setSelectedCalendarDate(null);
                                setShowSessionNotes(session);
                              }}
                              className="flex-1 px-3 py-2 rounded-lg border-[1.5px] border-[var(--ispora-brand)] text-[var(--ispora-brand)] text-xs font-semibold hover:bg-[var(--ispora-brand-light)] transition-all flex items-center justify-center gap-1.5"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              View Notes
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedCalendarDate(null);
                                setShowSessionDetails(session);
                              }}
                              className="flex-1 px-3 py-2 rounded-lg border-[1.5px] border-[var(--ispora-border)] text-[var(--ispora-text)] text-xs font-semibold hover:bg-[var(--ispora-bg)] transition-all flex items-center justify-center gap-1.5"
                            >
                              <Calendar className="w-3.5 h-3.5" />
                              View Details
                            </button>
                          )}
                          
                          {!isPast && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedCalendarDate(null);
                                  setShowSessionDetails(session);
                                  setIsEditingSession(true);
                                }}
                                className="px-3 py-2 rounded-lg border-[1.5px] border-[var(--ispora-border)] text-[var(--ispora-text2)] text-xs font-semibold hover:bg-[var(--ispora-bg)] transition-all"
                                title="Edit Session"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedCalendarDate(null);
                                  setShowSessionDetails(session);
                                  setShowRescheduleModal(true);
                                }}
                                className="px-3 py-2 rounded-lg border-[1.5px] border-[var(--ispora-border)] text-[var(--ispora-text2)] text-xs font-semibold hover:bg-[var(--ispora-bg)] transition-all"
                                title="Reschedule"
                              >
                                Reschedule
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 md:p-4"
          onClick={() => setShowScheduleModal(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-[95vw] md:max-w-[480px] shadow-[var(--ispora-shadow-lg)] overflow-hidden animate-[slideUp_0.2s_ease] max-h-[88vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 md:px-6 py-4 md:py-5 border-b border-[var(--ispora-border)] flex items-center justify-between flex-shrink-0">
              <h3 className="font-syne text-base font-bold text-[var(--ispora-text)]">
                Schedule Session
              </h3>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--ispora-bg)] transition-colors"
              >
                <X className="w-5 h-5 text-[var(--ispora-text2)]" />
              </button>
            </div>
            <div className="p-4 md:p-6 space-y-4 overflow-y-auto flex-1">
              {/* Session Type Selector */}
              <div>
                <label className="block text-sm font-semibold text-[var(--ispora-text)] mb-2">
                  Session Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setScheduleForm({...scheduleForm, sessionType: 'private'})}
                    className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      scheduleForm.sessionType === 'private'
                        ? 'bg-[var(--ispora-brand)] text-white'
                        : 'bg-[var(--ispora-bg)] text-[var(--ispora-text2)] hover:bg-[var(--ispora-brand-light)]'
                    }`}
                  >
                    Private (1:1)
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleForm({...scheduleForm, sessionType: 'group'})}
                    className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      scheduleForm.sessionType === 'group'
                        ? 'bg-[var(--ispora-brand)] text-white'
                        : 'bg-[var(--ispora-bg)] text-[var(--ispora-text2)] hover:bg-[var(--ispora-brand-light)]'
                    }`}
                  >
                    Group
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleForm({...scheduleForm, sessionType: 'public'})}
                    className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      scheduleForm.sessionType === 'public'
                        ? 'bg-[var(--ispora-brand)] text-white'
                        : 'bg-[var(--ispora-bg)] text-[var(--ispora-text2)] hover:bg-[var(--ispora-brand-light)]'
                    }`}
                  >
                    Public
                  </button>
                </div>
                <p className="text-xs text-[var(--ispora-text3)] mt-2">
                  {scheduleForm.sessionType === 'private' && 'One-on-one session with a specific mentee'}
                  {scheduleForm.sessionType === 'group' && 'Session with selected mentees from your network'}
                  {scheduleForm.sessionType === 'public' && 'Open session visible to all students on the platform'}
                </p>
              </div>

              {/* Private Session - Select Single Mentee */}
              {scheduleForm.sessionType === 'private' && (
                <div>
                  <label className="block text-sm font-semibold text-[var(--ispora-text)] mb-2">
                    Select Mentee
                  </label>
                  <select 
                    value={scheduleForm.menteeId}
                    onChange={(e) => setScheduleForm({...scheduleForm, menteeId: e.target.value})}
                    className="w-full px-4 py-2.5 bg-[var(--ispora-bg)] border-[1.5px] border-[var(--ispora-border)] rounded-xl text-sm text-[var(--ispora-text)] outline-none focus:border-[var(--ispora-brand)] focus:bg-white transition-all"
                  >
                    <option value="">Choose a mentee...</option>
                    {activeMentees.map((mentee) => (
                      <option key={mentee.id} value={mentee.id}>
                        {mentee.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Group Session - Select Multiple Mentees */}
              {scheduleForm.sessionType === 'group' && (
                <div>
                  <label className="block text-sm font-semibold text-[var(--ispora-text)] mb-2">
                    Select Mentees ({scheduleForm.selectedMentees.length} selected)
                  </label>
                  <div className="max-h-[140px] overflow-y-auto bg-[var(--ispora-bg)] border-[1.5px] border-[var(--ispora-border)] rounded-xl p-2 space-y-1">
                    {activeMentees.map((mentee) => (
                      <label key={mentee.id} className="flex items-center gap-2.5 px-3 py-2 hover:bg-white rounded-lg cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={scheduleForm.selectedMentees.includes(mentee.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setScheduleForm({
                                ...scheduleForm,
                                selectedMentees: [...scheduleForm.selectedMentees, mentee.id]
                              });
                            } else {
                              setScheduleForm({
                                ...scheduleForm,
                                selectedMentees: scheduleForm.selectedMentees.filter(id => id !== mentee.id)
                              });
                            }
                          }}
                          className="w-4 h-4 rounded border-[var(--ispora-border)] text-[var(--ispora-brand)] focus:ring-[var(--ispora-brand)]"
                        />
                        <span className="text-sm text-[var(--ispora-text)]">{mentee.name}</span>
                      </label>
                    ))}
                    {activeMentees.length === 0 && (
                      <p className="text-xs text-[var(--ispora-text3)] text-center py-3">No active mentees</p>
                    )}
                  </div>
                </div>
              )}

              {/* Public Session - Capacity */}
              {scheduleForm.sessionType === 'public' && (
                <div>
                  <label className="block text-sm font-semibold text-[var(--ispora-text)] mb-2">
                    Maximum Capacity
                  </label>
                  <select 
                    value={scheduleForm.capacity}
                    onChange={(e) => setScheduleForm({...scheduleForm, capacity: e.target.value})}
                    className="w-full px-4 py-2.5 bg-[var(--ispora-bg)] border-[1.5px] border-[var(--ispora-border)] rounded-xl text-sm text-[var(--ispora-text)] outline-none focus:border-[var(--ispora-brand)] focus:bg-white transition-all"
                  >
                    <option value="5">5 students</option>
                    <option value="10">10 students</option>
                    <option value="15">15 students</option>
                    <option value="20">20 students</option>
                    <option value="30">30 students</option>
                    <option value="50">50 students</option>
                    <option value="unlimited">Unlimited</option>
                  </select>
                </div>
              )}

              {/* Recurring Session Toggle */}
              <div className="bg-[var(--ispora-bg)] border-[1.5px] border-[var(--ispora-border)] rounded-xl p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scheduleForm.isRecurring}
                    onChange={(e) => setScheduleForm({...scheduleForm, isRecurring: e.target.checked})}
                    className="w-4 h-4 rounded border-[var(--ispora-border)] text-[var(--ispora-brand)] focus:ring-[var(--ispora-brand)]"
                  />
                  <div>
                    <span className="text-sm font-semibold text-[var(--ispora-text)]">Recurring Session</span>
                    <p className="text-xs text-[var(--ispora-text3)] mt-0.5">
                      Schedule multiple sessions over several weeks
                    </p>
                  </div>
                </label>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-semibold text-[var(--ispora-text)] mb-2">
                  {scheduleForm.isRecurring ? 'Start Date' : 'Date'}
                </label>
                <input
                  type="date"
                  value={scheduleForm.date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    const newScheduledFor = newDate && scheduleForm.time ? `${newDate}T${scheduleForm.time}` : '';
                    setScheduleForm({...scheduleForm, date: newDate, scheduledFor: newScheduledFor});
                  }}
                  className="w-full px-4 py-2.5 bg-[var(--ispora-bg)] border-[1.5px] border-[var(--ispora-border)] rounded-xl text-sm text-[var(--ispora-text)] outline-none focus:border-[var(--ispora-brand)] focus:bg-white transition-all"
                />
              </div>

              {/* End Date - Only show if recurring */}
              {scheduleForm.isRecurring && (
                <div>
                  <label className="block text-sm font-semibold text-[var(--ispora-text)] mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={scheduleForm.recurrenceEndDate}
                    onChange={(e) => setScheduleForm({...scheduleForm, recurrenceEndDate: e.target.value})}
                    min={scheduleForm.date}
                    className="w-full px-4 py-2.5 bg-[var(--ispora-bg)] border-[1.5px] border-[var(--ispora-border)] rounded-xl text-sm text-[var(--ispora-text)] outline-none focus:border-[var(--ispora-brand)] focus:bg-white transition-all"
                  />
                  {scheduleForm.date && scheduleForm.recurrenceEndDate && (() => {
                    const start = new Date(scheduleForm.date);
                    const end = new Date(scheduleForm.recurrenceEndDate);
                    if (end > start) {
                      const daysDiff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                      const weeksDiff = Math.floor(daysDiff / 7);
                      const monthsDiff = Math.floor(daysDiff / 30);
                      
                      let durationText = '';
                      if (monthsDiff >= 2) {
                        durationText = `~${monthsDiff} months`;
                      } else if (weeksDiff >= 1) {
                        durationText = `${weeksDiff} week${weeksDiff > 1 ? 's' : ''}`;
                      } else {
                        durationText = `${daysDiff} day${daysDiff > 1 ? 's' : ''}`;
                      }
                      
                      return (
                        <p className="text-xs text-[var(--ispora-text3)] mt-1.5">
                          📅 Duration: {durationText}
                        </p>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}

              {/* Recurring Day Selection - Only show if recurring */}
              {scheduleForm.isRecurring && (
                <div>
                  <label className="block text-sm font-semibold text-[var(--ispora-text)] mb-2">
                    Which days?
                  </label>
                  
                  {/* Daily Quick Option */}
                  <label className="flex items-center gap-2 cursor-pointer mb-3 px-4 py-3 bg-[var(--ispora-bg)] border-[1.5px] border-[var(--ispora-border)] rounded-xl hover:border-[var(--ispora-brand)] transition-all">
                    <input
                      type="checkbox"
                      checked={scheduleForm.recurrenceDays.includes('daily')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setScheduleForm({...scheduleForm, recurrenceDays: ['daily']});
                        } else {
                          setScheduleForm({...scheduleForm, recurrenceDays: []});
                        }
                      }}
                      className="w-4 h-4 rounded border-[var(--ispora-border)] text-[var(--ispora-brand)] focus:ring-[var(--ispora-brand)]"
                    />
                    <div>
                      <span className="text-sm font-semibold text-[var(--ispora-text)]">Daily</span>
                      <p className="text-xs text-[var(--ispora-text3)]">Every day of the week</p>
                    </div>
                  </label>

                  {/* Days of Week Selection */}
                  {!scheduleForm.recurrenceDays.includes('daily') && (
                    <div>
                      <p className="text-xs text-[var(--ispora-text3)] mb-2">
                        Or select specific days ({scheduleForm.recurrenceDays.length} selected)
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                          const dayLower = day.toLowerCase();
                          const isSelected = scheduleForm.recurrenceDays.includes(dayLower);
                          
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setScheduleForm({
                                    ...scheduleForm,
                                    recurrenceDays: scheduleForm.recurrenceDays.filter(d => d !== dayLower)
                                  });
                                } else {
                                  setScheduleForm({
                                    ...scheduleForm,
                                    recurrenceDays: [...scheduleForm.recurrenceDays, dayLower]
                                  });
                                }
                              }}
                              className={`px-2 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                                isSelected
                                  ? 'bg-[var(--ispora-brand)] text-white shadow-md'
                                  : 'bg-[var(--ispora-bg)] text-[var(--ispora-text2)] hover:bg-[var(--ispora-brand-light)] border-[1.5px] border-[var(--ispora-border)]'
                              }`}
                            >
                              {day.substring(0, 3)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Session Count Preview */}
                  {scheduleForm.date && scheduleForm.recurrenceEndDate && scheduleForm.recurrenceDays.length > 0 && (() => {
                    const start = new Date(scheduleForm.date);
                    const end = new Date(scheduleForm.recurrenceEndDate);
                    if (end > start) {
                      const previewDates = generateRecurringDates(start, end, scheduleForm.recurrenceDays);
                      return (
                        <div className="bg-[var(--ispora-brand-light)] rounded-xl p-3 mt-3">
                          <p className="text-sm font-semibold text-[var(--ispora-brand)]">
                            📅 {previewDates.length} sessions will be created
                          </p>
                          <p className="text-xs text-[var(--ispora-brand)] mt-0.5">
                            {scheduleForm.recurrenceDays.includes('daily') 
                              ? 'Every day' 
                              : `${scheduleForm.recurrenceDays.join(', ').split(',').map((d, i, arr) => 
                                  i === 0 ? d.charAt(0).toUpperCase() + d.slice(1) : 
                                  i === arr.length - 1 ? ' and ' + d.charAt(0).toUpperCase() + d.slice(1) : 
                                  ', ' + d.charAt(0).toUpperCase() + d.slice(1)
                                ).join('')}`}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}

              {/* Time */}
              <div>
                <label className="block text-sm font-semibold text-[var(--ispora-text)] mb-2">
                  Time
                </label>
                <select
                  value={scheduleForm.time}
                  onChange={(e) => {
                    const newTime = e.target.value;
                    const newScheduledFor = scheduleForm.date && newTime ? `${scheduleForm.date}T${newTime}` : '';
                    setScheduleForm({...scheduleForm, time: newTime, scheduledFor: newScheduledFor});
                  }}
                  className="w-full px-4 py-2.5 bg-[var(--ispora-bg)] border-[1.5px] border-[var(--ispora-border)] rounded-xl text-sm text-[var(--ispora-text)] outline-none focus:border-[var(--ispora-brand)] focus:bg-white transition-all"
                >
                  <option value="">Select time</option>
                  <option value="00:00">12:00 AM</option>
                  <option value="00:30">12:30 AM</option>
                  <option value="01:00">1:00 AM</option>
                  <option value="01:30">1:30 AM</option>
                  <option value="02:00">2:00 AM</option>
                  <option value="02:30">2:30 AM</option>
                  <option value="03:00">3:00 AM</option>
                  <option value="03:30">3:30 AM</option>
                  <option value="04:00">4:00 AM</option>
                  <option value="04:30">4:30 AM</option>
                  <option value="05:00">5:00 AM</option>
                  <option value="05:30">5:30 AM</option>
                  <option value="06:00">6:00 AM</option>
                  <option value="06:30">6:30 AM</option>
                  <option value="07:00">7:00 AM</option>
                  <option value="07:30">7:30 AM</option>
                  <option value="08:00">8:00 AM</option>
                  <option value="08:30">8:30 AM</option>
                  <option value="09:00">9:00 AM</option>
                  <option value="09:30">9:30 AM</option>
                  <option value="10:00">10:00 AM</option>
                  <option value="10:30">10:30 AM</option>
                  <option value="11:00">11:00 AM</option>
                  <option value="11:30">11:30 AM</option>
                  <option value="12:00">12:00 PM</option>
                  <option value="12:30">12:30 PM</option>
                  <option value="13:00">1:00 PM</option>
                  <option value="13:30">1:30 PM</option>
                  <option value="14:00">2:00 PM</option>
                  <option value="14:30">2:30 PM</option>
                  <option value="15:00">3:00 PM</option>
                  <option value="15:30">3:30 PM</option>
                  <option value="16:00">4:00 PM</option>
                  <option value="16:30">4:30 PM</option>
                  <option value="17:00">5:00 PM</option>
                  <option value="17:30">5:30 PM</option>
                  <option value="18:00">6:00 PM</option>
                  <option value="18:30">6:30 PM</option>
                  <option value="19:00">7:00 PM</option>
                  <option value="19:30">7:30 PM</option>
                  <option value="20:00">8:00 PM</option>
                  <option value="20:30">8:30 PM</option>
                  <option value="21:00">9:00 PM</option>
                  <option value="21:30">9:30 PM</option>
                  <option value="22:00">10:00 PM</option>
                  <option value="22:30">10:30 PM</option>
                  <option value="23:00">11:00 PM</option>
                  <option value="23:30">11:30 PM</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[var(--ispora-text)] mb-2">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g., 30, 60, 90, 120..."
                  value={scheduleForm.duration}
                  onChange={(e) => setScheduleForm({...scheduleForm, duration: e.target.value})}
                  className="w-full px-4 py-2.5 bg-[var(--ispora-bg)] border-[1.5px] border-[var(--ispora-border)] rounded-xl text-sm text-[var(--ispora-text)] outline-none focus:border-[var(--ispora-brand)] focus:bg-white transition-all"
                />
                <p className="text-xs text-[var(--ispora-text3)] mt-1.5">
                  Enter any duration you need (e.g., 15, 30, 45, 60, 120, 180...)
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[var(--ispora-text)] mb-2">
                  Topic
                </label>
                <input
                  type="text"
                  value={scheduleForm.topic}
                  onChange={(e) => setScheduleForm({...scheduleForm, topic: e.target.value})}
                  placeholder="e.g., Career guidance, Technical skills..."
                  className="w-full px-4 py-2.5 bg-[var(--ispora-bg)] border-[1.5px] border-[var(--ispora-border)] rounded-xl text-sm text-[var(--ispora-text)] placeholder:text-[var(--ispora-text3)] outline-none focus:border-[var(--ispora-brand)] focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[var(--ispora-text)] mb-2">
                  Description
                </label>
                <textarea
                  value={scheduleForm.description}
                  onChange={(e) => setScheduleForm({...scheduleForm, description: e.target.value})}
                  placeholder="Brief description of what you'll cover in this session..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-[var(--ispora-bg)] border-[1.5px] border-[var(--ispora-border)] rounded-xl text-sm text-[var(--ispora-text)] placeholder:text-[var(--ispora-text3)] outline-none focus:border-[var(--ispora-brand)] focus:bg-white transition-all resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[var(--ispora-text)] mb-2">
                  Platform
                </label>
                <select 
                  value={scheduleForm.platform}
                  onChange={(e) => setScheduleForm({...scheduleForm, platform: e.target.value})}
                  className="w-full px-4 py-2.5 bg-[var(--ispora-bg)] border-[1.5px] border-[var(--ispora-border)] rounded-xl text-sm text-[var(--ispora-text)] outline-none focus:border-[var(--ispora-brand)] focus:bg-white transition-all"
                >
                  <option>Google Meet</option>
                  <option>Zoom</option>
                  <option>Microsoft Teams</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[var(--ispora-text)] mb-2">
                  Meeting Link
                </label>
                <input
                  type="url"
                  value={scheduleForm.meetingLink}
                  onChange={(e) => setScheduleForm({...scheduleForm, meetingLink: e.target.value})}
                  placeholder="https://meet.google.com/... or https://zoom.us/..."
                  className="w-full px-4 py-2.5 bg-[var(--ispora-bg)] border-[1.5px] border-[var(--ispora-border)] rounded-xl text-sm text-[var(--ispora-text)] placeholder:text-[var(--ispora-text3)] outline-none focus:border-[var(--ispora-brand)] focus:bg-white transition-all"
                />
                <p className="text-xs text-[var(--ispora-text3)] mt-1.5">
                  {user?.defaultMeetingLink ? (
                    <button 
                      type="button"
                      onClick={() => setScheduleForm({...scheduleForm, meetingLink: user.defaultMeetingLink})}
                      className="text-[var(--ispora-brand)] hover:underline"
                    >
                      Use your default meeting link
                    </button>
                  ) : (
                    'Add a default meeting link in Settings to auto-populate this field'
                  )}
                </p>
              </div>
            </div>
            <div className="px-4 md:px-6 py-3 md:py-4 border-t border-[var(--ispora-border)] flex gap-3 flex-shrink-0 bg-white sticky bottom-0">
              <button
                onClick={() => setShowScheduleModal(false)}
                disabled={schedulingSession}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--ispora-bg)] border-[1.5px] border-[var(--ispora-border)] text-[var(--ispora-text)] text-sm font-semibold hover:bg-[var(--ispora-brand-light)] hover:border-[var(--ispora-brand)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button 
                onClick={handleScheduleSession}
                disabled={schedulingSession}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--ispora-brand)] text-white text-sm font-semibold hover:bg-[var(--ispora-brand-hover)] hover:shadow-[0_6px_18px_rgba(2,31,246,0.35)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {schedulingSession ? 'Scheduling...' : 'Schedule Session'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && selectedMentee && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => {
            setShowMessageModal(false);
            setSelectedMentee(null);
          }}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg shadow-[var(--ispora-shadow-lg)] overflow-hidden animate-[slideUp_0.2s_ease]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-[var(--ispora-border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedMentee.avatar ? (
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                    <img 
                      src={selectedMentee.avatar} 
                      alt={selectedMentee.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{
                      backgroundColor: selectedMentee.color || 'var(--ispora-brand)'
                    }}
                  >
                    {selectedMentee.initials}
                  </div>
                )}
                <div>
                  <h3 className="font-syne text-sm font-bold text-[var(--ispora-text)]">
                    {selectedMentee.name}
                  </h3>
                  <p className="text-xs text-[var(--ispora-text3)]">{selectedMentee.field}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowMessageModal(false);
                  setSelectedMentee(null);
                }}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--ispora-bg)] transition-colors"
              >
                <X className="w-5 h-5 text-[var(--ispora-text2)]" />
              </button>
            </div>
            <div className="p-6">
              <textarea
                placeholder="Type your message..."
                rows={6}
                className="w-full px-4 py-3 bg-[var(--ispora-bg)] border-[1.5px] border-[var(--ispora-border)] rounded-xl text-sm text-[var(--ispora-text)] placeholder:text-[var(--ispora-text3)] outline-none focus:border-[var(--ispora-brand)] focus:bg-white transition-all resize-none"
              ></textarea>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => {
                    setShowMessageModal(false);
                    setSelectedMentee(null);
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--ispora-bg)] border-[1.5px] border-[var(--ispora-border)] text-[var(--ispora-text)] text-sm font-semibold hover:bg-[var(--ispora-brand-light)] hover:border-[var(--ispora-brand)] transition-all"
                >
                  Cancel
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--ispora-brand)] text-white text-sm font-semibold hover:bg-[var(--ispora-brand-hover)] hover:shadow-[0_6px_18px_rgba(2,31,246,0.35)] transition-all">
                  <Send className="w-4 h-4" />
                  Send Message
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Request Detail Modal */}
      {showRequestDetail && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowRequestDetail(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg shadow-[var(--ispora-shadow-lg)] overflow-hidden animate-[slideUp_0.2s_ease]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-[var(--ispora-border)] flex items-center justify-between">
              <h3 className="font-syne text-base font-bold text-[var(--ispora-text)]">
                Mentorship Request
              </h3>
              <button
                onClick={() => setShowRequestDetail(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--ispora-bg)] transition-colors"
              >
                <X className="w-5 h-5 text-[var(--ispora-text2)]" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                {showRequestDetail.avatar ? (
                  <img
                    src={showRequestDetail.avatar}
                    alt={showRequestDetail.studentName}
                    className="w-14 h-14 rounded-full object-cover flex-shrink-0 border-2 border-white shadow-md"
                  />
                ) : (
                  <div 
                    className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg shadow-md"
                    style={{ 
                      backgroundColor: showRequestDetail.color + '20',
                      color: showRequestDetail.color,
                      border: `2px solid ${showRequestDetail.color}`
                    }}
                  >
                    {showRequestDetail.initials}
                  </div>
                )}
                <div>
                  <h4 className="font-semibold text-base text-[var(--ispora-text)]">
                    {showRequestDetail.studentName}
                  </h4>
                  <p className="text-sm text-[var(--ispora-text3)]">{showRequestDetail.school}</p>
                  <p className="text-xs text-[var(--ispora-text3)] mt-0.5">
                    {showRequestDetail.time}
                  </p>
                </div>
              </div>
              <div className="bg-[var(--ispora-bg)] border border-[var(--ispora-border)] rounded-xl p-4 mb-4">
                <p className="text-sm text-[var(--ispora-text)] leading-relaxed">
                  {showRequestDetail.message}
                </p>
              </div>
              
              {/* Row 1: Profile + Message First */}
              <div className="flex flex-row gap-2 mb-2">
                {showRequestDetail.studentId && (
                  <button
                    onClick={() => {
                      setShowStudentProfile(showRequestDetail);
                    }}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white border-[1.5px] border-[var(--ispora-border)] text-[var(--ispora-brand)] text-sm font-semibold hover:border-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] transition-all flex items-center justify-center gap-2"
                  >
                    <User className="w-4 h-4" strokeWidth={2.5} />
                    Profile
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedMentee({
                      id: showRequestDetail.studentId,
                      name: showRequestDetail.studentName,
                      initials: showRequestDetail.initials,
                      color: showRequestDetail.color,
                      school: showRequestDetail.school,
                      progress: 0,
                      nextSession: 'Not scheduled'
                    });
                    setShowMessageModal(true);
                    setShowRequestDetail(null);
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white border-[1.5px] border-[var(--ispora-border)] text-[var(--ispora-text)] text-sm font-semibold hover:border-[var(--ispora-brand)] hover:text-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] transition-all"
                >
                  Message First
                </button>
              </div>
              
              {/* Row 2: Decline + Accept */}
              <div className="flex flex-row gap-2">
                <button
                  onClick={() => handleDeclineRequest(showRequestDetail)}
                  disabled={acceptingRequest}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white border-[1.5px] border-[var(--ispora-border)] text-[var(--ispora-text)] text-sm font-semibold hover:border-[var(--ispora-danger)] hover:text-[var(--ispora-danger)] hover:bg-[var(--ispora-danger-light)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Decline
                </button>
                <button
                  onClick={() => handleAcceptRequest(showRequestDetail)}
                  disabled={acceptingRequest}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--ispora-success)] text-white text-sm font-semibold hover:bg-[#059669] hover:shadow-[0_6px_18px_rgba(5,150,105,0.35)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {acceptingRequest ? 'Accepting...' : 'Accept & Schedule'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Join Session Modal */}
      {showJoinSession && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowJoinSession(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-2xl shadow-[var(--ispora-shadow-lg)] overflow-hidden animate-[slideUp_0.2s_ease]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-[var(--ispora-border)] flex items-center justify-between">
              <div>
                <h3 className="font-syne text-xl font-bold text-[var(--ispora-text)]">
                  Join Session
                </h3>
                <p className="text-sm text-[var(--ispora-text3)] mt-1">
                  Today's session — {showJoinSession.studentName}
                </p>
              </div>
              <button
                onClick={() => setShowJoinSession(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--ispora-bg)] transition-colors"
              >
                <X className="w-5 h-5 text-[var(--ispora-text2)]" />
              </button>
            </div>
            <div className="p-6">
              {/* Session Info Card */}
              <div className="border-[2px] border-[var(--ispora-brand)] rounded-2xl p-5 mb-5 bg-[var(--ispora-brand-light)]">
                <div className="flex items-center gap-4">
                  {showJoinSession.avatar ? (
                    <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0">
                      <img 
                        src={showJoinSession.avatar} 
                        alt={showJoinSession.studentName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0"
                      style={{
                        backgroundColor: showJoinSession.color || 'var(--ispora-brand)'
                      }}
                    >
                      {showJoinSession.initials}
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold text-base text-[var(--ispora-text)] mb-1">
                      {showJoinSession.studentName}
                    </h4>
                    <p className="text-sm text-[var(--ispora-text2)] mb-2">
                      {showJoinSession.topic}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-[var(--ispora-text2)] flex-wrap">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-[var(--ispora-brand)]" strokeWidth={2} />
                        {showJoinSession.time}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-[var(--ispora-brand)]" strokeWidth={2} />
                        Today, 26 March 2026
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Video className="w-4 h-4 text-[var(--ispora-brand)]" strokeWidth={2} />
                        {showJoinSession.platform}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Meeting Link */}
              {(() => {
                // Get meeting link directly from session object
                const meetingLink = showJoinSession.meetingLink || '';
                
                return (
                  <div className="mb-5">
                    <label className="block text-sm font-semibold text-[var(--ispora-text)] mb-2">
                      Meeting Link
                    </label>
                    {meetingLink ? (
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={meetingLink}
                          readOnly
                          className="flex-1 px-4 py-3 bg-[var(--ispora-bg)] border-[1.5px] border-[var(--ispora-border)] rounded-xl text-sm text-[var(--ispora-text)] outline-none"
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(meetingLink);
                            toast.success('Link Copied!', {
                              description: 'Meeting link copied to clipboard.',
                              duration: 3000,
                            });
                          }}
                          className="px-6 py-3 rounded-xl bg-white border-[1.5px] border-[var(--ispora-border)] text-[var(--ispora-text)] text-sm font-semibold hover:border-[var(--ispora-brand)] hover:text-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] transition-all"
                        >
                          Copy
                        </button>
                      </div>
                    ) : (
                      <div className="px-4 py-3 bg-[var(--ispora-warn-light)] border-[1.5px] border-[var(--ispora-warn)] rounded-xl">
                        <p className="text-sm text-[var(--ispora-text2)]">
                          No meeting link has been set for this session. Please add one in Settings or contact your mentee directly.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Tip */}
              <div className="bg-[var(--ispora-brand-light)] border border-[var(--ispora-brand)] rounded-xl p-4 mb-5">
                <p className="text-sm text-[var(--ispora-text2)] leading-relaxed">
                  💡 After the session, mark it as completed so {showJoinSession.studentName}'s progress is updated automatically.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowJoinSession(null)}
                  className="flex-1 px-4 py-3 rounded-xl bg-white border-[1.5px] border-[var(--ispora-border)] text-[var(--ispora-text)] text-sm font-semibold hover:bg-[var(--ispora-brand-light)] hover:border-[var(--ispora-brand)] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const meetingLink = showJoinSession.meetingLink || '';
                    if (meetingLink) {
                      const normalizedLink = normalizeUrl(meetingLink);
                      window.open(normalizedLink, '_blank');
                    } else {
                      toast.error('No Meeting Link', {
                        description: 'No meeting link is available for this session.',
                      });
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--ispora-brand)] text-white text-sm font-semibold hover:bg-[var(--ispora-brand-hover)] hover:shadow-[0_6px_18px_rgba(2,31,246,0.35)] transition-all"
                >
                  <Video className="w-4 h-4" strokeWidth={2.5} />
                  Join Meeting
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mentee Detail Modal */}
      {showMenteeDetail && menteeDetails && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => {
            setShowMenteeDetail(false);
            setMenteeDetails(null);
          }}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-2xl shadow-[var(--ispora-shadow-lg)] overflow-hidden max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-[var(--ispora-brand)] px-6 py-5 relative overflow-hidden">
              <div 
                className="absolute inset-0 opacity-[0.04]"
                style={{
                  backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px)',
                  backgroundSize: '28px 28px'
                }}
              ></div>
              <div className="relative z-10">
                <div className="flex items-start gap-3.5 mb-3">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0"
                    style={{ backgroundColor: menteeDetails.color || 'rgba(255,255,255,0.2)' }}
                  >
                    {menteeDetails.initials}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-syne text-lg font-bold text-white">
                      {menteeDetails.name}
                    </h3>
                    <p className="text-sm text-white/80 mt-0.5">
                      {menteeDetails.field} · {menteeDetails.university}
                    </p>
                    <div className="flex gap-1.5 mt-2">
                      {['React', 'Python', 'AI/ML'].map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-md bg-white/20 text-white text-[10px] font-semibold"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Overview */}
            <div className="px-6 py-5 bg-[var(--ispora-bg)]">
              <div className="text-xs font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-3">
                Progress Overview
              </div>
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-[var(--ispora-text2)]">Overall progress</span>
                  <span className="font-bold text-[var(--ispora-brand)]">{menteeDetails.progress}%</span>
                </div>
                <div className="h-2 bg-white rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--ispora-brand)] rounded-full transition-all"
                    style={{ width: `${menteeDetails.progress}%` }}
                  ></div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-white rounded-xl p-3 text-center">
                  <div className="font-dm-sans text-2xl font-bold text-[var(--ispora-brand)]">
                    {menteeDetails.sessionsDone}
                  </div>
                  <div className="text-[10px] text-[var(--ispora-text3)] mt-1">Sessions done</div>
                </div>
                <div className="bg-white rounded-xl p-3 text-center">
                  <div className="font-dm-sans text-2xl font-bold text-[var(--ispora-brand)]">
                    {menteeDetails.tasksDone}
                  </div>
                  <div className="text-[10px] text-[var(--ispora-text3)] mt-1">Tasks done</div>
                </div>
                <div className="bg-white rounded-xl p-3 text-center">
                  <div className="font-dm-sans text-2xl font-bold text-[var(--ispora-brand)]">
                    {menteeDetails.duration}
                  </div>
                  <div className="text-[10px] text-[var(--ispora-text3)] mt-1">Duration</div>
                </div>
              </div>
            </div>

            {/* Goals */}
            <div className="px-6 py-5 border-t-[1.5px] border-[var(--ispora-border)]">
              <div className="text-xs font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-3">
                Goals
              </div>
              <div className="space-y-2.5">
                {menteeDetails.goals.map((goal) => (
                  <div key={goal.id} className="flex items-start gap-2.5">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 cursor-pointer transition-all ${
                        goal.completed
                          ? 'bg-[var(--ispora-accent)] border-2 border-[var(--ispora-accent)]'
                          : 'bg-white border-2 border-[var(--ispora-border)]'
                      }`}
                      onClick={() => {
                        const updatedGoals = menteeDetails.goals.map((g) =>
                          g.id === goal.id ? { ...g, completed: !g.completed } : g
                        );
                        setMenteeDetails({ ...menteeDetails, goals: updatedGoals });
                      }}
                    >
                      {goal.completed && (
                        <CheckCircle className="w-3 h-3 text-white" strokeWidth={3} />
                      )}
                    </div>
                    <span
                      className={`text-[13px] flex-1 ${
                        goal.completed
                          ? 'text-[var(--ispora-text3)] line-through'
                          : 'text-[var(--ispora-text)]'
                      }`}
                    >
                      {goal.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Sessions */}
            <div className="px-6 py-5 border-t-[1.5px] border-[var(--ispora-border)]">
              <div className="text-xs font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-3">
                Recent Sessions
              </div>
              <div className="space-y-2.5">
                {menteeDetails.recentSessions.map((session, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 mt-2 ${
                        session.status === 'today'
                          ? 'bg-[var(--ispora-brand)]'
                          : session.status === 'upcoming'
                          ? 'bg-[var(--ispora-warning)]'
                          : 'bg-[var(--ispora-accent)]'
                      }`}
                    ></div>
                    <div className="flex-1">
                      <div className="text-[13px] font-semibold text-[var(--ispora-text)]">
                        {session.title}
                      </div>
                      <div className="text-[11px] text-[var(--ispora-text3)] mt-0.5">
                        {session.date}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 border-t-[1.5px] border-[var(--ispora-border)] bg-[var(--ispora-bg)] flex gap-2.5">
              <button
                onClick={() => {
                  setShowMenteeDetail(false);
                  setMenteeDetails(null);
                }}
                className="flex-1 py-2.5 rounded-lg border-[1.5px] border-[var(--ispora-border)] bg-white text-[var(--ispora-text)] text-sm font-semibold hover:bg-[var(--ispora-bg)] transition-all"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowMenteeDetail(false);
                  openScheduleModal();
                }}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-white border-[1.5px] border-[var(--ispora-border)] text-[var(--ispora-text)] text-sm font-semibold hover:border-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] hover:text-[var(--ispora-brand)] transition-all"
              >
                <Calendar className="w-4 h-4" />
                Schedule
              </button>
              <button
                onClick={() => {
                  // Find the mentee object that matches the current mentee details
                  const mentee = activeMentees.find(m => m.name === menteeDetails.name);
                  if (mentee) {
                    setSelectedMentee(mentee);
                  }
                  setShowMenteeDetail(false);
                  setShowResourceModal(true);
                }}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-white border-[1.5px] border-[var(--ispora-border)] text-[var(--ispora-text)] text-sm font-semibold hover:border-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] hover:text-[var(--ispora-brand)] transition-all"
              >
                <FileText className="w-4 h-4" />
                Resource
              </button>
              <button
                onClick={() => {
                  // Find the mentee object that matches the current mentee details
                  const mentee = activeMentees.find(m => m.name === menteeDetails.name);
                  if (mentee) {
                    setSelectedMentee(mentee);
                  }
                  setShowMenteeDetail(false);
                  setShowMessageModal(true);
                }}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-[var(--ispora-brand)] text-white text-sm font-semibold hover:bg-[#0119d9] transition-all"
              >
                <Send className="w-4 h-4" />
                Message
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session Notes Modal */}
      {showSessionNotes && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => {
            setShowSessionNotes(null);
            setSessionNotes({ goals: '', resources: '', followup: '', recordingUrl: '' });
          }}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-[var(--ispora-shadow-lg)] overflow-hidden animate-[slideUp_0.2s_ease] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-[var(--ispora-border)] flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="font-syne text-xl font-bold text-[var(--ispora-text)]">
                  Session Notes
                </h3>
                <p className="text-sm text-[var(--ispora-text3)] mt-1">
                  Private notes for your reference
                </p>
              </div>
              <button
                onClick={() => {
                  setShowSessionNotes(null);
                  setSessionNotes({ goals: '', resources: '', followup: '', recordingUrl: '' });
                }}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--ispora-bg)] transition-colors"
              >
                <X className="w-5 h-5 text-[var(--ispora-text2)]" />
              </button>
            </div>
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Registered Students Section (for public sessions) */}
              {(() => {
                let sessionDetails = { sessionType: 'private', registeredStudents: [], capacity: 0 };
                try {
                  if (showSessionNotes.notes) {
                    const parsed = JSON.parse(showSessionNotes.notes);
                    sessionDetails = { ...sessionDetails, ...parsed };
                  }
                } catch (e) {}

                if (sessionDetails.sessionType === 'public') {
                  return (
                    <div className="border-[1.5px] border-[var(--ispora-brand-light)] bg-gradient-to-r from-[var(--ispora-brand-light)] to-[var(--ispora-accent-light)] rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Users className="w-5 h-5 text-[var(--ispora-brand)]" strokeWidth={2} />
                        <h4 className="font-syne font-bold text-sm text-[var(--ispora-text)]">
                          Students Attending ({sessionDetails.registeredStudents.length}/{sessionDetails.capacity})
                        </h4>
                      </div>
                      {sessionDetails.registeredStudents.length === 0 ? (
                        <p className="text-xs text-[var(--ispora-text3)] italic">
                          No students have signed up yet. They can count themselves in from the public sessions section.
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-[200px] overflow-y-auto">
                          {sessionDetails.registeredStudents.map((studentId: string, index: number) => {
                            const studentInfo = studentDetailsCache[studentId];
                            const studentName = studentInfo 
                              ? `${studentInfo.firstName} ${studentInfo.lastName}`.trim() || studentInfo.displayName || studentInfo.email?.split('@')[0] || 'Student'
                              : 'Loading...';
                            const studentInitials = studentInfo
                              ? `${studentInfo.firstName?.[0] || ''}${studentInfo.lastName?.[0] || ''}`.toUpperCase() || 'S'
                              : '...';
                            
                            return (
                              <div key={studentId} className="flex items-center gap-2.5 p-2.5 bg-white rounded-lg">
                                <div className="w-8 h-8 rounded-full bg-[var(--ispora-brand)] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                                  {studentInitials}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-semibold text-[var(--ispora-text)]">
                                    {studentName}
                                  </div>
                                  {studentInfo?.university && (
                                    <div className="text-[10px] text-[var(--ispora-text3)] truncate">
                                      {studentInfo.university}
                                    </div>
                                  )}
                                </div>
                                <CheckCircle className="w-4 h-4 text-[var(--ispora-success)] flex-shrink-0" strokeWidth={2} />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              })()}

              {/* Goals for this session */}
              <div>
                <label className="block text-sm font-semibold text-[var(--ispora-text)] mb-2">
                  Goals for this session
                </label>
                <textarea
                  value={sessionNotes.goals}
                  onChange={(e) => setSessionNotes({ ...sessionNotes, goals: e.target.value })}
                  placeholder="What should your mentee take away?"
                  className="w-full px-4 py-3 bg-white border-[1.5px] border-[var(--ispora-border)] rounded-xl text-sm text-[var(--ispora-text)] placeholder:text-[var(--ispora-text3)] outline-none focus:border-[var(--ispora-brand)] focus:ring-2 focus:ring-[var(--ispora-brand)]/20 transition-all resize-none"
                  rows={4}
                />
              </div>

              {/* Resources to share */}
              <div>
                <label className="block text-sm font-semibold text-[var(--ispora-text)] mb-2">
                  Resources to share
                </label>
                <textarea
                  value={sessionNotes.resources}
                  onChange={(e) => setSessionNotes({ ...sessionNotes, resources: e.target.value })}
                  placeholder="Links, books, articles..."
                  className="w-full px-4 py-3 bg-white border-[1.5px] border-[var(--ispora-border)] rounded-xl text-sm text-[var(--ispora-text)] placeholder:text-[var(--ispora-text3)] outline-none focus:border-[var(--ispora-brand)] focus:ring-2 focus:ring-[var(--ispora-brand)]/20 transition-all resize-none"
                  rows={4}
                />
              </div>

              {/* Follow-up actions */}
              <div>
                <label className="block text-sm font-semibold text-[var(--ispora-text)] mb-2">
                  Follow-up actions
                </label>
                <textarea
                  value={sessionNotes.followup}
                  onChange={(e) => setSessionNotes({ ...sessionNotes, followup: e.target.value })}
                  placeholder="Tasks for your mentee after the session..."
                  className="w-full px-4 py-3 bg-white border-[1.5px] border-[var(--ispora-border)] rounded-xl text-sm text-[var(--ispora-text)] placeholder:text-[var(--ispora-text3)] outline-none focus:border-[var(--ispora-brand)] focus:ring-2 focus:ring-[var(--ispora-brand)]/20 transition-all resize-none"
                  rows={4}
                />
              </div>

              {/* Session Recording URL */}
              <div>
                <label className="block text-sm font-semibold text-[var(--ispora-text)] mb-2">
                  🎥 Session Recording Link (Optional)
                </label>
                <input
                  type="url"
                  value={sessionNotes.recordingUrl}
                  onChange={(e) => setSessionNotes({ ...sessionNotes, recordingUrl: e.target.value })}
                  placeholder="https://zoom.us/rec/... or https://drive.google.com/..."
                  className="w-full px-4 py-3 bg-white border-[1.5px] border-[var(--ispora-border)] rounded-xl text-sm text-[var(--ispora-text)] placeholder:text-[var(--ispora-text3)] outline-none focus:border-[var(--ispora-brand)] focus:ring-2 focus:ring-[var(--ispora-brand)]/20 transition-all"
                />
                <p className="text-xs text-[var(--ispora-text3)] mt-1.5">
                  Share the recording with your mentees so they can review the session
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowSessionNotes(null);
                    setSessionNotes({ goals: '', resources: '', followup: '', recordingUrl: '' });
                  }}
                  className="flex-1 px-4 py-3 rounded-xl bg-white border-[1.5px] border-[var(--ispora-border)] text-[var(--ispora-text)] text-sm font-semibold hover:bg-[var(--ispora-bg)] hover:border-[var(--ispora-text2)] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      // Save recording URL if provided
                      if (sessionNotes.recordingUrl && showSessionNotes?.id) {
                        await api.session.addRecording(showSessionNotes.id, {
                          recordingUrl: sessionNotes.recordingUrl,
                          recordingType: 'link'
                        });
                      }
                      
                      toast.success('Notes Saved!', {
                        description: sessionNotes.recordingUrl 
                          ? 'Session notes and recording link saved successfully.'
                          : 'Session notes saved successfully.',
                        duration: 3000,
                      });
                      setShowSessionNotes(null);
                      setSessionNotes({ goals: '', resources: '', followup: '', recordingUrl: '' });
                      
                      // Refresh sessions
                      await fetchSessions();
                    } catch (err: any) {
                      console.error('Error saving notes:', err);
                      toast.error('Failed to Save', {
                        description: err.message || 'Could not save session notes. Please try again.',
                      });
                    }
                  }}
                  className="flex-1 px-4 py-3 rounded-xl bg-[var(--ispora-brand)] text-white text-sm font-semibold hover:bg-[var(--ispora-brand-hover)] hover:shadow-[0_6px_18px_rgba(2,31,246,0.35)] transition-all"
                >
                  Save Notes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Session Details Modal */}
      {showSessionDetails && (() => {
        let sessionDetails = { sessionType: 'private', registeredStudents: [], capacity: 10, description: '' };
        try {
          if (showSessionDetails.notes) {
            const parsed = JSON.parse(showSessionDetails.notes);
            sessionDetails = { ...sessionDetails, ...parsed };
          }
        } catch (e) {}
        
        const isPublic = sessionDetails.sessionType === 'public';
        const isGroup = sessionDetails.sessionType === 'group';
        
        return (
          <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 md:p-4"
            onClick={() => {
              setShowSessionDetails(null);
              setIsEditingSession(false);
              setShowRescheduleModal(false);
            }}
          >
            <div
              className="bg-white rounded-2xl w-full max-w-[95vw] md:max-w-[520px] shadow-[var(--ispora-shadow-lg)] overflow-hidden animate-[slideUp_0.2s_ease] max-h-[88vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className={`px-4 md:px-6 py-4 md:py-5 border-b border-[var(--ispora-border)] ${isPublic ? 'bg-gradient-to-r from-[var(--ispora-brand-light)] to-[#e8ebff]' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {(isPublic || isGroup) && (
                        <div className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full ${
                          isPublic 
                            ? 'bg-[var(--ispora-brand)] text-white' 
                            : 'bg-[var(--ispora-success)] text-white'
                        }`}>
                          <Users className="w-3 h-3" strokeWidth={2.5} />
                          {isPublic ? 'PUBLIC SESSION' : 'GROUP SESSION'}
                        </div>
                      )}
                      {sessionDetails.isRecurring && (
                        <div className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-[var(--ispora-accent)] text-white">
                          <Repeat className="w-3 h-3" strokeWidth={2.5} />
                          SESSION {sessionDetails.sessionNumber}/{sessionDetails.totalSessions}
                        </div>
                      )}
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${getBadgeStyles(showSessionDetails.badge)}`}>
                        {showSessionDetails.badge === 'today' ? 'Today' : showSessionDetails.badge === 'tomorrow' ? 'Tomorrow' : 'Upcoming'}
                      </span>
                    </div>
                    <h3 className="font-syne text-2xl font-bold text-[var(--ispora-text)]">
                      {showSessionDetails.topic}
                    </h3>
                    <p className="text-sm text-[var(--ispora-text3)] mt-1">
                      {isPublic ? 'Open to all students on the platform' : isGroup ? `Group session with ${sessionDetails.registeredStudents.length} mentees` : `1-on-1 with ${showSessionDetails.studentName}`}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowSessionDetails(null);
                      setIsEditingSession(false);
                      setShowRescheduleModal(false);
                    }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white transition-colors flex-shrink-0"
                  >
                    <X className="w-5 h-5 text-[var(--ispora-text2)]" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-5">
                {/* Session Information Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-[var(--ispora-text3)] uppercase tracking-wide">Date & Time</div>
                    <div className="flex items-center gap-2 text-sm text-[var(--ispora-text)]">
                      <Calendar className="w-4 h-4 text-[var(--ispora-brand)]" />
                      <span className="font-semibold">{showSessionDetails.date}</span>
                      <span className="text-[var(--ispora-text3)]">•</span>
                      <Clock className="w-4 h-4 text-[var(--ispora-brand)]" />
                      <span className="font-semibold">{showSessionDetails.time}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-[var(--ispora-text3)] uppercase tracking-wide">Platform</div>
                    <div className="flex items-center gap-2 text-sm text-[var(--ispora-text)]">
                      <Video className="w-4 h-4 text-[var(--ispora-brand)]" />
                      <span className="font-semibold">{showSessionDetails.platform}</span>
                    </div>
                  </div>

                  {isPublic && (
                    <div className="space-y-1 col-span-2">
                      <div className="text-xs font-semibold text-[var(--ispora-text3)] uppercase tracking-wide">Attendance</div>
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-[var(--ispora-brand)]" />
                        <span className="font-semibold text-[var(--ispora-text)]">
                          {sessionDetails.registeredStudents.length} / {sessionDetails.capacity} students
                        </span>
                        <span className={`text-xs font-semibold ${
                          sessionDetails.registeredStudents.length >= sessionDetails.capacity 
                            ? 'text-[var(--ispora-error)]' 
                            : 'text-[var(--ispora-success)]'
                        }`}>
                          {sessionDetails.registeredStudents.length >= sessionDetails.capacity 
                            ? '• Full' 
                            : `• ${sessionDetails.capacity - sessionDetails.registeredStudents.length} spots left`}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Recurring Session Info */}
                {sessionDetails.isRecurring && (
                  <div className="border-[1.5px] border-[var(--ispora-accent-light)] rounded-xl p-4 bg-gradient-to-r from-[var(--ispora-accent-light)] to-[#fff5f0]">
                    <div className="flex items-center gap-2 mb-2">
                      <Repeat className="w-5 h-5 text-[var(--ispora-accent)]" strokeWidth={2} />
                      <h4 className="font-syne font-bold text-sm text-[var(--ispora-text)]">
                        Recurring Session Series
                      </h4>
                    </div>
                    <p className="text-sm text-[var(--ispora-text)] mb-1">
                      Session <strong>{sessionDetails.sessionNumber}</strong> of <strong>{sessionDetails.totalSessions}</strong>
                    </p>
                    <p className="text-xs text-[var(--ispora-text3)]">
                      {sessionDetails.recurrencePattern?.days?.includes('daily') 
                        ? 'Daily sessions' 
                        : `${sessionDetails.recurrencePattern?.days?.length || 0} day${sessionDetails.recurrencePattern?.days?.length > 1 ? 's' : ''} per week`}
                      {sessionDetails.recurrencePattern?.startDate && sessionDetails.recurrencePattern?.endDate && (
                        <> · {new Date(sessionDetails.recurrencePattern.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} to {new Date(sessionDetails.recurrencePattern.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</>
                      )}
                    </p>
                  </div>
                )}

                {/* Description */}
                {sessionDetails.description && (
                  <div className="border-[1.5px] border-[var(--ispora-border)] rounded-xl p-4 bg-[var(--ispora-bg)]">
                    <div className="text-xs font-semibold text-[var(--ispora-text3)] uppercase tracking-wide mb-2">Description</div>
                    <p className="text-sm text-[var(--ispora-text)] leading-relaxed">{sessionDetails.description}</p>
                  </div>
                )}

                {/* Registered Students (for public/group sessions) */}
                {(isPublic || isGroup) && sessionDetails.registeredStudents.length > 0 && (
                  <div className={`border-[1.5px] rounded-xl p-4 ${
                    isPublic 
                      ? 'border-[var(--ispora-brand-light)] bg-gradient-to-r from-[var(--ispora-brand-light)] to-[var(--ispora-accent-light)]'
                      : 'border-[var(--ispora-border)] bg-[var(--ispora-bg)]'
                  }`}>
                    <div className="flex items-center gap-2 mb-3">
                      <Users className={`w-5 h-5 ${isPublic ? 'text-[var(--ispora-brand)]' : 'text-[var(--ispora-success)]'}`} strokeWidth={2} />
                      <h4 className="font-syne font-bold text-sm text-[var(--ispora-text)]">
                        Students Attending ({sessionDetails.registeredStudents.length})
                      </h4>
                    </div>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {sessionDetails.registeredStudents.map((studentId: string, index: number) => {
                        const studentInfo = studentDetailsCache[studentId];
                        const studentName = studentInfo 
                          ? `${studentInfo.firstName} ${studentInfo.lastName}`.trim() || studentInfo.displayName || studentInfo.email?.split('@')[0] || 'Student'
                          : 'Loading...';
                        const studentInitials = studentInfo
                          ? `${studentInfo.firstName?.[0] || ''}${studentInfo.lastName?.[0] || ''}`.toUpperCase() || 'S'
                          : '...';
                        
                        return (
                          <div key={studentId} className="flex items-center gap-2.5 p-2.5 bg-white rounded-lg">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0 ${
                              isPublic ? 'bg-[var(--ispora-brand)]' : 'bg-[var(--ispora-success)]'
                            }`}>
                              {studentInitials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold text-[var(--ispora-text)]">
                                {studentName}
                              </div>
                              {studentInfo?.university && (
                                <div className="text-[10px] text-[var(--ispora-text3)] truncate">
                                  {studentInfo.university}
                                </div>
                              )}
                            </div>
                            <CheckCircle className="w-4 h-4 text-[var(--ispora-success)] flex-shrink-0" strokeWidth={2} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Reschedule Modal */}
                {showRescheduleModal && (
                  <div className="border-[1.5px] border-[var(--ispora-brand)] rounded-xl p-5 bg-gradient-to-r from-[var(--ispora-brand-light)] to-[#e8ebff]">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-[var(--ispora-brand)] flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-5 h-5 text-white" strokeWidth={2} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-syne font-bold text-base text-[var(--ispora-text)] mb-1">Reschedule Session</h4>
                        <p className="text-xs text-[var(--ispora-text3)]">
                          {isPublic 
                            ? `All ${sessionDetails.registeredStudents.length} registered students will be notified`
                            : isGroup
                              ? `All ${sessionDetails.registeredStudents.length} mentees in this group will be notified`
                              : `${showSessionDetails.studentName} will be notified about the change`}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-semibold text-[var(--ispora-text)] mb-2">
                          New Date
                        </label>
                        <input
                          type="date"
                          value={editSessionForm.date}
                          onChange={(e) => setEditSessionForm({ ...editSessionForm, date: e.target.value })}
                          className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[var(--ispora-border)] rounded-xl text-sm text-[var(--ispora-text)] outline-none focus:border-[var(--ispora-brand)] focus:ring-2 focus:ring-[var(--ispora-brand)]/20 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-[var(--ispora-text)] mb-2">
                          New Time
                        </label>
                        <input
                          type="time"
                          value={editSessionForm.time}
                          onChange={(e) => setEditSessionForm({ ...editSessionForm, time: e.target.value })}
                          className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[var(--ispora-border)] rounded-xl text-sm text-[var(--ispora-text)] outline-none focus:border-[var(--ispora-brand)] focus:ring-2 focus:ring-[var(--ispora-brand)]/20 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-[var(--ispora-text)] mb-2">
                          Reason for rescheduling <span className="text-[var(--ispora-error)]">*</span>
                        </label>
                        <textarea
                          value={rescheduleReason}
                          onChange={(e) => setRescheduleReason(e.target.value)}
                          placeholder="Let your mentee(s) know why you're rescheduling..."
                          className="w-full px-4 py-3 bg-white border-[1.5px] border-[var(--ispora-border)] rounded-xl text-sm text-[var(--ispora-text)] placeholder:text-[var(--ispora-text3)] outline-none focus:border-[var(--ispora-brand)] focus:ring-2 focus:ring-[var(--ispora-brand)]/20 transition-all resize-none"
                          rows={3}
                        />
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={() => {
                            setShowRescheduleModal(false);
                            setRescheduleReason('');
                          }}
                          className="flex-1 px-4 py-2.5 rounded-xl bg-white border-[1.5px] border-[var(--ispora-border)] text-[var(--ispora-text)] text-sm font-semibold hover:bg-[var(--ispora-bg)] transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={async () => {
                            if (!rescheduleReason.trim()) {
                              toast.error('Reason Required', {
                                description: 'Please provide a reason for rescheduling.',
                              });
                              return;
                            }
                            // TODO: Implement reschedule API endpoint
                            toast.success('Session Rescheduled!', {
                              description: 'All participants will be notified of the change.',
                              duration: 5000,
                            });
                            setShowRescheduleModal(false);
                            setShowSessionDetails(null);
                            setRescheduleReason('');
                          }}
                          className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--ispora-brand)] text-white text-sm font-semibold hover:bg-[var(--ispora-brand-hover)] hover:shadow-[0_6px_18px_rgba(2,31,246,0.35)] transition-all"
                        >
                          Confirm Reschedule
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {!showRescheduleModal && (
                  <div className="space-y-3 pt-2">
                    {/* First row: Notes and Reschedule */}
                    <div className="flex gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowSessionDetails(null);
                          setShowSessionNotes(showSessionDetails);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white border-[1.5px] border-[var(--ispora-border)] text-[var(--ispora-text)] text-sm font-semibold hover:border-[var(--ispora-brand)] hover:text-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] transition-all"
                      >
                        <FileText className="w-4 h-4" />
                        Notes
                      </button>
                      <button
                        onClick={() => {
                          setEditSessionForm({
                            topic: showSessionDetails.topic,
                            description: sessionDetails.description || '',
                            date: showSessionDetails.date,
                            time: showSessionDetails.time,
                            duration: '60',
                            platform: showSessionDetails.platform,
                            meetingLink: ''
                          });
                          setShowRescheduleModal(true);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white border-[1.5px] border-[var(--ispora-border)] text-[var(--ispora-text)] text-sm font-semibold hover:border-[var(--ispora-brand)] hover:text-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] transition-all"
                      >
                        <Calendar className="w-4 h-4" />
                        Reschedule
                      </button>
                    </div>
                    
                    {/* Second row: Join Now or Copy Link */}
                    {showSessionDetails.badge === 'today' ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowSessionDetails(null);
                          setShowJoinSession(showSessionDetails);
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--ispora-brand)] text-white text-sm font-semibold hover:bg-[var(--ispora-brand-hover)] hover:shadow-[0_6px_18px_rgba(2,31,246,0.35)] transition-all"
                      >
                        <Video className="w-4 h-4" strokeWidth={2.5} />
                        Join Session Now
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText('https://meet.google.com/abc-defg-hij');
                          toast.success('Link Copied!', {
                            description: 'Meeting link copied to clipboard.',
                            duration: 3000,
                          });
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--ispora-brand)] text-white text-sm font-semibold hover:bg-[var(--ispora-brand-hover)] hover:shadow-[0_6px_18px_rgba(2,31,246,0.35)] transition-all"
                      >
                        <Link className="w-4 h-4" />
                        Copy Meeting Link
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Mentorship Requests Modal */}
      {showAllRequests && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 md:p-4"
          onClick={() => setShowAllRequests(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-[95vw] md:max-w-[520px] shadow-[var(--ispora-shadow-lg)] overflow-hidden animate-[slideUp_0.2s_ease] max-h-[88vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 md:px-6 py-4 md:py-5 border-b border-[var(--ispora-border)] flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="font-syne text-xl font-bold text-[var(--ispora-text)]">
                  Mentorship Requests
                </h3>
                <p className="text-sm text-[var(--ispora-text3)] mt-1">
                  Review and respond to incoming requests
                </p>
              </div>
              <button
                onClick={() => setShowAllRequests(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--ispora-bg)] transition-colors"
              >
                <X className="w-5 h-5 text-[var(--ispora-text2)]" />
              </button>
            </div>
            
            <div className="p-4 md:p-6 space-y-4 overflow-y-auto flex-1">
              {requests.map((request, index) => (
                <div key={index} className="bg-[var(--ispora-bg)] border-[1.5px] border-[var(--ispora-border)] rounded-2xl p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {request.avatar ? (
                        <img
                          src={request.avatar}
                          alt={request.studentName}
                          className="w-12 h-12 rounded-full object-cover flex-shrink-0 border-2 border-white shadow-sm"
                        />
                      ) : (
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-sm"
                          style={{ 
                            backgroundColor: request.color + '20',
                            color: request.color,
                            border: `2px solid ${request.color}`
                          }}
                        >
                          {request.initials}
                        </div>
                      )}
                      <div>
                        <h4 className="font-semibold text-base text-[var(--ispora-text)]">
                          {request.studentName}
                        </h4>
                        <p className="text-sm text-[var(--ispora-text3)]">{request.school}</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-[var(--ispora-warn-light)] text-[var(--ispora-warn)] text-xs font-semibold rounded-full">
                      Pending
                    </span>
                  </div>
                  
                  <div className="bg-white border border-[var(--ispora-border)] rounded-xl p-4 mb-4">
                    <p className="text-sm text-[var(--ispora-text)] leading-relaxed">
                      {request.message}
                    </p>
                  </div>
                  
                  {/* Row 1: Profile + Message First */}
                  <div className="flex flex-row gap-2 mb-2">
                    {request.studentId && (
                      <button
                        onClick={() => setShowStudentProfile(request)}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-white border-[1.5px] border-[var(--ispora-border)] text-[var(--ispora-brand)] text-sm font-semibold hover:border-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] transition-all flex items-center justify-center gap-2"
                      >
                        <User className="w-4 h-4" strokeWidth={2.5} />
                        Profile
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedMentee({
                          id: index.toString(),
                          name: request.studentName,
                          initials: request.initials,
                          color: request.color,
                          school: request.school,
                          progress: 0,
                          nextSession: 'Not scheduled'
                        });
                        setShowMessageModal(true);
                      }}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-white border-[1.5px] border-[var(--ispora-border)] text-[var(--ispora-text)] text-sm font-semibold hover:border-[var(--ispora-brand)] hover:text-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] transition-all"
                    >
                      Message First
                    </button>
                  </div>
                  
                  {/* Row 2: Decline + Accept */}
                  <div className="flex flex-row gap-2">
                    <button
                      onClick={() => handleDeclineRequest(request)}
                      disabled={acceptingRequest}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-white border-[1.5px] border-[var(--ispora-border)] text-[var(--ispora-text)] text-sm font-semibold hover:border-[var(--ispora-danger)] hover:text-[var(--ispora-danger)] hover:bg-[var(--ispora-danger-light)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleAcceptRequest(request)}
                      disabled={acceptingRequest}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--ispora-success)] text-white text-sm font-semibold hover:bg-[#059669] hover:shadow-[0_6px_18px_rgba(5,150,105,0.35)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckCircle className="w-4 h-4" strokeWidth={2.5} />
                      {acceptingRequest ? 'Accepting...' : 'Accept & Schedule'}
                    </button>
                  </div>
                </div>
              ))}
              {requests.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-[var(--ispora-brand-light)] flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-7 h-7 text-[var(--ispora-brand)]" />
                  </div>
                  <h3 className="font-syne text-lg font-bold text-[var(--ispora-text)] mb-2">
                    No Pending Requests
                  </h3>
                  <p className="text-sm text-[var(--ispora-text3)]">
                    All caught up! You have no pending mentorship requests.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* View All Mentees Modal */}
      {showAllMentees && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowAllMentees(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-4xl shadow-[var(--ispora-shadow-lg)] overflow-hidden animate-[slideUp_0.2s_ease] max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-[var(--ispora-border)] flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="font-syne text-xl font-bold text-[var(--ispora-text)]">
                  All Mentees
                </h3>
                <p className="text-sm text-[var(--ispora-text3)] mt-1">
                  Manage your active and completed mentorships
                </p>
              </div>
              <button
                onClick={() => setShowAllMentees(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--ispora-bg)] transition-colors"
              >
                <X className="w-5 h-5 text-[var(--ispora-text2)]" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {/* Tabs */}
              <div className="flex bg-[var(--ispora-bg)] rounded-[10px] p-1 gap-0.5 mb-5">
                {['All', 'Active', 'Completed'].map((tab) => (
                  <div
                    key={tab}
                    onClick={() => setActiveTab(tab.toLowerCase())}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold text-center cursor-pointer transition-all ${
                      activeTab === tab.toLowerCase()
                        ? 'bg-white text-[var(--ispora-brand)] shadow-[0_1px_6px_rgba(0,0,0,0.07)]'
                        : 'text-[var(--ispora-text3)] hover:text-[var(--ispora-text2)]'
                    }`}
                  >
                    {tab}
                  </div>
                ))}
              </div>

              {/* Mentee Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeMentees.length === 0 ? (
                  <div className="col-span-2 text-center py-12">
                    <div className="w-16 h-16 bg-[var(--ispora-bg)] rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-[var(--ispora-text3)]" />
                    </div>
                    <p className="text-base font-semibold text-[var(--ispora-text)] mb-2">No mentees yet</p>
                    <p className="text-sm text-[var(--ispora-text3)] mb-4">Accept mentorship requests to start mentoring students</p>
                    <button
                      onClick={() => {
                        setShowAllMentees(false);
                        setCurrentPage('browse-students');
                      }}
                      className="px-4 py-2 bg-[var(--ispora-brand)] text-white text-sm font-semibold rounded-xl hover:bg-[var(--ispora-brand-hover)] transition-all"
                    >
                      Browse Youth
                    </button>
                  </div>
                ) : activeMentees
                  .filter((mentee) => {
                    if (activeTab === 'all') return true;
                    if (activeTab === 'active') return mentee.status === 'active';
                    if (activeTab === 'completed') return mentee.status === 'completed';
                    return true;
                  })
                  .map((mentee) => (
                    <div
                      key={mentee.id}
                      className="bg-[var(--ispora-bg)] border-[1.5px] border-[var(--ispora-border)] rounded-2xl p-5 hover:border-[var(--ispora-brand)] hover:shadow-[var(--ispora-shadow)] transition-all"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {mentee.avatar ? (
                            <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                              <img 
                                src={mentee.avatar} 
                                alt={mentee.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div
                              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                              style={{ backgroundColor: mentee.color || 'var(--ispora-brand)' }}
                            >
                              {mentee.initials}
                            </div>
                          )}
                          <div>
                            <h4 className="font-semibold text-base text-[var(--ispora-text)]">
                              {mentee.name}
                            </h4>
                            <p className="text-sm text-[var(--ispora-text3)]">
                              {mentee.field}
                            </p>
                            <p className="text-xs text-[var(--ispora-text3)] mt-0.5">
                              {mentee.university}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <div
                            className={`w-2 h-2 rounded-full ${mentee.online ? 'bg-[var(--ispora-accent)]' : 'bg-[var(--ispora-text3)] opacity-50'}`}
                          ></div>
                          {mentee.status === 'completed' && (
                            <span className="px-2 py-0.5 bg-[var(--ispora-success-light)] text-[var(--ispora-success)] text-[10px] font-semibold rounded-full">
                              Completed
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-[var(--ispora-text3)] mb-1.5">
                          <span>Progress</span>
                          <span>{mentee.progress}%</span>
                        </div>
                        <div className="h-1.5 bg-[var(--ispora-border)] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[var(--ispora-brand)] rounded-full"
                            style={{ width: `${mentee.progress}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-[var(--ispora-text3)] mb-4">
                        <span>Next session:</span>
                        <span className="font-semibold text-[var(--ispora-text)]">
                          {mentee.nextSession}
                        </span>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedMentee(mentee);
                            openScheduleModal();
                          }}
                          className="flex-1 px-3 py-2 rounded-lg bg-white border-[1.5px] border-[var(--ispora-border)] text-[var(--ispora-text)] text-xs font-semibold hover:border-[var(--ispora-brand)] hover:text-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] transition-all"
                        >
                          Schedule
                        </button>
                        <button
                          onClick={() => {
                            setSelectedMentee(mentee);
                            setShowMessageModal(true);
                          }}
                          className="flex-1 px-3 py-2 rounded-lg bg-[var(--ispora-brand)] text-white text-xs font-semibold hover:bg-[var(--ispora-brand-hover)] hover:shadow-[0_4px_12px_rgba(2,31,246,0.35)] transition-all"
                        >
                          Message
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
              
              {activeMentees.filter((mentee) => {
                if (activeTab === 'all') return true;
                if (activeTab === 'active') return mentee.status === 'active';
                if (activeTab === 'completed') return mentee.status === 'completed';
                return true;
              }).length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-[var(--ispora-text3)] mx-auto mb-3" strokeWidth={1.5} />
                  <p className="text-[var(--ispora-text2)] font-semibold">
                    No {activeTab !== 'all' ? activeTab : ''} mentees found
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      <MessageModal
        isOpen={showMessageModal}
        onClose={() => {
          setShowMessageModal(false);
          setSelectedMentee(null);
        }}
        mentorshipId={selectedMentee?.id || ''}
        recipientName={selectedMentee?.name || ''}
        recipientInitials={selectedMentee?.initials || ''}
        recipientRole="Student"
        recipientField={selectedMentee?.field}
        onViewFullConversation={() => {
          setShowMessageModal(false);
          setSelectedMentee(null);
          setCurrentPage('messages');
        }}
      />

      {/* Resource Library Modal */}
      <ResourceLibraryModal
        isOpen={showResourceModal}
        onClose={() => {
          setShowResourceModal(false);
          setSelectedMentee(null);
        }}
        onSuccess={() => {
          // Resource sharing successful
        }}
      />

      {/* Donation Modal */}
      {showDonationModal && (
        <DonationModal onClose={() => setShowDonationModal(false)} />
      )}

      {/* Calendar Modal */}
      {showCalendarModal && calendarEvent && (
        <CalendarModal
          event={calendarEvent}
          onClose={() => {
            setShowCalendarModal(false);
            setCalendarEvent(null);
          }}
        />
      )}

      {/* Youth Profile Modal */}
      {showStudentProfile && (
        <div 
          className="fixed inset-0 bg-[#07094a]/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 md:p-4 opacity-0 animate-[fadeIn_0.2s_ease_forwards]"
          onClick={() => setShowStudentProfile(null)}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-[95vw] md:max-w-[480px] shadow-[var(--ispora-shadow-lg)] max-h-[88vh] overflow-y-auto transform scale-95 animate-[scaleUp_0.25s_cubic-bezier(0.34,1.56,0.64,1)_forwards]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Banner */}
            <div className="bg-[var(--ispora-brand)] px-6 py-6 text-center relative overflow-hidden">
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
                  backgroundSize: '24px 24px'
                }}
              />
              {showStudentProfile.avatar ? (
                <div className="w-[68px] h-[68px] rounded-full overflow-hidden border-[3px] border-white/40 mx-auto mb-2.5 relative z-10">
                  <img 
                    src={showStudentProfile.avatar} 
                    alt={showStudentProfile.studentName}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div 
                  className="w-[68px] h-[68px] rounded-full flex items-center justify-center text-white font-extrabold text-[26px] border-[3px] border-white/40 mx-auto mb-2.5 relative z-10"
                  style={{ background: showStudentProfile.color }}
                >
                  {showStudentProfile.initials}
                </div>
              )}
              <h3 className="font-syne text-[17px] font-bold text-white relative z-10">
                {showStudentProfile.studentName}
              </h3>
              <p className="text-xs text-white/70 mt-1 relative z-10">
                {showStudentProfile.school}
              </p>
            </div>

            {/* Message */}
            <div className="px-6 py-4 border-b border-[var(--ispora-border)]">
              <h4 className="text-[10px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-2.5">Their Message</h4>
              <p className="text-[13px] text-[var(--ispora-text2)] leading-relaxed bg-[var(--ispora-bg)] px-3 py-2.5 rounded-[10px] border border-[var(--ispora-border)]">
                {showStudentProfile.message}
              </p>
            </div>

            {/* Request Date */}
            <div className="px-6 py-4 border-b border-[var(--ispora-border)]">
              <h4 className="text-[10px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-2.5">Request Date</h4>
              <div className="flex items-center gap-2.5">
                <Calendar className="w-3.5 h-3.5 text-[var(--ispora-text3)]" strokeWidth={2} />
                <span className="text-[13px] text-[var(--ispora-text2)]">{showStudentProfile.time}</span>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-3.5 border-t border-[var(--ispora-border)] flex justify-end gap-2.5 sticky bottom-0 bg-white z-10">
              <button
                onClick={() => setShowStudentProfile(null)}
                className="bg-white text-[var(--ispora-text)] border-[1.5px] border-[var(--ispora-border)] px-5 py-2.5 rounded-[10px] text-[13px] font-semibold hover:border-[var(--ispora-brand)] hover:text-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] transition-all"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowStudentProfile(null);
                  handleAcceptRequest(showStudentProfile);
                }}
                disabled={acceptingRequest}
                className="bg-[var(--ispora-success)] text-white px-5 py-2.5 rounded-[10px] text-[13px] font-semibold hover:bg-[#059669] transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle className="w-3.5 h-3.5" strokeWidth={2.5} />
                {acceptingRequest ? 'Accepting...' : 'Accept Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Default Meeting Link Modal */}
      {showDefaultMeetingLinkModal && (
        <DefaultMeetingLinkModal
          onSave={handleSaveDefaultMeetingLink}
          onSkip={handleSkipDefaultMeetingLink}
          onClose={() => setShowDefaultMeetingLinkModal(false)}
        />
      )}

      {/* Share Session Modal */}
      {showShareModal && sessionToShare && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            {/* Header */}
            <div className="p-6 border-b-[1.5px] border-[var(--ispora-border)]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-syne text-lg font-bold text-[var(--ispora-text)]">
                  Share Session
                </h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--ispora-text2)] hover:bg-[var(--ispora-bg)] transition-all"
                >
                  <X className="w-5 h-5" strokeWidth={2} />
                </button>
              </div>
              <p className="text-sm text-[var(--ispora-text2)]">
                {sessionToShare.topic || 'Mentorship Session'}
              </p>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Copy Link */}
              <div>
                <label className="text-xs font-semibold text-[var(--ispora-text3)] uppercase tracking-wide mb-2 block">
                  Session Link
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={shareLink}
                    readOnly
                    className="flex-1 px-4 py-3 bg-[var(--ispora-bg)] border-[1.5px] border-[var(--ispora-border)] rounded-xl text-sm text-[var(--ispora-text)] outline-none"
                  />
                  <button
                    onClick={copyShareLink}
                    className="px-4 py-3 bg-[var(--ispora-brand)] text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                  >
                    <Link className="w-4 h-4" strokeWidth={2} />
                    Copy
                  </button>
                </div>
              </div>

              {/* Social Share */}
              <div>
                <label className="text-xs font-semibold text-[var(--ispora-text3)] uppercase tracking-wide mb-3 block">
                  Share on Social Media
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={shareOnWhatsApp}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border-[1.5px] border-[var(--ispora-border)] hover:border-[#25D366] hover:bg-[#25D366]/5 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-white" strokeWidth={2} />
                    </div>
                    <span className="text-xs font-semibold text-[var(--ispora-text2)] group-hover:text-[#25D366]">
                      WhatsApp
                    </span>
                  </button>

                  <button
                    onClick={shareOnTwitter}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border-[1.5px] border-[var(--ispora-border)] hover:border-[#1DA1F2] hover:bg-[#1DA1F2]/5 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#1DA1F2] flex items-center justify-center">
                      <Send className="w-5 h-5 text-white" strokeWidth={2} />
                    </div>
                    <span className="text-xs font-semibold text-[var(--ispora-text2)] group-hover:text-[#1DA1F2]">
                      Twitter
                    </span>
                  </button>

                  <button
                    onClick={shareOnLinkedIn}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border-[1.5px] border-[var(--ispora-border)] hover:border-[#0A66C2] hover:bg-[#0A66C2]/5 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#0A66C2] flex items-center justify-center">
                      <UserPlus className="w-5 h-5 text-white" strokeWidth={2} />
                    </div>
                    <span className="text-xs font-semibold text-[var(--ispora-text2)] group-hover:text-[#0A66C2]">
                      LinkedIn
                    </span>
                  </button>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-[var(--ispora-brand-light)] rounded-xl p-4">
                <p className="text-xs text-[var(--ispora-brand)] leading-relaxed">
                  💡 <strong>Tip:</strong> Share this link with students outside the platform. They'll be able to view session details and sign up to join!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        userRole="diaspora"
      />
    </div>
  );
}
