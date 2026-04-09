import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Screen } from '../AuthFlow';

interface SignInScreenProps {
  onNavigate: (screen: Screen) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function SignInScreen({ onNavigate, showToast }: SignInScreenProps) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const handleSubmit = async () => {
    const newErrors: Record<string, string> = {};

    if (!email.trim() || !email.includes('@')) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!password) {
      newErrors.password = 'Please enter your password';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const result = await signIn({ email, password });

      if (result.success) {
        showToast('Welcome back! Redirecting...', 'success');
        // The AuthContext will handle navigation to dashboard
      } else {
        // Special message for admin email
        if (email === 'isporaproject@gmail.com' && result.error?.includes('Invalid login credentials')) {
          showToast('Admin account not created yet. Please sign up first!', 'error');
        } else {
          showToast(result.error || 'Sign in failed', 'error');
        }
      }
    } catch (error: any) {
      showToast(error.message || 'An error occurred', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full px-6 md:px-12 py-6 md:py-10">
      <div className="flex items-center justify-end mb-6 md:mb-9 flex-shrink-0">
        <div className="text-xs md:text-[13px] text-[var(--ispora-text3)]">
          New to Ispora?{' '}
          <button
            onClick={() => onNavigate('landing')}
            className="text-[var(--ispora-brand)] font-semibold hover:underline"
          >
            Create account
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-[400px] w-full mx-auto">
        <div className="font-syne text-xl md:text-2xl font-extrabold text-[var(--ispora-text)] mb-1.5 tracking-tight">
          Welcome back
        </div>
        <div className="text-xs md:text-[13px] text-[var(--ispora-text3)] mb-5 md:mb-7 leading-relaxed">
          Sign in to your Ispora account
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
              onChange={(e) => {
                setEmail(e.target.value);
                clearError('email');
              }}
              className={`w-full border-[1.5px] rounded-[11px] pl-10 pr-3.5 py-3 text-[13px] text-[var(--ispora-text)] bg-white outline-none transition-all focus:border-[var(--ispora-brand)] focus:shadow-[0_0_0_3px_rgba(2,31,246,0.08)] ${
                errors.email ? 'border-[var(--ispora-danger)] shadow-[0_0_0_3px_rgba(239,68,68,0.08)]' : 'border-[var(--ispora-border)]'
              }`}
            />
          </div>
          {errors.email && (
            <div className="text-[11px] text-[var(--ispora-danger)] mt-1">{errors.email}</div>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-[var(--ispora-text2)] mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ispora-text3)]" strokeWidth={2} />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearError('password');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSubmit();
                }
              }}
              className={`w-full border-[1.5px] rounded-[11px] pl-10 pr-10 py-3 text-[13px] text-[var(--ispora-text)] bg-white outline-none transition-all focus:border-[var(--ispora-brand)] focus:shadow-[0_0_0_3px_rgba(2,31,246,0.08)] ${
                errors.password ? 'border-[var(--ispora-danger)] shadow-[0_0_0_3px_rgba(239,68,68,0.08)]' : 'border-[var(--ispora-border)]'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ispora-text3)] hover:text-[var(--ispora-brand)] transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" strokeWidth={2} />
              ) : (
                <Eye className="w-4 h-4" strokeWidth={2} />
              )}
            </button>
          </div>
          {errors.password && (
            <div className="text-[11px] text-[var(--ispora-danger)] mt-1">{errors.password}</div>
          )}
        </div>

        <button
          onClick={() => onNavigate('forgot')}
          className="text-xs text-[var(--ispora-brand)] font-semibold cursor-pointer text-right -mt-2 mb-4 hover:underline"
        >
          Forgot password?
        </button>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-[11px] bg-[var(--ispora-brand)] text-white text-sm font-bold cursor-pointer transition-all hover:bg-[var(--ispora-brand-hover)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(2,31,246,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
        >
          {loading ? 'Signing in...' : 'Sign In'}
          <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
        </button>

        <div className="text-[11px] text-[var(--ispora-text3)] text-center mt-4">
          Protected by industry-standard encryption
        </div>
      </div>
    </div>
  );
}