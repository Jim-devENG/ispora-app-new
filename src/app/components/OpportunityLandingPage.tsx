import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  Calendar,
  Clock,
  MapPin,
  Building2,
  Briefcase,
  DollarSign,
  Users,
  ExternalLink,
  Bookmark,
  Share2,
  Sparkles,
  ArrowRight,
  Tag,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  Eye,
  Clock as ClockIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '/utils/supabase/info';

type OpportunityType = 'internship' | 'job' | 'scholarship' | 'fellowship' | 'accelerator' | 'hackathon' | 'conference' | 'grant' | 'competition' | 'others';

const typeLabels: Record<OpportunityType, string> = {
  internship: 'Internship',
  job: 'Job',
  scholarship: 'Scholarship',
  fellowship: 'Fellowship',
  accelerator: 'Accelerator',
  hackathon: 'Hackathon',
  conference: 'Conference',
  grant: 'Grant',
  competition: 'Competition',
  others: 'Other'
};

const typeColors: Record<OpportunityType, string> = {
  internship: 'bg-blue-100 text-blue-700',
  job: 'bg-green-100 text-green-700',
  scholarship: 'bg-purple-100 text-purple-700',
  fellowship: 'bg-amber-100 text-amber-700',
  accelerator: 'bg-pink-100 text-pink-700',
  hackathon: 'bg-orange-100 text-orange-700',
  conference: 'bg-teal-100 text-teal-700',
  grant: 'bg-indigo-100 text-indigo-700',
  competition: 'bg-red-100 text-red-700',
  others: 'bg-gray-100 text-gray-700'
};

export default function OpportunityLandingPage() {
  const { opportunityId } = useParams();
  const navigate = useNavigate();
  const [opportunity, setOpportunity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadOpportunity();
  }, [opportunityId]);

  const loadOpportunity = async () => {
    try {
      setLoading(true);

      if (!opportunityId) {
        setError('No opportunity specified');
        setLoading(false);
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b8526fa6/public/opportunity/${opportunityId}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load opportunity');
      }

      const data = await response.json();
      setOpportunity(data.opportunity);
    } catch (error: any) {
      console.error('Error loading opportunity:', error);
      setError(error.message || 'Failed to load opportunity');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (opportunity?.link) {
      window.open(opportunity.link, '_blank');
    }
  };

  const handleJoin = () => {
    // Store the opportunity ID so we can auto-bookmark after signup/login
    localStorage.setItem('pendingOpportunityId', opportunityId!);
    // Redirect to auth page with signup mode for student role
    navigate('/auth?mode=signup&role=student');
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDaysUntilDeadline = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--ispora-brand-light)] via-white to-[var(--ispora-accent-light)] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-[var(--ispora-brand)] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-[var(--ispora-text2)]">Loading opportunity...</p>
        </div>
      </div>
    );
  }

  if (error || !opportunity) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--ispora-brand-light)] via-white to-[var(--ispora-accent-light)] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-xl">
          <div className="w-16 h-16 bg-[var(--ispora-danger-light)] rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">😕</span>
          </div>
          <h2 className="font-syne text-xl font-bold text-[var(--ispora-text)] mb-2">
            Opportunity Not Found
          </h2>
          <p className="text-[var(--ispora-text2)] mb-6">
            {error || 'This opportunity may have been removed or is no longer available.'}
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

  const daysUntilDeadline = opportunity.deadline ? getDaysUntilDeadline(opportunity.deadline) : null;
  const isDeadlineUrgent = daysUntilDeadline !== null && daysUntilDeadline <= 7 && daysUntilDeadline > 0;
  const isPastDeadline = daysUntilDeadline !== null && daysUntilDeadline <= 0;

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
            onClick={() => navigate('/auth')}
            className="px-4 py-2 bg-[var(--ispora-brand)] text-white rounded-lg font-semibold text-sm hover:shadow-md transition-all"
          >
            Sign In
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Opportunity Card */}
        <div className="bg-white rounded-2xl border-[1.5px] border-[var(--ispora-border)] shadow-lg overflow-hidden">
          {/* Header Section */}
          <div className="p-6 border-b border-[var(--ispora-border)]">
            <div className="flex flex-wrap items-start gap-3 mb-4">
              {/* Type Badge */}
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${typeColors[opportunity.type as OpportunityType] || typeColors.others}`}>
                {typeLabels[opportunity.type as OpportunityType] || 'Opportunity'}
              </span>
              {opportunity.featured && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                  ⭐ Featured
                </span>
              )}
              {isPastDeadline && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500">
                  Closed
                </span>
              )}
            </div>

            {/* Title & Org */}
            <h1 className="font-syne text-2xl md:text-3xl font-bold text-[var(--ispora-text)] mb-2">
              {opportunity.title}
            </h1>
            <div className="flex items-center gap-2 text-[var(--ispora-text2)]">
              <Building2 className="w-4 h-4" />
              <span className="font-semibold">{opportunity.org}</span>
            </div>
          </div>

          {/* Key Details Grid */}
          <div className="p-6 bg-[var(--ispora-bg)] grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Location */}
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[var(--ispora-text3)]" />
              <span className="text-sm text-[var(--ispora-text)]">{opportunity.location || 'Remote'}</span>
            </div>

            {/* Field */}
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[var(--ispora-text3)]" />
              <span className="text-sm text-[var(--ispora-text)]">{opportunity.field || 'General'}</span>
            </div>

            {/* Deadline */}
            {opportunity.deadline && (
              <div className="flex items-center gap-2">
                <Calendar className={`w-4 h-4 ${isDeadlineUrgent ? 'text-[var(--ispora-danger)]' : 'text-[var(--ispora-text3)]'}`} />
                <span className={`text-sm ${isDeadlineUrgent ? 'text-[var(--ispora-danger)] font-semibold' : 'text-[var(--ispora-text)]'}`}>
                  {isPastDeadline ? 'Closed' : daysUntilDeadline === 1 ? '1 day left' : daysUntilDeadline && daysUntilDeadline > 0 ? `${daysUntilDeadline} days left` : formatDate(opportunity.deadline)}
                </span>
              </div>
            )}

            {/* Salary/Stipend */}
            {opportunity.salary && (
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[var(--ispora-success)]" />
                <span className="text-sm text-[var(--ispora-text)]">{opportunity.salary}</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="p-6 border-t border-[var(--ispora-border)]">
            <h2 className="font-syne text-lg font-bold text-[var(--ispora-text)] mb-3">About this Opportunity</h2>
            <p className="text-[var(--ispora-text2)] leading-relaxed whitespace-pre-line">
              {opportunity.desc}
            </p>
          </div>

          {/* Eligibility */}
          {opportunity.eligibility && (
            <div className="p-6 border-t border-[var(--ispora-border)] bg-[var(--ispora-brand-light)]/30">
              <h2 className="font-syne text-lg font-bold text-[var(--ispora-text)] mb-3 flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Eligibility Requirements
              </h2>
              <p className="text-[var(--ispora-text2)] leading-relaxed whitespace-pre-line">
                {opportunity.eligibility}
              </p>
            </div>
          )}

          {/* Tips */}
          {opportunity.tip && (
            <div className="p-6 border-t border-[var(--ispora-border)] bg-amber-50">
              <h2 className="font-syne text-lg font-bold text-[var(--ispora-text)] mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                Tips for Success
              </h2>
              <p className="text-[var(--ispora-text2)] leading-relaxed whitespace-pre-line">
                {opportunity.tip}
              </p>
            </div>
          )}

          {/* Tags */}
          {opportunity.tags && opportunity.tags.length > 0 && (
            <div className="p-6 border-t border-[var(--ispora-border)]">
              <h2 className="font-syne text-sm font-bold text-[var(--ispora-text3)] uppercase tracking-wider mb-3">Skills & Tags</h2>
              <div className="flex flex-wrap gap-2">
                {opportunity.tags.map((tag: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-[var(--ispora-bg)] text-[var(--ispora-text2)] text-xs font-medium rounded-full border border-[var(--ispora-border)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Posted By */}
          {opportunity.poster && (
            <div className="p-6 border-t border-[var(--ispora-border)]">
              <h2 className="font-syne text-sm font-bold text-[var(--ispora-text3)] uppercase tracking-wider mb-3">Posted By</h2>
              <div className="flex items-center gap-3">
                {opportunity.poster.profilePicture ? (
                  <img
                    src={opportunity.poster.profilePicture}
                    alt={`${opportunity.poster.firstName} ${opportunity.poster.lastName}`}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[var(--ispora-brand)] flex items-center justify-center text-white font-bold text-sm">
                    {opportunity.poster.firstName?.[0]}{opportunity.poster.lastName?.[0]}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-[var(--ispora-text)]">
                    {opportunity.poster.firstName} {opportunity.poster.lastName}
                  </p>
                  <p className="text-xs text-[var(--ispora-text3)]">{opportunity.postedByRole}</p>
                </div>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="p-6 border-t border-[var(--ispora-border)] bg-[var(--ispora-bg)] flex items-center gap-6 text-sm text-[var(--ispora-text3)]">
            <div className="flex items-center gap-1.5">
              <Eye className="w-4 h-4" />
              <span>{opportunity.views || 0} views</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span>{opportunity.applicants || 0} applicants</span>
            </div>
            {opportunity.createdAt && (
              <div className="flex items-center gap-1.5">
                <ClockIcon className="w-4 h-4" />
                <span>Posted {formatDate(opportunity.createdAt)}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="p-6 border-t border-[var(--ispora-border)] flex flex-col sm:flex-row gap-3">
            {!isPastDeadline && opportunity.link && (
              <button
                onClick={handleApply}
                className="flex-1 px-6 py-3 bg-[var(--ispora-brand)] text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Apply Now
              </button>
            )}
            <button
              onClick={handleJoin}
              className="flex-1 px-6 py-3 border-[1.5px] border-[var(--ispora-brand)] text-[var(--ispora-brand)] rounded-xl font-semibold hover:bg-[var(--ispora-brand-light)] transition-all flex items-center justify-center gap-2"
            >
              <Bookmark className="w-4 h-4" />
              Join Ispora to Save
            </button>
            <button
              onClick={handleShare}
              className="px-6 py-3 border-[1.5px] border-[var(--ispora-border)] text-[var(--ispora-text2)] rounded-xl font-semibold hover:border-[var(--ispora-brand)] hover:text-[var(--ispora-brand)] transition-all flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-8 bg-gradient-to-r from-[var(--ispora-brand)] to-[var(--ispora-accent)] rounded-2xl p-6 text-white text-center">
          <h2 className="font-syne text-xl font-bold mb-2">
            Join Ispora Today
          </h2>
          <p className="text-white/80 mb-4">
            Connect with mentors from Africa and the African diaspora. Get personalized guidance on your career journey.
          </p>
          <button
            onClick={() => navigate('/auth?mode=signup&role=student')}
            className="px-6 py-3 bg-white text-[var(--ispora-brand)] rounded-xl font-semibold hover:shadow-lg transition-all inline-flex items-center gap-2"
          >
            Create Free Account
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[var(--ispora-border)] py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm text-[var(--ispora-text3)]">
            © {new Date().getFullYear()} Ispora. Connecting African youth with global opportunities.
          </p>
        </div>
      </footer>
    </div>
  );
}
