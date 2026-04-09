import { Check, ArrowRight } from 'lucide-react';
import { UserRole, Screen } from '../AuthFlow';

interface LandingScreenProps {
  selectedRole: UserRole;
  onRoleSelect: (role: UserRole) => void;
  onNavigate: (screen: Screen) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function LandingScreen({
  selectedRole,
  onRoleSelect,
  onNavigate,
  showToast,
}: LandingScreenProps) {
  const handleGetStarted = () => {
    if (!selectedRole) {
      showToast('Please select a role to continue', 'error');
      return;
    }
    // If mentor role selected, go to mentor type selection
    if (selectedRole === 'diaspora') {
      onNavigate('mentortype');
    } else {
      // If student role, go directly to signup
      onNavigate('signup');
    }
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
          Welcome to Ispora
        </div>
        <div className="text-xs md:text-[13px] text-[var(--ispora-text3)] mb-5 md:mb-7 leading-relaxed">
          How would you like to get started? Choose the role that best describes you.
        </div>

        <div className="flex flex-col gap-2.5 mb-6">
          {/* Diaspora Professional */}
          <div
            onClick={() => onRoleSelect('diaspora')}
            className={`flex items-center gap-3.5 p-4 rounded-[13px] border-2 cursor-pointer transition-all ${
              selectedRole === 'diaspora'
                ? 'border-[var(--ispora-brand)] bg-[var(--ispora-brand-light)]'
                : 'border-[var(--ispora-border)] bg-[var(--ispora-bg)] hover:border-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)]'
            }`}
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 bg-[var(--ispora-brand-light)] transition-transform">
              🌍
            </div>
            <div className="flex-1">
              <div className="font-bold text-sm text-[var(--ispora-text)]">
                I Want to Be a Mentor
              </div>
              <div className="text-xs text-[var(--ispora-text3)] mt-0.5 leading-[1.4]">
                I want to mentor students, share opportunities and give back to Africa - whether from abroad or at home.
              </div>
            </div>
            <div
              className={`w-5 h-5 rounded-full bg-[var(--ispora-brand)] flex items-center justify-center flex-shrink-0 transition-all ${
                selectedRole === 'diaspora' ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
              }`}
            >
              <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
            </div>
          </div>

          {/* Student */}
          <div
            onClick={() => onRoleSelect('student')}
            className={`flex items-center gap-3.5 p-4 rounded-[13px] border-2 cursor-pointer transition-all ${
              selectedRole === 'student'
                ? 'border-[var(--ispora-brand)] bg-[var(--ispora-brand-light)]'
                : 'border-[var(--ispora-border)] bg-[var(--ispora-bg)] hover:border-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)]'
            }`}
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 bg-[var(--ispora-success-light)] transition-transform">
              🎓
            </div>
            <div className="flex-1">
              <div className="font-bold text-sm text-[var(--ispora-text)]">
                I am a Youth
              </div>
              <div className="text-xs text-[var(--ispora-text3)] mt-0.5 leading-[1.4]">
                I am based in Nigeria and looking for mentorship, career guidance and connections with diaspora professionals.
              </div>
            </div>
            <div
              className={`w-5 h-5 rounded-full bg-[var(--ispora-brand)] flex items-center justify-center flex-shrink-0 transition-all ${
                selectedRole === 'student' ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
              }`}
            >
              <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
            </div>
          </div>
        </div>

        <button
          onClick={handleGetStarted}
          disabled={!selectedRole}
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-[11px] bg-[var(--ispora-brand)] text-white text-sm font-bold cursor-pointer transition-all hover:bg-[var(--ispora-brand-hover)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(2,31,246,0.3)] disabled:bg-[var(--ispora-border)] disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none mt-5"
        >
          Get Started
          <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}