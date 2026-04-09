import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole, Screen, SignUpFormData, MentorType } from '../AuthFlow';

interface SignUpScreenProps {
  selectedRole: 'diaspora' | 'student' | null;
  mentorType: 'diaspora' | 'home' | null;
  onNavigate: (screen: string) => void;
  onSignUpData: (data: SignUpFormData) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  onAutoSignIn?: (email: string, password: string) => Promise<void>;
}

export default function SignUpScreen({
  selectedRole,
  mentorType,
  onNavigate,
  onSignUpData,
  showToast,
  onAutoSignIn,
}: SignUpScreenProps) {
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ level: 0, text: 'Enter a password', color: 'var(--ispora-text3)' });
  const [loading, setLoading] = useState(false);

  const checkPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    const levels = [
      { text: 'Weak', color: 'var(--ispora-danger)' },
      { text: 'Weak', color: 'var(--ispora-danger)' },
      { text: 'Fair', color: 'var(--ispora-warn)' },
      { text: 'Good', color: 'var(--ispora-success)' },
      { text: 'Strong', color: 'var(--ispora-success)' },
    ];

    setPasswordStrength({
      level: strength,
      text: password ? levels[strength].text : 'Enter a password',
      color: password ? levels[strength].color : 'var(--ispora-text3)',
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    
    // Clear error for this field
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }

    // Check password strength
    if (field === 'password') {
      checkPasswordStrength(value);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Please enter your first name';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Please enter your last name';
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      newErrors.email = 'Please enter a valid email';
    }
    if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (!selectedRole) {
      showToast('No role selected', 'error');
      return;
    }

    setLoading(true);

    try {
      const result = await signUp({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: selectedRole,
        mentorType: mentorType,
      });

      if (result.success) {
        onSignUpData(formData);
        showToast('Account created successfully!', 'success');
        // Auto-sign in after account creation
        if (onAutoSignIn) {
          await onAutoSignIn(formData.email, formData.password);
        } else {
          // Fallback to manual signin if no auto-signin handler
          onNavigate('signin');
        }
      } else {
        showToast(result.error || 'Sign up failed', 'error');
      }
    } catch (error: any) {
      showToast(error.message || 'An error occurred', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full px-6 md:px-12 py-6 md:py-10 overflow-y-auto">
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

      <div className="flex-1 flex flex-col max-w-[400px] w-full mx-auto pb-8">
        <div className="flex justify-between items-center mb-4 md:mb-5">
          <div>
            <div className="font-syne text-xl md:text-2xl font-extrabold text-[var(--ispora-text)] mb-1 tracking-tight">
              Create your account
            </div>
            <div className="text-xs md:text-[13px] text-[var(--ispora-text3)]">
              Step 2 of 3 — Your basic details
            </div>
          </div>
          <div className="flex gap-1.5">
            <div className="w-7 h-[5px] rounded bg-[var(--ispora-brand)]" />
            <div className="w-7 h-[5px] rounded bg-[var(--ispora-brand)]" />
            <div className="w-7 h-[5px] rounded bg-[var(--ispora-border)]" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--ispora-text2)] mb-1.5">
              First Name
            </label>
            <input
              type="text"
              placeholder="e.g. Amina"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              className={`w-full border-[1.5px] rounded-[11px] px-3.5 py-3 text-[13px] text-[var(--ispora-text)] bg-white outline-none transition-all focus:border-[var(--ispora-brand)] focus:shadow-[0_0_0_3px_rgba(2,31,246,0.08)] ${
                errors.firstName ? 'border-[var(--ispora-danger)] shadow-[0_0_0_3px_rgba(239,68,68,0.08)]' : 'border-[var(--ispora-border)]'
              }`}
            />
            {errors.firstName && (
              <div className="text-[11px] text-[var(--ispora-danger)] mt-1">{errors.firstName}</div>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--ispora-text2)] mb-1.5">
              Last Name
            </label>
            <input
              type="text"
              placeholder="e.g. Osei"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              className={`w-full border-[1.5px] rounded-[11px] px-3.5 py-3 text-[13px] text-[var(--ispora-text)] bg-white outline-none transition-all focus:border-[var(--ispora-brand)] focus:shadow-[0_0_0_3px_rgba(2,31,246,0.08)] ${
                errors.lastName ? 'border-[var(--ispora-danger)] shadow-[0_0_0_3px_rgba(239,68,68,0.08)]' : 'border-[var(--ispora-border)]'
              }`}
            />
            {errors.lastName && (
              <div className="text-[11px] text-[var(--ispora-danger)] mt-1">{errors.lastName}</div>
            )}
          </div>
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
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
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
              placeholder="At least 8 characters"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
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
          
          {/* Password strength */}
          <div className="mt-1.5">
            <div className="flex gap-1 mb-1">
              {[1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className="flex-1 h-[3px] rounded-sm bg-[var(--ispora-border)] transition-all"
                  style={{
                    backgroundColor: level <= passwordStrength.level ? passwordStrength.color : 'var(--ispora-border)',
                  }}
                />
              ))}
            </div>
            <div className="text-[10px]" style={{ color: passwordStrength.color }}>
              {passwordStrength.text}
            </div>
          </div>
          
          {errors.password && (
            <div className="text-[11px] text-[var(--ispora-danger)] mt-1">{errors.password}</div>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-[11px] bg-[var(--ispora-brand)] text-white text-sm font-bold cursor-pointer transition-all hover:bg-[var(--ispora-brand-hover)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(2,31,246,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none mt-5"
        >
          {loading ? 'Creating account...' : 'Continue'}
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