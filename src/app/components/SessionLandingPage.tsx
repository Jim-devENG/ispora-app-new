import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { 
  Calendar, 
  Clock, 
  Users, 
  Video, 
  Heart, 
  Eye, 
  Briefcase,
  MapPin,
  Linkedin,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Repeat,
  GraduationCap,
  Target,
  BookOpen
} from 'lucide-react';
import { sessionApi } from '../lib/api';
import { projectId, publicAnonKey } from '/utils/supabase/info';

export default function SessionLandingPage() {
  const { sessionId, shortCode } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resolvedSessionId, setResolvedSessionId] = useState<string | null>(null);

  useEffect(() => {
    loadSession();
  }, [sessionId, shortCode]);

  const loadSession = async () => {
    try {
      setLoading(true);
      
      let actualSessionId = sessionId;
      
      // If we have a short code instead of a session ID, resolve it first
      if (shortCode && !sessionId) {
        console.log('Resolving short code:', shortCode);
        try {
          const resolveResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-b8526fa6/${shortCode}`,
            {
              headers: {
                'Authorization': `Bearer ${publicAnonKey}`,
              },
            }
          );
          
          if (!resolveResponse.ok) {
            throw new Error('Session not found');
          }
          
          const resolveData = await resolveResponse.json();
          actualSessionId = resolveData.sessionId;
          setResolvedSessionId(actualSessionId);
          console.log('Resolved to session ID:', actualSessionId);
        } catch (err: any) {
          console.error('Failed to resolve short code:', err);
          setError('Invalid session link');
          setLoading(false);
          return;
        }
      }
      
      if (!actualSessionId) {
        setError('No session specified');
        setLoading(false);
        return;
      }
      
      const response = await sessionApi.getPublicSession(actualSessionId);
      setSession(response.session);
      
      // Debug: Log the full session data to check mentor info
      console.log('📊 Session Data:', response.session);
      console.log('👤 Mentor Data:', response.session.mentor);
      console.log('🖼️ Mentor Avatar:', response.session.mentor?.avatar);
    } catch (error: any) {
      console.error('Error loading session:', error);
      setError(error.message || 'Failed to load session');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSession = () => {
    // Use resolved session ID if available, otherwise fall back to sessionId param
    const idToStore = resolvedSessionId || sessionId;
    // Store the session ID so we can auto-register after signup/login
    localStorage.setItem('pendingSessionRegistration', idToStore!);
    // Redirect to auth page with signup mode for student role
    navigate('/auth?mode=signup&role=student');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--ispora-brand-light)] via-white to-[var(--ispora-accent-light)] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-[var(--ispora-brand)] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-[var(--ispora-text2)]">Loading session...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--ispora-brand-light)] via-white to-[var(--ispora-accent-light)] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-xl">
          <div className="w-16 h-16 bg-[var(--ispora-danger-light)] rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">😕</span>
          </div>
          <h2 className="font-syne text-xl font-bold text-[var(--ispora-text)] mb-2">
            Session Not Found
          </h2>
          <p className="text-[var(--ispora-text2)] mb-6">
            {error || 'This session may have been removed or is no longer available.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-[var(--ispora-brand)] text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  const sessionDate = new Date(session.scheduledAt);
  const now = new Date();
  const isPast = sessionDate < now;
  const isToday = sessionDate.toDateString() === now.toDateString();

  return (
    <div className="min-h-screen bg-[var(--ispora-bg)]">
      {/* Header */}
      <header className="bg-white backdrop-blur-sm border-b-[1.5px] border-[var(--ispora-border)] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[var(--ispora-brand)] rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-syne text-xl font-bold text-[var(--ispora-text)]">Ispora</span>
          </div>
          <button
            onClick={() => navigate('/')}
            className="text-sm font-semibold text-[var(--ispora-text2)] hover:text-[var(--ispora-brand)] transition-colors"
          >
            Sign In
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <div className="bg-white rounded-2xl shadow-[var(--ispora-shadow-lg)] overflow-hidden border border-[var(--ispora-border)]">
          {/* Hero Section */}
          <div className="bg-[var(--ispora-brand)] p-6 md:p-8 text-white">
            <div className="flex items-start gap-3 mb-4">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm">
                <Calendar className="w-3.5 h-3.5" strokeWidth={2.5} />
                {isToday ? 'TODAY' : isPast ? 'PAST SESSION' : 'UPCOMING'}
              </div>
              {session.isRecurring && (
                <div className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm">
                  <Repeat className="w-3.5 h-3.5" strokeWidth={2.5} />
                  SERIES
                </div>
              )}
            </div>
            
            <h1 className="font-syne text-2xl md:text-3xl font-bold mb-3 leading-tight">
              {session.topic || 'Mentorship Session'}
            </h1>
            
            {session.description && (
              <p className="text-white/90 text-sm md:text-base leading-relaxed mb-4">
                {session.description}
              </p>
            )}

            {/* Session Stats */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <Heart className="w-4 h-4" strokeWidth={2} />
                <span className="font-semibold">{session.likesCount || 0}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Eye className="w-4 h-4" strokeWidth={2} />
                <span className="font-semibold">{session.viewsCount || 0}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4" strokeWidth={2} />
                <span className="font-semibold">{session.registeredCount} attending</span>
              </div>
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid md:grid-cols-3 gap-6 p-6 md:p-8">
            {/* Left Column - Mentor Info */}
            <div className="md:col-span-1">
              <div className="bg-[var(--ispora-brand-light)] rounded-xl p-6 border border-[var(--ispora-border)]">
                <h3 className="font-syne text-sm font-bold text-[var(--ispora-text3)] uppercase tracking-wide mb-4">
                  Your Mentor
                </h3>
                
                {session.mentor && (
                  <div>
                    {/* Avatar */}
                    {session.mentor.avatar ? (
                      <img 
                        src={session.mentor.avatar} 
                        alt={`${session.mentor.firstName} ${session.mentor.lastName}`}
                        className="w-20 h-20 rounded-full object-cover mx-auto mb-4 shadow-lg ring-2 ring-blue-500/20"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-green-500 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-lg">
                        {session.mentor.firstName?.[0]}{session.mentor.lastName?.[0]}
                      </div>
                    )}

                    {/* Name */}
                    <h4 className="font-syne text-lg font-bold text-[var(--ispora-text)] text-center mb-1">
                      {session.mentor.firstName} {session.mentor.lastName}
                    </h4>

                    {/* Role & Company */}
                    {session.mentor.currentRole && (
                      <div className="flex items-center justify-center gap-1.5 text-xs text-[var(--ispora-text2)] mb-3">
                        <Briefcase className="w-3.5 h-3.5" strokeWidth={2} />
                        <span className="line-clamp-2 text-center">
                          {session.mentor.currentRole}
                          {session.mentor.currentCompany && ` at ${session.mentor.currentCompany}`}
                        </span>
                      </div>
                    )}

                    {/* Bio */}
                    {session.mentor.bio && (
                      <p className="text-xs text-[var(--ispora-text2)] leading-relaxed mb-4 text-center italic">
                        {session.mentor.bio}
                      </p>
                    )}

                    {/* Divider */}
                    <div className="border-t border-purple-200 my-4"></div>

                    {/* What Mentor Offers */}
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <GraduationCap className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" strokeWidth={2} />
                        <div>
                          <p className="text-[10px] font-bold text-[var(--ispora-text3)] uppercase tracking-wide mb-1">
                            Expertise Areas
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {session.mentor.expertiseAreas && session.mentor.expertiseAreas.length > 0 ? (
                              session.mentor.expertiseAreas.slice(0, 3).map((area: string, idx: number) => (
                                <span 
                                  key={idx}
                                  className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium"
                                >
                                  {area}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-[var(--ispora-text3)]">
                                General mentorship
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {session.mentor.whatICanHelpWith && session.mentor.whatICanHelpWith.length > 0 && (
                        <div className="flex items-start gap-2">
                          <Target className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" strokeWidth={2} />
                          <div>
                            <p className="text-[10px] font-bold text-[var(--ispora-text3)] uppercase tracking-wide mb-1">
                              Can Help With
                            </p>
                            <ul className="space-y-0.5">
                              {session.mentor.whatICanHelpWith.slice(0, 3).map((item: string, idx: number) => (
                                <li key={idx} className="text-[10px] text-[var(--ispora-text2)] leading-relaxed">
                                  • {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      {session.mentor.industriesWorkedIn && session.mentor.industriesWorkedIn.length > 0 && (
                        <div className="flex items-start gap-2">
                          <BookOpen className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" strokeWidth={2} />
                          <div>
                            <p className="text-[10px] font-bold text-[var(--ispora-text3)] uppercase tracking-wide mb-1">
                              Industries
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {session.mentor.industriesWorkedIn.slice(0, 2).map((industry: string, idx: number) => (
                                <span 
                                  key={idx}
                                  className="text-[10px] px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-medium"
                                >
                                  {industry}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Divider */}
                    <div className="border-t border-purple-200 my-4"></div>

                    {/* LinkedIn */}
                    {session.mentor.linkedinProfile && (
                      <a
                        href={session.mentor.linkedinProfile}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        <Linkedin className="w-4 h-4" strokeWidth={2} />
                        View LinkedIn Profile
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Session Details */}
            <div className="md:col-span-2 space-y-6">
              {/* Session Info */}
              <div>
                <h3 className="font-syne text-sm font-bold text-[var(--ispora-text3)] uppercase tracking-wide mb-3">
                  Session Details
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-blue-600" strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--ispora-text)]">
                        {sessionDate.toLocaleDateString('en-US', { 
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <p className="text-xs text-[var(--ispora-text3)]">
                        {sessionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-green-600" strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--ispora-text)]">
                        {session.duration} minutes
                      </p>
                      <p className="text-xs text-[var(--ispora-text3)]">Duration</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <Video className="w-5 h-5 text-purple-600" strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--ispora-text)]">
                        {session.platform || 'Google Meet'}
                      </p>
                      <p className="text-xs text-[var(--ispora-text3)]">Platform</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 text-orange-600" strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--ispora-text)]">
                        {session.isFull 
                          ? 'Session Full' 
                          : `${session.spotsLeft} ${session.spotsLeft === 1 ? 'spot' : 'spots'} left`
                        }
                      </p>
                      <p className="text-xs text-[var(--ispora-text3)]">
                        {session.registeredCount} of {session.capacity} registered
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA Section */}
              <div className="bg-[var(--ispora-accent-light)] rounded-xl p-6 border border-[var(--ispora-border)]">
                <h3 className="font-syne text-lg font-bold text-[var(--ispora-text)] mb-2">
                  Ready to Join?
                </h3>
                <p className="text-sm text-[var(--ispora-text2)] mb-4">
                  {session.isFull 
                    ? 'This session is currently full, but you can still sign up to join our platform and discover other amazing mentors.'
                    : 'Sign up to reserve your spot in this session and connect with professional mentors who are ready to guide you.'}
                </p>
                
                <button
                  onClick={handleJoinSession}
                  disabled={isPast}
                  className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-white transition-all ${
                    isPast
                      ? 'bg-[var(--ispora-text3)] cursor-not-allowed'
                      : 'bg-[var(--ispora-accent)] hover:bg-[#00b687] hover:shadow-[var(--ispora-shadow)] hover:scale-[1.02]'
                  }`}
                >
                  {isPast ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" strokeWidth={2.5} />
                      Session Ended
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" strokeWidth={2.5} />
                      Join This Session
                      <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center mt-8">
          <p className="text-sm text-[var(--ispora-text2)] mb-2">
            🇳🇬 Connecting diaspora and home-based professionals with youths in Nigeria
          </p>
          <p className="text-xs text-[var(--ispora-text3)]">
            Powered by Ispora • Free mentorship platform
          </p>
        </div>
      </main>
    </div>
  );
}