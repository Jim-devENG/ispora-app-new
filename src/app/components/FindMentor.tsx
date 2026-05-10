import { useState, useEffect } from 'react';
import { Search, MapPin, Briefcase, Users, Star, Clock, Heart, X, Send, CheckCircle, Loader2, CheckCircle2, Globe, Linkedin, Mail, Phone, Flag, GraduationCap, Languages as LanguagesIcon, Target, Lightbulb } from 'lucide-react';
import api, { userApi, requestApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { EXPERTISE_AREAS, INDUSTRIES, WHAT_I_CAN_HELP_WITH } from '../constants/profileOptions';
import { mockMentors, mockMentorships, mockStudentProfile } from '../data/mockMentors';

interface Mentor {
  id: string;
  firstName: string;
  lastName: string;
  mentorType?: 'diaspora' | 'home';
  title?: string;
  currentRole?: string;
  company?: string;
  location?: string;
  industry?: string;
  yearsOfExperience?: string;
  skills?: string[];
  offers?: string[];
  bio?: string;
  availableToMentor?: boolean;
  // Additional fields
  displayName?: string;
  avatar?: string;
  phone?: string;
  countryOfOrigin?: string;
  linkedIn?: string;
  website?: string;
  jobTitle?: string;
  expertise?: string[];
  mentorshipAreas?: string[];
  maxMentees?: number;
  acceptingMentees?: boolean;
  email?: string;
  
  // NEW: Enhanced fields
  expertiseAreas?: string[];
  whatICanHelpWith?: string[];
  industriesWorkedIn?: string[];
  languagesSpoken?: string[];
  availabilityHoursPerMonth?: number;
  preferredMenteeLevel?: string[];
  
  // Recommendation fields
  matchScore?: number;
  isRecommended?: boolean;
  // Availability tracking
  currentMentees?: number;
  isAvailable?: boolean;
  spotsLeft?: number;
  // Current mentor tracking
  isCurrentMentor?: boolean;
}

// Calculate match score between student and mentor
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
  
  // BASE SCORE: Give all mentors a base score of 10
  score = 10;
  
  // 1. Match student career interests with mentor expertise areas (60 points max)
  let careerInterestMatches = 0;
  studentCareerInterests.forEach((interest: string) => {
    if (mentorExpertise.includes(interest)) {
      score += 20;
      careerInterestMatches++;
    } else {
      mentorExpertise.forEach((expertise: string) => {
        if (interest.toLowerCase().includes(expertise.toLowerCase()) || 
            expertise.toLowerCase().includes(interest.toLowerCase())) {
          score += 8;
          careerInterestMatches++;
        }
      });
    }
  });
  
  // 2. Match student "looking for" with mentor "what I can help with" (50 points max)
  let goalMatches = 0;
  studentLookingFor.forEach((goal: string) => {
    if (mentorCanHelp.includes(goal)) {
      score += 15;
      goalMatches++;
    } else {
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
  let industryMatches = 0;
  studentIndustries.forEach((industry: string) => {
    if (mentorIndustries.includes(industry)) {
      score += 13;
      industryMatches++;
    } else {
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
        score += 10;
        skillMatches++;
      } else if (skill.toLowerCase().includes(mentorSkill.toLowerCase()) || 
                 mentorSkill.toLowerCase().includes(skill.toLowerCase())) {
        score += 4;
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
    
    if (mentor.currentRole && mentor.currentRole.toLowerCase().includes(studentMajor)) {
      score += 8;
    }
  }
  
  // 6. Location proximity bonus (20 points max)
  if (studentLocation && mentorLocation) {
    if (studentLocation === mentorLocation) {
      score += 20;
    } else if (studentLocation.includes(mentorLocation) || mentorLocation.includes(studentLocation)) {
      score += 10;
    } else if ((studentLocation.includes('nigeria') || studentLocation.includes('lagos') || 
                studentLocation.includes('abuja')) && 
               (mentorLocation.includes('nigeria') || mentorLocation.includes('lagos') || 
                mentorLocation.includes('abuja'))) {
      score += 15;
    }
  }
  
  // 7. University/Institution connection (15 points)
  if (studentUniversity && mentorEducationInstitution) {
    if (studentUniversity === mentorEducationInstitution) {
      score += 15;
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
    score += 20;
  } else if (categoryMatches >= 2) {
    score += 10;
  }
  
  return score;
};

export default function FindMentor() {
  const { user } = useAuth();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [filteredMentors, setFilteredMentors] = useState<Mentor[]>([]);
  const [mentorships, setMentorships] = useState<any[]>([]);
  const [currentMentorIds, setCurrentMentorIds] = useState<Set<string>>(new Set()); // Track current mentors
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterField, setFilterField] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [filterExp, setFilterExp] = useState('');
  const [filterAvail, setFilterAvail] = useState('');
  
  // NEW: Enhanced filters
  const [filterExpertise, setFilterExpertise] = useState('');
  const [filterIndustry, setFilterIndustry] = useState('');
  
  const [savedMentors, setSavedMentors] = useState<Set<string>>(new Set());
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Fetch all mentors and mentorships
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setApiError(null);
        const [mentorsResponse, mentorshipsResponse, userProfile]: any = await Promise.all([
          userApi.getAll({ role: 'diaspora' }),
          api.mentorship.getAll(),
          userApi.getUser(user?.id || '')
        ]);
        
        if (mentorsResponse.users) {
          const studentData = userProfile.user || userProfile;
          
          // Get all mentorships to track mentor capacity
          const allMentorships = mentorshipsResponse.mentorships || [];
          
          // Identify current mentors for this student (active mentorships)
          const currentMentorIdSet = new Set<string>();
          allMentorships.forEach((m: any) => {
            if (m.status === 'active' && m.mentorId && m.studentId === user?.id) {
              currentMentorIdSet.add(m.mentorId);
            }
          });
          setCurrentMentorIds(currentMentorIdSet);
          
          console.log('🎓 Current Mentors for this student:', Array.from(currentMentorIdSet));
          
          // Calculate current mentee count for each mentor
          const mentorMenteeCounts = allMentorships.reduce((acc: any, m: any) => {
            if (m.status === 'active' && m.mentorId) {
              acc[m.mentorId] = (acc[m.mentorId] || 0) + 1;
            }
            return acc;
          }, {});
          
          // Calculate match scores for all mentors
          const mentorsWithScores = mentorsResponse.users.map((mentor: Mentor) => {
            const score = calculateMatchScore(studentData, mentor);
            const matchPercentage = Math.min(100, Math.round(score / 1.2));
            const isRecommended = matchPercentage >= 25; // 25% threshold
            
            const currentMentees = mentorMenteeCounts[mentor.id] || 0;
            const maxMentees = mentor.maxMentees || 5; // Default 5 if not set
            const isAvailable = mentor.availableToMentor !== false && currentMentees < maxMentees;
            const spotsLeft = maxMentees - currentMentees;
            const isCurrentMentor = currentMentorIdSet.has(mentor.id);
            
            return {
              ...mentor,
              matchScore: score,
              isRecommended,
              currentMentees,
              maxMentees,
              isAvailable,
              spotsLeft,
              isCurrentMentor
            };
          });
          
          // Sort by score descending to get top recommendations
          const sortedByScore = mentorsWithScores.sort((a: Mentor, b: Mentor) => 
            (b.matchScore || 0) - (a.matchScore || 0)
          );
          
          // Get top 4 AVAILABLE mentors (EXCLUDING CURRENT MENTORS)
          // This ensures we always show 4 recommendations if there are 4+ available mentors
          const recommendedMentors = sortedByScore
            .filter((m: Mentor) => m.isAvailable && !m.isCurrentMentor)
            .slice(0, 4);
          
          // Mark only top 4 available (non-current) as recommended
          const recommendedIds = new Set(recommendedMentors.map((m: Mentor) => m.id));
          
          console.log('🎯 Recommended Mentors (top 4 available, excluding current):', recommendedMentors.map(m => ({
            name: `${m.firstName} ${m.lastName}`,
            score: m.matchScore,
            available: m.isAvailable,
            spots: m.spotsLeft,
            isCurrentMentor: m.isCurrentMentor
          })));
          
          const finalMentors = sortedByScore.map((mentor: Mentor) => ({
            ...mentor,
            isRecommended: recommendedIds.has(mentor.id)
          }));
          
          // Sort: Recommended mentors (top 4 available) first, then others by availability, then alphabetically
          const sortedMentors = finalMentors.sort((a: Mentor, b: Mentor) => {
            if (a.isRecommended && !b.isRecommended) return -1;
            if (!a.isRecommended && b.isRecommended) return 1;
            if (a.isRecommended && b.isRecommended) {
              return (b.matchScore || 0) - (a.matchScore || 0);
            }
            // Among non-recommended, show available first
            if (a.isAvailable && !b.isAvailable) return -1;
            if (!a.isAvailable && b.isAvailable) return 1;
            return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
          });
          
          setMentors(sortedMentors);
          setFilteredMentors(sortedMentors);
        }
        
        setMentorships(mentorshipsResponse.mentorships || []);
      } catch (err: any) {
        console.error('Error fetching data:', err);
        const errorMessage = err?.message || 'Failed to load mentors';
        
        // Use mock data as fallback when backend is unavailable
        if (errorMessage.includes('Backend service unavailable') || errorMessage.includes('NetworkError')) {
          console.log('🔧 Using mock data since backend is unavailable');
          
          const studentData = mockStudentProfile;
          
          const allMentorships = mockMentorships;
          
          // Identify current mentors for this student (active mentorships)
          const currentMentorIdSet = new Set<string>();
          allMentorships.forEach((m: any) => {
            if (m.status === 'active' && m.mentorId && m.studentId === user?.id) {
              currentMentorIdSet.add(m.mentorId);
            }
          });
          setCurrentMentorIds(currentMentorIdSet);
          
          const mentorMenteeCounts = allMentorships.reduce((acc: any, m: any) => {
            if (m.status === 'active' && m.mentorId) {
              acc[m.mentorId] = (acc[m.mentorId] || 0) + 1;
            }
            return acc;
          }, {});
          
          const mentorsWithScores = mockMentors.map((mentor: any) => {
            const score = calculateMatchScore(studentData, mentor);
            const matchPercentage = Math.min(100, Math.round(score / 1.2));
            const isRecommended = matchPercentage >= 25;
            
            const currentMentees = mentorMenteeCounts[mentor.id] || 0;
            const maxMentees = mentor.maxMentees || 5;
            const isAvailable = mentor.availableToMentor !== false && currentMentees < maxMentees;
            const spotsLeft = maxMentees - currentMentees;
            const isCurrentMentor = currentMentorIdSet.has(mentor.id);
            
            return {
              ...mentor,
              matchScore: score,
              isRecommended,
              currentMentees,
              maxMentees,
              isAvailable,
              spotsLeft,
              isCurrentMentor
            };
          });
          
          const sortedByScore = mentorsWithScores.sort((a: any, b: any) => 
            (b.matchScore || 0) - (a.matchScore || 0)
          );
          
          const recommendedMentors = sortedByScore
            .filter((m: any) => m.isAvailable && !m.isCurrentMentor)
            .slice(0, 4);
          
          const recommendedIds = new Set(recommendedMentors.map((m: any) => m.id));
          
          const finalMentors = sortedByScore.map((mentor: any) => ({
            ...mentor,
            isRecommended: recommendedIds.has(mentor.id)
          }));
          
          const sortedMentors = finalMentors.sort((a: any, b: any) => {
            if (a.isRecommended && !b.isRecommended) return -1;
            if (!a.isRecommended && b.isRecommended) return 1;
            if (a.isRecommended && b.isRecommended) {
              return (b.matchScore || 0) - (a.matchScore || 0);
            }
            if (a.isAvailable && !b.isAvailable) return -1;
            if (!a.isAvailable && b.isAvailable) return 1;
            return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
          });
          
          setMentors(sortedMentors);
          setFilteredMentors(sortedMentors);
          setMentorships(mockMentorships);
          
          toast.info('Using demo data - backend is not connected', { duration: 3000 });
        } else {
          setApiError(errorMessage);
          toast.error(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  // Apply filters
  useEffect(() => {
    let filtered = [...mentors];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m =>
        `${m.firstName} ${m.lastName}`.toLowerCase().includes(query) ||
        m.currentRole?.toLowerCase().includes(query) ||
        m.company?.toLowerCase().includes(query) ||
        m.industry?.toLowerCase().includes(query) ||
        m.skills?.some(s => s.toLowerCase().includes(query))
      );
    }

    // Field filter
    if (filterField) {
      filtered = filtered.filter(m =>
        m.industry?.toLowerCase().includes(filterField.toLowerCase()) ||
        m.currentRole?.toLowerCase().includes(filterField.toLowerCase())
      );
    }

    // Country filter
    if (filterCountry) {
      filtered = filtered.filter(m =>
        m.location?.toLowerCase().includes(filterCountry.toLowerCase())
      );
    }

    // Experience filter
    if (filterExp) {
      const years = parseInt(filterExp);
      filtered = filtered.filter(m => {
        const exp = parseInt(m.yearsOfExperience || '0');
        return exp >= years;
      });
    }

    // Availability filter
    if (filterAvail === 'available') {
      filtered = filtered.filter(m => m.availableToMentor !== false);
    }

    // NEW: Enhanced filters
    if (filterExpertise) {
      filtered = filtered.filter(m =>
        m.expertiseAreas?.includes(filterExpertise)
      );
    }

    if (filterIndustry) {
      filtered = filtered.filter(m =>
        m.industriesWorkedIn?.includes(filterIndustry)
      );
    }

    setFilteredMentors(filtered);
  }, [searchQuery, filterField, filterCountry, filterExp, filterAvail, filterExpertise, filterIndustry, mentors]);

  const toggleSaveMentor = (mentorId: string) => {
    setSavedMentors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(mentorId)) {
        newSet.delete(mentorId);
        toast.success('Mentor removed from saved');
      } else {
        newSet.add(mentorId);
        toast.success('Mentor saved!');
      }
      return newSet;
    });
  };

  const handleRequestMentorship = async (mentor: Mentor) => {
    setSelectedMentor(mentor);
    setShowRequestModal(true);
    setRequestMessage(`Hi ${mentor.firstName},\n\nI came across your profile on Ispora and I'm really impressed by your background in ${mentor.industry || 'your field'}. I would love to connect with you for mentorship guidance.\n\nI'm particularly interested in ${mentor.offers?.[0] || 'learning from your experience'}.\n\nLooking forward to hearing from you!`);
  };

  const handleViewProfile = (mentor: Mentor) => {
    setSelectedMentor(mentor);
    setShowProfileModal(true);
  };

  const sendMentorshipRequest = async () => {
    if (!selectedMentor || !user) return;

    try {
      setSendingRequest(true);
      await requestApi.create({
        mentorId: selectedMentor.id,
        message: requestMessage
      });
      toast.success('Mentorship request sent successfully!');
      setShowRequestModal(false);
      setRequestMessage('');
      setSelectedMentor(null);
    } catch (err) {
      console.error('Error sending mentorship request:', err);
      toast.error('Failed to send request. Please try again.');
    } finally {
      setSendingRequest(false);
    }
  };

  const onlineMentors = filteredMentors.filter(m => m.availableToMentor !== false).length;
  
  // Separate recommended and other mentors
  const recommendedMentors = filteredMentors.filter(m => m.isRecommended);
  const otherMentors = filteredMentors.filter(m => !m.isRecommended);

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Search Hero */}
      <div className="bg-[var(--ispora-brand)] px-8 py-6.5 relative overflow-hidden">
        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '28px 28px'
          }}
        />
        {/* Orb */}
        <div className="absolute -top-16 -right-10 w-56 h-56 bg-white/[0.05] rounded-full" />

        <div className="relative z-10">
          <h1 className="font-dm-sans text-lg font-semibold text-white mb-1">
            Find your perfect mentor ✦
          </h1>
          <p className="text-xs text-white/70 mb-4">
            {filteredMentors.length} diaspora professionals ready to guide you — filter by field, country or availability
          </p>

          <div className="flex gap-2.5 items-center flex-wrap">
            <div className="relative flex-1 min-w-[180px] max-w-[320px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[15px] h-[15px] stroke-white/60" strokeWidth={2} />
              <input
                type="text"
                placeholder="Search by name, field, company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/15 border-[1.5px] border-white/25 rounded-[11px] px-4 pl-10 py-2.5 text-[13px] text-white placeholder:text-white/55 outline-none focus:bg-white/22 focus:border-white/50 transition-colors"
              />
            </div>
            <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-[10px] text-[13px] font-semibold bg-white text-[var(--ispora-brand)] hover:bg-[#f0f3ff] hover:shadow-lg transition-all whitespace-nowrap">
              <Search className="w-3 h-3" strokeWidth={2.5} />
              Search
            </button>
          </div>

          <div className="flex gap-3 mt-3.5 text-[10px] text-white/70 flex-nowrap items-center">
            <div className="flex items-center gap-1 whitespace-nowrap">
              <div className="w-1.5 h-1.5 bg-[var(--ispora-accent)] rounded-full flex-shrink-0" />
              <strong className="text-white font-semibold">{filteredMentors.length}</strong> mentors available
            </div>
            <div className="flex items-center gap-1 whitespace-nowrap">
              <div className="w-1.5 h-1.5 bg-white/50 rounded-full flex-shrink-0" />
              <strong className="text-white font-semibold">{onlineMentors}</strong> online now
            </div>
            <div className="flex items-center gap-1 whitespace-nowrap">
              <div className="w-1.5 h-1.5 bg-[var(--ispora-warn)] rounded-full flex-shrink-0" />
              <strong className="text-white font-semibold">12</strong> fields covered
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b-[1.5px] border-[var(--ispora-border)] px-8 py-2.5 flex items-center gap-2.5 flex-shrink-0 overflow-x-auto">
        <span className="text-xs font-semibold text-[var(--ispora-text3)] whitespace-nowrap mr-0.5">
          Filter:
        </span>
        
        {/* Expertise Filter - NEW */}
        <select
          value={filterExpertise}
          onChange={(e) => setFilterExpertise(e.target.value)}
          className="bg-[var(--ispora-bg)] border-[1.5px] border-[var(--ispora-border)] rounded-lg px-2.5 py-1.5 pr-8 text-xs text-[var(--ispora-text2)] outline-none cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2210%22%20height%3D%2210%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%238b90b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3c%2fpolyline%3E%3c%2fsvg%3E')] bg-no-repeat bg-[right_8px_center] whitespace-nowrap focus:border-[var(--ispora-brand)] focus:bg-[var(--ispora-brand-light)] transition-colors"
        >
          <option value="">All Expertise</option>
          {EXPERTISE_AREAS.map(area => (
            <option key={area} value={area}>{area}</option>
          ))}
        </select>

        {/* Industry Filter - NEW */}
        <select
          value={filterIndustry}
          onChange={(e) => setFilterIndustry(e.target.value)}
          className="bg-[var(--ispora-bg)] border-[1.5px] border-[var(--ispora-border)] rounded-lg px-2.5 py-1.5 pr-8 text-xs text-[var(--ispora-text2)] outline-none cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2210%22%20height%3D%2210%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%238b90b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3c%2fpolyline%3E%3c%2fsvg%3E')] bg-no-repeat bg-[right_8px_center] whitespace-nowrap focus:border-[var(--ispora-brand)] focus:bg-[var(--ispora-brand-light)] transition-colors"
        >
          <option value="">All Industries</option>
          {INDUSTRIES.map(industry => (
            <option key={industry} value={industry}>{industry}</option>
          ))}
        </select>

        <select
          value={filterCountry}
          onChange={(e) => setFilterCountry(e.target.value)}
          className="bg-[var(--ispora-bg)] border-[1.5px] border-[var(--ispora-border)] rounded-lg px-2.5 py-1.5 pr-8 text-xs text-[var(--ispora-text2)] outline-none cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2210%22%20height%3D%2210%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%238b90b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3c%2fpolyline%3E%3c%2fsvg%3E')] bg-no-repeat bg-[right_8px_center] whitespace-nowrap focus:border-[var(--ispora-brand)] focus:bg-[var(--ispora-brand-light)] transition-colors"
        >
          <option value="">All Countries</option>
          <option value="nigeria">Nigeria</option>
          <option value="ghana">Ghana</option>
          <option value="kenya">Kenya</option>
          <option value="south africa">South Africa</option>
          <option value="egypt">Egypt</option>
          <option value="morocco">Morocco</option>
          <option value="ethiopia">Ethiopia</option>
          <option value="rwanda">Rwanda</option>
          <option value="uganda">Uganda</option>
          <option value="tanzania">Tanzania</option>
          <option value="uk">United Kingdom</option>
          <option value="us">United States</option>
          <option value="canada">Canada</option>
          <option value="germany">Germany</option>
          <option value="france">France</option>
          <option value="netherlands">Netherlands</option>
          <option value="belgium">Belgium</option>
          <option value="ireland">Ireland</option>
          <option value="italy">Italy</option>
          <option value="spain">Spain</option>
          <option value="switzerland">Switzerland</option>
          <option value="sweden">Sweden</option>
          <option value="norway">Norway</option>
          <option value="denmark">Denmark</option>
          <option value="australia">Australia</option>
          <option value="uae">United Arab Emirates</option>
          <option value="saudi arabia">Saudi Arabia</option>
          <option value="qatar">Qatar</option>
          <option value="india">India</option>
          <option value="china">China</option>
          <option value="japan">Japan</option>
          <option value="singapore">Singapore</option>
          <option value="brazil">Brazil</option>
          <option value="other">Other</option>
        </select>

        <select
          value={filterExp}
          onChange={(e) => setFilterExp(e.target.value)}
          className="bg-[var(--ispora-bg)] border-[1.5px] border-[var(--ispora-border)] rounded-lg px-2.5 py-1.5 pr-8 text-xs text-[var(--ispora-text2)] outline-none cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2210%22%20height%3D%2210%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%238b90b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3c%2fpolyline%3E%3c%2fsvg%3E')] bg-no-repeat bg-[right_8px_center] whitespace-nowrap focus:border-[var(--ispora-brand)] focus:bg-[var(--ispora-brand-light)] transition-colors"
        >
          <option value="">All Experience</option>
          <option value="5">5+ years</option>
          <option value="10">10+ years</option>
          <option value="15">15+ years</option>
        </select>

        <select
          value={filterAvail}
          onChange={(e) => setFilterAvail(e.target.value)}
          className="bg-[var(--ispora-bg)] border-[1.5px] border-[var(--ispora-border)] rounded-lg px-2.5 py-1.5 pr-8 text-xs text-[var(--ispora-text2)] outline-none cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2210%22%20height%3D%2210%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%238b90b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3c%2fpolyline%3E%3c%2fsvg%3E')] bg-no-repeat bg-[right_8px_center] whitespace-nowrap focus:border-[var(--ispora-brand)] focus:bg-[var(--ispora-brand-light)] transition-colors"
        >
          <option value="">All Mentors</option>
          <option value="available">Available Now</option>
        </select>

        <div className="w-px h-5 bg-[var(--ispora-border)] flex-shrink-0" />

        <div className="flex items-center gap-1.5 ml-auto flex-shrink-0">
          <span className="text-xs text-[var(--ispora-text3)] whitespace-nowrap">
            <strong className="text-[var(--ispora-text)] font-semibold">{filteredMentors.length}</strong> results
          </span>
        </div>
      </div>

      {/* Mentors Grid/List */}
      <div className="px-8 py-5.5">
        {apiError ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3.5">
              <Users className="w-6 h-6 text-red-500" strokeWidth={1.8} />
            </div>
            <h3 className="font-syne text-[15px] font-bold text-[var(--ispora-text)] mb-1.5">
              Unable to Load Mentors
            </h3>
            <p className="text-[13px] text-[var(--ispora-text3)] max-w-[380px] mx-auto mb-4">
              {apiError}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--ispora-brand)] text-white rounded-[10px] text-[13px] font-semibold hover:bg-[var(--ispora-brand-hover)] transition-all"
            >
              <Loader2 className="w-3.5 h-3.5" strokeWidth={2.5} />
              Retry
            </button>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-[var(--ispora-brand)] animate-spin mx-auto mb-4" />
              <p className="text-sm text-[var(--ispora-text3)]">Loading mentors...</p>
            </div>
          </div>
        ) : filteredMentors.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 bg-[var(--ispora-brand-light)] rounded-full flex items-center justify-center mx-auto mb-3.5">
              <Users className="w-6 h-6 text-[var(--ispora-brand)]" strokeWidth={1.8} />
            </div>
            <h3 className="font-syne text-[15px] font-bold text-[var(--ispora-text)] mb-1.5">
              No mentors found
            </h3>
            <p className="text-[13px] text-[var(--ispora-text3)] max-w-[280px] mx-auto">
              Try adjusting your filters or search query
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
            {filteredMentors.map((mentor) => (
              <MentorCard
                key={mentor.id}
                mentor={mentor}
                isSaved={savedMentors.has(mentor.id)}
                onToggleSave={() => toggleSaveMentor(mentor.id)}
                onRequestMentorship={() => handleRequestMentorship(mentor)}
                onViewProfile={() => handleViewProfile(mentor)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Request Modal */}
      {showRequestModal && selectedMentor && (
        <div
          className="fixed inset-0 bg-[rgba(7,9,74,0.5)] backdrop-blur-sm flex items-center justify-center z-[1000] p-3 md:p-4"
          onClick={() => !sendingRequest && setShowRequestModal(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-[95vw] md:max-w-[480px] shadow-[var(--ispora-shadow-lg)] max-h-[88vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white z-10 px-6 py-5 border-b border-[var(--ispora-border)] flex items-start justify-between">
              <div>
                <h3 className="font-syne text-base font-bold text-[var(--ispora-text)]">
                  Request Mentorship
                </h3>
                <p className="text-xs text-[var(--ispora-text3)] mt-1">
                  Send a personalized message to {selectedMentor.firstName}
                </p>
              </div>
              <button
                onClick={() => !sendingRequest && setShowRequestModal(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--ispora-text3)] hover:bg-[var(--ispora-bg)] hover:text-[var(--ispora-text)] transition-colors"
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              <div className="mb-5">
                <label className="block text-xs font-semibold text-[var(--ispora-text2)] mb-2">
                  Your Message
                </label>
                <textarea
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  rows={8}
                  className="w-full border-[1.5px] border-[var(--ispora-border)] rounded-[10px] px-3.5 py-2.5 text-[13px] text-[var(--ispora-text)] bg-white outline-none transition-all focus:border-[var(--ispora-brand)] focus:shadow-[0_0_0_3px_rgba(2,31,246,0.07)] placeholder:text-[var(--ispora-text3)] resize-vertical leading-relaxed"
                  placeholder="Introduce yourself and explain why you'd like mentorship..."
                />
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white z-10 px-6 py-3.5 border-t border-[var(--ispora-border)] flex justify-end gap-2.5">
              <button
                onClick={() => setShowRequestModal(false)}
                disabled={sendingRequest}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-white text-[var(--ispora-text)] border-[1.5px] border-[var(--ispora-border)] rounded-[10px] text-[13px] font-semibold hover:border-[var(--ispora-brand)] hover:text-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={sendMentorshipRequest}
                disabled={sendingRequest || !requestMessage.trim()}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-[var(--ispora-brand)] text-white rounded-[10px] text-[13px] font-semibold hover:bg-[var(--ispora-brand-hover)] hover:shadow-[0_4px_14px_rgba(2,31,246,0.3)] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {sendingRequest ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" strokeWidth={2.5} />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-3 h-3" strokeWidth={2.5} />
                    Send Request
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && selectedMentor && (
        <div
          className="fixed inset-0 bg-[rgba(7,9,74,0.5)] backdrop-blur-sm flex items-center justify-center z-[1000] p-3 md:p-4"
          onClick={() => setShowProfileModal(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-[95vw] md:max-w-[520px] shadow-[var(--ispora-shadow-lg)] max-h-[88vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Avatar */}
            <div className="relative px-6 pt-6 pb-5 bg-gradient-to-br from-[var(--ispora-brand-light)] to-white">
              <button
                onClick={() => setShowProfileModal(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center bg-white/80 hover:bg-white text-[var(--ispora-text3)] hover:text-[var(--ispora-text)] transition-colors z-10"
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
              
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-[var(--ispora-brand)] flex items-center justify-center text-white font-bold text-2xl mb-3 border-4 border-white shadow-lg">
                  {selectedMentor.firstName?.[0]}{selectedMentor.lastName?.[0]}
                </div>
                <h3 className="font-syne text-lg font-bold text-[var(--ispora-text)] mb-1">
                  {selectedMentor.firstName} {selectedMentor.lastName}
                </h3>
                {selectedMentor.mentorType && (
                  <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold mb-2 ${
                    selectedMentor.mentorType === 'diaspora'
                      ? 'bg-[var(--ispora-brand)] text-white'
                      : 'bg-[var(--ispora-success)] text-white'
                  }`}>
                    {selectedMentor.mentorType === 'diaspora' ? '✈️ Diaspora Mentor' : '🏠 Home-Based Mentor'}
                  </div>
                )}
                <p className="text-sm text-[var(--ispora-text2)] font-medium">
                  {selectedMentor.currentRole || 'Professional'}
                </p>
                {selectedMentor.company && (
                  <p className="text-xs text-[var(--ispora-text3)] mt-0.5">
                    {selectedMentor.company}
                  </p>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              {/* Location & Experience */}
              <div className="flex items-center justify-center gap-4 text-xs text-[var(--ispora-text3)]">
                {selectedMentor.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" strokeWidth={2} />
                    <span>{selectedMentor.location}</span>
                  </div>
                )}
                {selectedMentor.yearsOfExperience && (
                  <div className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5" strokeWidth={2} />
                    <span>{selectedMentor.yearsOfExperience}+ years exp.</span>
                  </div>
                )}
              </div>

              {/* Bio */}
              {selectedMentor.bio && (
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold text-[var(--ispora-text)] uppercase tracking-wider">
                    Bio
                  </h4>
                  <p className="text-[13px] text-[var(--ispora-text2)] leading-relaxed">
                    {selectedMentor.bio}
                  </p>
                </div>
              )}

              {/* CARD 1: Professional Background */}
              <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/30 border-[1.5px] border-blue-100 rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-bold text-[var(--ispora-brand)] uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <Briefcase className="w-3.5 h-3.5" strokeWidth={2.5} />
                  Professional Background
                </h3>

                {/* Expertise Areas */}
                {selectedMentor.expertiseAreas && selectedMentor.expertiseAreas.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold text-[var(--ispora-text)] uppercase tracking-wider flex items-center gap-2">
                      <Target className="w-4 h-4" strokeWidth={2} />
                      Expertise Areas
                    </h4>
                    <p className="text-[13px] text-[var(--ispora-text2)] leading-relaxed">
                      {selectedMentor.expertiseAreas.join(', ')}
                    </p>
                  </div>
                )}

                {/* Industries Worked In */}
                {selectedMentor.industriesWorkedIn && selectedMentor.industriesWorkedIn.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold text-[var(--ispora-text)] uppercase tracking-wider flex items-center gap-2">
                      <Briefcase className="w-4 h-4" strokeWidth={2} />
                      Industries
                    </h4>
                    <p className="text-[13px] text-[var(--ispora-text2)] leading-relaxed">
                      {selectedMentor.industriesWorkedIn.join(', ')}
                    </p>
                  </div>
                )}

                {/* Skills - Legacy field */}
                {selectedMentor.skills && selectedMentor.skills.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold text-[var(--ispora-text)] uppercase tracking-wider">Skills</h4>
                    <p className="text-[13px] text-[var(--ispora-text2)] leading-relaxed">
                      {selectedMentor.skills.join(', ')}
                    </p>
                  </div>
                )}
              </div>

              {/* CARD 2: Mentorship Offering */}
              <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/30 border-[1.5px] border-blue-100 rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-bold text-[var(--ispora-brand)] uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <Lightbulb className="w-3.5 h-3.5" strokeWidth={2.5} />
                  Mentorship Offering
                </h3>

                {/* What I Can Help With */}
                {selectedMentor.whatICanHelpWith && selectedMentor.whatICanHelpWith.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold text-[var(--ispora-text)] uppercase tracking-wider flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" strokeWidth={2} />
                      What I Can Help With
                    </h4>
                    <p className="text-[13px] text-[var(--ispora-text2)] leading-relaxed">
                      {selectedMentor.whatICanHelpWith.join(', ')}
                    </p>
                  </div>
                )}

                {/* Preferred Mentee Level */}
                {selectedMentor.preferredMenteeLevel && selectedMentor.preferredMenteeLevel.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold text-[var(--ispora-text)] uppercase tracking-wider flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" strokeWidth={2} />
                      Preferred Mentee Level
                    </h4>
                    <p className="text-[13px] text-[var(--ispora-text2)] leading-relaxed">
                      {selectedMentor.preferredMenteeLevel.join(', ')}
                    </p>
                  </div>
                )}

                {/* Availability Hours */}
                {selectedMentor.availabilityHoursPerMonth && (
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold text-[var(--ispora-text)] uppercase tracking-wider flex items-center gap-2">
                      <Clock className="w-4 h-4" strokeWidth={2} />
                      Availability
                    </h4>
                    <div className="text-[13px] text-[var(--ispora-text2)]">
                      <strong className="text-[var(--ispora-brand)]">{selectedMentor.availabilityHoursPerMonth} hours</strong> per month
                    </div>
                  </div>
                )}
              </div>

              {/* CARD 3: Additional Information */}
              <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/30 border-[1.5px] border-blue-100 rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-bold text-[var(--ispora-brand)] uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <Globe className="w-3.5 h-3.5" strokeWidth={2.5} />
                  Additional Information
                </h3>

                {/* Languages Spoken */}
                {selectedMentor.languagesSpoken && selectedMentor.languagesSpoken.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold text-[var(--ispora-text)] uppercase tracking-wider flex items-center gap-2">
                      <LanguagesIcon className="w-4 h-4" strokeWidth={2} />
                      Languages
                    </h4>
                    <p className="text-[13px] text-[var(--ispora-text2)] leading-relaxed">
                      {selectedMentor.languagesSpoken.join(', ')}
                    </p>
                  </div>
                )}

                {/* Country of Origin */}
                {selectedMentor.countryOfOrigin && (
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold text-[var(--ispora-text)] uppercase tracking-wider flex items-center gap-2">
                      <Flag className="w-4 h-4" strokeWidth={2} />
                      Country of Origin
                    </h4>
                    <div className="text-[13px] text-[var(--ispora-text2)]">
                      {selectedMentor.countryOfOrigin}
                    </div>
                  </div>
                )}

                {/* LinkedIn */}
                {selectedMentor.linkedIn && (
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold text-[var(--ispora-text)] uppercase tracking-wider">LinkedIn</h4>
                    <a
                      href={selectedMentor.linkedIn.startsWith('http') ? selectedMentor.linkedIn : `https://${selectedMentor.linkedIn}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-[13px] text-[var(--ispora-brand)] hover:underline"
                    >
                      <Linkedin className="w-4 h-4" strokeWidth={2} />
                      <span>View LinkedIn Profile</span>
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white z-10 px-6 py-3.5 border-t border-[var(--ispora-border)] flex gap-2.5">
              <button
                onClick={() => setShowProfileModal(false)}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white text-[var(--ispora-text)] border-[1.5px] border-[var(--ispora-border)] rounded-[10px] text-[13px] font-semibold hover:border-[var(--ispora-brand)] hover:text-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] transition-all"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowProfileModal(false);
                  handleRequestMentorship(selectedMentor);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[var(--ispora-brand)] text-white rounded-[10px] text-[13px] font-semibold hover:bg-[var(--ispora-brand-hover)] hover:shadow-[0_4px_14px_rgba(2,31,246,0.3)] hover:-translate-y-0.5 transition-all"
              >
                <Send className="w-3 h-3" strokeWidth={2.5} />
                Request Mentorship
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Mentor Card Component
interface MentorCardProps {
  mentor: Mentor;
  isSaved: boolean;
  onToggleSave: () => void;
  onRequestMentorship: () => void;
  onViewProfile: () => void;
}

function MentorCard({ mentor, isSaved, onToggleSave, onRequestMentorship, onViewProfile }: MentorCardProps) {
  const initials = `${mentor.firstName?.[0] || ''}${mentor.lastName?.[0] || ''}`.toUpperCase();
  const bgColors = ['#021ff6', '#00c896', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6'];
  const bgColor = bgColors[mentor.id.charCodeAt(0) % bgColors.length];
  const matchPercentage = mentor.matchScore ? Math.min(100, Math.round(mentor.matchScore / 1.2)) : 0;

  return (
    <div className="bg-white border-[1.5px] border-[var(--ispora-border)] rounded-2xl overflow-hidden cursor-pointer hover:border-[var(--ispora-brand)] hover:shadow-[var(--ispora-shadow)] hover:-translate-y-1 transition-all flex flex-col">
      {/* Current Mentor Badge */}
      {mentor.isCurrentMentor && (
        <div className="bg-green-600 py-1.5 px-4 text-center">
          <span className="text-[9px] font-bold text-white tracking-wide">✓ YOUR MENTOR</span>
        </div>
      )}
      
      {/* Recommended Section */}
      {!mentor.isCurrentMentor && mentor.isRecommended && (
        <div className="bg-sky-500 py-1.5 px-4 text-center">
          <span className="text-[9px] font-bold text-white tracking-wide">RECOMMENDED • {matchPercentage}% MATCH</span>
        </div>
      )}
      
      {/* Top */}
      <div className="px-5 py-5 pb-3.5 bg-gradient-to-br from-[var(--ispora-brand-light)] to-white flex flex-col items-center text-center relative">
        {/* Save Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave();
          }}
          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white border-[1.5px] border-[var(--ispora-border)] flex items-center justify-center hover:border-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] transition-all z-10"
        >
          <Heart className={`w-3 h-3 ${isSaved ? 'fill-[var(--ispora-brand)] stroke-[var(--ispora-brand)]' : 'stroke-[var(--ispora-text3)]'}`} strokeWidth={2} />
        </button>

        {/* Avatar */}
        {mentor.profilePicture ? (
          <div className="w-[58px] h-[58px] rounded-full overflow-hidden mb-2.5 border-3 border-white shadow-[0_2px_10px_rgba(0,0,0,0.1)] relative">
            <img 
              src={mentor.profilePicture} 
              alt={`${mentor.firstName} ${mentor.lastName}`}
              className="w-full h-full object-cover"
            />
            {mentor.availableToMentor !== false && (
              <div className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-[var(--ispora-accent)] rounded-full border-2 border-white" />
            )}
          </div>
        ) : (
          <div className="w-[58px] h-[58px] rounded-full flex items-center justify-center text-white font-bold text-[21px] mb-2.5 border-3 border-white shadow-[0_2px_10px_rgba(0,0,0,0.1)] relative" style={{ background: bgColor }}>
            {initials}
            {mentor.availableToMentor !== false && (
              <div className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-[var(--ispora-accent)] rounded-full border-2 border-white" />
            )}
          </div>
        )}

        {/* Name */}
        <div className="font-syne text-sm font-bold text-[var(--ispora-text)] mb-0.5">
          {mentor.firstName} {mentor.lastName}
        </div>
        
        {/* Mentor Type Badge */}
        {mentor.mentorType && (
          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold mb-1 ${
            mentor.mentorType === 'diaspora'
              ? 'bg-[var(--ispora-brand-light)] text-[var(--ispora-brand)]'
              : 'bg-[var(--ispora-success-light)] text-[var(--ispora-success)]'
          }`}>
            {mentor.mentorType === 'diaspora' ? '✈️ Diaspora Mentor' : '🏠 Home-Based Mentor'}
          </div>
        )}
        
        <div className="text-[11px] text-[var(--ispora-text3)] mb-1">
          {mentor.currentRole || 'Professional'}
        </div>
        <div className="flex items-center gap-1 text-[11px] text-[var(--ispora-text3)] justify-center mb-2">
          <MapPin className="w-[11px] h-[11px]" strokeWidth={2} />
          {mentor.location || 'Location not specified'}
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-3.5 border-t border-[var(--ispora-border)] flex-1 space-y-2.5">
        {/* What I Can Help With - NEW */}
        {mentor.whatICanHelpWith && mentor.whatICanHelpWith.length > 0 && (
          <div>
            <h4 className="text-[10px] font-bold text-[var(--ispora-text)] uppercase tracking-wider mb-1">
              What I Can Help With:
            </h4>
            <p className="text-[11px] text-[var(--ispora-text2)] leading-relaxed">
              {mentor.whatICanHelpWith.join(', ')}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-[var(--ispora-border)] flex gap-2">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onViewProfile();
          }}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-[10px] text-xs font-semibold bg-white text-[var(--ispora-text)] border-[1.5px] border-[var(--ispora-border)] hover:border-[var(--ispora-brand)] hover:text-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] transition-all"
        >
          View Profile
        </button>
        {mentor.isCurrentMentor ? (
          <button
            disabled
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-[10px] text-xs font-semibold bg-gray-100 text-gray-500 border-[1.5px] border-gray-200 cursor-not-allowed"
          >
            <CheckCircle2 className="w-3 h-3" strokeWidth={2.5} />
            Connected
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRequestMentorship();
            }}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-[10px] text-xs font-semibold bg-[var(--ispora-brand)] text-white hover:bg-[var(--ispora-brand-hover)] hover:shadow-[0_4px_14px_rgba(2,31,246,0.3)] hover:-translate-y-0.5 transition-all"
          >
            <Send className="w-3 h-3" strokeWidth={2.5} />
            Request
          </button>
        )}
      </div>
    </div>
  );
}