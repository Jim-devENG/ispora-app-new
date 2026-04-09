import { projectId, publicAnonKey } from '/utils/supabase/info';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-b8526fa6`;

export interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'diaspora' | 'student';
  mentorType?: 'diaspora' | 'home';
}

export interface SignInData {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'diaspora' | 'student';
  createdAt: string;
  onboardingComplete: boolean;
  [key: string]: any;
}

export interface AuthResponse {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  user?: User;
  userId?: string;
  message?: string;
  error?: string;
}

class AuthAPI {
  private getHeaders(includeAuth = false, token?: string) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (includeAuth && token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else if (!includeAuth) {
      headers['Authorization'] = `Bearer ${publicAnonKey}`;
    }

    return headers;
  }

  async signUp(data: SignUpData): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Sign up API error:', result);
        return { success: false, error: result.error || 'Sign up failed' };
      }

      return result;
    } catch (error: any) {
      console.error('Sign up network error:', error);
      return { success: false, error: error.message || 'Network error during sign up' };
    }
  }

  async signIn(data: SignInData): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signin`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Sign in API error:', result);
        return { success: false, error: result.error || 'Sign in failed' };
      }

      return result;
    } catch (error: any) {
      console.error('Sign in network error:', error);
      return { success: false, error: error.message || 'Network error during sign in' };
    }
  }

  async signOut(token: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signout`, {
        method: 'POST',
        headers: this.getHeaders(true, token),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Sign out API error:', result);
        return { success: false, error: result.error || 'Sign out failed' };
      }

      return result;
    } catch (error: any) {
      console.error('Sign out network error:', error);
      return { success: false, error: error.message || 'Network error during sign out' };
    }
  }

  async getSession(token: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/session`, {
        method: 'GET',
        headers: this.getHeaders(true, token),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Get session API error:', result);
        return { success: false, error: result.error || 'Failed to get session' };
      }

      return result;
    } catch (error: any) {
      console.error('Get session network error:', error);
      return { success: false, error: error.message || 'Network error while getting session' };
    }
  }

  async updateProfile(token: string, profileData: any): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/update-profile`, {
        method: 'POST',
        headers: this.getHeaders(true, token),
        body: JSON.stringify({ profileData }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Update profile API error:', result);
        return { success: false, error: result.error || 'Failed to update profile' };
      }

      return result;
    } catch (error: any) {
      console.error('Update profile network error:', error);
      return { success: false, error: error.message || 'Network error while updating profile' };
    }
  }

  async resetPassword(email: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Reset password API error:', result);
        return { success: false, error: result.error || 'Failed to send reset email' };
      }

      return result;
    } catch (error: any) {
      console.error('Reset password network error:', error);
      return { success: false, error: error.message || 'Network error while resetting password' };
    }
  }
}

export const authAPI = new AuthAPI();