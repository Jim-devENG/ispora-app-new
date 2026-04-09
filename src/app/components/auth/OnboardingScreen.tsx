import { useState } from 'react';
import { Check, Phone } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole, Screen } from '../AuthFlow';
import { 
  EXPERTISE_AREAS, 
  WHAT_I_CAN_HELP_WITH, 
  CAREER_INTERESTS, 
  LEARNING_GOALS, 
  INDUSTRIES 
} from '../../constants/profileOptions';
import MultiSelectWithOther from '../MultiSelectWithOther';

interface OnboardingScreenProps {
  selectedRole: UserRole;
  firstName: string;
  onNavigate: (screen: Screen) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function OnboardingScreen({
  selectedRole,
  firstName,
  onNavigate,
  showToast,
}: OnboardingScreenProps) {
  const { updateProfile, user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Use firstName from props or user object
  const displayName = firstName || user?.firstName || 'there';
  
  // Common fields
  const [phoneNumber, setPhoneNumber] = useState('');
  
  // Diaspora fields - NEW
  const [location, setLocation] = useState('');
  const [currentRole, setCurrentRole] = useState('');
  const [company, setCompany] = useState('');
  const [bio, setBio] = useState('');
  const [expertiseAreas, setExpertiseAreas] = useState<string[]>([]);
  const [whatICanHelpWith, setWhatICanHelpWith] = useState<string[]>([]);

  // Student fields
  const [university, setUniversity] = useState('');
  const [course, setCourse] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');
  const [locationStudent, setLocationStudent] = useState('');
  const [careerInterests, setCareerInterests] = useState<string[]>([]);
  const [lookingFor, setLookingFor] = useState<string[]>([]);
  const [industriesOfInterest, setIndustriesOfInterest] = useState<string[]>([]);
  const [bioStudent, setBioStudent] = useState('');
  const [shortTermGoals, setShortTermGoals] = useState('');
  const [longTermGoals, setLongTermGoals] = useState('');

  const studentInterests = [
    'Career guidance',
    'Technical skills',
    'International jobs',
    'Startup advice',
    'Postgrad applications',
    'Industry insights',
  ];

  // Top essential options for quick onboarding
  const topExpertiseAreas = [
    'Software Engineering',
    'Product Management',
    'Data Science & Analytics',
    'Finance & Investment Banking',
    'Consulting (Strategy & Management)',
    'Marketing & Growth',
    'Entrepreneurship & Startups',
    'UX/UI Design',
  ];

  const topHelpWithOptions = [
    'Career planning & goal setting',
    'Resume/CV review & optimization',
    'Interview preparation (technical)',
    'Interview preparation (behavioral)',
    'Networking strategies',
    'Breaking into FAANG/Big Tech',
    'Study abroad guidance',
    'Salary negotiation',
  ];

  const toggleExpertise = (item: string) => {
    setExpertiseAreas((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const toggleHelpWith = (item: string) => {
    setWhatICanHelpWith((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const toggleSelection = (item: string, isDiaspora: boolean) => {
    setInterests((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    const profileData = selectedRole === 'diaspora'
      ? { 
          location,
          currentRole, 
          company,
          bio,
          expertiseAreas,
          whatICanHelpWith,
          phoneNumber 
        }
      : { 
          university, 
          major: course, // Map course to major
          yearOfStudy, 
          careerInterests,
          lookingFor,
          industries: industriesOfInterest,
          bio: bioStudent,
          shortTermGoals,
          longTermGoals,
          phoneNumber,
          location: locationStudent
        };

    try {
      const result = await updateProfile(profileData);
      
      if (result.success) {
        showToast('Profile updated successfully!', 'success');
        onNavigate('success');
      } else {
        showToast(result.error || 'Failed to update profile', 'error');
      }
    } catch (error: any) {
      showToast(error.message || 'An error occurred', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    showToast('You can complete your profile later', 'info');
    onNavigate('success');
  };

  return (
    <div className="flex flex-col min-h-full px-12 py-10">
      <div className="flex items-center justify-end mb-9 flex-shrink-0">
        <div className="text-[13px] text-[var(--ispora-text3)]">
          Step 3 of 3
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-[400px] w-full mx-auto">
        <div className="flex justify-between items-center mb-5">
          <div>
            <div className="font-syne text-2xl font-extrabold text-[var(--ispora-text)] mb-1 tracking-tight">
              {selectedRole === 'diaspora' ? 'Your mentor profile' : 'Your youth profile'}
            </div>
            <div className="text-[13px] text-[var(--ispora-text3)]">
              {selectedRole === 'diaspora'
                ? 'Help youth discover you'
                : 'Help mentors find and connect with you'}
            </div>
          </div>
          <div className="flex gap-1.5">
            <div className="w-7 h-[5px] rounded bg-[var(--ispora-success)]" />
            <div className="w-7 h-[5px] rounded bg-[var(--ispora-success)]" />
            <div className="w-7 h-[5px] rounded bg-[var(--ispora-brand)]" />
          </div>
        </div>

        {selectedRole === 'diaspora' ? (
          <div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--ispora-text2)] mb-1.5">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. United Kingdom"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full border-[1.5px] border-[var(--ispora-border)] rounded-[11px] px-3.5 py-3 text-[13px] text-[var(--ispora-text)] bg-white outline-none transition-all focus:border-[var(--ispora-brand)] focus:shadow-[0_0_0_3px_rgba(2,31,246,0.08)]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--ispora-text2)] mb-1.5">
                  Current role
                </label>
                <input
                  type="text"
                  placeholder="e.g. Senior Software Engineer at Barclays"
                  value={currentRole}
                  onChange={(e) => setCurrentRole(e.target.value)}
                  className="w-full border-[1.5px] border-[var(--ispora-border)] rounded-[11px] px-3.5 py-3 text-[13px] text-[var(--ispora-text)] bg-white outline-none transition-all focus:border-[var(--ispora-brand)] focus:shadow-[0_0_0_3px_rgba(2,31,246,0.08)]"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-[var(--ispora-text2)] mb-1.5">
                Company
              </label>
              <input
                type="text"
                placeholder="e.g. Barclays"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full border-[1.5px] border-[var(--ispora-border)] rounded-[11px] px-3.5 py-3 text-[13px] text-[var(--ispora-text)] bg-white outline-none transition-all focus:border-[var(--ispora-brand)] focus:shadow-[0_0_0_3px_rgba(2,31,246,0.08)]"
              />
            </div>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-[var(--ispora-text2)] mb-1.5">
                Bio
              </label>
              <textarea
                placeholder="Tell us about yourself"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full border-[1.5px] border-[var(--ispora-border)] rounded-[11px] px-3.5 py-3 text-[13px] text-[var(--ispora-text)] bg-white outline-none transition-all focus:border-[var(--ispora-brand)] focus:shadow-[0_0_0_3px_rgba(2,31,246,0.08)]"
              />
            </div>
            <div className="mb-4">
              <MultiSelectWithOther
                label="Expertise Areas"
                options={EXPERTISE_AREAS}
                selectedValues={expertiseAreas}
                onChange={setExpertiseAreas}
                placeholder="Select your expertise areas..."
              />
            </div>
            <div className="mb-4">
              <MultiSelectWithOther
                label="What can you offer mentees?"
                options={WHAT_I_CAN_HELP_WITH}
                selectedValues={whatICanHelpWith}
                onChange={setWhatICanHelpWith}
                placeholder="Select what you can help with..."
              />
            </div>
          </div>
        ) : (
          <div>
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--ispora-text2)] mb-1.5">
                  University
                </label>
                <input
                  type="text"
                  placeholder="e.g. University of Lagos"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  className="w-full border-[1.5px] border-[var(--ispora-border)] rounded-[11px] px-3.5 py-3 text-[13px] text-[var(--ispora-text)] bg-white outline-none transition-all focus:border-[var(--ispora-brand)] focus:shadow-[0_0_0_3px_rgba(2,31,246,0.08)]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--ispora-text2)] mb-1.5">
                  Course of study
                </label>
                <input
                  type="text"
                  placeholder="e.g. Computer Science"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  className="w-full border-[1.5px] border-[var(--ispora-border)] rounded-[11px] px-3.5 py-3 text-[13px] text-[var(--ispora-text)] bg-white outline-none transition-all focus:border-[var(--ispora-brand)] focus:shadow-[0_0_0_3px_rgba(2,31,246,0.08)]"
                />
              </div>
            </div>
            
            {/* Year of Study */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-[var(--ispora-text2)] mb-1.5">
                Year of study
              </label>
              <select
                value={yearOfStudy}
                onChange={(e) => setYearOfStudy(e.target.value)}
                className="w-full border-[1.5px] border-[var(--ispora-border)] rounded-[11px] px-3.5 py-3 text-[13px] text-[var(--ispora-text)] bg-white outline-none transition-all focus:border-[var(--ispora-brand)] focus:shadow-[0_0_0_3px_rgba(2,31,246,0.08)]"
              >
                <option value="">Select year</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
                <option value="Final Year">Final Year</option>
                <option value="Graduate">Graduate</option>
              </select>
            </div>

            {/* Location */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-[var(--ispora-text2)] mb-1.5">
                Location
              </label>
              <input
                type="text"
                placeholder="e.g. Lagos, Nigeria"
                value={locationStudent}
                onChange={(e) => setLocationStudent(e.target.value)}
                className="w-full border-[1.5px] border-[var(--ispora-border)] rounded-[11px] px-3.5 py-3 text-[13px] text-[var(--ispora-text)] bg-white outline-none transition-all focus:border-[var(--ispora-brand)] focus:shadow-[0_0_0_3px_rgba(2,31,246,0.08)]"
              />
            </div>

            {/* Career Interests (aligned with mentor expertise) */}
            <div className="mb-4">
              <MultiSelectWithOther
                label="Career Interests"
                options={CAREER_INTERESTS}
                selectedValues={careerInterests}
                onChange={setCareerInterests}
                placeholder="Select fields you're interested in..."
              />
            </div>

            {/* What I'm Looking For (aligned with mentor offerings) */}
            <div className="mb-4">
              <MultiSelectWithOther
                label="What I'm Looking For"
                options={LEARNING_GOALS}
                selectedValues={lookingFor}
                onChange={setLookingFor}
                placeholder="Select what you want help with..."
              />
            </div>

            {/* Industries of Interest */}
            <div className="mb-4">
              <MultiSelectWithOther
                label="Industries of Interest"
                options={INDUSTRIES}
                selectedValues={industriesOfInterest}
                onChange={setIndustriesOfInterest}
                placeholder="Select industries you want to work in..."
              />
            </div>

            {/* Bio */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-[var(--ispora-text2)] mb-1.5">
                Bio (Optional)
              </label>
              <textarea
                placeholder="Tell us a bit about yourself..."
                value={bioStudent}
                onChange={(e) => setBioStudent(e.target.value)}
                rows={3}
                className="w-full border-[1.5px] border-[var(--ispora-border)] rounded-[11px] px-3.5 py-3 text-[13px] text-[var(--ispora-text)] bg-white outline-none transition-all focus:border-[var(--ispora-brand)] focus:shadow-[0_0_0_3px_rgba(2,31,246,0.08)] resize-none"
              />
            </div>

            {/* Goals */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--ispora-text2)] mb-1.5">
                  Short-term goals (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Land an internship"
                  value={shortTermGoals}
                  onChange={(e) => setShortTermGoals(e.target.value)}
                  className="w-full border-[1.5px] border-[var(--ispora-border)] rounded-[11px] px-3.5 py-3 text-[13px] text-[var(--ispora-text)] bg-white outline-none transition-all focus:border-[var(--ispora-brand)] focus:shadow-[0_0_0_3px_rgba(2,31,246,0.08)]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--ispora-text2)] mb-1.5">
                  Long-term goals (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Work at FAANG"
                  value={longTermGoals}
                  onChange={(e) => setLongTermGoals(e.target.value)}
                  className="w-full border-[1.5px] border-[var(--ispora-border)] rounded-[11px] px-3.5 py-3 text-[13px] text-[var(--ispora-text)] bg-white outline-none transition-all focus:border-[var(--ispora-brand)] focus:shadow-[0_0_0_3px_rgba(2,31,246,0.08)]"
                />
              </div>
            </div>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-xs font-semibold text-[var(--ispora-text2)] mb-1.5">
            Phone number
          </label>
          <input
            type="tel"
            placeholder="e.g. +1234567890"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full border-[1.5px] border-[var(--ispora-border)] rounded-[11px] px-3.5 py-3 text-[13px] text-[var(--ispora-text)] bg-white outline-none transition-all focus:border-[var(--ispora-brand)] focus:shadow-[0_0_0_3px_rgba(2,31,246,0.08)]"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-[11px] bg-[var(--ispora-brand)] text-white text-sm font-bold cursor-pointer transition-all hover:bg-[var(--ispora-brand-hover)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(2,31,246,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
        >
          {loading ? 'Saving...' : 'Complete Setup'}
          <Check className="w-4 h-4" strokeWidth={2.5} />
        </button>

        <button
          onClick={handleSkip}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-[11px] bg-white text-[var(--ispora-text)] text-[13px] font-semibold cursor-pointer transition-all border-[1.5px] border-[var(--ispora-border)] hover:border-[var(--ispora-brand)] hover:text-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] mt-2.5"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}