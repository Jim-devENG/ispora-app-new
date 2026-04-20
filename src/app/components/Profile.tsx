import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userApi, authApi } from '../lib/api';
import {
  Edit,
  X,
  MapPin,
  Briefcase,
  Users,
  CheckCircle,
  Circle,
  Link as LinkIcon,
  Eye,
  Camera,
  Save,
  Clock,
  GraduationCap,
  Globe,
  Award,
  Activity,
  AlertCircle,
  Loader2,
  Languages,
  Target,
  Lightbulb,
  Share2
} from 'lucide-react';
import {
  EXPERTISE_AREAS,
  WHAT_I_CAN_HELP_WITH,
  INDUSTRIES,
  LANGUAGES,
  MENTEE_LEVELS,
  AVAILABILITY_HOURS_OPTIONS
} from '../constants/profileOptions';
import MultiSelectWithOther from './MultiSelectWithOther';

interface ProfileData {
  fullName: string;
  title: string;
  location: string;
  currentRole: string;
  company: string;
  industry: string;
  yearsOfExperience: string;
  education: string;
  educationInstitution: string;
  countryOfOrigin: string;
  bio: string;
  offers: string[];
  skills: string[];
  email: string;
  linkedin: string;
  twitter: string;
  website: string;
  availableToMentor: boolean;
  
  // NEW: Enhanced fields
  expertiseAreas?: string[];
  whatICanHelpWith?: string[];
  industriesWorkedIn?: string[];
  languagesSpoken?: string[];
  availabilityHoursPerMonth?: number;
  preferredMenteeLevel?: string[];
}

const Profile: React.FC = () => {
  const { user, refreshUser } = useAuth();

  console.log('🔍 Profile Component (Mentor) Rendering');
  console.log('  - User ID:', user?.id);
  console.log('  - User Role:', user?.role);
  console.log('  - User MentorType:', (user as any)?.mentorType);

  const [profileData, setProfileData] = useState<ProfileData>({
    fullName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
    title: '',
    location: '',
    currentRole: '',
    company: '',
    industry: '',
    yearsOfExperience: '',
    education: '',
    educationInstitution: '',
    countryOfOrigin: '',
    bio: '',
    offers: [],
    skills: [],
    email: user?.email || '',
    linkedin: '',
    twitter: '',
    website: '',
    availableToMentor: true,
    
    // NEW: Enhanced fields
    expertiseAreas: [],
    whatICanHelpWith: [],
    industriesWorkedIn: [],
    languagesSpoken: [],
    availabilityHoursPerMonth: undefined,
    preferredMenteeLevel: []
  });

  const [showEditContact, setShowEditContact] = useState(false);
  const [showEditEnhanced, setShowEditEnhanced] = useState(false); // NEW
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Handle profile picture upload
  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    try {
      setIsUploading(true);
      
      // Convert file to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const imageData = reader.result as string;
          
          console.log('Uploading profile picture...');
          
          // Upload to backend
          const response: any = await authApi.uploadProfilePicture(imageData, file.name);
          
          console.log('Upload response:', response);
          
          if (response.success && response.profilePicture) {
            // Update profile data
            setProfileData(prev => ({  ...prev, profilePicture: response.profilePicture }));
            
            // Refresh user in auth context so it updates everywhere
            await refreshUser();
            
            alert('Profile picture updated successfully!');
          } else {
            alert('Failed to upload profile picture');
          }
        } catch (error) {
          console.error('Upload error:', error);
          alert('Failed to upload profile picture');
        } finally {
          setIsUploading(false);
        }
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('File read error:', error);
      alert('Failed to read image file');
      setIsUploading(false);
    }
  };

  // Fetch user profile data from backend
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) {
        console.log('Profile: No user ID available, skipping fetch');
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        console.log('Profile: Fetching profile for user ID:', user.id);
        
        // Add a small delay to ensure token is ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const response: any = await userApi.getUser(user.id);
        console.log('Profile: API response:', response);
        
        if (response.user) {
          const userData = response.user;
          setProfileData({
            fullName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 
                      `${user.firstName || ''} ${user.lastName || ''}`.trim(),
            title: userData.title || '',
            location: userData.location || '',
            currentRole: userData.currentRole || '',
            company: userData.company || '',
            industry: userData.industry || '',
            yearsOfExperience: userData.yearsOfExperience || '',
            education: userData.education || '',
            educationInstitution: userData.educationInstitution || '',
            countryOfOrigin: userData.countryOfOrigin || '',
            bio: userData.bio || '',
            offers: userData.offers || [],
            skills: userData.skills || [],
            email: userData.email || user.email || '',
            linkedin: userData.linkedin || '',
            twitter: userData.twitter || '',
            website: userData.website || '',
            availableToMentor: userData.availableToMentor !== undefined ? userData.availableToMentor : true,
            profilePicture: userData.profilePicture || '',
            
            // NEW: Enhanced fields
            expertiseAreas: userData.expertiseAreas || [],
            whatICanHelpWith: userData.whatICanHelpWith || [],
            industriesWorkedIn: userData.industriesWorkedIn || [],
            languagesSpoken: userData.languagesSpoken || [],
            availabilityHoursPerMonth: userData.availabilityHoursPerMonth || 0,
            preferredMenteeLevel: userData.preferredMenteeLevel || []
          });
        } else {
          console.error('Profile: No user data in response');
        }
      } catch (err: any) {
        console.error('Error fetching profile:', err);
        console.error('Error message:', err?.message);
        // Only show error alert if it's not a token issue
        if (!err?.message?.includes('session') && !err?.message?.includes('Unauthorized')) {
          alert(`Failed to load profile: ${err?.message || 'Unknown error'}. Please try refreshing the page.`);
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch if user is available
    if (user?.id) {
      fetchProfile();
    } else {
      setIsLoading(false);
    }
  }, [user?.id]); // Only depend on user.id, not the whole user object

  // Save profile updates
  const saveProfileUpdates = async (updates: Partial<ProfileData>) => {
    if (!user?.id) return false;
    
    try {
      setIsSaving(true);
      await authApi.updateProfile(updates);
      setProfileData(prev => ({ ...prev, ...updates }));
      return true;
    } catch (err) {
      console.error('Error saving profile:', err);
      alert('Failed to save profile changes. Please try again.');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const copyProfileLink = () => {
    const profileUrl = `${window.location.origin}/mentor/${user?.id}`;
    navigator.clipboard.writeText(profileUrl);
    // You could show a toast notification here
    alert('Profile link copied to clipboard!');
  };

  // Calculate profile completion dynamically
  const calculateProfileCompletion = () => {
    const fields = [
      { value: profileData.bio, weight: 20 },
      { value: profileData.skills.length > 0, weight: 15 },
      { value: profileData.currentRole, weight: 10 },
      { value: profileData.company, weight: 10 },
      { value: profileData.location, weight: 10 },
      { value: profileData.yearsOfExperience, weight: 10 },
      { value: profileData.offers.length > 0, weight: 15 },
      { value: profileData.linkedin, weight: 5 },
      { value: profileData.twitter, weight: 2.5 },
      { value: profileData.website, weight: 2.5 },
    ];
    
    const completed = fields.reduce((total, field) => {
      return total + (field.value ? field.weight : 0);
    }, 0);
    
    return Math.round(completed);
  };

  const profileCompletion = calculateProfileCompletion();
  
  const completionItems = [
    { done: !!profileData.bio, text: profileData.bio ? 'Bio written' : 'Bio (missing)' },
    { done: profileData.skills.length > 0, text: profileData.skills.length > 0 ? 'Skills added' : 'Skills (missing)' },
    { done: !!profileData.currentRole && !!profileData.company, text: profileData.currentRole && profileData.company ? 'Professional info' : 'Professional info (missing)' },
    { done: !!profileData.linkedin, text: profileData.linkedin ? 'LinkedIn added' : 'LinkedIn URL (missing)' },
    { done: !!profileData.website, text: profileData.website ? 'Website added' : 'Website (missing)' }
  ];

  const initials = (profileData.fullName || 'User')
    .split(' ')
    .filter(n => n.length > 0)
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  // Show loading state while fetching
  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto bg-[var(--ispora-bg)] px-8 py-7">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-[var(--ispora-brand)] animate-spin mx-auto mb-4" />
            <p className="text-sm text-[var(--ispora-text3)]">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[var(--ispora-bg)] px-4 md:px-8 py-4 md:py-7 pb-20 md:pb-7">
      {/* Profile Hero */}
      <div className="bg-[var(--ispora-brand)] rounded-2xl overflow-hidden mb-5">
        {/* Cover Section */}
        <div className="h-32 relative overflow-hidden">
          {/* Grid background */}
          <div 
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
              backgroundSize: '28px 28px'
            }}
          />
          {/* Orbs */}
          <div className="absolute -top-10 -right-10 w-52 h-52 bg-white/[0.06] rounded-full" />
          <div className="absolute -bottom-16 left-16 w-40 h-40 bg-white/[0.04] rounded-full" />
        </div>

        {/* Profile Body */}
        <div className="bg-white px-4 md:px-7 pb-6 relative">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleProfilePictureUpload}
            className="hidden"
          />
          
          {/* Avatar */}
          <div className="relative inline-block -mt-11 mb-3">
            {profileData.profilePicture ? (
              <img
                src={profileData.profilePicture}
                alt={profileData.fullName}
                className="w-22 h-22 rounded-full border-4 border-white object-cover shadow-[0_4px_16px_rgba(2,31,246,0.2)]"
              />
            ) : (
              <div className="w-22 h-22 rounded-full bg-[var(--ispora-brand)] border-4 border-white flex items-center justify-center text-white font-extrabold text-3xl shadow-[0_4px_16px_rgba(2,31,246,0.2)]">
                {initials}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-[var(--ispora-brand)] border-2 border-white flex items-center justify-center hover:bg-[var(--ispora-brand-hover)] hover:scale-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <Loader2 className="w-3 h-3 text-white animate-spin" strokeWidth={2.5} />
              ) : (
                <Edit className="w-3 h-3 text-white" strokeWidth={2.5} />
              )}
            </button>
          </div>

          {/* Profile Info */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1">
              <h1 className="font-syne text-2xl font-extrabold text-[var(--ispora-text)] mb-1">
                {profileData.fullName}
              </h1>
              <p className="text-[13px] text-[var(--ispora-text2)] mb-2">
                {profileData.title}
              </p>

              {/* Meta Info */}
              <div className="flex flex-wrap gap-3.5 mb-2.5">
                {profileData.location && (
                  <div className="flex items-center gap-1.5 text-xs text-[var(--ispora-text3)]">
                    <Globe className="w-3.5 h-3.5" strokeWidth={2} />
                    {profileData.location}
                  </div>
                )}
                {profileData.yearsOfExperience && (
                  <div className="flex items-center gap-1.5 text-xs text-[var(--ispora-text3)]">
                    <Briefcase className="w-3.5 h-3.5" strokeWidth={2} />
                    {profileData.yearsOfExperience} experience
                  </div>
                )}
                {profileData.availableToMentor && user?.role === 'diaspora' && (
                  <div className="flex items-center gap-1.5 text-xs text-[var(--ispora-success)] font-semibold">
                    <Clock className="w-3.5 h-3.5" strokeWidth={2} />
                    Available to mentor
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mb-3 md:mb-0">
                <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[var(--ispora-brand-light)] text-[var(--ispora-brand)]">
                  Software Engineering
                </span>
                <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[var(--ispora-brand-light)] text-[var(--ispora-brand)]">
                  AI / ML
                </span>
                <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[var(--ispora-brand-light)] text-[var(--ispora-brand)]">
                  Career Coaching
                </span>
                <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[var(--ispora-brand-light)] text-[var(--ispora-brand)]">
                  Fintech
                </span>
                <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${
                  (user as any)?.mentorType === 'home' 
                    ? 'bg-[var(--ispora-success-light)] text-[var(--ispora-success)]' 
                    : 'bg-[var(--ispora-accent-light)] text-[#0f766e]'
                }`}>
                  {(user as any)?.mentorType === 'home' ? '🏠 Home-Based Mentor' : '✈️ Diaspora Mentor'}
                </span>
              </div>
            </div>

            {/* Action Buttons - Desktop: top right, Mobile: below content */}
            <div className="flex gap-2 w-full md:w-auto md:pt-1">
              <button
                onClick={copyProfileLink}
                className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-white text-[var(--ispora-text)] border-[1.5px] border-[var(--ispora-border)] rounded-lg text-xs font-semibold hover:border-[var(--ispora-brand)] hover:text-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] transition-all"
              >
                <Share2 className="w-3 h-3" strokeWidth={2} />
                Share Profile
              </button>
              <button
                onClick={() => {
                  window.open(`/mentor/${user?.id}`, '_blank');
                }}
                className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-[var(--ispora-brand)] text-white rounded-lg text-xs font-semibold hover:bg-[var(--ispora-brand-hover)] hover:shadow-[0_4px_14px_rgba(2,31,246,0.3)] hover:-translate-y-0.5 transition-all"
              >
                <Eye className="w-3 h-3" strokeWidth={2} />
                Preview
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Impact Stats - Removed for MVP */}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4.5">
        {/* Left Column */}
        <div className="flex flex-col gap-4.5">
          {/* Availability */}
          <div className="bg-white border-[1.5px] border-[var(--ispora-border)] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b-[1.5px] border-[var(--ispora-border)]">
              <h3 className="font-syne text-sm font-bold text-[var(--ispora-text)]">Availability</h3>
            </div>
            <div className="px-5 py-4.5">
              <div className="flex items-center justify-between mb-3.5">
                <div>
                  <div className="text-[13px] font-semibold text-[var(--ispora-text)]">Currently accepting mentees</div>
                  <div className="text-[11px] text-[var(--ispora-text3)] mt-0.5">Students can send you mentorship requests</div>
                </div>
                <button
                  onClick={async () => {
                    const newValue = !profileData.availableToMentor;
                    setProfileData({ ...profileData, availableToMentor: newValue });
                    await saveProfileUpdates({ availableToMentor: newValue });
                  }}
                  disabled={isSaving}
                  className={`w-12 h-6 rounded-full cursor-pointer transition-colors ${profileData.availableToMentor ? 'bg-[var(--ispora-brand)]' : 'bg-[var(--ispora-border)]'} ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full mt-0.5 transition-transform ${profileData.availableToMentor ? 'ml-6' : 'ml-0.5'}`} />
                </button>
              </div>
              <div className="text-xs text-[var(--ispora-text3)] flex items-start gap-1.5">
                <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" strokeWidth={2} />
                All times are in West Africa Time (WAT). Students see this when booking sessions.
              </div>
            </div>
          </div>

          {/* Mentorship Profile */}
          <div className="bg-white border-[1.5px] border-[var(--ispora-border)] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b-[1.5px] border-[var(--ispora-border)] flex items-center justify-between">
              <h3 className="font-syne text-sm font-bold text-[var(--ispora-text)]">
                Mentorship Profile
              </h3>
              <button
                onClick={() => setShowEditEnhanced(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--ispora-brand-light)] text-[var(--ispora-brand)] rounded-lg text-xs font-semibold hover:bg-[#e0e3ff] transition-colors"
              >
                <Edit className="w-3 h-3" strokeWidth={2} />
                Edit
              </button>
            </div>
            <div className="px-5 py-4.5 space-y-3.5">
              {/* Bio - MOVED FROM ABOUT ME */}
              <div>
                <div className="text-[11px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-2">
                  About Me
                </div>
                <p className="text-[13px] text-[var(--ispora-text2)] leading-relaxed whitespace-pre-line">
                  {profileData.bio || 'No bio added yet. Click Edit to tell students about yourself.'}
                </p>
              </div>

              {/* PROFESSIONAL BACKGROUND SECTION */}
              <div className="pt-3.5 border-t-2 border-[var(--ispora-border)]">
                <div className="text-[11px] font-bold text-[var(--ispora-brand)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5" />
                  Professional Background
                </div>
                
                <div className="space-y-3">
                  {/* Current Role & Company */}
                  {(profileData.currentRole || profileData.company) && (
                    <div>
                      <div className="text-[11px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-1">
                        Current Position
                      </div>
                      <div className="text-[13px] font-semibold text-[var(--ispora-text)]">{profileData.currentRole || 'Not specified'}</div>
                      {profileData.company && (
                        <div className="text-[12px] text-[var(--ispora-text2)] mt-0.5">at {profileData.company}</div>
                      )}
                    </div>
                  )}

                  {/* Industry & Experience Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {profileData.industry && (
                      <div>
                        <div className="text-[11px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-1">
                          Industry
                        </div>
                        <div className="text-[13px] text-[var(--ispora-text)]">{profileData.industry}</div>
                      </div>
                    )}
                    {profileData.yearsOfExperience && (
                      <div>
                        <div className="text-[11px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-1">
                          Experience
                        </div>
                        <div className="text-[13px] text-[var(--ispora-text)]">{profileData.yearsOfExperience} years</div>
                      </div>
                    )}
                  </div>

                  {/* Location & Country Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {profileData.location && (
                      <div>
                        <div className="text-[11px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-1">
                          Location
                        </div>
                        <div className="text-[13px] text-[var(--ispora-text)]">{profileData.location}</div>
                      </div>
                    )}
                    {profileData.countryOfOrigin && (
                      <div>
                        <div className="text-[11px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-1">
                          Country of Origin
                        </div>
                        <div className="text-[13px] text-[var(--ispora-text)]">{profileData.countryOfOrigin}</div>
                      </div>
                    )}
                  </div>

                  {/* Education */}
                  {(profileData.education || profileData.educationInstitution) && (
                    <div>
                      <div className="text-[11px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-1">
                        Education
                      </div>
                      {profileData.education && (
                        <div className="text-[13px] font-semibold text-[var(--ispora-text)]">{profileData.education}</div>
                      )}
                      {profileData.educationInstitution && (
                        <div className="text-[12px] text-[var(--ispora-text2)] mt-0.5">{profileData.educationInstitution}</div>
                      )}
                    </div>
                  )}

                  {/* Skills */}
                  {profileData.skills && profileData.skills.length > 0 && (
                    <div>
                      <div className="text-[11px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-2">
                        Skills & Expertise
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {profileData.skills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[var(--ispora-brand-light)] text-[var(--ispora-brand)]"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* LinkedIn */}
                  {profileData.linkedin && (
                    <div>
                      <div className="text-[11px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-1">
                        LinkedIn
                      </div>
                      <a 
                        href={profileData.linkedin.startsWith('http') ? profileData.linkedin : `https://${profileData.linkedin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[13px] text-[var(--ispora-brand)] hover:underline break-all"
                      >
                        {profileData.linkedin}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* MENTORSHIP DETAILS SECTION */}
              <div className="pt-3.5 border-t-2 border-[var(--ispora-border)]">
                <div className="text-[11px] font-bold text-[var(--ispora-brand)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5" />
                  Mentorship Details
                </div>
              </div>

              {/* Expertise Areas */}
              {profileData.expertiseAreas && profileData.expertiseAreas.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-2">
                    Expertise Areas
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {profileData.expertiseAreas.map((area, idx) => (
                      <span key={idx} className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-[var(--ispora-brand-light)] text-[var(--ispora-brand)]">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* What I Can Help With */}
              {profileData.whatICanHelpWith && profileData.whatICanHelpWith.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-2">
                    What I Can Help With
                  </div>
                  <div className="space-y-1.5">
                    {profileData.whatICanHelpWith.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-[13px] text-[var(--ispora-text2)]">
                        <CheckCircle className="w-4 h-4 text-[var(--ispora-success)] flex-shrink-0 mt-0.5" strokeWidth={2} />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Industries Worked In */}
              {profileData.industriesWorkedIn && profileData.industriesWorkedIn.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-2">
                    Industries
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {profileData.industriesWorkedIn.map((industry, idx) => (
                      <span key={idx} className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-purple-50 text-purple-600">
                        {industry}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Languages Spoken */}
              {profileData.languagesSpoken && profileData.languagesSpoken.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Languages className="w-3 h-3" />
                    Languages
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {profileData.languagesSpoken.map((lang, idx) => (
                      <span key={idx} className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-orange-50 text-orange-600">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Availability Hours */}
              {profileData.availabilityHoursPerMonth && profileData.availabilityHoursPerMonth > 0 && (
                <div>
                  <div className="text-[11px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Monthly Availability
                  </div>
                  <div className="text-[13px] text-[var(--ispora-text)]">
                    {profileData.availabilityHoursPerMonth} hours/month
                  </div>
                </div>
              )}

              {/* Preferred Mentee Level */}
              {profileData.preferredMenteeLevel && profileData.preferredMenteeLevel.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    Preferred Mentees
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {profileData.preferredMenteeLevel.map((level, idx) => (
                      <span key={idx} className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600">
                        {level}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {(!profileData.bio &&
                !profileData.currentRole &&
                !profileData.company &&
                !profileData.industry &&
                !profileData.yearsOfExperience &&
                !profileData.location &&
                !profileData.education &&
                !profileData.countryOfOrigin &&
                (!profileData.skills || profileData.skills.length === 0) &&
                !profileData.linkedin &&
                (!profileData.expertiseAreas || profileData.expertiseAreas.length === 0) &&
                (!profileData.whatICanHelpWith || profileData.whatICanHelpWith.length === 0) &&
                (!profileData.industriesWorkedIn || profileData.industriesWorkedIn.length === 0) &&
                (!profileData.languagesSpoken || profileData.languagesSpoken.length === 0) &&
                (!profileData.availabilityHoursPerMonth || profileData.availabilityHoursPerMonth === 0) &&
                (!profileData.preferredMenteeLevel || profileData.preferredMenteeLevel.length === 0)) && (
                <div className="text-center py-6">
                  <Lightbulb className="w-10 h-10 text-[var(--ispora-text3)] mx-auto mb-2" strokeWidth={1.5} />
                  <p className="text-[13px] text-[var(--ispora-text3)] mb-3">
                    Complete your mentorship profile to help youth find you more easily
                  </p>
                  <button
                    onClick={() => setShowEditEnhanced(true)}
                    className="text-xs font-semibold text-[var(--ispora-brand)] hover:underline"
                  >
                    Add Details →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-4.5">
          {/* Profile Completion */}
          <div className="bg-white border-[1.5px] border-[var(--ispora-border)] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b-[1.5px] border-[var(--ispora-border)]">
              <h3 className="font-syne text-sm font-bold text-[var(--ispora-text)]">Profile Completion</h3>
            </div>
            <div className="px-5 py-4.5">
              <div className="flex items-center gap-4 p-3.5 bg-[var(--ispora-brand-light)] border border-[var(--ispora-brand)] rounded-xl">
                <div className="relative flex-shrink-0">
                  <svg width="60" height="60" viewBox="0 0 60 60">
                    <circle cx="30" cy="30" r="24" fill="none" stroke="var(--ispora-border)" strokeWidth="6" />
                    <circle
                      cx="30"
                      cy="30"
                      r="24"
                      fill="none"
                      stroke="var(--ispora-brand)"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray="150.796"
                      strokeDashoffset={(1 - profileCompletion / 100) * 150.796}
                      transform="rotate(-90 30 30)"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-dm-sans text-[13px] font-bold text-[var(--ispora-brand)]">{profileCompletion}%</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-syne text-sm font-bold text-[var(--ispora-brand)] mb-1">Almost there!</h4>
                  <p className="text-xs text-[var(--ispora-text2)] leading-relaxed mb-2">
                    Complete your profile to attract more mentees
                  </p>
                  <div className="space-y-1">
                    {completionItems.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-[11px] text-[var(--ispora-text2)]">
                        {item.done ? (
                          <CheckCircle className="w-3 h-3 text-[var(--ispora-success)]" strokeWidth={2.5} />
                        ) : (
                          <Circle className="w-3 h-3 text-[var(--ispora-text3)]" strokeWidth={2} />
                        )}
                        {item.text}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact & Links */}
          <div className="bg-white border-[1.5px] border-[var(--ispora-border)] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b-[1.5px] border-[var(--ispora-border)] flex items-center justify-between">
              <h3 className="font-syne text-sm font-bold text-[var(--ispora-text)]">Contact & Links</h3>
              <button
                onClick={() => setShowEditContact(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--ispora-brand-light)] text-[var(--ispora-brand)] rounded-lg text-xs font-semibold hover:bg-[#e0e3ff] transition-colors"
              >
                <Edit className="w-3 h-3" strokeWidth={2} />
                Edit
              </button>
            </div>
            <div className="px-5 py-4.5 space-y-3.5">
              <div>
                <div className="text-[11px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-1.5">Email</div>
                <div className="text-[13px] text-[var(--ispora-text)]">{profileData.email}</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-1.5">LinkedIn</div>
                {profileData.linkedin ? (
                  <a
                    href={profileData.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[13px] text-[var(--ispora-brand)] hover:underline"
                  >
                    {profileData.linkedin}
                  </a>
                ) : (
                  <div className="text-[13px] text-[var(--ispora-text3)] italic">
                    Not added yet
                    <button
                      onClick={() => setShowEditContact(true)}
                      className="ml-2 text-xs font-semibold text-[var(--ispora-brand)] hover:underline"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>
              <div>
                <div className="text-[11px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-1.5">Twitter / X</div>
                {profileData.twitter ? (
                  <a
                    href={profileData.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[13px] text-[var(--ispora-brand)] hover:underline"
                  >
                    {profileData.twitter}
                  </a>
                ) : (
                  <div className="text-[13px] text-[var(--ispora-text3)] italic">Not added yet</div>
                )}
              </div>
              <div>
                <div className="text-[11px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-1.5">Website</div>
                {profileData.website ? (
                  <a
                    href={profileData.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[13px] text-[var(--ispora-brand)] hover:underline"
                  >
                    {profileData.website}
                  </a>
                ) : (
                  <div className="text-[13px] text-[var(--ispora-text3)] italic">Not added yet</div>
                )}
              </div>
            </div>
          </div>

          {/* Achievements - Removed for MVP */}
          {/* Recent Activity - Removed for MVP */}
        </div>
      </div>

      {/* Edit Contact Modal */}
      {showEditContact && (
        <div
          className="fixed inset-0 bg-[rgba(7,9,74,0.5)] backdrop-blur-sm flex items-center justify-center z-[1000] p-3 md:p-4"
          onClick={() => setShowEditContact(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-[95vw] md:max-w-[480px] shadow-[var(--ispora-shadow-lg)] max-h-[88vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white z-10 px-4 md:px-6 py-4 md:py-5 border-b border-[var(--ispora-border)] flex items-start justify-between">
              <div>
                <h3 className="font-syne text-base font-bold text-[var(--ispora-text)]">Edit Contact & Links</h3>
                <p className="text-xs text-[var(--ispora-text3)] mt-1">Add your social media and contact information</p>
              </div>
              <button
                onClick={() => setShowEditContact(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--ispora-text3)] hover:bg-[var(--ispora-bg)] hover:text-[var(--ispora-text)] transition-colors"
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  disabled
                  className="w-full border-[1.5px] border-[var(--ispora-border)] rounded-[10px] px-3.5 py-2.5 text-[13px] text-[var(--ispora-text)] bg-[var(--ispora-bg)] outline-none cursor-not-allowed opacity-60"
                />
                <div className="text-[10px] text-[var(--ispora-text3)] mt-1">
                  Email cannot be changed. Contact support if needed.
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-1.5">
                  LinkedIn URL
                </label>
                <input
                  type="url"
                  value={profileData.linkedin}
                  onChange={(e) => setProfileData({ ...profileData, linkedin: e.target.value })}
                  placeholder="https://linkedin.com/in/yourprofile"
                  className="w-full border-[1.5px] border-[var(--ispora-border)] rounded-[10px] px-3.5 py-2.5 text-[13px] text-[var(--ispora-text)] bg-white outline-none transition-all focus:border-[var(--ispora-brand)] focus:shadow-[0_0_0_3px_rgba(2,31,246,0.07)] placeholder:text-[var(--ispora-text3)]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-1.5">
                  Twitter / X URL
                </label>
                <input
                  type="url"
                  value={profileData.twitter}
                  onChange={(e) => setProfileData({ ...profileData, twitter: e.target.value })}
                  placeholder="https://twitter.com/yourhandle"
                  className="w-full border-[1.5px] border-[var(--ispora-border)] rounded-[10px] px-3.5 py-2.5 text-[13px] text-[var(--ispora-text)] bg-white outline-none transition-all focus:border-[var(--ispora-brand)] focus:shadow-[0_0_0_3px_rgba(2,31,246,0.07)] placeholder:text-[var(--ispora-text3)]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-1.5">
                  Website URL
                </label>
                <input
                  type="url"
                  value={profileData.website}
                  onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                  placeholder="https://yourwebsite.com"
                  className="w-full border-[1.5px] border-[var(--ispora-border)] rounded-[10px] px-3.5 py-2.5 text-[13px] text-[var(--ispora-text)] bg-white outline-none transition-all focus:border-[var(--ispora-brand)] focus:shadow-[0_0_0_3px_rgba(2,31,246,0.07)] placeholder:text-[var(--ispora-text3)]"
                />
              </div>
            </div>
            <div className="sticky bottom-0 bg-white z-10 px-6 py-3.5 border-t border-[var(--ispora-border)] flex justify-end gap-2.5">
              <button
                onClick={() => setShowEditContact(false)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-white text-[var(--ispora-text)] border-[1.5px] border-[var(--ispora-border)] rounded-[10px] text-[13px] font-semibold hover:border-[var(--ispora-brand)] hover:text-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const success = await saveProfileUpdates({
                    linkedin: profileData.linkedin,
                    twitter: profileData.twitter,
                    website: profileData.website
                  });
                  if (success) setShowEditContact(false);
                }}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-[var(--ispora-brand)] text-white rounded-[10px] text-[13px] font-semibold hover:bg-[var(--ispora-brand-hover)] hover:shadow-[0_4px_14px_rgba(2,31,246,0.3)] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" strokeWidth={2} />
                    Save Contact & Links
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Enhanced Profile Modal - NEW */}
      {showEditEnhanced && (
        <div
          className="fixed inset-0 bg-[rgba(7,9,74,0.5)] backdrop-blur-sm flex items-center justify-center z-[1000] p-3 md:p-4"
          onClick={() => setShowEditEnhanced(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-[95vw] md:max-w-[680px] shadow-[var(--ispora-shadow-lg)] max-h-[88vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white z-10 px-4 md:px-6 py-4 md:py-5 border-b border-[var(--ispora-border)] flex items-start justify-between">
              <div>
                <h3 className="font-syne text-base font-bold text-[var(--ispora-text)]">Edit Mentorship Profile</h3>
                <p className="text-xs text-[var(--ispora-text3)] mt-1">Help youth find you by completing your profile</p>
              </div>
              <button
                onClick={() => setShowEditEnhanced(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--ispora-text3)] hover:bg-[var(--ispora-bg)] hover:text-[var(--ispora-text)] transition-colors"
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {/* Bio - MOVED FROM ABOUT ME */}
              <div>
                <label className="block text-[11px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-1.5">
                  About Me / Bio
                </label>
                <textarea
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  placeholder="Tell students about yourself, your journey, and why you want to mentor..."
                  rows={4}
                  className="w-full border-[1.5px] border-[var(--ispora-border)] rounded-[10px] px-3.5 py-2.5 text-[13px] text-[var(--ispora-text)] bg-white outline-none transition-all focus:border-[var(--ispora-brand)] focus:shadow-[0_0_0_3px_rgba(2,31,246,0.07)] placeholder:text-[var(--ispora-text3)] resize-y"
                />
              </div>

              {/* PROFESSIONAL BACKGROUND SECTION HEADER */}
              <div className="pt-2 border-t-2 border-[var(--ispora-border)]">
                <h4 className="text-xs font-bold text-[var(--ispora-brand)] uppercase tracking-wider mb-3">
                  💼 Professional Background
                </h4>
              </div>

              {/* Current Role */}
              <div>
                <label className="block text-[11px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-1.5">
                  Current Job Title
                </label>
                <input
                  type="text"
                  value={profileData.currentRole}
                  onChange={(e) => setProfileData({ ...profileData, currentRole: e.target.value })}
                  placeholder="e.g., Senior Software Engineer"
                  className="w-full border-[1.5px] border-[var(--ispora-border)] rounded-[10px] px-3.5 py-2.5 text-[13px] text-[var(--ispora-text)] bg-white outline-none transition-all focus:border-[var(--ispora-brand)] focus:shadow-[0_0_0_3px_rgba(2,31,246,0.07)] placeholder:text-[var(--ispora-text3)]"
                />
              </div>

              {/* Company */}
              <div>
                <label className="block text-[11px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-1.5">
                  Company
                </label>
                <input
                  type="text"
                  value={profileData.company}
                  onChange={(e) => setProfileData({ ...profileData, company: e.target.value })}
                  placeholder="e.g., Google"
                  className="w-full border-[1.5px] border-[var(--ispora-border)] rounded-[10px] px-3.5 py-2.5 text-[13px] text-[var(--ispora-text)] bg-white outline-none transition-all focus:border-[var(--ispora-brand)] focus:shadow-[0_0_0_3px_rgba(2,31,246,0.07)] placeholder:text-[var(--ispora-text3)]"
                />
              </div>

              {/* Industry & Years of Experience - Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-1.5">
                    Industry
                  </label>
                  <input
                    type="text"
                    value={profileData.industry}
                    onChange={(e) => setProfileData({ ...profileData, industry: e.target.value })}
                    placeholder="e.g., Technology"
                    className="w-full border-[1.5px] border-[var(--ispora-border)] rounded-[10px] px-3.5 py-2.5 text-[13px] text-[var(--ispora-text)] bg-white outline-none transition-all focus:border-[var(--ispora-brand)] focus:shadow-[0_0_0_3px_rgba(2,31,246,0.07)] placeholder:text-[var(--ispora-text3)]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-1.5">
                    Years of Experience
                  </label>
                  <input
                    type="number"
                    value={profileData.yearsOfExperience}
                    onChange={(e) => setProfileData({ ...profileData, yearsOfExperience: e.target.value })}
                    placeholder="e.g., 8"
                    className="w-full border-[1.5px] border-[var(--ispora-border)] rounded-[10px] px-3.5 py-2.5 text-[13px] text-[var(--ispora-text)] bg-white outline-none transition-all focus:border-[var(--ispora-brand)] focus:shadow-[0_0_0_3px_rgba(2,31,246,0.07)] placeholder:text-[var(--ispora-text3)]"
                  />
                </div>
              </div>

              {/* Location & Country - Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-1.5">
                    Current Location
                  </label>
                  <input
                    type="text"
                    value={profileData.location}
                    onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                    placeholder="e.g., London, UK"
                    className="w-full border-[1.5px] border-[var(--ispora-border)] rounded-[10px] px-3.5 py-2.5 text-[13px] text-[var(--ispora-text)] bg-white outline-none transition-all focus:border-[var(--ispora-brand)] focus:shadow-[0_0_0_3px_rgba(2,31,246,0.07)] placeholder:text-[var(--ispora-text3)]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-1.5">
                    Country of Origin
                  </label>
                  <input
                    type="text"
                    value={profileData.countryOfOrigin}
                    onChange={(e) => setProfileData({ ...profileData, countryOfOrigin: e.target.value })}
                    placeholder="e.g., Nigeria"
                    className="w-full border-[1.5px] border-[var(--ispora-border)] rounded-[10px] px-3.5 py-2.5 text-[13px] text-[var(--ispora-text)] bg-white outline-none transition-all focus:border-[var(--ispora-brand)] focus:shadow-[0_0_0_3px_rgba(2,31,246,0.07)] placeholder:text-[var(--ispora-text3)]"
                  />
                </div>
              </div>

              {/* Education */}
              <div>
                <label className="block text-[11px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-1.5">
                  Education (Degree)
                </label>
                <input
                  type="text"
                  value={profileData.education}
                  onChange={(e) => setProfileData({ ...profileData, education: e.target.value })}
                  placeholder="e.g., Bachelor's in Computer Science"
                  className="w-full border-[1.5px] border-[var(--ispora-border)] rounded-[10px] px-3.5 py-2.5 text-[13px] text-[var(--ispora-text)] bg-white outline-none transition-all focus:border-[var(--ispora-brand)] focus:shadow-[0_0_0_3px_rgba(2,31,246,0.07)] placeholder:text-[var(--ispora-text3)]"
                />
              </div>

              {/* Education Institution */}
              <div>
                <label className="block text-[11px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-1.5">
                  University/Institution
                </label>
                <input
                  type="text"
                  value={profileData.educationInstitution}
                  onChange={(e) => setProfileData({ ...profileData, educationInstitution: e.target.value })}
                  placeholder="e.g., University of Lagos"
                  className="w-full border-[1.5px] border-[var(--ispora-border)] rounded-[10px] px-3.5 py-2.5 text-[13px] text-[var(--ispora-text)] bg-white outline-none transition-all focus:border-[var(--ispora-brand)] focus:shadow-[0_0_0_3px_rgba(2,31,246,0.07)] placeholder:text-[var(--ispora-text3)]"
                />
              </div>

              {/* Skills */}
              <div>
                <label className="block text-[11px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-1.5">
                  Skills & Expertise (comma separated)
                </label>
                <input
                  type="text"
                  value={profileData.skills.join(', ')}
                  onChange={(e) => setProfileData({ ...profileData, skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  placeholder="e.g., Python, React, Leadership, Data Analysis"
                  className="w-full border-[1.5px] border-[var(--ispora-border)] rounded-[10px] px-3.5 py-2.5 text-[13px] text-[var(--ispora-text)] bg-white outline-none transition-all focus:border-[var(--ispora-brand)] focus:shadow-[0_0_0_3px_rgba(2,31,246,0.07)] placeholder:text-[var(--ispora-text3)]"
                />
              </div>

              {/* LinkedIn */}
              <div>
                <label className="block text-[11px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-1.5">
                  LinkedIn Profile URL
                </label>
                <input
                  type="url"
                  value={profileData.linkedin}
                  onChange={(e) => setProfileData({ ...profileData, linkedin: e.target.value })}
                  placeholder="https://linkedin.com/in/yourprofile"
                  className="w-full border-[1.5px] border-[var(--ispora-border)] rounded-[10px] px-3.5 py-2.5 text-[13px] text-[var(--ispora-text)] bg-white outline-none transition-all focus:border-[var(--ispora-brand)] focus:shadow-[0_0_0_3px_rgba(2,31,246,0.07)] placeholder:text-[var(--ispora-text3)]"
                />
              </div>

              {/* MENTORSHIP DETAILS SECTION HEADER */}
              <div className="pt-2 border-t-2 border-[var(--ispora-border)]">
                <h4 className="text-xs font-bold text-[var(--ispora-brand)] uppercase tracking-wider mb-3">
                  🎯 Mentorship Details
                </h4>
              </div>

              {/* Expertise Areas */}
              <div>
                <MultiSelectWithOther
                  label="Expertise Areas"
                  options={EXPERTISE_AREAS}
                  selectedValues={profileData.expertiseAreas || []}
                  onChange={(values) => setProfileData({ ...profileData, expertiseAreas: values })}
                  placeholder="Select your expertise areas..."
                  maxHeight="250px"
                />
              </div>

              {/* What I Can Help With */}
              <div>
                <MultiSelectWithOther
                  label="What I Can Help With"
                  options={WHAT_I_CAN_HELP_WITH}
                  selectedValues={profileData.whatICanHelpWith || []}
                  onChange={(values) => setProfileData({ ...profileData, whatICanHelpWith: values })}
                  placeholder="Select what you can help with..."
                  maxHeight="250px"
                />
              </div>

              {/* Industries */}
              <div>
                <label className="block text-[11px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-2">
                  Industries Worked In
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto border border-[var(--ispora-border)] rounded-lg p-3">
                  {INDUSTRIES.map(industry => (
                    <label key={industry} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-[var(--ispora-bg)] p-1 rounded">
                      <input
                        type="checkbox"
                        checked={profileData.industriesWorkedIn?.includes(industry)}
                        onChange={(e) => {
                          const current = profileData.industriesWorkedIn || [];
                          const updated = e.target.checked
                            ? [...current, industry]
                            : current.filter(i => i !== industry);
                          setProfileData({ ...profileData, industriesWorkedIn: updated });
                        }}
                        className="w-4 h-4 text-[var(--ispora-brand)] border-[var(--ispora-border)] rounded focus:ring-[var(--ispora-brand)]"
                      />
                      <span className="text-[var(--ispora-text2)]">{industry}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Languages */}
              <div>
                <label className="block text-[11px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-2">
                  Languages Spoken
                </label>
                <div className="grid grid-cols-3 gap-2 border border-[var(--ispora-border)] rounded-lg p-3">
                  {LANGUAGES.map(lang => (
                    <label key={lang} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-[var(--ispora-bg)] p-1 rounded">
                      <input
                        type="checkbox"
                        checked={profileData.languagesSpoken?.includes(lang)}
                        onChange={(e) => {
                          const current = profileData.languagesSpoken || [];
                          const updated = e.target.checked
                            ? [...current, lang]
                            : current.filter(l => l !== lang);
                          setProfileData({ ...profileData, languagesSpoken: updated });
                        }}
                        className="w-4 h-4 text-[var(--ispora-brand)] border-[var(--ispora-border)] rounded focus:ring-[var(--ispora-brand)]"
                      />
                      <span className="text-[var(--ispora-text2)]">{lang}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Availability Hours */}
              <div>
                <label className="block text-[11px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-1.5">
                  Monthly Availability (hours)
                </label>
                <select
                  value={profileData.availabilityHoursPerMonth || 0}
                  onChange={(e) => setProfileData({ ...profileData, availabilityHoursPerMonth: parseInt(e.target.value) })}
                  className="w-full border-[1.5px] border-[var(--ispora-border)] rounded-[10px] px-3.5 py-2.5 text-[13px] text-[var(--ispora-text)] bg-white outline-none transition-all focus:border-[var(--ispora-brand)] focus:shadow-[0_0_0_3px_rgba(2,31,246,0.07)]"
                >
                  <option value="0">Select hours per month</option>
                  {AVAILABILITY_HOURS_OPTIONS.map(hours => (
                    <option key={hours} value={hours}>{hours} hours/month</option>
                  ))}
                </select>
              </div>

              {/* Preferred Mentee Level */}
              <div>
                <label className="block text-[11px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-2">
                  Preferred Mentee Level
                </label>
                <div className="grid grid-cols-2 gap-2 border border-[var(--ispora-border)] rounded-lg p-3">
                  {MENTEE_LEVELS.map(level => (
                    <label key={level} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-[var(--ispora-bg)] p-1 rounded">
                      <input
                        type="checkbox"
                        checked={profileData.preferredMenteeLevel?.includes(level)}
                        onChange={(e) => {
                          const current = profileData.preferredMenteeLevel || [];
                          const updated = e.target.checked
                            ? [...current, level]
                            : current.filter(l => l !== level);
                          setProfileData({ ...profileData, preferredMenteeLevel: updated });
                        }}
                        className="w-4 h-4 text-[var(--ispora-brand)] border-[var(--ispora-border)] rounded focus:ring-[var(--ispora-brand)]"
                      />
                      <span className="text-[var(--ispora-text2)]">{level}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 bg-white z-10 px-6 py-3.5 border-t border-[var(--ispora-border)] flex justify-end gap-2.5">
              <button
                onClick={() => setShowEditEnhanced(false)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-white text-[var(--ispora-text)] border-[1.5px] border-[var(--ispora-border)] rounded-[10px] text-[13px] font-semibold hover:border-[var(--ispora-brand)] hover:text-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const success = await saveProfileUpdates({
                    bio: profileData.bio,
                    currentRole: profileData.currentRole,
                    company: profileData.company,
                    industry: profileData.industry,
                    yearsOfExperience: profileData.yearsOfExperience,
                    location: profileData.location,
                    countryOfOrigin: profileData.countryOfOrigin,
                    education: profileData.education,
                    educationInstitution: profileData.educationInstitution,
                    skills: profileData.skills,
                    linkedin: profileData.linkedin,
                    expertiseAreas: profileData.expertiseAreas,
                    whatICanHelpWith: profileData.whatICanHelpWith,
                    industriesWorkedIn: profileData.industriesWorkedIn,
                    languagesSpoken: profileData.languagesSpoken,
                    availabilityHoursPerMonth: profileData.availabilityHoursPerMonth,
                    preferredMenteeLevel: profileData.preferredMenteeLevel
                  });
                  if (success) setShowEditEnhanced(false);
                }}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-[var(--ispora-brand)] text-white rounded-[10px] text-[13px] font-semibold hover:bg-[var(--ispora-brand-hover)] hover:shadow-[0_4px_14px_rgba(2,31,246,0.3)] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" strokeWidth={2} />
                    Save Mentorship Profile
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;