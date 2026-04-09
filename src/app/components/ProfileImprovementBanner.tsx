import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { TrendingUp, Target, Sparkles, ArrowRight, X } from 'lucide-react';

interface ProfileImprovementBannerProps {
  onNavigateToProfile?: () => void;
}

export default function ProfileImprovementBanner({ onNavigateToProfile }: ProfileImprovementBannerProps) {
  const { user } = useAuth();
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfileCompletion();
  }, []);

  const loadProfileCompletion = async () => {
    try {
      const userProfile = await api.user.getUser(user?.id || '');
      const studentData = userProfile.user || userProfile;
      
      const completion = calculateProfileCompletion(studentData);
      setProfileCompletion(completion);
    } catch (error) {
      console.error('Error loading profile completion:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProfileCompletion = (profile: any) => {
    const fields = [
      { value: profile.bio, weight: 20 },
      { value: profile.skills?.length > 0, weight: 15 },
      { value: profile.university, weight: 10 },
      { value: profile.major, weight: 10 },
      { value: profile.location, weight: 10 },
      { value: profile.careerInterests?.length > 0, weight: 15 },
      { value: profile.lookingFor?.length > 0, weight: 10 },
      { value: profile.linkedin, weight: 5 },
      { value: profile.github, weight: 2.5 },
      { value: profile.portfolio, weight: 2.5 },
    ];

    const completed = fields.reduce((total, field) => {
      return total + (field.value ? field.weight : 0);
    }, 0);

    return Math.round(completed);
  };

  // Don't show if dismissed, loading, or profile is already well-completed (70%+)
  if (loading || isDismissed || profileCompletion >= 70) {
    return null;
  }

  const getMissingFields = () => {
    // Return suggestions based on what's missing
    const suggestions = [];
    if (profileCompletion < 40) {
      suggestions.push('Add career interests');
      suggestions.push('Complete your bio');
    } else if (profileCompletion < 70) {
      suggestions.push('Add more skills');
      suggestions.push('Connect LinkedIn');
    }
    return suggestions;
  };

  const missingFields = getMissingFields();

  return (
    <div className="bg-gradient-to-br from-[#fffbeb] to-[#fef3c7] border-[1.5px] border-[#fbbf24] rounded-2xl p-5 relative overflow-hidden">
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: 'linear-gradient(rgba(251,191,36,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(251,191,36,0.3) 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}
      />
      
      {/* Floating Orb */}
      <div className="absolute -top-8 -right-8 w-32 h-32 bg-[#fbbf24]/10 rounded-full" />
      
      {/* Dismiss Button */}
      <button
        onClick={() => setIsDismissed(true)}
        className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/50 hover:bg-white flex items-center justify-center transition-colors z-10"
      >
        <X className="w-3.5 h-3.5 text-[#92400e]" />
      </button>

      <div className="relative">
        {/* Icon & Title */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#fbbf24] to-[#f59e0b] flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <h3 className="font-syne text-base font-bold text-[#92400e] mb-1">
              🎯 Unlock Better Matches!
            </h3>
            <p className="text-xs text-[#78350f] leading-relaxed">
              Your profile is <span className="font-bold">{profileCompletion}% complete</span>. 
              Add more details to get even more accurate mentor recommendations tailored to your goals.
            </p>
          </div>
        </div>

        {/* Missing Fields */}
        {missingFields.length > 0 && (
          <div className="mb-3 pl-13">
            <p className="text-[11px] font-semibold text-[#92400e] mb-1.5 uppercase tracking-wide">
              Quick wins:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {missingFields.map((field, idx) => (
                <div key={idx} className="flex items-center gap-1 text-[11px] text-[#78350f] bg-white/60 px-2 py-0.5 rounded-full">
                  <Target className="w-2.5 h-2.5" />
                  {field}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-4 pl-13">
          <div className="h-2 bg-white/60 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] rounded-full transition-all duration-500"
              style={{ width: `${profileCompletion}%` }}
            />
          </div>
          <p className="text-[10px] text-[#78350f] mt-1">
            {profileCompletion < 50 ? '🌱 Getting started' : '🚀 Almost there!'} · {100 - profileCompletion}% to complete
          </p>
        </div>

        {/* CTA Button */}
        <div className="pl-13">
          <button
            onClick={() => onNavigateToProfile ? onNavigateToProfile() : window.open('/app?page=profile', '_blank')}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] text-white text-xs font-bold rounded-lg hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Complete My Profile
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
