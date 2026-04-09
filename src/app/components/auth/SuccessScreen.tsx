import { Check, LayoutDashboard } from 'lucide-react';
import { UserRole, Screen } from '../AuthFlow';

interface SuccessScreenProps {
  firstName: string;
  selectedRole: UserRole;
  onNavigate: (screen: Screen) => void;
}

export default function SuccessScreen({
  firstName,
  selectedRole,
  onNavigate,
}: SuccessScreenProps) {
  return (
    <div className="flex flex-col min-h-full px-12 py-10">
      <div className="flex items-center justify-end mb-9 flex-shrink-0">
        <div />
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-[400px] w-full mx-auto">
        <div className="text-center py-5">
          <div className="w-[72px] h-[72px] bg-[var(--ispora-success-light)] rounded-full flex items-center justify-center mx-auto mb-5">
            <Check className="w-8 h-8 text-[var(--ispora-success)]" strokeWidth={2.5} />
          </div>
          
          <div className="font-syne text-2xl font-extrabold text-[var(--ispora-text)] mb-1.5 tracking-tight">
            Welcome to Ispora, {firstName}!
          </div>
          
          <div className="text-[13px] text-[var(--ispora-text3)] leading-relaxed mb-7">
            {selectedRole === 'diaspora'
              ? 'Your mentor profile is live. Students can now discover and connect with you.'
              : 'Your student profile is ready. Start browsing mentors and sending requests.'}
          </div>

          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center justify-center gap-2 w-full max-w-[300px] mx-auto py-3.5 rounded-[11px] bg-[var(--ispora-brand)] text-white text-sm font-bold cursor-pointer transition-all hover:bg-[var(--ispora-brand-hover)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(2,31,246,0.3)]"
          >
            <LayoutDashboard className="w-4 h-4" strokeWidth={2} />
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}