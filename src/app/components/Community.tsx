import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { toast } from 'sonner';
import CalendarModal from './CalendarModal';
import MembersTab from './MembersTab';
import { generateRRuleFromPattern } from '../utils/calendar';
import {
  MessageSquare,
  Heart,
  MessageCircle,
  Send,
  Plus,
  TrendingUp,
  Clock,
  Filter,
  Users,
  Calendar,
  Sparkles,
  CheckCircle2,
  Award,
  X,
  Trash2,
  Star,
  HelpCircle,
  BookOpen,
  Lightbulb,
  Megaphone,
  Search as SearchIcon,
  CalendarDays,
  Repeat,
  Eye,
  Video,
  CalendarPlus
} from 'lucide-react';

type CommunityTab = 'feed' | 'events' | 'members';
type PostType = 'win' | 'question' | 'resource' | 'tip' | 'announcement' | 'opportunity' | 'event' | 'general';
type PostCategory = 'all' | 'career' | 'tech' | 'study-tips' | 'success' | 'general';

export default function Community() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<CommunityTab>('feed');
  
  // Calendar modal state
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calendarEvent, setCalendarEvent] = useState<any>(null);

  return (
    <div className="bg-[var(--ispora-bg)] pb-20 md:pb-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[var(--ispora-brand)] via-[#1a35f8] to-[var(--ispora-brand-hover)] px-8 py-7 relative overflow-hidden">
        {/* Grid background */}
        <div 
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
            backgroundSize: '28px 28px'
          }}
        />
        
        {/* Orbs */}
        <div className="absolute -top-16 -right-10 w-60 h-60 bg-white/5 rounded-full pointer-events-none" />
        <div className="absolute -bottom-20 left-[30%] w-44 h-44 bg-white/[0.03] rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto">
          <h1 className="font-dm-sans text-lg font-semibold text-white mb-1.5">
            Ispora Community ✦
          </h1>
          <p className="text-xs text-white/70 leading-relaxed">
            Connect, learn, and grow together with mentors and students across Africa
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-[var(--ispora-border)]">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="flex gap-1 -mb-[1px]">
            <button
              onClick={() => setActiveTab('feed')}
              className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors ${
                activeTab === 'feed'
                  ? 'border-[var(--ispora-brand)] text-[var(--ispora-brand)]'
                  : 'border-transparent text-[var(--ispora-text3)] hover:text-[var(--ispora-text)]'
              }`}
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Feed
              </span>
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors ${
                activeTab === 'events'
                  ? 'border-[var(--ispora-brand)] text-[var(--ispora-brand)]'
                  : 'border-transparent text-[var(--ispora-text3)] hover:text-[var(--ispora-text)]'
              }`}
            >
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Events
              </span>
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors ${
                activeTab === 'members'
                  ? 'border-[var(--ispora-brand)] text-[var(--ispora-brand)]'
                  : 'border-transparent text-[var(--ispora-text3)] hover:text-[var(--ispora-text)]'
              }`}
            >
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Members
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
        {activeTab === 'feed' && <FeedTab />}
        {activeTab === 'events' && <EventsTab setShowCalendarModal={setShowCalendarModal} setCalendarEvent={setCalendarEvent} />}
        {activeTab === 'members' && <MembersTab />}
      </div>

      {/* Calendar Modal */}
      {showCalendarModal && calendarEvent && (
        <CalendarModal
          event={calendarEvent}
          onClose={() => {
            setShowCalendarModal(false);
            setCalendarEvent(null);
          }}
        />
      )}
    </div>
  );
}

// Feed Tab Component
function FeedTab() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<PostCategory>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostCategory, setNewPostCategory] = useState<PostCategory>('general');
  const [posting, setPosting] = useState(false);
  const [commentingOnPost, setCommentingOnPost] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [loadedComments, setLoadedComments] = useState<Record<string, any[]>>({});
  const [loadingComments, setLoadingComments] = useState<string | null>(null);
  const [replyingToComment, setReplyingToComment] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    loadPosts();
  }, [category, sortBy]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      
      // Try to fetch from API
      try {
        const response = await api.community.getPosts({
          category: category === 'all' ? undefined : category,
          sort: sortBy,
        });
        setPosts(response.posts || []);
      } catch (apiError) {
        // If API fails (backend not ready), show demo posts
        const demoPosts = [
          {
            id: 'demo-1',
            content: '🎉 Just got accepted to study Computer Science at the University of Lagos! Thanks to all the mentors here who helped me with my application essays. This community is amazing!',
            category: 'success',
            author: {
              id: 'demo-user-1',
              firstName: 'Chioma',
              lastName: 'Adebayo',
              role: 'student'
            },
            likesCount: 45,
            commentsCount: 12,
            isLikedByUser: false,
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            comments: []
          },
          {
            id: 'demo-2',
            content: 'Does anyone have tips for preparing for software engineering interviews? I have one coming up next week with a UK tech company and I\'m nervous about the technical questions.',
            category: 'tech',
            author: {
              id: 'demo-user-2',
              firstName: 'Emeka',
              lastName: 'Okafor',
              role: 'student'
            },
            likesCount: 23,
            commentsCount: 8,
            isLikedByUser: false,
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            comments: []
          },
          {
            id: 'demo-3',
            content: '📚 Study Tip: I use the Pomodoro technique (25 min study + 5 min break) and it has completely transformed my productivity. Try it out!',
            category: 'study-tips',
            author: {
              id: 'demo-user-3',
              firstName: 'Aisha',
              lastName: 'Mohammed',
              role: 'student'
            },
            likesCount: 67,
            commentsCount: 15,
            isLikedByUser: false,
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            comments: []
          }
        ];
        
        // Filter by category if needed
        if (category !== 'all') {
          setPosts(demoPosts.filter(p => p.category === category));
        } else {
          setPosts(demoPosts);
        }
      }
    } catch (error: any) {
      console.error('Error loading posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) {
      toast.error('Please write something');
      return;
    }

    try {
      setPosting(true);
      await api.community.createPost({
        content: newPostContent,
        category: newPostCategory === 'all' ? 'general' : newPostCategory,
      });
      toast.success('Post created!');
      setNewPostContent('');
      setShowCreatePost(false);
      loadPosts();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create post');
    } finally {
      setPosting(false);
    }
  };

  const handleLikePost = async (postId: string, isLiked: boolean) => {
    // Optimistically update UI immediately
    setPosts(posts.map(p =>
      p.id === postId
        ? { ...p, isLikedByUser: !isLiked, likesCount: isLiked ? p.likesCount - 1 : p.likesCount + 1 }
        : p
    ));

    try {
      // Try to sync with backend in the background
      if (isLiked) {
        await api.community.unlikePost(postId);
      } else {
        await api.community.likePost(postId);
      }
    } catch (error: any) {
      // Silently fail and keep optimistic update
      console.log('Like sync failed (backend not deployed):', error);
    }
  };

  const loadComments = async (postId: string) => {
    try {
      setLoadingComments(postId);
      const response = await api.community.getComments(postId);
      setLoadedComments(prev => ({ ...prev, [postId]: response.comments || [] }));
    } catch (error: any) {
      console.error('Error loading comments:', error);
      // If API fails, show empty comments
      setLoadedComments(prev => ({ ...prev, [postId]: [] }));
    } finally {
      setLoadingComments(null);
    }
  };

  const handleAddComment = async (postId: string, parentId?: string) => {
    const text = parentId ? replyText : commentText;
    if (!text.trim()) return;

    try {
      await api.community.addComment(postId, text, parentId);
      toast.success(parentId ? 'Reply added!' : 'Comment added!');
      if (parentId) {
        setReplyText('');
        setReplyingToComment(null);
      } else {
        setCommentText('');
      }
      // Reload comments for this post
      loadComments(postId);
      loadPosts();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add comment');
    }
  };

  const handleToggleComments = (postId: string) => {
    if (commentingOnPost === postId) {
      setCommentingOnPost(null);
    } else {
      setCommentingOnPost(postId);
      // Always load comments when opening to ensure fresh data
      loadComments(postId);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      await api.community.deletePost(postId);
      toast.success('Post deleted');
      loadPosts();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete post');
    }
  };

  const categories: { value: PostCategory; label: string }[] = [
    { value: 'all', label: 'All Posts' },
    { value: 'career', label: 'Career' },
    { value: 'tech', label: 'Tech' },
    { value: 'study-tips', label: 'Study Tips' },
    { value: 'success', label: 'Success Stories' },
    { value: 'general', label: 'General' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Main Feed */}
      <div className="lg:col-span-2 space-y-4">
        {/* Create Post Button */}
        {!showCreatePost ? (
          <button
            onClick={() => setShowCreatePost(true)}
            className="w-full bg-white border-[1.5px] border-[var(--ispora-border)] rounded-xl p-3 text-left hover:border-[var(--ispora-brand)] transition-colors"
          >
            <div className="flex items-center gap-2.5">
              {(user as any)?.profilePicture ? (
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                  <img 
                    src={(user as any).profilePicture} 
                    alt={`${user?.firstName} ${user?.lastName}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--ispora-brand)] to-[#1a35f8] flex items-center justify-center text-white font-bold text-xs">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
              )}
              <div className="flex-1 text-sm text-[var(--ispora-text3)]">
                Share something with the community...
              </div>
              <Plus className="w-5 h-5 text-[var(--ispora-brand)]" />
            </div>
          </button>
        ) : (
          <div className="bg-white border-[1.5px] border-[var(--ispora-border)] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-syne font-bold text-[var(--ispora-text)]">Create Post</h3>
              <button
                onClick={() => setShowCreatePost(false)}
                className="text-[var(--ispora-text3)] hover:text-[var(--ispora-text)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <select
              value={newPostCategory}
              onChange={(e) => setNewPostCategory(e.target.value as PostCategory)}
              className="w-full px-3 py-2 border-[1.5px] border-[var(--ispora-border)] rounded-lg text-sm mb-3"
            >
              {categories.filter(c => c.value !== 'all').map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>

            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full px-4 py-3 border-[1.5px] border-[var(--ispora-border)] rounded-lg text-sm resize-none"
              rows={4}
            />

            <div className="flex items-center justify-end gap-2 mt-3">
              <button
                onClick={() => setShowCreatePost(false)}
                className="px-4 py-2 text-sm font-bold text-[var(--ispora-text3)] hover:text-[var(--ispora-text)]"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePost}
                disabled={posting}
                className="px-4 py-2 bg-[var(--ispora-brand)] text-white text-sm font-bold rounded-lg hover:bg-[#1a35f8] transition-colors disabled:opacity-50"
              >
                {posting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        )}

        {/* Filter & Sort */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Filter className="w-4 h-4 text-[var(--ispora-text3)] flex-shrink-0" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as PostCategory)}
              className="px-3 py-1.5 border-[1.5px] border-[var(--ispora-border)] rounded-lg text-sm bg-white min-w-0 flex-1"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1 bg-white border-[1.5px] border-[var(--ispora-border)] rounded-lg p-1 flex-shrink-0">
            <button
              onClick={() => setSortBy('recent')}
              className={`px-2 py-1.5 text-xs font-bold rounded transition-colors ${
                sortBy === 'recent'
                  ? 'bg-[var(--ispora-brand)] text-white'
                  : 'text-[var(--ispora-text3)] hover:text-[var(--ispora-text)]'
              }`}
            >
              Recent
            </button>
            <button
              onClick={() => setSortBy('popular')}
              className={`px-2 py-1.5 text-xs font-bold rounded transition-colors ${
                sortBy === 'popular'
                  ? 'bg-[var(--ispora-brand)] text-white'
                  : 'text-[var(--ispora-text3)] hover:text-[var(--ispora-text)]'
              }`}
            >
              Popular
            </button>
          </div>
        </div>

        {/* Posts List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-3 border-[var(--ispora-brand)] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white border-[1.5px] border-[var(--ispora-border)] rounded-2xl p-10 text-center">
            <Sparkles className="w-12 h-12 text-[var(--ispora-brand)] mx-auto mb-3 opacity-50" />
            <h3 className="font-syne font-bold text-[var(--ispora-text)] mb-2">No posts yet</h3>
            <p className="text-sm text-[var(--ispora-text3)] mb-4">Be the first to share something with the community!</p>
            <button
              onClick={() => setShowCreatePost(true)}
              className="px-4 py-2 bg-[var(--ispora-brand)] text-white text-sm font-bold rounded-lg hover:bg-[#1a35f8]"
            >
              Create Post
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="bg-white border-[1.5px] border-[var(--ispora-border)] rounded-xl p-3.5 hover:border-[var(--ispora-brand)] transition-colors">
                {/* Author Info */}
                <div className="flex items-start justify-between mb-2.5">
                  <div className="flex items-start gap-2.5">
                    {post.author?.profilePicture ? (
                      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                        <img 
                          src={post.author.profilePicture} 
                          alt={`${post.author.firstName} ${post.author.lastName}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--ispora-brand)] to-[#1a35f8] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                        {post.author?.firstName?.[0]}{post.author?.lastName?.[0]}
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-xs text-[var(--ispora-text)]">
                        {post.author?.firstName} {post.author?.lastName}
                      </div>
                      <div className="text-[10px] text-[var(--ispora-text3)]">
                        {post.author?.role === 'diaspora' ? '🌟 Mentor' : '🎓 Student'} • {new Date(post.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  {post.author?.id === user?.id && (
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="text-[var(--ispora-text3)] hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Category Badge */}
                {post.category && (
                  <div className="inline-block px-2 py-0.5 bg-[var(--ispora-brand-light)] text-[var(--ispora-brand)] text-[9px] font-bold rounded mb-2.5">
                    {post.category.replace('-', ' ').toUpperCase()}
                  </div>
                )}

                {/* Content */}
                <div className="text-xs text-[var(--ispora-text)] whitespace-pre-wrap mb-2.5 leading-relaxed">
                  {post.content}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3.5 pt-2.5 border-t border-[var(--ispora-border)]">
                  <button
                    onClick={() => handleLikePost(post.id, post.isLikedByUser)}
                    className="flex items-center gap-1 text-xs font-bold transition-colors hover:text-[var(--ispora-brand)]"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${post.isLikedByUser ? 'fill-[var(--ispora-brand)] text-[var(--ispora-brand)]' : 'text-[var(--ispora-text3)]'}`}
                    />
                    <span className={post.isLikedByUser ? 'text-[var(--ispora-brand)]' : 'text-[var(--ispora-text3)]'}>
                      {post.likesCount || 0}
                    </span>
                  </button>
                  <button
                    onClick={() => handleToggleComments(post.id)}
                    className="flex items-center gap-1 text-xs font-bold text-[var(--ispora-text3)] hover:text-[var(--ispora-brand)] transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>{post.commentsCount || 0}</span>
                  </button>
                </div>

                {/* Comment Input */}
                {commentingOnPost === post.id && (
                  <div className="mt-3 pt-3 border-t border-[var(--ispora-border)]">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Write a comment..."
                        className="flex-1 px-2.5 py-1.5 border-[1.5px] border-[var(--ispora-border)] rounded-lg text-xs"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                      />
                      <button
                        onClick={() => handleAddComment(post.id)}
                        className="px-3 py-1.5 bg-[var(--ispora-brand)] text-white rounded-lg hover:bg-[#1a35f8] transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Comments List */}
                    {loadingComments === post.id ? (
                      <div className="mt-3 pt-3 border-t border-[var(--ispora-border)]">
                        <div className="text-xs text-[var(--ispora-text3)] text-center py-2">Loading comments...</div>
                      </div>
                    ) : loadedComments[post.id] && loadedComments[post.id].length > 0 ? (
                      <div className="mt-3 space-y-2.5">
                        {loadedComments[post.id].map((comment: any) => (
                          <div key={comment.id}>
                            <div className="flex gap-2">
                              {comment.author?.profilePicture ? (
                                <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0">
                                  <img
                                    src={comment.author.profilePicture}
                                    alt={`${comment.author.firstName} ${comment.author.lastName}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--ispora-brand)] to-[#1a35f8] flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0">
                                  {comment.author?.firstName?.[0]}{comment.author?.lastName?.[0]}
                                </div>
                              )}
                              <div className="flex-1 bg-[var(--ispora-bg)] rounded-lg p-2.5">
                                <div className="flex items-center justify-between mb-0.5">
                                  <span className="font-bold text-[10px] text-[var(--ispora-text)]">
                                    {comment.author?.firstName} {comment.author?.lastName}
                                  </span>
                                  <span className="text-[9px] text-[var(--ispora-text3)]">
                                    {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                                  </span>
                                </div>
                                <div className="text-xs text-[var(--ispora-text)]">{comment.content}</div>
                                <button
                                  onClick={() => setReplyingToComment(replyingToComment === comment.id ? null : comment.id)}
                                  className="text-[10px] text-[var(--ispora-brand)] font-semibold mt-1 hover:underline"
                                >
                                  Reply
                                </button>
                              </div>
                            </div>
                            {/* Reply Input */}
                            {replyingToComment === comment.id && (
                              <div className="ml-9 mt-2 flex gap-2">
                                <input
                                  type="text"
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  placeholder="Write a reply..."
                                  className="flex-1 px-2.5 py-1.5 border-[1.5px] border-[var(--ispora-border)] rounded-lg text-xs"
                                  onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post.id, comment.id)}
                                />
                                <button
                                  onClick={() => handleAddComment(post.id, comment.id)}
                                  className="px-3 py-1.5 bg-[var(--ispora-brand)] text-white rounded-lg hover:bg-[#1a35f8] transition-colors"
                                >
                                  <Send className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                            {/* Replies */}
                            {comment.replies && comment.replies.length > 0 && (
                              <div className="ml-9 mt-2 space-y-2">
                                {comment.replies.map((reply: any) => (
                                  <div key={reply.id} className="flex gap-2">
                                    {reply.author?.profilePicture ? (
                                      <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                                        <img
                                          src={reply.author.profilePicture}
                                          alt={`${reply.author.firstName} ${reply.author.lastName}`}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    ) : (
                                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--ispora-brand)] to-[#1a35f8] flex items-center justify-center text-white font-bold text-[9px] flex-shrink-0">
                                        {reply.author?.firstName?.[0]}{reply.author?.lastName?.[0]}
                                      </div>
                                    )}
                                    <div className="flex-1 bg-white border border-[var(--ispora-border)] rounded-lg p-2">
                                      <div className="flex items-center justify-between mb-0.5">
                                        <span className="font-bold text-[9px] text-[var(--ispora-text)]">
                                          {reply.author?.firstName} {reply.author?.lastName}
                                        </span>
                                        <span className="text-[8px] text-[var(--ispora-text3)]">
                                          {reply.createdAt ? new Date(reply.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                                        </span>
                                      </div>
                                      <div className="text-[11px] text-[var(--ispora-text)]">{reply.content}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        {/* Trending Topics Card */}
        <div className="bg-white border-[1.5px] border-[var(--ispora-border)] rounded-2xl p-5">
          <h3 className="font-syne font-bold text-sm text-[var(--ispora-text)] mb-4 flex items-center gap-2">
            🔥 Trending Topics
          </h3>
          <div className="flex flex-wrap gap-2">
            {['#CareerAdvice', '#UKApplications', '#Scholarships', '#Tech', '#StudyTips'].map((tag) => (
              <button
                key={tag}
                className="px-3 py-1.5 bg-[var(--ispora-bg)] border-[1.5px] border-[var(--ispora-border)] rounded-full text-xs font-bold text-[var(--ispora-text3)] hover:border-[var(--ispora-brand)] hover:text-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Guidelines */}
        <div className="bg-gradient-to-br from-[var(--ispora-brand-light)] to-white border-[1.5px] border-[var(--ispora-border)] rounded-2xl p-5">
          <h3 className="font-syne font-bold text-sm text-[var(--ispora-text)] mb-3">
            💡 Community Guidelines
          </h3>
          <ul className="space-y-2 text-xs text-[var(--ispora-text3)]">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[var(--ispora-brand)] flex-shrink-0 mt-0.5" />
              Be respectful and supportive
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[var(--ispora-brand)] flex-shrink-0 mt-0.5" />
              Share knowledge and experiences
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[var(--ispora-brand)] flex-shrink-0 mt-0.5" />
              Ask questions freely
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[var(--ispora-brand)] flex-shrink-0 mt-0.5" />
              Celebrate each other's wins
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// Events Tab Component
function EventsTab({ setShowCalendarModal, setCalendarEvent }: { setShowCalendarModal: (show: boolean) => void, setCalendarEvent: (event: any) => void }) {
  const { user } = useAuth();
  const [publicSessions, setPublicSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [registeringSession, setRegisteringSession] = useState<string | null>(null);
  const [likingSessionIds, setLikingSessionIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadPublicSessions();
  }, []);

  const loadPublicSessions = async () => {
    try {
      setLoading(true);
      const response = await api.session.getAllPublic();
      setPublicSessions(response.sessions || []);
    } catch (error: any) {
      console.error('Error loading public sessions:', error);
      toast.error(error.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterForSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      setRegisteringSession(sessionId);
      
      // Find the session before registering to get its details
      const sessionToRegister = publicSessions.find((s: any) => s.id === sessionId);
      
      await api.session.register(sessionId);
      
      // Reload sessions
      const response = await api.session.getAllPublic();
      setPublicSessions(response.sessions || []);
      
      toast.success('🎉 You\'re in! We can\'t wait to see you at this event!');
      
      // Automatically open calendar modal if we have session details
      if (sessionToRegister) {
        const sessionDate = new Date(sessionToRegister.scheduledAt);
        const duration = sessionToRegister.duration || 60;
        const endTime = new Date(sessionDate.getTime() + duration * 60000);
        
        let sessionDetails: any = {};
        try {
          if (sessionToRegister.notes) {
            sessionDetails = JSON.parse(sessionToRegister.notes);
          }
        } catch (e) {}
        
        // Check if this is part of a recurring series
        const seriesId = sessionDetails.seriesId;
        let isRecurringSeries = false;
        let allSessionDates: Date[] = [];
        let recurrenceRule = '';
        
        if (seriesId) {
          // Find all sessions in this series
          const seriesSessions = publicSessions
            .filter((s: any) => {
              try {
                const notes = s.notes ? JSON.parse(s.notes) : {};
                return notes.seriesId === seriesId;
              } catch {
                return false;
              }
            })
            .filter(s => new Date(s.scheduledAt) > new Date()) // Only future sessions
            .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
          
          if (seriesSessions.length > 1) {
            isRecurringSeries = true;
            allSessionDates = seriesSessions.map(s => new Date(s.scheduledAt));
            
            // Generate RRULE from recurrence pattern
            if (sessionDetails.recurrencePattern) {
              const lastSessionDate = new Date(seriesSessions[seriesSessions.length - 1].scheduledAt);
              recurrenceRule = generateRRuleFromPattern(sessionDetails.recurrencePattern, lastSessionDate);
            }
          }
        }
        
        setCalendarEvent({
          title: sessionToRegister.topic || 'Community Event',
          description: sessionDetails.description || 'Community event on Ispora',
          location: sessionDetails.platform || 'Online',
          startTime: sessionDate,
          endTime: endTime,
          organizerName: `${sessionToRegister.mentor?.firstName} ${sessionToRegister.mentor?.lastName}` || 'Ispora Community',
          isRecurring: isRecurringSeries,
          recurrenceRule: recurrenceRule,
          allSessionDates: allSessionDates.length > 0 ? allSessionDates : undefined,
          sessionUrl: `${window.location.origin}/dashboard`
        });
        setShowCalendarModal(true);
      }
    } catch (error: any) {
      if (error.message?.includes('already registered')) {
        toast.info('You are already registered for this session');
      } else {
        toast.error(error.message || 'Failed to register');
      }
    } finally {
      setRegisteringSession(null);
    }
  };

  const handleLikeSession = async (sessionId: string, isLiked: boolean) => {
    setLikingSessionIds(prev => new Set([...prev, sessionId]));

    setPublicSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        return {
          ...s,
          isLikedByCurrentUser: !isLiked,
          likesCount: isLiked ? (s.likesCount || 0) - 1 : (s.likesCount || 0) + 1
        };
      }
      return s;
    }));

    try {
      if (isLiked) {
        await api.session.unlike(sessionId);
      } else {
        await api.session.like(sessionId);
      }
    } catch (error: any) {
      console.log('Like sync failed:', error);
    } finally {
      setLikingSessionIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(sessionId);
        return newSet;
      });
    }
  };

  const handleSessionClick = (session: any) => {
    console.log('Session clicked:', session);
  };

  // Group PUBLIC sessions by series (same logic from StudentDashboard)
  const upcomingPublicSessions = publicSessions
    .filter(s => new Date(s.scheduledAt) > new Date())
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  
  const publicSessionGroups = new Map<string, any[]>();
  const standalonePublicSessions: any[] = [];

  upcomingPublicSessions.forEach((session: any) => {
    let sessionDetails: any = {}; 
    try {
      if (session.notes) {
        sessionDetails = JSON.parse(session.notes);
      }
    } catch (e) {}

    const seriesId = sessionDetails.seriesId;
    if (seriesId) {
      if (!publicSessionGroups.has(seriesId)) {
        publicSessionGroups.set(seriesId, []);
      }
      publicSessionGroups.get(seriesId)!.push(session);
    } else {
      standalonePublicSessions.push(session);
    }
  });

  // Transform public series to UI format
  const publicSessionSeries = Array.from(publicSessionGroups.entries()).map(([seriesId, sessions]) => {
    const firstSession = sessions[0];
    const nextSession = sessions[0];
    const lastSession = sessions[sessions.length - 1];

    let sessionDetails: any = {};
    try {
      if (firstSession.notes) {
        sessionDetails = JSON.parse(firstSession.notes);
      }
    } catch (e) {}

    const completedCount = publicSessions.filter((s: any) => {
      try {
        const notes = s.notes ? JSON.parse(s.notes) : {};
        return notes.seriesId === seriesId && s.status === 'completed';
      } catch {
        return false;
      }
    }).length;

    // Format recurrence pattern for display
    let recurrencePatternText = 'Custom schedule';
    if (sessionDetails.recurrencePattern && typeof sessionDetails.recurrencePattern === 'object') {
      const pattern = sessionDetails.recurrencePattern;
      if (pattern.days) {
        if (pattern.days.includes('daily')) {
          recurrencePatternText = 'Every day';
        } else {
          const dayNames = pattern.days.map((d: string) => d.charAt(0).toUpperCase() + d.slice(1));
          if (dayNames.length === 1) {
            recurrencePatternText = `Every ${dayNames[0]}`;
          } else if (dayNames.length === 2) {
            recurrencePatternText = `${dayNames[0]} & ${dayNames[1]}`;
          } else {
            recurrencePatternText = `${dayNames.slice(0, -1).join(', ')} & ${dayNames[dayNames.length - 1]}`;
          }
        }
      }
    } else if (typeof sessionDetails.recurrencePattern === 'string') {
      recurrencePatternText = sessionDetails.recurrencePattern;
    }

    return {
      seriesId,
      topic: firstSession.topic || 'Recurring Program',
      mentor: firstSession.mentor,
      sessionType: sessionDetails.sessionType || 'public',
      recurrencePattern: recurrencePatternText,
      totalSessions: sessionDetails.totalSessions || sessions.length,
      completedSessions: completedCount,
      remainingSessions: sessions.length,
      nextSessionDate: new Date(nextSession.scheduledAt),
      endDate: new Date(lastSession.scheduledAt),
      duration: firstSession.duration,
      platform: sessionDetails.platform || 'Not specified',
      description: sessionDetails.description || '',
      capacity: sessionDetails.capacity || 10,
      registeredCount: sessionDetails.registeredCount || 0,
      registeredStudents: sessionDetails.registeredStudents || [],
      sessions: sessions,
      notes: firstSession.notes
    };
  });

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white border-[1.5px] border-[var(--ispora-border)] rounded-2xl p-6 mb-5">
        <h2 className="font-syne font-bold text-sm md:text-lg text-[var(--ispora-text)] mb-2">
          Upcoming Community Events
        </h2>
        <p className="text-sm text-[var(--ispora-text3)]">
          Join public sessions hosted by mentors. Learn, network, and grow together!
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-3 border-[var(--ispora-brand)] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (standalonePublicSessions.length === 0 && publicSessionSeries.length === 0) ? (
        <div className="bg-white border-[1.5px] border-[var(--ispora-border)] rounded-2xl p-10 text-center">
          <div className="w-16 h-16 bg-[var(--ispora-brand-light)] rounded-full flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-7 h-7 text-[var(--ispora-brand)]" strokeWidth={1.8} />
          </div>
          <h3 className="font-syne font-bold text-[var(--ispora-text)] mb-2">No upcoming events</h3>
          <p className="text-sm text-[var(--ispora-text3)]">Check back soon for new community events!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Render Public Series Cards First */}
          {publicSessionSeries.map((series) => {
            const spotsLeft = series.capacity - series.registeredCount;
            const isFull = spotsLeft <= 0;
            const isRegistered = user && series.registeredStudents.includes(user.id);

            return (
              <div 
                key={series.seriesId}
                className="group bg-white border-[1.5px] border-[var(--ispora-border)] rounded-xl p-4 hover:border-[var(--ispora-accent)] hover:shadow-md transition-all cursor-pointer"
                onClick={() => handleSessionClick(series.sessions[0])}
              >
                {/* Series Badge */}
                <div className="mb-3 flex items-center gap-2 flex-wrap">
                  <div className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-[var(--ispora-accent)] text-white">
                    <Repeat className="w-2.5 h-2.5" strokeWidth={2.5} />
                    RECURRING PROGRAM
                  </div>
                  <div className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-[var(--ispora-brand)] text-white">
                    PUBLIC
                  </div>
                </div>

                {/* Mentor Info */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-[var(--ispora-brand)] flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md">
                    {series.mentor?.firstName?.[0]}{series.mentor?.lastName?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-syne font-bold text-sm text-[var(--ispora-text)] mb-0.5 truncate">
                      {series.mentor?.firstName} {series.mentor?.lastName}
                    </div>
                    <div className="font-semibold text-[13px] text-[var(--ispora-brand)] mb-1 truncate">
                      {series.topic}
                    </div>
                    <div className="text-[10px] text-[var(--ispora-text3)]">
                      {series.recurrencePattern}
                    </div>
                  </div>
                </div>

                {/* Progress */}
                <div className="bg-white rounded-lg p-3 mb-3 border-[1.5px] border-[var(--ispora-border)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-[var(--ispora-text)]">
                      Session {series.completedSessions + 1} of {series.totalSessions}
                    </span>
                    <span className="text-xs font-semibold text-[var(--ispora-accent)]">
                      {Math.round((series.completedSessions / series.totalSessions) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-[var(--ispora-bg)] rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-[var(--ispora-accent)] h-full transition-all"
                      style={{ width: `${(series.completedSessions / series.totalSessions) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Social Features */}
                <div className="flex items-center gap-3 mb-3 text-[11px]">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLikeSession(series.sessions[0].id, series.sessions[0].isLikedByCurrentUser);
                    }}
                    disabled={likingSessionIds.has(series.sessions[0].id)}
                    className={`flex items-center gap-1 transition-colors ${
                      likingSessionIds.has(series.sessions[0].id) 
                        ? 'text-[var(--ispora-text3)] opacity-50 cursor-wait' 
                        : 'text-[var(--ispora-text3)] hover:text-[var(--ispora-brand)]'
                    }`}
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${series.sessions[0].isLikedByCurrentUser ? 'fill-[var(--ispora-brand)] text-[var(--ispora-brand)]' : ''}`}
                      strokeWidth={2}
                    />
                    <span className="font-semibold">{series.sessions[0].likesCount || 0}</span>
                  </button>
                  <div className="flex items-center gap-1 text-[var(--ispora-text3)]">
                    <Eye className="w-3.5 h-3.5" strokeWidth={2} />
                    <span className="font-semibold">{series.sessions[0].viewsCount || 0}</span>
                  </div>
                </div>

                {/* Next Session */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-[10px] font-semibold text-[var(--ispora-text3)]">Next:</div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const duration = series.duration || 60;
                        const endTime = new Date(series.nextSessionDate.getTime() + duration * 60000);
                        
                        setCalendarEvent({
                          title: series.topic,
                          description: series.description || 'Community event on Ispora',
                          location: series.platform || 'Online',
                          startTime: series.nextSessionDate,
                          endTime: endTime,
                          organizerName: series.mentorName || 'Ispora Community'
                        });
                        setShowCalendarModal(true);
                      }}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg border-[1.5px] border-[var(--ispora-border)] text-[var(--ispora-text2)] hover:border-[var(--ispora-brand)] hover:text-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] transition-all"
                      title="Add to Calendar"
                    >
                      <CalendarPlus className="w-3 h-3" strokeWidth={2} />
                      <span className="text-[9px] font-semibold whitespace-nowrap">Add to Calendar</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-[var(--ispora-text3)]">
                    <Calendar className="w-3.5 h-3.5" strokeWidth={2} />
                    {series.nextSessionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {series.nextSessionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {/* Capacity & CTA */}
                <div className="flex items-center justify-between pt-3 border-t-[1.5px] border-[var(--ispora-border)]">
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <Users className="w-3.5 h-3.5 text-[var(--ispora-text3)]" strokeWidth={2} />
                    <span className="font-semibold text-[var(--ispora-brand)]">{series.registeredCount} attending</span>
                    <span className="text-[var(--ispora-text3)]">·</span>
                    <span className={isFull ? 'text-[var(--ispora-danger)] font-semibold' : 'text-[var(--ispora-success)]'}>
                      {isFull ? 'Full' : `${spotsLeft} spots left`}
                    </span>
                  </div>
                  <div>
                    {isRegistered ? (
                      <div className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-[var(--ispora-success-light)] text-[var(--ispora-success)]">
                        <CheckCircle2 className="w-3 h-3" strokeWidth={2.5} />
                        You're In!
                      </div>
                    ) : (
                      <button
                        onClick={(e) => handleRegisterForSession(series.sessions[0].id, e)}
                        disabled={isFull || registeringSession === series.sessions[0].id}
                        className={`
                          text-[10px] font-bold px-2.5 py-1 rounded-full transition-all
                          ${isFull 
                            ? 'bg-[var(--ispora-bg)] text-[var(--ispora-text3)] cursor-not-allowed' 
                            : registeringSession === series.sessions[0].id
                            ? 'bg-[var(--ispora-brand)] text-white opacity-50 cursor-wait'
                            : 'bg-[var(--ispora-brand)] text-white hover:shadow-md hover:scale-105'
                          }
                        `}
                      >
                        {registeringSession === series.sessions[0].id ? 'Joining...' : isFull ? 'Full' : 'Count Me In!'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Render Standalone Public Sessions */}
          {standalonePublicSessions.map((session: any) => {
            const sessionDate = new Date(session.scheduledAt);
            let sessionDetails = { platform: 'Not specified', description: '', capacity: 10, registeredCount: 0, registeredStudents: [] };
            
            try {
              if (session.notes) {
                const parsed = JSON.parse(session.notes);
                sessionDetails = { ...sessionDetails, ...parsed };
              }
            } catch (e) {}

            const spotsLeft = sessionDetails.capacity - sessionDetails.registeredCount;
            const isFull = spotsLeft <= 0;
            const isRegistered = user && sessionDetails.registeredStudents.includes(user.id);

            return (
              <div 
                key={session.id}
                className="group bg-white border-[1.5px] border-[var(--ispora-border)] rounded-xl p-4 hover:border-[var(--ispora-brand)] hover:shadow-md transition-all cursor-pointer"
                onClick={() => handleSessionClick(session)}
              >
                {/* Mentor Info */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-[var(--ispora-brand)] flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md">
                    {session.mentor?.firstName?.[0]}{session.mentor?.lastName?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-syne font-bold text-sm text-[var(--ispora-text)] mb-0.5 truncate">
                      {session.mentor?.firstName} {session.mentor?.lastName}
                    </div>
                    <div className="text-[10px] text-[var(--ispora-text3)] truncate">
                      {session.mentor?.currentRole || 'Diaspora Mentor'}
                    </div>
                  </div>
                </div>

                {/* Topic */}
                <div className="mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-[13px] text-[var(--ispora-text)] line-clamp-2 min-h-[36px]">
                      {session.topic || 'Mentorship Session'}
                    </h4>
                    {sessionDetails.isRecurring && (
                      <div className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-[var(--ispora-accent)] text-white">
                        <Repeat className="w-2.5 h-2.5" strokeWidth={2.5} />
                        {sessionDetails.sessionNumber}/{sessionDetails.totalSessions}
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                {sessionDetails.description && (
                  <p className="text-[11px] text-[var(--ispora-text2)] leading-relaxed line-clamp-2 mb-3">
                    {sessionDetails.description}
                  </p>
                )}

                {/* Social Features */}
                <div className="flex items-center gap-3 mb-3 text-[11px]">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLikeSession(session.id, session.isLikedByCurrentUser);
                    }}
                    disabled={likingSessionIds.has(session.id)}
                    className={`flex items-center gap-1 transition-colors ${
                      likingSessionIds.has(session.id) 
                        ? 'text-[var(--ispora-text3)] opacity-50 cursor-wait' 
                        : 'text-[var(--ispora-text3)] hover:text-[var(--ispora-brand)]'
                    }`}
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${session.isLikedByCurrentUser ? 'fill-[var(--ispora-brand)] text-[var(--ispora-brand)]' : ''}`}
                      strokeWidth={2}
                    />
                    <span className="font-semibold">{session.likesCount || 0}</span>
                  </button>
                  <div className="flex items-center gap-1 text-[var(--ispora-text3)]">
                    <Eye className="w-3.5 h-3.5" strokeWidth={2} />
                    <span className="font-semibold">{session.viewsCount || 0}</span>
                  </div>
                </div>

                {/* Session Info */}
                <div className="space-y-1.5 mb-3 pt-3 border-t-[1.5px] border-[var(--ispora-border)]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[11px] text-[var(--ispora-text3)]">
                      <Calendar className="w-3.5 h-3.5" strokeWidth={2} />
                      <span>{sessionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {sessionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const duration = session.duration || 60;
                        const endTime = new Date(sessionDate.getTime() + duration * 60000);
                        
                        setCalendarEvent({
                          title: session.topic,
                          description: sessionDetails.description || 'Community event on Ispora',
                          location: sessionDetails.platform || 'Online',
                          startTime: sessionDate,
                          endTime: endTime,
                          organizerName: `${session.mentor?.firstName} ${session.mentor?.lastName}` || 'Ispora Community'
                        });
                        setShowCalendarModal(true);
                      }}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg border-[1.5px] border-[var(--ispora-border)] text-[var(--ispora-text2)] hover:border-[var(--ispora-brand)] hover:text-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] transition-all"
                      title="Add to Calendar"
                    >
                      <CalendarPlus className="w-3 h-3" strokeWidth={2} />
                      <span className="text-[9px] font-semibold whitespace-nowrap">Add to Calendar</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-[var(--ispora-text3)]">
                    <Video className="w-3.5 h-3.5" strokeWidth={2} />
                    <span>{sessionDetails.platform} • {session.duration} min</span>
                  </div>
                </div>

                {/* Capacity & CTA */}
                <div className="flex items-center justify-between">
                  <div className={`text-[10px] font-bold ${isFull ? 'text-[var(--ispora-danger)]' : 'text-[var(--ispora-success)]'}`}>
                    {isFull ? 'Full' : `${spotsLeft} spots left`}
                  </div>
                  <div>
                    {isRegistered ? (
                      <div className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-[var(--ispora-success-light)] text-[var(--ispora-success)]">
                        <CheckCircle2 className="w-3 h-3" strokeWidth={2.5} />
                        You're In!
                      </div>
                    ) : (
                      <button
                        onClick={(e) => handleRegisterForSession(session.id, e)}
                        disabled={isFull || registeringSession === session.id}
                        className={`
                          text-[10px] font-bold px-2.5 py-1 rounded-full transition-all
                          ${isFull 
                            ? 'bg-[var(--ispora-bg)] text-[var(--ispora-text3)] cursor-not-allowed' 
                            : registeringSession === session.id
                            ? 'bg-[var(--ispora-brand)] text-white opacity-50 cursor-wait'
                            : 'bg-[var(--ispora-brand)] text-white hover:shadow-md hover:scale-105'
                          }
                        `}
                      >
                        {registeringSession === session.id ? 'Joining...' : isFull ? 'Full' : 'Count Me In!'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}