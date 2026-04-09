import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import logo from '/src/assets/4db1642d96b725f296f07dcb9e96154154c374f8.png';
import { toast } from 'sonner';
import { normalizeUrl } from '../utils/urlHelpers';
import CalendarModal from './CalendarModal';
import { generateRRuleFromPattern } from '../utils/calendar';
import {
  LayoutGrid,
  Users,
  User,
  Settings as SettingsIcon,
  LogOut,
  Bell,
  Briefcase,
  CalendarCheck,
  MessageCircle,
  Heart,
  Rocket,
  Sparkles,
  Calendar,
  Target,
  Zap,
  CheckCircle2,
  Video,
  Clock,
  X,
  ExternalLink,
  MapPin,
  Link2,
  Repeat,
  AlertCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  Search,
  CalendarPlus,
  Award
} from 'lucide-react';
import FindMentor from './FindMentor';
import StudentProfile from './StudentProfile';
import MyProgress from './MyProgress';
import Opportunities from './Opportunities';
import { Messages } from './Messages';
import Settings from './Settings';
import DonationModal from './DonationModal';
import MobileBottomNav from './MobileBottomNav';
import Community from './Community';
import { DashboardSkeleton } from './LoadingSkeleton';
import RecommendedMentors from './RecommendedMentors';
import ProfileCompletionToast from './ProfileCompletionToast';

type StudentPage = 'dashboard' | 'find-mentor' | 'messages' | 'my-progress' | 'opportunities' | 'community' | 'profile' | 'settings';

export default function StudentDashboard() {
  const { user, signOut } = useAuth();
  const [currentPage, setCurrentPage] = useState<StudentPage>('dashboard');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfilePopover, setShowProfilePopover] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [showMentorsModal, setShowMentorsModal] = useState(false);
  const [mentorships, setMentorships] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showAllNotifications, setShowAllNotifications] = useState(false);

  // Load mentorships and notifications
  useEffect(() => {
    const loadData = async () => {
      try {
        const [mentorshipsRes, notificationsRes] = await Promise.all([
          api.mentorship.getAll(),
          api.notification.getAll()
        ]);
        console.log('Student Dashboard - Notifications Response:', notificationsRes);
        setMentorships(mentorshipsRes.mentorships || []);
        setNotifications(notificationsRes.notifications || []);
      } catch (error: any) {
        console.error('Failed to load data:', error);
        // If it's an auth error, sign out the user
        if (error.message?.includes('session has expired') || 
            error.message?.includes('Invalid JWT') ||
            error.message?.includes('sign in again')) {
          console.log('Auth error detected, signing out...');
          await signOut();
        }
      }
    };
    
    loadData();
  }, []);

  const handleSignOut = async () => {
    await signOut();
  };

  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase();

  // Render page content based on current page
  const renderPageContent = () => {
    switch (currentPage) {
      case 'find-mentor':
        return <FindMentor />;
      case 'my-progress':
        return <MyProgress />;
      case 'opportunities':
        return <Opportunities />;
      case 'community':
        return <Community />;
      case 'profile':
        return <StudentProfile />;
      case 'settings':
        return <Settings />;
      case 'dashboard':
      default:
        return <DashboardHome onShowMentors={() => setShowMentorsModal(true)} onNavigateToProfile={() => setCurrentPage('profile')} onNavigateToFindMentor={() => setCurrentPage('find-mentor')} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--ispora-bg)]">
      {/* Sidebar - Hidden on mobile */}
      <aside className="hidden md:flex w-[224px] bg-white border-r-[1.5px] border-[var(--ispora-border)] flex-col flex-shrink-0">
        {/* Logo */}
        <div className="px-[18px] py-4 border-b-[1.5px] border-[var(--ispora-border)] flex items-center gap-2.5">
          <img src={logo} alt="iSpora" className="w-8 h-8 rounded-full shadow-sm flex-shrink-0" />
          <span className="font-syne font-bold text-[11px] text-[var(--ispora-text)]">The Impact Engine</span>
        </div>

        {/* Profile Card */}
        <div
          className="mx-3.5 my-3 px-3 py-2.5 bg-[var(--ispora-brand-light)] rounded-xl flex items-center gap-2.5 cursor-pointer hover:bg-[#e0e3ff] transition-colors"
          onClick={() => setShowProfilePopover(true)}
        >
          {(user as any)?.profilePicture ? (
            <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 relative border-2 border-white">
              <img 
                src={(user as any).profilePicture} 
                alt={`${user?.firstName} ${user?.lastName}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0.5 right-0.5 w-2 h-2 bg-[var(--ispora-accent)] rounded-full border-2 border-white animate-pulse" />
            </div>
          ) : (
            <div className="w-9 h-9 rounded-full bg-[var(--ispora-brand)] flex items-center justify-center text-white font-bold text-sm flex-shrink-0 relative">
              {initials}
              <div className="absolute bottom-0.5 right-0.5 w-2 h-2 bg-[var(--ispora-accent)] rounded-full border-2 border-white animate-pulse" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-xs text-[var(--ispora-text)] leading-tight truncate">
              {user?.firstName} {user?.lastName}
            </div>
            <div className="text-[11px] text-[var(--ispora-brand)] font-medium mt-0.5">
              Student · Software Eng.
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          <div className="mb-5">
            <div className="text-[10px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider px-2 mb-1.5">
              Main
            </div>
            <NavItem
              icon={<LayoutGrid className="w-[15px] h-[15px]" strokeWidth={2} />}
              label="Dashboard"
              active={currentPage === 'dashboard'}
              onClick={() => setCurrentPage('dashboard')}
            />
            <NavItem
              icon={<Users className="w-[15px] h-[15px]" strokeWidth={2} />}
              label="Find a Mentor"
              active={currentPage === 'find-mentor'}
              onClick={() => setCurrentPage('find-mentor')}
            />
            <NavItem
              icon={<MessageCircle className="w-[15px] h-[15px]" strokeWidth={2} />}
              label="Messages"
              active={currentPage === 'messages'}
              onClick={() => setCurrentPage('messages')}
            />
            <NavItem
              icon={<Target className="w-[15px] h-[15px]" strokeWidth={2} />}
              label="My Progress"
              active={currentPage === 'my-progress'}
              onClick={() => setCurrentPage('my-progress')}
            />
            <NavItem
              icon={<Zap className="w-[15px] h-[15px]" strokeWidth={2} />}
              label="Opportunities"
              active={currentPage === 'opportunities'}
              onClick={() => setCurrentPage('opportunities')}
            />
            <NavItem
              icon={<Users className="w-[15px] h-[15px]" strokeWidth={2} />}
              label="Community"
              active={currentPage === 'community'}
              onClick={() => setCurrentPage('community')}
            />
          </div>
        </nav>

        {/* Footer */}
        <div className="px-3 py-3 border-t-[1.5px] border-[var(--ispora-border)]">
          <NavItem
            icon={<LogOut className="w-[15px] h-[15px]" strokeWidth={2} />}
            label="Sign Out"
            danger
            onClick={handleSignOut}
          />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Bar */}
        <div className="h-16 bg-white border-b-[1.5px] border-[var(--ispora-border)] px-4 md:px-7 flex items-center gap-3.5 flex-shrink-0">
          {/* Mobile Logo */}
          <div className="flex md:hidden items-center gap-2 mr-2">
            <img src={logo} alt="iSpora" className="w-10 h-10 rounded-full shadow-sm flex-shrink-0" />
          </div>
          
          <div className="flex items-center gap-2 ml-auto">
            {/* Donate Now Button */}
            <button
              onClick={() => setShowDonationModal(true)}
              className="flex items-center gap-1.5 px-2 sm:px-3 py-2 rounded-[10px] bg-[var(--ispora-brand)] text-white text-xs font-semibold hover:bg-[var(--ispora-brand-hover)] hover:shadow-lg transition-all"
            >
              <Heart className="w-3.5 h-3.5 hidden sm:block" strokeWidth={2} fill="currentColor" />
              <span>Donate</span>
            </button>
            
            {/* Notifications */}
            <button
              className="w-[38px] h-[38px] rounded-lg flex items-center justify-center bg-[var(--ispora-bg)] border-[1.5px] border-[var(--ispora-border)] text-[var(--ispora-text2)] hover:bg-[var(--ispora-brand-light)] hover:text-[var(--ispora-brand)] hover:border-[var(--ispora-brand)] transition-all relative"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="w-[17px] h-[17px]" strokeWidth={2} />
              <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[var(--ispora-danger)] rounded-full border-[1.5px] border-white" />
            </button>

            {/* Profile */}
            <button
              className="w-[38px] h-[38px] rounded-lg flex items-center justify-center bg-[var(--ispora-bg)] border-[1.5px] border-[var(--ispora-border)] text-[var(--ispora-text2)] hover:bg-[var(--ispora-brand-light)] hover:text-[var(--ispora-brand)] hover:border-[var(--ispora-border)] transition-all"
              onClick={() => setShowProfilePopover(!showProfilePopover)}
            >
              <User className="w-[17px] h-[17px]" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Page Content */}
        {currentPage === 'messages' ? (
          <div className="flex-1 overflow-hidden px-4 md:px-7 py-4 md:py-6 pb-20 md:pb-6">
            <Messages 
              userRole="student" 
              userId={user?.id || ''} 
              mentorships={mentorships}
              onBack={() => setCurrentPage('dashboard')}
            />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
            {renderPageContent()}
          </div>
        )}
      </div>

      {/* Donation Modal */}
      {showDonationModal && (
        <DonationModal onClose={() => setShowDonationModal(false)} />
      )}

      {/* Notification Panel */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowNotifications(false);
            setShowAllNotifications(false);
          }}
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
                (showAllNotifications ? notifications : notifications.slice(0, 10)).map((notification: any) => (
                  <div 
                    key={notification.id} 
                    className={`px-4 py-3 border-b border-[var(--ispora-border)] flex gap-2.5 cursor-pointer ${notification.read ? 'hover:bg-[var(--ispora-bg)]' : 'bg-[var(--ispora-brand-light)] hover:bg-[#e0e3ff]'} transition-colors`}
                  >
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${notification.read ? 'bg-[var(--ispora-border)]' : 'bg-[var(--ispora-brand)]'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[var(--ispora-text)] mb-0.5 line-clamp-2">
                        {notification.title}
                      </p>
                      <p className="text-[11px] text-[var(--ispora-text3)] line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-[var(--ispora-text3)] mt-1">
                        {new Date(notification.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            {notifications.length > 10 && (
              <div className="px-4 py-3 border-t border-[var(--ispora-border)] text-center flex-shrink-0">
                <button 
                  onClick={() => setShowAllNotifications(!showAllNotifications)}
                  className="text-xs font-semibold text-[var(--ispora-brand)] hover:underline"
                >
                  {showAllNotifications ? 'Show less' : `View all ${notifications.length} notifications`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Profile Popover */}
      {showProfilePopover && (
        <div
          className="fixed inset-0 z-50"
          onClick={() => setShowProfilePopover(false)}
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
                    {initials}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-[var(--ispora-text)] truncate">
                    {user?.firstName} {user?.lastName}
                  </h4>
                  <p className="text-xs text-[var(--ispora-text3)] truncate">{user?.email}</p>
                </div>
              </div>
              <span className="inline-block text-[10px] font-semibold bg-[var(--ispora-brand-light)] text-[var(--ispora-brand)] px-2.5 py-1 rounded-full">
                Student
              </span>
            </div>
            <div className="p-2">
              <button 
                onClick={() => {
                  setCurrentPage('profile');
                  setShowProfilePopover(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-[var(--ispora-bg)] text-[var(--ispora-text)] text-sm font-medium transition-colors"
              >
                <User className="w-4 h-4" />
                <span>View Profile</span>
              </button>
              <button 
                onClick={() => {
                  setCurrentPage('settings');
                  setShowProfilePopover(false);
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

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        currentPage={currentPage === 'find-mentor' ? 'browse-mentors' : currentPage === 'my-progress' ? 'dashboard' : currentPage}
        onPageChange={(page) => {
          if (page === 'browse-mentors') setCurrentPage('find-mentor');
          else if (page === 'opportunities') setCurrentPage('opportunities');
          else setCurrentPage(page as StudentPage);
        }}
        userRole="student"
      />

      {/* My Mentors Modal */}
      {showMentorsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border-[1.5px] border-[var(--ispora-border)] w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
            <div className="px-6 py-4 border-b-[1.5px] border-[var(--ispora-border)] flex items-center justify-between">
              <h3 className="font-syne text-lg font-bold text-[var(--ispora-text)]">
                My Mentors
              </h3>
              <button
                onClick={() => setShowMentorsModal(false)}
                className="text-[var(--ispora-text3)] hover:text-[var(--ispora-text)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-6 flex-1">
              {mentorships.filter(m => m.status === 'active').length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-[var(--ispora-brand-light)] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-[var(--ispora-brand)]" strokeWidth={1.8} />
                  </div>
                  <h4 className="font-syne text-lg font-bold text-[var(--ispora-text)] mb-2">
                    No mentors yet
                  </h4>
                  <p className="text-sm text-[var(--ispora-text3)] max-w-sm mx-auto mb-6">
                    Browse our network of diaspora professionals and connect with mentors who can guide your journey
                  </p>
                  <button
                    onClick={() => {
                      setShowMentorsModal(false);
                      setCurrentPage('find-mentor');
                    }}
                    className="px-6 py-2.5 bg-[var(--ispora-brand)] text-white text-sm font-bold rounded-lg hover:bg-[#1a35f8] transition-colors"
                  >
                    Find a Mentor
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {mentorships.filter(m => m.status === 'active').map((mentorship: any) => (
                    <div key={mentorship.id} className="flex items-center gap-4 p-4 bg-[var(--ispora-bg)] rounded-xl hover:bg-[var(--ispora-brand-light)] transition-colors cursor-pointer border-[1.5px] border-transparent hover:border-[var(--ispora-brand)]">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[var(--ispora-brand)] to-[#1a35f8] flex items-center justify-center text-white font-bold text-lg flex-shrink-0 relative shadow-md">
                        {mentorship.mentor?.firstName?.[0]}{mentorship.mentor?.lastName?.[0]}
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[var(--ispora-accent)] border-2 border-white rounded-full" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-syne font-bold text-base text-[var(--ispora-text)] mb-1">
                          {mentorship.mentor?.firstName} {mentorship.mentor?.lastName}
                        </div>
                        <div className="text-sm text-[var(--ispora-text2)] mb-1">
                          {mentorship.mentor?.currentRole || 'Mentor'}
                        </div>
                        {mentorship.mentor?.company && (
                          <div className="text-xs text-[var(--ispora-text3)]">
                            {mentorship.mentor?.company}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-[var(--ispora-success-light)] text-[var(--ispora-success)] rounded-full text-xs font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                          Active
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowMentorsModal(false);
                            setCurrentPage('messages');
                          }}
                          className="text-xs text-[var(--ispora-brand)] hover:text-[#1a35f8] font-semibold"
                        >
                          Send Message
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Profile Completion Toast - Smart notification for incomplete profiles */}
      {currentPage === 'dashboard' && (
        <ProfileCompletionToast 
          onNavigateToProfile={() => setCurrentPage('profile')} 
        />
      )}
    </div>
  );
}

// Nav Item Component
interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  badge?: string;
  active?: boolean;
  danger?: boolean;
  onClick?: () => void;
}

function NavItem({ icon, label, badge, active, danger, onClick }: NavItemProps) {
  return (
    <div
      className={`
        flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] text-[13px] font-medium cursor-pointer transition-all
        ${active ? 'bg-[var(--ispora-brand)] text-white' : ''}
        ${danger && !active ? 'text-[var(--ispora-danger)] hover:bg-[var(--ispora-danger-light)]' : ''}
        ${!active && !danger ? 'text-[var(--ispora-text2)] hover:bg-[var(--ispora-brand-light)] hover:text-[var(--ispora-brand)]' : ''}
      `}
      onClick={onClick}
    >
      {icon}
      <span className="flex-1">{label}</span>
      {badge && (
        <span
          className={`
            text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center
            ${active ? 'bg-white/30 text-white' : 'bg-[var(--ispora-danger)] text-white'}
          `}
        >
          {badge}
        </span>
      )}
    </div>
  );
}

// Dashboard Home Component
function DashboardHome({ onShowMentors, onNavigateToProfile, onNavigateToFindMentor }: { onShowMentors: () => void; onNavigateToProfile: () => void; onNavigateToFindMentor: () => void }) {
  const { user } = useAuth();
  const [mentorships, setMentorships] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [publicSessions, setPublicSessions] = useState<any[]>([]);
  const [pastSessions, setPastSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [cancellingSession, setCancellingSession] = useState(false);
  const [registeringSession, setRegisteringSession] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('my-sessions');
  const [publicSessionsTab, setPublicSessionsTab] = useState<'available' | 'past'>('available');
  
  // Calendar modal state
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calendarEvent, setCalendarEvent] = useState<any>(null);
  
  // Track sessions being liked to prevent double-clicking
  const [likingSessionIds, setLikingSessionIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [mentorshipsRes, sessionsRes, publicSessionsRes, pastSessionsRes] = await Promise.all([
          api.mentorship.getAll(),
          api.session.getAll(),
          api.session.getAllPublic(),
          api.session.getPastSessions()
        ]);
        
        setMentorships(mentorshipsRes.mentorships || []);
        setPastSessions(pastSessionsRes.sessions || []);
        
        // Get ALL sessions for the user (including public ones they're registered for)
        // The backend already filters to only include sessions where user is mentor, student, or registered
        const allSessions = sessionsRes.sessions || [];
        
        // Include ALL sessions - both private and registered public sessions
        setSessions(allSessions);
        setPublicSessions(publicSessionsRes.sessions || []);

        // Check for pending session registration (from shared link)
        const pendingSessionId = localStorage.getItem('pendingSessionRegistration');
        if (pendingSessionId) {
          localStorage.removeItem('pendingSessionRegistration');
          // Auto-register for the session
          console.log('🔗 Auto-registering for session from shared link:', pendingSessionId);
          try {
            await api.session.register(pendingSessionId);
            // Reload sessions to show the newly registered session
            const [updatedSessionsRes, updatedPublicSessionsRes] = await Promise.all([
              api.session.getAll(),
              api.session.getAllPublic()
            ]);
            const updatedAllSessions = updatedSessionsRes.sessions || [];
            
            // Include ALL sessions - backend already filters correctly
            setSessions(updatedAllSessions);
            setPublicSessions(updatedPublicSessionsRes.sessions || []);
            
            // Find the session that was just registered
            const registeredSession = updatedAllSessions.find((s: any) => s.id === pendingSessionId);
            
            // Switch to "My Sessions" tab and show success message
            setActiveTab('my-sessions');
            toast.success('🎉 Successfully registered! Your session is now in "My Sessions"', {
              duration: 5000,
            });

            // Show calendar modal to add to calendar
            if (registeredSession) {
              const sessionStartTime = new Date(registeredSession.scheduledAt);
              const sessionEndTime = new Date(sessionStartTime.getTime() + registeredSession.duration * 60000);
              
              // Prepare calendar event data
              const eventData = {
                title: registeredSession.topic || 'Mentorship Session',
                description: registeredSession.description || 'Ispora mentorship session',
                location: registeredSession.meetingLink || '',
                startTime: sessionStartTime,
                endTime: sessionEndTime,
                organizerName: registeredSession.mentor ? `${registeredSession.mentor.firstName} ${registeredSession.mentor.lastName}` : '',
                organizerEmail: registeredSession.mentor?.email || '',
                isRecurring: registeredSession.isRecurring,
                recurrenceRule: registeredSession.recurrencePattern ? generateRRuleFromPattern(registeredSession.recurrencePattern, sessionStartTime) : undefined,
                recurrenceEndDate: registeredSession.recurrenceEndDate ? new Date(registeredSession.recurrenceEndDate) : undefined,
                allSessionDates: registeredSession.allSessionDates ? registeredSession.allSessionDates.map((d: string) => new Date(d)) : undefined,
              };

              setCalendarEvent(eventData);
              setShowCalendarModal(true);
            }
          } catch (regError: any) {
            console.error('Error auto-registering for session:', regError);
            toast.error('Could not register for the session. It may be full or no longer available.', {
              duration: 5000,
            });
          }
        }
      } catch (err: any) {
        console.error('Error loading dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const activeMentorships = mentorships.filter(m => m.status === 'active');
  const completedSessions = sessions.filter(s => s.status === 'completed').length;
  
  // Keep reference to all sessions for completed count
  const allSessions = sessions;
  
  // Group sessions by series
  const allUpcomingSessions = sessions.filter(s => s.status === 'scheduled' && new Date(s.scheduledAt) > new Date()).sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  
  const sessionGroups = new Map<string, any[]>();
  const standaloneSessions: any[] = [];

  allUpcomingSessions.forEach((session: any) => {
    let sessionDetails: any = {};
    try {
      if (session.notes) {
        sessionDetails = JSON.parse(session.notes);
      }
    } catch (e) {}

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

  const upcomingSessions = standaloneSessions;

  // Transform series to UI format
  const sessionSeries = Array.from(sessionGroups.entries()).map(([seriesId, sessions]) => {
    const firstSession = sessions[0];
    const nextSession = sessions[0];
    const lastSession = sessions[sessions.length - 1];

    let sessionDetails: any = {};
    try {
      if (firstSession.notes) {
        sessionDetails = JSON.parse(firstSession.notes);
      }
    } catch (e) {}

    const completedCount = allSessions.filter((s: any) => {
      try {
        const notes = s.notes ? JSON.parse(s.notes) : {};
        return notes.seriesId === seriesId && s.status === 'completed';
      } catch {
        return false;
      }
    }).length;

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
      mentor: firstSession.mentor,
      sessionType: sessionDetails.sessionType || 'private',
      recurrencePattern: recurrencePatternText,
      totalSessions: sessionDetails.totalSessions || sessions.length,
      completedSessions: completedCount,
      remainingSessions: sessions.length,
      nextSessionDate: new Date(nextSession.scheduledAt),
      endDate: new Date(lastSession.scheduledAt),
      duration: firstSession.duration,
      platform: sessionDetails.platform || 'Not specified',
      description: sessionDetails.description || '',
      sessions: sessions,
      notes: firstSession.notes,
      capacity: sessionDetails.capacity || 10,
      registeredCount: sessionDetails.registeredCount || 0
    };
  });

  // Group PUBLIC sessions by series (same logic for public sessions)
  // IMPORTANT: Filter OUT sessions where the current user is already registered!
  const upcomingPublicSessions = publicSessions
    .filter(s => {
      // Only show future sessions
      if (new Date(s.scheduledAt) <= new Date()) return false;
      
      // Filter out sessions where user is already registered
      try {
        if (s.notes) {
          const sessionDetails = JSON.parse(s.notes);
          const registeredStudents = sessionDetails.registeredStudents || [];
          // If user is registered, don't show in "Available Public Sessions"
          if (user && registeredStudents.includes(user.id)) {
            return false;
          }
        }
      } catch (e) {
        // If parsing fails, include the session
      }
      return true;
    })
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  
  const publicSessionGroups = new Map<string, any[]>();
  const standalonePublicSessions: any[] = [];

  upcomingPublicSessions.forEach((session: any) => {
    let sessionDetails: any = {}; 
    try {
      if (session.notes) {
        sessionDetails = JSON.parse(session.notes);
      }
    } catch (e) {}

    const seriesId = sessionDetails.seriesId;
    if (seriesId) {
      if (!publicSessionGroups.has(seriesId)) {
        publicSessionGroups.set(seriesId, []);
      }
      publicSessionGroups.get(seriesId)!.push(session);
    } else {
      standalonePublicSessions.push(session);
    }
  });

  // Transform public series to UI format
  const publicSessionSeries = Array.from(publicSessionGroups.entries()).map(([seriesId, sessions]) => {
    const firstSession = sessions[0];
    const nextSession = sessions[0];
    const lastSession = sessions[sessions.length - 1];

    let sessionDetails: any = {};
    try {
      if (firstSession.notes) {
        sessionDetails = JSON.parse(firstSession.notes);
      }
    } catch (e) {}

    const completedCount = publicSessions.filter((s: any) => {
      try {
        const notes = s.notes ? JSON.parse(s.notes) : {};
        return notes.seriesId === seriesId && s.status === 'completed';
      } catch {
        return false;
      }
    }).length;

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
      mentor: firstSession.mentor,
      sessionType: sessionDetails.sessionType || 'public',
      recurrencePattern: recurrencePatternText,
      totalSessions: sessionDetails.totalSessions || sessions.length,
      completedSessions: completedCount,
      remainingSessions: sessions.length,
      nextSessionDate: new Date(nextSession.scheduledAt),
      endDate: new Date(lastSession.scheduledAt),
      duration: firstSession.duration,
      platform: sessionDetails.platform || 'Not specified',
      description: sessionDetails.description || '',
      capacity: sessionDetails.capacity || 10,
      registeredCount: sessionDetails.registeredCount || 0,
      registeredStudents: sessionDetails.registeredStudents || [],
      sessions: sessions,
      notes: firstSession.notes
    };
  });

  const handleSessionClick = async (session: any) => {
    setSelectedSession(session);
    setShowSessionModal(true);
    
    // Increment view count for public sessions
    try {
      let sessionDetails: any = {};
      try {
        if (session.notes) {
          sessionDetails = JSON.parse(session.notes);
        }
      } catch (e) {}
      
      if (sessionDetails.sessionType === 'public') {
        // Optimistic update
        setPublicSessions(prev => prev.map(s => {
          if (s.id === session.id) {
            return {
              ...s,
              viewsCount: (s.viewsCount || 0) + 1
            };
          }
          return s;
        }));
        
        // Increment view count in background
        await api.session.incrementView(session.id);
      }
    } catch (error: any) {
      console.error('Error incrementing view count:', error);
      // Silent fail - don't interrupt user flow
    }
  };

  const handleCancelSession = async () => {
    if (!selectedSession) return;
    
    // Check if this is a public session
    let isPublicSession = false;
    let sessionType = 'private';
    try {
      if (selectedSession.notes) {
        const parsed = JSON.parse(selectedSession.notes);
        sessionType = parsed.sessionType || 'private';
        isPublicSession = sessionType === 'public';
      }
    } catch (e) {
      // If parsing fails, assume private
    }

    const actionText = isPublicSession ? 'leave this public session' : 'cancel this session';
    const confirmCancel = window.confirm(`Are you sure you want to ${actionText}? This action cannot be undone.`);
    if (!confirmCancel) return;

    try {
      setCancellingSession(true);
      
      if (isPublicSession) {
        // For public sessions: Unregister the student
        console.log('🚪 Unregistering from public session:', selectedSession.id);
        await api.session.unregister(selectedSession.id);
      } else {
        // For private sessions: Cancel the session itself (student owns it)
        console.log('❌ Canceling private session:', selectedSession.id);
        await api.session.update(selectedSession.id, { status: 'cancelled' });
      }
      
      // Reload all session data to get fresh state
      const [sessionsRes, publicSessionsRes] = await Promise.all([
        api.session.getAll(),
        api.session.getAllPublic()
      ]);
      
      console.log('📊 Reloaded sessions after cancellation');
      console.log('  - My sessions:', sessionsRes.sessions?.length);
      console.log('  - Public sessions:', publicSessionsRes.sessions?.length);
      
      // Update sessions state - backend already filters appropriately
      const allSessions = sessionsRes.sessions || [];
      setSessions(allSessions);
      setPublicSessions(publicSessionsRes.sessions || []);
      
      setShowSessionModal(false);
      setSelectedSession(null);
      
      const successMessage = isPublicSession 
        ? 'You have successfully left the public session. It now appears in Available Public Sessions again.'
        : 'Session cancelled successfully';
      
      toast.success(successMessage);
    } catch (error: any) {
      console.error('Error cancelling/leaving session:', error);
      const errorMessage = isPublicSession 
        ? 'Failed to leave session: ' + (error.message || 'Please try again')
        : 'Failed to cancel session: ' + (error.message || 'Please try again');
      toast.error(errorMessage);
    } finally {
      setCancellingSession(false);
    }
  };

  const handleViewMeetingDetails = () => {
    if (!selectedSession) return;
    
    const platform = selectedSession.notes || 'Platform not specified';
    const message = `Meeting Platform: ${platform}\n\nA meeting link will be shared by your mentor closer to the session time.`;
    alert(message);
  };

  const handleRegisterForSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    
    try {
      setRegisteringSession(sessionId);
      
      // Find the session before registering to get its details
      const sessionToRegister = publicSessions.find((s: any) => s.id === sessionId);
      
      await api.session.register(sessionId);
      
      // Reload sessions
      const [sessionsRes, publicSessionsRes] = await Promise.all([
        api.session.getAll(),
        api.session.getAllPublic()
      ]);
      const allSessions = sessionsRes.sessions || [];
      const personal = [];
      
      for (const session of allSessions) {
        let sessionType = 'private';
        try {
          if (session.notes) {
            const parsed = JSON.parse(session.notes);
            sessionType = parsed.sessionType || 'private';
          }
        } catch (e) {}
        
        if (sessionType !== 'public') {
          personal.push(session);
        }
      }
      
      setSessions(personal);
      setPublicSessions(publicSessionsRes.sessions || []);
      
      // Show success message
      toast.success('🎉 You\'re in! We can\'t wait to see you at this session!');
      
      // Automatically open calendar modal if we have session details
      if (sessionToRegister) {
        const sessionDate = new Date(sessionToRegister.scheduledAt);
        const duration = sessionToRegister.duration || 60;
        const endTime = new Date(sessionDate.getTime() + duration * 60000);
        
        let sessionDetails: any = {};
        try {
          if (sessionToRegister.notes) {
            sessionDetails = JSON.parse(sessionToRegister.notes);
          }
        } catch (e) {}
        
        // Check if this is a recurring session (part of a series)
        let isRecurringSeries = false;
        let allSessionDates: Date[] = [sessionDate];
        let recurrenceRule = '';
        
        if (sessionDetails.seriesId) {
          // Find all sessions in this series from the publicSessions list
          const seriesSessions = (publicSessionsRes.sessions || [])
            .filter((s: any) => {
              try {
                const notes = s.notes ? JSON.parse(s.notes) : {};
                return notes.seriesId === sessionDetails.seriesId;
              } catch {
                return false;
              }
            })
            .filter((s: any) => new Date(s.scheduledAt) > new Date()) // Only future sessions
            .sort((a: any, b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
          
          if (seriesSessions.length > 1) {
            isRecurringSeries = true;
            allSessionDates = seriesSessions.map((s: any) => new Date(s.scheduledAt));
            
            // Generate RRULE from recurrence pattern if available
            if (sessionDetails.recurrencePattern) {
              const lastSessionDate = new Date(seriesSessions[seriesSessions.length - 1].scheduledAt);
              recurrenceRule = generateRRuleFromPattern(sessionDetails.recurrencePattern, lastSessionDate);
            }
          }
        }
        
        setCalendarEvent({
          title: sessionToRegister.topic || 'Public Mentorship Session',
          description: `Public Session\n\nMentor: ${sessionToRegister.mentor?.firstName} ${sessionToRegister.mentor?.lastName}\n\n${sessionDetails.registeredCount || 0} students attending`,
          location: sessionToRegister.meetingLink || 'Online',
          startTime: sessionDate,
          endTime: endTime,
          organizerName: `${sessionToRegister.mentor?.firstName} ${sessionToRegister.mentor?.lastName}`,
          sessionUrl: `${window.location.origin}/dashboard`,
          isRecurring: isRecurringSeries,
          recurrenceRule: recurrenceRule,
          allSessionDates: allSessionDates
        });
        setShowCalendarModal(true);
      }
    } catch (error: any) {
      console.error('Error registering for session:', error);
      toast.error('Failed to register: ' + (error.message || 'Please try again'));
    } finally {
      setRegisteringSession(null);
    }
  };

  const handleLikeSession = async (sessionId: string, isLiked: boolean) => {
    // Prevent double-clicking
    if (likingSessionIds.has(sessionId)) {
      console.log('Already processing like for this session');
      return;
    }
    
    try {
      // Mark this session as being processed
      setLikingSessionIds(prev => new Set(prev).add(sessionId));
      
      // Optimistic UI update - update immediately
      setPublicSessions(prev => prev.map(session => {
        if (session.id === sessionId) {
          return {
            ...session,
            isLikedByCurrentUser: !isLiked,
            likesCount: isLiked ? Math.max((session.likesCount || 1) - 1, 0) : (session.likesCount || 0) + 1
          };
        }
        return session;
      }));

      // Make API call in background
      if (isLiked) {
        await api.session.unlike(sessionId);
      } else {
        await api.session.like(sessionId);
      }
      
      // Refresh to ensure we have accurate data
      const publicSessionsRes = await api.session.getAllPublic();
      setPublicSessions(publicSessionsRes.sessions || []);
    } catch (error: any) {
      console.error('Error liking session:', error);
      // Revert optimistic update on error
      const publicSessionsRes = await api.session.getAllPublic();
      setPublicSessions(publicSessionsRes.sessions || []);
      
      // Only show alert if it's not the "already liked" error (which can happen from race conditions)
      if (!error.message?.includes('Already liked') && !error.message?.includes('Not liked')) {
        alert('Failed to update like: ' + (error.message || 'Please try again'));
      }
    } finally {
      // Remove from processing set after a short delay to prevent rapid re-clicks
      setTimeout(() => {
        setLikingSessionIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(sessionId);
          return newSet;
        });
      }, 500);
    }
  };

  const handleMessageMentor = () => {
    setCurrentPage('messages');
  };

  const getSessionTimingStatus = (sessionDate: Date) => {
    const now = new Date();
    const diffMs = sessionDate.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 0) return { status: 'past', label: 'Past' };
    if (diffMins <= 15) return { status: 'starting', label: 'Starting Soon' };
    if (diffMins <= 60) return { status: 'soon', label: 'In ' + diffMins + ' mins' };
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return { status: 'today', label: 'In ' + diffHours + ' hrs' };
    
    return { status: 'upcoming', label: 'Upcoming' };
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
            The backend server is currently restarting. This usually takes 30-60 seconds. Please wait and refresh the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-6 py-3 bg-[var(--ispora-brand)] text-white rounded-xl font-semibold hover:bg-[var(--ispora-brand-hover)] transition-all"
          >
            Refresh Page
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
    <div className="flex-1 overflow-y-auto px-4 md:px-7 py-4 md:py-6">
      {/* Hero Section with Stats */}
      <div className="mb-5">
        <div className="bg-gradient-to-br from-[var(--ispora-brand)] via-[#1a35f8] to-[#0118c4] rounded-2xl p-5 md:p-7 relative overflow-hidden">
          {/* Grid Pattern */}
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
              backgroundSize: '28px 28px'
            }}
          />
          {/* Orb */}
          <div className="absolute -top-16 -right-10 w-56 h-56 bg-white/[0.06] rounded-full" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between md:gap-6">
            <div className="flex-1">
              <h1 className="font-dm-sans text-base md:text-lg font-semibold text-white mb-1.5">
                Welcome back, {user?.firstName}! ✨
              </h1>
              <p className="text-xs text-white/70 leading-relaxed max-w-[380px]">
                You're making great progress in your mentorship journey. Keep engaging with mentors, attending sessions, and building your network!
              </p>
            </div>

            {/* Quick Stats - Desktop: Inside hero right corner */}
            <div className="hidden md:grid md:grid-cols-2 md:gap-1.5 md:flex-shrink-0">
              <StatCard
                icon={<Briefcase className="w-5 h-5" />}
                value={activeMentorships.length.toString()}
                label="Active Mentorships"
                color="brand"
              />
              <StatCard
                icon={<CalendarCheck className="w-5 h-5" />}
                value={completedSessions.toString()}
                label="Sessions Completed"
                color="success"
              />
              <StatCard
                icon={<MessageCircle className="w-5 h-5" />}
                value="2"
                label="New Messages"
                color="accent"
              />
              <StatCard
                icon={<Heart className="w-5 h-5" />}
                value="0"
                label="Saved Mentors"
                color="danger"
              />
            </div>
          </div>
        </div>

        {/* Quick Stats - Mobile: Below hero */}
        <div className="grid grid-cols-4 gap-2 mt-3 md:hidden">
          <StatCard
            icon={<Briefcase className="w-5 h-5" />}
            value={activeMentorships.length.toString()}
            label="Active Mentorships"
            color="brand"
          />
          <StatCard
            icon={<CalendarCheck className="w-5 h-5" />}
            value={completedSessions.toString()}
            label="Sessions Completed"
            color="success"
          />
          <StatCard
            icon={<MessageCircle className="w-5 h-5" />}
            value="2"
            label="New Messages"
            color="accent"
          />
          <StatCard
            icon={<Heart className="w-5 h-5" />}
            value="0"
            label="Saved Mentors"
            color="danger"
          />
        </div>
      </div>

      {/* Empty State */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-5">
        {/* Left Column - Upcoming Sessions */}
        <div className="lg:col-span-8">
        {/* Upcoming Sessions */}
        <div className="bg-white border-[1.5px] border-[var(--ispora-border)] rounded-2xl overflow-hidden h-full">
          <div className="px-5 py-4 border-b-[1.5px] border-[var(--ispora-border)] flex items-center justify-between">
            <h3 className="font-syne text-sm font-bold text-[var(--ispora-text)]">
              Upcoming Sessions
            </h3>
            <button
              onClick={onShowMentors}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--ispora-brand)] text-white text-xs font-bold rounded-lg hover:bg-[#1a35f8] transition-colors"
            >
              {mentorships.length > 0 ? (
                <>
                  <Users className="w-3.5 h-3.5" strokeWidth={2.5} />
                  My Mentors
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" strokeWidth={2.5} />
                  Browse Mentors
                </>
              )}
            </button>
          </div>
          <div className="overflow-y-auto p-5" style={{ maxHeight: 'calc(100vh - 180px)' }}>
          {upcomingSessions.length === 0 && sessionSeries.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-14 h-14 bg-[var(--ispora-brand-light)] rounded-full flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-6 h-6 text-[var(--ispora-brand)]" strokeWidth={1.8} />
              </div>
              <h4 className="font-syne text-[15px] font-bold text-[var(--ispora-text)] mb-1.5">
                No sessions scheduled
              </h4>
              <p className="text-[13px] text-[var(--ispora-text3)] max-w-[280px] mx-auto">
                Connect with a mentor and book your first session
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Render Series Cards First */}
              {sessionSeries.map((series) => {
                const timingStatus = getSessionTimingStatus(series.nextSessionDate);
                const isPublic = series.sessionType === 'public';
                const isGroup = series.sessionType === 'group';

                return (
                  <div 
                    key={series.seriesId} 
                    className="group border-[1.5px] border-[var(--ispora-border)] rounded-xl p-4 hover:border-[var(--ispora-brand)] hover:shadow-lg transition-all cursor-pointer bg-gradient-to-br from-white to-[#f7f8ff]"
                    onClick={() => handleSessionClick(series.sessions[0])}
                  >
                    {/* Series Badge */}
                    <div className="mb-3 flex items-center gap-2 flex-wrap">
                      <div className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-[var(--ispora-accent)] text-white">
                        <Repeat className="w-2.5 h-2.5" strokeWidth={2.5} />
                        RECURRING PROGRAM
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

                    {/* Header with mentor */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[var(--ispora-brand)] to-[#1a35f8] flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md">
                        {series.mentor?.firstName?.[0]}{series.mentor?.lastName?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-syne font-bold text-[13px] text-[var(--ispora-text)] mb-0.5">
                          {series.mentor?.firstName} {series.mentor?.lastName}
                        </div>
                        <div className="font-semibold text-[12px] text-[var(--ispora-brand)] mb-1">
                          {series.topic}
                        </div>
                        <div className="text-[10px] text-[var(--ispora-text3)]">
                          {series.recurrencePattern}
                        </div>
                      </div>
                      <div className={`
                        text-[9px] font-bold px-2 py-1 rounded-full flex-shrink-0
                        ${timingStatus.status === 'starting' ? 'bg-[var(--ispora-accent-light)] text-[var(--ispora-accent)] animate-pulse' : ''}
                        ${timingStatus.status === 'soon' ? 'bg-[var(--ispora-brand-light)] text-[var(--ispora-brand)]' : ''}
                        ${timingStatus.status === 'today' ? 'bg-[var(--ispora-success-light)] text-[var(--ispora-success)]' : ''}
                        ${timingStatus.status === 'upcoming' ? 'bg-[var(--ispora-bg)] text-[var(--ispora-text3)]' : ''}
                      `}>
                        {timingStatus.label}
                      </div>
                    </div>

                    {/* Progress Section */}
                    <div className="bg-white rounded-lg p-3 mb-3 border-[1.5px] border-[var(--ispora-border)]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-[var(--ispora-text)]">
                          Session {series.completedSessions + 1} of {series.totalSessions}
                        </span>
                        <span className="text-xs font-semibold text-[var(--ispora-brand)]">
                          {Math.round((series.completedSessions / series.totalSessions) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-[var(--ispora-bg)] rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-[var(--ispora-brand)] h-full transition-all"
                          style={{ width: `${(series.completedSessions / series.totalSessions) * 100}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-2 text-[10px] text-[var(--ispora-text3)]">
                        <span>✅ {series.completedSessions} completed</span>
                        <span>📅 {series.remainingSessions} remaining</span>
                      </div>
                    </div>

                    {/* Next Session Info */}
                    <div className="mb-2">
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-[10px] font-semibold text-[var(--ispora-text3)]">Next Session:</div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const sessionDate = new Date(series.sessions[0].scheduledAt);
                            const duration = series.duration || 60;
                            const endTime = new Date(sessionDate.getTime() + duration * 60000);
                            
                            setCalendarEvent({
                              title: series.topic || 'Mentorship Session',
                              description: `Recurring Mentorship Session\\n\\nMentor: ${series.mentor?.firstName} ${series.mentor?.lastName}\\n\\nRecurring Program: ${series.totalSessions} sessions`,
                              location: series.sessions[0].meetingLink || 'Online',
                              startTime: sessionDate,
                              endTime: endTime,
                              organizerName: `${series.mentor?.firstName} ${series.mentor?.lastName}`,
                              sessionUrl: `${window.location.origin}/dashboard`
                            });
                            setShowCalendarModal(true);
                          }}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg border-[1.5px] border-[var(--ispora-border)] text-[var(--ispora-text2)] hover:border-[var(--ispora-brand)] hover:text-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] transition-all"
                          title="Add to Calendar"
                        >
                          <CalendarPlus className="w-3 h-3" strokeWidth={2} />
                          <span className="text-[9px] font-semibold whitespace-nowrap">Add to Calendar</span>
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-[var(--ispora-text3)] mb-2">
                        <Clock className="w-3 h-3" strokeWidth={2} />
                        {series.nextSessionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {series.nextSessionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    {/* Attendance Info for Public/Group Sessions */}
                    {(isPublic || isGroup) && (
                      <div className="mb-3 flex items-center gap-1.5 text-[11px] text-[var(--ispora-text2)]">
                        <Users className="w-3.5 h-3.5 text-[var(--ispora-text3)]" strokeWidth={2} />
                        <span className="font-semibold text-[var(--ispora-brand)]">{series.registeredCount} attending</span>
                        <span className="text-[var(--ispora-text3)]">·</span>
                        <span className={series.registeredCount >= series.capacity ? 'text-[var(--ispora-danger)] font-semibold' : 'text-[var(--ispora-success)]'}>
                          {series.capacity - series.registeredCount} spots left
                        </span>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2.5 border-t-[1.5px] border-[var(--ispora-border)]">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-[11px] text-[var(--ispora-text3)]">
                          <Video className="w-3.5 h-3.5" strokeWidth={2} />
                          <span className="font-medium">{series.platform}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-[var(--ispora-text3)]">
                          <Clock className="w-3.5 h-3.5" strokeWidth={2} />
                          <span>{series.duration} min</span>
                        </div>
                        <div className="text-[10px] text-[var(--ispora-text3)]">
                          📆 Until {series.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })}

              {/* Render Standalone Sessions - Show all sessions */}
              {upcomingSessions.map((session: any) => {
                const sessionDate = new Date(session.scheduledAt);
                const timingStatus = getSessionTimingStatus(sessionDate);
                let sessionDetails = { platform: 'Not specified', description: '' };
                
                // Parse notes if it's JSON
                try {
                  if (session.notes) {
                    const parsed = JSON.parse(session.notes);
                    sessionDetails = parsed;
                  }
                } catch (e) {
                  // If not JSON, treat as old format "Platform: X"
                  if (session.notes?.includes('Platform:')) {
                    sessionDetails.platform = session.notes.replace('Platform:', '').trim();
                  }
                }

                return (
                  <div 
                    key={session.id} 
                    className="group border-[1.5px] border-[var(--ispora-border)] rounded-xl p-4 hover:border-[var(--ispora-brand)] hover:shadow-lg transition-all cursor-pointer bg-white"
                    onClick={() => handleSessionClick(session)}
                  >
                    {/* Header with mentor and timing */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[var(--ispora-brand)] to-[#1a35f8] flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md">
                        {session.mentor?.firstName?.[0]}{session.mentor?.lastName?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-syne font-bold text-[13px] text-[var(--ispora-text)] mb-0.5">
                          {session.mentor?.firstName} {session.mentor?.lastName}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-[var(--ispora-text3)]">
                          <Clock className="w-3 h-3" strokeWidth={2} />
                          {sessionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {sessionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <div className={`
                        text-[9px] font-bold px-2 py-1 rounded-full flex-shrink-0
                        ${timingStatus.status === 'starting' ? 'bg-[var(--ispora-accent-light)] text-[var(--ispora-accent)] animate-pulse' : ''}
                        ${timingStatus.status === 'soon' ? 'bg-[var(--ispora-brand-light)] text-[var(--ispora-brand)]' : ''}
                        ${timingStatus.status === 'today' ? 'bg-[var(--ispora-success-light)] text-[var(--ispora-success)]' : ''}
                        ${timingStatus.status === 'upcoming' ? 'bg-[var(--ispora-bg)] text-[var(--ispora-text3)]' : ''}
                      `}>
                        {timingStatus.label}
                      </div>
                    </div>

                    {/* Topic */}
                    {session.topic && (
                      <div className="mb-2.5">
                        <div className="font-semibold text-[12px] text-[var(--ispora-text)] flex items-center gap-1.5 flex-wrap">
                          <Target className="w-3.5 h-3.5 text-[var(--ispora-brand)]" strokeWidth={2} />
                          {session.topic}
                          {sessionDetails.isRecurring && (
                            <div className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-[var(--ispora-accent)] text-white">
                              <Repeat className="w-2.5 h-2.5" strokeWidth={2.5} />
                              {sessionDetails.sessionNumber}/{sessionDetails.totalSessions}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    {sessionDetails.description && (
                      <div className="mb-3">
                        <p className="text-[11px] text-[var(--ispora-text2)] leading-relaxed line-clamp-2">
                          {sessionDetails.description}
                        </p>
                      </div>
                    )}

                    {/* Footer with platform, duration, and add to calendar */}
                    <div className="flex items-center justify-between pt-2.5 border-t-[1.5px] border-[var(--ispora-border)]">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-[11px] text-[var(--ispora-text3)]">
                          <Video className="w-3.5 h-3.5" strokeWidth={2} />
                          <span className="font-medium">{sessionDetails.platform}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-[var(--ispora-text3)]">
                          <Clock className="w-3.5 h-3.5" strokeWidth={2} />
                          <span>{session.duration} min</span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const duration = session.duration || 60;
                          const endTime = new Date(sessionDate.getTime() + duration * 60000);
                          
                          setCalendarEvent({
                            title: `Mentorship: ${session.topic || 'Session'}`,
                            description: `Mentorship Session\n\nMentor: ${session.mentor?.firstName} ${session.mentor?.lastName}`,
                            location: session.meetingLink || 'Online',
                            startTime: sessionDate,
                            endTime: endTime,
                            organizerName: `${session.mentor?.firstName} ${session.mentor?.lastName}`,
                            sessionUrl: `${window.location.origin}/dashboard`
                          });
                          setShowCalendarModal(true);
                        }}
                        className="p-1.5 rounded-lg border-[1.5px] border-[var(--ispora-border)] text-[var(--ispora-text2)] hover:border-[var(--ispora-brand)] hover:text-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] transition-all"
                        title="Add to Calendar"
                      >
                        <CalendarPlus className="w-3.5 h-3.5" strokeWidth={2} />
                      </button>
                    </div>

                    {/* Hover action hint */}
                    <div className="mt-2.5 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] font-semibold text-[var(--ispora-brand)]">
                        Click to view details & join →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          </div>
        </div>
        </div>

        {/* Right Column - Recommendations & Calendar */}
        <div className="lg:col-span-4 space-y-4">
          {/* Recommended Mentors */}
          <RecommendedMentors 
            onNavigateToProfile={onNavigateToProfile} 
            onNavigateToFindMentor={onNavigateToFindMentor}
          />
          
          {/* My Sessions Calendar */}
          <div className="bg-white border-[1.5px] border-[var(--ispora-border)] rounded-2xl overflow-hidden flex flex-col">
            <div className="px-3 py-2 border-b-[1.5px] border-[var(--ispora-border)]">
              <div className="font-syne text-xs font-bold text-[var(--ispora-text)]">
                📅 My Sessions Calendar
              </div>
            </div>
            <div className="p-2.5">
              <SessionCalendar sessions={[...upcomingSessions, ...sessionSeries.flatMap(s => s.sessions)]} />
            </div>
          </div>
        </div>
      </div>

      {/* Public Sessions Section */}
      <div className="mt-5">
        <div className="bg-white border-[1.5px] border-[var(--ispora-border)] rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b-[1.5px] border-[var(--ispora-border)]">
                {/* Tabs */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setPublicSessionsTab('available')}
                    className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                      publicSessionsTab === 'available'
                        ? 'bg-[var(--ispora-brand)] text-white shadow-sm'
                        : 'bg-[var(--ispora-bg)] text-[var(--ispora-text2)] hover:bg-[var(--ispora-brand-light)] hover:text-[var(--ispora-brand)]'
                    }`}
                  >
                    Available Public ({standalonePublicSessions.length + publicSessionSeries.length})
                  </button>
                  <button
                    onClick={() => setPublicSessionsTab('past')}
                    className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                      publicSessionsTab === 'past'
                        ? 'bg-[var(--ispora-brand)] text-white shadow-sm'
                        : 'bg-[var(--ispora-bg)] text-[var(--ispora-text2)] hover:bg-[var(--ispora-brand-light)] hover:text-[var(--ispora-brand)]'
                    }`}
                  >
                    🎥 Recordings ({pastSessions.filter(s => s.recordingUrl).length})
                  </button>
                </div>
              </div>

        {/* Available Public Sessions Tab */}
        {publicSessionsTab === 'available' && (
          <>
        {standalonePublicSessions.length === 0 && publicSessionSeries.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-[var(--ispora-brand-light)] rounded-full flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-7 h-7 text-[var(--ispora-brand)]" strokeWidth={1.8} />
            </div>
            <h4 className="font-syne text-base font-bold text-[var(--ispora-text)] mb-2">
              No public sessions available
            </h4>
            <p className="text-sm text-[var(--ispora-text3)] max-w-[400px] mx-auto">
              Check back soon! Mentors regularly host public sessions, workshops, and AMAs for all students.
            </p>
          </div>
        ) : (
          <div className="p-5 overflow-y-auto" style={{ maxHeight: '500px' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Render Public Series Cards First */}
            {publicSessionSeries.map((series) => {
              const spotsLeft = series.capacity - series.registeredCount;
              const isFull = spotsLeft <= 0;
              const isRegistered = user && series.registeredStudents.includes(user.id);

              return (
                <div 
                  key={series.seriesId}
                  className="group bg-[var(--ispora-bg)] border-[1.5px] border-[var(--ispora-border)] rounded-xl p-4 hover:border-[var(--ispora-accent)] hover:shadow-md transition-all cursor-pointer"
                  onClick={() => handleSessionClick(series.sessions[0])}
                >
                  {/* Series Badge */}
                  <div className="mb-3 flex items-center gap-2 flex-wrap">
                    <div className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-[var(--ispora-accent)] text-white">
                      <Repeat className="w-2.5 h-2.5" strokeWidth={2.5} />
                      RECURRING PROGRAM
                    </div>
                    <div className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-[var(--ispora-brand)] text-white">
                      PUBLIC
                    </div>
                  </div>

                  {/* Mentor Info */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-[var(--ispora-brand)] flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md">
                      {series.mentor?.firstName?.[0]}{series.mentor?.lastName?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-syne font-bold text-sm text-[var(--ispora-text)] mb-0.5 truncate">
                        {series.mentor?.firstName} {series.mentor?.lastName}
                      </div>
                      <div className="font-semibold text-[13px] text-[var(--ispora-brand)] mb-1 truncate">
                        {series.topic}
                      </div>
                      <div className="text-[10px] text-[var(--ispora-text3)]">
                        {series.recurrencePattern}
                      </div>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="bg-white rounded-lg p-3 mb-3 border-[1.5px] border-[var(--ispora-border)]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-[var(--ispora-text)]">
                        Session {series.completedSessions + 1} of {series.totalSessions}
                      </span>
                      <span className="text-xs font-semibold text-[var(--ispora-accent)]">
                        {Math.round((series.completedSessions / series.totalSessions) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-[var(--ispora-bg)] rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-[var(--ispora-accent)] h-full transition-all"
                        style={{ width: `${(series.completedSessions / series.totalSessions) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Social Features */}
                  <div className="flex items-center gap-3 mb-3 text-[11px]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLikeSession(series.sessions[0].id, series.sessions[0].isLikedByCurrentUser);
                      }}
                      disabled={likingSessionIds.has(series.sessions[0].id)}
                      className={`flex items-center gap-1 transition-colors ${
                        likingSessionIds.has(series.sessions[0].id) 
                          ? 'text-[var(--ispora-text3)] opacity-50 cursor-wait' 
                          : 'text-[var(--ispora-text3)] hover:text-[var(--ispora-brand)]'
                      }`}
                    >
                      <Heart
                        className={`w-3.5 h-3.5 ${series.sessions[0].isLikedByCurrentUser ? 'fill-[var(--ispora-brand)] text-[var(--ispora-brand)]' : ''}`}
                        strokeWidth={2}
                      />
                      <span className="font-semibold">{series.sessions[0].likesCount || 0}</span>
                    </button>
                    <div className="flex items-center gap-1 text-[var(--ispora-text3)]">
                      <Eye className="w-3.5 h-3.5" strokeWidth={2} />
                      <span className="font-semibold">{series.sessions[0].viewsCount || 0}</span>
                    </div>
                  </div>

                  {/* Next Session */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-[10px] font-semibold text-[var(--ispora-text3)]">Next:</div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const sessionDate = new Date(series.sessions[0].scheduledAt);
                          const duration = series.sessions[0].duration || 60;
                          const endTime = new Date(sessionDate.getTime() + duration * 60000);
                          
                          setCalendarEvent({
                            title: series.topic || 'Public Mentorship Session',
                            description: `Public Recurring Session\n\nMentor: ${series.mentor?.firstName} ${series.mentor?.lastName}\n\nRecurring Program: ${series.totalSessions} sessions\n\n${series.registeredCount} students attending`,
                            location: series.sessions[0].meetingLink || 'Online',
                            startTime: sessionDate,
                            endTime: endTime,
                            organizerName: `${series.mentor?.firstName} ${series.mentor?.lastName}`,
                            sessionUrl: `${window.location.origin}/dashboard`
                          });
                          setShowCalendarModal(true);
                        }}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg border-[1.5px] border-[var(--ispora-border)] text-[var(--ispora-text2)] hover:border-[var(--ispora-brand)] hover:text-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] transition-all"
                        title="Add to Calendar"
                      >
                        <CalendarPlus className="w-3 h-3" strokeWidth={2} />
                        <span className="text-[9px] font-semibold whitespace-nowrap">Add to Calendar</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-[var(--ispora-text3)]">
                      <Calendar className="w-3.5 h-3.5" strokeWidth={2} />
                      {series.nextSessionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {series.nextSessionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {/* Capacity & CTA */}
                  <div className="flex items-center justify-between pt-3 border-t-[1.5px] border-[var(--ispora-border)]">
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <Users className="w-3.5 h-3.5 text-[var(--ispora-text3)]" strokeWidth={2} />
                      <span className="font-semibold text-[var(--ispora-brand)]">{series.registeredCount} attending</span>
                      <span className="text-[var(--ispora-text3)]">·</span>
                      <span className={isFull ? 'text-[var(--ispora-danger)] font-semibold' : 'text-[var(--ispora-success)]'}>
                        {isFull ? 'Full' : `${spotsLeft} spots left`}
                      </span>
                    </div>
                    <div>
                      {isRegistered ? (
                        <div className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-[var(--ispora-success-light)] text-[var(--ispora-success)]">
                          <CheckCircle2 className="w-3 h-3" strokeWidth={2.5} />
                          You're In!
                        </div>
                      ) : (
                        <button
                          onClick={(e) => handleRegisterForSession(series.sessions[0].id, e)}
                          disabled={isFull || registeringSession === series.sessions[0].id}
                          className={`
                            text-[10px] font-bold px-2.5 py-1 rounded-full transition-all
                            ${isFull 
                              ? 'bg-[var(--ispora-bg)] text-[var(--ispora-text3)] cursor-not-allowed' 
                              : registeringSession === series.sessions[0].id
                              ? 'bg-[var(--ispora-brand)] text-white opacity-50 cursor-wait'
                              : 'bg-[var(--ispora-brand)] text-white hover:shadow-md hover:scale-105'
                            }
                          `}
                        >
                          {registeringSession === series.sessions[0].id ? 'Joining...' : isFull ? 'Full' : 'Count Me In!'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Render Standalone Public Sessions */}
            {standalonePublicSessions.map((session: any) => {
                const sessionDate = new Date(session.scheduledAt);
                let sessionDetails = { platform: 'Not specified', description: '', capacity: 10, registeredCount: 0, registeredStudents: [] };
                
                try {
                  if (session.notes) {
                    const parsed = JSON.parse(session.notes);
                    sessionDetails = { ...sessionDetails, ...parsed };
                  }
                } catch (e) {}

                const spotsLeft = sessionDetails.capacity - sessionDetails.registeredCount;
                const isFull = spotsLeft <= 0;
                const isRegistered = user && sessionDetails.registeredStudents.includes(user.id);

                return (
                  <div 
                    key={session.id}
                    className="group bg-[var(--ispora-bg)] border-[1.5px] border-[var(--ispora-border)] rounded-xl p-4 hover:border-[var(--ispora-brand)] hover:shadow-md transition-all cursor-pointer"
                    onClick={() => handleSessionClick(session)}
                  >
                    {/* Mentor Info */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-[var(--ispora-brand)] flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md">
                        {session.mentor?.firstName?.[0]}{session.mentor?.lastName?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-syne font-bold text-sm text-[var(--ispora-text)] mb-0.5 truncate">
                          {session.mentor?.firstName} {session.mentor?.lastName}
                        </div>
                        <div className="text-[10px] text-[var(--ispora-text3)] truncate">
                          {session.mentor?.currentRole || 'Diaspora Mentor'}
                        </div>
                      </div>
                    </div>

                    {/* Topic */}
                    <div className="mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-[13px] text-[var(--ispora-text)] line-clamp-2 min-h-[36px]">
                          {session.topic || 'Mentorship Session'}
                        </h4>
                        {sessionDetails.isRecurring && (
                          <div className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-[var(--ispora-accent)] text-white">
                            <Repeat className="w-2.5 h-2.5" strokeWidth={2.5} />
                            {sessionDetails.sessionNumber}/{sessionDetails.totalSessions}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    {sessionDetails.description && (
                      <p className="text-[11px] text-[var(--ispora-text2)] leading-relaxed line-clamp-2 mb-3">
                        {sessionDetails.description}
                      </p>
                    )}

                    {/* Social Features */}
                    <div className="flex items-center gap-3 mb-3 text-[11px]">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLikeSession(session.id, session.isLikedByCurrentUser);
                        }}
                        disabled={likingSessionIds.has(session.id)}
                        className={`flex items-center gap-1 transition-colors ${
                          likingSessionIds.has(session.id) 
                            ? 'text-[var(--ispora-text3)] opacity-50 cursor-wait' 
                            : 'text-[var(--ispora-text3)] hover:text-[var(--ispora-brand)]'
                        }`}
                      >
                        <Heart
                          className={`w-3.5 h-3.5 ${session.isLikedByCurrentUser ? 'fill-[var(--ispora-brand)] text-[var(--ispora-brand)]' : ''}`}
                          strokeWidth={2}
                        />
                        <span className="font-semibold">{session.likesCount || 0}</span>
                      </button>
                      <div className="flex items-center gap-1 text-[var(--ispora-text3)]">
                        <Eye className="w-3.5 h-3.5" strokeWidth={2} />
                        <span className="font-semibold">{session.viewsCount || 0}</span>
                      </div>
                    </div>

                    {/* Session Info */}
                    <div className="space-y-1.5 mb-3 pt-3 border-t-[1.5px] border-[var(--ispora-border)]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[11px] text-[var(--ispora-text3)]">
                          <Calendar className="w-3.5 h-3.5" strokeWidth={2} />
                          <span>{sessionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {sessionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const sessionDate = new Date(session.scheduledAt);
                            const duration = session.duration || 60;
                            const endTime = new Date(sessionDate.getTime() + duration * 60000);
                            
                            setCalendarEvent({
                              title: session.topic || 'Public Mentorship Session',
                              description: `Public Session\n\nMentor: ${session.mentor?.firstName} ${session.mentor?.lastName}\n\n${sessionDetails.registeredCount} students attending`,
                              location: session.meetingLink || 'Online',
                              startTime: sessionDate,
                              endTime: endTime,
                              organizerName: `${session.mentor?.firstName} ${session.mentor?.lastName}`,
                              sessionUrl: `${window.location.origin}/dashboard`
                            });
                            setShowCalendarModal(true);
                          }}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg border-[1.5px] border-[var(--ispora-border)] text-[var(--ispora-text2)] hover:border-[var(--ispora-brand)] hover:text-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] transition-all"
                          title="Add to Calendar"
                        >
                          <CalendarPlus className="w-3 h-3" strokeWidth={2} />
                          <span className="text-[9px] font-semibold whitespace-nowrap">Add to Calendar</span>
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-[var(--ispora-text3)]">
                        <Video className="w-3.5 h-3.5" strokeWidth={2} />
                        <span>{sessionDetails.platform} • {session.duration} min</span>
                      </div>
                    </div>

                    {/* Capacity & CTA */}
                    <div className="flex items-center justify-between">
                      <div className={`text-[10px] font-bold ${isFull ? 'text-[var(--ispora-danger)]' : 'text-[var(--ispora-success)]'}`}>
                        {isFull ? 'Full' : `${spotsLeft} spots left`}
                      </div>
                      <div>
                        {isRegistered ? (
                          <div className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-[var(--ispora-success-light)] text-[var(--ispora-success)]">
                            <CheckCircle2 className="w-3 h-3" strokeWidth={2.5} />
                            You're In!
                          </div>
                        ) : (
                          <button
                            onClick={(e) => handleRegisterForSession(session.id, e)}
                            disabled={isFull || registeringSession === session.id}
                            className={`
                              text-[10px] font-bold px-2.5 py-1 rounded-full transition-all
                              ${isFull 
                                ? 'bg-[var(--ispora-bg)] text-[var(--ispora-text3)] cursor-not-allowed' 
                                : registeringSession === session.id
                                ? 'bg-[var(--ispora-brand)] text-white opacity-50 cursor-wait'
                                : 'bg-[var(--ispora-brand)] text-white hover:shadow-md hover:scale-105'
                              }
                            `}
                          >
                            {registeringSession === session.id ? 'Joining...' : isFull ? 'Full' : 'Count Me In!'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
          </>
        )}

        {/* Recordings Tab */}
        {publicSessionsTab === 'past' && (
          <div className="overflow-y-auto" style={{ maxHeight: '600px' }}>
            {/* Tab Description */}
            <div className="px-5 pt-4 pb-3 border-b-[1.5px] border-[var(--ispora-border)] bg-[var(--ispora-bg)]">
              <p className="text-xs text-[var(--ispora-text3)]">
                Watch recordings from your completed sessions
              </p>
            </div>
            
            <div className="p-5">
            {pastSessions.filter(s => s.recordingUrl).length === 0 ? (
              <div className="text-center py-10">
                <div className="w-16 h-16 bg-[var(--ispora-bg)] rounded-full flex items-center justify-center mx-auto mb-3">
                  <Video className="w-7 h-7 text-[var(--ispora-text3)]" strokeWidth={1.8} />
                </div>
                <h4 className="font-syne text-base font-bold text-[var(--ispora-text)] mb-2">
                  No recordings available yet
                </h4>
                <p className="text-sm text-[var(--ispora-text3)] max-w-[400px] mx-auto">
                  Recordings will appear here when mentors upload them after sessions.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pastSessions.filter(s => s.recordingUrl).map((session: any) => {
                  const sessionDate = new Date(session.scheduledAt);
                  const hasRecording = !!session.recordingUrl;
                  
                  return (
                    <div
                      key={session.id}
                      className="border-[1.5px] border-[var(--ispora-border)] rounded-xl p-4 hover:shadow-lg transition-all bg-white"
                    >
                      {/* Header with mentor */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[var(--ispora-brand)] to-[#1a35f8] flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md">
                          {session.mentor?.firstName?.[0]}{session.mentor?.lastName?.[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-syne font-bold text-[13px] text-[var(--ispora-text)] mb-0.5">
                            {session.mentor?.firstName} {session.mentor?.lastName}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-[var(--ispora-text3)]">
                            <Clock className="w-3 h-3" strokeWidth={2} />
                            {sessionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        </div>
                        {hasRecording && (
                          <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full">
                            <Video className="w-3.5 h-3.5" strokeWidth={2} />
                            <span className="text-[9px] font-bold">RECORDING</span>
                          </div>
                        )}
                      </div>

                      {/* Topic */}
                      {session.topic && (
                        <div className="mb-3">
                          <div className="font-semibold text-[13px] text-[var(--ispora-text)] flex items-center gap-1.5">
                            <Target className="w-3.5 h-3.5 text-[var(--ispora-brand)]" strokeWidth={2} />
                            {session.topic}
                          </div>
                        </div>
                      )}

                      {/* Recording info */}
                      {hasRecording && session.recordingDuration && (
                        <div className="mb-3 text-[11px] text-[var(--ispora-text3)]">
                          <Clock className="w-3 h-3 inline mr-1" strokeWidth={2} />
                          {session.recordingDuration} minutes
                        </div>
                      )}

                      {/* Action button */}
                      {hasRecording ? (
                        <button
                          onClick={() => window.open(session.recordingUrl, '_blank')}
                          className="w-full px-4 py-2.5 bg-[var(--ispora-brand)] text-white rounded-lg flex items-center justify-center gap-2 font-semibold text-[13px] hover:bg-[#1a35f8] transition-all shadow-sm"
                        >
                          <Video className="w-4 h-4" strokeWidth={2} />
                          Watch Recording
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedSession(session);
                            setShowSessionModal(true);
                          }}
                          className="w-full px-4 py-2.5 border-[1.5px] border-[var(--ispora-border)] text-[var(--ispora-text2)] rounded-lg flex items-center justify-center gap-2 font-semibold text-[13px] hover:border-[var(--ispora-brand)] hover:text-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] transition-all"
                        >
                          View Details
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Session Modal */}
      {showSessionModal && selectedSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 md:p-4">
          <div className="bg-white rounded-2xl max-w-[95vw] md:max-w-[480px] w-full max-h-[88vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b-[1.5px] border-[var(--ispora-border)] px-6 py-4 flex items-center justify-between">
              <h3 className="font-syne text-lg font-bold text-[var(--ispora-text)]">
                Session Details
              </h3>
              <button
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--ispora-text2)] hover:bg-[var(--ispora-bg)] hover:text-[var(--ispora-brand)] transition-all"
                onClick={() => setShowSessionModal(false)}
              >
                <X className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              {/* Mentor Info */}
              <div className="flex items-center gap-4 p-4 bg-[var(--ispora-bg)] rounded-xl">
                <div className="w-14 h-14 rounded-full bg-[var(--ispora-brand)] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {selectedSession.mentor?.firstName?.[0]}{selectedSession.mentor?.lastName?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-syne font-bold text-base text-[var(--ispora-text)] mb-0.5">
                    {selectedSession.mentor?.firstName} {selectedSession.mentor?.lastName}
                  </div>
                  <div className="text-xs text-[var(--ispora-text3)]">
                    Mentor · Diaspora Professional
                  </div>
                </div>
              </div>

              {/* Session Type Badge */}
              {(() => {
                let sessionType = 'private';
                let capacity = 0;
                let registeredCount = 0;
                try {
                  if (selectedSession.notes) {
                    const parsed = JSON.parse(selectedSession.notes);
                    sessionType = parsed.sessionType || 'private';
                    capacity = parsed.capacity || 0;
                    registeredCount = parsed.registeredCount || 0;
                  }
                } catch (e) {}

                if (sessionType === 'public') {
                  const spotsLeft = capacity - registeredCount;
                  return (
                    <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-[var(--ispora-brand-light)] to-[var(--ispora-accent-light)] rounded-xl border-[1.5px] border-[var(--ispora-brand)]">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="text-xs font-bold px-2.5 py-1 rounded-full bg-[var(--ispora-brand)] text-white">
                            PUBLIC SESSION
                          </div>
                          <Users className="w-4 h-4 text-[var(--ispora-brand)]" strokeWidth={2} />
                        </div>
                        <div className="text-xs text-[var(--ispora-text2)]">
                          Open to all students • <span className="font-semibold">{spotsLeft} spots remaining</span> of {capacity}
                        </div>
                      </div>
                    </div>
                  );
                } else if (sessionType === 'group') {
                  return (
                    <div className="flex items-center gap-2 p-3 bg-[var(--ispora-success-light)] rounded-xl">
                      <Users className="w-4 h-4 text-[var(--ispora-success)]" strokeWidth={2} />
                      <div className="text-xs font-semibold text-[var(--ispora-success)]">
                        GROUP SESSION
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Session Info */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--ispora-brand-light)] flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-[var(--ispora-brand)]" strokeWidth={2} />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-[var(--ispora-text3)] mb-0.5">Date & Time</div>
                    <div className="font-semibold text-sm text-[var(--ispora-text)]">
                      {new Date(selectedSession.scheduledAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                    <div className="text-sm text-[var(--ispora-text2)] mt-0.5">
                      {new Date(selectedSession.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--ispora-accent-light)] flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-[var(--ispora-accent)]" strokeWidth={2} />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-[var(--ispora-text3)] mb-0.5">Duration</div>
                    <div className="font-semibold text-sm text-[var(--ispora-text)]">
                      {selectedSession.duration} minutes
                    </div>
                  </div>
                </div>

                {selectedSession.topic && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[var(--ispora-success-light)] flex items-center justify-center flex-shrink-0">
                      <Target className="w-5 h-5 text-[var(--ispora-success)]" strokeWidth={2} />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-[var(--ispora-text3)] mb-0.5">Topic</div>
                      <div className="font-semibold text-sm text-[var(--ispora-text)]">
                        {selectedSession.topic}
                      </div>
                    </div>
                  </div>
                )}

                {(() => {
                  let sessionDetails = { platform: 'Not specified', description: '' };
                  try {
                    if (selectedSession.notes) {
                      const parsed = JSON.parse(selectedSession.notes);
                      sessionDetails = parsed;
                    }
                  } catch (e) {
                    if (selectedSession.notes?.includes('Platform:')) {
                      sessionDetails.platform = selectedSession.notes.replace('Platform:', '').trim();
                    }
                  }

                  return (
                    <>
                      {sessionDetails.isRecurring && (
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[var(--ispora-accent-light)] flex items-center justify-center flex-shrink-0">
                            <Repeat className="w-5 h-5 text-[var(--ispora-accent)]" strokeWidth={2} />
                          </div>
                          <div className="flex-1">
                            <div className="text-xs text-[var(--ispora-text3)] mb-0.5">Recurring Session</div>
                            <div className="font-semibold text-sm text-[var(--ispora-text)] mb-1">
                              Session {sessionDetails.sessionNumber} of {sessionDetails.totalSessions}
                            </div>
                            <div className="text-xs text-[var(--ispora-text3)]">
                              {sessionDetails.recurrencePattern?.days?.includes('daily') 
                                ? 'Daily sessions' 
                                : `${sessionDetails.recurrencePattern?.days?.length || 0} day${sessionDetails.recurrencePattern?.days?.length > 1 ? 's' : ''} per week`}
                              {sessionDetails.recurrencePattern?.startDate && sessionDetails.recurrencePattern?.endDate && (
                                <> · {new Date(sessionDetails.recurrencePattern.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} to {new Date(sessionDetails.recurrencePattern.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {sessionDetails.description && (
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[var(--ispora-brand-light)] flex items-center justify-center flex-shrink-0">
                            <MessageCircle className="w-5 h-5 text-[var(--ispora-brand)]" strokeWidth={2} />
                          </div>
                          <div className="flex-1">
                            <div className="text-xs text-[var(--ispora-text3)] mb-0.5">Description</div>
                            <div className="text-sm text-[var(--ispora-text)] leading-relaxed">
                              {sessionDetails.description}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[var(--ispora-bg)] flex items-center justify-center flex-shrink-0">
                          <Video className="w-5 h-5 text-[var(--ispora-text2)]" strokeWidth={2} />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs text-[var(--ispora-text3)] mb-0.5">Platform</div>
                          <div className="font-semibold text-sm text-[var(--ispora-text)]">
                            {sessionDetails.platform}
                          </div>
                        </div>
                      </div>

                      {sessionDetails.meetingLink && (
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[var(--ispora-success-light)] flex items-center justify-center flex-shrink-0">
                            <Link2 className="w-5 h-5 text-[var(--ispora-success)]" strokeWidth={2} />
                          </div>
                          <div className="flex-1">
                            <div className="text-xs text-[var(--ispora-text3)] mb-0.5">Meeting Link</div>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={sessionDetails.meetingLink}
                                readOnly
                                className="flex-1 px-3 py-2 bg-[var(--ispora-bg)] border-[1.5px] border-[var(--ispora-border)] rounded-lg text-xs text-[var(--ispora-text)] outline-none"
                              />
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(sessionDetails.meetingLink);
                                  alert('Meeting link copied!');
                                }}
                                className="px-3 py-2 rounded-lg bg-white border-[1.5px] border-[var(--ispora-border)] text-[var(--ispora-text)] text-xs font-semibold hover:border-[var(--ispora-brand)] hover:text-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] transition-all"
                              >
                                Copy
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* Timing Status */}
              {(() => {
                const sessionDate = new Date(selectedSession.scheduledAt);
                const timingStatus = getSessionTimingStatus(sessionDate);
                
                return (
                  <div className={`
                    p-4 rounded-xl flex items-center gap-3
                    ${timingStatus.status === 'starting' ? 'bg-[var(--ispora-accent-light)] border-2 border-[var(--ispora-accent)]' : ''}
                    ${timingStatus.status === 'soon' ? 'bg-[var(--ispora-brand-light)] border-2 border-[var(--ispora-brand)]' : ''}
                    ${timingStatus.status === 'today' ? 'bg-[var(--ispora-success-light)]' : ''}
                    ${timingStatus.status === 'upcoming' ? 'bg-[var(--ispora-bg)]' : ''}
                  `}>
                    <Clock className={`
                      w-5 h-5 flex-shrink-0
                      ${timingStatus.status === 'starting' ? 'text-[var(--ispora-accent)] animate-pulse' : ''}
                      ${timingStatus.status === 'soon' ? 'text-[var(--ispora-brand)]' : ''}
                      ${timingStatus.status === 'today' ? 'text-[var(--ispora-success)]' : ''}
                      ${timingStatus.status === 'upcoming' ? 'text-[var(--ispora-text2)]' : ''}
                    `} strokeWidth={2} />
                    <div className="flex-1">
                      <div className={`
                        font-semibold text-sm
                        ${timingStatus.status === 'starting' ? 'text-[var(--ispora-accent)]' : ''}
                        ${timingStatus.status === 'soon' ? 'text-[var(--ispora-brand)]' : ''}
                        ${timingStatus.status === 'today' ? 'text-[var(--ispora-success)]' : ''}
                        ${timingStatus.status === 'upcoming' ? 'text-[var(--ispora-text)]' : ''}
                      `}>
                        {timingStatus.label}
                      </div>
                      {timingStatus.status === 'starting' && (
                        <div className="text-xs text-[var(--ispora-text3)] mt-0.5">
                          Your session is starting soon! Join now.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Action Buttons */}
              <div className="space-y-2.5">
                {(() => {
                  const sessionDate = new Date(selectedSession.scheduledAt);
                  const timingStatus = getSessionTimingStatus(sessionDate);
                  const canJoin = timingStatus.status === 'starting' || timingStatus.status === 'soon';
                  
                  return (
                    <>
                      <button 
                        className={`
                          w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all
                          ${canJoin 
                            ? 'bg-[var(--ispora-brand)] text-white hover:bg-[#0729d8] hover:shadow-lg hover:-translate-y-0.5' 
                            : 'bg-[var(--ispora-bg)] text-[var(--ispora-text3)] cursor-not-allowed'
                          }
                        `}
                        disabled={!canJoin}
                        onClick={() => {
                          if (canJoin) {
                            const meetingLink = selectedSession.meetingLink || '';
                            if (meetingLink) {
                              const normalizedLink = normalizeUrl(meetingLink);
                              window.open(normalizedLink, '_blank');
                            } else {
                              alert('No meeting link available for this session. Please contact your mentor.');
                            }
                          }
                        }}
                      >
                        <Video className="w-5 h-5" strokeWidth={2} />
                        {canJoin ? 'Join Session Now' : 'Join Session (Not Yet Available)'}
                      </button>
                      
                      <button className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-white border-[1.5px] border-[var(--ispora-border)] text-[var(--ispora-text)] hover:bg-[var(--ispora-bg)] hover:border-[var(--ispora-brand)] transition-all" onClick={handleViewMeetingDetails}>
                        <ExternalLink className="w-4 h-4" strokeWidth={2} />
                        View Meeting Details
                      </button>
                    </>
                  );
                })()}
              </div>

              {/* Additional Actions */}
              <div className="pt-3 border-t-[1.5px] border-[var(--ispora-border)] flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-[var(--ispora-text2)] hover:bg-[var(--ispora-bg)] hover:text-[var(--ispora-brand)] transition-all" onClick={handleMessageMentor}>
                  <MessageCircle className="w-4 h-4" strokeWidth={2} />
                  Message Mentor
                </button>
                <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-[var(--ispora-danger)] hover:bg-[var(--ispora-danger-light)] transition-all" onClick={handleCancelSession} disabled={cancellingSession}>
                  <X className="w-4 h-4" strokeWidth={2} />
                  {(() => {
                    let sessionType = 'private';
                    try {
                      if (selectedSession.notes) {
                        const parsed = JSON.parse(selectedSession.notes);
                        sessionType = parsed.sessionType || 'private';
                      }
                    } catch (e) {}
                    return sessionType === 'public' ? 'Leave Session' : 'Cancel Session';
                  })()}
                </button>
              </div>
            </div>
          </div>
        </div>
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

    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  icon?: React.ReactNode;
  value: string;
  label: string;
  color?: 'brand' | 'success' | 'accent' | 'danger';
}

function StatCard({ value, label }: StatCardProps) {
  return (
    <div className="bg-white md:bg-white/[0.13] border-[1.5px] md:border border-[var(--ispora-border)] md:border-white/20 rounded-lg md:rounded-md px-2 md:px-2 py-2 md:py-1.5 hover:border-[var(--ispora-brand)] md:hover:bg-white/20 transition-all cursor-default flex flex-col items-center min-w-[55px] md:min-w-[52px] md:max-w-[52px]">
      <div className="font-bold text-[var(--ispora-text)] md:text-white leading-none mb-0.5 md:mb-1 text-[12px]">
        {value}
      </div>
      <div className="text-[var(--ispora-text3)] md:text-white/65 leading-[1.2] text-center break-words w-full md:line-clamp-2 text-[6px]">
        {label}
      </div>
    </div>
  );
}

// Session Calendar Component
interface SessionCalendarProps {
  sessions: any[];
}

function SessionCalendar({ sessions }: SessionCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showSessionsModal, setShowSessionsModal] = useState(false);

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty slots for days before the first day of the month
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
    return sessions.filter((session: any) => {
      const sessionDate = new Date(session.scheduledAt);
      return sessionDate.toDateString() === date.toDateString();
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentMonth);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentMonth(newDate);
  };

  const upcomingSessionsCount = sessions.filter((s: any) => 
    new Date(s.scheduledAt) >= new Date()
  ).length;

  return (
    <div className="flex flex-col">
      {/* Calendar Header */}
      <div className="flex items-center justify-center mb-1.5">
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigateMonth('prev')}
            className="w-5 h-5 rounded-lg hover:bg-[var(--ispora-bg)] flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-3 h-3 text-[var(--ispora-text2)]" />
          </button>
          <span className="text-[11px] font-semibold text-[var(--ispora-text)] min-w-[110px] text-center">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <button
            onClick={() => navigateMonth('next')}
            className="w-5 h-5 rounded-lg hover:bg-[var(--ispora-bg)] flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-3 h-3 text-[var(--ispora-text2)]" />
          </button>
        </div>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-0.5 mb-0.5">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center text-[8px] font-bold text-[var(--ispora-text3)] py-0.5">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-0.5">
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
              className={`aspect-square rounded-md flex flex-col items-center justify-center text-[11px] font-semibold cursor-pointer transition-all relative ${
                isTodayDate
                  ? 'bg-[var(--ispora-brand)] text-white ring-1 ring-[var(--ispora-brand)]'
                  : hasSession
                  ? 'bg-[var(--ispora-brand-light)] text-[var(--ispora-brand)] hover:bg-[#d0d5ff]'
                  : 'text-[var(--ispora-text2)] hover:bg-[var(--ispora-bg)]'
              }`}
              onClick={() => {
                if (hasSession) {
                  setSelectedDate(date);
                  setShowSessionsModal(true);
                }
              }}
            >
              <span className={isTodayDate ? 'font-bold' : ''}>{date.getDate()}</span>
              {hasSession && (
                <div className="flex gap-0.5 mt-0.5">
                  {sessionsOnDate.slice(0, 3).map((_, i) => (
                    <div
                      key={i}
                      className={`w-0.5 h-0.5 rounded-full ${
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

      {/* Session Count at Bottom */}
      <div className="mt-1.5 pt-1.5 border-t border-[var(--ispora-border)] text-center">
        <div className="text-[9px] text-[var(--ispora-text3)]">
          {upcomingSessionsCount} upcoming session{upcomingSessionsCount !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Sessions Modal */}
      {showSessionsModal && selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border-[1.5px] border-[var(--ispora-border)] w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl">
            <div className="px-6 py-4 border-b-[1.5px] border-[var(--ispora-border)] flex items-center justify-between">
              <h3 className="font-syne text-lg font-bold text-[var(--ispora-text)]">
                {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </h3>
              <button
                onClick={() => {
                  setShowSessionsModal(false);
                  setSelectedDate(null);
                }}
                className="text-[var(--ispora-text3)] hover:text-[var(--ispora-text)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-6 flex-1">
              <div className="space-y-3">
                {getSessionsForDate(selectedDate).map((session: any) => (
                  <div
                    key={session.id}
                    className="p-4 bg-[var(--ispora-bg)] rounded-xl border-[1.5px] border-[var(--ispora-border)] hover:border-[var(--ispora-brand)] transition-all"
                  >
                    <div className="font-semibold text-sm text-[var(--ispora-text)] mb-2">
                      {session.topic}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[var(--ispora-text3)]">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        {new Date(session.scheduledAt).toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit',
                          hour12: true 
                        })}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Video className="w-4 h-4" />
                        {session.duration} min
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
