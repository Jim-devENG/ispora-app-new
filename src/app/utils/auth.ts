import { projectId, publicAnonKey } from '/utils/supabase/info';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-b8526fa6`;

// ═══════════════════════════════════════════════════════════
// AUTHENTICATION API CLIENT
// ═══════════════════════════════════════════════════════════

export interface SignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'diaspora' | 'student';
}

export interface SigninData {
  email: string;
  password: string;
}

export interface VerifyOTPData {
  email: string;
  otp: string;
}

export interface OnboardingData {
  profileData: Record<string, any>;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  error?: string;
  otp?: string; // Demo mode only
  userId?: string;
  accessToken?: string;
  refreshToken?: string;
  user?: any;
  profile?: any;
}

/**
 * Sign up a new user
 */
export async function signup(data: SignupData): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Signup error:', result.error);
      return { success: false, error: result.error };
    }

    return result;
  } catch (error) {
    console.error('Signup request failed:', error);
    return { success: false, error: 'Network error during signup' };
  }
}

/**
 * Verify OTP code
 */
export async function verifyOTP(data: VerifyOTPData): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('OTP verification error:', result.error);
      return { success: false, error: result.error };
    }

    return result;
  } catch (error) {
    console.error('OTP verification request failed:', error);
    return { success: false, error: 'Network error during verification' };
  }
}

/**
 * Sign in existing user
 */
export async function signin(data: SigninData): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Signin error:', result.error);
      return { success: false, error: result.error };
    }

    // Store access token in localStorage
    if (result.accessToken) {
      localStorage.setItem('accessToken', result.accessToken);
      localStorage.setItem('user', JSON.stringify(result.user));
    }

    return result;
  } catch (error) {
    console.error('Signin request failed:', error);
    return { success: false, error: 'Network error during signin' };
  }
}

/**
 * Resend OTP code
 */
export async function resendOTP(email: string): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/resend-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({ email }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Resend OTP error:', result.error);
      return { success: false, error: result.error };
    }

    return result;
  } catch (error) {
    console.error('Resend OTP request failed:', error);
    return { success: false, error: 'Network error during OTP resend' };
  }
}

/**
 * Request password reset
 */
export async function forgotPassword(email: string): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({ email }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Forgot password error:', result.error);
      return { success: false, error: result.error };
    }

    return result;
  } catch (error) {
    console.error('Forgot password request failed:', error);
    return { success: false, error: 'Network error during password reset' };
  }
}

/**
 * Complete user onboarding
 */
export async function completeOnboarding(data: OnboardingData): Promise<AuthResponse> {
  try {
    const accessToken = localStorage.getItem('accessToken');
    
    if (!accessToken) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(`${API_BASE_URL}/auth/onboarding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Onboarding error:', result.error);
      return { success: false, error: result.error };
    }

    return result;
  } catch (error) {
    console.error('Onboarding request failed:', error);
    return { success: false, error: 'Network error during onboarding' };
  }
}

/**
 * Get authenticated user's profile
 */
export async function getUserProfile(): Promise<AuthResponse> {
  try {
    const accessToken = localStorage.getItem('accessToken');
    
    if (!accessToken) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Get profile error:', result.error);
      return { success: false, error: result.error };
    }

    return result;
  } catch (error) {
    console.error('Get profile request failed:', error);
    return { success: false, error: 'Network error getting profile' };
  }
}

/**
 * Sign out current user
 */
export function signout(): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('user');
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!localStorage.getItem('accessToken');
}

/**
 * Get current user from localStorage
 */
export function getCurrentUser(): any {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}
