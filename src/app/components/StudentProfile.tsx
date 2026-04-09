import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userApi, authApi } from '../lib/api';
import {
  Edit,
  X,
  MapPin,
  GraduationCap,
  Briefcase,
  Target,
  TrendingUp,
  Award,
  Calendar,
  Loader2,
  Save,
  CheckCircle,
  Circle,
  BookOpen,
  Heart,
  Share2,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import MultiSelectWithOther from './MultiSelectWithOther';
import { CAREER_INTERESTS, LEARNING_GOALS, INDUSTRIES, YEAR_OF_STUDY_OPTIONS } from '../constants/profileOptions';

interface StudentProfileData {
  fullName: string;
  university: string;
  major: string;
  yearOfStudy: string;
  location: string;
  careerInterests: string[];
  lookingFor: string[];
  industries: string[];
  skills: string[];
  bio: string;
  linkedin: string;
  twitter: string;
  github: string;
  portfolio: string;
  profilePicture?: string;
}

export default function StudentProfile() {
  const { user, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  console.log('🔍 StudentProfile Component Rendering');
  console.log('  - User ID:', user?.id);
  console.log('  - User Role:', user?.role);
  console.log('  - User MentorType:', (user as any)?.mentorType);

  const [profileData, setProfileData] = useState<StudentProfileData>({
    fullName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
    university: '',
    major: '',
    yearOfStudy: '',
    location: '',
    careerInterests: [],
    lookingFor: [],
    industries: [],
    skills: [],
    bio: '',
    linkedin: '',
    twitter: '',
    github: '',
    portfolio: ''
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showEditContact, setShowEditContact] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

  // Handle profile picture upload
  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
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
            
            toast.success('Profile picture updated successfully!');
          } else {
            toast.error('Failed to upload profile picture');
          }
        } catch (error) {
          console.error('Upload error:', error);
          toast.error('Failed to upload profile picture');
        } finally {
          setIsUploading(false);
        }
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('File read error:', error);
      toast.error('Failed to read image file');
      setIsUploading(false);
    }
  };

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response: any = await userApi.getUser(user.id);

        if (response.user) {
          const userData = response.user;
          setProfileData({
            fullName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() ||
              `${user.firstName || ''} ${user.lastName || ''}`.trim(),
            university: userData.university || '',
            major: userData.major || '',
            yearOfStudy: userData.yearOfStudy || '',
            location: userData.location || '',
            careerInterests: userData.careerInterests || [],
            lookingFor: userData.lookingFor || [],
            industries: userData.industries || [],
            skills: userData.skills || [],
            bio: userData.bio || '',
            linkedin: userData.linkedin || '',
            twitter: userData.twitter || '',
            github: userData.github || '',
            portfolio: userData.portfolio || '',
            profilePicture: userData.profilePicture || ''
          });
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  // Save profile updates
  const saveProfileUpdates = async (updates: Partial<StudentProfileData>) => {
    if (!user?.id) return false;

    try {
      setIsSaving(true);
      await authApi.updateProfile(updates);
      setProfileData(prev => ({ ...prev, ...updates }));
      toast.success('Profile updated successfully!');
      return true;
    } catch (err) {
      console.error('Error saving profile:', err);
      toast.error('Failed to save profile changes');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate profile completion
  const calculateProfileCompletion = () => {
    const fields = [
      { value: profileData.bio, weight: 20 },
      { value: profileData.skills.length > 0, weight: 15 },
      { value: profileData.university, weight: 10 },
      { value: profileData.major, weight: 10 },
      { value: profileData.location, weight: 10 },
      { value: profileData.careerInterests.length > 0, weight: 15 },
      { value: profileData.lookingFor.length > 0, weight: 10 },
      { value: profileData.linkedin, weight: 5 },
      { value: profileData.github, weight: 2.5 },
      { value: profileData.portfolio, weight: 2.5 },
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
    { done: !!profileData.university && !!profileData.major, text: profileData.university && profileData.major ? 'Academic info' : 'Academic info (missing)' },
    { done: !!profileData.linkedin, text: profileData.linkedin ? 'LinkedIn added' : 'LinkedIn (missing)' },
    { done: !!profileData.portfolio, text: profileData.portfolio ? 'Portfolio added' : 'Portfolio (missing)' }
  ];

  const initials = profileData.fullName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto bg-[var(--ispora-bg)] px-4 md:px-7 py-4 md:py-6 pb-20 md:pb-6">
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
    <div className="flex-1 overflow-y-auto bg-[var(--ispora-bg)] px-4 md:px-7 py-4 md:py-6 pb-20 md:pb-6">
      {/* Profile Hero */}
      <div className="bg-[var(--ispora-brand)] rounded-2xl overflow-hidden mb-5">
        {/* Cover Section */}
        <div className="h-[120px] relative overflow-hidden">
          {/* Grid background */}
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
              backgroundSize: '28px 28px'
            }}
          />
          {/* Orbs */}
          <div className="absolute -top-10 -right-10 w-[200px] h-[200px] bg-white/[0.06] rounded-full" />
          <div className="absolute -bottom-16 left-16 w-40 h-40 bg-white/[0.04] rounded-full" />
        </div>

        {/* Profile Body */}
        <div className="bg-white px-7 pb-6 relative">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleProfilePictureUpload}
            className="hidden"
          />
          
          {/* Avatar */}
          <div className="relative inline-block -mt-[42px] mb-3">
            {profileData.profilePicture ? (
              <img
                src={profileData.profilePicture}
                alt={profileData.fullName}
                className="w-[84px] h-[84px] rounded-full border-4 border-white object-cover shadow-[0_4px_16px_rgba(2,31,246,0.2)]"
              />
            ) : (
              <div className="w-[84px] h-[84px] rounded-full bg-[var(--ispora-brand)] border-4 border-white flex items-center justify-center text-white font-extrabold text-[32px] shadow-[0_4px_16px_rgba(2,31,246,0.2)]">
                {initials}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="absolute bottom-1 right-1 w-[26px] h-[26px] rounded-full bg-[var(--ispora-brand)] border-2 border-white flex items-center justify-center hover:bg-[var(--ispora-brand-hover)] hover:scale-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
            <div className="flex-1 w-full md:w-auto">
              <h1 className="font-syne text-[22px] font-extrabold text-[var(--ispora-text)] mb-1">
                {profileData.fullName}
              </h1>
              <p className="text-[13px] text-[var(--ispora-text2)] mb-2">
                {profileData.major && profileData.university
                  ? `${profileData.major} Student at ${profileData.university}`
                  : 'Student'}
              </p>

              {/* Meta Info */}
              <div className="flex flex-wrap gap-3.5 mb-2">
                {profileData.location && (
                  <div className="flex items-center gap-1.5 text-xs text-[var(--ispora-text3)]">
                    <MapPin className="w-3.5 h-3.5" strokeWidth={2} />
                    {profileData.location}
                  </div>
                )}
                {profileData.university && (
                  <div className="flex items-center gap-1.5 text-xs text-[var(--ispora-text3)]">
                    <GraduationCap className="w-3.5 h-3.5" strokeWidth={2} />
                    {profileData.university}
                  </div>
                )}
                {profileData.yearOfStudy && (
                  <div className="flex items-center gap-1.5 text-xs text-[var(--ispora-text3)]">
                    <Calendar className="w-3.5 h-3.5" strokeWidth={2} />
                    {profileData.yearOfStudy}
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mb-3 md:mb-0">
                {profileData.careerInterests.slice(0, 4).map((interest, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[var(--ispora-brand-light)] text-[var(--ispora-brand)]"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Buttons - Desktop: top right, Mobile: below content */}
            <div className="flex gap-2 w-full md:w-auto md:pt-1">
              <button 
                onClick={() => {
                  const profileUrl = `${window.location.origin}/student/${user?.id}`;
                  navigator.clipboard.writeText(profileUrl);
                  alert('Profile link copied to clipboard!');
                }}
                className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-[var(--ispora-brand)] text-white rounded-lg text-xs font-semibold hover:bg-[var(--ispora-brand-hover)] hover:shadow-[0_4px_14px_rgba(2,31,246,0.3)] hover:-translate-y-0.5 transition-all"
              >
                <Share2 className="w-3 h-3" strokeWidth={2} />
                Share Profile
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4.5">
        {/* Left Column */}
        <div className="flex flex-col gap-4.5">
          {/* Complete Profile */}
          <div className="bg-white border-[1.5px] border-[var(--ispora-border)] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b-[1.5px] border-[var(--ispora-border)] flex items-center justify-between">
              <h3 className="font-syne text-sm font-bold text-[var(--ispora-text)]">
                Complete Profile
              </h3>
              <button
                onClick={() => setShowEditProfile(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--ispora-brand-light)] text-[var(--ispora-brand)] rounded-lg text-xs font-semibold hover:bg-[#e0e3ff] transition-colors"
              >
                <Edit className="w-3 h-3" strokeWidth={2} />
                Edit
              </button>
            </div>
            <div className="px-5 py-4.5 space-y-3.5">
              {/* Bio/About Me */}
              <div>
                <div className="text-[11px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-2">
                  About Me
                </div>
                <p className="text-[13px] text-[var(--ispora-text2)] leading-relaxed whitespace-pre-line">
                  {profileData.bio || 'No bio added yet. Click Edit to tell mentors about yourself.'}
                </p>
              </div>

              {/* Academic Background Section */}
              <div className="pt-3.5 border-t-2 border-[var(--ispora-border)]">
                <div className="text-[11px] font-bold text-[var(--ispora-brand)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5" />
                  Academic Background
                </div>
                
                <div className="space-y-3">
                  {/* University & Major Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-[11px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-1">
                        University
                      </div>
                      <div className="text-[13px] text-[var(--ispora-text)]">
                        {profileData.university || 'Not specified'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-1">
                        Major
                      </div>
                      <div className="text-[13px] text-[var(--ispora-text)]">
                        {profileData.major || 'Not specified'}
                      </div>
                    </div>
                  </div>

                  {/* Year & Location Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-[11px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-1">
                        Year of Study
                      </div>
                      <div className="text-[13px] text-[var(--ispora-text)]">
                        {profileData.yearOfStudy || 'Not specified'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-1">
                        Location
                      </div>
                      <div className="text-[13px] text-[var(--ispora-text)]">
                        {profileData.location || 'Not specified'}
                      </div>
                    </div>
                  </div>

                  {/* Skills */}
                  {profileData.skills && profileData.skills.length > 0 && (
                    <div>
                      <div className="text-[11px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-2">
                        Skills
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {profileData.skills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[var(--ispora-accent-light)] text-[var(--ispora-accent)]"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Goals & Interests Section */}
              <div className="pt-3.5 border-t-2 border-[var(--ispora-border)]">
                <div className="text-[11px] font-bold text-[var(--ispora-brand)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5" />
                  Goals & Interests
                </div>
                
                <div className="space-y-3">
                  {/* Career Interests */}
                  <div>
                    <div className="text-[11px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-2">
                      Career Interests
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {profileData.careerInterests.length > 0 ? (
                        profileData.careerInterests.map((interest, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[var(--ispora-brand-light)] text-[var(--ispora-brand)]"
                          >
                            {interest}
                          </span>
                        ))
                      ) : (
                        <span className="text-[13px] text-[var(--ispora-text3)] italic">No interests added yet</span>
                      )}
                    </div>
                  </div>

                  {/* What I'm Looking For */}
                  <div>
                    <div className="text-[11px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-2">
                      What I'm Looking For
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {profileData.lookingFor.length > 0 ? (
                        profileData.lookingFor.map((item, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[var(--ispora-success-light)] text-[var(--ispora-success)]"
                          >
                            {item}
                          </span>
                        ))
                      ) : (
                        <span className="text-[13px] text-[var(--ispora-text3)] italic">No goals specified yet</span>
                      )}
                    </div>
                  </div>

                  {/* Industries of Interest */}
                  <div>
                    <div className="text-[11px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-2">
                      Industries of Interest
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {profileData.industries.length > 0 ? (
                        profileData.industries.map((industry, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[var(--ispora-warning-light)] text-[var(--ispora-warning)]"
                          >
                            {industry}
                          </span>
                        ))
                      ) : (
                        <span className="text-[13px] text-[var(--ispora-text3)] italic">No industries selected yet</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* My Goals Section */}
              <div className="pt-3.5 border-t-2 border-[var(--ispora-border)]">
                <div className="text-[11px] font-bold text-[var(--ispora-brand)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  My Goals
                </div>
                
                <div className="text-center py-6 bg-[var(--ispora-bg)] rounded-xl">
                  <div className="w-12 h-12 bg-[var(--ispora-brand-light)] rounded-full flex items-center justify-center mx-auto mb-2.5">
                    <Target className="w-5 h-5 text-[var(--ispora-brand)]" strokeWidth={1.8} />
                  </div>
                  <p className="text-xs text-[var(--ispora-text3)] mb-2">No goals set yet</p>
                  <button className="text-xs font-semibold text-[var(--ispora-brand)] hover:underline">
                    Set Your First Goal
                  </button>
                </div>
              </div>
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
                  <h4 className="font-syne text-sm font-bold text-[var(--ispora-brand)] mb-1">Keep going!</h4>
                  <p className="text-xs text-[var(--ispora-text2)] leading-relaxed mb-2">
                    Complete your profile to get better mentor matches
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
                <div className="text-[13px] text-[var(--ispora-text)]">{user?.email}</div>
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
                    View Profile
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
                <div className="text-[11px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-1.5">GitHub</div>
                {profileData.github ? (
                  <a
                    href={profileData.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[13px] text-[var(--ispora-brand)] hover:underline"
                  >
                    View Profile
                  </a>
                ) : (
                  <div className="text-[13px] text-[var(--ispora-text3)] italic">Not added yet</div>
                )}
              </div>
              <div>
                <div className="text-[11px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-1.5">Portfolio</div>
                {profileData.portfolio ? (
                  <a
                    href={profileData.portfolio}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[13px] text-[var(--ispora-brand)] hover:underline"
                  >
                    View Website
                  </a>
                ) : (
                  <div className="text-[13px] text-[var(--ispora-text3)] italic">Not added yet</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Contact Modal */}
      {showEditContact && (
        <EditContactModal
          profileData={profileData}
          onClose={() => setShowEditContact(false)}
          onSave={async (updates) => {
            const success = await saveProfileUpdates(updates);
            if (success) {
              setShowEditContact(false);
            }
          }}
          isSaving={isSaving}
        />
      )}

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <EditProfileModal
          profileData={profileData}
          onClose={() => setShowEditProfile(false)}
          onSave={async (updates) => {
            const success = await saveProfileUpdates(updates);
            if (success) {
              setShowEditProfile(false);
            }
          }}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}

// Edit Contact Modal Component
function EditContactModal({ profileData, onClose, onSave, isSaving }: any) {
  const [linkedin, setLinkedin] = useState(profileData.linkedin);
  const [twitter, setTwitter] = useState(profileData.twitter);
  const [github, setGithub] = useState(profileData.github);
  const [portfolio, setPortfolio] = useState(profileData.portfolio);

  const handleSave = () => {
    onSave({ linkedin, twitter, github, portfolio });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border-[1.5px] border-[var(--ispora-border)] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="px-6 py-4 border-b-[1.5px] border-[var(--ispora-border)] flex items-center justify-between">
          <h3 className="font-syne text-lg font-bold text-[var(--ispora-text)]">
            Edit Contact & Links
          </h3>
          <button
            onClick={onClose}
            className="text-[var(--ispora-text3)] hover:text-[var(--ispora-text)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto p-6 flex-1">
          <div className="space-y-5">
            <div>
              <label className="block text-[11px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-1.5">
                LinkedIn Profile
              </label>
              <input
                type="url"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="https://linkedin.com/in/yourprofile"
                className="w-full border-[1.5px] border-[var(--ispora-border)] rounded-[10px] px-3.5 py-2.5 text-[13px] text-[var(--ispora-text)] outline-none transition-all focus:border-[var(--ispora-brand)] focus:shadow-[0_0_0_3px_rgba(2,31,246,0.07)] placeholder:text-[var(--ispora-text3)]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-1.5">
                Twitter Profile
              </label>
              <input
                type="url"
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                placeholder="https://twitter.com/yourhandle"
                className="w-full border-[1.5px] border-[var(--ispora-border)] rounded-[10px] px-3.5 py-2.5 text-[13px] text-[var(--ispora-text)] outline-none transition-all focus:border-[var(--ispora-brand)] focus:shadow-[0_0_0_3px_rgba(2,31,246,0.07)] placeholder:text-[var(--ispora-text3)]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-1.5">
                GitHub Profile
              </label>
              <input
                type="url"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                placeholder="https://github.com/yourusername"
                className="w-full border-[1.5px] border-[var(--ispora-border)] rounded-[10px] px-3.5 py-2.5 text-[13px] text-[var(--ispora-text)] outline-none transition-all focus:border-[var(--ispora-brand)] focus:shadow-[0_0_0_3px_rgba(2,31,246,0.07)] placeholder:text-[var(--ispora-text3)]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-1.5">
                Portfolio Website
              </label>
              <input
                type="url"
                value={portfolio}
                onChange={(e) => setPortfolio(e.target.value)}
                placeholder="https://yourportfolio.com"
                className="w-full border-[1.5px] border-[var(--ispora-border)] rounded-[10px] px-3.5 py-2.5 text-[13px] text-[var(--ispora-text)] outline-none transition-all focus:border-[var(--ispora-brand)] focus:shadow-[0_0_0_3px_rgba(2,31,246,0.07)] placeholder:text-[var(--ispora-text3)]"
              />
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t-[1.5px] border-[var(--ispora-border)] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 bg-white text-[var(--ispora-text)] border-[1.5px] border-[var(--ispora-border)] rounded-lg text-sm font-semibold hover:bg-[var(--ispora-bg)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--ispora-brand)] text-white rounded-lg text-sm font-semibold hover:bg-[var(--ispora-brand-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Edit Profile Modal Component
function EditProfileModal({ profileData, onClose, onSave, isSaving }: any) {
  const [bio, setBio] = useState(profileData.bio);
  const [lookingFor, setLookingFor] = useState(profileData.lookingFor);
  const [university, setUniversity] = useState(profileData.university);
  const [major, setMajor] = useState(profileData.major);
  const [yearOfStudy, setYearOfStudy] = useState(profileData.yearOfStudy);
  const [location, setLocation] = useState(profileData.location);
  const [careerInterests, setCareerInterests] = useState(profileData.careerInterests);
  const [industries, setIndustries] = useState(profileData.industries);
  const [skills, setSkills] = useState(profileData.skills);

  const handleSave = () => {
    onSave({ bio, lookingFor, university, major, yearOfStudy, location, careerInterests, industries, skills });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border-[1.5px] border-[var(--ispora-border)] w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="px-6 py-4 border-b-[1.5px] border-[var(--ispora-border)] flex items-center justify-between">
          <h3 className="font-syne text-lg font-bold text-[var(--ispora-text)]">
            Edit Profile
          </h3>
          <button
            onClick={onClose}
            className="text-[var(--ispora-text3)] hover:text-[var(--ispora-text)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto p-6 flex-1">
          <div className="space-y-5">
            <div>
              <label className="block text-[11px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-1.5">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell mentors about yourself, your background, and what you're passionate about..."
                className="w-full border-[1.5px] border-[var(--ispora-border)] rounded-[10px] px-3.5 py-2.5 text-[13px] text-[var(--ispora-text)] outline-none transition-all focus:border-[var(--ispora-brand)] focus:shadow-[0_0_0_3px_rgba(2,31,246,0.07)] placeholder:text-[var(--ispora-text3)] resize-none"
                rows={6}
              />
            </div>

            <div>
              <MultiSelectWithOther
                label="What I'm Looking For"
                options={LEARNING_GOALS}
                selectedValues={lookingFor}
                onChange={setLookingFor}
                placeholder="Select what you're looking for from mentors..."
                maxHeight="300px"
              />
              <p className="text-xs text-[var(--ispora-text3)] mt-1.5">
                This helps match you with mentors who can help with your specific goals
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-1.5">
                  University
                </label>
                <input
                  type="text"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="e.g., University of Lagos"
                  className="w-full border-[1.5px] border-[var(--ispora-border)] rounded-[10px] px-3.5 py-2.5 text-[13px] text-[var(--ispora-text)] outline-none transition-all focus:border-[var(--ispora-brand)] focus:shadow-[0_0_0_3px_rgba(2,31,246,0.07)] placeholder:text-[var(--ispora-text3)]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-1.5">
                  Major
                </label>
                <input
                  type="text"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  placeholder="e.g., Computer Science"
                  className="w-full border-[1.5px] border-[var(--ispora-border)] rounded-[10px] px-3.5 py-2.5 text-[13px] text-[var(--ispora-text)] outline-none transition-all focus:border-[var(--ispora-brand)] focus:shadow-[0_0_0_3px_rgba(2,31,246,0.07)] placeholder:text-[var(--ispora-text3)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-1.5">
                  Year of Study
                </label>
                <select
                  value={yearOfStudy}
                  onChange={(e) => setYearOfStudy(e.target.value)}
                  className="w-full border-[1.5px] border-[var(--ispora-border)] rounded-[10px] px-3.5 py-2.5 text-[13px] text-[var(--ispora-text)] outline-none transition-all focus:border-[var(--ispora-brand)] focus:shadow-[0_0_0_3px_rgba(2,31,246,0.07)] bg-white"
                >
                  <option value="">Select year of study</option>
                  {YEAR_OF_STUDY_OPTIONS.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-1.5">
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Lagos, Nigeria"
                  className="w-full border-[1.5px] border-[var(--ispora-border)] rounded-[10px] px-3.5 py-2.5 text-[13px] text-[var(--ispora-text)] outline-none transition-all focus:border-[var(--ispora-brand)] focus:shadow-[0_0_0_3px_rgba(2,31,246,0.07)] placeholder:text-[var(--ispora-text3)]"
                />
              </div>
            </div>

            <div>
              <MultiSelectWithOther
                label="Career Interests"
                options={CAREER_INTERESTS}
                selectedValues={careerInterests}
                onChange={setCareerInterests}
                placeholder="Select your career interests..."
                maxHeight="300px"
              />
              <p className="text-xs text-[var(--ispora-text3)] mt-1.5">
                Choose areas that align with mentor expertise for better matches
              </p>
            </div>

            <div>
              <MultiSelectWithOther
                label="Industries of Interest"
                options={INDUSTRIES}
                selectedValues={industries}
                onChange={setIndustries}
                placeholder="Select industries you're interested in..."
                maxHeight="300px"
              />
              <p className="text-xs text-[var(--ispora-text3)] mt-1.5">
                This helps match you with mentors from these industries
              </p>
            </div>

            <div>
              <MultiSelectWithOther
                label="Skills"
                options={[]}
                selectedValues={skills}
                onChange={setSkills}
                placeholder="Add your skills (type to add custom skills)..."
                maxHeight="250px"
              />
              <p className="text-xs text-[var(--ispora-text3)] mt-1.5">
                Add both technical and soft skills you have or are learning
              </p>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t-[1.5px] border-[var(--ispora-border)] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 bg-white text-[var(--ispora-text)] border-[1.5px] border-[var(--ispora-border)] rounded-lg text-sm font-semibold hover:bg-[var(--ispora-bg)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--ispora-brand)] text-white rounded-lg text-sm font-semibold hover:bg-[var(--ispora-brand-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}