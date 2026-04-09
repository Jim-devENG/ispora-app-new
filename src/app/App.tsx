import '/src/styles/index.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Toaster } from 'sonner';
import { Component, ErrorInfo, ReactNode, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router';
import { SupportWidget } from './components/SupportWidget';
import LandingPage from './components/LandingPage';
import AuthFlow from './components/AuthFlow';
import AdminDashboard from './components/AdminDashboard';
import AdminSetup from './components/AdminSetup';
import SessionLandingPage from './components/SessionLandingPage';
import Dashboard from './components/Dashboard';

// v0.0.4 - Current mentor filtering: Students can't request mentorship from existing mentors
// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
    <div className="text-center">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-500 border-r-transparent"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
);

// Suppress Recharts duplicate key warnings (known library issue)
// and Supabase lock warnings (handled by our caching mechanism)
if (typeof window !== 'undefined') {
  const originalError = console.error;
  const originalWarn = console.warn;
  
  console.error = (...args: any[]) => {
    // Suppress Recharts duplicate key warnings
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Encountered two children with the same key')
    ) {
      return;
    }
    
    // Suppress Supabase lock errors (handled by our token caching mechanism)
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Lock \"lock:sb-auth-token\" was released') ||
       args[0].includes('Lock \"sb-auth-token\" was released') ||
       args[0].includes('this.lock is not a function'))
    ) {
      return;
    }
    
    // Suppress "Error loading session" that's related to lock errors
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Error loading session') &&
      typeof args[1] === 'object' &&
      args[1]?.message?.includes('this.lock is not a function')
    ) {
      return;
    }
    
    // Suppress HMR-related auth context errors
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('useAuth called outside of AuthProvider') ||
       args[0].includes('This might be due to hot module reload'))
    ) {
      return;
    }
    
    originalError.apply(console, args);
  };
  
  console.warn = (...args: any[]) => {
    // Suppress Recharts duplicate key warnings (they can appear as warnings too)
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Encountered two children with the same key')
    ) {
      return;
    }
    
    // Suppress Supabase lock warnings
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Lock "lock:sb-auth-token" was not released') ||
       args[0].includes('@supabase/gotrue-js: Lock') ||
       args[0].includes('this.lock is not a function'))
    ) {
      return;
    }
    
    // Suppress HMR-related auth warnings
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('useAuth called outside of AuthProvider') ||
       args[0].includes('This might be due to hot module reload') ||
       args[0].includes('Returning safe defaults'))
    ) {
      return;
    }
    
    originalWarn.apply(console, args);
  };
}

// Error boundary to catch and display errors
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App Error:', error, errorInfo);
    
    // If it's an HMR-related auth error, automatically recover
    if (error.message?.includes('useAuth must be used within an AuthProvider')) {
      console.log('⚠️ HMR-related auth error detected. Attempting auto-recovery...');
      setTimeout(() => {
        this.setState({ hasError: false, error: null });
      }, 100);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
          <h1 style={{ color: 'red' }}>Something went wrong</h1>
          <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
            {this.state.error?.toString()}
            {'\n'}
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

// Component to conditionally render Support Widget
function SupportWidgetWrapper() {
  const { user, accessToken } = useAuth();
  const location = useLocation();
  
  // Show widget for authenticated users on all pages except landing and auth
  const isLandingOrAuth = location.pathname === '/' || location.pathname === '/auth';
  const showWidget = !!user && !!accessToken && !isLandingOrAuth;
  
  console.log('SupportWidget Debug:', {
    hasUser: !!user,
    hasToken: !!accessToken,
    userEmail: user?.email,
    pathname: location.pathname,
    isLandingOrAuth,
    showWidget
  });
  
  if (!showWidget) {
    console.log('❌ Widget NOT showing because:', {
      hasUser: !!user,
      hasToken: !!accessToken,
      isLandingOrAuth,
      pathname: location.pathname
    });
    return null;
  }
  
  console.log('✅ Widget SHOULD BE showing');
  return <SupportWidget accessToken={accessToken} />;
}

function AppContent() {
  return (
    <>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthFlow />} />
          <Route path="/session/:sessionId" element={<SessionLandingPage />} />
          <Route path="/:shortCode" element={<SessionLandingPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin-setup" element={<AdminSetup />} />
          <Route path="/admin/setup" element={<AdminSetup />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </Suspense>
      <SupportWidgetWrapper />
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: 'white',
            border: '1.5px solid var(--ispora-border)',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
          },
          className: 'font-syne',
        }}
        richColors
      />
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider>
            <AppContent />
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}