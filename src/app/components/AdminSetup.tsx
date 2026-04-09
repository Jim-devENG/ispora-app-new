import { useEffect } from 'react';
import { useNavigate } from 'react-router';

export default function AdminSetup() {
  const navigate = useNavigate();

  useEffect(() => {
    // This page is no longer needed - redirect to auth
    navigate('/auth');
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[var(--ispora-bg)] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 border-4 border-[var(--ispora-brand)] border-t-transparent rounded-full animate-spin"></div>
        <div className="text-lg font-semibold text-[var(--ispora-text)] mb-2">
          Redirecting...
        </div>
        <div className="text-sm text-[var(--ispora-text3)]">
          Admin setup is no longer needed. Just sign up or sign in with isporaproject@gmail.com!
        </div>
      </div>
    </div>
  );
}
