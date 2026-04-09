import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Badge as BadgeUI } from './ui/badge';
import { ImpactStats, Badge } from '../types';
import { 
  Award,
  Share2,
  Copy,
  CheckCircle2,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { projectId } from '/utils/supabase/info';

interface ImpactDashboardProps {
  userRole: 'diaspora' | 'student';
}

export function ImpactDashboard({ userRole }: ImpactDashboardProps) {
  const [stats, setStats] = useState<ImpactStats | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingBadges, setCheckingBadges] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const accessToken = localStorage.getItem('ispora_access_token');
      if (!accessToken) {
        toast.error('Please sign in to view impact data');
        setLoading(false);
        return;
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      };

      const apiBase = `https://${projectId}.supabase.co/functions/v1/make-server-b8526fa6`;
      
      // Load impact stats
      const statsResponse = await fetch(`${apiBase}/users/impact-stats`, { headers });
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.stats);
      }

      // Load badges
      const badgesResponse = await fetch(`${apiBase}/users/badges`, { headers });
      if (badgesResponse.ok) {
        const badgesData = await badgesResponse.json();
        setBadges(badgesData.badges);
        
        if (badgesData.newBadges && badgesData.newBadges.length > 0) {
          toast.success(
            `🎉 You earned ${badgesData.newBadges.length} new badge${badgesData.newBadges.length > 1 ? 's' : ''}!`,
            {
              description: badgesData.newBadges.map((b: Badge) => b.name).join(', ')
            }
          );
        }
      }
    } catch (error) {
      console.error('Error loading impact data:', error);
      toast.error('Failed to load impact data');
    } finally {
      setLoading(false);
    }
  };

  const checkForNewBadges = async () => {
    try {
      setCheckingBadges(true);
      
      const accessToken = localStorage.getItem('ispora_access_token');
      if (!accessToken) {
        toast.error('Please sign in');
        return;
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      };

      const apiBase = `https://${projectId}.supabase.co/functions/v1/make-server-b8526fa6`;
      
      console.log('Checking for badges at:', `${apiBase}/users/badges/check`);
      
      const response = await fetch(`${apiBase}/users/badges/check`, { 
        method: 'POST',
        headers 
      });
      
      console.log('Badge check response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Badge check error response:', errorText);
        toast.error(`Failed to check badges: ${response.status}`);
        return;
      }
      
      const data = await response.json();
      console.log('Badge check data:', data);
      
      if (data.newBadges && data.newBadges.length > 0) {
        toast.success(data.message, {
          description: data.newBadges.map((b: Badge) => `${b.icon} ${b.name}`).join('\n')
        });
        
        const badgesResponse = await fetch(`${apiBase}/users/badges`, { headers });
        if (badgesResponse.ok) {
          const badgesData = await badgesResponse.json();
          setBadges(badgesData.badges);
        }
      } else {
        toast.info(data.message);
      }
    } catch (error: any) {
      console.error('Error checking badges:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      toast.error(`Failed to check for new badges: ${error.message}`);
    } finally {
      setCheckingBadges(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading your {userRole === 'diaspora' ? 'impact' : 'journey'}...</p>
        </div>
      </div>
    );
  }

  if (userRole === 'diaspora') {
    return <MentorImpactCard 
      stats={stats} 
      badges={badges} 
      onCheckBadges={checkForNewBadges}
      checkingBadges={checkingBadges}
    />;
  } else {
    return <YouthJourneyCard 
      stats={stats} 
      badges={badges} 
      onCheckBadges={checkForNewBadges}
      checkingBadges={checkingBadges}
    />;
  }
}

interface CardProps {
  stats: ImpactStats | null;
  badges: Badge[];
  onCheckBadges: () => void;
  checkingBadges: boolean;
}

function MentorImpactCard({ stats, badges, onCheckBadges, checkingBadges }: CardProps) {
  const activeSince = stats?.activeSince ? new Date(stats.activeSince).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently';
  const [showShareModal, setShowShareModal] = useState(false);

  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin);
    toast.success('Link copied to clipboard!');
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Single White Card */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white md:p-8 p-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 md:text-4xl text-2xl">MY IMPACT</h1>
              <p className="text-blue-100 md:text-base text-sm">Empowering Nigeria's Next Generation</p>
              <p className="text-sm text-blue-200 mt-4 md:text-sm text-xs">Active since {activeSince}</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="p-8 bg-gray-50 md:p-8 p-4">
          <div className="grid grid-cols-4 gap-px bg-gray-200 rounded-lg overflow-hidden">
            <StatCell label="Youths Mentored" value={stats?.totalYouthsMentored || 0} />
            <StatCell label="Sessions Completed" value={stats?.totalSessionsCompleted || 0} />
            <StatCell label="Hours Given" value={`${stats?.totalHoursGiven || 0}h`} />
            <StatCell label="States Reached" value={stats?.statesReached || 0} />
          </div>
        </div>

        {/* Mentorship Milestones */}
        <div className="px-8 py-6 border-t border-gray-200">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">Mentorship Milestones</h2>
          <div className="space-y-3">
            <MilestoneRow 
              label="First Mentee Onboarded" 
              status={stats?.totalYouthsMentored && stats.totalYouthsMentored > 0 ? "Completed" : "In Progress"} 
            />
            <MilestoneRow 
              label="10 Sessions Completed" 
              status={stats?.totalSessionsCompleted && stats.totalSessionsCompleted >= 10 ? "Completed" : "In Progress"} 
            />
            <MilestoneRow 
              label="Multiple States Reached" 
              status={stats?.statesReached && stats.statesReached > 1 ? "Completed" : "In Progress"} 
            />
            <MilestoneRow 
              label="50+ Hours Given" 
              status={stats?.totalHoursGiven && stats.totalHoursGiven >= 50 ? "Completed" : "In Progress"} 
            />
            <MilestoneRow 
              label="5+ Active Mentorships" 
              status={stats?.activeMentorships && stats.activeMentorships >= 5 ? "Completed" : "In Progress"} 
            />
          </div>
        </div>

        {/* Badges */}
        {badges.length > 0 && (
          <div className="px-8 py-6 border-t border-gray-200">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Achievements ({badges.length} Badges)</h2>
            <div className="flex flex-wrap gap-3">
              {badges.slice(0, 12).map((badge) => (
                <div
                  key={badge.id}
                  className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2"
                  title={badge.description}
                >
                  <span className="text-xl">{badge.icon}</span>
                  <span className="text-sm font-medium text-gray-700">{badge.name}</span>
                </div>
              ))}
              {badges.length > 12 && (
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                  <span className="text-sm font-medium text-gray-500">+{badges.length - 12} more</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="px-8 py-6 bg-gray-50 border-t border-gray-200 md:px-8 px-4">
          <div className="flex md:flex-row flex-col md:items-center items-start md:justify-between md:gap-0 gap-4">
            <p className="text-sm text-gray-600 md:text-sm text-xs">
              💡 <strong>Screenshot this card</strong> and share on LinkedIn to inspire others!
            </p>
            <div className="flex md:flex-row flex-col md:gap-3 gap-2 w-full md:w-auto">
              <Button 
                onClick={onCheckBadges} 
                disabled={checkingBadges}
                variant="outline"
                size="sm"
                className="w-full md:w-auto"
              >
                <Award className="w-4 h-4 mr-2" />
                {checkingBadges ? 'Checking...' : 'Check Badges'}
              </Button>
              <div className="flex gap-2">
                <Button 
                  onClick={handleCopyLink}
                  variant="outline"
                  size="sm"
                  className="flex-1 md:flex-none"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link
                </Button>
                <Button 
                  onClick={handleShare}
                  className="bg-blue-600 hover:bg-blue-700 text-white flex-1 md:flex-none"
                  size="sm"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Impact
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal 
          stats={stats} 
          badges={badges}
          userRole="mentor"
          onClose={() => setShowShareModal(false)} 
        />
      )}
    </div>
  );
}

function YouthJourneyCard({ stats, badges, onCheckBadges, checkingBadges }: CardProps) {
  const activeSince = stats?.activeSince ? new Date(stats.activeSince).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently';
  const [showShareModal, setShowShareModal] = useState(false);

  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin);
    toast.success('Link copied to clipboard!');
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Single White Card */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white md:p-8 p-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 md:text-4xl text-2xl">MY JOURNEY</h1>
              <p className="text-blue-100 md:text-base text-sm">Building My Future, One Session at a Time</p>
              <p className="text-sm text-blue-200 mt-4 md:text-sm text-xs">Learning since {activeSince}</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="p-8 bg-gray-50 md:p-8 p-4">
          <div className="grid grid-cols-4 gap-px bg-gray-200 rounded-lg overflow-hidden">
            <StatCell label="Sessions Attended" value={stats?.sessionsAttended || 0} />
            <StatCell label="Mentors Connected" value={stats?.mentorsConnected || 0} />
            <StatCell label="Goals Achieved" value={stats?.goalsCompleted || 0} />
            <StatCell label="Skills Learned" value={stats?.skillsDeveloped?.length || 0} />
          </div>
        </div>

        {/* Career Milestones - Updated */}
        <div className="px-8 py-6 border-t border-gray-200">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">Career Milestones</h2>
          <div className="space-y-3">
            <MilestoneRow 
              label="Interview Preparation" 
              status={stats?.hasCompletedInterviewPrep ? "Completed" : "In Progress"} 
            />
            <MilestoneRow 
              label="Job Secured" 
              status={stats?.hasSecuredJob ? "Completed" : "In Progress"} 
            />
            <MilestoneRow 
              label="Internship Secured" 
              status={stats?.hasSecuredInternship ? "Completed" : "In Progress"} 
            />
            <MilestoneRow 
              label="Career Program Completed" 
              status={stats?.hasCompletedCareerProgram ? "Completed" : "In Progress"} 
            />
            <MilestoneRow 
              label="First Mentorship Session" 
              status={stats?.sessionsAttended && stats.sessionsAttended > 0 ? "Completed" : "In Progress"} 
            />
          </div>
        </div>

        {/* Badges */}
        {badges.length > 0 && (
          <div className="px-8 py-6 border-t border-gray-200">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Achievements ({badges.length} Badges)</h2>
            <div className="flex flex-wrap gap-3">
              {badges.slice(0, 12).map((badge) => (
                <div
                  key={badge.id}
                  className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2"
                  title={badge.description}
                >
                  <span className="text-xl">{badge.icon}</span>
                  <span className="text-sm font-medium text-gray-700">{badge.name}</span>
                </div>
              ))}
              {badges.length > 12 && (
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                  <span className="text-sm font-medium text-gray-500">+{badges.length - 12} more</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="px-8 py-6 bg-gray-50 border-t border-gray-200 md:px-8 px-4">
          <div className="flex md:flex-row flex-col md:items-center items-start md:justify-between md:gap-0 gap-4">
            <p className="text-sm text-gray-600 md:text-sm text-xs">
              💡 <strong>Screenshot this card</strong> and share on Twitter/WhatsApp to inspire your friends!
            </p>
            <div className="flex md:flex-row flex-col md:gap-3 gap-2 w-full md:w-auto">
              <Button 
                onClick={onCheckBadges} 
                disabled={checkingBadges}
                variant="outline"
                size="sm"
                className="w-full md:w-auto"
              >
                <Award className="w-4 h-4 mr-2" />
                {checkingBadges ? 'Checking...' : 'Check Badges'}
              </Button>
              <div className="flex gap-2">
                <Button 
                  onClick={handleCopyLink}
                  variant="outline"
                  size="sm"
                  className="flex-1 md:flex-none"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link
                </Button>
                <Button 
                  onClick={handleShare}
                  className="bg-blue-600 hover:bg-blue-700 text-white flex-1 md:flex-none"
                  size="sm"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Journey
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal 
          stats={stats} 
          badges={badges}
          userRole="youth"
          onClose={() => setShowShareModal(false)} 
        />
      )}
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white p-4 text-center md:p-4 p-2">
      <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide md:text-xs text-[9px] leading-tight">{label}</p>
      <p className="text-2xl font-bold text-gray-900 md:text-2xl text-lg">{value}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-700">{label}</span>
      <span className="text-sm font-semibold text-gray-900">{value}</span>
    </div>
  );
}

function MilestoneRow({ label, status }: { label: string; status: string }) {
  const isCompleted = status === "Completed";
  
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-700">{label}</span>
      {isCompleted ? (
        <div className="flex items-center gap-1 text-green-600">
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-sm font-medium">Completed</span>
        </div>
      ) : (
        <BadgeUI variant="secondary" className="text-xs">
          In Progress
        </BadgeUI>
      )}
    </div>
  );
}

interface ShareModalProps {
  stats: ImpactStats | null;
  badges: Badge[];
  userRole: 'youth' | 'mentor';
  onClose: () => void;
}

function ShareModal({ stats, badges, userRole, onClose }: ShareModalProps) {
  const shareUrl = window.location.origin;
  
  const shareMessage = userRole === 'youth' 
    ? `Celebrating my learning journey on Ispora! 🎉\n\n✓ ${stats?.sessionsAttended || 0} sessions attended\n✓ ${stats?.mentorsConnected || 0} mentors guiding me\n✓ ${stats?.goalsCompleted || 0} goals achieved\n✓ ${badges.length} badges earned\n\nBuilding my future, one session at a time. Join me at ${shareUrl}`
    : `Just reviewed my impact on Ispora! 🌟\n\n✓ ${stats?.totalYouthsMentored || 0} youths mentored\n✓ ${stats?.totalSessionsCompleted || 0} sessions completed\n✓ ${stats?.totalHoursGiven || 0} hours given\n✓ ${badges.length} badges earned\n\nProud to be empowering Nigeria's next generation of professionals. Join me at ${shareUrl}`;

  const encodedMessage = encodeURIComponent(shareMessage);
  const encodedUrl = encodeURIComponent(shareUrl);

  const socialLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedMessage}`,
    whatsapp: `https://wa.me/?text=${encodedMessage}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedMessage}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
  };

  const handleSocialShare = (platform: keyof typeof socialLinks) => {
    window.open(socialLinks[platform], '_blank', 'width=600,height=400');
    toast.success(`Opening ${platform.charAt(0).toUpperCase() + platform.slice(1)}...`);
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(shareMessage);
    toast.success('Message copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Share Your {userRole === 'youth' ? 'Journey' : 'Impact'}</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          Share your progress with friends and inspire others to join Ispora!
        </p>

        {/* Social Media Buttons */}
        <div className="space-y-3 mb-6">
          <Button
            onClick={() => handleSocialShare('twitter')}
            className="w-full bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
            </svg>
            Share on Twitter
          </Button>

          <Button
            onClick={() => handleSocialShare('whatsapp')}
            className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            Share on WhatsApp
          </Button>

          <Button
            onClick={() => handleSocialShare('facebook')}
            className="w-full bg-[#1877F2] hover:bg-[#166fe5] text-white"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Share on Facebook
          </Button>

          <Button
            onClick={() => handleSocialShare('linkedin')}
            className="w-full bg-[#0A66C2] hover:bg-[#095196] text-white"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            Share on LinkedIn
          </Button>
        </div>

        {/* Copy Message Button */}
        <div className="border-t border-gray-200 pt-4">
          <Button
            onClick={handleCopyMessage}
            variant="outline"
            className="w-full"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy Share Message
          </Button>
        </div>
      </div>
    </div>
  );
}