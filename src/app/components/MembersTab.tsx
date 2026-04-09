import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { toast } from 'sonner';
import {
  Search,
  Users,
  UserPlus,
  UserMinus,
  MapPin,
  Briefcase,
  GraduationCap,
  Award,
  TrendingUp,
  Heart
} from 'lucide-react';

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  role: 'mentor' | 'student';
  expertise: string[];
  bio: string;
  university?: string;
  company?: string;
  location?: string;
  achievements?: string[];
  profilePicture?: string;
  isFollowing: boolean;
  followersCount: number;
  followingCount: number;
}

export default function MembersTab() {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'mentor' | 'student'>('all');
  const [followingUser, setFollowingUser] = useState<string | null>(null);

  useEffect(() => {
    loadMembers();
  }, [roleFilter, search]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      
      const response = await api.community.getMembers({
        role: roleFilter !== 'all' ? roleFilter : undefined,
        search: search || undefined,
        limit: 50
      });
      
      if (response.success) {
        setMembers(response.members || []);
      }
    } catch (error: any) {
      console.error('Error loading members:', error);
      toast.error('Failed to load community members');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (memberId: string) => {
    try {
      setFollowingUser(memberId);
      await api.community.followUser(memberId);
      
      // Update local state
      setMembers(prev => prev.map(m => 
        m.id === memberId 
          ? { ...m, isFollowing: true, followersCount: m.followersCount + 1 }
          : m
      ));
      
      toast.success('Successfully followed member!');
    } catch (error: any) {
      console.error('Error following member:', error);
      toast.error(error.message || 'Failed to follow member');
    } finally {
      setFollowingUser(null);
    }
  };

  const handleUnfollow = async (memberId: string) => {
    try {
      setFollowingUser(memberId);
      await api.community.unfollowUser(memberId);
      
      // Update local state
      setMembers(prev => prev.map(m => 
        m.id === memberId 
          ? { ...m, isFollowing: false, followersCount: Math.max(0, m.followersCount - 1) }
          : m
      ));
      
      toast.success('Unfollowed member');
    } catch (error: any) {
      console.error('Error unfollowing member:', error);
      toast.error('Failed to unfollow member');
    } finally {
      setFollowingUser(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="font-dm-sans text-xl font-bold text-[var(--ispora-text)] mb-1">
            Discover Members
          </h2>
          <p className="text-sm text-[var(--ispora-text3)]">
            Connect with mentors and students in the Ispora community
          </p>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-[var(--ispora-text3)]">
          <Users className="w-4 h-4" />
          <span>{members.length} members</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ispora-text3)]" />
          <input
            type="text"
            placeholder="Search by name, expertise, or bio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[var(--ispora-border)] rounded-lg text-sm text-[var(--ispora-text)] placeholder:text-[var(--ispora-text3)] focus:outline-none focus:border-[var(--ispora-brand)] focus:ring-1 focus:ring-[var(--ispora-brand)]"
          />
        </div>

        {/* Role Filter */}
        <div className="flex items-center gap-2 bg-white border border-[var(--ispora-border)] rounded-lg p-1">
          <button
            onClick={() => setRoleFilter('all')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              roleFilter === 'all'
                ? 'bg-[var(--ispora-brand)] text-white'
                : 'text-[var(--ispora-text3)] hover:text-[var(--ispora-text)]'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setRoleFilter('mentor')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              roleFilter === 'mentor'
                ? 'bg-[var(--ispora-brand)] text-white'
                : 'text-[var(--ispora-text3)] hover:text-[var(--ispora-text)]'
            }`}
          >
            Mentors
          </button>
          <button
            onClick={() => setRoleFilter('student')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              roleFilter === 'student'
                ? 'bg-[var(--ispora-brand)] text-white'
                : 'text-[var(--ispora-text3)] hover:text-[var(--ispora-text)]'
            }`}
          >
            Students
          </button>
        </div>
      </div>

      {/* Members Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-10 h-10 border-3 border-[var(--ispora-brand)] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm text-[var(--ispora-text3)]">Loading members...</p>
          </div>
        </div>
      ) : members.length === 0 ? (
        <div className="bg-white rounded-xl border border-[var(--ispora-border)] p-12 text-center">
          <Users className="w-12 h-12 text-[var(--ispora-text3)] mx-auto mb-3" />
          <h3 className="font-dm-sans text-lg font-semibold text-[var(--ispora-text)] mb-2">
            No members found
          </h3>
          <p className="text-sm text-[var(--ispora-text3)]">
            Try adjusting your search or filters
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              onFollow={handleFollow}
              onUnfollow={handleUnfollow}
              isProcessing={followingUser === member.id}
              isCurrentUser={member.id === user?.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Member Card Component
interface MemberCardProps {
  member: Member;
  onFollow: (id: string) => void;
  onUnfollow: (id: string) => void;
  isProcessing: boolean;
  isCurrentUser: boolean;
}

function MemberCard({ member, onFollow, onUnfollow, isProcessing, isCurrentUser }: MemberCardProps) {
  const isMentor = member.role === 'mentor';

  return (
    <div className="bg-white rounded-xl border border-[var(--ispora-border)] p-5 hover:shadow-[var(--ispora-shadow)] hover:border-[var(--ispora-brand)] transition-all group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          {member.profilePicture ? (
            <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
              <img 
                src={member.profilePicture} 
                alt={`${member.firstName} ${member.lastName}`}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div 
              className={`w-12 h-12 rounded-full grid place-items-center text-white font-bold text-sm flex-shrink-0 ${
                isMentor ? 'bg-[var(--ispora-brand)]' : 'bg-[var(--ispora-success)]'
              }`}
            >
              {member.firstName.charAt(0)}{member.lastName.charAt(0)}
            </div>
          )}

          {/* Name & Role */}
          <div>
            <h3 className="font-dm-sans text-base font-bold text-[var(--ispora-text)] leading-tight">
              {member.firstName} {member.lastName}
            </h3>
            <span className={`inline-block mt-1 text-xs font-bold px-2 py-0.5 rounded-full ${
              isMentor
                ? 'bg-[var(--ispora-brand-light)] text-[var(--ispora-brand)]'
                : 'bg-[var(--ispora-success-light)] text-[var(--ispora-success)]'
            }`}>
              {isMentor ? 'Mentor' : 'Student'}
            </span>
          </div>
        </div>

        {/* Follow Button */}
        {!isCurrentUser && (
          <button
            onClick={() => member.isFollowing ? onUnfollow(member.id) : onFollow(member.id)}
            disabled={isProcessing}
            className={`p-2 rounded-lg transition-all ${
              member.isFollowing
                ? 'bg-[var(--ispora-bg)] text-[var(--ispora-text2)] hover:bg-red-50 hover:text-red-600 border border-[var(--ispora-border)]'
                : 'bg-[var(--ispora-brand)] text-white hover:bg-[var(--ispora-brand-hover)]'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {member.isFollowing ? (
              <UserMinus className="w-4 h-4" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* Bio */}
      {member.bio && (
        <p className="text-sm text-[var(--ispora-text2)] line-clamp-2 mb-3">
          {member.bio}
        </p>
      )}

      {/* Details */}
      <div className="space-y-2 mb-4">
        {member.company && (
          <div className="flex items-center gap-2 text-xs text-[var(--ispora-text3)]">
            <Briefcase className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{member.company}</span>
          </div>
        )}
        {member.university && (
          <div className="flex items-center gap-2 text-xs text-[var(--ispora-text3)]">
            <GraduationCap className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{member.university}</span>
          </div>
        )}
        {member.location && (
          <div className="flex items-center gap-2 text-xs text-[var(--ispora-text3)]">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{member.location}</span>
          </div>
        )}
      </div>

      {/* Expertise */}
      {member.expertise && member.expertise.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {member.expertise.slice(0, 3).map((exp, idx) => (
            <span
              key={idx}
              className="text-xs px-2 py-1 bg-[var(--ispora-bg)] text-[var(--ispora-text2)] rounded-md border border-[var(--ispora-border)]"
            >
              {exp}
            </span>
          ))}
          {member.expertise.length > 3 && (
            <span className="text-xs px-2 py-1 text-[var(--ispora-text3)]">
              +{member.expertise.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 pt-3 border-t border-[var(--ispora-border)]">
        <div className="flex items-center gap-1.5 text-xs text-[var(--ispora-text3)]">
          <Heart className="w-3.5 h-3.5" />
          <span>{member.followersCount} followers</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[var(--ispora-text3)]">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>{member.followingCount} following</span>
        </div>
      </div>

      {/* Achievements */}
      {member.achievements && member.achievements.length > 0 && (
        <div className="mt-3 pt-3 border-t border-[var(--ispora-border)]">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--ispora-brand)] mb-2">
            <Award className="w-3.5 h-3.5" />
            <span>Recent Achievement</span>
          </div>
          <p className="text-xs text-[var(--ispora-text2)] line-clamp-1">
            {member.achievements[0]}
          </p>
        </div>
      )}
    </div>
  );
}