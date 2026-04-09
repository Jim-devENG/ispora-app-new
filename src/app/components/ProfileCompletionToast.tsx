import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { X, Target, Sparkles, TrendingUp } from 'lucide-react';

interface ProfileCompletionToastProps {
  onNavigateToProfile?: () => void;
}

export default function ProfileCompletionToast({ onNavigateToProfile }: ProfileCompletionToastProps) {
  const { user } = useAuth();
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  useEffect(() => {
    loadProfileAndCheckDisplay();
  }, []);

  const loadProfileAndCheckDisplay = async () => {
    try {
      const userProfile = await api.user.getUser(user?.id || '');
      const studentData = userProfile.user || userProfile;
      
      const { completion, missing } = calculateProfileCompletion(studentData);
      setProfileCompletion(completion);
      setMissingFields(missing);

      // Check if toast should be displayed
      const shouldShow = checkShouldDisplay(completion);
      if (shouldShow) {
        // Show after 3-5 seconds delay for better UX
        setTimeout(() => {
          setIsVisible(true);
        }, 3500);
      }
    } catch (error) {
      console.error('Error loading profile completion:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProfileCompletion = (profile: any) => {
    const fields = [
      { key: 'bio', value: profile.bio, weight: 20, label: 'Add your bio' },
      { key: 'skills', value: profile.skills?.length > 0, weight: 15, label: 'Add skills' },
      { key: 'university', value: profile.university, weight: 10, label: 'Add university' },
      { key: 'major', value: profile.major, weight: 10, label: 'Add major' },
      { key: 'location', value: profile.location, weight: 10, label: 'Add location' },
      { key: 'careerInterests', value: profile.careerInterests?.length > 0, weight: 15, label: 'Add career interests' },
      { key: 'lookingFor', value: profile.lookingFor?.length > 0, weight: 10, label: 'Add what you\'re looking for' },
      { key: 'linkedin', value: profile.linkedin, weight: 5, label: 'Connect LinkedIn' },
      { key: 'github', value: profile.github, weight: 2.5, label: 'Connect GitHub' },
      { key: 'portfolio', value: profile.portfolio, weight: 2.5, label: 'Add portfolio' },
    ];

    const completed = fields.reduce((total, field) => {
      return total + (field.value ? field.weight : 0);
    }, 0);

    // Get top 2 missing fields with highest weight
    const missing = fields
      .filter(field => !field.value)
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 2)
      .map(field => field.label);

    return { 
      completion: Math.round(completed),
      missing
    };
  };

  const checkShouldDisplay = (completion: number): boolean => {
    // Don't show if profile is well-completed (70%+)
    if (completion >= 70) {
      return false;
    }

    // Check localStorage for snooze/dismiss status
    const dismissData = localStorage.getItem('profileCompletionToast');
    if (!dismissData) {
      return true;
    }

    try {
      const data = JSON.parse(dismissData);
      const now = Date.now();
      const lastDismissed = data.lastDismissed || 0;
      const snoozeCount = data.snoozeCount || 0;

      // Calculate snooze duration based on completion and snooze count
      let snoozeDuration = 0;
      if (completion < 30) {
        // 0-30% complete: Show on every login (max 3 times), then 24h snooze
        if (snoozeCount < 3) {
          snoozeDuration = 0; // Show immediately
        } else {
          snoozeDuration = 24 * 60 * 60 * 1000; // 24 hours
        }
      } else if (completion < 70) {
        // 30-70% complete: Remind every 3 days
        snoozeDuration = 3 * 24 * 60 * 60 * 1000; // 3 days
      }

      // Check if snooze period has elapsed
      return (now - lastDismissed) > snoozeDuration;
    } catch (error) {
      return true;
    }
  };

  const handleDismiss = (type: 'snooze' | 'complete') => {
    const dismissData = {
      lastDismissed: Date.now(),
      snoozeCount: type === 'snooze' ? (getCurrentSnoozeCount() + 1) : 0,
      completion: profileCompletion
    };
    localStorage.setItem('profileCompletionToast', JSON.stringify(dismissData));
    setIsVisible(false);

    if (type === 'complete') {
      // Navigate to profile page
      onNavigateToProfile?.();
    }
  };

  const getCurrentSnoozeCount = (): number => {
    try {
      const dismissData = localStorage.getItem('profileCompletionToast');
      if (dismissData) {
        const data = JSON.parse(dismissData);
        return data.snoozeCount || 0;
      }
    } catch (error) {
      return 0;
    }
    return 0;
  };

  if (loading || !isVisible || profileCompletion >= 70) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-[slideInUp_0.5s_ease-out]">
      <div className="w-[340px] bg-white rounded-2xl shadow-2xl border-[1.5px] border-[#e5e7eb] overflow-hidden">
        {/* Close Button */}
        <button
          onClick={() => handleDismiss('snooze')}
          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors z-10"
          title="Remind me later"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-br from-[#fffbeb] to-[#fef3c7] px-4 py-3 border-b border-[#fbbf24]/20">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#fbbf24] to-[#f59e0b] flex items-center justify-center flex-shrink-0 mt-0.5">
              <TrendingUp className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex-1 pr-6">
              <h3 className="font-syne text-sm font-bold text-[#92400e] mb-0.5">
                🎯 Unlock Better Matches!
              </h3>
              <p className="text-[11px] text-[#78350f] leading-relaxed">
                <span className="font-bold">{profileCompletion}% complete</span> — Add more details for better mentor recommendations
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 py-3.5 bg-white">
          {/* Progress Bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Profile Progress</span>
              <span className="text-[10px] font-bold text-[#fbbf24]">{profileCompletion}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] rounded-full transition-all duration-500"
                style={{ width: `${profileCompletion}%` }}
              />
            </div>
          </div>

          {/* Missing Fields */}
          {missingFields.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                Quick Wins:
              </p>
              <div className="space-y-1">
                {missingFields.map((field, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-[11px] text-gray-700">
                    <Target className="w-3 h-3 text-[#fbbf24] flex-shrink-0" />
                    <span>{field}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => handleDismiss('snooze')}
              className="flex-1 px-3 py-2 text-[11px] font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
            >
              Later
            </button>
            <button
              onClick={() => handleDismiss('complete')}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] text-white text-[11px] font-bold rounded-lg hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <Sparkles className="w-3 h-3" />
              Complete Profile
            </button>
          </div>
        </div>

        {/* Footer Hint */}
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
          <p className="text-[9px] text-gray-500 text-center">
            {profileCompletion < 30 
              ? '🌱 Just getting started' 
              : profileCompletion < 70 
                ? '🚀 You\'re making progress!' 
                : '✨ Almost there!'
            } · {100 - profileCompletion}% to go
          </p>
        </div>
      </div>
    </div>
  );
}
