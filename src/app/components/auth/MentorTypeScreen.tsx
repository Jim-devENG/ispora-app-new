import { Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { Screen, UserRole } from '../AuthFlow';
import { useState } from 'react';

export type MentorType = 'diaspora' | 'home' | null;

interface MentorTypeScreenProps {
  selectedRole: UserRole;
  onNavigate: (screen: Screen) => void;
  onMentorTypeSelect: (type: 'diaspora' | 'home') => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function MentorTypeScreen({
  selectedRole,
  onNavigate,
  onMentorTypeSelect,
  showToast,
}: MentorTypeScreenProps) {
  const [selectedType, setSelectedType] = useState<MentorType>(null);

  const handleContinue = () => {
    if (!selectedType) {
      showToast('Please select a mentor type to continue', 'error');
      return;
    }
    onMentorTypeSelect(selectedType);
    onNavigate('signup');
  };

  return (
    <div className="flex flex-col min-h-full px-6 md:px-12 py-6 md:py-10">
      <div className="flex items-center justify-end mb-6 md:mb-9 flex-shrink-0">
        <div className="text-xs md:text-[13px] text-[var(--ispora-text3)]">
          Already have an account?{' '}
          <button
            onClick={() => onNavigate('signin')}
            className="text-[var(--ispora-brand)] font-semibold hover:underline"
          >
            Sign in
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-[400px] w-full mx-auto">
        <div className="font-syne text-xl md:text-2xl font-extrabold text-[var(--ispora-text)] mb-1.5 tracking-tight">
          Choose Your Mentor Type
        </div>
        <div className="text-xs md:text-[13px] text-[var(--ispora-text3)] mb-5 md:mb-7 leading-relaxed">
          Tell us where you're based so we can personalize your mentoring experience.
        </div>

        <div className="flex flex-col gap-2.5 mb-6">
          {/* Diaspora Mentor */}
          <div
            onClick={() => setSelectedType('diaspora')}
            className={`flex items-center gap-3.5 p-4 rounded-[13px] border-2 cursor-pointer transition-all ${
              selectedType === 'diaspora'
                ? 'border-[var(--ispora-brand)] bg-[var(--ispora-brand-light)]'
                : 'border-[var(--ispora-border)] bg-[var(--ispora-bg)] hover:border-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)]'
            }`}
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 bg-[var(--ispora-brand-light)] transition-transform">
              ✈️
            </div>
            <div className="flex-1">
              <div className="font-bold text-sm text-[var(--ispora-text)]">
                Diaspora Mentor
              </div>
              <div className="text-xs text-[var(--ispora-text3)] mt-0.5 leading-[1.4]">
                I live abroad and want to mentor students back home, share global opportunities and bring international perspectives.
              </div>
            </div>
            <div
              className={`w-5 h-5 rounded-full bg-[var(--ispora-brand)] flex items-center justify-center flex-shrink-0 transition-all ${
                selectedType === 'diaspora' ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
              }`}
            >
              <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
            </div>
          </div>

          {/* Home-Based Mentor */}
          <div
            onClick={() => setSelectedType('home')}
            className={`flex items-center gap-3.5 p-4 rounded-[13px] border-2 cursor-pointer transition-all ${
              selectedType === 'home'
                ? 'border-[var(--ispora-brand)] bg-[var(--ispora-brand-light)]'
                : 'border-[var(--ispora-border)] bg-[var(--ispora-bg)] hover:border-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)]'
            }`}
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 bg-[var(--ispora-success-light)] transition-transform">
              🏠
            </div>
            <div className="flex-1">
              <div className="font-bold text-sm text-[var(--ispora-text)]">
                Home-Based Mentor
              </div>
              <div className="text-xs text-[var(--ispora-text3)] mt-0.5 leading-[1.4]">
                I live in Nigeria and want to mentor students, share local opportunities and make an impact within my community.
              </div>
            </div>
            <div
              className={`w-5 h-5 rounded-full bg-[var(--ispora-brand)] flex items-center justify-center flex-shrink-0 transition-all ${
                selectedType === 'home' ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
              }`}
            >
              <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
            </div>
          </div>
        </div>

        <button
          onClick={handleContinue}
          disabled={!selectedType}
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-[11px] bg-[var(--ispora-brand)] text-white text-sm font-bold cursor-pointer transition-all hover:bg-[var(--ispora-brand-hover)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(2,31,246,0.3)] disabled:bg-[var(--ispora-border)] disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none mt-5"
        >
          Continue
          <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
        </button>

        <button
          onClick={() => onNavigate('landing')}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-[11px] bg-white text-[var(--ispora-text)] text-[13px] font-semibold cursor-pointer transition-all border-[1.5px] border-[var(--ispora-border)] hover:border-[var(--ispora-brand)] hover:text-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] mt-2.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
          Back
        </button>
      </div>
    </div>
  );
}