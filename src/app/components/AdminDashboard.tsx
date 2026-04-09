import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabase';
import { api } from '../lib/api';
import { isValidUrl } from '../utils/urlHelpers';
import { AdminAnalytics } from './AdminAnalytics';
import { SupportRequestsAdmin } from './SupportRequestsAdmin';
import { toast } from 'sonner';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  UserCog,
  TrendingUp,
  MessageSquare,
  Calendar,
  FileText,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  Settings,
  ArrowLeft,
  Eye,
  MapPin,
  Building2,
  Briefcase as BriefcaseIcon,
  GraduationCap,
  Mail,
  Phone,
  Globe,
  Linkedin,
  Twitter,
  ExternalLink,
  Award,
  Lightbulb,
  LogOut,
  Heart,
  Save,
  HelpCircle,
  Download
} from 'lucide-react';

type Tab = 'overview' | 'analytics' | 'users' | 'opportunities' | 'mentorships' | 'sessions' | 'support' | 'settings';

interface Stats {
  users: { 
    total: number; 
    students: number; 
    mentors: number; 
    admins: number;
    newLast30Days: number;
    countries: number;
    universities: number;
    companies: number;
  };
  mentorships: { total: number; active: number; completed: number; ended: number };
  sessions: { 
    total: number; 
    scheduled: number; 
    completed: number; 
    cancelled: number;
    avgDuration: number;
    completionRate: number;
  };
  opportunities: { 
    total: number; 
    internships: number; 
    jobs: number; 
    scholarships: number;
    totalViews: number;
    totalClicks: number;
    clickThroughRate: number;
  };
  requests: { 
    total: number; 
    pending: number; 
    accepted: number; 
    declined: number;
    acceptanceRate: number;
  };
  goals: { 
    total: number; 
    completed: number;
    completionRate: number;
  };
  engagement: {
    totalMessages: number;
    totalResources: number;
    avgMessagesPerMentorship: number;
  };
  geography: {
    topCountries: string[];
    topUniversities: string[];
    topCompanies: string[];
  };
  charts?: {
    monthlyData: Array<{
      month: string;
      users: number;
      students: number;
      mentors: number;
      sessions: number;
      mentorships: number;
    }>;
    topCountries: Array<{ name: string; count: number }>;
    topUniversities: Array<{ name: string; count: number }>;
    opportunityPerformance: Array<{
      id: string;
      title: string;
      company: string;
      type: string;
      views: number;
      clicks: number;
      ctr: number;
      createdAt: string;
    }>;
    topMentors: Array<{
      id: string;
      name: string;
      email: string;
      company: string;
      sessions: number;
      completedSessions: number;
      mentorships: number;
      messages: number;
    }>;
    topStudents: Array<{
      id: string;
      name: string;
      email: string;
      university: string;
      sessions: number;
      mentorships: number;
      messages: number;
      goalsCompleted: number;
    }>;
  };
}

export default function AdminDashboard() {
  const { user, accessToken } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  
  // Opportunity management state
  const [showOpportunityModal, setShowOpportunityModal] = useState(false);
  const [showViewOpportunityModal, setShowViewOpportunityModal] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<any>(null);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loadingOpportunities, setLoadingOpportunities] = useState(false);
  const [savingOpportunity, setSavingOpportunity] = useState(false);
  const [opportunityStatusFilter, setOpportunityStatusFilter] = useState<'all' | 'active' | 'expired' | 'noDeadline'>('all');
  const [selectedOpportunities, setSelectedOpportunities] = useState<string[]>([]);
  const [opportunityForm, setOpportunityForm] = useState({
    type: 'internships',
    title: '',
    company: '',
    location: '',
    field: '',
    eligibility: '',
    compensation: '',
    description: '',
    applicationLink: '',
    deadline: '',
    insiderTip: '',
    tags: ''
  });

  // Users management state
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [deletingSelectedUsers, setDeletingSelectedUsers] = useState(false);
  const [exportingUsers, setExportingUsers] = useState(false);
  const [firstAdminId, setFirstAdminId] = useState<string | null>(null);

  // Mentorships management state
  const [mentorships, setMentorships] = useState<any[]>([]);
  const [loadingMentorships, setLoadingMentorships] = useState(false);
  const [mentorshipStatusFilter, setMentorshipStatusFilter] = useState('all');

  // Sessions management state
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [sessionStatusFilter, setSessionStatusFilter] = useState('all');

  // Donation links state
  const [donationLinks, setDonationLinks] = useState({
    creditCard: { url: '', active: false },
    paypal: { url: '', active: false },
    bankTransfer: { url: '', active: false }
  });
  const [loadingLinks, setLoadingLinks] = useState(false);
  const [savingLinks, setSavingLinks] = useState(false);

  // User detail modal state
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserDetailModal, setShowUserDetailModal] = useState(false);

  // Check if user is admin and load stats
  useEffect(() => {
    const checkAuth = () => {
      console.log('=== Admin Dashboard Auth Check ===');
      console.log('User:', user);
      console.log('User role:', user?.role);
      
      // Note: Session refresh is handled by api.ts getValidToken(), no need to refresh here
      if (user && user.role !== 'admin') {
        console.error('Not an admin user');
        toast.error('Access Denied', {
          description: 'Admin privileges required. You will be redirected to the home page.',
          duration: 4000,
        });
        setTimeout(() => navigate('/'), 1000);
      } else if (!user) {
        console.log('No user found - might still be loading...');
      } else {
        console.log('✓ Admin access confirmed');
        // Load stats only after confirming user is admin
        loadStats();
      }
    };
    
    if (user) {
      checkAuth();
    }
  }, [user, navigate]);

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === 'opportunities') {
      loadOpportunities();
    } else if (activeTab === 'users') {
      setSelectedUsers([]); // Clear selection when entering users tab
      loadUsers();
    } else if (activeTab === 'mentorships') {
      loadMentorships();
    } else if (activeTab === 'sessions') {
      loadSessions();
    } else if (activeTab === 'settings') {
      loadDonationLinks();
    }
  }, [activeTab]);

  // Clear user selection when filters change
  useEffect(() => {
    setSelectedUsers([]);
  }, [userSearch, userRoleFilter]);

  const loadStats = async () => {
    try {
      setLoadingStats(true);
      const data = await api.admin.getStats();
      setStats(data.stats);
    } catch (error: any) {
      console.error('Failed to load stats:', error);
      // Silently fail for auth errors - user will see they need to sign in
      // Only show error for actual API failures
    } finally {
      setLoadingStats(false);
    }
  };

  const loadOpportunities = async () => {
    try {
      setLoadingOpportunities(true);
      const data = await api.admin.getAllOpportunities();
      setOpportunities(data.opportunities || []);
    } catch (error: any) {
      console.error('Failed to load opportunities:', error);
    } finally {
      setLoadingOpportunities(false);
    }
  };

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const data = await api.admin.getUsers({
        role: userRoleFilter !== 'all' ? userRoleFilter : undefined,
        search: userSearch || undefined
      });
      const allUsers = data.users || [];
      setUsers(allUsers);
      
      // Identify the first admin (earliest created admin)
      const admins = allUsers
        .filter((u: any) => u.role === 'admin')
        .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      
      if (admins.length > 0) {
        setFirstAdminId(admins[0].id);
      }
    } catch (error: any) {
      console.error('Failed to load users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadMentorships = async () => {
    try {
      setLoadingMentorships(true);
      const data = await api.admin.getMentorships(
        mentorshipStatusFilter !== 'all' ? mentorshipStatusFilter : undefined
      );
      setMentorships(data.mentorships || []);
    } catch (error: any) {
      console.error('Failed to load mentorships:', error);
    } finally {
      setLoadingMentorships(false);
    }
  };

  const loadSessions = async () => {
    try {
      setLoadingSessions(true);
      const data = await api.admin.getSessions(
        sessionStatusFilter !== 'all' ? sessionStatusFilter : undefined
      );
      setSessions(data.sessions || []);
    } catch (error: any) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoadingSessions(false);
    }
  };

  const loadDonationLinks = async () => {
    try {
      setLoadingLinks(true);
      const data = await api.admin.getDonationLinks();
      setDonationLinks(data.links || {
        creditCard: { url: '', active: false },
        paypal: { url: '', active: false },
        bankTransfer: { url: '', active: false }
      });
    } catch (error: any) {
      console.error('Failed to load donation links:', error);
    } finally {
      setLoadingLinks(false);
    }
  };

  const saveDonationLinks = async () => {
    try {
      setSavingLinks(true);
      await api.admin.updateDonationLinks(donationLinks);
      alert('Donation links updated successfully!');
    } catch (error: any) {
      console.error('Failed to save donation links:', error);
      alert('Failed to save donation links: ' + error.message);
    } finally {
      setSavingLinks(false);
    }
  };

  // Helper function to check if a user can be deleted
  const canDeleteUser = (userId: string) => {
    return userId !== firstAdminId;
  };

  const handleDeleteSelectedUsers = async () => {
    if (selectedUsers.length === 0) {
      toast.error('No users selected');
      return;
    }

    // Filter out the first admin from deletion
    const usersToDelete = selectedUsers.filter(userId => canDeleteUser(userId));
    const protectedCount = selectedUsers.length - usersToDelete.length;

    if (usersToDelete.length === 0) {
      toast.error('Cannot delete the primary admin account');
      return;
    }

    let confirmMessage = `Are you sure you want to delete ${usersToDelete.length} user(s)? This action cannot be undone.`;
    if (protectedCount > 0) {
      confirmMessage += `\n\nNote: ${protectedCount} user(s) cannot be deleted (primary admin account is protected).`;
    }

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setDeletingSelectedUsers(true);
      
      // Delete users one by one (excluding protected users)
      const deletePromises = usersToDelete.map(userId => api.admin.deleteUser(userId));
      await Promise.all(deletePromises);
      
      if (protectedCount > 0) {
        toast.success(`Successfully deleted ${usersToDelete.length} user(s). ${protectedCount} protected user(s) were skipped.`);
      } else {
        toast.success(`Successfully deleted ${usersToDelete.length} user(s)`);
      }
      
      // Clear selection and reload users
      setSelectedUsers([]);
      await loadUsers();
    } catch (error: any) {
      console.error('Error deleting users:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to delete some users';
      toast.error(errorMessage);
    } finally {
      setDeletingSelectedUsers(false);
    }
  };

  const handleExportUsers = () => {
    try {
      setExportingUsers(true);
      
      // Prepare CSV data
      const headers = ['ID', 'First Name', 'Last Name', 'Email', 'Role', 'Status', 'Joined Date'];
      const csvData = [
        headers.join(','),
        ...users.map(u => [
          u.id,
          `"${u.firstName || ''}"`,
          `"${u.lastName || ''}"`,
          `"${u.email || ''}"`,
          u.role === 'diaspora' ? 'Mentor' : (u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1) : 'N/A'),
          'Active',
          new Date(u.createdAt).toISOString()
        ].join(','))
      ].join('\n');
      
      // Create blob and download
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `ispora-users-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Exported ${users.length} users successfully`);
    } catch (error) {
      console.error('Error exporting users:', error);
      toast.error('Failed to export users');
    } finally {
      setExportingUsers(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    // Don't allow selecting the first admin
    if (!canDeleteUser(userId)) {
      toast.error('Cannot select the primary admin account for deletion');
      return;
    }
    
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleAllUsers = () => {
    if (selectedUsers.length > 0) {
      setSelectedUsers([]);
    } else {
      // Select all users except the first admin
      setSelectedUsers(users.filter(u => canDeleteUser(u.id)).map(u => u.id));
    }
  };

  const handleCreateOpportunity = async () => {
    if (!opportunityForm.title || !opportunityForm.company || !opportunityForm.location || 
        !opportunityForm.field || !opportunityForm.eligibility || !opportunityForm.description || 
        !opportunityForm.applicationLink || !opportunityForm.deadline) {
      alert('Please fill in all required fields including application link');
      return;
    }

    // Validate URL format
    if (!isValidUrl(opportunityForm.applicationLink)) {
      alert('Please enter a valid application URL (e.g., https://example.com/apply)');
      return;
    }

    try {
      setSavingOpportunity(true);
      
      // Map form fields to API fields
      await api.admin.createOpportunity({
        type: opportunityForm.type,
        title: opportunityForm.title,
        company: opportunityForm.company,
        location: opportunityForm.location,
        field: opportunityForm.field,
        description: opportunityForm.description,
        requirements: opportunityForm.eligibility, // Map eligibility to requirements
        applicationLink: opportunityForm.applicationLink,
        deadline: opportunityForm.deadline,
        salary: opportunityForm.compensation || undefined, // Map compensation to salary
        tip: opportunityForm.insiderTip || undefined,
        tags: opportunityForm.tags ? opportunityForm.tags.split(',').map(t => t.trim()) : []
      });
      
      alert('Opportunity posted successfully!');
      setShowOpportunityModal(false);
      setOpportunityForm({
        type: 'internships',
        title: '',
        company: '',
        location: '',
        field: '',
        eligibility: '',
        compensation: '',
        description: '',
        applicationLink: '',
        deadline: '',
        insiderTip: '',
        tags: ''
      });
      loadOpportunities();
    } catch (error: any) {
      console.error('Failed to create opportunity:', error);
      alert('Failed to post opportunity');
    } finally {
      setSavingOpportunity(false);
    }
  };

  const handleDeleteOpportunity = async (opportunityId: string) => {
    if (!confirm('Are you sure you want to delete this opportunity?')) return;

    try {
      await api.admin.deleteOpportunity(opportunityId);
      alert('Opportunity deleted successfully');
      loadOpportunities();
    } catch (error: any) {
      console.error('Failed to delete opportunity:', error);
      alert('Failed to delete opportunity');
    }
  };

  const handleViewOpportunity = (opportunity: any) => {
    setSelectedOpportunity(opportunity);
    setShowViewOpportunityModal(true);
  };

  // Conditional rendering for auth check - all hooks must be called before this
  if (!user || user.role !== 'admin') {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[var(--ispora-brand)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[var(--ispora-bg)]">
      {/* Header */}
      <div className="bg-white border-b border-[var(--ispora-border)] px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-sm font-medium text-[var(--ispora-text2)] hover:text-[var(--ispora-brand)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Platform
            </button>
            <div className="w-px h-5 bg-[var(--ispora-border)]" />
            <h1 className="font-syne text-xl font-bold text-[var(--ispora-text)]">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-[var(--ispora-text3)]">
              Logged in as <span className="font-semibold text-[var(--ispora-brand)]">{user.firstName} {user.lastName}</span>
            </div>
            <button
              onClick={async () => {
                if (confirm('Are you sure you want to logout?')) {
                  await supabase.auth.signOut();
                  navigate('/auth');
                }
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[var(--ispora-error)] hover:bg-red-50 rounded-lg transition-colors border border-[var(--ispora-border)]"
            >
              <LogOut className="w-4 h-4" strokeWidth={2} />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-[var(--ispora-border)] px-6 flex items-center gap-1 flex-shrink-0">
        {[
          { key: 'overview', label: 'Overview', icon: LayoutDashboard },
          { key: 'analytics', label: 'Analytics', icon: TrendingUp },
          { key: 'users', label: 'Users', icon: Users },
          { key: 'opportunities', label: 'Opportunities', icon: Briefcase },
          { key: 'mentorships', label: 'Mentorships', icon: UserCog },
          { key: 'sessions', label: 'Sessions', icon: Calendar },
          { key: 'support', label: 'Support', icon: HelpCircle },
          { key: 'settings', label: 'Settings', icon: Settings }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as Tab)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
                activeTab === tab.key
                  ? 'text-[var(--ispora-brand)] border-[var(--ispora-brand)]'
                  : 'text-[var(--ispora-text3)] border-transparent hover:text-[var(--ispora-brand)]'
              }`}
            >
              <Icon className="w-4 h-4" strokeWidth={2} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-syne text-2xl font-bold text-[var(--ispora-text)]">Platform Analytics</h2>
              <button
                onClick={() => loadStats()}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] rounded-lg transition-colors"
              >
                <TrendingUp className="w-4 h-4" strokeWidth={2} />
                Refresh
              </button>
            </div>
            
            {loadingStats ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 text-[var(--ispora-brand)] animate-spin mx-auto mb-2" />
                <p className="text-sm text-[var(--ispora-text3)]">Loading comprehensive analytics...</p>
              </div>
            ) : stats ? (
              <div className="space-y-6">
                {/* Primary Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Users Stats */}
                <div key="users-stat" className="bg-white rounded-xl border border-[var(--ispora-border)] p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-[var(--ispora-brand-light)] flex items-center justify-center">
                      <Users className="w-5 h-5 text-[var(--ispora-brand)]" strokeWidth={2} />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-[var(--ispora-text)]">{stats.users.total}</div>
                      <div className="text-xs text-[var(--ispora-text3)]">Total Users</div>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div key="students" className="flex justify-between">
                      <span className="text-[var(--ispora-text3)]">Students</span>
                      <span className="font-semibold text-[var(--ispora-text)]">{stats.users.students}</span>
                    </div>
                    <div key="mentors" className="flex justify-between">
                      <span className="text-[var(--ispora-text3)]">Mentors</span>
                      <span className="font-semibold text-[var(--ispora-text)]">{stats.users.mentors}</span>
                    </div>
                    <div key="admins" className="flex justify-between">
                      <span className="text-[var(--ispora-text3)]">Admins</span>
                      <span className="font-semibold text-[var(--ispora-text)]">{stats.users.admins}</span>
                    </div>
                  </div>
                </div>

                {/* Mentorships Stats */}
                <div key="mentorships-stat" className="bg-white rounded-xl border border-[var(--ispora-border)] p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-[var(--ispora-success-light)] flex items-center justify-center">
                      <UserCog className="w-5 h-5 text-[var(--ispora-success)]" strokeWidth={2} />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-[var(--ispora-text)]">{stats.mentorships.total}</div>
                      <div className="text-xs text-[var(--ispora-text3)]">Mentorships</div>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div key="active" className="flex justify-between">
                      <span className="text-[var(--ispora-text3)]">Active</span>
                      <span className="font-semibold text-[var(--ispora-success)]">{stats.mentorships.active}</span>
                    </div>
                    <div key="completed" className="flex justify-between">
                      <span className="text-[var(--ispora-text3)]">Completed</span>
                      <span className="font-semibold text-[var(--ispora-text)]">{stats.mentorships.completed}</span>
                    </div>
                  </div>
                </div>

                {/* Sessions Stats */}
                <div key="sessions-stat" className="bg-white rounded-xl border border-[var(--ispora-border)] p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-[var(--ispora-accent-light)] flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-[var(--ispora-accent)]" strokeWidth={2} />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-[var(--ispora-text)]">{stats.sessions.total}</div>
                      <div className="text-xs text-[var(--ispora-text3)]">Sessions</div>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div key="scheduled" className="flex justify-between">
                      <span className="text-[var(--ispora-text3)]">Scheduled</span>
                      <span className="font-semibold text-[var(--ispora-text)]">{stats.sessions.scheduled}</span>
                    </div>
                    <div key="sessions-completed" className="flex justify-between">
                      <span className="text-[var(--ispora-text3)]">Completed</span>
                      <span className="font-semibold text-[var(--ispora-success)]">{stats.sessions.completed}</span>
                    </div>
                  </div>
                </div>

                {/* Opportunities Stats */}
                <div key="opportunities-stat" className="bg-white rounded-xl border border-[var(--ispora-border)] p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-[var(--ispora-warn-light)] flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-[var(--ispora-warn)]" strokeWidth={2} />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-[var(--ispora-text)]">{stats.opportunities.total}</div>
                      <div className="text-xs text-[var(--ispora-text3)]">Opportunities</div>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div key="internships" className="flex justify-between">
                      <span className="text-[var(--ispora-text3)]">Internships</span>
                      <span className="font-semibold text-[var(--ispora-text)]">{stats.opportunities.internships}</span>
                    </div>
                    <div key="jobs" className="flex justify-between">
                      <span className="text-[var(--ispora-text3)]">Jobs</span>
                      <span className="font-semibold text-[var(--ispora-text)]">{stats.opportunities.jobs}</span>
                    </div>
                    <div key="scholarships" className="flex justify-between">
                      <span className="text-[var(--ispora-text3)]">Scholarships</span>
                      <span className="font-semibold text-[var(--ispora-text)]">{stats.opportunities.scholarships}</span>
                    </div>
                  </div>
                </div>
                </div>

                {/* Growth & Geography Analytics */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Growth Metrics */}
                  <div className="bg-white rounded-xl border border-[var(--ispora-border)] p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="w-5 h-5 text-[var(--ispora-brand)]" strokeWidth={2} />
                      <h3 className="font-syne font-bold text-[var(--ispora-text)]">Growth Metrics</h3>
                    </div>
                    <div className="space-y-3">
                      <div key="new-users">
                        <div className="text-2xl font-bold text-[var(--ispora-brand)]">{stats.users.newLast30Days}</div>
                        <div className="text-xs text-[var(--ispora-text3)]">New users (30 days)</div>
                      </div>
                      <div key="growth-stats" className="pt-3 border-t border-[var(--ispora-border)]">
                        <div key="countries" className="flex items-center justify-between text-xs mb-1">
                          <span className="text-[var(--ispora-text3)]">Countries</span>
                          <span className="font-bold text-[var(--ispora-text)]">{stats.users.countries}</span>
                        </div>
                        <div key="universities" className="flex items-center justify-between text-xs mb-1">
                          <span className="text-[var(--ispora-text3)]">Universities</span>
                          <span className="font-bold text-[var(--ispora-text)]">{stats.users.universities}</span>
                        </div>
                        <div key="companies" className="flex items-center justify-between text-xs">
                          <span className="text-[var(--ispora-text3)]">Companies</span>
                          <span className="font-bold text-[var(--ispora-text)]">{stats.users.companies}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Engagement Metrics */}
                  <div className="bg-white rounded-xl border border-[var(--ispora-border)] p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <MessageSquare className="w-5 h-5 text-[var(--ispora-success)]" strokeWidth={2} />
                      <h3 className="font-syne font-bold text-[var(--ispora-text)]">Engagement</h3>
                    </div>
                    <div className="space-y-3">
                      <div key="total-messages">
                        <div className="text-2xl font-bold text-[var(--ispora-success)]">{stats.engagement.totalMessages}</div>
                        <div className="text-xs text-[var(--ispora-text3)]">Total messages</div>
                      </div>
                      <div key="engagement-stats" className="pt-3 border-t border-[var(--ispora-border)]">
                        <div key="resources" className="flex items-center justify-between text-xs mb-1">
                          <span className="text-[var(--ispora-text3)]">Resources shared</span>
                          <span className="font-bold text-[var(--ispora-text)]">{stats.engagement.totalResources}</span>
                        </div>
                        <div key="avg-msg" className="flex items-center justify-between text-xs">
                          <span className="text-[var(--ispora-text3)]">Avg msg/mentorship</span>
                          <span className="font-bold text-[var(--ispora-text)]">{stats.engagement.avgMessagesPerMentorship}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Success Metrics */}
                  <div className="bg-white rounded-xl border border-[var(--ispora-border)] p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Award className="w-5 h-5 text-[var(--ispora-accent)]" strokeWidth={2} />
                      <h3 className="font-syne font-bold text-[var(--ispora-text)]">Success Rates</h3>
                    </div>
                    <div className="space-y-3">
                      <div key="acceptance-rate">
                        <div className="text-2xl font-bold text-[var(--ispora-accent)]">{stats.requests.acceptanceRate}%</div>
                        <div className="text-xs text-[var(--ispora-text3)]">Mentor acceptance rate</div>
                      </div>
                      <div key="success-stats" className="pt-3 border-t border-[var(--ispora-border)]">
                        <div key="session-completion" className="flex items-center justify-between text-xs mb-1">
                          <span className="text-[var(--ispora-text3)]">Session completion</span>
                          <span className="font-bold text-[var(--ispora-text)]">{stats.sessions.completionRate}%</span>
                        </div>
                        <div key="goal-completion" className="flex items-center justify-between text-xs">
                          <span className="text-[var(--ispora-text3)]">Goal completion</span>
                          <span className="font-bold text-[var(--ispora-text)]">{stats.goals.completionRate}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Opportunity Impact & Session Analytics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Opportunity Impact */}
                  <div className="bg-white rounded-xl border border-[var(--ispora-border)] p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Briefcase className="w-5 h-5 text-[var(--ispora-warn)]" strokeWidth={2} />
                      <h3 className="font-syne font-bold text-[var(--ispora-text)]">Opportunity Impact</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-xl font-bold text-[var(--ispora-text)]">{stats.opportunities.total}</div>
                        <div className="text-xs text-[var(--ispora-text3)]">Posted</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-[var(--ispora-brand)]">{stats.opportunities.totalViews}</div>
                        <div className="text-xs text-[var(--ispora-text3)]">Total views</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-[var(--ispora-success)]">{stats.opportunities.totalClicks}</div>
                        <div className="text-xs text-[var(--ispora-text3)]">Applications</div>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-[var(--ispora-border)]">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[var(--ispora-text3)]">Click-through rate</span>
                        <span className="font-bold text-[var(--ispora-brand)]">{stats.opportunities.clickThroughRate}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Session Analytics */}
                  <div className="bg-white rounded-xl border border-[var(--ispora-border)] p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Calendar className="w-5 h-5 text-[var(--ispora-accent)]" strokeWidth={2} />
                      <h3 className="font-syne font-bold text-[var(--ispora-text)]">Session Analytics</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-xl font-bold text-[var(--ispora-text)]">{stats.sessions.total}</div>
                        <div className="text-xs text-[var(--ispora-text3)]">Total</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-[var(--ispora-success)]">{stats.sessions.completed}</div>
                        <div className="text-xs text-[var(--ispora-text3)]">Completed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-[var(--ispora-brand)]">{stats.sessions.avgDuration}m</div>
                        <div className="text-xs text-[var(--ispora-text3)]">Avg duration</div>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-[var(--ispora-border)]">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[var(--ispora-text3)]">Completion rate</span>
                        <span className="font-bold text-[var(--ispora-success)]">{stats.sessions.completionRate}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Geographic Reach */}
                <div className="bg-white rounded-xl border border-[var(--ispora-border)] p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Globe className="w-5 h-5 text-[var(--ispora-brand)]" strokeWidth={2} />
                    <h3 className="font-syne font-bold text-[var(--ispora-text)]">Geographic Reach</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="text-sm font-semibold text-[var(--ispora-text)] mb-2">Top Countries</h4>
                      <div className="space-y-2">
                        {stats.geography.topCountries.length > 0 ? (
                          stats.geography.topCountries.slice(0, 5).map((country, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5 text-[var(--ispora-text3)]" strokeWidth={2} />
                              <span className="text-xs text-[var(--ispora-text)]">{country}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-[var(--ispora-text3)]">No data yet</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-[var(--ispora-text)] mb-2">Top Universities</h4>
                      <div className="space-y-2">
                        {stats.geography.topUniversities.length > 0 ? (
                          stats.geography.topUniversities.slice(0, 5).map((uni, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <GraduationCap className="w-3.5 h-3.5 text-[var(--ispora-text3)]" strokeWidth={2} />
                              <span className="text-xs text-[var(--ispora-text)]">{uni}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-[var(--ispora-text3)]">No data yet</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-[var(--ispora-text)] mb-2">Top Companies</h4>
                      <div className="space-y-2">
                        {stats.geography.topCompanies.length > 0 ? (
                          stats.geography.topCompanies.slice(0, 5).map((company, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <BriefcaseIcon className="w-3.5 h-3.5 text-[var(--ispora-text3)]" strokeWidth={2} />
                              <span className="text-xs text-[var(--ispora-text)]">{company}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-[var(--ispora-text3)]">No data yet</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl border border-[var(--ispora-border)] p-6">
                  <h3 className="font-syne text-lg font-bold text-[var(--ispora-text)] mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  onClick={() => {
                    setActiveTab('opportunities');
                    setTimeout(() => setShowOpportunityModal(true), 100);
                  }}
                  className="flex items-center gap-3 p-4 rounded-lg border-2 border-[var(--ispora-border)] hover:border-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] transition-all text-left"
                >
                  <Plus className="w-5 h-5 text-[var(--ispora-brand)]" strokeWidth={2} />
                  <div>
                    <div className="font-semibold text-sm text-[var(--ispora-text)]">Post Opportunity</div>
                    <div className="text-xs text-[var(--ispora-text3)]">Add internship, job or scholarship</div>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className="flex items-center gap-3 p-4 rounded-lg border-2 border-[var(--ispora-border)] hover:border-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] transition-all text-left"
                >
                  <Users className="w-5 h-5 text-[var(--ispora-brand)]" strokeWidth={2} />
                  <div>
                    <div className="font-semibold text-sm text-[var(--ispora-text)]">Manage Users</div>
                    <div className="text-xs text-[var(--ispora-text3)]">View and manage all users</div>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('mentorships')}
                  className="flex items-center gap-3 p-4 rounded-lg border-2 border-[var(--ispora-border)] hover:border-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] transition-all text-left"
                >
                  <TrendingUp className="w-5 h-5 text-[var(--ispora-brand)]" strokeWidth={2} />
                  <div>
                    <div className="font-semibold text-sm text-[var(--ispora-text)]">View Mentorships</div>
                    <div className="text-xs text-[var(--ispora-text3)]">Monitor platform activity</div>
                  </div>
                </button>
              </div>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-syne text-2xl font-bold text-[var(--ispora-text)]">Detailed Analytics & Reports</h2>
                <p className="text-sm text-[var(--ispora-text3)] mt-1">Comprehensive data visualization and performance metrics</p>
              </div>
              <button
                onClick={() => loadStats()}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] rounded-lg transition-colors"
              >
                <TrendingUp className="w-4 h-4" strokeWidth={2} />
                Refresh Data
              </button>
            </div>

            {loadingStats ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 text-[var(--ispora-brand)] animate-spin mx-auto mb-2" />
                <p className="text-sm text-[var(--ispora-text3)]">Loading analytics...</p>
              </div>
            ) : stats ? (
              <AdminAnalytics stats={stats} />
            ) : (
              <div className="text-center py-12">
                <p className="text-[var(--ispora-text3)]">No analytics data available</p>
              </div>
            )}
          </div>
        )}

        {/* Opportunities Tab */}
        {activeTab === 'opportunities' && (
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-syne text-2xl font-bold text-[var(--ispora-text)]">All Opportunities</h2>
                <p className="text-sm text-[var(--ispora-text3)] mt-1">Viewing all opportunities posted by admins, mentors, and students</p>
              </div>
              <button
                onClick={() => setShowOpportunityModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--ispora-brand)] text-white rounded-lg hover:bg-[#0118c4] transition-colors font-semibold text-sm"
              >
                <Plus className="w-4 h-4" strokeWidth={2.5} />
                Post Opportunity
              </button>
            </div>

            {/* Filters */}
            {!loadingOpportunities && opportunities.length > 0 && (
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedOpportunities.length === opportunities.length && opportunities.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedOpportunities(opportunities.map(o => o.id));
                      } else {
                        setSelectedOpportunities([]);
                      }
                    }}
                    className="w-4 h-4 text-[var(--ispora-brand)] border-[var(--ispora-border)] rounded focus:ring-[var(--ispora-brand)]"
                  />
                  <label className="text-sm font-medium text-[var(--ispora-text2)]">Select All</label>
                </div>
                <div className="h-6 w-px bg-[var(--ispora-border)]"></div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-[var(--ispora-text2)]">Status:</label>
                  <select
                    value={opportunityStatusFilter}
                    onChange={(e) => {
                      setOpportunityStatusFilter(e.target.value as any);
                      setSelectedOpportunities([]);
                    }}
                    className="px-3 py-2 text-sm border border-[var(--ispora-border)] rounded-lg bg-white text-[var(--ispora-text)] outline-none focus:border-[var(--ispora-brand)] transition-colors"
                  >
                    <option value="all">All Opportunities</option>
                    <option value="active">Active (with deadline)</option>
                    <option value="expired">Expired</option>
                    <option value="noDeadline">No Deadline</option>
                  </select>
                </div>
                {selectedOpportunities.length > 0 ? (
                  <button
                    onClick={async () => {
                      if (confirm(`Delete ${selectedOpportunities.length} selected opportunities?`)) {
                        for (const id of selectedOpportunities) {
                          await handleDeleteOpportunity(id);
                        }
                        setSelectedOpportunities([]);
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--ispora-danger)] text-white rounded-lg hover:bg-red-700 transition-colors font-semibold text-sm"
                  >
                    <Trash2 className="w-4 h-4" strokeWidth={2} />
                    Delete {selectedOpportunities.length} Selected
                  </button>
                ) : (() => {
                  const now = new Date();
                  const expiredOpps = opportunities.filter(o => o.deadline && new Date(o.deadline) < now);
                  return expiredOpps.length > 0 && (
                    <button
                      onClick={async () => {
                        if (confirm(`Delete all ${expiredOpps.length} expired opportunities? This action cannot be undone.`)) {
                          for (const opp of expiredOpps) {
                            await handleDeleteOpportunity(opp.id);
                          }
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold text-sm"
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={2} />
                      Delete All Expired ({expiredOpps.length})
                    </button>
                  );
                })()}
              </div>
            )}

            {/* Stats Cards */}
            {!loadingOpportunities && opportunities.length > 0 && (() => {
              const now = new Date();
              const expiredCount = opportunities.filter(o => o.deadline && new Date(o.deadline) < now).length;
              const activeCount = opportunities.filter(o => o.deadline && new Date(o.deadline) >= now).length;
              const noDeadlineCount = opportunities.filter(o => !o.deadline).length;

              return (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white rounded-xl border border-[var(--ispora-border)] p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[var(--ispora-brand-light)] flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-[var(--ispora-brand)]" strokeWidth={2} />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-[var(--ispora-text)]">{opportunities.length}</div>
                        <div className="text-xs text-[var(--ispora-text3)]">Total Opportunities</div>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-[var(--ispora-border)] p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[var(--ispora-success-light)] flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-[var(--ispora-success)]" strokeWidth={2} />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-[var(--ispora-text)]">{activeCount}</div>
                      <div className="text-xs text-[var(--ispora-text3)]">Active</div>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-[var(--ispora-border)] p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-red-600" strokeWidth={2} />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-[var(--ispora-text)]">{expiredCount}</div>
                      <div className="text-xs text-[var(--ispora-text3)]">Expired</div>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-[var(--ispora-border)] p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-gray-600" strokeWidth={2} />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-[var(--ispora-text)]">{noDeadlineCount}</div>
                      <div className="text-xs text-[var(--ispora-text3)]">No Deadline</div>
                    </div>
                  </div>
                </div>
              </div>
              );
            })()}

            {loadingOpportunities ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 text-[var(--ispora-brand)] animate-spin mx-auto mb-2" />
                <p className="text-sm text-[var(--ispora-text3)]">Loading opportunities...</p>
              </div>
            ) : opportunities.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-[var(--ispora-border)]">
                <Briefcase className="w-12 h-12 text-[var(--ispora-text3)] mx-auto mb-3" strokeWidth={1.5} />
                <h3 className="font-semibold text-[var(--ispora-text)] mb-2">No opportunities yet</h3>
                <p className="text-sm text-[var(--ispora-text3)] mb-4">Start by posting your first opportunity</p>
                <button
                  onClick={() => setShowOpportunityModal(true)}
                  className="px-4 py-2 bg-[var(--ispora-brand)] text-white rounded-lg hover:bg-[#0118c4] transition-colors font-semibold text-sm"
                >
                  Post Opportunity
                </button>
              </div>
            ) : (() => {
              // Filter opportunities based on status
              const now = new Date();
              const filteredOpps = opportunities.filter(opp => {
                if (opportunityStatusFilter === 'all') return true;
                if (opportunityStatusFilter === 'noDeadline') return !opp.deadline;
                if (opportunityStatusFilter === 'active') {
                  if (!opp.deadline) return false;
                  return new Date(opp.deadline) >= now;
                }
                if (opportunityStatusFilter === 'expired') {
                  if (!opp.deadline) return false;
                  return new Date(opp.deadline) < now;
                }
                return true;
              });

              return filteredOpps.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-[var(--ispora-border)]">
                  <Briefcase className="w-12 h-12 text-[var(--ispora-text3)] mx-auto mb-3" strokeWidth={1.5} />
                  <h3 className="font-semibold text-[var(--ispora-text)] mb-2">No opportunities found</h3>
                  <p className="text-sm text-[var(--ispora-text3)]">Try changing your filter</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredOpps.map(opp => {
                    const isExpired = opp.deadline && new Date(opp.deadline) < now;
                    const isSelected = selectedOpportunities.includes(opp.id);
                    return (
                      <div
                        key={opp.id}
                        className={`bg-white rounded-xl border p-5 transition-all ${
                          isExpired ? 'border-red-300 bg-red-50/30' : 'border-[var(--ispora-border)] hover:border-[var(--ispora-brand)]'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedOpportunities([...selectedOpportunities, opp.id]);
                              } else {
                                setSelectedOpportunities(selectedOpportunities.filter(id => id !== opp.id));
                              }
                            }}
                            className="mt-1 w-4 h-4 text-[var(--ispora-brand)] border-[var(--ispora-border)] rounded focus:ring-[var(--ispora-brand)]"
                          />
                          <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="font-semibold text-[var(--ispora-text)]">{opp.title}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            opp.type === 'internships' ? 'bg-[var(--ispora-brand-light)] text-[var(--ispora-brand)]' :
                            opp.type === 'jobs' ? 'bg-[var(--ispora-success-light)] text-[var(--ispora-success)]' :
                            opp.type === 'scholarships' ? 'bg-[var(--ispora-accent-light)] text-[var(--ispora-accent)]' :
                            opp.type === 'fellowships' ? 'bg-purple-100 text-purple-700' :
                            opp.type === 'accelerators' ? 'bg-orange-100 text-orange-700' :
                            opp.type === 'hackathons' ? 'bg-green-100 text-green-700' :
                            opp.type === 'conferences' ? 'bg-pink-100 text-pink-700' :
                            opp.type === 'grants' ? 'bg-teal-100 text-teal-700' :
                            opp.type === 'competitions' ? 'bg-red-100 text-red-700' :
                            opp.type === 'others' ? 'bg-gray-100 text-gray-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {opp.type === 'internships' ? 'Internship' : 
                             opp.type === 'jobs' ? 'Job' : 
                             opp.type === 'scholarships' ? 'Scholarship' :
                             opp.type === 'fellowships' ? 'Fellowship' :
                             opp.type === 'accelerators' ? 'Accelerator' :
                             opp.type === 'hackathons' ? 'Hackathon' :
                             opp.type === 'conferences' ? 'Conference' :
                             opp.type === 'grants' ? 'Grant' :
                             opp.type === 'competitions' ? 'Competition' :
                             opp.type === 'others' ? 'Others' :
                             opp.type}
                          </span>
                          {opp.postedByAdmin && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-[var(--ispora-warn-light)] text-[var(--ispora-warn)]">
                              Admin Post
                            </span>
                          )}
                          {isExpired && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700">
                              Expired
                            </span>
                          )}
                          {!opp.deadline && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-700">
                              No Deadline
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[var(--ispora-text2)] mb-2">
                          {opp.company} • {opp.location}
                          {opp.deadline && (
                            <span className={`ml-2 ${isExpired ? 'text-red-600 font-semibold' : 'text-[var(--ispora-text3)]'}`}>
                              • Deadline: {new Date(opp.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          )}
                        </p>
                        {opp.poster && (
                          <p className="text-xs text-[var(--ispora-text3)] mb-2">
                            Posted by: <span className="font-medium text-[var(--ispora-text2)]">
                              {opp.poster.firstName} {opp.poster.lastName}
                            </span> ({opp.poster.role === 'diaspora' ? 'Mentor' : opp.poster.role === 'student' ? 'Student' : 'Admin'})
                          </p>
                        )}
                        <p className="text-sm text-[var(--ispora-text3)] line-clamp-2">{opp.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewOpportunity(opp)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] rounded-lg transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" strokeWidth={2} />
                          View
                        </button>
                        <button
                          onClick={() => handleDeleteOpportunity(opp.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[var(--ispora-danger)] hover:bg-[var(--ispora-danger-light)] rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                          Delete
                        </button>
                        </div>
                      </div>
                    </div>
                  );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="max-w-7xl mx-auto">
            <h2 className="font-syne text-2xl font-bold text-[var(--ispora-text)] mb-6">User Management</h2>
            
            {/* Filters */}
            <div className="flex gap-3 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ispora-text3)]" strokeWidth={2} />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search users..."
                  className="w-full bg-white border border-[var(--ispora-border)] rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:border-[var(--ispora-brand)] transition-all"
                />
              </div>
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="bg-white border border-[var(--ispora-border)] rounded-lg px-4 py-2 text-sm outline-none focus:border-[var(--ispora-brand)] transition-all"
              >
                <option value="all">All Roles</option>
                <option value="student">Students</option>
                <option value="diaspora">Mentors</option>
                <option value="admin">Admins</option>
              </select>
              <button
                onClick={loadUsers}
                className="px-4 py-2 bg-[var(--ispora-brand)] text-white rounded-lg hover:bg-[#0118c4] transition-colors font-semibold text-sm"
              >
                Search
              </button>
            </div>

            {/* Bulk Actions */}
            {!loadingUsers && users.length > 0 && (
              <div className="flex items-center justify-between mb-4 p-4 bg-[var(--ispora-bg)] rounded-lg border border-[var(--ispora-border)]">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === users.length}
                    onChange={toggleAllUsers}
                    className="w-4 h-4 text-[var(--ispora-brand)] border-[var(--ispora-border)] rounded focus:ring-[var(--ispora-brand)]"
                  />
                  <span className="text-sm text-[var(--ispora-text2)]">
                    {selectedUsers.length > 0 ? `${selectedUsers.length} selected` : 'Select all'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleExportUsers}
                    disabled={exportingUsers}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-[var(--ispora-brand)] bg-white border border-[var(--ispora-brand)] rounded-lg hover:bg-[var(--ispora-brand-light)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {exportingUsers ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" strokeWidth={2} />
                        Export Users
                      </>
                    )}
                  </button>
                  {selectedUsers.length > 0 && (
                    <button
                      onClick={handleDeleteSelectedUsers}
                      disabled={deletingSelectedUsers}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-[var(--ispora-danger)] rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deletingSelectedUsers ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" strokeWidth={2} />
                          Delete Selected ({selectedUsers.length})
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}

            {loadingUsers ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 text-[var(--ispora-brand)] animate-spin mx-auto mb-2" />
                <p className="text-sm text-[var(--ispora-text3)]">Loading users...</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-[var(--ispora-border)] overflow-hidden">
                <table className="w-full">
                  <thead className="bg-[var(--ispora-bg)] border-b border-[var(--ispora-border)]">
                    <tr>
                      <th className="px-3 py-3 w-12">
                        <input
                          type="checkbox"
                          checked={selectedUsers.length === users.length && users.length > 0}
                          onChange={toggleAllUsers}
                          className="w-4 h-4 text-[var(--ispora-brand)] border-[var(--ispora-border)] rounded focus:ring-[var(--ispora-brand)]"
                        />
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--ispora-text2)]">Name</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--ispora-text2)]">Email</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--ispora-text2)]">Role</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--ispora-text2)]">Status</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--ispora-text2)]">Joined</th>
                      <th className="px-5 py-3 text-center text-xs font-semibold text-[var(--ispora-text2)]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, idx) => (
                      <tr key={u.id} className={idx !== users.length - 1 ? 'border-b border-[var(--ispora-border)]' : ''}>
                        <td className="px-3 py-3">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(u.id)}
                            onChange={() => toggleUserSelection(u.id)}
                            disabled={!canDeleteUser(u.id)}
                            className="w-4 h-4 text-[var(--ispora-brand)] border-[var(--ispora-border)] rounded focus:ring-[var(--ispora-brand)] disabled:opacity-30 disabled:cursor-not-allowed"
                            title={!canDeleteUser(u.id) ? 'Primary admin account cannot be deleted' : ''}
                          />
                        </td>
                        <td className="px-5 py-3 text-sm font-medium text-[var(--ispora-text)]">
                          <div className="flex items-center gap-2">
                            <span>{u.firstName} {u.lastName}</span>
                            {!canDeleteUser(u.id) && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium whitespace-nowrap">
                                Primary Admin
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-sm text-[var(--ispora-text2)]">{u.email}</td>
                        <td className="px-5 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            u.role === 'admin' ? 'bg-[var(--ispora-danger-light)] text-[var(--ispora-danger)]' :
                            u.role === 'diaspora' ? 'bg-[var(--ispora-brand-light)] text-[var(--ispora-brand)]' :
                            'bg-[var(--ispora-success-light)] text-[var(--ispora-success)]'
                          }`}>
                            {u.role === 'diaspora' ? 'Mentor' : (u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1) : 'N/A')}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-xs px-2 py-1 rounded-full font-medium bg-[var(--ispora-success-light)] text-[var(--ispora-success)]">
                            Active
                          </span>
                        </td>
                        <td className="px-5 py-3 text-sm text-[var(--ispora-text3)]">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setShowUserDetailModal(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] rounded-lg transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" strokeWidth={2} />
                            View Details
                          </button>
                          <button
                            onClick={async () => {
                              if (!canDeleteUser(u.id)) {
                                toast.error('Cannot delete the primary admin account. This is a protected account to ensure platform access.');
                                return;
                              }
                              
                              if (window.confirm(`Are you sure you want to delete ${u.firstName} ${u.lastName}? This action cannot be undone.`)) {
                                setDeletingUserId(u.id);
                                try {
                                  await api.admin.deleteUser(u.id);
                                  toast.success('User deleted successfully');
                                  // Refresh users list
                                  await loadUsers();
                                } catch (error: any) {
                                  console.error('Error deleting user:', error);
                                  const errorMessage = error?.response?.data?.error || error?.message || 'Failed to delete user';
                                  toast.error(errorMessage);
                                } finally {
                                  setDeletingUserId(null);
                                }
                              }
                            }}
                            disabled={deletingUserId === u.id || !canDeleteUser(u.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 ml-2 text-xs font-semibold text-[var(--ispora-danger)] hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title={!canDeleteUser(u.id) ? 'Primary admin account cannot be deleted' : ''}
                          >
                            {deletingUserId === u.id ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} />
                                Deleting...
                              </>
                            ) : (
                              <>
                                <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                                Delete
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Mentorships Tab */}
        {activeTab === 'mentorships' && (
          <div className="max-w-7xl mx-auto">
            <h2 className="font-syne text-2xl font-bold text-[var(--ispora-text)] mb-6">Mentorship Management</h2>
            
            {/* Filters */}
            <div className="flex gap-3 mb-6">
              <select
                value={mentorshipStatusFilter}
                onChange={(e) => setMentorshipStatusFilter(e.target.value)}
                className="bg-white border border-[var(--ispora-border)] rounded-lg px-4 py-2 text-sm outline-none focus:border-[var(--ispora-brand)] transition-all"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="ended">Ended</option>
              </select>
              <button
                onClick={loadMentorships}
                className="px-4 py-2 bg-[var(--ispora-brand)] text-white rounded-lg hover:bg-[#0118c4] transition-colors font-semibold text-sm"
              >
                Search
              </button>
            </div>

            {loadingMentorships ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 text-[var(--ispora-brand)] animate-spin mx-auto mb-2" />
                <p className="text-sm text-[var(--ispora-text3)]">Loading mentorships...</p>
              </div>
            ) : mentorships.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-[var(--ispora-border)]">
                <UserCog className="w-12 h-12 text-[var(--ispora-text3)] mx-auto mb-3" strokeWidth={1.5} />
                <h3 className="font-semibold text-[var(--ispora-text)] mb-2">No mentorships found</h3>
                <p className="text-sm text-[var(--ispora-text3)]">
                  {mentorshipStatusFilter !== 'all' 
                    ? `No ${mentorshipStatusFilter} mentorships at the moment` 
                    : 'No mentorships have been created yet'}
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-[var(--ispora-border)] overflow-hidden">
                <table className="w-full">
                  <thead className="bg-[var(--ispora-bg)] border-b border-[var(--ispora-border)]">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--ispora-text2)]">Mentor</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--ispora-text2)]">Student</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--ispora-text2)]">Status</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--ispora-text2)]">Started</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--ispora-text2)]">Ended</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mentorships.map((m, idx) => (
                      <tr key={m.id} className={idx !== mentorships.length - 1 ? 'border-b border-[var(--ispora-border)]' : ''}>
                        <td className="px-5 py-3 text-sm font-medium text-[var(--ispora-text)]">
                          {m.mentor.firstName} {m.mentor.lastName}
                        </td>
                        <td className="px-5 py-3 text-sm font-medium text-[var(--ispora-text)]">
                          {m.student.firstName} {m.student.lastName}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            m.status === 'active' ? 'bg-[var(--ispora-success-light)] text-[var(--ispora-success)]' :
                            m.status === 'completed' ? 'bg-[var(--ispora-brand-light)] text-[var(--ispora-brand)]' :
                            'bg-[var(--ispora-warn-light)] text-[var(--ispora-warn)]'
                          }`}>
                            {m.status ? m.status.charAt(0).toUpperCase() + m.status.slice(1) : 'N/A'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-sm text-[var(--ispora-text3)]">
                          {m.startedAt ? new Date(m.startedAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-5 py-3 text-sm text-[var(--ispora-text3)]">
                          {m.endedAt ? new Date(m.endedAt).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Sessions Tab */}
        {activeTab === 'sessions' && (
          <div className="max-w-7xl mx-auto">
            <h2 className="font-syne text-2xl font-bold text-[var(--ispora-text)] mb-6">Session Management</h2>
            
            {/* Filters */}
            <div className="flex gap-3 mb-6">
              <select
                value={sessionStatusFilter}
                onChange={(e) => setSessionStatusFilter(e.target.value)}
                className="bg-white border border-[var(--ispora-border)] rounded-lg px-4 py-2 text-sm outline-none focus:border-[var(--ispora-brand)] transition-all"
              >
                <option value="all">All Statuses</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <button
                onClick={loadSessions}
                className="px-4 py-2 bg-[var(--ispora-brand)] text-white rounded-lg hover:bg-[#0118c4] transition-colors font-semibold text-sm"
              >
                Search
              </button>
            </div>

            {loadingSessions ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 text-[var(--ispora-brand)] animate-spin mx-auto mb-2" />
                <p className="text-sm text-[var(--ispora-text3)]">Loading sessions...</p>
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-[var(--ispora-border)]">
                <Calendar className="w-12 h-12 text-[var(--ispora-text3)] mx-auto mb-3" strokeWidth={1.5} />
                <h3 className="font-semibold text-[var(--ispora-text)] mb-2">No sessions found</h3>
                <p className="text-sm text-[var(--ispora-text3)]">
                  {sessionStatusFilter !== 'all' 
                    ? `No ${sessionStatusFilter} sessions at the moment` 
                    : 'No sessions have been created yet'}
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-[var(--ispora-border)] overflow-hidden">
                <table className="w-full">
                  <thead className="bg-[var(--ispora-bg)] border-b border-[var(--ispora-border)]">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--ispora-text2)]">Mentor</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--ispora-text2)]">Student</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--ispora-text2)]">Status</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--ispora-text2)]">Scheduled</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--ispora-text2)]">Completed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((s, idx) => (
                      <tr key={s.id} className={idx !== sessions.length - 1 ? 'border-b border-[var(--ispora-border)]' : ''}>
                        <td className="px-5 py-3 text-sm font-medium text-[var(--ispora-text)]">
                          {s.mentor ? `${s.mentor.firstName || ''} ${s.mentor.lastName || ''}`.trim() || 'N/A' : 'N/A'}
                        </td>
                        <td className="px-5 py-3 text-sm font-medium text-[var(--ispora-text)]">
                          {s.student ? `${s.student.firstName || ''} ${s.student.lastName || ''}`.trim() || 'N/A' : 'N/A'}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            s.status === 'scheduled' ? 'bg-[var(--ispora-accent-light)] text-[var(--ispora-accent)]' :
                            s.status === 'completed' ? 'bg-[var(--ispora-brand-light)] text-[var(--ispora-brand)]' :
                            'bg-[var(--ispora-warn-light)] text-[var(--ispora-warn)]'
                          }`}>
                            {s.status ? s.status.charAt(0).toUpperCase() + s.status.slice(1) : 'N/A'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-sm text-[var(--ispora-text3)]">
                          {s.scheduledAt ? new Date(s.scheduledAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-5 py-3 text-sm text-[var(--ispora-text3)]">
                          {s.completedAt ? new Date(s.completedAt).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Support Tab */}
        {activeTab === 'support' && accessToken && (
          <div>
            <div className="mb-6">
              <h2 className="font-syne text-2xl font-bold text-[var(--ispora-text)]">Support Requests</h2>
              <p className="text-sm text-[var(--ispora-text3)] mt-1">Manage and respond to user support requests</p>
            </div>
            <SupportRequestsAdmin accessToken={accessToken} />
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h2 className="font-syne text-2xl font-bold text-[var(--ispora-text)]">Platform Settings</h2>
              <p className="text-sm text-[var(--ispora-text3)] mt-1">Manage donation links and other platform configurations</p>
            </div>

            {loadingLinks ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 text-[var(--ispora-brand)] animate-spin mx-auto mb-2" />
                <p className="text-sm text-[var(--ispora-text3)]">Loading settings...</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-[var(--ispora-border)] p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-[var(--ispora-brand-light)] flex items-center justify-center">
                    <Heart className="w-5 h-5 text-[var(--ispora-brand)]" strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="font-syne text-lg font-bold text-[var(--ispora-text)]">Donation Links</h3>
                    <p className="text-xs text-[var(--ispora-text3)]">Configure external payment links for donations</p>
                  </div>
                </div>

                <div className="space-y-5">
                  {/* Credit Card Link */}
                  <div className="p-4 border border-[var(--ispora-border)] rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-sm font-semibold text-[var(--ispora-text)]">Credit Card Payment</h4>
                        <p className="text-xs text-[var(--ispora-text3)] mt-0.5">Stripe, Square, or other credit card processors</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={donationLinks.creditCard.active}
                          onChange={(e) => setDonationLinks({
                            ...donationLinks,
                            creditCard: { ...donationLinks.creditCard, active: e.target.checked }
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[var(--ispora-brand)]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--ispora-brand)]"></div>
                        <span className="ml-2 text-xs font-medium text-[var(--ispora-text2)]">
                          {donationLinks.creditCard.active ? 'Active' : 'Inactive'}
                        </span>
                      </label>
                    </div>
                    <input
                      type="url"
                      value={donationLinks.creditCard.url}
                      onChange={(e) => setDonationLinks({
                        ...donationLinks,
                        creditCard: { ...donationLinks.creditCard, url: e.target.value }
                      })}
                      placeholder="https://stripe.com/donate/..."
                      disabled={!donationLinks.creditCard.active}
                      className="w-full px-4 py-2.5 border border-[var(--ispora-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--ispora-brand)] focus:ring-2 focus:ring-[var(--ispora-brand)]/20 transition-all disabled:bg-gray-50 disabled:text-gray-400"
                    />
                  </div>

                  {/* PayPal Link */}
                  <div className="p-4 border border-[var(--ispora-border)] rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-sm font-semibold text-[var(--ispora-text)]">PayPal Payment</h4>
                        <p className="text-xs text-[var(--ispora-text3)] mt-0.5">PayPal.me or PayPal donation links</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={donationLinks.paypal.active}
                          onChange={(e) => setDonationLinks({
                            ...donationLinks,
                            paypal: { ...donationLinks.paypal, active: e.target.checked }
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[var(--ispora-brand)]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--ispora-brand)]"></div>
                        <span className="ml-2 text-xs font-medium text-[var(--ispora-text2)]">
                          {donationLinks.paypal.active ? 'Active' : 'Inactive'}
                        </span>
                      </label>
                    </div>
                    <input
                      type="url"
                      value={donationLinks.paypal.url}
                      onChange={(e) => setDonationLinks({
                        ...donationLinks,
                        paypal: { ...donationLinks.paypal, url: e.target.value }
                      })}
                      placeholder="https://paypal.me/..."
                      disabled={!donationLinks.paypal.active}
                      className="w-full px-4 py-2.5 border border-[var(--ispora-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--ispora-brand)] focus:ring-2 focus:ring-[var(--ispora-brand)]/20 transition-all disabled:bg-gray-50 disabled:text-gray-400"
                    />
                  </div>

                  {/* Bank Transfer Link */}
                  <div className="p-4 border border-[var(--ispora-border)] rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-sm font-semibold text-[var(--ispora-text)]">Bank Transfer</h4>
                        <p className="text-xs text-[var(--ispora-text3)] mt-0.5">Direct bank transfer or wire instructions</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={donationLinks.bankTransfer.active}
                          onChange={(e) => setDonationLinks({
                            ...donationLinks,
                            bankTransfer: { ...donationLinks.bankTransfer, active: e.target.checked }
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[var(--ispora-brand)]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--ispora-brand)]"></div>
                        <span className="ml-2 text-xs font-medium text-[var(--ispora-text2)]">
                          {donationLinks.bankTransfer.active ? 'Active' : 'Inactive'}
                        </span>
                      </label>
                    </div>
                    <input
                      type="url"
                      value={donationLinks.bankTransfer.url}
                      onChange={(e) => setDonationLinks({
                        ...donationLinks,
                        bankTransfer: { ...donationLinks.bankTransfer, url: e.target.value }
                      })}
                      placeholder="https://docs.google.com/document/..."
                      disabled={!donationLinks.bankTransfer.active}
                      className="w-full px-4 py-2.5 border border-[var(--ispora-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--ispora-brand)] focus:ring-2 focus:ring-[var(--ispora-brand)]/20 transition-all disabled:bg-gray-50 disabled:text-gray-400"
                    />
                  </div>

                  {/* Info Box */}
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
                      <div className="text-xs text-blue-800 leading-relaxed">
                        <p className="font-semibold mb-1">How it works:</p>
                        <ul className="list-disc list-inside space-y-0.5 ml-1">
                          <li>Users click "Donate Now" from their dashboards</li>
                          <li>Only <strong>active</strong> payment methods will be shown to donors</li>
                          <li>When users select a method, they're redirected to your configured URL</li>
                          <li>Toggle payment methods on/off anytime based on availability</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--ispora-border)]">
                    <button
                      onClick={saveDonationLinks}
                      disabled={savingLinks}
                      className="flex items-center gap-2 px-5 py-2.5 bg-[var(--ispora-brand)] text-white rounded-lg font-semibold text-sm hover:bg-[#0118c4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {savingLinks ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" strokeWidth={2} />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Opportunity Modal */}
      {showOpportunityModal && (
        <div
          className="fixed inset-0 bg-[rgba(7,9,74,0.5)] backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowOpportunityModal(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-2xl shadow-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-[var(--ispora-border)] flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h3 className="font-syne text-lg font-bold text-[var(--ispora-text)]">Post an Opportunity</h3>
                <p className="text-xs text-[var(--ispora-text2)] mt-0.5">Share something that could change a student's life</p>
              </div>
              <button
                onClick={() => setShowOpportunityModal(false)}
                className="w-7 h-7 rounded-lg hover:bg-[var(--ispora-bg)] flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-[var(--ispora-text2)]" strokeWidth={2.5} />
              </button>
            </div>

            {/* Admin Verification Note */}
            <div className="px-6 pt-4 pb-2">
              <div className="bg-[var(--ispora-brand-light)] border border-[var(--ispora-brand)]/20 rounded-lg px-3 py-2.5 flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-[var(--ispora-brand)] mt-0.5 flex-shrink-0" strokeWidth={2.5} />
                <p className="text-xs text-[var(--ispora-text2)]">
                  As a <span className="font-semibold text-[var(--ispora-brand)]">verified admin</span>, your post will go live immediately and be marked as Ispora-verified.
                </p>
              </div>
            </div>

            {/* Form */}
            <div className="px-6 py-5 space-y-4">
              {/* Opportunity Type */}
              <div>
                <label className="block text-sm font-semibold text-[var(--ispora-text)] mb-1.5">
                  Opportunity type <span className="text-[var(--ispora-danger)]">*</span>
                </label>
                <select
                  value={opportunityForm.type}
                  onChange={(e) => setOpportunityForm({ ...opportunityForm, type: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-[var(--ispora-border)] rounded-lg text-sm outline-none focus:border-[var(--ispora-brand)] transition-all"
                >
                  <option value="internships">Internship</option>
                  <option value="jobs">Job</option>
                  <option value="scholarships">Scholarship</option>
                  <option value="fellowships">Fellowship</option>
                  <option value="accelerators">Accelerator</option>
                  <option value="hackathons">Hackathon</option>
                  <option value="conferences">Conference</option>
                  <option value="grants">Grant</option>
                  <option value="competitions">Competition</option>
                  <option value="others">Others</option>
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-[var(--ispora-text)] mb-1.5">
                  Title <span className="text-[var(--ispora-danger)]">*</span>
                </label>
                <input
                  type="text"
                  value={opportunityForm.title}
                  onChange={(e) => setOpportunityForm({ ...opportunityForm, title: e.target.value })}
                  placeholder="e.g., Software Engineering Intern"
                  className="w-full px-3.5 py-2.5 bg-white border border-[var(--ispora-border)] rounded-lg text-sm outline-none focus:border-[var(--ispora-brand)] transition-all"
                />
              </div>

              {/* Organisation / Company */}
              <div>
                <label className="block text-sm font-semibold text-[var(--ispora-text)] mb-1.5">
                  Organisation / Company <span className="text-[var(--ispora-danger)]">*</span>
                </label>
                <input
                  type="text"
                  value={opportunityForm.company}
                  onChange={(e) => setOpportunityForm({ ...opportunityForm, company: e.target.value })}
                  placeholder="e.g., Google, Microsoft, Gates Foundation"
                  className="w-full px-3.5 py-2.5 bg-white border border-[var(--ispora-border)] rounded-lg text-sm outline-none focus:border-[var(--ispora-brand)] transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--ispora-text)] mb-1.5">
                  Title <span className="text-[var(--ispora-danger)]">*</span>
                </label>
                <input
                  type="text"
                  value={opportunityForm.title}
                  onChange={(e) => setOpportunityForm({ ...opportunityForm, title: e.target.value })}
                  placeholder="e.g., Software Engineering Intern"
                  className="w-full px-3.5 py-2.5 bg-white border border-[var(--ispora-border)] rounded-lg text-sm outline-none focus:border-[var(--ispora-brand)] transition-all"
                />
              </div>

              {/* Location / Country */}
              <div>
                <label className="block text-sm font-semibold text-[var(--ispora-text)] mb-1.5">
                  Location / Country <span className="text-[var(--ispora-danger)]">*</span>
                </label>
                <input
                  type="text"
                  value={opportunityForm.location}
                  onChange={(e) => setOpportunityForm({ ...opportunityForm, location: e.target.value })}
                  placeholder="e.g., London, UK or Remote"
                  className="w-full px-3.5 py-2.5 bg-white border border-[var(--ispora-border)] rounded-lg text-sm outline-none focus:border-[var(--ispora-brand)] transition-all"
                />
              </div>

              {/* Field / Sector */}
              <div>
                <label className="block text-sm font-semibold text-[var(--ispora-text)] mb-1.5">
                  Field / Sector <span className="text-[var(--ispora-danger)]">*</span>
                </label>
                <input
                  type="text"
                  value={opportunityForm.field}
                  onChange={(e) => setOpportunityForm({ ...opportunityForm, field: e.target.value })}
                  placeholder="e.g., Software Engineering, Finance, Healthcare"
                  className="w-full px-3.5 py-2.5 bg-white border border-[var(--ispora-border)] rounded-lg text-sm outline-none focus:border-[var(--ispora-brand)] transition-all"
                />
              </div>

              {/* Application Deadline */}
              <div>
                <label className="block text-sm font-semibold text-[var(--ispora-text)] mb-1.5">
                  Application deadline <span className="text-[var(--ispora-danger)]">*</span>
                </label>
                <input
                  type="date"
                  value={opportunityForm.deadline}
                  onChange={(e) => setOpportunityForm({ ...opportunityForm, deadline: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-[var(--ispora-border)] rounded-lg text-sm outline-none focus:border-[var(--ispora-brand)] transition-all"
                />
              </div>

              {/* Eligibility */}
              <div>
                <label className="block text-sm font-semibold text-[var(--ispora-text)] mb-1.5">
                  Eligibility <span className="text-[var(--ispora-danger)]">*</span>
                </label>
                <textarea
                  value={opportunityForm.eligibility}
                  onChange={(e) => setOpportunityForm({ ...opportunityForm, eligibility: e.target.value })}
                  placeholder="e.g., Open to Nigerian students in Computer Science or related fields, minimum 2.1 GPA..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-white border border-[var(--ispora-border)] rounded-lg text-sm outline-none focus:border-[var(--ispora-brand)] transition-all resize-none"
                />
              </div>

              {/* Compensation / Stipend */}
              <div>
                <label className="block text-sm font-semibold text-[var(--ispora-text)] mb-1.5">
                  Compensation / Stipend (optional)
                </label>
                <input
                  type="text"
                  value={opportunityForm.compensation}
                  onChange={(e) => setOpportunityForm({ ...opportunityForm, compensation: e.target.value })}
                  placeholder="e.g., £30,000/year, $5,000 stipend, Unpaid"
                  className="w-full px-3.5 py-2.5 bg-white border border-[var(--ispora-border)] rounded-lg text-sm outline-none focus:border-[var(--ispora-brand)] transition-all"
                />
              </div>

              {/* Description & How to Apply */}
              <div>
                <label className="block text-sm font-semibold text-[var(--ispora-text)] mb-1.5">
                  Description & how to apply <span className="text-[var(--ispora-danger)]">*</span>
                </label>
                <textarea
                  value={opportunityForm.description}
                  onChange={(e) => setOpportunityForm({ ...opportunityForm, description: e.target.value })}
                  placeholder="Provide a detailed description of the opportunity and instructions on how to apply..."
                  rows={5}
                  className="w-full px-3.5 py-2.5 bg-white border border-[var(--ispora-border)] rounded-lg text-sm outline-none focus:border-[var(--ispora-brand)] transition-all resize-none"
                />
              </div>

              {/* Application Link */}
              <div>
                <label className="block text-sm font-semibold text-[var(--ispora-text)] mb-1.5">
                  Application link (URL) <span className="text-[var(--ispora-danger)]">*</span>
                </label>
                <input
                  type="url"
                  value={opportunityForm.applicationLink}
                  onChange={(e) => setOpportunityForm({ ...opportunityForm, applicationLink: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 bg-white border border-[var(--ispora-border)] rounded-lg text-sm outline-none focus:border-[var(--ispora-brand)] transition-all"
                />
              </div>

              {/* Insider Tip */}
              <div>
                <label className="block text-sm font-semibold text-[var(--ispora-text)] mb-1.5">
                  Insider tip (optional)
                </label>
                <textarea
                  value={opportunityForm.insiderTip}
                  onChange={(e) => setOpportunityForm({ ...opportunityForm, insiderTip: e.target.value })}
                  placeholder="Any insider advice or tips that could help applicants stand out..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 bg-white border border-[var(--ispora-border)] rounded-lg text-sm outline-none focus:border-[var(--ispora-brand)] transition-all resize-none"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-semibold text-[var(--ispora-text)] mb-1.5">
                  Tags (comma-separated, optional)
                </label>
                <input
                  type="text"
                  value={opportunityForm.tags}
                  onChange={(e) => setOpportunityForm({ ...opportunityForm, tags: e.target.value })}
                  placeholder="e.g., Tech, Remote, UK, Full-time"
                  className="w-full px-3.5 py-2.5 bg-white border border-[var(--ispora-border)] rounded-lg text-sm outline-none focus:border-[var(--ispora-brand)] transition-all"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[var(--ispora-border)] flex items-center justify-end gap-3 sticky bottom-0 bg-white">
              <button
                onClick={() => setShowOpportunityModal(false)}
                className="px-4 py-2 text-sm font-semibold text-[var(--ispora-text2)] hover:bg-[var(--ispora-bg)] rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateOpportunity}
                disabled={savingOpportunity}
                className="px-4 py-2 text-sm font-semibold bg-[var(--ispora-brand)] text-white rounded-lg hover:bg-[#0118c4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {savingOpportunity && <Loader2 className="w-4 h-4 animate-spin" />}
                {savingOpportunity ? 'Posting...' : 'Post Opportunity'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Opportunity Modal */}
      {showViewOpportunityModal && selectedOpportunity && (
        <div
          className="fixed inset-0 bg-[rgba(7,9,74,0.5)] backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowViewOpportunityModal(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-3xl shadow-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white z-10 px-6 py-5 border-b border-[var(--ispora-border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--ispora-brand-light)] flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-[var(--ispora-brand)]" strokeWidth={2} />
                </div>
                <div>
                  <h2 className="font-syne text-xl font-bold text-[var(--ispora-text)]">Opportunity Details</h2>
                  <p className="text-xs text-[var(--ispora-text3)]">Full opportunity information</p>
                </div>
              </div>
              <button
                onClick={() => setShowViewOpportunityModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--ispora-text3)] hover:bg-[var(--ispora-bg)] transition-colors"
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-6 space-y-6">
              {/* Title & Type */}
              <div>
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <h3 className="text-2xl font-bold text-[var(--ispora-text)]">{selectedOpportunity.title}</h3>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                    selectedOpportunity.type === 'internships' ? 'bg-[var(--ispora-brand-light)] text-[var(--ispora-brand)]' :
                    selectedOpportunity.type === 'jobs' ? 'bg-[var(--ispora-success-light)] text-[var(--ispora-success)]' :
                    selectedOpportunity.type === 'scholarships' ? 'bg-[var(--ispora-accent-light)] text-[var(--ispora-accent)]' :
                    selectedOpportunity.type === 'fellowships' ? 'bg-purple-100 text-purple-700' :
                    selectedOpportunity.type === 'accelerators' ? 'bg-orange-100 text-orange-700' :
                    selectedOpportunity.type === 'hackathons' ? 'bg-green-100 text-green-700' :
                    selectedOpportunity.type === 'conferences' ? 'bg-pink-100 text-pink-700' :
                    selectedOpportunity.type === 'grants' ? 'bg-teal-100 text-teal-700' :
                    selectedOpportunity.type === 'competitions' ? 'bg-red-100 text-red-700' :
                    selectedOpportunity.type === 'others' ? 'bg-gray-100 text-gray-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {selectedOpportunity.type === 'internships' ? 'Internship' :
                     selectedOpportunity.type === 'jobs' ? 'Job' :
                     selectedOpportunity.type === 'scholarships' ? 'Scholarship' :
                     selectedOpportunity.type === 'fellowships' ? 'Fellowship' :
                     selectedOpportunity.type === 'accelerators' ? 'Accelerator' :
                     selectedOpportunity.type === 'hackathons' ? 'Hackathon' :
                     selectedOpportunity.type === 'conferences' ? 'Conference' :
                     selectedOpportunity.type === 'grants' ? 'Grant' :
                     selectedOpportunity.type === 'competitions' ? 'Competition' :
                     selectedOpportunity.type === 'others' ? 'Others' :
                     selectedOpportunity.type}
                  </span>
                  {selectedOpportunity.postedByAdmin && (
                    <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-[var(--ispora-warn-light)] text-[var(--ispora-warn)]">
                      Admin Post
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-[var(--ispora-text2)]">
                  <Building2 className="w-4 h-4" strokeWidth={2} />
                  <span className="font-medium">{selectedOpportunity.company}</span>
                  <span className="text-[var(--ispora-text3)]">•</span>
                  <MapPin className="w-4 h-4" strokeWidth={2} />
                  <span>{selectedOpportunity.location}</span>
                </div>
              </div>

              {/* Posted By */}
              {selectedOpportunity.poster && (
                <div className="bg-[var(--ispora-bg)] rounded-xl p-4 border border-[var(--ispora-border)]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--ispora-brand-light)] flex items-center justify-center">
                      <Users className="w-5 h-5 text-[var(--ispora-brand)]" strokeWidth={2} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[var(--ispora-text)]">Posted by</div>
                      <div className="text-sm text-[var(--ispora-text2)]">
                        {selectedOpportunity.poster.firstName} {selectedOpportunity.poster.lastName}
                        <span className="text-[var(--ispora-text3)]"> • </span>
                        <span className="capitalize">
                          {selectedOpportunity.poster.role === 'diaspora' ? 'Mentor' :
                           selectedOpportunity.poster.role === 'student' ? 'Student' : 'Admin'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Field & Eligibility */}
              <div className="grid grid-cols-2 gap-4">
                {selectedOpportunity.field && (
                  <div>
                    <div className="text-xs font-semibold text-[var(--ispora-text3)] mb-1">Field / Sector</div>
                    <div className="text-sm text-[var(--ispora-text)] font-medium">{selectedOpportunity.field}</div>
                  </div>
                )}
                {selectedOpportunity.eligibility && (
                  <div>
                    <div className="text-xs font-semibold text-[var(--ispora-text3)] mb-1">Eligibility</div>
                    <div className="text-sm text-[var(--ispora-text)] font-medium">{selectedOpportunity.eligibility}</div>
                  </div>
                )}
              </div>

              {/* Compensation & Deadline */}
              <div className="grid grid-cols-2 gap-4">
                {selectedOpportunity.compensation && (
                  <div>
                    <div className="text-xs font-semibold text-[var(--ispora-text3)] mb-1">Compensation</div>
                    <div className="text-sm text-[var(--ispora-text)] font-medium">{selectedOpportunity.compensation}</div>
                  </div>
                )}
                {selectedOpportunity.deadline && (
                  <div>
                    <div className="text-xs font-semibold text-[var(--ispora-text3)] mb-1">Application Deadline</div>
                    <div className="text-sm text-[var(--ispora-text)] font-medium">{selectedOpportunity.deadline}</div>
                  </div>
                )}
              </div>

              {/* Description */}
              {selectedOpportunity.description && (
                <div>
                  <div className="text-sm font-semibold text-[var(--ispora-text)] mb-2">Description</div>
                  <div className="text-sm text-[var(--ispora-text2)] whitespace-pre-wrap leading-relaxed">
                    {selectedOpportunity.description}
                  </div>
                </div>
              )}

              {/* Insider Tip */}
              {selectedOpportunity.insiderTip && (
                <div className="bg-[var(--ispora-accent-light)] border border-[rgba(255,165,0,0.3)] rounded-xl p-4">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-[var(--ispora-accent)] flex-shrink-0 mt-0.5" strokeWidth={2} />
                    <div>
                      <div className="text-sm font-semibold text-[var(--ispora-text)] mb-1">Insider Tip</div>
                      <div className="text-sm text-[var(--ispora-text2)] leading-relaxed">
                        {selectedOpportunity.insiderTip}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Application Link */}
              {selectedOpportunity.applicationLink && (
                <div>
                  <a
                    href={selectedOpportunity.applicationLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-[var(--ispora-brand)] text-white rounded-lg hover:bg-[#0118c4] transition-colors font-semibold text-sm"
                  >
                    <ExternalLink className="w-4 h-4" strokeWidth={2} />
                    View Application
                  </a>
                </div>
              )}

              {/* Metadata */}
              <div className="pt-4 border-t border-[var(--ispora-border)]">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[var(--ispora-text3)]">Opportunity ID:</span>
                    <span className="ml-1 text-[var(--ispora-text2)] font-mono">{selectedOpportunity.id}</span>
                  </div>
                  {selectedOpportunity.createdAt && (
                    <div>
                      <span className="text-[var(--ispora-text3)]">Posted:</span>
                      <span className="ml-1 text-[var(--ispora-text2)]">
                        {new Date(selectedOpportunity.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[var(--ispora-border)] flex items-center justify-end gap-3 sticky bottom-0 bg-white">
              <button
                onClick={() => setShowViewOpportunityModal(false)}
                className="px-4 py-2 text-sm font-semibold text-[var(--ispora-text2)] hover:bg-[var(--ispora-bg)] rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to delete this opportunity?')) {
                    handleDeleteOpportunity(selectedOpportunity.id);
                    setShowViewOpportunityModal(false);
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-[var(--ispora-danger)] text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" strokeWidth={2} />
                Delete Opportunity
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      {showUserDetailModal && selectedUser && (
        <div
          className="fixed inset-0 bg-[rgba(7,9,74,0.5)] backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowUserDetailModal(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-3xl shadow-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-[var(--ispora-border)] flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="font-syne text-lg font-bold text-[var(--ispora-text)]">
                  {selectedUser.firstName} {selectedUser.lastName}
                </h3>
                <p className="text-sm text-[var(--ispora-text3)] mt-0.5">
                  {selectedUser.role === 'diaspora' ? 'Mentor' : (selectedUser.role ? selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1) : 'User')} Profile
                </p>
              </div>
              <button
                onClick={() => setShowUserDetailModal(false)}
                className="w-7 h-7 rounded-lg hover:bg-[var(--ispora-bg)] flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-[var(--ispora-text2)]" strokeWidth={2.5} />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-5 space-y-6">
              {/* Basic Info */}
              <div>
                <h4 className="font-syne text-sm font-bold text-[var(--ispora-text)] mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" strokeWidth={2} />
                  Basic Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[var(--ispora-brand-light)] flex items-center justify-center flex-shrink-0">
                      <Mail className="w-4 h-4 text-[var(--ispora-brand)]" strokeWidth={2} />
                    </div>
                    <div>
                      <div className="text-xs text-[var(--ispora-text3)] mb-0.5">Email</div>
                      <div className="text-sm font-medium text-[var(--ispora-text)]">{selectedUser.email}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[var(--ispora-success-light)] flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-4 h-4 text-[var(--ispora-success)]" strokeWidth={2} />
                    </div>
                    <div>
                      <div className="text-xs text-[var(--ispora-text3)] mb-0.5">Joined</div>
                      <div className="text-sm font-medium text-[var(--ispora-text)]">
                        {new Date(selectedUser.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Details - Check if user has any profile fields filled */}
              {(selectedUser.university || selectedUser.course || selectedUser.yearOfStudy || 
                selectedUser.location || selectedUser.country || selectedUser.careerGoals || selectedUser.company || 
                selectedUser.jobTitle || selectedUser.headline || selectedUser.field || selectedUser.yearsOfExperience || selectedUser.linkedin || 
                selectedUser.linkedinUrl || selectedUser.website || selectedUser.twitter ||
                selectedUser.bio || (selectedUser.skills && selectedUser.skills.length > 0) ||
                (selectedUser.interests && selectedUser.interests.length > 0) || 
                (selectedUser.expertiseAreas && selectedUser.expertiseAreas.length > 0) ||
                selectedUser.accepting !== undefined || selectedUser.availableToMentor !== undefined) && (
                <>
                  {/* Student-specific fields */}
                  {selectedUser.role === 'student' && (
                    <div>
                      <h4 className="font-syne text-sm font-bold text-[var(--ispora-text)] mb-3 flex items-center gap-2">
                        <GraduationCap className="w-4 h-4" strokeWidth={2} />
                        Student Details
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedUser.university && (
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg bg-[var(--ispora-accent-light)] flex items-center justify-center flex-shrink-0">
                              <GraduationCap className="w-4 h-4 text-[var(--ispora-accent)]" strokeWidth={2} />
                            </div>
                            <div>
                              <div className="text-xs text-[var(--ispora-text3)] mb-0.5">School/University</div>
                              <div className="text-sm font-medium text-[var(--ispora-text)]">{selectedUser.university}</div>
                            </div>
                          </div>
                        )}
                        {selectedUser.course && (
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg bg-[var(--ispora-warn-light)] flex items-center justify-center flex-shrink-0">
                              <FileText className="w-4 h-4 text-[var(--ispora-warn)]" strokeWidth={2} />
                            </div>
                            <div>
                              <div className="text-xs text-[var(--ispora-text3)] mb-0.5">Field of Study</div>
                              <div className="text-sm font-medium text-[var(--ispora-text)]">{selectedUser.course}</div>
                            </div>
                          </div>
                        )}
                        {selectedUser.yearOfStudy && (
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg bg-[var(--ispora-brand-light)] flex items-center justify-center flex-shrink-0">
                              <Calendar className="w-4 h-4 text-[var(--ispora-brand)]" strokeWidth={2} />
                            </div>
                            <div>
                              <div className="text-xs text-[var(--ispora-text3)] mb-0.5">Year of Study</div>
                              <div className="text-sm font-medium text-[var(--ispora-text)]">{selectedUser.yearOfStudy}</div>
                            </div>
                          </div>
                        )}
                        {(selectedUser.location || selectedUser.country) && (
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg bg-[var(--ispora-success-light)] flex items-center justify-center flex-shrink-0">
                              <MapPin className="w-4 h-4 text-[var(--ispora-success)]" strokeWidth={2} />
                            </div>
                            <div>
                              <div className="text-xs text-[var(--ispora-text3)] mb-0.5">Location</div>
                              <div className="text-sm font-medium text-[var(--ispora-text)]">{selectedUser.location || selectedUser.country}</div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {selectedUser.careerGoals && (
                        <div className="mt-4 p-4 bg-[var(--ispora-bg)] rounded-lg">
                          <div className="text-xs text-[var(--ispora-text3)] mb-1.5">Career Goals</div>
                          <div className="text-sm text-[var(--ispora-text)]">{selectedUser.careerGoals}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mentor-specific fields */}
                  {selectedUser.role === 'diaspora' && (
                    <div>
                      <h4 className="font-syne text-sm font-bold text-[var(--ispora-text)] mb-3 flex items-center gap-2">
                        <BriefcaseIcon className="w-4 h-4" strokeWidth={2} />
                        Mentor Details
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedUser.company && (
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg bg-[var(--ispora-brand-light)] flex items-center justify-center flex-shrink-0">
                              <BriefcaseIcon className="w-4 h-4 text-[var(--ispora-brand)]" strokeWidth={2} />
                            </div>
                            <div>
                              <div className="text-xs text-[var(--ispora-text3)] mb-0.5">Company</div>
                              <div className="text-sm font-medium text-[var(--ispora-text)]">{selectedUser.company}</div>
                            </div>
                          </div>
                        )}
                        {(selectedUser.jobTitle || selectedUser.headline) && (
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg bg-[var(--ispora-accent-light)] flex items-center justify-center flex-shrink-0">
                              <UserCog className="w-4 h-4 text-[var(--ispora-accent)]" strokeWidth={2} />
                            </div>
                            <div>
                              <div className="text-xs text-[var(--ispora-text3)] mb-0.5">Job Title</div>
                              <div className="text-sm font-medium text-[var(--ispora-text)]">{selectedUser.jobTitle || selectedUser.headline}</div>
                            </div>
                          </div>
                        )}
                        {selectedUser.field && (
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg bg-[var(--ispora-warn-light)] flex items-center justify-center flex-shrink-0">
                              <Award className="w-4 h-4 text-[var(--ispora-warn)]" strokeWidth={2} />
                            </div>
                            <div>
                              <div className="text-xs text-[var(--ispora-text3)] mb-0.5">Field/Industry</div>
                              <div className="text-sm font-medium text-[var(--ispora-text)]">{selectedUser.field}</div>
                            </div>
                          </div>
                        )}
                        {(selectedUser.location || selectedUser.country) && (
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg bg-[var(--ispora-success-light)] flex items-center justify-center flex-shrink-0">
                              <MapPin className="w-4 h-4 text-[var(--ispora-success)]" strokeWidth={2} />
                            </div>
                            <div>
                              <div className="text-xs text-[var(--ispora-text3)] mb-0.5">Location</div>
                              <div className="text-sm font-medium text-[var(--ispora-text)]">{selectedUser.location || selectedUser.country}</div>
                            </div>
                          </div>
                        )}
                        {selectedUser.yearsOfExperience && (
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg bg-[var(--ispora-warn-light)] flex items-center justify-center flex-shrink-0">
                              <Calendar className="w-4 h-4 text-[var(--ispora-warn)]" strokeWidth={2} />
                            </div>
                            <div>
                              <div className="text-xs text-[var(--ispora-text3)] mb-0.5">Years of Experience</div>
                              <div className="text-sm font-medium text-[var(--ispora-text)]">{selectedUser.yearsOfExperience} years</div>
                            </div>
                          </div>
                        )}
                        {selectedUser.linkedinUrl && (
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg bg-[var(--ispora-brand-light)] flex items-center justify-center flex-shrink-0">
                              <Linkedin className="w-4 h-4 text-[var(--ispora-brand)]" strokeWidth={2} />
                            </div>
                            <div>
                              <div className="text-xs text-[var(--ispora-text3)] mb-0.5">LinkedIn</div>
                              <a 
                                href={selectedUser.linkedinUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-[var(--ispora-brand)] hover:underline"
                              >
                                View Profile
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Bio */}
                  {selectedUser.bio && (
                    <div>
                      <h4 className="font-syne text-sm font-bold text-[var(--ispora-text)] mb-3">Bio</h4>
                      <div className="p-4 bg-[var(--ispora-bg)] rounded-lg text-sm text-[var(--ispora-text)] leading-relaxed">
                        {selectedUser.bio}
                      </div>
                    </div>
                  )}

                  {/* Interests */}
                  {selectedUser.interests && selectedUser.interests.length > 0 && (
                    <div>
                      <h4 className="font-syne text-sm font-bold text-[var(--ispora-text)] mb-3">Interests</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedUser.interests.map((interest: string, idx: number) => (
                          <span 
                            key={idx}
                            className="px-3 py-1.5 text-xs font-medium bg-[var(--ispora-brand-light)] text-[var(--ispora-brand)] rounded-full"
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Expertise Areas (for mentors) */}
                  {selectedUser.role === 'diaspora' && selectedUser.expertiseAreas && selectedUser.expertiseAreas.length > 0 && (
                    <div>
                      <h4 className="font-syne text-sm font-bold text-[var(--ispora-text)] mb-3">Expertise Areas</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedUser.expertiseAreas.map((area: string, idx: number) => (
                          <span 
                            key={idx}
                            className="px-3 py-1.5 text-xs font-medium bg-[var(--ispora-success-light)] text-[var(--ispora-success)] rounded-full"
                          >
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Skills */}
                  {selectedUser.skills && selectedUser.skills.length > 0 && (
                    <div>
                      <h4 className="font-syne text-sm font-bold text-[var(--ispora-text)] mb-3 flex items-center gap-2">
                        <Award className="w-4 h-4" strokeWidth={2} />
                        Skills
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedUser.skills.map((skill: string, idx: number) => (
                          <span 
                            key={idx}
                            className="px-3 py-1.5 text-xs font-medium bg-[var(--ispora-accent-light)] text-[var(--ispora-accent)] rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contact & Social Links */}
                  {(selectedUser.linkedin || selectedUser.linkedinUrl || selectedUser.website || selectedUser.twitter) && (
                    <div>
                      <h4 className="font-syne text-sm font-bold text-[var(--ispora-text)] mb-3 flex items-center gap-2">
                        <Globe className="w-4 h-4" strokeWidth={2} />
                        Links & Contact
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(selectedUser.linkedin || selectedUser.linkedinUrl) && (
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg bg-[var(--ispora-brand-light)] flex items-center justify-center flex-shrink-0">
                              <Linkedin className="w-4 h-4 text-[var(--ispora-brand)]" strokeWidth={2} />
                            </div>
                            <div>
                              <div className="text-xs text-[var(--ispora-text3)] mb-0.5">LinkedIn</div>
                              <a 
                                href={selectedUser.linkedin || selectedUser.linkedinUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-[var(--ispora-brand)] hover:underline flex items-center gap-1"
                              >
                                View Profile <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        )}
                        {selectedUser.website && (
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg bg-[var(--ispora-accent-light)] flex items-center justify-center flex-shrink-0">
                              <Globe className="w-4 h-4 text-[var(--ispora-accent)]" strokeWidth={2} />
                            </div>
                            <div>
                              <div className="text-xs text-[var(--ispora-text3)] mb-0.5">Website</div>
                              <a 
                                href={selectedUser.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-[var(--ispora-brand)] hover:underline flex items-center gap-1"
                              >
                                Visit Website <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        )}
                        {selectedUser.twitter && (
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg bg-[var(--ispora-success-light)] flex items-center justify-center flex-shrink-0">
                              <Twitter className="w-4 h-4 text-[var(--ispora-success)]" strokeWidth={2} />
                            </div>
                            <div>
                              <div className="text-xs text-[var(--ispora-text3)] mb-0.5">Twitter</div>
                              <a 
                                href={selectedUser.twitter} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-[var(--ispora-brand)] hover:underline flex items-center gap-1"
                              >
                                View Profile <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Mentor Availability Status */}
                  {selectedUser.role === 'diaspora' && (selectedUser.accepting !== undefined || selectedUser.availableToMentor !== undefined) && (
                    <div>
                      <h4 className="font-syne text-sm font-bold text-[var(--ispora-text)] mb-3 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4" strokeWidth={2} />
                        Mentorship Availability
                      </h4>
                      <div className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg ${
                        (selectedUser.accepting ?? selectedUser.availableToMentor)
                          ? 'bg-[var(--ispora-success-light)] text-[var(--ispora-success)]' 
                          : 'bg-[var(--ispora-warn-light)] text-[var(--ispora-warn)]'
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${
                          (selectedUser.accepting ?? selectedUser.availableToMentor) ? 'bg-[var(--ispora-success)]' : 'bg-[var(--ispora-warn)]'
                        }`}></div>
                        <span className="text-sm font-semibold">
                          {(selectedUser.accepting ?? selectedUser.availableToMentor) ? 'Currently Accepting Mentees' : 'Not Accepting Mentees'}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* No Profile Data */}
              {!(selectedUser.university || selectedUser.course || selectedUser.yearOfStudy || 
                selectedUser.location || selectedUser.country || selectedUser.careerGoals || selectedUser.company || 
                selectedUser.jobTitle || selectedUser.headline || selectedUser.field || selectedUser.yearsOfExperience || selectedUser.linkedin || 
                selectedUser.linkedinUrl || selectedUser.website || selectedUser.twitter ||
                selectedUser.bio || (selectedUser.skills && selectedUser.skills.length > 0) ||
                (selectedUser.interests && selectedUser.interests.length > 0) || 
                (selectedUser.expertiseAreas && selectedUser.expertiseAreas.length > 0) ||
                selectedUser.accepting !== undefined || selectedUser.availableToMentor !== undefined) && (
                <div className="text-center py-8">
                  <AlertCircle className="w-10 h-10 text-[var(--ispora-text3)] mx-auto mb-3" strokeWidth={1.5} />
                  <p className="text-sm text-[var(--ispora-text3)]">No additional profile information available</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[var(--ispora-border)] flex items-center justify-end sticky bottom-0 bg-white">
              <button
                onClick={() => setShowUserDetailModal(false)}
                className="px-4 py-2 text-sm font-semibold text-[var(--ispora-text2)] hover:bg-[var(--ispora-bg)] rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}