import { useState, useEffect } from 'react';
import api from '../lib/api';
import { toast } from 'sonner';
import {
  Video,
  Calendar,
  Clock,
  X,
  Link as LinkIcon,
  CheckCircle2
} from 'lucide-react';

interface PastSession {
  id: string;
  topic: string;
  scheduledAt: string;
  duration: number;
  status: string;
  studentName?: string;
  studentId?: string;
  recordingUrl?: string;
  completedAt?: string;
  sessionType?: string;
  registeredStudents?: string[];
}

export default function PastSessionsContent() {
  const [sessions, setSessions] = useState<PastSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<PastSession | null>(null);
  const [showAddRecording, setShowAddRecording] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPastSessions();
  }, []);

  const loadPastSessions = async () => {
    try {
      setLoading(true);
      const response = await api.session.getPastSessions();
      setSessions(response.sessions || []);
    } catch (err: any) {
      console.error('Error loading past sessions:', err);
      toast.error('Failed to Load', {
        description: 'Could not load past sessions. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecording = (session: PastSession) => {
    setSelectedSession(session);
    setRecordingUrl(session.recordingUrl || '');
    setShowAddRecording(true);
  };

  const handleSaveRecording = async () => {
    if (!selectedSession || !recordingUrl.trim()) {
      toast.error('Recording URL Required', {
        description: 'Please enter a valid recording URL.',
      });
      return;
    }

    try {
      setSaving(true);
      await api.session.addRecording(selectedSession.id, {
        recordingUrl: recordingUrl.trim(),
        recordingType: 'link'
      });

      toast.success('Recording Added!', {
        description: 'Students can now access the session recording.',
        duration: 4000,
      });

      // Refresh sessions
      await loadPastSessions();
      setShowAddRecording(false);
      setSelectedSession(null);
      setRecordingUrl('');
    } catch (err: any) {
      console.error('Error saving recording:', err);
      toast.error('Failed to Save', {
        description: err.message || 'Could not save recording. Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  const getAvatarColor = (id: string) => {
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = [
      '#021ff6', // brand
      '#00c896', // accent
      '#f59e0b', // warn
      '#10b981', // success
      '#ef4444', // danger
      '#7c3aed'  // purple
    ];
    return colors[hash % colors.length];
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    return parts.map(p => p[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <>
      <div className="p-5">
        {loading ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-[var(--ispora-brand-light)] rounded-full flex items-center justify-center mx-auto mb-3 animate-pulse">
              <Video className="w-5 h-5 text-[var(--ispora-brand)]" />
            </div>
            <p className="text-xs text-[var(--ispora-text3)]">Loading session library...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-[var(--ispora-brand-light)] rounded-full flex items-center justify-center mx-auto mb-3">
              <Video className="w-5 h-5 text-[var(--ispora-brand)]" strokeWidth={2} />
            </div>
            <h3 className="font-syne text-sm font-bold text-[var(--ispora-text)] mb-1">
              Your session library is empty
            </h3>
            <p className="text-xs text-[var(--ispora-text3)] leading-relaxed max-w-xs mx-auto">
              Completed sessions will appear here. Add recording links to build your library for mentees to watch
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {sessions.map((session) => {
              const sessionDate = new Date(session.scheduledAt);
              const hasRecording = !!session.recordingUrl;
              
              return (
                <div
                  key={session.id}
                  className="bg-[#f7f8ff] border-[1.5px] border-[var(--ispora-border)] rounded-xl overflow-hidden transition-all hover:border-[var(--ispora-brand)] hover:shadow-sm"
                >
                  {/* Header */}
                  <div className="px-3 py-2.5 border-b border-[var(--ispora-border)]">
                    <h3 className="font-syne text-xs font-bold text-[var(--ispora-text)] mb-1 line-clamp-1">
                      {session.topic || 'Mentorship Session'}
                    </h3>
                    {session.studentName && (
                      <div className="flex items-center gap-1.5">
                        <div 
                          className="w-4 h-4 rounded-full flex items-center justify-center text-white font-bold text-[8px] flex-shrink-0"
                          style={{ background: getAvatarColor(session.studentId || session.id) }}
                        >
                          {getInitials(session.studentName)}
                        </div>
                        <span className="text-[10px] text-[var(--ispora-text2)]">{session.studentName}</span>
                      </div>
                    )}
                    {session.sessionType === 'public' && (
                      <div className="mt-1">
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--ispora-brand)] text-white font-semibold">
                          Public
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="px-3 py-2 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[10px] text-[var(--ispora-text2)]">
                      <Calendar className="w-3 h-3 text-[var(--ispora-text3)]" strokeWidth={2} />
                      {sessionDate.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-[var(--ispora-text2)]">
                      <Clock className="w-3 h-3 text-[var(--ispora-text3)]" strokeWidth={2} />
                      {session.duration} minutes
                    </div>
                    
                    {hasRecording && (
                      <div className="flex items-center gap-1.5 text-[10px] text-[var(--ispora-success)]">
                        <CheckCircle2 className="w-3 h-3" strokeWidth={2} />
                        Recording added
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="px-3 py-2 border-t border-[var(--ispora-border)] bg-white">
                    <button
                      onClick={() => handleAddRecording(session)}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all flex items-center justify-center gap-1.5 ${
                        hasRecording
                          ? 'bg-white border-[1.5px] border-[var(--ispora-border)] text-[var(--ispora-text2)] hover:border-[var(--ispora-brand)] hover:text-[var(--ispora-brand)]'
                          : 'bg-[var(--ispora-brand)] text-white hover:bg-[var(--ispora-brand-hover)]'
                      }`}
                    >
                      <LinkIcon className="w-3 h-3" strokeWidth={2} />
                      {hasRecording ? 'Update' : 'Add Recording'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Recording Modal */}
      {showAddRecording && selectedSession && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => {
            setShowAddRecording(false);
            setSelectedSession(null);
            setRecordingUrl('');
          }}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md shadow-[var(--ispora-shadow-lg)] overflow-hidden animate-[slideUp_0.2s_ease]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-[var(--ispora-border)] flex items-center justify-between">
              <div>
                <h3 className="font-syne text-lg font-bold text-[var(--ispora-text)]">
                  {selectedSession.recordingUrl ? 'Update Recording' : 'Add Recording'}
                </h3>
                <p className="text-xs text-[var(--ispora-text3)] mt-1">
                  {selectedSession.topic}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAddRecording(false);
                  setSelectedSession(null);
                  setRecordingUrl('');
                }}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--ispora-bg)] transition-colors"
              >
                <X className="w-5 h-5 text-[var(--ispora-text2)]" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[var(--ispora-text)] mb-2">
                  Recording URL
                </label>
                <input
                  type="url"
                  value={recordingUrl}
                  onChange={(e) => setRecordingUrl(e.target.value)}
                  placeholder="https://zoom.us/rec/... or https://drive.google.com/..."
                  className="w-full px-4 py-3 bg-white border-[1.5px] border-[var(--ispora-border)] rounded-xl text-sm text-[var(--ispora-text)] placeholder:text-[var(--ispora-text3)] outline-none focus:border-[var(--ispora-brand)] focus:ring-2 focus:ring-[var(--ispora-brand)]/20 transition-all"
                  autoFocus
                />
                <p className="text-xs text-[var(--ispora-text3)] mt-2">
                  💡 Paste the link to your Zoom recording, Google Drive video, or any other recording platform
                </p>
              </div>

              {/* Platform examples */}
              <div className="bg-[var(--ispora-brand-light)] rounded-lg p-3">
                <p className="text-xs font-semibold text-[var(--ispora-text)] mb-2">Supported platforms:</p>
                <ul className="text-xs text-[var(--ispora-text2)] space-y-1">
                  <li>• Zoom Cloud Recordings</li>
                  <li>• Google Drive / YouTube</li>
                  <li>• Loom, Vimeo, or any video link</li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[var(--ispora-border)] flex gap-3">
              <button
                onClick={() => {
                  setShowAddRecording(false);
                  setSelectedSession(null);
                  setRecordingUrl('');
                }}
                disabled={saving}
                className="flex-1 px-4 py-3 rounded-xl bg-white border-[1.5px] border-[var(--ispora-border)] text-[var(--ispora-text)] text-sm font-semibold hover:bg-[var(--ispora-bg)] hover:border-[var(--ispora-text2)] transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRecording}
                disabled={saving || !recordingUrl.trim()}
                className="flex-1 px-4 py-3 rounded-xl bg-[var(--ispora-brand)] text-white text-sm font-semibold hover:bg-[var(--ispora-brand-hover)] hover:shadow-[0_6px_18px_rgba(2,31,246,0.35)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
                    Save Recording
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </>
  );
}
