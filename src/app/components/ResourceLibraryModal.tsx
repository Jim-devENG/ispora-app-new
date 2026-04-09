import { useState, useEffect } from 'react';
import { X, FileText, Link as LinkIcon, Loader2, Users, Calendar, ChevronRight, Plus, Search, Upload } from 'lucide-react';
import { api } from '../lib/api';
import ShareResourceModal from './ShareResourceModal';

interface ResourceLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface Resource {
  id: string;
  type: 'file' | 'link' | 'note';
  title: string;
  description?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  linkUrl?: string;
  content?: string;
  createdAt: string;
  mentorshipId: string;
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
  capacity: number;
}

type ShareMode = 'mentees' | 'session';
type Step = 'library' | 'create-new' | 'select-recipients';

export default function ResourceLibraryModal({
  isOpen,
  onClose,
  onSuccess
}: ResourceLibraryModalProps) {
  const [step, setStep] = useState<Step>('library');
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  
  // Recipient selection
  const [shareMode, setShareMode] = useState<ShareMode>('mentees');
  const [mentees, setMentees] = useState<Mentee[]>([]);
  const [publicSessions, setPublicSessions] = useState<PublicSession[]>([]);
  const [selectedMenteeIds, setSelectedMenteeIds] = useState<string[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [loadingSessions, setLoadingSessions] = useState(false);
  
  // Create new resource modal
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadResources();
      loadMentees();
      loadPublicSessions();
    }
  }, [isOpen]);

  const loadResources = async () => {
    try {
      setLoading(true);
      // Get all mentorships to fetch their resources
      const mentorshipsResponse = await api.mentorship.getAll();
      const mentorships = mentorshipsResponse.mentorships || [];
      
      // Fetch resources for each mentorship
      const resourcePromises = mentorships.map(async (m: any) => {
        try {
          const response = await api.resource.getAll(m.id);
          return (response.resources || []).map((r: any) => ({
            ...r,
            mentorshipId: m.id
          }));
        } catch (error) {
          console.error(`Failed to load resources for mentorship ${m.id}:`, error);
          return [];
        }
      });
      
      const allResourceArrays = await Promise.all(resourcePromises);
      const allResources = allResourceArrays.flat();
      
      // Deduplicate resources by unique properties (title + type + created date)
      const uniqueResources = allResources.reduce((acc: Resource[], resource: any) => {
        const key = `${resource.title}-${resource.type}-${resource.createdAt}`;
        const existing = acc.find(r => 
          `${r.title}-${r.type}-${r.createdAt}` === key
        );
        if (!existing) {
          acc.push(resource);
        }
        return acc;
      }, []);
      
      // Sort by newest first
      uniqueResources.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setResources(uniqueResources);
    } catch (error) {
      console.error('Failed to load resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMentees = async () => {
    try {
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
    }
  };

  const loadPublicSessions = async () => {
    try {
      setLoadingSessions(true);
      const response = await api.session.getAll();
      const allSessions = response.sessions || [];
      
      console.log('=== DEBUG: All sessions from API ===');
      console.log('Total sessions:', allSessions.length);
      allSessions.forEach((s: any, idx: number) => {
        console.log(`Session ${idx + 1}:`, {
          id: s.id,
          topic: s.topic,
          status: s.status,
          scheduledAt: s.scheduledAt,
          notes: s.notes,
          notesType: typeof s.notes
        });
      });
      
      const now = new Date();
      console.log('Current time:', now.toISOString());
      
      const futureSessions = allSessions
        .filter((s: any) => {
          const sessionDate = new Date(s.scheduledAt);
          const isFuture = sessionDate > now;
          const isScheduled = s.status === 'scheduled';
          console.log(`Session "${s.topic}":`, {
            scheduledAt: sessionDate.toISOString(),
            isFuture,
            status: s.status,
            isScheduled,
            passes: isFuture && isScheduled
          });
          return isFuture && isScheduled;
        })
        .map((s: any) => {
          // Parse session notes to get session details
          let sessionDetails = { 
            sessionType: 'private', 
            registeredCount: 0, 
            registeredStudents: [], 
            capacity: 10 
          };
          
          console.log(`Parsing notes for "${s.topic}":`, s.notes);
          
          // Only try to parse if notes exists and looks like JSON (starts with {)
          if (s.notes && typeof s.notes === 'string' && s.notes.trim().startsWith('{')) {
            try {
              const parsed = JSON.parse(s.notes);
              console.log(`Parsed successfully:`, parsed);
              sessionDetails = { ...sessionDetails, ...parsed };
            } catch (e) {
              console.log(`Parse failed:`, e);
            }
          } else {
            console.log(`Skipping parse - notes don't look like JSON`);
          }

          const result = {
            id: s.id,
            topic: s.topic || 'Mentorship Session',
            scheduledAt: s.scheduledAt,
            registeredCount: sessionDetails.registeredCount || sessionDetails.registeredStudents?.length || 0,
            registeredStudents: sessionDetails.registeredStudents || [],
            isPublic: sessionDetails.sessionType === 'public',
            capacity: sessionDetails.capacity || 10,
          };
          
          console.log(`Mapped session "${s.topic}":`, result);
          return result;
        })
        .filter((s: any) => {
          console.log(`Final filter for "${s.topic}":`, {
            isPublic: s.isPublic,
            passes: s.isPublic
          });
          return s.isPublic;
        });
      
      console.log('=== Final public sessions ===:', futureSessions);
      setPublicSessions(futureSessions);
    } catch (error) {
      console.error('Failed to load public sessions:', error);
    } finally {
      setLoadingSessions(false);
    }
  };

  if (!isOpen) return null;

  const resetForm = () => {
    setStep('library');
    setSelectedResourceIds([]);
    setSearchQuery('');
    setShareMode('mentees');
    setSelectedMenteeIds([]);
    setSelectedSessionId('');
  };

  const handleClose = () => {
    if (!sharing) {
      resetForm();
      onClose();
    }
  };

  const toggleResourceSelection = (resourceId: string) => {
    setSelectedResourceIds(prev =>
      prev.includes(resourceId)
        ? prev.filter(id => id !== resourceId)
        : [...prev, resourceId]
    );
  };

  const toggleMenteeSelection = (menteeId: string) => {
    setSelectedMenteeIds(prev =>
      prev.includes(menteeId)
        ? prev.filter(id => id !== menteeId)
        : [...prev, menteeId]
    );
  };

  const handleShare = async () => {
    if (selectedResourceIds.length === 0) {
      alert('Please select at least one resource');
      return;
    }

    // Determine recipient list
    let recipientMentorshipIds: string[] = [];
    
    if (shareMode === 'session' && selectedSessionId) {
      try {
        // Find the selected session from our local state (already parsed)
        const selectedSession = publicSessions.find(s => s.id === selectedSessionId);
        
        if (selectedSession && selectedSession.registeredStudents && selectedSession.registeredStudents.length > 0) {
          // Get all mentorships and find matches
          const allMentorships = await api.mentorship.getAll();
          recipientMentorshipIds = allMentorships.mentorships
            .filter((m: any) => 
              m.status === 'active' && 
              selectedSession.registeredStudents.includes(m.studentId)
            )
            .map((m: any) => m.id);
          
          console.log('Session attendees student IDs:', selectedSession.registeredStudents);
          console.log('Matched mentorship IDs:', recipientMentorshipIds);
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
      setSharing(true);

      // Get selected resources
      const resourcesToShare = resources.filter(r => selectedResourceIds.includes(r.id));

      // Share each resource with each recipient
      const sharePromises = recipientMentorshipIds.flatMap(mentorshipId =>
        resourcesToShare.map(resource => {
          if (resource.type === 'file') {
            // For files, we need to re-upload or copy
            // Since we can't directly copy, we'll create a link to existing file
            return api.resource.create({
              mentorshipId,
              type: resource.type,
              title: resource.title,
              description: resource.description,
              fileUrl: resource.fileUrl, // Reference existing file
            });
          } else {
            return api.resource.create({
              mentorshipId,
              type: resource.type,
              title: resource.title,
              description: resource.description,
              linkUrl: resource.linkUrl,
              content: resource.content,
            });
          }
        })
      );

      await Promise.all(sharePromises);

      alert(`Successfully shared ${selectedResourceIds.length} resource(s) with ${recipientMentorshipIds.length} recipient(s)!`);
      
      handleClose();
      if (onSuccess) {
        onSuccess();
      }

    } catch (error) {
      console.error('Failed to share resources:', error);
      alert('Failed to share resources. Please try again.');
    } finally {
      setSharing(false);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'file':
        return <FileText className="w-5 h-5" />;
      case 'link':
        return <LinkIcon className="w-5 h-5" />;
      case 'note':
        return <FileText className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getResourceColor = (type: string) => {
    switch (type) {
      case 'file':
        return 'bg-blue-100 text-blue-600';
      case 'link':
        return 'bg-green-100 text-green-600';
      case 'note':
        return 'bg-purple-100 text-purple-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const filteredResources = resources.filter(resource =>
    resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRecipientSummary = () => {
    if (shareMode === 'session' && selectedSessionId) {
      const session = publicSessions.find(s => s.id === selectedSessionId);
      return session ? `${session.registeredCount} attendees from "${session.topic}"` : '';
    }
    return `${selectedMenteeIds.length} student${selectedMenteeIds.length !== 1 ? 's' : ''}`;
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 md:p-4">
        <div className="bg-white rounded-2xl w-full max-w-[95vw] md:max-w-[680px] lg:max-w-[800px] shadow-2xl max-h-[88vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-[var(--ispora-border)] flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-syne text-xl font-bold text-[var(--ispora-text)] mb-1">
                  {step === 'library' ? 'Resource Library' : 'Select Recipients'}
                </h2>
                <p className="text-sm text-[var(--ispora-text3)]">
                  {step === 'library' 
                    ? 'Select resources to share with your mentees'
                    : `Sharing ${selectedResourceIds.length} resource${selectedResourceIds.length !== 1 ? 's' : ''}`
                  }
                </p>
              </div>
              <button
                onClick={handleClose}
                disabled={sharing}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--ispora-bg)] transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5 text-[var(--ispora-text2)]" />
              </button>
            </div>
          </div>

          {/* Library View */}
          {step === 'library' && (
            <>
              {/* Search & Actions */}
              <div className="p-6 border-b border-[var(--ispora-border)] flex-shrink-0 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ispora-text3)]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search resources..."
                    className="w-full pl-10 pr-4 py-2.5 bg-[var(--ispora-bg)] border border-[var(--ispora-border)] rounded-xl text-sm text-[var(--ispora-text)] placeholder:text-[var(--ispora-text3)] outline-none focus:border-[var(--ispora-brand)] transition-all"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[var(--ispora-text3)]">
                    {selectedResourceIds.length > 0 && (
                      <span className="font-semibold text-[var(--ispora-brand)]">
                        {selectedResourceIds.length} selected
                      </span>
                    )}
                  </p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 rounded-lg bg-[var(--ispora-bg)] border border-[var(--ispora-border)] text-sm font-semibold text-[var(--ispora-text)] hover:border-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] transition-all flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create New Resource
                  </button>
                </div>
              </div>

              {/* Resources List */}
              <div className="flex-1 overflow-y-auto p-6">
                {loading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-[var(--ispora-brand)]" />
                  </div>
                ) : filteredResources.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-[var(--ispora-bg)] rounded-full flex items-center justify-center mx-auto mb-4">
                      <Upload className="w-8 h-8 text-[var(--ispora-text3)]" />
                    </div>
                    <h3 className="text-lg font-bold text-[var(--ispora-text)] mb-2">
                      {searchQuery ? 'No resources found' : 'No resources yet'}
                    </h3>
                    <p className="text-sm text-[var(--ispora-text3)] mb-4">
                      {searchQuery 
                        ? 'Try a different search term'
                        : 'Create your first resource to share with mentees'
                      }
                    </p>
                    {!searchQuery && (
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-6 py-2.5 rounded-xl bg-[var(--ispora-brand)] text-white text-sm font-semibold hover:bg-[var(--ispora-brand-hover)] transition-all inline-flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Create Resource
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredResources.map((resource) => (
                      <button
                        key={resource.id}
                        onClick={() => toggleResourceSelection(resource.id)}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                          selectedResourceIds.includes(resource.id)
                            ? 'border-[var(--ispora-brand)] bg-[var(--ispora-brand-light)]'
                            : 'border-[var(--ispora-border)] hover:border-[var(--ispora-brand)]'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg ${getResourceColor(resource.type)} flex items-center justify-center flex-shrink-0`}>
                            {getResourceIcon(resource.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm text-[var(--ispora-text)] mb-1 truncate">
                              {resource.title}
                            </h4>
                            {resource.description && (
                              <p className="text-xs text-[var(--ispora-text3)] mb-2 line-clamp-2">
                                {resource.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 text-xs text-[var(--ispora-text3)]">
                              <span className="capitalize">{resource.type}</span>
                              <span>•</span>
                              <span>{formatDate(resource.createdAt)}</span>
                              {resource.type === 'file' && resource.fileSize && (
                                <>
                                  <span>•</span>
                                  <span>{formatFileSize(resource.fileSize)}</span>
                                </>
                              )}
                            </div>
                          </div>
                          {selectedResourceIds.includes(resource.id) && (
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
              </div>

              {/* Footer */}
              {filteredResources.length > 0 && (
                <div className="p-6 border-t border-[var(--ispora-border)] flex gap-3 flex-shrink-0">
                  <button
                    onClick={handleClose}
                    className="px-6 py-2.5 rounded-xl border-[1.5px] border-[var(--ispora-border)] text-sm font-semibold text-[var(--ispora-text)] hover:border-[var(--ispora-brand)] hover:text-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setStep('select-recipients')}
                    disabled={selectedResourceIds.length === 0}
                    className="flex-1 px-6 py-2.5 rounded-xl bg-[var(--ispora-brand)] text-white text-sm font-semibold hover:bg-[var(--ispora-brand-hover)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    Continue to Recipients
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}

          {/* Select Recipients */}
          {step === 'select-recipients' && (
            <>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-[var(--ispora-text)]">
                    Choose Recipients
                  </h3>
                  <button
                    onClick={() => setStep('library')}
                    className="text-sm text-[var(--ispora-brand)] hover:underline"
                  >
                    ← Back to Library
                  </button>
                </div>

                {/* Share Mode Selection */}
                <div className="space-y-3 mb-6">
                  <button
                    onClick={() => {
                      setShareMode('mentees');
                      setSelectedSessionId('');
                    }}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      shareMode === 'mentees'
                        ? 'border-[var(--ispora-brand)] bg-[var(--ispora-brand-light)]'
                        : 'border-[var(--ispora-border)] hover:border-[var(--ispora-brand)]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                        <Users className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm text-[var(--ispora-text)]">
                          My Mentees
                        </h4>
                        <p className="text-xs text-[var(--ispora-text3)]">
                          Select one or multiple students
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setShareMode('session');
                      setSelectedMenteeIds([]);
                    }}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      shareMode === 'session'
                        ? 'border-[var(--ispora-brand)] bg-[var(--ispora-brand-light)]'
                        : 'border-[var(--ispora-border)] hover:border-[var(--ispora-brand)]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm text-[var(--ispora-text)]">
                          Public Session Attendees
                        </h4>
                        <p className="text-xs text-[var(--ispora-text3)]">
                          Share with all registered students
                        </p>
                      </div>
                    </div>
                  </button>
                </div>

                {/* Recipient List */}
                <div className="space-y-2">
                  {shareMode === 'session' ? (
                    <>
                      <p className="text-xs text-[var(--ispora-text3)] mb-2">
                        DEBUG: Found {publicSessions.length} public session(s)
                      </p>
                      {publicSessions.length === 0 ? (
                        <div className="text-center py-8">
                          <Calendar className="w-12 h-12 text-[var(--ispora-text3)] mx-auto mb-3" />
                          <p className="text-sm text-[var(--ispora-text3)]">
                            No upcoming public sessions found
                          </p>
                        </div>
                      ) : (
                        publicSessions.map((session) => (
                          <button
                            key={session.id}
                            onClick={() => setSelectedSessionId(session.id)}
                            disabled={session.registeredCount === 0}
                            className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                              session.registeredCount === 0
                                ? 'opacity-50 cursor-not-allowed border-[var(--ispora-border)]'
                                : selectedSessionId === session.id
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
                                  {session.registeredCount === 0 && ' (No attendees yet)'}
                                </p>
                              </div>
                              {selectedSessionId === session.id && session.registeredCount > 0 && (
                                <div className="w-5 h-5 rounded-full bg-[var(--ispora-brand)] text-white flex items-center justify-center flex-shrink-0 ml-3">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </div>
                          </button>
                        ))
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-[var(--ispora-text3)] mb-3">
                        Selected: {selectedMenteeIds.length} student{selectedMenteeIds.length !== 1 ? 's' : ''}
                      </p>
                      {mentees.length === 0 ? (
                        <div className="text-center py-8">
                          <Users className="w-12 h-12 text-[var(--ispora-text3)] mx-auto mb-3" />
                          <p className="text-sm text-[var(--ispora-text3)]">
                            No active mentees found
                          </p>
                        </div>
                      ) : (
                        mentees.map((mentee) => (
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
                        ))
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-[var(--ispora-border)] flex gap-3 flex-shrink-0">
                <button
                  onClick={() => setStep('library')}
                  disabled={sharing}
                  className="px-6 py-2.5 rounded-xl border-[1.5px] border-[var(--ispora-border)] text-sm font-semibold text-[var(--ispora-text)] hover:border-[var(--ispora-brand)] hover:text-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] transition-all disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={handleShare}
                  disabled={
                    sharing ||
                    (shareMode === 'session' && !selectedSessionId) ||
                    (shareMode !== 'session' && selectedMenteeIds.length === 0)
                  }
                  className="flex-1 px-6 py-2.5 rounded-xl bg-[var(--ispora-brand)] text-white text-sm font-semibold hover:bg-[var(--ispora-brand-hover)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {sharing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sharing...
                    </>
                  ) : (
                    <>
                      Share {selectedResourceIds.length} Resource{selectedResourceIds.length !== 1 ? 's' : ''}
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create New Resource Modal */}
      <ShareResourceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          loadResources(); // Reload resources after creating new one
        }}
      />
    </>
  );
}