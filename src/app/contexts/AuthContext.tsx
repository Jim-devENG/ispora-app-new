import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { projectId, publicAnonKey } from '/utils/supabase/info';

// Import types from utils/api for backward compatibility
import type { User, SignUpData, SignInData } from '../utils/api';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-b8526fa6`;

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  signUp: (data: SignUpData) => Promise<{ success: boolean; error?: string }>;
  signIn: (data: SignInData) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (profileData: any) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    // During development/HMR, context might not be available immediately
    // Return a safe default instead of throwing to prevent app crashes during HMR
    if (process.env.NODE_ENV === 'development') {
      console.warn('useAuth called outside of AuthProvider. This might be due to hot module reload. Returning safe defaults.');
      return {
        user: null,
        accessToken: null,
        loading: true,
        signUp: async () => ({ success: false, error: 'Auth provider not ready' }),
        signIn: async () => ({ success: false, error: 'Auth provider not ready' }),
        signOut: async () => {},
        updateProfile: async () => ({ success: false, error: 'Auth provider not ready' }),
        refreshUser: async () => {},
        isAuthenticated: false,
      };
    }
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load session from localStorage on mount
  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      try {
        console.log('=== Loading Session on Mount ===');
        
        // Clear any stale tokens from localStorage first
        const oldToken = localStorage.getItem('ispora_access_token');
        if (oldToken) {
          console.log('Found old token in localStorage, will verify with Supabase');
        }
        
        // Try to restore session from Supabase (this will auto-refresh if needed)
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!isMounted) return; // Prevent state updates if unmounted

        if (error) {
          // Ignore lock-related errors as they're handled by our caching mechanism
          if (error.message && error.message.includes('this.lock is not a function')) {
            console.log('⚠️ Ignoring lock error (handled by caching)');
            setLoading(false);
            return;
          }
          
          console.log('❌ Supabase session error:', error.message);
          localStorage.removeItem('ispora_access_token');
          localStorage.removeItem('ispora_refresh_token');
          setLoading(false);
          return;
        }

        if (session) {
          console.log('✓ Supabase session found, fetching user profile...');
          const token = session.access_token;
          
          // Check if token has expired
          const tokenExpiry = session.expires_at;
          const now = Math.floor(Date.now() / 1000);
          if (tokenExpiry && tokenExpiry < now) {
            console.log('⚠️ Token has expired, attempting to refresh...');
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
            
            if (refreshError || !refreshData.session) {
              console.log('❌ Failed to refresh session, signing out');
              await supabase.auth.signOut();
              localStorage.removeItem('ispora_access_token');
              localStorage.removeItem('ispora_refresh_token');
              setLoading(false);
              return;
            }
            
            console.log('✓ Session refreshed successfully');
            // Use the new token
            const newToken = refreshData.session.access_token;
            
            try {
              const response = await fetch(`${API_BASE_URL}/auth/session`, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${newToken}`,
                },
              });

              if (!isMounted) return;

              const result = await response.json();

              if (response.ok && result.success && result.user) {
                console.log('✓ Session restored with refreshed token');
                setUser(result.user);
                setAccessToken(newToken);
                localStorage.setItem('ispora_access_token', newToken);
              } else {
                console.log('❌ Failed after refresh:', result);
                await supabase.auth.signOut();
                localStorage.removeItem('ispora_access_token');
                localStorage.removeItem('ispora_refresh_token');
                setUser(null);
                setAccessToken(null);
              }
            } catch (err) {
              if (!isMounted) return;
              console.error('Error after token refresh:', err);
              await supabase.auth.signOut();
              localStorage.removeItem('ispora_access_token');
              localStorage.removeItem('ispora_refresh_token');
              setUser(null);
              setAccessToken(null);
            }
            return;
          }
          
          try {
            const response = await fetch(`${API_BASE_URL}/auth/session`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
            });

            if (!isMounted) return;

            const result = await response.json();

            if (response.ok && result.success && result.user) {
              console.log('✓ Session restored successfully');
              setUser(result.user);
              setAccessToken(token);
              localStorage.setItem('ispora_access_token', token);
            } else {
              console.log('❌ Failed to fetch user profile:', result);
              // If it's an invalid JWT, sign out completely and clear everything
              if (result.error?.includes('Invalid JWT') || result.error?.includes('Invalid session') || result.message?.includes('Invalid JWT') || result.code === 401) {
                console.log('Invalid JWT detected - clearing session and signing out');
                await supabase.auth.signOut();
              }
              localStorage.removeItem('ispora_access_token');
              localStorage.removeItem('ispora_refresh_token');
              setUser(null);
              setAccessToken(null);
            }
          } catch (err) {
            if (!isMounted) return;
            console.error('Error fetching user profile:', err);
            // Check if it's a network error (502, 503, etc)
            if (err instanceof Error && (err.message.includes('502') || err.message.includes('Bad gateway'))) {
              console.error('⚠️ Server is temporarily unavailable (502). Will retry on next page load.');
            }
            localStorage.removeItem('ispora_access_token');
            localStorage.removeItem('ispora_refresh_token');
            setUser(null);
            setAccessToken(null);
          }
        } else {
          console.log('No active session found');
          localStorage.removeItem('ispora_access_token');
          localStorage.removeItem('ispora_refresh_token');
        }
      } catch (error) {
        if (!isMounted) return;
        console.error('Error loading session:', error);
        localStorage.removeItem('ispora_access_token');
        localStorage.removeItem('ispora_refresh_token');
      } finally {
        if (isMounted) {
          setLoading(false);
          console.log('=== Session Loading Complete ===');
        }
      }
    };

    loadSession();

    return () => {
      isMounted = false;
    };
  }, []);

  // Listen for auth state changes (token refresh, sign out, etc.)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('=== Auth State Change ===');
      console.log('Event:', event);
      console.log('Session exists:', !!session);

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setAccessToken(null);
        localStorage.removeItem('ispora_access_token');
        localStorage.removeItem('ispora_refresh_token');
      } else if (event === 'TOKEN_REFRESHED' && session) {
        console.log('✓ Token refreshed, updating stored token');
        const token = session.access_token;
        setAccessToken(token);
        localStorage.setItem('ispora_access_token', token);
      } else if (session && !user) {
        // Session exists but user not loaded - fetch user profile
        const token = session.access_token;
        try {
          const response = await fetch(`${API_BASE_URL}/auth/session`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          });

          const result = await response.json();

          if (response.ok && result.success && result.user) {
            setUser(result.user);
            setAccessToken(token);
            localStorage.setItem('ispora_access_token', token);
          }
        } catch (err) {
          console.error('Error fetching user profile on auth change:', err);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const signUp = useCallback(async (data: SignUpData) => {
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
      
      if (result.success) {
        return { success: true };
      }
      
      return { success: false, error: result.error || 'Sign up failed' };
    } catch (error: any) {
      return { success: false, error: error.message || 'An error occurred during sign up' };
    }
  }, []);

  const signIn = useCallback(async (data: SignInData) => {
    try {
      console.log('=== Sign In Flow Start ===');
      console.log('Attempting Supabase authentication...');
      
      // Use Supabase client directly for authentication
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError || !authData.session) {
        console.error('Supabase sign in error:', authError);
        return { success: false, error: authError?.message || 'Sign in failed' };
      }

      const token = authData.session.access_token;
      console.log('✓ Supabase authentication successful');
      
      console.log('Fetching user profile from backend...');
      // Fetch user profile from our backend
      const response = await fetch(`${API_BASE_URL}/auth/session`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error('Fetch user profile error:', result);
        return { success: false, error: result.message || result.error || 'Failed to fetch user profile' };
      }

      console.log('✓ User profile fetched successfully');
      setAccessToken(token);
      setUser(result.user);
      
      // Store tokens in localStorage
      localStorage.setItem('ispora_access_token', token);
      if (authData.session.refresh_token) {
        localStorage.setItem('ispora_refresh_token', authData.session.refresh_token);
      }
      
      console.log('=== Sign In Flow Complete ===');
      return { success: true };
    } catch (error: any) {
      console.error('Sign in error:', error);
      return { success: false, error: error.message || 'An error occurred during sign in' };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      // Clear state and localStorage
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('ispora_access_token');
      localStorage.removeItem('ispora_refresh_token');
      // Redirect to auth page
      window.location.href = '/auth';
    }
  }, []);

  const updateProfile = useCallback(async (profileData: any) => {
    try {
      console.log('updateProfile called with data:', profileData);
      
      if (!user?.id) {
        return { success: false, error: 'No user logged in' };
      }

      // Get fresh token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        return { success: false, error: 'No valid session' };
      }
      
      const response = await fetch(`${API_BASE_URL}/auth/update-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ profileData }),
      });

      const result = await response.json();
      
      if (response.ok && result.success && result.user) {
        setUser(result.user);
        setAccessToken(session.access_token);
        localStorage.setItem('ispora_access_token', session.access_token);
        return { success: true };
      }
      
      return { success: false, error: result.error || 'Failed to update profile' };
    } catch (error: any) {
      console.error('updateProfile error:', error);
      return { success: false, error: error.message || 'An error occurred while updating profile' };
    }
  }, [user?.id]);

  const refreshUser = useCallback(async () => {
    try {
      // Get fresh token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.log('No valid session for refresh');
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/auth/session`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();
      
      if (response.ok && result.success && result.user) {
        console.log('✓ User refreshed successfully');
        setUser(result.user);
        setAccessToken(session.access_token);
        localStorage.setItem('ispora_access_token', session.access_token);
      }
    } catch (error: any) {
      console.error('refreshUser error:', error);
    }
  }, []);

  const value = useMemo<AuthContextType>(() => ({
    user,
    accessToken,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    refreshUser,
    isAuthenticated: !!user && !!accessToken,
  }), [user, accessToken, loading, signUp, signIn, signOut, updateProfile, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};