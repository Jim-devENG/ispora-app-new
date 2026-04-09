import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router';
import LeftPanel from './auth/LeftPanel';
import LandingScreen from './auth/LandingScreen';
import MentorTypeScreen from './auth/MentorTypeScreen';
import SignUpScreen from './auth/SignUpScreen';
import OnboardingScreen from './auth/OnboardingScreen';
import SuccessScreen from './auth/SuccessScreen';
import SignInScreen from './auth/SignInScreen';
import ForgotPasswordScreen from './auth/ForgotPasswordScreen';
import Dashboard from './Dashboard';
import { toast } from 'sonner';

export type Screen = 
  | 'landing' 
  | 'mentortype'
  | 'signup' 
  | 'onboard' 
  | 'success' 
  | 'signin' 
  | 'forgot' 
  | 'dashboard';

export type UserRole = 'diaspora' | 'student' | null;
export type MentorType = 'diaspora' | 'home' | null;

export interface SignUpFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export default function AuthFlow() {
  const { isAuthenticated, user, signIn, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentScreen, setCurrentScreen] = useState<Screen>('landing');
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);
  const [mentorType, setMentorType] = useState<MentorType>(null);
  const [signUpData, setSignUpData] = useState<SignUpFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });

  // Check URL parameters on mount for direct signup flow
  useEffect(() => {
    const mode = searchParams.get('mode');
    const role = searchParams.get('role');
    
    if (mode === 'signup' && role === 'student' && !isAuthenticated) {
      setSelectedRole('student');
      setCurrentScreen('signup');
    }
  }, [searchParams, isAuthenticated]);

  // Navigate to dashboard when user is authenticated and onboarding is complete
  useEffect(() => {
    // Wait for loading to complete before making navigation decisions
    if (loading) {
      return;
    }
    
    if (isAuthenticated && user) {
      // ✅ ADMIN REDIRECT: If user is admin, redirect to /admin
      if (user.role === 'admin') {
        navigate('/admin');
        return;
      }

      // If user is authenticated and onboarding is complete, redirect to destination
      if (user.onboardingComplete) {
        // Check if there's a redirect URL in the query params
        const redirectUrl = searchParams.get('redirect');
        if (redirectUrl) {
          // Decode and navigate to the original destination
          navigate(decodeURIComponent(redirectUrl));
        } else {
          // Default to dashboard
          navigate('/dashboard');
        }
        return;
      }
      // If user is authenticated but onboarding is not complete, go to onboarding
      else if (currentScreen === 'signin' || currentScreen === 'signup') {
        const userRole = user.role;
        if (userRole) {
          setSelectedRole(userRole);
          setCurrentScreen('onboard');
        }
      }
    }
  }, [loading, isAuthenticated, user, user?.onboardingComplete, currentScreen, navigate, searchParams]);

  const navigateTo = (screen: Screen) => {
    setCurrentScreen(screen);
  };

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
  };

  const handleMentorTypeSelect = (type: MentorType) => {
    setMentorType(type);
  };

  const handleSignUpData = (data: SignUpFormData) => {
    setSignUpData(data);
  };

  const handleAutoSignIn = async (email: string, password: string) => {
    try {
      const result = await signIn({ email, password });
      
      if (result.success) {
        // AuthFlow's useEffect will handle navigation to onboarding
      } else {
        showToast('Account created! Please sign in to continue.', 'info');
        navigateTo('signin');
      }
    } catch (error) {
      console.error('Auto sign-in error:', error);
      showToast('Account created! Please sign in to continue.', 'info');
      navigateTo('signin');
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    if (type === 'success') {
      toast.success(message);
    } else if (type === 'error') {
      toast.error(message);
    } else {
      toast(message);
    }
  };

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--ispora-bg)]">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-[var(--ispora-brand)] border-t-transparent rounded-full animate-spin"></div>
          <div className="text-sm text-[var(--ispora-text3)]">Loading...</div>
        </div>
      </div>
    );
  }

  if (currentScreen === 'dashboard') {
    return <Dashboard />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Hide left panel on mobile, show on desktop with 40% width */}
      <div className="hidden md:block md:w-[40%] flex-shrink-0">
        <LeftPanel />
      </div>
      
      {/* Right panel - full width on mobile, 60% on desktop */}
      <div className="flex-1 md:flex-none md:w-[60%] flex flex-col overflow-y-auto bg-white">
        {currentScreen === 'landing' && (
          <LandingScreen
            selectedRole={selectedRole}
            onRoleSelect={handleRoleSelect}
            onNavigate={navigateTo}
            showToast={showToast}
          />
        )}
        
        {currentScreen === 'mentortype' && (
          <MentorTypeScreen
            selectedRole={selectedRole}
            onMentorTypeSelect={handleMentorTypeSelect}
            onNavigate={navigateTo}
            showToast={showToast}
          />
        )}
        
        {currentScreen === 'signup' && (
          <SignUpScreen
            selectedRole={selectedRole}
            mentorType={mentorType}
            onNavigate={navigateTo}
            onSignUpData={handleSignUpData}
            showToast={showToast}
            onAutoSignIn={handleAutoSignIn}
          />
        )}
        
        {currentScreen === 'onboard' && (
          <OnboardingScreen
            selectedRole={selectedRole}
            firstName={signUpData.firstName}
            onNavigate={navigateTo}
            showToast={showToast}
          />
        )}
        
        {currentScreen === 'success' && (
          <SuccessScreen
            firstName={signUpData.firstName}
            selectedRole={selectedRole}
            onNavigate={navigateTo}
          />
        )}
        
        {currentScreen === 'signin' && (
          <SignInScreen
            onNavigate={navigateTo}
            showToast={showToast}
          />
        )}
        
        {currentScreen === 'forgot' && (
          <ForgotPasswordScreen
            onNavigate={navigateTo}
            showToast={showToast}
          />
        )}
      </div>
    </div>
  );
}