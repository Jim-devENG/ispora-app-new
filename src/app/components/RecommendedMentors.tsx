import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { Sparkles, MapPin, Briefcase, Star, ChevronLeft, ChevronRight, Users, Send, X } from 'lucide-react';
import { toast } from 'sonner';
import { mockMentors, mockMentorships, mockStudentProfile } from '../data/mockMentors';

interface Mentor {
  id: string;
  firstName: string;
  lastName: string;
  currentRole?: string;
  company?: string;
  location?: string;
  bio?: string;
  expertiseAreas?: string[];
  whatICanHelpWith?: string[];
  profilePicture?: string;
  matchScore?: number;
  currentMentees?: number;
  maxMentees?: number;
  isAvailable?: boolean;
  spotsLeft?: number;
}

interface RecommendedMentorsProps {
  onNavigateToProfile?: () => void;
  onNavigateToFindMentor?: () => void;
}

export default function RecommendedMentors({ onNavigateToProfile, onNavigateToFindMentor }: RecommendedMentorsProps = {}) {
  const { user } = useAuth();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);

  useEffect(() => {
    loadRecommendedMentors();
  }, []);

  const loadRecommendedMentors = async () => {
    try {
      setLoading(true);
      
      // Get current user's profile
      const userProfile = await api.user.getUser(user?.id || '');
      const studentData = userProfile.user || userProfile;
      
      console.log('🎓 Student Profile Data:', {
        careerInterests: studentData.careerInterests,
        lookingFor: studentData.lookingFor,
        industries: studentData.industries,
        major: studentData.major,
      });
      
      // Get all mentors (diaspora professionals)
      const response = await api.user.browseMentors();
      const allMentors = response.mentors || []; // Fixed: backend returns 'mentors' not 'users'
      
      console.log('👨‍🏫 Total mentors found:', allMentors.length);
      
      // If no mentors exist at all, set empty array
      if (allMentors.length === 0) {
        console.log('⚠️ No mentors found in database');
        setMentors([]);
        setLoading(false);
        return;
      }
      
      // Get all mentorships to track mentor capacity
      const mentorshipsResponse = await api.mentorship.getAll();
      const allMentorships = mentorshipsResponse.mentorships || [];
      
      // Identify current mentors for this student (active mentorships)
      const currentMentorIds = new Set<string>();
      allMentorships.forEach((m: any) => {
        if (m.status === 'active' && m.mentorId && m.studentId === user?.id) {
          currentMentorIds.add(m.mentorId);
        }
      });
      
      console.log('🎓 Current Mentors (excluded from recommendations):', Array.from(currentMentorIds));
      
      // Calculate current mentee count for each mentor
      const mentorMenteeCounts = allMentorships.reduce((acc: any, m: any) => {
        if (m.status === 'active' && m.mentorId) {
          acc[m.mentorId] = (acc[m.mentorId] || 0) + 1;
        }
        return acc;
      }, {});
      
      // Calculate match scores and filter by availability
      const scoredMentors = allMentors
        .map((mentor: any) => {
          const score = calculateMatchScore(studentData, mentor);
          const currentMentees = mentorMenteeCounts[mentor.id] || 0;
          const maxMentees = mentor.maxMentees || 5; // Default 5 if not set
          const isAvailable = mentor.availableToMentor !== false && currentMentees < maxMentees;
          const spotsLeft = maxMentees - currentMentees;
          const isCurrentMentor = currentMentorIds.has(mentor.id);
          
          console.log(`Mentor ${mentor.firstName} ${mentor.lastName}: Score ${score}, Available: ${isAvailable}, Spots: ${spotsLeft}/${maxMentees}, IsCurrentMentor: ${isCurrentMentor}`);
          
          return {
            ...mentor,
            matchScore: score,
            currentMentees,
            maxMentees,
            isAvailable,
            spotsLeft,
            isCurrentMentor
          };
        })
        // Filter for available mentors (EXCLUDING CURRENT MENTORS)
        .filter((m: any) => m.isAvailable && !m.isCurrentMentor)
        .sort((a: Mentor, b: Mentor) => (b.matchScore || 0) - (a.matchScore || 0))
        .slice(0, 4); // Top 4 recommendations for homepage
      
      console.log('✅ Recommended mentors (available only):', scoredMentors.length);
      console.log('📊 Top mentor scores:', scoredMentors.map(m => ({ 
        name: `${m.firstName} ${m.lastName}`, 
        score: m.matchScore,
        spotsLeft: (m as any).spotsLeft
      })));
      setMentors(scoredMentors);
    } catch (error: any) {
      console.error('Error loading recommended mentors:', error);
      
      // Use mock data as fallback when backend is unavailable
      const errorMessage = error?.message || '';
      if (errorMessage.includes('Backend service unavailable') || errorMessage.includes('NetworkError')) {
        console.log('🔧 Using mock data for recommendations since backend is unavailable');
        
        const studentData = mockStudentProfile;
        const allMentorships = mockMentorships;
        
        // Identify current mentors for this student (active mentorships)
        const currentMentorIds = new Set<string>();
        allMentorships.forEach((m: any) => {
          if (m.status === 'active' && m.mentorId && m.studentId === user?.id) {
            currentMentorIds.add(m.mentorId);
          }
        });
        
        const mentorMenteeCounts = allMentorships.reduce((acc: any, m: any) => {
          if (m.status === 'active' && m.mentorId) {
            acc[m.mentorId] = (acc[m.mentorId] || 0) + 1;
          }
          return acc;
        }, {});
        
        const scoredMentors = mockMentors
          .map((mentor: any) => {
            const score = calculateMatchScore(studentData, mentor);
            const currentMentees = mentorMenteeCounts[mentor.id] || 0;
            const maxMentees = mentor.maxMentees || 5;
            const isAvailable = mentor.availableToMentor !== false && currentMentees < maxMentees;
            const spotsLeft = maxMentees - currentMentees;
            const isCurrentMentor = currentMentorIds.has(mentor.id);
            
            return {
              ...mentor,
              matchScore: score,
              currentMentees,
              maxMentees,
              isAvailable,
              spotsLeft,
              isCurrentMentor
            };
          })
          .filter((m: any) => m.isAvailable && !m.isCurrentMentor)
          .sort((a: any, b: any) => (b.matchScore || 0) - (a.matchScore || 0))
          .slice(0, 4);
        
        setMentors(scoredMentors);
      } else {
        setMentors([]); // Set empty array on other errors
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateMatchScore = (student: any, mentor: any): number => {
    let score = 0;
    
    // Get student data (ENHANCED FIELDS)
    const studentCareerInterests = student.careerInterests || [];
    const studentLookingFor = student.lookingFor || [];
    const studentIndustries = student.industries || [];
    const studentMajor = student.major?.toLowerCase() || '';
    const studentSkills = student.skills || [];
    const studentLocation = student.location?.toLowerCase() || '';
    const studentUniversity = student.university?.toLowerCase() || '';
    
    // Get mentor data
    const mentorExpertise = mentor.expertiseAreas || [];
    const mentorCanHelp = mentor.whatICanHelpWith || [];
    const mentorIndustries = mentor.industries || [];
    const mentorSkills = mentor.skills || [];
    const mentorLocation = mentor.location?.toLowerCase() || '';
    const mentorEducationInstitution = mentor.educationInstitution?.toLowerCase() || '';
    const mentorLanguages = mentor.languagesSpoken || [];
    
    // BASE SCORE: Give all mentors a base score of 10 to ensure they show up
    // This allows recommendations to work even with minimal student profile data
    score = 10;
    
    // 1. Match student career interests with mentor expertise areas (60 points max)
    // This is now a DIRECT match since both use the same options!
    let careerInterestMatches = 0;
    studentCareerInterests.forEach((interest: string) => {
      if (mentorExpertise.includes(interest)) {
        score += 20; // Very high score for exact match
        careerInterestMatches++;
      } else {
        // Partial match (e.g., "Software Engineering" includes "Software")
        mentorExpertise.forEach((expertise: string) => {
          if (interest.toLowerCase().includes(expertise.toLowerCase()) || 
              expertise.toLowerCase().includes(interest.toLowerCase())) {
            score += 8; // Good score for partial match
            careerInterestMatches++;
          }
        });
      }
    });
    
    // 2. Match student "looking for" with mentor "what I can help with" (50 points max)
    // DIRECT match since both use aligned options!
    let goalMatches = 0;
    studentLookingFor.forEach((goal: string) => {
      if (mentorCanHelp.includes(goal)) {
        score += 15; // Higher score for exact match
        goalMatches++;
      } else {
        // Partial match
        mentorCanHelp.forEach((canHelp: string) => {
          if (goal.toLowerCase().includes(canHelp.toLowerCase()) || 
              canHelp.toLowerCase().includes(goal.toLowerCase())) {
            score += 6;
            goalMatches++;
          }
        });
      }
    });
    
    // 3. Match student industries of interest with mentor industries (40 points max)
    // DIRECT match!
    let industryMatches = 0;
    studentIndustries.forEach((industry: string) => {
      if (mentorIndustries.includes(industry)) {
        score += 13; // Exact match
        industryMatches++;
      } else {
        // Partial industry match
        mentorIndustries.forEach((mentorInd: string) => {
          if (industry.toLowerCase().includes(mentorInd.toLowerCase()) || 
              mentorInd.toLowerCase().includes(industry.toLowerCase())) {
            score += 5;
            industryMatches++;
          }
        });
      }
    });
    
    // 4. Match student skills with mentor skills (30 points max)
    let skillMatches = 0;
    studentSkills.forEach((skill: string) => {
      mentorSkills.forEach((mentorSkill: string) => {
        if (skill.toLowerCase() === mentorSkill.toLowerCase()) {
          score += 10; // Exact skill match
          skillMatches++;
        } else if (skill.toLowerCase().includes(mentorSkill.toLowerCase()) || 
                   mentorSkill.toLowerCase().includes(skill.toLowerCase())) {
          score += 4; // Partial skill match
          skillMatches++;
        }
      });
    });
    
    // 5. Match student major with mentor expertise (25 points max)
    if (studentMajor) {
      mentorExpertise.forEach((expertise: string) => {
        if (studentMajor.includes(expertise.toLowerCase()) || 
            expertise.toLowerCase().includes(studentMajor)) {
          score += 12;
        }
      });
      
      // Also check mentor's current role/title
      if (mentor.currentRole && mentor.currentRole.toLowerCase().includes(studentMajor)) {
        score += 8;
      }
    }
    
    // 6. Location proximity bonus (20 points max)
    if (studentLocation && mentorLocation) {
      // Same city/country
      if (studentLocation === mentorLocation) {
        score += 20;
      } else if (studentLocation.includes(mentorLocation) || mentorLocation.includes(studentLocation)) {
        score += 10;
      }
      // Both in Nigeria bonus
      else if ((studentLocation.includes('nigeria') || studentLocation.includes('lagos') || 
                studentLocation.includes('abuja')) && 
               (mentorLocation.includes('nigeria') || mentorLocation.includes('lagos') || 
                mentorLocation.includes('abuja'))) {
        score += 15;
      }
    }
    
    // 7. University/Institution connection (15 points)
    if (studentUniversity && mentorEducationInstitution) {
      if (studentUniversity === mentorEducationInstitution) {
        score += 15; // Same university - strong connection!
      } else if (studentUniversity.includes(mentorEducationInstitution) || 
                 mentorEducationInstitution.includes(studentUniversity)) {
        score += 8;
      }
    }
    
    // 8. Bonus for mentors with Nigerian connections (15 points)
    if (mentor.nigerianConnections && mentor.nigerianConnections.length > 0) {
      score += 15;
    }
    
    // 9. Bonus for mentors with detailed profiles (15 points)
    if (mentor.bio && mentor.bio.length > 100) {
      score += 8;
    }
    if ((mentor.expertiseAreas?.length || 0) >= 3) {
      score += 7;
    }
    
    // 10. Experience level bonus (10 points)
    if (mentor.yearsOfExperience) {
      const years = parseInt(mentor.yearsOfExperience);
      if (!isNaN(years) && years >= 5) {
        score += 10;
      } else if (!isNaN(years) && years >= 2) {
        score += 5;
      }
    }
    
    // 11. Availability bonus (10 points)
    if (mentor.availableToMentor) {
      score += 10;
    }
    
    // 12. Multiple languages bonus (5 points)
    if (mentorLanguages && mentorLanguages.length > 1) {
      score += 5;
    }
    
    // 13. Boost score if there are multiple category matches (synergy bonus)
    const categoryMatches = [
      careerInterestMatches > 0,
      goalMatches > 0,
      industryMatches > 0,
      skillMatches > 0
    ].filter(Boolean).length;
    
    if (categoryMatches >= 3) {
      score += 20; // Strong multi-dimensional match
    } else if (categoryMatches >= 2) {
      score += 10;
    }
    
    return score;
  };

  const handleNext = () => {
    if (currentIndex < mentors.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleViewProfile = (mentorId: string) => {
    if (onNavigateToProfile) {
      onNavigateToProfile();
    } else {
      window.open(`/browse/${mentorId}`, '_blank');
    }
  };

  const handleRequestMentor = (mentor: Mentor) => {
    setSelectedMentor(mentor);
    const defaultMessage = `Hi ${mentor.firstName},\n\nI came across your profile on Ispora and I'm really impressed by your background${mentor.company ? ` at ${mentor.company}` : ''}. I would love to connect with you for mentorship guidance.\n\n${mentor.whatICanHelpWith && mentor.whatICanHelpWith.length > 0 ? `I'm particularly interested in ${mentor.whatICanHelpWith[0]}.` : ''}\n\nLooking forward to hearing from you!`;
    setRequestMessage(defaultMessage);
    setShowRequestModal(true);
  };

  const handleSendMessage = async () => {
    if (!selectedMentor || !requestMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setSendingRequest(true);
    try {
      await api.request.create({
        mentorId: selectedMentor.id,
        message: requestMessage
      });
      toast.success('Mentorship request sent successfully!');
      setShowRequestModal(false);
      setRequestMessage('');
    } catch (error) {
      console.error('Error sending mentorship request:', error);
      toast.error('Failed to send request. Please try again.');
    } finally {
      setSendingRequest(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border-[1.5px] border-[var(--ispora-border)] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-syne text-sm font-bold text-[var(--ispora-text)]">
            Recommended for You
          </h3>
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-32 bg-[var(--ispora-bg)] rounded-xl" />
          <div className="h-32 bg-[var(--ispora-bg)] rounded-xl" />
          <div className="h-32 bg-[var(--ispora-bg)] rounded-xl" />
        </div>
      </div>
    );
  }

  if (mentors.length === 0) {
    return (
      <div className="bg-white border-[1.5px] border-[var(--ispora-border)] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-syne text-sm font-bold text-[var(--ispora-text)]">
            Recommended for You
          </h3>
        </div>
        <div className="text-center py-8 px-4">
          <div className="w-16 h-16 rounded-full bg-[var(--ispora-bg)] flex items-center justify-center mx-auto mb-3">
            <Users className="w-8 h-8 text-[var(--ispora-text3)]" />
          </div>
          <p className="text-sm font-semibold text-[var(--ispora-text)] mb-2">
            No Mentors Available Yet
          </p>
          <p className="text-xs text-[var(--ispora-text3)] mb-4">
            We're actively onboarding mentors. Check back soon or browse all available mentors in the Find Mentor section.
          </p>
          <button
            onClick={() => window.open('/app?page=find-mentor', '_blank')}
            className="px-4 py-2 bg-[var(--ispora-brand)] text-white text-xs font-semibold rounded-lg hover:bg-[var(--ispora-brand-hover)] transition-colors"
          >
            Browse Mentors
          </button>
        </div>
      </div>
    );
  }

  const visibleMentors = mentors.slice(currentIndex, currentIndex + 1); // Changed from 2 to 1

  return (
    <div className="bg-white border-[1.5px] border-[var(--ispora-border)] rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b-[1.5px] border-[var(--ispora-border)] flex items-center justify-between">
        <div>
          <h3 className="font-syne text-sm font-bold text-[var(--ispora-text)]">
            Recommended for You
          </h3>
          <p className="text-[11px] text-[var(--ispora-text3)]">
            Based on your interests and goals
          </p>
        </div>
        
        {mentors.length > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="w-7 h-7 rounded-lg border-[1.5px] border-[var(--ispora-border)] flex items-center justify-center hover:bg-[var(--ispora-bg)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4 text-[var(--ispora-text2)]" />
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex >= mentors.length - 1}
              className="w-7 h-7 rounded-lg border-[1.5px] border-[var(--ispora-border)] flex items-center justify-center hover:bg-[var(--ispora-bg)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4 text-[var(--ispora-text2)]" />
            </button>
          </div>
        )}
      </div>

      <div className="p-4 space-y-3">
        {visibleMentors.map((mentor) => {
          const initials = `${mentor.firstName?.[0] || ''}${mentor.lastName?.[0] || ''}`.toUpperCase();
          const matchPercentage = Math.min(100, Math.round((mentor.matchScore || 0) / 1.2));
          const offeringText = mentor.whatICanHelpWith && mentor.whatICanHelpWith.length > 0
            ? mentor.whatICanHelpWith.join(', ')
            : 'General mentorship guidance';
          
          // Determine if mentor is home-based or diaspora based on location
          const isHomeBased = mentor.location && (
            mentor.location.toLowerCase().includes('nigeria') ||
            mentor.location.toLowerCase().includes('lagos') ||
            mentor.location.toLowerCase().includes('abuja') ||
            mentor.location.toLowerCase().includes('ibadan') ||
            mentor.location.toLowerCase().includes('port harcourt') ||
            mentor.location.toLowerCase().includes('kano')
          );
          const mentorType = isHomeBased ? 'Home-based' : 'Diaspora Mentor';
          
          return (
            <div
              key={mentor.id}
              className="relative border-[1.5px] border-[var(--ispora-border)] rounded-xl p-3.5 hover:border-[var(--ispora-brand)] hover:shadow-md transition-all"
            >
              {/* Match Badge - No Icon */}
              <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full shadow-sm">
                <span className="text-[9px] font-bold text-white">{matchPercentage}% Match</span>
              </div>

              <div className="flex gap-2.5 mb-3">
                {/* Smaller Avatar */}
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--ispora-brand)] to-[#1a35f8] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                  {mentor.profilePicture ? (
                    <img src={mentor.profilePicture} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-12">
                  <h4 className="font-semibold text-xs text-[var(--ispora-text)] mb-0.5 truncate">
                    {mentor.firstName} {mentor.lastName}
                  </h4>
                  
                  {mentor.currentRole && (
                    <div className="flex items-start gap-1.5 text-[11px] text-[var(--ispora-text2)] mb-1">
                      <Briefcase className="w-3 h-3 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-1">
                        {mentor.currentRole}
                        {mentor.company && ` at ${mentor.company}`}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-[11px] text-[var(--ispora-text3)]">
                    {mentor.location && (
                      <>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="whitespace-nowrap">{mentor.location}</span>
                        </div>
                        <span className="text-[var(--ispora-border)] flex-shrink-0">•</span>
                      </>
                    )}
                    <span className={`font-medium whitespace-nowrap ${isHomeBased ? 'text-green-600' : 'text-blue-600'}`}>
                      {mentorType}
                    </span>
                  </div>
                </div>
              </div>

              {/* Offering mentorship text */}
              <div className="mb-3 pl-0.5">
                <p className="text-[11px] text-[var(--ispora-text2)] leading-relaxed line-clamp-3">
                  <span className="font-medium text-[var(--ispora-text)]">Offering mentorship in:</span>
                  {' '}{offeringText}
                </p>
              </div>

              {/* Action Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRequestMentor(mentor);
                }}
                className="w-full px-3 py-2 bg-[var(--ispora-brand)] text-white text-[11px] font-semibold rounded-lg hover:bg-[var(--ispora-brand-hover)] transition-colors flex items-center justify-center gap-1.5"
              >
                <Send className="w-3 h-3" strokeWidth={2.5} />
                Request Mentorship
              </button>
            </div>
          );
        })}
      </div>

      {mentors.length > 0 && (
        <div className="px-5 py-3 border-t-[1.5px] border-[var(--ispora-border)] bg-[var(--ispora-bg)]">
          <button
            onClick={() => {
              if (onNavigateToFindMentor) {
                onNavigateToFindMentor();
              } else {
                window.open('/app?page=find-mentor', '_blank');
              }
            }}
            className="w-full text-center text-xs font-semibold text-[var(--ispora-brand)] hover:text-[#1a35f8] transition-colors"
          >
            View All Mentors →
          </button>
        </div>
      )}

      {/* Request Mentor Modal */}
      {showRequestModal && selectedMentor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-[300px] max-w-[90%]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-syne text-sm font-bold text-[var(--ispora-text)]">
                Request Mentor
              </h3>
              <button
                onClick={() => setShowRequestModal(false)}
                className="w-5 h-5 rounded-full bg-[var(--ispora-bg)] flex items-center justify-center hover:bg-[var(--ispora-border)] transition-colors"
              >
                <X className="w-4 h-4 text-[var(--ispora-text2)]" />
              </button>
            </div>
            <p className="text-xs text-[var(--ispora-text3)] mb-4">
              Send a message to {selectedMentor.firstName} {selectedMentor.lastName} to request a mentorship.
            </p>
            <textarea
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              placeholder="Enter your message here..."
              className="w-full h-20 p-2 border-[1.5px] border-[var(--ispora-border)] rounded-lg mb-4 resize-none"
            />
            <button
              onClick={handleSendMessage}
              disabled={sendingRequest}
              className="w-full text-center text-xs font-semibold text-[var(--ispora-brand)] hover:text-[#1a35f8] transition-colors"
            >
              {sendingRequest ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}