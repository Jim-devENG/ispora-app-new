import React, { useState, useEffect } from 'react';
import { opportunityApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { normalizeUrl, isValidUrl } from '../utils/urlHelpers';
import { toast } from 'sonner';
import {
  Search,
  Plus,
  Bookmark,
  X,
  MapPin,
  Clock,
  DollarSign,
  ExternalLink,
  ChevronDown,
  Building2,
  CheckCircle,
  Edit,
  Trash2,
  Eye,
  Loader2,
  MoreVertical,
  Share2
} from 'lucide-react';

type OpportunityType = 'internship' | 'job' | 'scholarship' | 'fellowship' | 'accelerator' | 'hackathon' | 'conference' | 'grant' | 'competition' | 'others';
type OpportunityStatus = 'live' | 'review' | 'draft';
type PosterType = 'diaspora' | 'ispora' | 'review';

interface Opportunity {
  id: number;
  type: OpportunityType;
  title: string;
  org: string;
  logo: string;
  location: string;
  country: string;
  field: string;
  deadline: string;
  deadlineUrgent: boolean;
  tags: string[];
  salary?: string;
  applicants: number;
  postedAgo: string;
  poster: PosterType;
  postedBy: string;
  postedByRole: string;
  postedById?: string;
  featured: boolean;
  saved: boolean;
  desc: string;
  tip?: string;
  eligibility: string;
  link: string;
}

interface MyPost {
  id: number;
  type: OpportunityType;
  title: string;
  org: string;
  status: OpportunityStatus;
  views: number;
  applied: number;
  date: string;
}

const Opportunities: React.FC = () => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState<'browse' | 'saved' | 'mine'>('browse');
  const [currentType, setCurrentType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterField, setFilterField] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [showPostModal, setShowPostModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [myPosts, setMyPosts] = useState<MyPost[]>([]);

  // Post form state
  const [postForm, setPostForm] = useState({
    id: null as number | null,
    type: 'internship',
    title: '',
    org: '',
    location: '',
    field: 'Software Engineering',
    deadline: '',
    eligibility: '',
    salary: '',
    link: '',
    description: '',
    tip: ''
  });

  // Helper function to calculate time ago
  const getTimeAgo = (date: Date): string => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 604800)} weeks ago`;
    return `${Math.floor(seconds / 2592000)} months ago`;
  };

  // Fetch opportunities from backend
  // Normalize type from backend (plural) to frontend (singular)
  const normalizeType = (type: string): OpportunityType => {
    const typeMap: Record<string, OpportunityType> = {
      'internships': 'internship',
      'jobs': 'job',
      'scholarships': 'scholarship',
      'fellowships': 'fellowship',
      'accelerators': 'accelerator',
      'hackathons': 'hackathon',
      'conferences': 'conference',
      'grants': 'grant',
      'competitions': 'competition',
      'others': 'others'
    };
    
    const normalizedType = type?.toLowerCase() || 'job';
    return (typeMap[normalizedType] || normalizedType) as OpportunityType;
  };

  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response: any = await opportunityApi.getAll();
        
        // Transform backend data to match our Opportunity interface
        const transformedOpportunities = (response.opportunities || []).map((opp: any) => {
          // Get link value with proper fallback
          const linkValue = opp.applicationUrl || opp.applicationLink || opp.link || '';

          return {
            id: opp.id,
            type: normalizeType(opp.type),
            title: opp.title,
            org: opp.company || opp.org || 'Company',
            logo: '💼',
            location: opp.location || 'Remote',
            country: opp.location?.toLowerCase().includes('uk') ? 'uk' : 
                     opp.location?.toLowerCase().includes('us') ? 'us' : 
                     opp.location?.toLowerCase().includes('remote') ? 'remote' : 'other',
            field: opp.field || 'general',
            deadline: opp.deadline ? new Date(opp.deadline).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            }) : 'Open',
            deadlineUrgent: opp.deadline ? 
              (new Date(opp.deadline).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000) : false,
            tags: opp.tags || [],
            salary: opp.salary || undefined,
            applicants: opp.applicants || 0,
            postedAgo: opp.createdAt ? getTimeAgo(new Date(opp.createdAt)) : 'Recently',
            poster: opp.posterType || opp.poster || 'diaspora',
            postedBy: opp.postedByName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Ispora Team',
            postedByRole: opp.postedByRole || 'Curated by Ispora',
            postedById: opp.postedBy,
            featured: opp.featured || false,
            saved: opp.bookmarked || false,
            desc: opp.description || '',
            tip: opp.tip,
            eligibility: opp.eligibility || '',
            link: linkValue
          };
        });
        
        console.log('📊 All transformed opportunities:', transformedOpportunities.length);
        console.log('📊 Sample opportunity data:', transformedOpportunities[0]);
        
        // Filter out opportunities without valid links (unless user is the owner)
        const validOpportunities = transformedOpportunities.filter((opp: Opportunity) => {
          // Always include if user is the owner (they can edit it)
          const isOwner = user?.id && opp.postedById && String(opp.postedById) === String(user.id);
          if (isOwner) return true;
          
          // Otherwise, only include if it has a valid link
          const hasValidLink = isValidUrl(opp.link);
          if (!hasValidLink) {
            console.log('❌ Filtered out opportunity (no valid link):', {
              title: opp.title,
              link: opp.link,
              postedBy: opp.postedBy,
              postedById: opp.postedById
            });
          }
          return hasValidLink;
        });
        
        console.log('✅ Valid opportunities after filtering:', validOpportunities.length);
        
        setOpportunities(validOpportunities);
      } catch (err: any) {
        console.error('Error fetching opportunities:', err);
        setError(err.message || 'Failed to load opportunities');
        setOpportunities([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOpportunities();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchOpportunities, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (openMenuId !== null) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuId]);

  // Fetch bookmarked opportunities when on saved tab
  useEffect(() => {
    if (currentTab === 'saved') {
      const fetchBookmarked = async () => {
        try {
          const response: any = await opportunityApi.getBookmarked();
          const bookmarkedIds = (response.opportunities || []).map((opp: any) => opp.id);
          
          // Update saved status
          setOpportunities(prev => prev.map(opportunity => ({
            ...opportunity,
            saved: bookmarkedIds.includes(opportunity.id)
          })));
        } catch (err) {
          console.error('Error fetching bookmarked opportunities:', err);
        }
      };
      
      fetchBookmarked();
    }
  }, [currentTab]);

  const [oldOpportunities] = useState<Opportunity[]>([
    {
      id: 1,
      type: 'internship',
      title: 'Google BOLD Internship Programme',
      org: 'Google',
      logo: '🌎',
      location: 'London, UK',
      country: 'uk',
      field: 'software',
      deadline: 'Apr 30, 2026',
      deadlineUrgent: false,
      tags: ['React', 'Python', 'Data'],
      salary: 'Paid — competitive stipend',
      applicants: 143,
      postedAgo: '2 days ago',
      poster: 'diaspora',
      postedBy: 'Dr. Amina Osei',
      postedByRole: 'Senior Engineer, Barclays',
      featured: true,
      saved: false,
      desc: 'Google BOLD is a 10-week summer internship programme specifically designed for students from underrepresented communities. You will work on real products alongside Googlers.',
      tip: 'Apply early — the first round closes faster than the official deadline. Tailor your CV to highlight impact, not just tasks.',
      eligibility: 'University students, penultimate or final year',
      link: 'https://buildyourfuture.withgoogle.com/programs/bold'
    },
    {
      id: 2,
      type: 'scholarship',
      title: 'Chevening Scholarship 2027',
      org: 'UK Government',
      logo: '🇬🇧',
      location: 'United Kingdom',
      country: 'uk',
      field: 'general',
      deadline: 'Nov 5, 2026',
      deadlineUrgent: false,
      tags: ['Fully Funded', 'Masters', 'Any Field'],
      salary: 'Fully Funded',
      applicants: 89,
      postedAgo: '1 week ago',
      poster: 'ispora',
      postedBy: 'Ispora Team',
      postedByRole: 'Curated by Ispora',
      featured: true,
      saved: false,
      desc: 'Chevening Scholarships are the UK government\'s global scholarship programme, funded by the FCDO. They offer fully funded one-year Masters degrees at UK universities.',
      tip: 'Leadership experience is the key differentiator. Start documenting your leadership stories now, even if the deadline seems far.',
      eligibility: 'Nigerian nationals, 2+ years work experience',
      link: 'https://www.chevening.org'
    },
    {
      id: 3,
      type: 'fellowship',
      title: 'Accenture African Tech Leadership Fellowship',
      org: 'Accenture',
      logo: '💼',
      location: 'Remote + Amsterdam',
      country: 'netherlands',
      field: 'business',
      deadline: 'May 15, 2026',
      deadlineUrgent: false,
      tags: ['Leadership', 'Tech', 'Paid'],
      salary: 'Stipend included',
      applicants: 54,
      postedAgo: '3 days ago',
      poster: 'diaspora',
      postedBy: 'Ifeoma Adeyemi',
      postedByRole: 'Senior PM, Spotify',
      featured: true,
      saved: false,
      desc: 'A 6-month fellowship for emerging African tech leaders. Fellows get mentorship from Accenture executives, a stipend, and access to the global tech network.',
      tip: 'They want evidence of community impact, not just corporate achievement. Lead with what you have done for others.',
      eligibility: 'African nationals, 3-8 years experience in tech',
      link: '#'
    },
    {
      id: 4,
      type: 'accelerator',
      title: 'Y Combinator W27 Batch Applications',
      org: 'Y Combinator',
      logo: '🧗',
      location: 'San Francisco / Remote',
      country: 'us',
      field: 'business',
      deadline: 'Sep 30, 2026',
      deadlineUrgent: false,
      tags: ['Startup', 'Funding', '$500K'],
      salary: '$500K equity investment',
      applicants: 312,
      postedAgo: '5 days ago',
      poster: 'ispora',
      postedBy: 'Ispora Team',
      postedByRole: 'Curated by Ispora',
      featured: false,
      saved: false,
      desc: 'Y Combinator is the world\'s most prestigious startup accelerator. Apply with a co-founder. They fund pre-seed and early stage startups across all domains.',
      eligibility: 'Open to all nationalities. Must have a startup idea or early product.',
      link: '#'
    },
    {
      id: 5,
      type: 'job',
      title: 'Barclays Technology Graduate Scheme 2027',
      org: 'Barclays',
      logo: '🏦',
      location: 'London, UK',
      country: 'uk',
      field: 'software',
      deadline: 'Jun 30, 2026',
      deadlineUrgent: false,
      tags: ['Grad Scheme', 'Fintech', 'Paid'],
      salary: '£32,000–£40,000/yr',
      applicants: 78,
      postedAgo: '4 days ago',
      poster: 'diaspora',
      postedBy: 'Dr. Amina Osei',
      postedByRole: 'Senior Engineer, Barclays',
      featured: false,
      saved: false,
      desc: 'Barclays 2-year technology graduate scheme. Rotational programme across software engineering, data and cyber security. Open to all nationalities with UK work eligibility.',
      tip: 'The online assessment is heavy on situational judgement. Practice with the SHL guide. Mention interest in fintech in your application — it matters.',
      eligibility: 'Final year students or recent graduates with UK work authorisation',
      link: '#'
    },
    {
      id: 6,
      type: 'hackathon',
      title: 'ETHGlobal London 2026',
      org: 'ETHGlobal',
      logo: '♦',
      location: 'London, UK',
      country: 'uk',
      field: 'software',
      deadline: 'Apr 10, 2026',
      deadlineUrgent: true,
      tags: ['Web3', 'Blockchain', 'Prizes'],
      salary: '$500K+ in prizes',
      applicants: 203,
      postedAgo: 'Today',
      poster: 'ispora',
      postedBy: 'Ispora Team',
      postedByRole: 'Curated by Ispora',
      featured: false,
      saved: false,
      desc: '48-hour Ethereum hackathon with $500K+ in prizes. Great for networking with the global blockchain developer community and building production-ready projects.',
      eligibility: 'Open to all developers worldwide',
      link: '#'
    },
    {
      id: 7,
      type: 'scholarship',
      title: 'Commonwealth Distance Learning Scholarships',
      org: 'Commonwealth Scholarship Commission',
      logo: '🌎',
      location: 'United Kingdom',
      country: 'uk',
      field: 'general',
      deadline: 'Dec 18, 2026',
      deadlineUrgent: false,
      tags: ['Masters', 'Distance Learning', 'Funded'],
      salary: 'Fully Funded',
      applicants: 41,
      postedAgo: '1 week ago',
      poster: 'ispora',
      postedBy: 'Ispora Team',
      postedByRole: 'Curated by Ispora',
      featured: false,
      saved: false,
      desc: 'Fully funded Masters degrees at UK universities taught by distance learning, allowing you to study from Nigeria. Covers tuition fees and academic support.',
      eligibility: 'Nigerian nationals employed in a relevant sector',
      link: '#'
    },
    {
      id: 8,
      type: 'competition',
      title: 'Microsoft Imagine Cup 2026',
      org: 'Microsoft',
      logo: '🖥️',
      location: 'Global / Remote',
      country: 'remote',
      field: 'software',
      deadline: 'Mar 31, 2026',
      deadlineUrgent: true,
      tags: ['AI', 'Innovation', '$100K'],
      salary: '$100,000 prize',
      applicants: 567,
      postedAgo: 'Today',
      poster: 'ispora',
      postedBy: 'Ispora Team',
      postedByRole: 'Curated by Ispora',
      featured: false,
      saved: false,
      desc: 'Microsoft Imagine Cup is a global student technology competition. Teams build AI-powered solutions addressing real-world problems. Winner gets $100,000.',
      eligibility: 'University students globally',
      link: '#'
    }
  ]);

  const typeColors: Record<OpportunityType, string> = {
    internship: 'bg-[#dbeafe] text-[#1d4ed8]',
    job: 'bg-[#d1fae5] text-[#065f46]',
    scholarship: 'bg-[#fef9c3] text-[#854d0e]',
    fellowship: 'bg-[#f3e8ff] text-[#6b21a8]',
    accelerator: 'bg-[#fce7f3] text-[#9f1239]',
    hackathon: 'bg-[#ccfbf1] text-[#134e4a]',
    conference: 'bg-[#fce7f3] text-[#9f1239]',
    grant: 'bg-[#fed7aa] text-[#9a3412]',
    competition: 'bg-[#e9d5ff] text-[#6b21a8]',
    others: 'bg-[#e5e7eb] text-[#374151]'
  };

  const typeLabels: Record<OpportunityType, string> = {
    internship: 'Internship',
    job: 'Graduate Job',
    scholarship: 'Scholarship',
    fellowship: 'Fellowship',
    accelerator: 'Accelerator',
    hackathon: 'Hackathon',
    conference: 'Conference',
    grant: 'Grant',
    competition: 'Competition',
    others: 'Others'
  };

  const getFilteredOpportunities = () => {
    return opportunities.filter(opp => {
      if (currentTab === 'saved' && !opp.saved) return false;
      if (currentType !== 'all' && opp.type !== currentType) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !opp.title.toLowerCase().includes(query) &&
          !opp.org.toLowerCase().includes(query) &&
          !opp.desc.toLowerCase().includes(query)
        ) {
          return false;
        }
      }
      if (filterField && opp.field !== filterField) return false;
      if (filterCountry && opp.country !== filterCountry) return false;
      return true;
    });
  };

  const toggleSave = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const opportunity = opportunities.find(opp => opp.id === id);
    if (!opportunity) return;
    
    // Optimistically update UI
    setOpportunities(prev =>
      prev.map(opp => (opp.id === id ? { ...opp, saved: !opp.saved } : opp))
    );
    
    try {
      if (opportunity.saved) {
        await opportunityApi.unbookmark(id.toString());
      } else {
        await opportunityApi.bookmark(id.toString());
      }
    } catch (err) {
      console.error('Error toggling bookmark:', err);
      // Revert on error
      setOpportunities(prev =>
        prev.map(opp => (opp.id === id ? { ...opp, saved: !opp.saved } : opp))
      );
    }
  };

  const openDetail = (opp: Opportunity) => {
    setSelectedOpportunity(opp);
    setShowDetailModal(true);
  };

  // Handle closing post modal
  const handleClosePostModal = () => {
    setShowPostModal(false);
    setPostForm({
      id: null,
      type: 'internship',
      title: '',
      org: '',
      location: '',
      field: 'Software Engineering',
      deadline: '',
      eligibility: '',
      salary: '',
      link: '',
      description: '',
      tip: ''
    });
  };

  // Handle posting opportunity
  const handlePostOpportunity = async () => {
    try {
      // Validate required fields
      if (!postForm.title || !postForm.org || !postForm.location || !postForm.deadline || !postForm.link || !postForm.description) {
        toast.error('Missing Information', {
          description: 'Please fill in all required fields including application link.',
        });
        return;
      }

      // Validate URL format
      if (!isValidUrl(postForm.link)) {
        toast.error('Invalid URL', {
          description: 'Please enter a valid application URL (e.g., https://example.com/apply).',
        });
        return;
      }

      // Prepare opportunity data
      const opportunityData = {
        title: postForm.title,
        company: postForm.org,
        type: postForm.type,
        location: postForm.location,
        description: postForm.description,
        deadline: postForm.deadline,
        eligibility: postForm.eligibility,
        salary: postForm.salary,
        field: postForm.field,
        tip: postForm.tip,
        applicationUrl: postForm.link
      };

      // Check if this is an edit or a new post
      const isEdit = postForm.id !== null;
      
      if (isEdit) {
        console.log('[Update Opportunity] Sending data for ID:', postForm.id, opportunityData);
        await opportunityApi.update(postForm.id, opportunityData);
      } else {
        console.log('[Create Opportunity] Sending data:', opportunityData);
        await opportunityApi.create(opportunityData);
      }

      // Refresh opportunities
      const updatedOpps: any = await opportunityApi.getAll();
      const transformedOpportunities = (updatedOpps.opportunities || []).map((opp: any) => ({
        id: opp.id,
        type: opp.type,
        title: opp.title,
        org: opp.company || opp.org || 'Company',
        logo: opp.logo || '',
        location: opp.location,
        country: opp.country,
        field: opp.field,
        deadline: opp.deadline,
        deadlineUrgent: new Date(opp.deadline).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000,
        tags: opp.tags || [],
        salary: opp.salary,
        applicants: opp.applicants || 0,
        postedAgo: getTimeAgo(new Date(opp.createdAt)),
        poster: opp.posterType || opp.poster || 'diaspora',
        postedBy: opp.postedByName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Unknown',
        postedByRole: opp.postedByRole || '',
        postedById: opp.postedBy,
        featured: opp.featured || false,
        saved: false,
        desc: opp.description || '',
        tip: opp.tip,
        eligibility: opp.eligibility || '',
        link: opp.applicationUrl || opp.link || ''
      }));
      
      setOpportunities(transformedOpportunities);
      handleClosePostModal();
      toast.success(isEdit ? 'Opportunity Updated!' : 'Opportunity Posted!', {
        description: isEdit ? 'Your changes have been saved successfully.' : 'Your opportunity has been posted successfully.',
        duration: 5000,
      });
    } catch (error) {
      console.error('Error posting opportunity:', error);
      toast.error('Failed to Post', {
        description: 'Could not post opportunity. Please try again.',
      });
    }
  };

  // Handle deleting opportunity
  const handleDeleteOpportunity = async (id: number) => {
    if (!confirm('Are you sure you want to delete this opportunity?')) {
      return;
    }

    try {
      await opportunityApi.delete(id);
      setOpportunities(prev => prev.filter(opp => opp.id !== id));
      setOpenMenuId(null);
      alert('Opportunity deleted successfully!');
    } catch (error) {
      console.error('Error deleting opportunity:', error);
      alert('Failed to delete opportunity. Please try again.');
    }
  };

  // Handle editing opportunity
  const handleEditOpportunity = (opportunity: Opportunity) => {
    // Pre-fill the form with existing data
    setPostForm({
      id: opportunity.id,
      type: opportunity.type,
      title: opportunity.title,
      org: opportunity.org,
      location: opportunity.location,
      field: opportunity.field,
      deadline: opportunity.deadline,
      eligibility: opportunity.eligibility,
      salary: opportunity.salary || '',
      link: opportunity.link,
      description: opportunity.desc,
      tip: opportunity.tip || ''
    });
    setOpenMenuId(null);
    setShowPostModal(true);
  };

  const filteredOpportunities = getFilteredOpportunities();
  const featuredOpportunities = currentType === 'all' ? filteredOpportunities.filter(o => o.featured) : [];
  const regularOpportunities = currentType === 'all' ? filteredOpportunities.filter(o => !o.featured) : filteredOpportunities;
  const savedCount = opportunities.filter(o => o.saved).length;

  return (
    <div className="flex-1 overflow-y-auto bg-[var(--ispora-bg)]">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[var(--ispora-brand)] via-[#1a35f8] to-[var(--ispora-brand-hover)] px-8 py-7 relative overflow-hidden">
        {/* Grid background */}
        <div 
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
            backgroundSize: '28px 28px'
          }}
        />
        
        {/* Orbs */}
        <div className="absolute -top-16 -right-10 w-60 h-60 bg-white/5 rounded-full pointer-events-none" />
        <div className="absolute -bottom-20 left-[30%] w-44 h-44 bg-white/[0.03] rounded-full pointer-events-none" />

        <div className="relative z-10 flex items-start justify-between gap-5 flex-wrap">
          <div className="flex-1 min-w-[300px]">
            <h1 className="font-dm-sans text-lg font-semibold text-white mb-1.5">
              Real opportunities from insiders ✦
            </h1>
            <p className="text-xs text-white/70 leading-relaxed whitespace-nowrap">
              Verified opportunities from diaspora professionals and Ispora — no scraped boards.
            </p>
          </div>
          {user?.role === 'diaspora' && (
            <button
              onClick={() => setShowPostModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white text-[var(--ispora-brand)] rounded-[10px] text-[13px] font-semibold hover:bg-[#f0f3ff] transition-colors flex-shrink-0"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
              Post Opportunity
            </button>
          )}
        </div>
      </div>

      {/* Type Chips */}
      <div className="bg-white border-b border-[var(--ispora-border)] px-8 py-2.5 flex gap-1.5 overflow-x-auto hide-scrollbar">
        <button
          onClick={() => setCurrentType('all')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border-[1.5px] transition-all ${
            currentType === 'all'
              ? 'bg-[var(--ispora-brand)] text-white border-[var(--ispora-brand)]'
              : 'bg-white text-[var(--ispora-text2)] border-[var(--ispora-border)] hover:border-[var(--ispora-brand)] hover:text-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)]'
          }`}
        >
          <div className="w-2 h-2 rounded-full bg-current" />
          All
        </button>
        {(Object.keys(typeLabels) as OpportunityType[]).map((type) => (
          <button
            key={type}
            onClick={() => setCurrentType(type)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border-[1.5px] transition-all ${
              currentType === type
                ? 'bg-[var(--ispora-brand)] text-white border-[var(--ispora-brand)]'
                : 'bg-white text-[var(--ispora-text2)] border-[var(--ispora-border)] hover:border-[var(--ispora-brand)] hover:text-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)]'
            }`}
          >
            <div className="w-2 h-2 rounded-full bg-current" />
            {typeLabels[type]}
          </button>
        ))}
      </div>

      {/* Body Content */}
      <div className="px-8 py-6">
        {isLoading ? (
          // Loading State
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Loader2 className="w-10 h-10 text-[var(--ispora-brand)] animate-spin mx-auto mb-3" />
              <p className="text-sm text-[var(--ispora-text3)]">Loading opportunities...</p>
            </div>
          </div>
        ) : error ? (
          // Error State
          <div className="text-center py-16">
            <div className="w-14 h-14 bg-[var(--ispora-danger-light)] rounded-full flex items-center justify-center mx-auto mb-3.5">
              <X className="w-6 h-6 text-[var(--ispora-danger)]" strokeWidth={1.8} />
            </div>
            <h3 className="font-syne text-[15px] font-bold text-[var(--ispora-text)] mb-1.5">
              Failed to load opportunities
            </h3>
            <p className="text-[13px] text-[var(--ispora-text3)] mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[var(--ispora-brand)] text-white text-sm font-semibold rounded-lg hover:bg-[var(--ispora-brand-hover)] transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : currentTab === 'mine' ? (
          // My Posts Tab
          <div className="space-y-2.5">
            {myPosts.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-14 h-14 bg-[var(--ispora-brand-light)] rounded-full flex items-center justify-center mx-auto mb-3.5">
                  <Edit className="w-6 h-6 text-[var(--ispora-brand)]" strokeWidth={1.8} />
                </div>
                {user?.role === 'diaspora' ? (
                  <>
                    <h3 className="font-syne text-[15px] font-bold text-[var(--ispora-text)] mb-1.5">
                      No posts yet
                    </h3>
                    <p className="text-[13px] text-[var(--ispora-text3)] mb-4">
                      Share opportunities with the community to help other members grow
                    </p>
                    <button
                      onClick={() => setShowPostModal(true)}
                      className="px-4 py-2 bg-[var(--ispora-brand)] text-white text-sm font-semibold rounded-lg hover:bg-[var(--ispora-brand-hover)] transition-colors"
                    >
                      Post Your First Opportunity
                    </button>
                  </>
                ) : (
                  <>
                    <h3 className="font-syne text-[15px] font-bold text-[var(--ispora-text)] mb-1.5">
                      No posts yet
                    </h3>
                    <p className="text-[13px] text-[var(--ispora-text3)]">
                      Only mentors can post opportunities. Browse available opportunities to find ones that match your interests!
                    </p>
                  </>
                )}
              </div>
            ) : (
              myPosts.map((post) => (
              <div
                key={post.id}
                className="bg-white border-[1.5px] border-[var(--ispora-border)] rounded-xl p-4 flex items-center gap-3.5 hover:border-[var(--ispora-brand)] hover:shadow-[var(--ispora-shadow-sm)] transition-all"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[13px] text-[var(--ispora-text)] mb-0.5">{post.title}</div>
                  <div className="text-[11px] text-[var(--ispora-text3)]">
                    {post.org} · {post.views} views · {post.applied} applied · Posted {post.date}
                  </div>
                </div>
                <div
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    post.status === 'live'
                      ? 'bg-[var(--ispora-success-light)] text-[var(--ispora-success)]'
                      : post.status === 'review'
                      ? 'bg-[var(--ispora-warn-light)] text-[#92400e]'
                      : 'bg-[var(--ispora-bg)] text-[var(--ispora-text3)] border border-[var(--ispora-border)]'
                  }`}
                >
                  {post.status.toUpperCase()}
                </div>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-[var(--ispora-bg)] rounded-lg transition-colors">
                    <Eye className="w-4 h-4 text-[var(--ispora-text3)]" strokeWidth={2} />
                  </button>
                  <button className="p-2 hover:bg-[var(--ispora-bg)] rounded-lg transition-colors">
                    <Edit className="w-4 h-4 text-[var(--ispora-text3)]" strokeWidth={2} />
                  </button>
                  <button className="p-2 hover:bg-[var(--ispora-danger-light)] rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4 text-[var(--ispora-danger)]" strokeWidth={2} />
                  </button>
                </div>
              </div>
              ))
            )}
          </div>
        ) : filteredOpportunities.length === 0 ? (
          // Empty State
          <div className="text-center py-16">
            <div className="w-14 h-14 bg-[var(--ispora-brand-light)] rounded-full flex items-center justify-center mx-auto mb-3.5">
              <Search className="w-6 h-6 text-[var(--ispora-brand)]" strokeWidth={1.8} />
            </div>
            <h3 className="font-syne text-[15px] font-bold text-[var(--ispora-text)] mb-1.5">
              No opportunities found
            </h3>
            <p className="text-[13px] text-[var(--ispora-text3)]">
              Try adjusting your filters or search term
            </p>
          </div>
        ) : (
          // Opportunities Grid
          <>
            {featuredOpportunities.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-syne text-sm font-bold text-[var(--ispora-text)] flex items-center gap-2">
                    ⭐ Featured & Diaspora-Verified
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {featuredOpportunities.map((opp, index) => (
                    <OpportunityCard
                      key={opp.id}
                      opportunity={opp}
                      index={index}
                      isFeatured={true}
                      typeColors={typeColors}
                      typeLabels={typeLabels}
                      onToggleSave={toggleSave}
                      onOpenDetail={openDetail}
                      currentUserId={user?.id}
                      openMenuId={openMenuId}
                      onToggleMenu={setOpenMenuId}
                      onEdit={handleEditOpportunity}
                      onDelete={handleDeleteOpportunity}
                    />
                  ))}
                </div>
              </div>
            )}

            {regularOpportunities.length > 0 && (
              <div>
                {featuredOpportunities.length > 0 && (
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-syne text-sm font-bold text-[var(--ispora-text)]">All Opportunities</h2>
                    <div className="text-xs text-[var(--ispora-text3)]">{regularOpportunities.length} listings</div>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {regularOpportunities.map((opp, index) => (
                    <OpportunityCard
                      key={opp.id}
                      opportunity={opp}
                      index={index}
                      isFeatured={false}
                      typeColors={typeColors}
                      typeLabels={typeLabels}
                      onToggleSave={toggleSave}
                      onOpenDetail={openDetail}
                      currentUserId={user?.id}
                      openMenuId={openMenuId}
                      onToggleMenu={setOpenMenuId}
                      onEdit={handleEditOpportunity}
                      onDelete={handleDeleteOpportunity}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Post Opportunity Modal */}
      {showPostModal && (
        <div
          className="fixed inset-0 bg-[rgba(7,9,74,0.5)] backdrop-blur-sm flex items-center justify-center z-[1000] p-3 md:p-4"
          onClick={() => setShowPostModal(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-[95vw] md:max-w-[500px] shadow-[var(--ispora-shadow-lg)] max-h-[88vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white z-10 px-4 md:px-6 py-4 md:py-5 border-b border-[var(--ispora-border)] flex items-start justify-between">
              <div>
                <h3 className="font-syne text-base font-bold text-[var(--ispora-text)]">
                  {postForm.id ? 'Edit Opportunity' : 'Post an Opportunity'}
                </h3>
                <p className="text-xs text-[var(--ispora-text3)] mt-1">
                  {postForm.id ? 'Update the details of your opportunity' : 'Share something that could change a student\'s life'}
                </p>
              </div>
              <button
                onClick={handleClosePostModal}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--ispora-text3)] hover:bg-[var(--ispora-bg)] hover:text-[var(--ispora-text)] transition-colors"
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>

            <div className="px-4 md:px-6 py-4 md:py-5">
              {/* Only show diaspora-verified message for diaspora mentors */}
              {user?.mentorType === 'diaspora' && (
                <div className="bg-[var(--ispora-success-light)] border border-[rgba(16,185,129,0.3)] rounded-[10px] px-3.5 py-2.5 text-xs text-[#065f46] mb-3.5 flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-[var(--ispora-success)] flex-shrink-0" strokeWidth={2} />
                  As a <strong>diaspora mentor</strong>, your post will go live immediately and be marked as diaspora-verified.
                </div>
              )}
              {/* Show different message for home-based mentors */}
              {user?.mentorType === 'home' && (
                <div className="bg-[var(--ispora-brand-light)] border border-[var(--ispora-brand)]/20 rounded-[10px] px-3.5 py-2.5 text-xs text-[var(--ispora-text2)] mb-3.5 flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-[var(--ispora-brand)] flex-shrink-0" strokeWidth={2} />
                  As a <strong>home-based mentor</strong>, your post will be reviewed before going live.
                </div>
              )}

              {/* Form fields */}
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[var(--ispora-text2)] mb-1.5">Opportunity type</label>
                  <select 
                    value={postForm.type} 
                    onChange={(e) => setPostForm({...postForm, type: e.target.value})}
                    className="w-full border-[1.5px] border-[var(--ispora-border)] rounded-[10px] px-3.5 py-2.5 text-[13px] text-[var(--ispora-text)] bg-white outline-none transition-all focus:border-[var(--ispora-brand)] focus:shadow-[0_0_0_3px_rgba(2,31,246,0.07)]"
                  >
                    <option value="internship">Internship</option>
                    <option value="job">Graduate Job</option>
                    <option value="scholarship">Scholarship</option>
                    <option value="fellowship">Fellowship</option>
                    <option value="accelerator">Accelerator Programme</option>
                    <option value="hackathon">Hackathon</option>
                    <option value="conference">Conference / Event</option>
                    <option value="grant">Grant</option>
                    <option value="competition">Competition</option>
                    <option value="others">Others</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--ispora-text2)] mb-1.5">Title</label>
                  <input
                    type="text"
                    value={postForm.title}
                    onChange={(e) => setPostForm({...postForm, title: e.target.value})}
                    placeholder="e.g. Google BOLD Internship Programme 2026"
                    className="w-full border-[1.5px] border-[var(--ispora-border)] rounded-[10px] px-3.5 py-2.5 text-[13px] text-[var(--ispora-text)] bg-white outline-none transition-all focus:border-[var(--ispora-brand)] focus:shadow-[0_0_0_3px_rgba(2,31,246,0.07)] placeholder:text-[var(--ispora-text3)]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--ispora-text2)] mb-1.5">Organisation / Company</label>
                    <input
                      type="text"
                      value={postForm.org}
                      onChange={(e) => setPostForm({...postForm, org: e.target.value})}
                      placeholder="e.g. Google"
                      className="w-full border-[1.5px] border-[var(--ispora-border)] rounded-[10px] px-3.5 py-2.5 text-[13px] text-[var(--ispora-text)] bg-white outline-none transition-all focus:border-[var(--ispora-brand)] focus:shadow-[0_0_0_3px_rgba(2,31,246,0.07)] placeholder:text-[var(--ispora-text3)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--ispora-text2)] mb-1.5">Location / Country</label>
                    <input
                      type="text"
                      value={postForm.location}
                      onChange={(e) => setPostForm({...postForm, location: e.target.value})}
                      placeholder="e.g. London, UK or Remote"
                      className="w-full border-[1.5px] border-[var(--ispora-border)] rounded-[10px] px-3.5 py-2.5 text-[13px] text-[var(--ispora-text)] bg-white outline-none transition-all focus:border-[var(--ispora-brand)] focus:shadow-[0_0_0_3px_rgba(2,31,246,0.07)] placeholder:text-[var(--ispora-text3)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--ispora-text2)] mb-1.5">Field / Sector</label>
                    <select 
                      value={postForm.field}
                      onChange={(e) => setPostForm({...postForm, field: e.target.value})}
                      className="w-full border-[1.5px] border-[var(--ispora-border)] rounded-[10px] px-3.5 py-2.5 text-[13px] text-[var(--ispora-text)] bg-white outline-none transition-all focus:border-[var(--ispora-brand)] focus:shadow-[0_0_0_3px_rgba(2,31,246,0.07)]"
                    >
                      <option value="Software Engineering">Software Engineering</option>
                      <option value="Data Science">Data Science</option>
                      <option value="Product Management">Product Management</option>
                      <option value="Design">Design</option>
                      <option value="Finance">Finance</option>
                      <option value="Business">Business</option>
                      <option value="Health">Health</option>
                      <option value="Law">Law</option>
                      <option value="General / Any">General / Any</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--ispora-text2)] mb-1.5">Application deadline</label>
                    <input
                      type="date"
                      value={postForm.deadline}
                      onChange={(e) => setPostForm({...postForm, deadline: e.target.value})}
                      min="2026-03-27"
                      className="w-full border-[1.5px] border-[var(--ispora-border)] rounded-[10px] px-3.5 py-2.5 text-[13px] text-[var(--ispora-text)] bg-white outline-none transition-all focus:border-[var(--ispora-brand)] focus:shadow-[0_0_0_3px_rgba(2,31,246,0.07)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--ispora-text2)] mb-1.5">Eligibility</label>
                  <input
                    type="text"
                    value={postForm.eligibility}
                    onChange={(e) => setPostForm({...postForm, eligibility: e.target.value})}
                    placeholder="e.g. Nigerian students, final year, any nationality..."
                    className="w-full border-[1.5px] border-[var(--ispora-border)] rounded-[10px] px-3.5 py-2.5 text-[13px] text-[var(--ispora-text)] bg-white outline-none transition-all focus:border-[var(--ispora-brand)] focus:shadow-[0_0_0_3px_rgba(2,31,246,0.07)] placeholder:text-[var(--ispora-text3)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--ispora-text2)] mb-1.5">Compensation / Stipend (optional)</label>
                  <input
                    type="text"
                    value={postForm.salary}
                    onChange={(e) => setPostForm({...postForm, salary: e.target.value})}
                    placeholder="e.g. ₦150,000–₦200,000/month or Fully Funded or Unpaid"
                    className="w-full border-[1.5px] border-[var(--ispora-border)] rounded-[10px] px-3.5 py-2.5 text-[13px] text-[var(--ispora-text)] bg-white outline-none transition-all focus:border-[var(--ispora-brand)] focus:shadow-[0_0_0_3px_rgba(2,31,246,0.07)] placeholder:text-[var(--ispora-text3)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--ispora-text2)] mb-1.5">Description & how to apply</label>
                  <textarea
                    value={postForm.description}
                    onChange={(e) => setPostForm({...postForm, description: e.target.value})}
                    placeholder="Describe the opportunity, what students will gain, and how to apply. Be specific — students act on clear information."
                    className="w-full border-[1.5px] border-[var(--ispora-border)] rounded-[10px] px-3.5 py-2.5 text-[13px] text-[var(--ispora-text)] bg-white outline-none transition-all focus:border-[var(--ispora-brand)] focus:shadow-[0_0_0_3px_rgba(2,31,246,0.07)] placeholder:text-[var(--ispora-text3)] resize-vertical min-h-[100px] leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--ispora-text2)] mb-1.5">Application link (URL)</label>
                  <input
                    type="url"
                    value={postForm.link}
                    onChange={(e) => setPostForm({...postForm, link: e.target.value})}
                    placeholder="https://..."
                    className="w-full border-[1.5px] border-[var(--ispora-border)] rounded-[10px] px-3.5 py-2.5 text-[13px] text-[var(--ispora-text)] bg-white outline-none transition-all focus:border-[var(--ispora-brand)] focus:shadow-[0_0_0_3px_rgba(2,31,246,0.07)] placeholder:text-[var(--ispora-text3)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--ispora-text2)] mb-1.5">Insider tip (optional)</label>
                  <textarea
                    value={postForm.tip}
                    onChange={(e) => setPostForm({...postForm, tip: e.target.value})}
                    placeholder="Your personal insight — what makes this opportunity great, how to stand out, what the process is really like..."
                    className="w-full border-[1.5px] border-[var(--ispora-border)] rounded-[10px] px-3.5 py-2.5 text-[13px] text-[var(--ispora-text)] bg-white outline-none transition-all focus:border-[var(--ispora-brand)] focus:shadow-[0_0_0_3px_rgba(2,31,246,0.07)] placeholder:text-[var(--ispora-text3)] resize-vertical min-h-[70px] leading-relaxed"
                  />
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white z-10 px-6 py-3.5 border-t border-[var(--ispora-border)] flex justify-end gap-2.5">
              <button 
                onClick={handleClosePostModal}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-white text-[var(--ispora-text)] border-[1.5px] border-[var(--ispora-border)] rounded-[10px] text-[13px] font-semibold hover:border-[var(--ispora-brand)] hover:text-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] transition-all"
              >
                Save as Draft
              </button>
              <button 
                onClick={handlePostOpportunity}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-[var(--ispora-brand)] text-white rounded-[10px] text-[13px] font-semibold hover:bg-[var(--ispora-brand-hover)] hover:shadow-[0_4px_14px_rgba(2,31,246,0.25)] hover:-translate-y-0.5 transition-all"
              >
                <CheckCircle className="w-3.5 h-3.5" strokeWidth={2.5} />
                {postForm.id ? 'Update' : 'Post Live'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedOpportunity && (
        <div
          className="fixed inset-0 bg-[rgba(7,9,74,0.5)] backdrop-blur-sm flex items-center justify-center z-[1000] p-3 md:p-4"
          onClick={() => setShowDetailModal(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-[95vw] md:max-w-[500px] shadow-[var(--ispora-shadow-lg)] max-h-[88vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Blue Header */}
            <div className="sticky top-0 z-10 bg-[var(--ispora-brand)] px-6 py-5 rounded-t-2xl relative overflow-hidden">
              {/* Grid background */}
              <div 
                className="absolute inset-0 opacity-[0.04] pointer-events-none rounded-t-2xl"
                style={{
                  backgroundImage: 'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
                  backgroundSize: '24px 24px'
                }}
              />

              <div className="relative z-10">
                <div className="flex justify-end mb-2.5">
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/15 text-white hover:bg-white/25 transition-colors"
                  >
                    <X className="w-4 h-4" strokeWidth={2} />
                  </button>
                </div>

                <div className="flex gap-1.5 flex-wrap mb-2.5">
                  <span className={`text-[10px] font-medium px-2 py-1 rounded-full ${typeColors[selectedOpportunity.type]}`}>
                    {typeLabels[selectedOpportunity.type].toUpperCase()}
                  </span>
                  {selectedOpportunity.location.toLowerCase().includes('remote') && (
                    <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-[var(--ispora-success-light)] text-[var(--ispora-success)]">
                      Remote
                    </span>
                  )}
                  {selectedOpportunity.featured && (
                    <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-[var(--ispora-warn-light)] text-[#854d0e]">
                      ⭐ Featured
                    </span>
                  )}
                </div>

                <h3 className="font-syne text-lg font-extrabold text-white mb-1.5">{selectedOpportunity.title}</h3>
                <div className="flex items-center gap-1 text-xs text-white/70">
                  <Building2 className="w-3 h-3 text-white/60" strokeWidth={2} />
                  {selectedOpportunity.org}
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              <div className="space-y-4">
                {/* Quick Info */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[var(--ispora-bg)] rounded-xl p-3 border border-[var(--ispora-border)]">
                    <div className="flex items-center gap-1.5 text-[11px] text-[var(--ispora-text3)] mb-1">
                      <MapPin className="w-3 h-3" strokeWidth={2} />
                      Location
                    </div>
                    <div className="text-[13px] font-semibold text-[var(--ispora-text)]">{selectedOpportunity.location}</div>
                  </div>
                  <div className="bg-[var(--ispora-bg)] rounded-xl p-3 border border-[var(--ispora-border)]">
                    <div className="flex items-center gap-1.5 text-[11px] text-[var(--ispora-text3)] mb-1">
                      <Clock className={selectedOpportunity.deadlineUrgent ? 'w-3 h-3 text-[var(--ispora-danger)]' : 'w-3 h-3'} strokeWidth={2} />
                      Deadline
                    </div>
                    <div className={`text-[13px] font-semibold ${selectedOpportunity.deadlineUrgent ? 'text-[var(--ispora-danger)]' : 'text-[var(--ispora-text)]'}`}>
                      {selectedOpportunity.deadline}
                    </div>
                  </div>
                </div>

                {selectedOpportunity.salary && (
                  <div className="bg-[var(--ispora-bg)] rounded-xl p-3 border border-[var(--ispora-border)]">
                    <div className="flex items-center gap-1.5 text-[11px] text-[var(--ispora-text3)] mb-1">
                      <DollarSign className="w-3 h-3" strokeWidth={2} />
                      Compensation
                    </div>
                    <div className="text-[13px] font-semibold text-[var(--ispora-text)]">{selectedOpportunity.salary}</div>
                  </div>
                )}

                {/* Description */}
                <div>
                  <h4 className="text-xs font-semibold text-[var(--ispora-text2)] uppercase tracking-wider mb-2">About</h4>
                  <p className="text-[13px] text-[var(--ispora-text2)] leading-relaxed">{selectedOpportunity.desc}</p>
                </div>

                {/* Eligibility */}
                <div>
                  <h4 className="text-xs font-semibold text-[var(--ispora-text2)] uppercase tracking-wider mb-2">Eligibility</h4>
                  <p className="text-[13px] text-[var(--ispora-text2)] leading-relaxed">{selectedOpportunity.eligibility}</p>
                </div>

                {/* Insider Tip */}
                {selectedOpportunity.tip && (
                  <div className="bg-[var(--ispora-brand-light)] border border-[var(--ispora-brand)]/20 rounded-xl p-3.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--ispora-brand)] mb-1.5">
                      💡 Insider Tip
                    </div>
                    <p className="text-[13px] text-[var(--ispora-text2)] leading-relaxed">{selectedOpportunity.tip}</p>
                  </div>
                )}

                {/* Tags */}
                {selectedOpportunity.tags.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-[var(--ispora-text2)] uppercase tracking-wider mb-2">Skills & Tags</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedOpportunity.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-medium px-2 py-1 rounded-full bg-[#f1f5f9] text-[#475569]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Posted By */}
                <div className="pt-3 border-t border-[var(--ispora-border)]">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                      style={{ backgroundColor: selectedOpportunity.poster === 'ispora' ? 'var(--ispora-brand)' : 'var(--ispora-success)' }}
                    >
                      {selectedOpportunity.postedBy.charAt(0)}
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-[var(--ispora-text)]">{selectedOpportunity.postedBy}</div>
                      <div className="text-[10px] text-[var(--ispora-text3)]">{selectedOpportunity.postedByRole}</div>
                    </div>
                    <div className="ml-auto text-[11px] text-[var(--ispora-text3)]">{selectedOpportunity.postedAgo}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white z-10 px-6 py-3.5 border-t border-[var(--ispora-border)] flex gap-2">
              <button
                onClick={(e) => toggleSave(selectedOpportunity.id, e)}
                className={`flex items-center gap-1.5 px-4 py-2.5 border-[1.5px] rounded-[10px] text-[13px] font-semibold transition-all ${
                  selectedOpportunity.saved
                    ? 'bg-[var(--ispora-brand-light)] text-[var(--ispora-brand)] border-[var(--ispora-brand)]'
                    : 'bg-white text-[var(--ispora-text)] border-[var(--ispora-border)] hover:border-[var(--ispora-brand)] hover:text-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)]'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" strokeWidth={2.5} fill={selectedOpportunity.saved ? 'currentColor' : 'none'} />
                {selectedOpportunity.saved ? 'Saved' : 'Save'}
              </button>
              <button
                onClick={() => {
                  const url = `${window.location.origin}/opportunity/${selectedOpportunity.id}`;
                  navigator.clipboard.writeText(url);
                  toast.success('Link copied to clipboard!');
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 border-[1.5px] border-[var(--ispora-border)] rounded-[10px] text-[13px] font-semibold text-[var(--ispora-text)] hover:border-[var(--ispora-brand)] hover:text-[var(--ispora-brand)] transition-all"
              >
                <Share2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                Share
              </button>
              {(() => {
                // Use helper function to validate URL
                if (!isValidUrl(selectedOpportunity.link)) {
                  // Check if current user is the owner
                  const isOwner = user?.id && selectedOpportunity.postedById && 
                                  String(selectedOpportunity.postedById) === String(user.id);
                  
                  if (isOwner) {
                    return (
                      <button
                        onClick={() => {
                          handleEditOpportunity(selectedOpportunity);
                          setShowDetailModal(false);
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-orange-500 text-white rounded-[10px] text-[13px] font-semibold hover:bg-orange-600 transition-all"
                        title="Add application link"
                      >
                        <Edit className="w-3.5 h-3.5" strokeWidth={2.5} />
                        Add Application Link
                      </button>
                    );
                  }
                  
                  return (
                    <button
                      disabled
                      className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gray-300 text-gray-500 rounded-[10px] text-[13px] font-semibold cursor-not-allowed"
                      title="Application link not available"
                    >
                      <ExternalLink className="w-3.5 h-3.5" strokeWidth={2.5} />
                      Link Unavailable
                    </button>
                  );
                }

                // Normalize the URL to ensure it has a protocol
                const normalizedLink = normalizeUrl(selectedOpportunity.link);

                // Valid link - render the normal anchor
                return (
                  <a
                    href={normalizedLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[var(--ispora-brand)] text-white rounded-[10px] text-[13px] font-semibold hover:bg-[var(--ispora-brand-hover)] hover:shadow-[0_4px_14px_rgba(2,31,246,0.25)] hover:-translate-y-0.5 transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" strokeWidth={2.5} />
                    View & Apply
                  </a>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

// Opportunity Card Component
interface OpportunityCardProps {
  opportunity: Opportunity;
  index: number;
  isFeatured: boolean;
  typeColors: Record<OpportunityType, string>;
  typeLabels: Record<OpportunityType, string>;
  onToggleSave: (id: number, e: React.MouseEvent) => void;
  onOpenDetail: (opp: Opportunity) => void;
  currentUserId?: string;
  openMenuId: number | null;
  onToggleMenu: (id: number | null) => void;
  onEdit: (opp: Opportunity) => void;
  onDelete: (id: number) => void;
}

const OpportunityCard: React.FC<OpportunityCardProps> = ({
  opportunity,
  index,
  isFeatured,
  typeColors,
  typeLabels,
  onToggleSave,
  onOpenDetail,
  currentUserId,
  openMenuId,
  onToggleMenu,
  onEdit,
  onDelete
}) => {
  const descExcerpt = opportunity.desc.length > 100 ? opportunity.desc.slice(0, 100) + '...' : opportunity.desc;
  const posterColor = opportunity.poster === 'ispora' ? 'var(--ispora-brand)' : 'var(--ispora-success)';
  const isOwner = currentUserId && opportunity.postedById && String(opportunity.postedById) === String(currentUserId);
  const menuOpen = openMenuId === opportunity.id;

  return (
    <div
      onClick={() => onOpenDetail(opportunity)}
      className={`bg-white border-[1.5px] rounded-2xl overflow-hidden cursor-pointer transition-all hover:border-[var(--ispora-brand)] hover:shadow-[var(--ispora-shadow)] hover:-translate-y-0.5 flex flex-col ${
        isFeatured ? 'border-[rgba(2,31,246,0.3)] bg-gradient-to-br from-[var(--ispora-brand-light)] to-white' : 'border-[var(--ispora-border)]'
      }`}
      style={{ animationDelay: `${index * 0.04}s` }}
    >
      <div className="p-4 pb-3 flex-1">
        {/* Top Row: Type badge + Save button */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex gap-1.5 flex-wrap">
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${typeColors[opportunity.type] || typeColors.others}`}>
              {(typeLabels[opportunity.type] || 'Others').toUpperCase()}
            </span>
            {opportunity.location.toLowerCase().includes('remote') && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--ispora-success-light)] text-[var(--ispora-success)]">
                Remote
              </span>
            )}
            {isFeatured && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--ispora-warn-light)] text-[#854d0e]">
                ⭐ Featured
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {isOwner && (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleMenu(menuOpen ? null : opportunity.id);
                  }}
                  className="w-7 h-7 rounded-full border-[1.5px] border-[var(--ispora-border)] bg-[var(--ispora-bg)] hover:border-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] flex items-center justify-center transition-all flex-shrink-0"
                >
                  <MoreVertical className="w-3.5 h-3.5 text-[var(--ispora-text3)]" strokeWidth={2} />
                </button>
                
                {menuOpen && (
                  <div className="absolute top-full right-0 mt-1 bg-white border-[1.5px] border-[var(--ispora-border)] rounded-xl shadow-[var(--ispora-shadow-lg)] overflow-hidden z-50 min-w-[140px]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(opportunity);
                      }}
                      className="w-full px-3 py-2 text-left text-[13px] font-medium text-[var(--ispora-text)] hover:bg-[var(--ispora-bg)] transition-colors flex items-center gap-2"
                    >
                      <Edit className="w-3.5 h-3.5" strokeWidth={2} />
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(opportunity.id);
                      }}
                      className="w-full px-3 py-2 text-left text-[13px] font-medium text-[var(--ispora-danger)] hover:bg-[var(--ispora-danger-light)] transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
            <button
              onClick={(e) => onToggleSave(opportunity.id, e)}
              className={`w-7 h-7 rounded-full border-[1.5px] flex items-center justify-center transition-all flex-shrink-0 ${
                opportunity.saved
                  ? 'bg-[var(--ispora-brand-light)] border-[var(--ispora-brand)]'
                  : 'bg-[var(--ispora-bg)] border-[var(--ispora-border)] hover:border-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)]'
              }`}
            >
              <Bookmark
                className="w-3.5 h-3.5"
                strokeWidth={2}
                stroke={opportunity.saved ? 'var(--ispora-brand)' : 'var(--ispora-text3)'}
                fill={opportunity.saved ? 'var(--ispora-brand)' : 'none'}
              />
            </button>
          </div>
        </div>

        {/* Company Name */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <Building2 className="w-3 h-3 text-[var(--ispora-text3)] flex-shrink-0" strokeWidth={2} />
          <div className="text-[11px] text-[var(--ispora-text3)]">{opportunity.org}</div>
        </div>

        {/* Title */}
        <div className="font-syne text-sm font-bold text-[var(--ispora-text)] mb-2 leading-snug">
          {opportunity.title}
        </div>

        {/* Description */}
        <div className="text-xs text-[var(--ispora-text2)] leading-relaxed mb-2.5">
          {descExcerpt}
        </div>

        {/* Meta: location, salary, deadline */}
        <div className="flex flex-wrap gap-2.5 mb-2.5 text-[11px] text-[var(--ispora-text3)]">
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3" strokeWidth={2} />
            {opportunity.location}
          </div>
          {opportunity.salary && (
            <div className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" strokeWidth={2} />
              {opportunity.salary}
            </div>
          )}
          <div className={`flex items-center gap-1 ${opportunity.deadlineUrgent ? 'text-[var(--ispora-danger)] font-semibold' : ''}`}>
            <Clock className="w-3 h-3" strokeWidth={2} />
            {opportunity.deadlineUrgent ? 'Closes soon: ' : 'Deadline: '}
            {opportunity.deadline}
          </div>
        </div>

        {/* Skill Tags */}
        <div className="flex gap-1.5 flex-wrap">
          {opportunity.tags.map((tag, idx) => (
            <span key={idx} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#f1f5f9] text-[#475569]">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Card Footer */}
      <div className="px-4 py-2.5 border-t border-[var(--ispora-border)] flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div 
            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
            style={{ backgroundColor: posterColor }}
          >
            {opportunity.postedBy.charAt(0)}
          </div>
          <span className="text-[11px] text-[var(--ispora-text3)]">{opportunity.postedAgo}</span>
        </div>
        <div className="flex items-center gap-2">
          {opportunity.applicants > 0 && (
            <span className="text-[11px] text-[var(--ispora-text3)] font-medium">
              {opportunity.applicants} applicants
            </span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetail(opportunity);
            }}
            className="px-2.5 py-1 bg-[var(--ispora-brand)] text-white text-[11px] font-semibold rounded-lg hover:bg-[var(--ispora-brand-hover)] transition-all"
          >
            Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default Opportunities;
