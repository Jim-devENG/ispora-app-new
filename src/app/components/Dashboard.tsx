import { useAuth } from '../contexts/AuthContext';
import { LogOut, User, Home, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useEffect } from 'react';
import MentorDashboard from './MentorDashboard';
import StudentDashboard from './StudentDashboard';

export default function Dashboard() {
  const { user, signOut, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  // ✅ ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  
  // Redirect admin users to /admin
  useEffect(() => {
    if (!loading && user?.role === 'admin') {
      navigate('/admin');
    }
  }, [user, loading, navigate]);

  // Redirect to signin with current URL if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated && !user) {
      // Save current path as redirect destination
      const currentPath = window.location.pathname + window.location.search;
      navigate(`/auth?redirect=${encodeURIComponent(currentPath)}`);
    }
  }, [loading, isAuthenticated, user, navigate]);

  // NOW we can do conditional returns after all hooks are called
  
  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--ispora-bg)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[var(--ispora-brand)] animate-spin mx-auto mb-4" />
          <div className="text-lg font-semibold text-[var(--ispora-text)]">
            Loading your dashboard...
          </div>
        </div>
      </div>
    );
  }

  // Show loading while redirecting
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-[var(--ispora-bg)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[var(--ispora-brand)] animate-spin mx-auto mb-4" />
          <div className="text-lg font-semibold text-[var(--ispora-text)]">
            Redirecting to sign in...
          </div>
        </div>
      </div>
    );
  }

  // If user is a diaspora mentor, show the full mentor dashboard
  if (user?.role === 'diaspora') {
    return <MentorDashboard />;
  }

  // If user is a student, show the full student dashboard
  if (user?.role === 'student') {
    return <StudentDashboard />;
  }

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-[var(--ispora-bg)]">
      {/* Header */}
      <div className="bg-white border-b border-[var(--ispora-border)]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--ispora-brand)] rounded-lg flex items-center justify-center">
              <Home className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <div>
              <div className="font-syne font-extrabold text-xl text-[var(--ispora-brand)]">
                Ispora
              </div>
              <div className="text-xs text-[var(--ispora-text3)]">
                {user?.role === 'diaspora' ? 'Mentor Dashboard' : 'Youth Dashboard'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-semibold text-[var(--ispora-text)]">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="text-xs text-[var(--ispora-text3)]">{user?.email}</div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border-[1.5px] border-[var(--ispora-border)] text-[var(--ispora-text)] text-sm font-medium hover:border-[var(--ispora-danger)] hover:text-[var(--ispora-danger)] hover:bg-[var(--ispora-danger-light)] transition-all"
            >
              <LogOut className="w-4 h-4" strokeWidth={2} />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl p-8 shadow-[var(--ispora-shadow)]">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-[var(--ispora-brand-light)] rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-8 h-8 text-[var(--ispora-brand)]" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <h1 className="font-syne text-3xl font-extrabold text-[var(--ispora-text)] mb-2">
                Welcome to your dashboard, {user?.firstName}! 🎉
              </h1>
              <p className="text-[var(--ispora-text2)] mb-6 leading-relaxed">
                {user?.role === 'diaspora'
                  ? 'Your mentor profile is now live! Youth can discover you and request mentorship sessions. You can manage your availability, view incoming requests, and connect with ambitious youth.'
                  : 'Your youth profile is ready! Browse through our network of diaspora professionals, send mentorship requests, and start building meaningful connections that will accelerate your career.'}
              </p>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[var(--ispora-bg)] rounded-xl p-4 border border-[var(--ispora-border)]">
                  <div className="text-2xl font-bold text-[var(--ispora-brand)] mb-1">
                    {user?.role === 'diaspora' ? '0' : '0'}
                  </div>
                  <div className="text-xs text-[var(--ispora-text3)]">
                    {user?.role === 'diaspora' ? 'Connection Requests' : 'Mentors Connected'}
                  </div>
                </div>
                <div className="bg-[var(--ispora-bg)] rounded-xl p-4 border border-[var(--ispora-border)]">
                  <div className="text-2xl font-bold text-[var(--ispora-brand)] mb-1">0</div>
                  <div className="text-xs text-[var(--ispora-text3)]">Upcoming Sessions</div>
                </div>
                <div className="bg-[var(--ispora-bg)] rounded-xl p-4 border border-[var(--ispora-border)]">
                  <div className="text-2xl font-bold text-[var(--ispora-brand)] mb-1">
                    {user?.onboardingComplete ? '100%' : '50%'}
                  </div>
                  <div className="text-xs text-[var(--ispora-text3)]">Profile Complete</div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-[var(--ispora-brand-light)] rounded-lg border border-[var(--ispora-brand)]/20">
                <div className="font-semibold text-sm text-[var(--ispora-brand)] mb-1">
                  🚀 Backend Authentication Complete!
                </div>
                <div className="text-xs text-[var(--ispora-text2)]">
                  Your authentication system is now fully functional with Supabase backend. You can now build additional features on top of this foundation!
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}