import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { LiveKitRoom, VideoConference, formatChatMessageLinks } from '@livekit/components-react';
import '@livekit/components-styles';
import { ArrowLeft } from 'lucide-react';
import { sessionApi } from '../lib/api';
import { toast } from 'sonner';

export default function LiveSessionRoom() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!sessionId) {
      setError('No session specified');
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const response = await sessionApi.getLiveToken(sessionId);
        if (cancelled) return;
        setToken(response.token);
        setServerUrl(response.url);
      } catch (err: any) {
        if (cancelled) return;
        setError(err.message || 'Failed to join live session');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const handleLeave = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-white">Connecting to live session...</p>
        </div>
      </div>
    );
  }

  if (error || !token || !serverUrl) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-xl">
          <div className="w-16 h-16 bg-[var(--ispora-danger-light)] rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">😕</span>
          </div>
          <h2 className="font-syne text-xl font-bold text-[var(--ispora-text)] mb-2">
            Unable to Join Live Session
          </h2>
          <p className="text-[var(--ispora-text2)] mb-6">
            {error || 'Something went wrong. Please try again.'}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-[var(--ispora-brand)] text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            <ArrowLeft className="w-4 h-4 inline-block mr-2" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-black">
      <LiveKitRoom
        serverUrl={serverUrl}
        token={token}
        connect
        video
        audio
        data-lk-theme="default"
        style={{ height: '100%' }}
        onDisconnected={handleLeave}
        onError={(err) => {
          console.error('LiveKit room error:', err);
          toast.error('Live session error', { description: err.message });
        }}
      >
        <VideoConference chatMessageFormatter={formatChatMessageLinks} />
      </LiveKitRoom>
    </div>
  );
}
