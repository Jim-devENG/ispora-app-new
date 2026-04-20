import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { 
  Globe, Briefcase, Clock, Share2, Linkedin, Twitter, 
  Globe as Website, Award, Users, BookOpen, ChevronLeft,
  Loader2, MapPin, Calendar
} from 'lucide-react';
import { projectId } from '/utils/supabase/info';
import logo from '/src/assets/4db1642d96b725f296f07dcb9e96154154c374f8.png';

interface PublicProfile {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  mentorType?: string;
  profilePicture?: string;
  title?: string;
  bio?: string;
  skills?: string[];
  currentRole?: string;
  company?: string;
  location?: string;
  yearsOfExperience?: string;
  availableToMentor?: boolean;
  linkedin?: string;
  twitter?: string;
  website?: string;
  offers?: string[];
  education?: string;
  goals?: string;
  createdAt?: string;
}

export default function PublicProfile() {
  const { userId, profileType } = useParams<{ userId: string; profileType: 'mentor' | 'student' }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        // Use new public-profile endpoint
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/public-profile/${userId}`
        );
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Profile not found');
          } else {
            setError('Failed to load profile');
          }
          return;
        }
        
        const data = await response.json();
        setProfile(data.profile);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [userId]);

  const copyProfileLink = () => {
    const url = `${window.location.origin}/${profileType}/${userId}`;
    navigator.clipboard.writeText(url);
    alert('Profile link copied to clipboard!');
  };

  const initials = profile 
    ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'
    : 'U';

  const fullName = profile ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'User' : 'User';

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--ispora-bg)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[var(--ispora-brand)] animate-spin mx-auto mb-4" />
          <p className="text-sm text-[var(--ispora-text3)]">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[var(--ispora-bg)] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 rounded-full bg-[var(--ispora-brand-light)] flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-[var(--ispora-brand)]" />
          </div>
          <h1 className="font-syne text-2xl font-bold text-[var(--ispora-text)] mb-2">
            {error || 'Profile Not Found'}
          </h1>
          <p className="text-sm text-[var(--ispora-text3)] mb-6">
            This profile may have been removed or is no longer available.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-[var(--ispora-brand)] text-white rounded-lg font-semibold hover:bg-[var(--ispora-brand-hover)] transition-colors"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  const isMentor = profileType === 'mentor' || profile.role === 'diaspora';

  return (
    <div className="min-h-screen bg-[var(--ispora-bg)]">
      {/* Header */}
      <header className="bg-white border-b border-[var(--ispora-border)] sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-[var(--ispora-text2)] hover:text-[var(--ispora-brand)] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <img src={logo} alt="Ispora" className="h-6" />
          </button>
          
          <button
            onClick={copyProfileLink}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[var(--ispora-brand)] border border-[var(--ispora-brand)] rounded-lg hover:bg-[var(--ispora-brand-light)] transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            Share
          </button>
        </div>
      </header>

      {/* Profile Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Profile Hero */}
        <div className="bg-[var(--ispora-brand)] rounded-2xl overflow-hidden mb-6">
          {/* Cover */}
          <div className="h-28 md:h-36 relative overflow-hidden">
            <div 
              className="absolute inset-0 opacity-[0.05]"
              style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
                backgroundSize: '28px 28px'
              }}
            />
            <div className="absolute -top-10 -right-10 w-52 h-52 bg-white/[0.06] rounded-full" />
            <div className="absolute -bottom-16 left-16 w-40 h-40 bg-white/[0.04] rounded-full" />
          </div>

          {/* Profile Info */}
          <div className="bg-white px-4 md:px-7 pb-6 relative">
            {/* Avatar */}
            <div className="relative inline-block -mt-11 mb-3">
              {profile.profilePicture ? (
                <img
                  src={profile.profilePicture}
                  alt={fullName}
                  className="w-22 h-22 rounded-full border-4 border-white object-cover shadow-[0_4px_16px_rgba(2,31,246,0.2)]"
                />
              ) : (
                <div className="w-22 h-22 rounded-full bg-[var(--ispora-brand)] border-4 border-white flex items-center justify-center text-white font-extrabold text-3xl shadow-[0_4px_16px_rgba(2,31,246,0.2)]">
                  {initials}
                </div>
              )}
            </div>

            {/* Name & Title */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1">
                <h1 className="font-syne text-2xl font-extrabold text-[var(--ispora-text)] mb-1">
                  {fullName}
                </h1>
                {profile.title && (
                  <p className="text-[13px] text-[var(--ispora-text2)] mb-2">
                    {profile.title}
                  </p>
                )}

                {/* Meta Info */}
                <div className="flex flex-wrap gap-3.5 mb-2.5">
                  {profile.location && (
                    <div className="flex items-center gap-1.5 text-xs text-[var(--ispora-text3)]">
                      <MapPin className="w-3.5 h-3.5" strokeWidth={2} />
                      {profile.location}
                    </div>
                  )}
                  {profile.yearsOfExperience && isMentor && (
                    <div className="flex items-center gap-1.5 text-xs text-[var(--ispora-text3)]">
                      <Briefcase className="w-3.5 h-3.5" strokeWidth={2} />
                      {profile.yearsOfExperience} experience
                    </div>
                  )}
                  {profile.availableToMentor && isMentor && (
                    <div className="flex items-center gap-1.5 text-xs text-[var(--ispora-success)] font-semibold">
                      <Clock className="w-3.5 h-3.5" strokeWidth={2} />
                      Available to mentor
                    </div>
                  )}
                  {profile.education && !isMentor && (
                    <div className="flex items-center gap-1.5 text-xs text-[var(--ispora-text3)]">
                      <BookOpen className="w-3.5 h-3.5" strokeWidth={2} />
                      {profile.education}
                    </div>
                  )}
                </div>

                {/* Skills/Tags */}
                {profile.skills && profile.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {profile.skills.slice(0, 6).map((skill, index) => (
                      <span 
                        key={index}
                        className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[var(--ispora-brand-light)] text-[var(--ispora-brand)]"
                      >
                        {skill}
                      </span>
                    ))}
                    {profile.skills.length > 6 && (
                      <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[var(--ispora-bg)] text-[var(--ispora-text3)]">
                        +{profile.skills.length - 6} more
                      </span>
                    )}
                  </div>
                )}

                {/* Mentor Type Badge */}
                {isMentor && profile.mentorType && (
                  <div className="mt-2">
                    <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${
                      profile.mentorType === 'home' 
                        ? 'bg-[var(--ispora-success-light)] text-[var(--ispora-success)]' 
                        : 'bg-[var(--ispora-accent-light)] text-[#0f766e]'
                    }`}>
                      {profile.mentorType === 'home' ? ' Home-Based Mentor' : ' Diaspora Mentor'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bio Section */}
        {profile.bio && (
          <div className="bg-white rounded-xl border border-[var(--ispora-border)] p-5 mb-6">
            <h2 className="font-syne text-lg font-bold text-[var(--ispora-text)] mb-3">About</h2>
            <p className="text-sm text-[var(--ispora-text2)] leading-relaxed whitespace-pre-wrap">
              {profile.bio}
            </p>
          </div>
        )}

        {/* Offers Section (Mentors) */}
        {isMentor && profile.offers && profile.offers.length > 0 && (
          <div className="bg-white rounded-xl border border-[var(--ispora-border)] p-5 mb-6">
            <h2 className="font-syne text-lg font-bold text-[var(--ispora-text)] mb-3 flex items-center gap-2">
              <Award className="w-5 h-5 text-[var(--ispora-brand)]" />
              What I Offer
            </h2>
            <div className="flex flex-wrap gap-2">
              {profile.offers.map((offer, index) => (
                <span 
                  key={index}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg bg-[var(--ispora-bg)] text-[var(--ispora-text)]"
                >
                  {offer}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Goals Section (Students) */}
        {!isMentor && profile.goals && (
          <div className="bg-white rounded-xl border border-[var(--ispora-border)] p-5 mb-6">
            <h2 className="font-syne text-lg font-bold text-[var(--ispora-text)] mb-3 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[var(--ispora-brand)]" />
              My Goals
            </h2>
            <p className="text-sm text-[var(--ispora-text2)] leading-relaxed">
              {profile.goals}
            </p>
          </div>
        )}

        {/* Social Links */}
        {(profile.linkedin || profile.twitter || profile.website) && (
          <div className="bg-white rounded-xl border border-[var(--ispora-border)] p-5 mb-6">
            <h2 className="font-syne text-lg font-bold text-[var(--ispora-text)] mb-3">Connect</h2>
            <div className="flex flex-wrap gap-3">
              {profile.linkedin && (
                <a
                  href={profile.linkedin.startsWith('http') ? profile.linkedin : `https://linkedin.com/in/${profile.linkedin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-[#0077b5] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  <Linkedin className="w-4 h-4" />
                  LinkedIn
                </a>
              )}
              {profile.twitter && (
                <a
                  href={profile.twitter.startsWith('http') ? profile.twitter : `https://twitter.com/${profile.twitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-[#1da1f2] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  <Twitter className="w-4 h-4" />
                  Twitter
                </a>
              )}
              {profile.website && (
                <a
                  href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--ispora-brand)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  <Globe className="w-4 h-4" />
                  Website
                </a>
              )}
            </div>
          </div>
        )}

        {/* CTA for non-logged users */}
        <div className="bg-gradient-to-r from-[var(--ispora-brand)] to-[#0118c4] rounded-xl p-6 text-center text-white">
          <h2 className="font-syne text-xl font-bold mb-2">
            {isMentor ? 'Want to connect with this mentor?' : 'Want to mentor this student?'}
          </h2>
          <p className="text-sm text-white/80 mb-4">
            Join Ispora to connect with {isMentor ? 'mentors' : 'students'} from the African diaspora.
          </p>
          <button
            onClick={() => navigate('/auth')}
            className="px-6 py-3 bg-white text-[var(--ispora-brand)] rounded-lg font-bold hover:bg-white/90 transition-colors"
          >
            Join Ispora
          </button>
        </div>
      </main>
    </div>
  );
}
