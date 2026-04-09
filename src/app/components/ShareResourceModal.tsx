import { useState, useEffect } from 'react';
import { X, Link as LinkIcon, FileText, Send, Loader2, Users, Calendar, ChevronRight } from 'lucide-react';
import { api } from '../lib/api';

interface ShareResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  mentorshipId?: string; // Optional - if provided, pre-selects this mentee
  studentName?: string; // Optional - if provided, shows single mode
  onSuccess?: () => void;
}

interface Mentee {
  id: string;
  name: string;
  initials: string;
  field: string;
  university: string;
}

interface PublicSession {
  id: string;
  topic: string;
  scheduledAt: string;
  registeredCount: number;
  registeredStudents: string[];
  isPublic: boolean;
}

type ShareMode = 'mentees' | 'session';
type Step = 'select-mode' | 'select-recipients' | 'create-resource';

export default function ShareResourceModal({
  isOpen,
  onClose,
  mentorshipId,
  studentName,
  onSuccess
}: ShareResourceModalProps) {
  const [step, setStep] = useState<Step>(mentorshipId ? 'create-resource' : 'select-mode');
  const [shareMode, setShareMode] = useState<ShareMode>(mentorshipId ? 'mentees' : 'mentees');
  const [activeTab, setActiveTab] = useState<'link' | 'note'>('link');
  
  // Recipient selection
  const [mentees, setMentees] = useState<Mentee[]>([]);
  const [publicSessions, setPublicSessions] = useState<PublicSession[]>([]);
  const [selectedMenteeIds, setSelectedMenteeIds] = useState<string[]>(mentorshipId ? [mentorshipId] : []);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  
  // Resource data
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [noteContent, setNoteContent] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Update state when modal opens with a specific mentorshipId
  useEffect(() => {
    if (isOpen && mentorshipId) {
      setStep('create-resource');
      setShareMode('mentees');
      setSelectedMenteeIds([mentorshipId]);
    }
  }, [isOpen, mentorshipId]);

  useEffect(() => {
    if (isOpen && !mentorshipId) {
      loadMentees();
      loadPublicSessions();
    }
  }, [isOpen]);

  const loadMentees = async () => {
    try {
      setLoading(true);
      const response = await api.mentorship.getAll();
      const mentorships = response.mentorships || [];
      
      const activeMentees = mentorships
        .filter((m: any) => m.status === 'active')
        .map((m: any) => ({
          id: m.id,
          name: m.student ? `${m.student.firstName} ${m.student.lastName}` : 'Unknown',
          initials: m.student ? `${m.student.firstName[0]}${m.student.lastName[0]}` : 'U',
          field: m.student?.fieldOfStudy || 'Not specified',
          university: m.student?.university || 'Unknown University',
        }));
      
      setMentees(activeMentees);
    } catch (error) {
      console.error('Failed to load mentees:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPublicSessions = async () => {
    try {
      const response = await api.session.getAll();
      const allSessions = response.sessions || [];
      
      console.log('ShareResourceModal - All sessions:', allSessions);
      
      // Filter for future public sessions
      const now = new Date();
      const futureSessions = allSessions
        .filter((s: any) => {
          const sessionDate = new Date(s.scheduledAt);
          return sessionDate > now && s.status === 'scheduled';
        })
        .map((s: any) => {
          // Parse session notes to get session details
          let sessionDetails = { 
            sessionType: 'private', 
            registeredCount: 0, 
            registeredStudents: [], 
            capacity: 10 
          };
          
          // Only try to parse if notes exists and looks like JSON (starts with {)
          if (s.notes && typeof s.notes === 'string' && s.notes.trim().startsWith('{')) {
            try {
              const parsed = JSON.parse(s.notes);
              sessionDetails = { ...sessionDetails, ...parsed };
            } catch (e) {
              // Silently ignore parse errors for non-JSON notes
            }
          }

          return {
            id: s.id,
            topic: s.topic || 'Mentorship Session',
            scheduledAt: s.scheduledAt,
            registeredCount: sessionDetails.registeredCount || sessionDetails.registeredStudents?.length || 0,
            registeredStudents: sessionDetails.registeredStudents || [],
            isPublic: sessionDetails.sessionType === 'public',
          };
        })
        .filter((s: any) => s.isPublic); // Show all public sessions
      
      console.log('ShareResourceModal - Public sessions:', futureSessions);
      setPublicSessions(futureSessions);
    } catch (error) {
      console.error('Failed to load public sessions:', error);
    }
  };

  if (!isOpen) return null;

  const resetForm = () => {
    if (!mentorshipId) {
      setStep('select-mode');
      setShareMode('mentees');
      setSelectedMenteeIds([]);
      setSelectedSessionId('');
    }
    setTitle('');
    setDescription('');
    setLinkUrl('');
    setNoteContent('');
    setSuccess(false);
  };

  const handleClose = () => {
    if (!uploading) {
      resetForm();
      onClose();
    }
  };

  const toggleMenteeSelection = (menteeId: string) => {
    // For mentees mode, always allow checkbox-style (multiple) selection
    setSelectedMenteeIds(prev =>
      prev.includes(menteeId)
        ? prev.filter(id => id !== menteeId)
        : [...prev, menteeId]
    );
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      alert('Please enter a title');
      return;
    }

    if (activeTab === 'link' && !linkUrl.trim()) {
      alert('Please enter a URL');
      return;
    }

    if (activeTab === 'note' && !noteContent.trim()) {
      alert('Please enter note content');
      return;
    }

    // Determine recipient list
    let recipientMentorshipIds: string[] = [];
    
    if (shareMode === 'session' && selectedSessionId) {
      // Get all registered students for this session
      try {
        const response = await api.session.getAll();
        const session = response.sessions.find((s: any) => s.id === selectedSessionId);
        if (session && session.registeredStudents) {
          // Find mentorship IDs for registered students
          const allMentorships = await api.mentorship.getAll();
          recipientMentorshipIds = allMentorships.mentorships
            .filter((m: any) => 
              m.status === 'active' && 
              session.registeredStudents.includes(m.studentId)
            )
            .map((m: any) => m.id);
        }
      } catch (error) {
        console.error('Failed to get session attendees:', error);
        alert('Failed to get session attendees. Please try again.');
        return;
      }
    } else {
      recipientMentorshipIds = selectedMenteeIds;
    }

    if (recipientMentorshipIds.length === 0) {
      alert('Please select at least one recipient');
      return;
    }

    try {
      setUploading(true);

      // Share resource with each recipient
      const sharePromises = recipientMentorshipIds.map(async (mentorshipId) => {
        return api.resource.create({
          mentorshipId,
          type: activeTab,
          title: title.trim(),
          description: description.trim() || undefined,
          linkUrl: activeTab === 'link' ? linkUrl.trim() : undefined,
          content: activeTab === 'note' ? noteContent.trim() : undefined
        });
      });

      await Promise.all(sharePromises);

      setSuccess(true);
      
      // Show success briefly then close
      setTimeout(() => {
        handleClose();
        if (onSuccess) {
          onSuccess();
        }
      }, 2000);

    } catch (error) {
      console.error('Failed to share resource:', error);
      alert('Failed to share resource. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getRecipientSummary = () => {
    if (shareMode === 'session' && selectedSessionId) {
      const session = publicSessions.find(s => s.id === selectedSessionId);
      return session ? `${session.registeredCount} attendees from "${session.topic}"` : '';
    }
    if (selectedMenteeIds.length === 1 && studentName) {
      return studentName;
    }
    return `${selectedMenteeIds.length} student${selectedMenteeIds.length !== 1 ? 's' : ''}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[var(--ispora-border)] flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-syne text-xl font-bold text-[var(--ispora-text)]">
              Share Resource
            </h2>
            <button
              onClick={handleClose}
              disabled={uploading}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--ispora-bg)] transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5 text-[var(--ispora-text2)]" />
            </button>
          </div>
          {step === 'create-resource' && (
            <p className="text-sm text-[var(--ispora-text3)]">
              Sharing with: <span className="font-semibold text-[var(--ispora-text)]">{getRecipientSummary()}</span>
            </p>
          )}
        </div>

        {/* Success State */}
        {success ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Send className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-[var(--ispora-text)] mb-2">Resource Shared!</h3>
              <p className="text-sm text-[var(--ispora-text3)]">
                {selectedMenteeIds.length === 1 
                  ? 'Your mentee can now access this resource'
                  : `Shared with ${getRecipientSummary()}`}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Step 1: Select Share Mode */}
            {step === 'select-mode' && (
              <div className="flex-1 overflow-y-auto p-6">
                <h3 className="text-lg font-bold text-[var(--ispora-text)] mb-4">
                  Who would you like to share with?
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setShareMode('mentees');
                      setStep('select-recipients');
                    }}
                    className="w-full p-4 rounded-xl border-2 border-[var(--ispora-border)] hover:border-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] transition-all text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                          <Users className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-base text-[var(--ispora-text)] mb-1">
                            My Mentees
                          </h4>
                          <p className="text-sm text-[var(--ispora-text3)]">
                            Select one or multiple students
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-[var(--ispora-text3)] group-hover:text-[var(--ispora-brand)]" />
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setShareMode('session');
                      setStep('select-recipients');
                    }}
                    className="w-full p-4 rounded-xl border-2 border-[var(--ispora-border)] hover:border-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] transition-all text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
                          <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-base text-[var(--ispora-text)] mb-1">
                            Public Session Attendees
                          </h4>
                          <p className="text-sm text-[var(--ispora-text3)]">
                            Share with all registered students
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-[var(--ispora-text3)] group-hover:text-[var(--ispora-brand)]" />
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Select Recipients */}
            {step === 'select-recipients' && (
              <div className="flex-1 overflow-y-auto p-6">
                {shareMode === 'session' ? (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-[var(--ispora-text)]">
                        Select Public Session
                      </h3>
                      <button
                        onClick={() => setStep('select-mode')}
                        className="text-sm text-[var(--ispora-brand)] hover:underline"
                      >
                        Back
                      </button>
                    </div>
                    
                    {loading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-[var(--ispora-brand)]" />
                      </div>
                    ) : publicSessions.length === 0 ? (
                      <div className="text-center py-8">
                        <Calendar className="w-12 h-12 text-[var(--ispora-text3)] mx-auto mb-3" />
                        <p className="text-sm text-[var(--ispora-text3)]">
                          No public sessions with registered students found
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {publicSessions.map((session) => (
                          <button
                            key={session.id}
                            onClick={() => setSelectedSessionId(session.id)}
                            className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                              selectedSessionId === session.id
                                ? 'border-[var(--ispora-brand)] bg-[var(--ispora-brand-light)]'
                                : 'border-[var(--ispora-border)] hover:border-[var(--ispora-brand)]'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm text-[var(--ispora-text)] mb-1 truncate">
                                  {session.topic}
                                </h4>
                                <p className="text-xs text-[var(--ispora-text3)]">
                                  {formatDate(session.scheduledAt)} • {session.registeredCount} registered
                                </p>
                              </div>
                              {selectedSessionId === session.id && (
                                <div className="w-5 h-5 rounded-full bg-[var(--ispora-brand)] text-white flex items-center justify-center flex-shrink-0 ml-3">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-[var(--ispora-text)]">
                        Select Students
                      </h3>
                      <button
                        onClick={() => setStep('select-mode')}
                        className="text-sm text-[var(--ispora-brand)] hover:underline"
                      >
                        Back
                      </button>
                    </div>
                    
                    <p className="text-sm text-[var(--ispora-text3)] mb-4">
                      Selected: {selectedMenteeIds.length} student{selectedMenteeIds.length !== 1 ? 's' : ''}
                    </p>
                    
                    {loading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-[var(--ispora-brand)]" />
                      </div>
                    ) : mentees.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="w-12 h-12 text-[var(--ispora-text3)] mx-auto mb-3" />
                        <p className="text-sm text-[var(--ispora-text3)]">
                          No active mentees found
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {mentees.map((mentee) => (
                          <button
                            key={mentee.id}
                            onClick={() => toggleMenteeSelection(mentee.id)}
                            className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                              selectedMenteeIds.includes(mentee.id)
                                ? 'border-[var(--ispora-brand)] bg-[var(--ispora-brand-light)]'
                                : 'border-[var(--ispora-border)] hover:border-[var(--ispora-brand)]'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-[var(--ispora-brand)] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                                {mentee.initials}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm text-[var(--ispora-text)] truncate">
                                  {mentee.name}
                                </h4>
                                <p className="text-xs text-[var(--ispora-text3)] truncate">
                                  {mentee.field} • {mentee.university}
                                </p>
                              </div>
                              {selectedMenteeIds.includes(mentee.id) && (
                                <div className="w-5 h-5 rounded-full bg-[var(--ispora-brand)] text-white flex items-center justify-center flex-shrink-0">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* Continue Button */}
                <div className="mt-6">
                  <button
                    onClick={() => setStep('create-resource')}
                    disabled={
                      (shareMode === 'session' && !selectedSessionId) ||
                      (shareMode !== 'session' && selectedMenteeIds.length === 0)
                    }
                    className="w-full px-4 py-3 rounded-xl bg-[var(--ispora-brand)] text-white text-sm font-semibold hover:bg-[var(--ispora-brand-hover)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    Continue
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Create Resource */}
            {step === 'create-resource' && (
              <>
                {/* Tabs */}
                <div className="flex gap-1 p-4 border-b border-[var(--ispora-border)] flex-shrink-0">
                  <button
                    onClick={() => setActiveTab('link')}
                    disabled={uploading}
                    className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 ${
                      activeTab === 'link'
                        ? 'bg-[var(--ispora-brand)] text-white'
                        : 'text-[var(--ispora-text2)] hover:bg-[var(--ispora-bg)]'
                    }`}
                  >
                    <LinkIcon className="w-4 h-4 inline-block mr-2" />
                    Share Link
                  </button>
                  <button
                    onClick={() => setActiveTab('note')}
                    disabled={uploading}
                    className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 ${
                      activeTab === 'note'
                        ? 'bg-[var(--ispora-brand)] text-white'
                        : 'text-[var(--ispora-text2)] hover:bg-[var(--ispora-bg)]'
                    }`}
                  >
                    <FileText className="w-4 h-4 inline-block mr-2" />
                    Write Note
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {!mentorshipId && (
                    <button
                      onClick={() => setStep('select-recipients')}
                      disabled={uploading}
                      className="text-sm text-[var(--ispora-brand)] hover:underline mb-4 disabled:opacity-50"
                    >
                      ← Change recipients
                    </button>
                  )}

                  {/* Link Tab */}
                  {activeTab === 'link' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-[var(--ispora-text)] mb-2">
                          Title *
                        </label>
                        <input
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          disabled={uploading}
                          placeholder="e.g., Useful Article on Web Development"
                          className="w-full px-4 py-2.5 bg-[var(--ispora-bg)] border border-[var(--ispora-border)] rounded-xl text-sm text-[var(--ispora-text)] placeholder:text-[var(--ispora-text3)] outline-none focus:border-[var(--ispora-brand)] transition-all disabled:opacity-50"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-[var(--ispora-text)] mb-2">
                          URL *
                        </label>
                        <input
                          type="url"
                          value={linkUrl}
                          onChange={(e) => setLinkUrl(e.target.value)}
                          disabled={uploading}
                          placeholder="https://example.com/article"
                          className="w-full px-4 py-2.5 bg-[var(--ispora-bg)] border border-[var(--ispora-border)] rounded-xl text-sm text-[var(--ispora-text)] placeholder:text-[var(--ispora-text3)] outline-none focus:border-[var(--ispora-brand)] transition-all disabled:opacity-50"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-[var(--ispora-text)] mb-2">
                          Description (Optional)
                        </label>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          disabled={uploading}
                          placeholder="Why is this link useful? What will they learn?"
                          rows={4}
                          className="w-full px-4 py-2.5 bg-[var(--ispora-bg)] border border-[var(--ispora-border)] rounded-xl text-sm text-[var(--ispora-text)] placeholder:text-[var(--ispora-text3)] outline-none focus:border-[var(--ispora-brand)] transition-all resize-none disabled:opacity-50"
                        />
                      </div>
                    </div>
                  )}

                  {/* Note Tab */}
                  {activeTab === 'note' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-[var(--ispora-text)] mb-2">
                          Title *
                        </label>
                        <input
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          disabled={uploading}
                          placeholder="e.g., Tips for Technical Interviews"
                          className="w-full px-4 py-2.5 bg-[var(--ispora-bg)] border border-[var(--ispora-border)] rounded-xl text-sm text-[var(--ispora-text)] placeholder:text-[var(--ispora-text3)] outline-none focus:border-[var(--ispora-brand)] transition-all disabled:opacity-50"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-[var(--ispora-text)] mb-2">
                          Note Content *
                        </label>
                        <textarea
                          value={noteContent}
                          onChange={(e) => setNoteContent(e.target.value)}
                          disabled={uploading}
                          placeholder="Write your note here... You can include tips, advice, instructions, or any helpful information."
                          rows={10}
                          className="w-full px-4 py-2.5 bg-[var(--ispora-bg)] border border-[var(--ispora-border)] rounded-xl text-sm text-[var(--ispora-text)] placeholder:text-[var(--ispora-text3)] outline-none focus:border-[var(--ispora-brand)] transition-all resize-none disabled:opacity-50"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-[var(--ispora-text)] mb-2">
                          Description (Optional)
                        </label>
                        <input
                          type="text"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          disabled={uploading}
                          placeholder="Brief summary"
                          className="w-full px-4 py-2.5 bg-[var(--ispora-bg)] border border-[var(--ispora-border)] rounded-xl text-sm text-[var(--ispora-text)] placeholder:text-[var(--ispora-text3)] outline-none focus:border-[var(--ispora-brand)] transition-all disabled:opacity-50"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-[var(--ispora-border)] flex gap-3 flex-shrink-0">
                  <button
                    onClick={handleClose}
                    disabled={uploading}
                    className="flex-1 px-4 py-2.5 rounded-xl border-[1.5px] border-[var(--ispora-border)] text-sm font-semibold text-[var(--ispora-text)] hover:border-[var(--ispora-brand)] hover:text-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={uploading}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--ispora-brand)] text-white text-sm font-semibold hover:bg-[var(--ispora-brand-hover)] hover:shadow-[0_6px_18px_rgba(2,31,246,0.35)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sharing...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Share Resource
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}