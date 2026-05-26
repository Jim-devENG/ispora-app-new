import { useEffect, useMemo, useState } from 'react';
import { Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { supabase } from '../../utils/supabase';
import { Screen } from '../AuthFlow';

interface ResetPasswordScreenProps {
  onNavigate: (screen: Screen) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

function getRecoveryTokensFromHash() {
  if (typeof window === 'undefined' || !window.location.hash) {
    return { accessToken: '', refreshToken: '' };
  }

  const hash = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash;
  const params = new URLSearchParams(hash);

  return {
    accessToken: params.get('access_token') || '',
    refreshToken: params.get('refresh_token') || '',
  };
}

export default function ResetPasswordScreen({
  onNavigate,
  showToast,
}: ResetPasswordScreenProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [recoveryReady, setRecoveryReady] = useState(false);

  const passwordError = useMemo(() => {
    if (!password) {
      return '';
    }
    if (password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    return '';
  }, [password]);

  useEffect(() => {
    let isMounted = true;

    const initializeRecoverySession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          if (isMounted) {
            setRecoveryReady(true);
          }
          return;
        }

        const { accessToken, refreshToken } = getRecoveryTokensFromHash();
        if (!accessToken || !refreshToken) {
          if (isMounted) {
            setRecoveryReady(false);
          }
          return;
        }

        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          console.error('Failed to initialize recovery session:', error);
          if (isMounted) {
            setRecoveryReady(false);
          }
          return;
        }

        if (typeof window !== 'undefined') {
          // Remove token hash from URL after session is established.
          window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
        }

        if (isMounted) {
          setRecoveryReady(true);
        }
      } catch (error) {
        console.error('Recovery session initialization error:', error);
        if (isMounted) {
          setRecoveryReady(false);
        }
      } finally {
        if (isMounted) {
          setInitializing(false);
        }
      }
    };

    initializeRecoverySession();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async () => {
    if (!recoveryReady) {
      showToast('Reset link is invalid or expired. Please request a new one.', 'error');
      return;
    }

    if (!password || password.length < 8) {
      showToast('Password must be at least 8 characters', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        showToast(error.message || 'Failed to update password', 'error');
        return;
      }

      showToast('Password updated successfully. Please sign in.', 'success');
      await supabase.auth.signOut();
      if (typeof window !== 'undefined') {
        window.location.replace('/auth?mode=signin');
        return;
      }
      onNavigate('signin');
    } catch (error: any) {
      showToast(error.message || 'Failed to update password', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full px-6 md:px-12 py-6 md:py-10">
      <div className="flex items-center justify-end mb-6 md:mb-9 flex-shrink-0">
        <button
          onClick={() => onNavigate('signin')}
          className="text-xs md:text-[13px] text-[var(--ispora-brand)] font-semibold hover:underline"
        >
          Back to sign in
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-[400px] w-full mx-auto">
        <div className="font-syne text-xl md:text-2xl font-extrabold text-[var(--ispora-text)] mb-1.5 tracking-tight">
          Create a new password
        </div>
        <div className="text-xs md:text-[13px] text-[var(--ispora-text3)] mb-5 md:mb-7 leading-relaxed">
          Enter your new password to complete account recovery.
        </div>

        {initializing && (
          <div className="text-[12px] text-[var(--ispora-text3)] mb-4">Preparing secure reset session...</div>
        )}

        {!initializing && !recoveryReady && (
          <div className="text-[12px] text-[var(--ispora-danger)] mb-4">
            This reset link is invalid or expired. Request a new reset email.
          </div>
        )}

        <div className="mb-4">
          <label className="block text-xs font-semibold text-[var(--ispora-text2)] mb-1.5">
            New Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ispora-text3)]" strokeWidth={2} />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full border-[1.5px] rounded-[11px] pl-10 pr-10 py-3 text-[13px] text-[var(--ispora-text)] bg-white outline-none transition-all focus:border-[var(--ispora-brand)] focus:shadow-[0_0_0_3px_rgba(2,31,246,0.08)] ${
                passwordError ? 'border-[var(--ispora-danger)]' : 'border-[var(--ispora-border)]'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ispora-text3)] hover:text-[var(--ispora-brand)] transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" strokeWidth={2} /> : <Eye className="w-4 h-4" strokeWidth={2} />}
            </button>
          </div>
          {passwordError && <div className="text-[11px] text-[var(--ispora-danger)] mt-1">{passwordError}</div>}
        </div>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-[var(--ispora-text2)] mb-1.5">
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ispora-text3)]" strokeWidth={2} />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Repeat your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSubmit();
                }
              }}
              className="w-full border-[1.5px] border-[var(--ispora-border)] rounded-[11px] pl-10 pr-10 py-3 text-[13px] text-[var(--ispora-text)] bg-white outline-none transition-all focus:border-[var(--ispora-brand)] focus:shadow-[0_0_0_3px_rgba(2,31,246,0.08)]"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ispora-text3)] hover:text-[var(--ispora-brand)] transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" strokeWidth={2} /> : <Eye className="w-4 h-4" strokeWidth={2} />}
            </button>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || initializing || !recoveryReady}
          className="w-full py-3.5 rounded-[11px] bg-[var(--ispora-brand)] text-white text-sm font-bold cursor-pointer transition-all hover:bg-[var(--ispora-brand-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Updating...' : 'Update Password'}
        </button>

        <button
          onClick={() => onNavigate('signin')}
          className="flex items-center justify-center gap-2 w-full py-3 mt-2.5 rounded-[11px] bg-white text-[var(--ispora-text)] text-[13px] font-semibold cursor-pointer transition-all border-[1.5px] border-[var(--ispora-border)] hover:border-[var(--ispora-brand)] hover:text-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)]"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
          Back to Sign In
        </button>
      </div>
    </div>
  );
}
