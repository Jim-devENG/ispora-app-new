import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { toast } from 'sonner';
import {
  Search,
  MapPin,
  GraduationCap,
  Calendar,
  Globe,
  Send,
  X,
  CheckCircle2,
  Grid,
  List,
  Bookmark
} from 'lucide-react';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  university?: string;
  fieldOfStudy?: string;
  yearOfStudy?: string;
  location?: string;
  bio?: string;
  interests?: string[];
  careerGoals?: string;
  lookingFor?: string;
  status?: string;
  profilePicture?: string;
}

type ViewMode = 'grid' | 'list';
type FilterType = 'all' | 'my-mentees';

export default function BrowseStudents() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [mentorships, setMentorships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [fieldFilter, setFieldFilter] = useState('');
  const [universityFilter, setUniversityFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [inviteMessage, setInviteMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [savedStudents, setSavedStudents] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [studentsRes, mentorshipsRes] = await Promise.all([
        api.user.browseStudents(),
        api.mentorship.getAll()
      ]);
      
      setStudents(studentsRes.students || []);
      setMentorships(mentorshipsRes.mentorships || []);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message || 'Failed to load youth. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Check if a student is already a mentee
  const isMentee = (studentId: string) => {
    return mentorships.some(
      m => m.studentId === studentId && m.status === 'active'
    );
  };

  // Get unique fields and universities for filters
  const fields = Array.from(new Set(students.map(s => s.fieldOfStudy).filter(Boolean)));
  const universities = Array.from(new Set(students.map(s => s.university).filter(Boolean)));

  // Filter students
  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.university?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.fieldOfStudy?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesField = !fieldFilter || student.fieldOfStudy === fieldFilter;
    const matchesUniversity = !universityFilter || student.university === universityFilter;
    const matchesYear = !yearFilter || student.yearOfStudy === yearFilter;
    
    const matchesFilterType = 
      filterType === 'all' || 
      (filterType === 'my-mentees' && isMentee(student.id));

    return matchesSearch && matchesField && matchesUniversity && matchesYear && matchesFilterType;
  });

  const myMenteesCount = students.filter(s => isMentee(s.id)).length;
  const seekingCount = students.filter(s => s.status === 'seeking').length;

  const handleInvite = (student: Student) => {
    setSelectedStudent(student);
    setShowInviteModal(true);
    setInviteMessage('');
  };

  const handleSendRequest = async () => {
    if (!selectedStudent || !inviteMessage.trim()) {
      toast.error('Message Required', {
        description: 'Please write a message before sending your request.',
      });
      return;
    }

    try {
      setSending(true);
      await api.request.create({
        mentorId: selectedStudent.id,
        message: inviteMessage,
      });
      
      setShowInviteModal(false);
      setInviteMessage('');
      toast.success('Invitation Sent!', {
        description: `Your mentorship request has been sent to ${selectedStudent.firstName} ${selectedStudent.lastName}.`,
        duration: 5000,
      });
    } catch (err: any) {
      console.error('Failed to send request:', err);
      toast.error('Failed to Send', {
        description: 'Could not send invitation. Please try again.',
      });
    } finally {
      setSending(false);
    }
  };

  const openProfile = (student: Student) => {
    setSelectedStudent(student);
    setShowProfileModal(true);
  };

  const toggleSave = (studentId: string) => {
    const newSet = new Set(savedStudents);
    if (newSet.has(studentId)) {
      newSet.delete(studentId);
    } else {
      newSet.add(studentId);
    }
    setSavedStudents(newSet);
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

  const getStudentAvatar = (student: Student) => {
    return `${student.firstName?.[0] || ''}${student.lastName?.[0] || ''}`.toUpperCase();
  };

  const getStudentField = (student: Student) => {
    return student.fieldOfStudy || 'Undeclared';
  };

  const getStudentYear = (student: Student) => {
    return student.yearOfStudy || 'N/A';
  };

  // Tag color helper
  const getTagClass = (index: number) => {
    const classes = [
      'bg-[var(--ispora-brand-light)] text-[var(--ispora-brand)]',
      'bg-[var(--ispora-success-light)] text-[var(--ispora-success)]',
      'bg-[var(--ispora-accent-light)] text-[#0f766e]',
      'bg-[#f3e8ff] text-[#7c3aed]'
    ];
    return classes[index % classes.length];
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[var(--ispora-bg)]">
      {/* Search Hero Section */}
      <div className="bg-gradient-to-br from-[var(--ispora-brand)] via-[#1a35f8] to-[var(--ispora-brand-hover)] px-8 py-7 relative overflow-hidden">
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
            backgroundSize: '28px 28px'
          }}
        />
        
        {/* Decorative Orbs */}
        <div className="absolute -top-16 -right-10 w-60 h-60 bg-white/5 rounded-full pointer-events-none" />
        <div className="absolute -bottom-20 left-[30%] w-44 h-44 bg-white/[0.03] rounded-full pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 flex items-center justify-between gap-5 flex-wrap">
          <div className="flex-1 min-w-[300px]">
            <h1 className="font-dm-sans text-lg font-semibold text-white mb-1.5">
              Find your next mentee ✦
            </h1>
            <p className="text-xs text-white/70 leading-relaxed mb-4 max-w-[440px]">
              Discover talented students across Nigerian universities looking for guidance
            </p>

            {/* Search Row */}
            <div className="flex gap-2.5 items-center max-w-[440px]">
              <div className="relative flex-1">
                <Search 
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 stroke-white/60" 
                  strokeWidth={2}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, field, university..."
                  className="w-full bg-white/15 border-[1.5px] border-white/25 rounded-xl py-2.5 pl-10 pr-4 text-[13px] text-white placeholder:text-white/55 outline-none transition-all focus:bg-white/22 focus:border-white/50"
                />
              </div>
              <button 
                onClick={() => {/* Search is reactive */}}
                className="bg-white text-[var(--ispora-brand)] px-4 py-2 rounded-xl text-xs font-semibold hover:bg-[#f0f3ff] transition-colors flex items-center gap-2 h-[42px] flex-shrink-0"
              >
                <Search className="w-3.5 h-3.5" strokeWidth={2.5} />
                <span className="hidden sm:inline">Search</span>
              </button>
            </div>
          </div>

          {/* Stats Cards - Desktop: side by side, Mobile: stacked below */}
          <div className="flex gap-2.5 flex-shrink-0 w-full md:w-auto mt-4 md:mt-0">
            <div className="bg-white/[0.13] border border-white/20 rounded-xl px-3.5 py-2.5 text-center min-w-[70px] flex-1 md:flex-none">
              <div className="text-xl font-bold text-white leading-none">{students.length}</div>
              <div className="text-[10px] text-white/65 mt-1">Youth</div>
            </div>
            <div className="bg-white/[0.13] border border-white/20 rounded-xl px-3.5 py-2.5 text-center min-w-[70px] flex-1 md:flex-none">
              <div className="text-xl font-bold text-white leading-none">{seekingCount}</div>
              <div className="text-[10px] text-white/65 mt-1">Seeking</div>
            </div>
            <div className="bg-white/[0.13] border border-white/20 rounded-xl px-3.5 py-2.5 text-center min-w-[70px] flex-1 md:flex-none">
              <div className="text-xl font-bold text-white leading-none">{universities.length}</div>
              <div className="text-[10px] text-white/65 mt-1">Universities</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border-b-[1.5px] border-[var(--ispora-border)] px-8 py-3 flex items-center gap-2.5 flex-shrink-0 overflow-x-auto">
        <span className="text-xs font-semibold text-[var(--ispora-text3)] whitespace-nowrap mr-1">Filter:</span>
        
        <select 
          value={fieldFilter}
          onChange={(e) => setFieldFilter(e.target.value)}
          className="bg-[var(--ispora-bg)] border-[1.5px] border-[var(--ispora-border)] rounded-lg px-2.5 py-1.5 pr-8 text-xs text-[var(--ispora-text2)] outline-none cursor-pointer transition-all focus:border-[var(--ispora-brand)] focus:bg-[var(--ispora-brand-light)] appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2710%27 height=%2710%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%238b90b8%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e')] bg-[length:10px] bg-no-repeat bg-[right_8px_center]"
        >
          <option value="">All Fields</option>
          {fields.map(field => (
            <option key={field} value={field}>{field}</option>
          ))}
        </select>

        <select 
          value={universityFilter}
          onChange={(e) => setUniversityFilter(e.target.value)}
          className="bg-[var(--ispora-bg)] border-[1.5px] border-[var(--ispora-border)] rounded-lg px-2.5 py-1.5 pr-8 text-xs text-[var(--ispora-text2)] outline-none cursor-pointer transition-all focus:border-[var(--ispora-brand)] focus:bg-[var(--ispora-brand-light)] appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2710%27 height=%2710%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%238b90b8%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e')] bg-[length:10px] bg-no-repeat bg-[right_8px_center]"
        >
          <option value="">All Universities</option>
          {universities.map(uni => (
            <option key={uni} value={uni}>{uni}</option>
          ))}
        </select>

        <select 
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className="bg-[var(--ispora-bg)] border-[1.5px] border-[var(--ispora-border)] rounded-lg px-2.5 py-1.5 pr-8 text-xs text-[var(--ispora-text2)] outline-none cursor-pointer transition-all focus:border-[var(--ispora-brand)] focus:bg-[var(--ispora-brand-light)] appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2710%27 height=%2710%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%238b90b8%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e')] bg-[length:10px] bg-no-repeat bg-[right_8px_center]"
        >
          <option value="">All Years</option>
          <option value="1st">1st Year</option>
          <option value="2nd">2nd Year</option>
          <option value="3rd">3rd Year</option>
          <option value="final">Final Year</option>
          <option value="graduate">Graduate</option>
        </select>

        <div className="w-px h-5 bg-[var(--ispora-border)] flex-shrink-0" />

        {/* My Mentees Filter Button */}
        <button
          onClick={() => setFilterType(filterType === 'my-mentees' ? 'all' : 'my-mentees')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
            filterType === 'my-mentees'
              ? 'bg-[var(--ispora-brand)] text-white'
              : 'bg-[var(--ispora-bg)] text-[var(--ispora-text2)] border-[1.5px] border-[var(--ispora-border)] hover:border-[var(--ispora-brand)] hover:text-[var(--ispora-brand)]'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2} />
          My Mentees
          {myMenteesCount > 0 && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              filterType === 'my-mentees'
                ? 'bg-white/20 text-white'
                : 'bg-[var(--ispora-brand-light)] text-[var(--ispora-brand)]'
            }`}>
              {myMenteesCount}
            </span>
          )}
        </button>

        <div className="w-px h-5 bg-[var(--ispora-border)] flex-shrink-0" />

        <span className="text-xs text-[var(--ispora-text3)] whitespace-nowrap flex-shrink-0">
          <strong className="text-[var(--ispora-text)] font-semibold">{filteredStudents.length}</strong> results
        </span>

        {/* View Toggle */}
        <div className="flex gap-1 ml-auto flex-shrink-0">
          <button
            onClick={() => setViewMode('grid')}
            className={`w-8 h-8 rounded-lg flex items-center justify-center border-[1.5px] transition-all ${
              viewMode === 'grid'
                ? 'bg-[var(--ispora-brand)] border-[var(--ispora-brand)] text-white'
                : 'bg-[var(--ispora-bg)] border-[var(--ispora-border)] text-[var(--ispora-text3)] hover:border-[var(--ispora-brand)] hover:text-[var(--ispora-brand)]'
            }`}
          >
            <Grid className="w-4 h-4" strokeWidth={2} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`w-8 h-8 rounded-lg flex items-center justify-center border-[1.5px] transition-all ${
              viewMode === 'list'
                ? 'bg-[var(--ispora-brand)] border-[var(--ispora-brand)] text-white'
                : 'bg-[var(--ispora-bg)] border-[var(--ispora-border)] text-[var(--ispora-text3)] hover:border-[var(--ispora-brand)] hover:text-[var(--ispora-brand)]'
            }`}
          >
            <List className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Student Grid/List */}
      <div className="px-8 py-6">
        {loading ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 bg-[var(--ispora-brand-light)] rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Search className="w-6 h-6 text-[var(--ispora-brand)]" />
            </div>
            <p className="text-sm text-[var(--ispora-text3)]">Loading youth...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 bg-[var(--ispora-brand-light)] rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-6 h-6 text-[var(--ispora-brand)]" strokeWidth={2} />
            </div>
            <h3 className="font-syne text-base font-bold text-[var(--ispora-text)] mb-1.5">
              {students.length === 0 ? 'No youth registered yet' : 'No youth found'}
            </h3>
            <p className="text-[13px] text-[var(--ispora-text3)] leading-relaxed max-w-xs mx-auto">
              {students.length === 0 
                ? 'Students will appear here once they register on the platform.'
                : 'Try adjusting your filters or search terms to find students'
              }
            </p>
          </div>
        ) : (
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4'
              : 'flex flex-col gap-2.5'
          }>
            {filteredStudents.map((student, index) => {
              const isAlreadyMentee = isMentee(student.id);
              const isSaved = savedStudents.has(student.id);
              
              if (viewMode === 'list') {
                // List View Card
                return (
                  <div
                    key={student.id}
                    onClick={() => openProfile(student)}
                    className="bg-white border-[1.5px] border-[var(--ispora-border)] rounded-xl px-5 py-4 flex items-center gap-4 cursor-pointer transition-all hover:border-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] hover:translate-x-1"
                  >
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base flex-shrink-0 relative"
                      style={{ background: getAvatarColor(student.id) }}
                    >
                      {getStudentAvatar(student)}
                      {isAlreadyMentee && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[var(--ispora-accent)] border-2 border-white rounded-full" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[13px] text-[var(--ispora-text)]">
                        {student.firstName} {student.lastName}
                      </div>
                      <div className="text-[11px] text-[var(--ispora-text3)] mt-0.5">
                        {getStudentField(student)} · {student.university || 'University not specified'}
                      </div>
                      {student.interests && student.interests.length > 0 && (
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                          {student.interests.slice(0, 3).map((interest, idx) => (
                            <span 
                              key={idx}
                              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getTagClass(idx)}`}
                            >
                              {interest}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-4 text-[11px] text-[var(--ispora-text3)] flex-shrink-0">
                      <span className="flex items-center gap-1">
                        <GraduationCap className="w-3 h-3" strokeWidth={2} />
                        {getStudentYear(student)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" strokeWidth={2} />
                        {student.location || 'Nigeria'}
                      </span>
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSave(student.id);
                        }}
                        className="w-9 h-9 rounded-lg border-[1.5px] border-[var(--ispora-border)] bg-white flex items-center justify-center hover:border-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] transition-all"
                      >
                        <Bookmark 
                          className={`w-3.5 h-3.5 ${isSaved ? 'fill-[var(--ispora-brand)] stroke-[var(--ispora-brand)]' : 'stroke-[var(--ispora-text3)]'}`}
                          strokeWidth={2}
                        />
                      </button>
                      
                      {!isAlreadyMentee ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInvite(student);
                          }}
                          className="bg-[var(--ispora-brand)] text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-[var(--ispora-brand-hover)] transition-all flex items-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" strokeWidth={2.5} />
                          Invite
                        </button>
                      ) : (
                        <div className="bg-[var(--ispora-success-light)] text-[var(--ispora-success)] px-4 py-2 rounded-lg border-[1.5px] border-[var(--ispora-success)] text-xs font-semibold flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                          Mentee
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              // Grid View Card
              return (
                <div
                  key={student.id}
                  onClick={() => openProfile(student)}
                  className="bg-white border-[1.5px] border-[var(--ispora-border)] rounded-2xl overflow-hidden transition-all hover:border-[var(--ispora-brand)] hover:shadow-[var(--ispora-shadow)] hover:-translate-y-1 cursor-pointer flex flex-col relative"
                  style={{ animation: `fadeUp 0.3s ease both ${index * 0.05}s` }}
                >
                  {/* Save Badge */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSave(student.id);
                    }}
                    className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white border-[1.5px] border-[var(--ispora-border)] flex items-center justify-center z-10 hover:border-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] transition-all"
                  >
                    <Bookmark 
                      className={`w-3.5 h-3.5 ${isSaved ? 'fill-[var(--ispora-brand)] stroke-[var(--ispora-brand)]' : 'stroke-[var(--ispora-text3)]'}`}
                      strokeWidth={2}
                    />
                  </button>

                  {/* Card Top - Avatar & Name */}
                  <div 
                    className="px-5 pt-5 pb-3.5 flex flex-col items-center text-center"
                    style={{
                      background: 'linear-gradient(160deg, var(--ispora-brand-light) 0%, var(--ispora-surface) 60%)'
                    }}
                  >
                    {student.profilePicture ? (
                      <div className="w-14 h-14 rounded-full overflow-hidden mb-2.5 border-[3px] border-white shadow-md relative">
                        <img 
                          src={student.profilePicture} 
                          alt={`${student.firstName} ${student.lastName}`}
                          className="w-full h-full object-cover"
                        />
                        {isAlreadyMentee && (
                          <div className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 bg-[var(--ispora-accent)] border-2 border-white rounded-full" />
                        )}
                      </div>
                    ) : (
                      <div 
                        className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl mb-2.5 border-[3px] border-white shadow-md relative"
                        style={{ background: getAvatarColor(student.id) }}
                      >
                        {getStudentAvatar(student)}
                        {isAlreadyMentee && (
                          <div className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 bg-[var(--ispora-accent)] border-2 border-white rounded-full" />
                        )}
                      </div>
                    )}
                    <h3 className="font-syne text-[14px] font-bold text-[var(--ispora-text)] mb-0.5">
                      {student.firstName} {student.lastName}
                    </h3>
                    <p className="text-[11px] text-[var(--ispora-text3)] mb-2">
                      {getStudentField(student)}
                    </p>
                    
                    {/* Tags */}
                    {student.interests && student.interests.length > 0 && (
                      <div className="flex flex-wrap gap-1 justify-center">
                        {student.interests.slice(0, 2).map((interest, idx) => (
                          <span 
                            key={idx}
                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getTagClass(idx)}`}
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Card Body - Details */}
                  <div className="px-5 py-3.5 flex-1 border-t border-[var(--ispora-border)]">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-[var(--ispora-text2)]">
                        <GraduationCap className="w-3.5 h-3.5 text-[var(--ispora-text3)]" strokeWidth={2} />
                        {student.university || 'University not specified'}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[var(--ispora-text2)]">
                        <Calendar className="w-3.5 h-3.5 text-[var(--ispora-text3)]" strokeWidth={2} />
                        {getStudentYear(student)}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[var(--ispora-text2)]">
                        <MapPin className="w-3.5 h-3.5 text-[var(--ispora-text3)]" strokeWidth={2} />
                        {student.location || 'Nigeria'}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer - Actions */}
                  <div className="px-5 py-3 border-t border-[var(--ispora-border)] flex gap-2">
                    {!isAlreadyMentee ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInvite(student);
                        }}
                        className="flex-1 bg-[var(--ispora-brand)] text-white text-xs font-semibold py-2.5 px-3 rounded-[10px] hover:bg-[var(--ispora-brand-hover)] transition-all flex items-center justify-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" strokeWidth={2.5} />
                        Invite to Connect
                      </button>
                    ) : (
                      <div className="flex-1 bg-[var(--ispora-success-light)] text-[var(--ispora-success)] text-xs font-semibold py-2.5 px-3 rounded-[10px] border-[1.5px] border-[var(--ispora-success)] flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                        Active Mentee
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Youth Profile Modal */}
      {showProfileModal && selectedStudent && (
        <div 
          className="fixed inset-0 bg-[#07094a]/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 md:p-4 opacity-0 animate-[fadeIn_0.2s_ease_forwards]"
          onClick={() => setShowProfileModal(false)}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-[95vw] md:max-w-[480px] shadow-[var(--ispora-shadow-lg)] max-h-[88vh] overflow-y-auto transform scale-95 animate-[scaleUp_0.25s_cubic-bezier(0.34,1.56,0.64,1)_forwards]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Banner */}
            <div className="bg-[var(--ispora-brand)] px-6 py-6 text-center relative overflow-hidden">
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
                  backgroundSize: '24px 24px'
                }}
              />
              {selectedStudent.profilePicture ? (
                <div className="w-[68px] h-[68px] rounded-full overflow-hidden border-[3px] border-white/40 mx-auto mb-2.5 relative z-10">
                  <img 
                    src={selectedStudent.profilePicture} 
                    alt={`${selectedStudent.firstName} ${selectedStudent.lastName}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div 
                  className="w-[68px] h-[68px] rounded-full flex items-center justify-center text-white font-extrabold text-[26px] border-[3px] border-white/40 mx-auto mb-2.5 relative z-10"
                  style={{ background: getAvatarColor(selectedStudent.id) }}
                >
                  {getStudentAvatar(selectedStudent)}
                </div>
              )}
              <h3 className="font-syne text-[17px] font-bold text-white relative z-10">
                {selectedStudent.firstName} {selectedStudent.lastName}
              </h3>
              <p className="text-xs text-white/70 mt-1 relative z-10">
                {getStudentField(selectedStudent)} · {selectedStudent.university} · {getStudentYear(selectedStudent)}
              </p>
              
              {selectedStudent.interests && selectedStudent.interests.length > 0 && (
                <div className="flex flex-wrap gap-1.5 justify-center mt-2.5 relative z-10">
                  {selectedStudent.interests.map((interest, idx) => (
                    <span 
                      key={idx}
                      className="text-[10px] px-2 py-1 rounded-full font-medium bg-white/20 text-white"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* About */}
            {selectedStudent.bio && (
              <div className="px-6 py-4 border-b border-[var(--ispora-border)]">
                <h4 className="text-[10px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-2.5">About</h4>
                <p className="text-[13px] text-[var(--ispora-text2)] leading-relaxed">{selectedStudent.bio}</p>
              </div>
            )}

            {/* Details */}
            <div className="px-6 py-4 border-b border-[var(--ispora-border)]">
              <h4 className="text-[10px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-2.5">Details</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <GraduationCap className="w-3.5 h-3.5 text-[var(--ispora-text3)]" strokeWidth={2} />
                  <span className="text-[13px] text-[var(--ispora-text2)]">{selectedStudent.university || 'Not specified'}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-3.5 h-3.5 text-[var(--ispora-text3)]" strokeWidth={2} />
                  <span className="text-[13px] text-[var(--ispora-text2)]">{getStudentYear(selectedStudent)}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Globe className="w-3.5 h-3.5 text-[var(--ispora-text3)]" strokeWidth={2} />
                  <span className="text-[13px] text-[var(--ispora-text2)]">{selectedStudent.location || 'Not specified'}</span>
                </div>
              </div>
            </div>

            {/* Looking For */}
            {selectedStudent.lookingFor && (
              <div className="px-6 py-4 border-b border-[var(--ispora-border)]">
                <h4 className="text-[10px] font-semibold text-[var(--ispora-text3)] uppercase tracking-wider mb-2.5">What they're looking for</h4>
                <p className="text-[13px] text-[var(--ispora-text2)] leading-relaxed bg-[var(--ispora-bg)] px-3 py-2.5 rounded-[10px] border border-[var(--ispora-border)]">
                  {selectedStudent.lookingFor}
                </p>
              </div>
            )}

            {/* Footer Actions */}
            <div className="px-6 py-3.5 border-t border-[var(--ispora-border)] flex justify-end gap-2.5 sticky bottom-0 bg-white z-10">
              <button
                onClick={() => setShowProfileModal(false)}
                className="bg-white text-[var(--ispora-text)] border-[1.5px] border-[var(--ispora-border)] px-5 py-2.5 rounded-[10px] text-[13px] font-semibold hover:border-[var(--ispora-brand)] hover:text-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] transition-all"
              >
                Close
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSave(selectedStudent.id);
                }}
                className="bg-[var(--ispora-bg)] text-[var(--ispora-text2)] border-[1.5px] border-[var(--ispora-border)] px-4 py-2.5 rounded-[10px] text-xs font-semibold hover:bg-[var(--ispora-brand-light)] hover:text-[var(--ispora-brand)] hover:border-[var(--ispora-brand)] transition-all flex items-center gap-1.5"
              >
                <Bookmark className={`w-3.5 h-3.5 ${savedStudents.has(selectedStudent.id) ? 'fill-[var(--ispora-brand)]' : ''}`} strokeWidth={2} />
                Save
              </button>
              {!isMentee(selectedStudent.id) && (
                <button
                  onClick={() => {
                    setShowProfileModal(false);
                    handleInvite(selectedStudent);
                  }}
                  className="bg-[var(--ispora-brand)] text-white px-5 py-2.5 rounded-[10px] text-[13px] font-semibold hover:bg-[var(--ispora-brand-hover)] transition-all flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" strokeWidth={2.5} />
                  Invite to Connect
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && selectedStudent && (
        <div 
          className="fixed inset-0 bg-[#07094a]/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 md:p-4 opacity-0 animate-[fadeIn_0.2s_ease_forwards]"
          onClick={() => setShowInviteModal(false)}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-[95vw] md:max-w-[480px] shadow-[var(--ispora-shadow-lg)] max-h-[88vh] overflow-y-auto transform scale-95 animate-[scaleUp_0.25s_cubic-bezier(0.34,1.56,0.64,1)_forwards]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 pt-5 pb-4 flex items-start justify-between border-b border-[var(--ispora-border)] sticky top-0 bg-white z-10">
              <div>
                <div className="font-syne text-base font-bold text-[var(--ispora-text)]">Invite to Connect</div>
                <div className="text-xs text-[var(--ispora-text3)] mt-1">Send a mentorship invitation</div>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--ispora-text3)] hover:bg-[var(--ispora-bg)] hover:text-[var(--ispora-text)] transition-all"
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5">
              {/* Student Info */}
              <div className="flex items-center gap-3 px-3.5 py-3 bg-[var(--ispora-bg)] rounded-xl mb-4">
                {selectedStudent.profilePicture ? (
                  <div className="w-[42px] h-[42px] rounded-full overflow-hidden flex-shrink-0">
                    <img 
                      src={selectedStudent.profilePicture} 
                      alt={`${selectedStudent.firstName} ${selectedStudent.lastName}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div 
                    className="w-[42px] h-[42px] rounded-full flex items-center justify-center text-white font-bold text-[15px] flex-shrink-0"
                    style={{ background: getAvatarColor(selectedStudent.id) }}
                  >
                    {getStudentAvatar(selectedStudent)}
                  </div>
                )}
                <div>
                  <div className="font-bold text-[13px] text-[var(--ispora-text)]">
                    {selectedStudent.firstName} {selectedStudent.lastName}
                  </div>
                  <div className="text-[11px] text-[var(--ispora-text3)]">
                    {getStudentField(selectedStudent)} · {selectedStudent.university}
                  </div>
                </div>
              </div>

              {/* Form */}
              <div className="mb-3.5">
                <label className="block text-xs font-semibold text-[var(--ispora-text2)] mb-1.5">
                  Mentorship focus area
                </label>
                <select className="w-full border-[1.5px] border-[var(--ispora-border)] rounded-[10px] px-3.5 py-2.5 text-[13px] text-[var(--ispora-text)] bg-white outline-none transition-all focus:border-[var(--ispora-brand)] focus:shadow-[0_0_0_3px_rgba(2,31,246,0.07)]">
                  <option>Career guidance & planning</option>
                  <option>Technical skills development</option>
                  <option>Interview & job preparation</option>
                  <option>Industry insights & networking</option>
                  <option>Academic research support</option>
                  <option>Entrepreneurship & startups</option>
                </select>
              </div>

              <div className="mb-3.5">
                <label className="block text-xs font-semibold text-[var(--ispora-text2)] mb-1.5">
                  Your invitation message
                </label>
                <textarea
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  placeholder="Introduce yourself and explain why you'd like to mentor this student. Be specific about what you can offer..."
                  className="w-full border-[1.5px] border-[var(--ispora-border)] rounded-[10px] px-3.5 py-2.5 text-[13px] text-[var(--ispora-text)] bg-white outline-none transition-all focus:border-[var(--ispora-brand)] focus:shadow-[0_0_0_3px_rgba(2,31,246,0.07)] resize-vertical min-h-[90px] leading-relaxed"
                />
              </div>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-[var(--ispora-text2)] mb-1.5">
                  Preferred session frequency
                </label>
                <select className="w-full border-[1.5px] border-[var(--ispora-border)] rounded-[10px] px-3.5 py-2.5 text-[13px] text-[var(--ispora-text)] bg-white outline-none transition-all focus:border-[var(--ispora-brand)] focus:shadow-[0_0_0_3px_rgba(2,31,246,0.07)]">
                  <option>Once a week</option>
                  <option>Bi-weekly</option>
                  <option>Once a month</option>
                  <option>As needed</option>
                </select>
              </div>

              {/* Tip */}
              <div className="bg-[var(--ispora-brand-light)] border border-[var(--ispora-border)] rounded-[10px] px-3 py-3 text-xs text-[var(--ispora-text2)] leading-relaxed">
                💡 <strong>Tip:</strong> Students are more likely to accept invitations that are personal and specific. Mention what you noticed in their profile.
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-[var(--ispora-border)] flex justify-end gap-2.5 sticky bottom-0 bg-white z-10">
              <button
                onClick={() => setShowInviteModal(false)}
                disabled={sending}
                className="bg-white text-[var(--ispora-text)] border-[1.5px] border-[var(--ispora-border)] px-5 py-2.5 rounded-[10px] text-[13px] font-semibold hover:border-[var(--ispora-brand)] hover:text-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSendRequest}
                disabled={sending || !inviteMessage.trim()}
                className="bg-[var(--ispora-brand)] text-white px-5 py-2.5 rounded-[10px] text-[13px] font-semibold hover:bg-[var(--ispora-brand-hover)] transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-3.5 h-3.5" strokeWidth={2.5} />
                {sending ? 'Sending...' : 'Send Invitation'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          to { transform: scale(1); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}