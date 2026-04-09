import { useState } from 'react';
import { Mail, ArrowLeft } from 'lucide-react';
import { authAPI } from '../../utils/api';
import { Screen } from '../AuthFlow';

interface ForgotPasswordScreenProps {
  onNavigate: (screen: Screen) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function ForgotPasswordScreen({
  onNavigate,
  showToast,
}: ForgotPasswordScreenProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !email.includes('@')) {
      showToast('Please enter a valid email', 'error');
      return;
    }

    setLoading(true);

    try {
      const result = await authAPI.resetPassword(email);

      if (result.success) {
        showToast('Reset link sent to ' + email, 'success');
        setTimeout(() => {
          onNavigate('signin');
        }, 2000);
      } else {
        showToast(result.error || 'Failed to send reset email', 'error');
      }
    } catch (error: any) {
      showToast(error.message || 'An error occurred', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full px-12 py-10">
      <div className="flex items-center justify-end mb-9 flex-shrink-0">
        <div className="text-[13px] text-[var(--ispora-text3)]">
          <button
            onClick={() => onNavigate('signin')}
            className="text-[var(--ispora-brand)] font-semibold hover:underline"
          >
            Back to sign in
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-[400px] w-full mx-auto">
        <div className="font-syne text-2xl font-extrabold text-[var(--ispora-text)] mb-1.5 tracking-tight">
          Reset password
        </div>
        <div className="text-[13px] text-[var(--ispora-text3)] mb-7 leading-relaxed">
          Enter the email address on your account and we will send you a reset link.
        </div>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-[var(--ispora-text2)] mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ispora-text3)]" strokeWidth={2} />
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSubmit();
                }
              }}
              className="w-full border-[1.5px] border-[var(--ispora-border)] rounded-[11px] pl-10 pr-3.5 py-3 text-[13px] text-[var(--ispora-text)] bg-white outline-none transition-all focus:border-[var(--ispora-brand)] focus:shadow-[0_0_0_3px_rgba(2,31,246,0.08)]"
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-[11px] bg-[var(--ispora-brand)] text-white text-sm font-bold cursor-pointer transition-all hover:bg-[var(--ispora-brand-hover)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(2,31,246,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>

        <button
          onClick={() => onNavigate('signin')}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-[11px] bg-white text-[var(--ispora-text)] text-[13px] font-semibold cursor-pointer transition-all border-[1.5px] border-[var(--ispora-border)] hover:border-[var(--ispora-brand)] hover:text-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] mt-2.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
          Back to Sign In
        </button>
      </div>
    </div>
  );
}