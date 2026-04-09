# Community Feature - Supabase Backend Implementation Guide

## Overview
This guide provides the complete implementation for the Community feature backend, including database schema and all Edge Function endpoints.

## 📋 Part 1: Database Schema

Run these SQL commands in your Supabase SQL Editor:

```sql
-- ══════════════════════════════════════════════════════════════════════════════
-- COMMUNITY POSTS TABLE (Feed)
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS community_posts (
  id TEXT PRIMARY KEY DEFAULT ('post_' || extract(epoch from now())::bigint || '_' || substr(md5(random()::text), 1, 10)),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  category TEXT,
  link_url TEXT,
  link_title TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_category ON community_posts(category);
CREATE INDEX IF NOT EXISTS idx_community_posts_likes ON community_posts(likes_count DESC);

-- ══════════════════════════════════════════════════════════════════════════════
-- COMMUNITY POST LIKES TABLE
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS community_post_likes (
  id TEXT PRIMARY KEY DEFAULT ('like_' || extract(epoch from now())::bigint || '_' || substr(md5(random()::text), 1, 10)),
  post_id TEXT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_community_post_likes_post_id ON community_post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_community_post_likes_user_id ON community_post_likes(user_id);

-- ══════════════════════════════════════════════════════════════════════════════
-- COMMUNITY POST COMMENTS TABLE
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS community_post_comments (
  id TEXT PRIMARY KEY DEFAULT ('comment_' || extract(epoch from now())::bigint || '_' || substr(md5(random()::text), 1, 10)),
  post_id TEXT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_community_post_comments_post_id ON community_post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_post_comments_user_id ON community_post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_community_post_comments_created_at ON community_post_comments(created_at);

-- ══════════════════════════════════════════════════════════════════════════════
-- COMMUNITY DISCUSSIONS TABLE
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS community_discussions (
  id TEXT PRIMARY KEY DEFAULT ('discussion_' || extract(epoch from now())::bigint || '_' || substr(md5(random()::text), 1, 10)),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  replies_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  best_answer_id TEXT,
  is_answered BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_community_discussions_user_id ON community_discussions(user_id);
CREATE INDEX IF NOT EXISTS idx_community_discussions_created_at ON community_discussions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_discussions_category ON community_discussions(category);
CREATE INDEX IF NOT EXISTS idx_community_discussions_is_answered ON community_discussions(is_answered);

-- ══════════════════════════════════════════════════════════════════════════════
-- COMMUNITY DISCUSSION REPLIES TABLE
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS community_discussion_replies (
  id TEXT PRIMARY KEY DEFAULT ('reply_' || extract(epoch from now())::bigint || '_' || substr(md5(random()::text), 1, 10)),
  discussion_id TEXT NOT NULL REFERENCES community_discussions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_best_answer BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_community_discussion_replies_discussion_id ON community_discussion_replies(discussion_id);
CREATE INDEX IF NOT EXISTS idx_community_discussion_replies_user_id ON community_discussion_replies(user_id);
CREATE INDEX IF NOT EXISTS idx_community_discussion_replies_created_at ON community_discussion_replies(created_at);

-- ══════════════════════════════════════════════════════════════════════════════
-- TRIGGERS TO AUTO-UPDATE COUNTS
-- ══════════════════════════════════════════════════════════════════════════════

-- Trigger to update post comments count
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_posts 
    SET comments_count = comments_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_posts 
    SET comments_count = GREATEST(comments_count - 1, 0)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_post_comments_count
AFTER INSERT OR DELETE ON community_post_comments
FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

-- Trigger to update post likes count
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_posts 
    SET likes_count = likes_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_posts 
    SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_post_likes_count
AFTER INSERT OR DELETE ON community_post_likes
FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

-- Trigger to update discussion replies count
CREATE OR REPLACE FUNCTION update_discussion_replies_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_discussions 
    SET replies_count = replies_count + 1
    WHERE id = NEW.discussion_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_discussions 
    SET replies_count = GREATEST(replies_count - 1, 0)
    WHERE id = OLD.discussion_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_discussion_replies_count
AFTER INSERT OR DELETE ON community_discussion_replies
FOR EACH ROW EXECUTE FUNCTION update_discussion_replies_count();

-- Trigger to mark discussion as answered when best answer is set
CREATE OR REPLACE FUNCTION update_discussion_answered_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.best_answer_id IS NOT NULL AND (OLD.best_answer_id IS NULL OR OLD.best_answer_id != NEW.best_answer_id) THEN
    NEW.is_answered = TRUE;
    -- Update the reply to mark it as best answer
    UPDATE community_discussion_replies
    SET is_best_answer = TRUE
    WHERE id = NEW.best_answer_id;
    -- Remove best answer flag from previous best answer if exists
    IF OLD.best_answer_id IS NOT NULL THEN
      UPDATE community_discussion_replies
      SET is_best_answer = FALSE
      WHERE id = OLD.best_answer_id;
    END IF;
  ELSIF NEW.best_answer_id IS NULL THEN
    NEW.is_answered = FALSE;
    -- Remove best answer flag from reply if exists
    IF OLD.best_answer_id IS NOT NULL THEN
      UPDATE community_discussion_replies
      SET is_best_answer = FALSE
      WHERE id = OLD.best_answer_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_discussion_answered_status
BEFORE UPDATE OF best_answer_id ON community_discussions
FOR EACH ROW EXECUTE FUNCTION update_discussion_answered_status();
```

---

## 📝 Part 2: Edge Function Implementation

Add the following routes to your existing `make-server-b8526fa6/index.ts` file:

```typescript
// ══════════════════════════════════════════════════════════════════════════════
// COMMUNITY ENDPOINTS - Add these to your existing index.ts file
// ══════════════════════════════════════════════════════════════════════════════

// ────────────────────────────────────────────────────────────────────────────
// COMMUNITY POSTS (Feed)
// ────────────────────────────────────────────────────────────────────────────

if (pathname === '/community/posts' && method === 'POST') {
  // Create a new post
  const user = await authenticateUser(req, supabaseClient);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  const { content, category, linkUrl, linkTitle } = await req.json();

  if (!content || content.trim().length === 0) {
    return new Response(JSON.stringify({ error: 'Content is required' }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  const { data: post, error } = await supabaseClient
    .from('community_posts')
    .insert({
      user_id: user.id,
      content: content.trim(),
      category: category || null,
      link_url: linkUrl || null,
      link_title: linkTitle || null,
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error creating post:', error);
    return new Response(JSON.stringify({ error: 'Failed to create post' }), {
      status: 500,
      headers: corsHeaders,
    });
  }

  // Get user profile to include in response
  const { data: userProfile } = await supabaseClient
    .from('user_profiles')
    .select('first_name, last_name, role')
    .eq('id', user.id)
    .single();

  return new Response(JSON.stringify({
    success: true,
    post: {
      ...post,
      user: userProfile ? {
        firstName: userProfile.first_name,
        lastName: userProfile.last_name,
        role: userProfile.role,
      } : null,
      liked: false,
      comments: [],
    },
  }), {
    status: 201,
    headers: corsHeaders,
  });
}

if (pathname === '/community/posts' && method === 'GET') {
  // Get all posts with optional filtering and sorting
  const user = await authenticateUser(req, supabaseClient);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const sort = searchParams.get('sort') || 'recent';
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  // Build query
  let query = supabaseClient
    .from('community_posts')
    .select('*');

  // Apply filters
  if (category) {
    query = query.eq('category', category);
  }

  // Apply sorting
  if (sort === 'popular') {
    query = query.order('likes_count', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data: posts, error } = await query;

  if (error) {
    console.error('Error fetching posts:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch posts' }), {
      status: 500,
      headers: corsHeaders,
    });
  }

  // Enrich posts with user data, likes, and comments
  const enrichedPosts = await Promise.all(posts.map(async (post) => {
    // Get user profile
    const { data: userProfile } = await supabaseClient
      .from('user_profiles')
      .select('first_name, last_name, role')
      .eq('id', post.user_id)
      .single();

    // Check if current user liked this post
    const { data: likeData } = await supabaseClient
      .from('community_post_likes')
      .select('id')
      .eq('post_id', post.id)
      .eq('user_id', user.id)
      .maybeSingle();

    // Get recent comments
    const { data: comments } = await supabaseClient
      .from('community_post_comments')
      .select('*, user_profiles!community_post_comments_user_id_fkey(first_name, last_name, role)')
      .eq('post_id', post.id)
      .order('created_at', { ascending: false })
      .limit(3);

    return {
      ...post,
      user: userProfile ? {
        firstName: userProfile.first_name,
        lastName: userProfile.last_name,
        role: userProfile.role,
      } : null,
      liked: !!likeData,
      comments: (comments || []).map(c => ({
        id: c.id,
        content: c.content,
        createdAt: c.created_at,
        user: c.user_profiles ? {
          firstName: c.user_profiles.first_name,
          lastName: c.user_profiles.last_name,
          role: c.user_profiles.role,
        } : null,
      })),
    };
  }));

  return new Response(JSON.stringify({
    success: true,
    posts: enrichedPosts,
  }), {
    status: 200,
    headers: corsHeaders,
  });
}

if (pathname.match(/^\/community\/posts\/[^/]+$/) && method === 'DELETE') {
  // Delete a post
  const user = await authenticateUser(req, supabaseClient);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  const postId = pathname.split('/').pop();

  // Check if post exists and belongs to user
  const { data: post } = await supabaseClient
    .from('community_posts')
    .select('user_id')
    .eq('id', postId)
    .single();

  if (!post) {
    return new Response(JSON.stringify({ error: 'Post not found' }), {
      status: 404,
      headers: corsHeaders,
    });
  }

  if (post.user_id !== user.id) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: corsHeaders,
    });
  }

  const { error } = await supabaseClient
    .from('community_posts')
    .delete()
    .eq('id', postId);

  if (error) {
    console.error('Error deleting post:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete post' }), {
      status: 500,
      headers: corsHeaders,
    });
  }

  return new Response(JSON.stringify({
    success: true,
    message: 'Post deleted successfully',
  }), {
    status: 200,
    headers: corsHeaders,
  });
}

if (pathname.match(/^\/community\/posts\/[^/]+\/like$/) && method === 'POST') {
  // Like/Unlike a post (toggle)
  const user = await authenticateUser(req, supabaseClient);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  const postId = pathname.split('/')[3];

  // Check if already liked
  const { data: existingLike } = await supabaseClient
    .from('community_post_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existingLike) {
    // Unlike
    const { error } = await supabaseClient
      .from('community_post_likes')
      .delete()
      .eq('id', existingLike.id);

    if (error) {
      console.error('Error unliking post:', error);
      return new Response(JSON.stringify({ error: 'Failed to unlike post' }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({
      success: true,
      liked: false,
    }), {
      status: 200,
      headers: corsHeaders,
    });
  } else {
    // Like
    const { error } = await supabaseClient
      .from('community_post_likes')
      .insert({
        post_id: postId,
        user_id: user.id,
      });

    if (error) {
      console.error('Error liking post:', error);
      return new Response(JSON.stringify({ error: 'Failed to like post' }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({
      success: true,
      liked: true,
    }), {
      status: 200,
      headers: corsHeaders,
    });
  }
}

if (pathname.match(/^\/community\/posts\/[^/]+\/comments$/) && method === 'POST') {
  // Add a comment to a post
  const user = await authenticateUser(req, supabaseClient);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  const postId = pathname.split('/')[3];
  const { content } = await req.json();

  if (!content || content.trim().length === 0) {
    return new Response(JSON.stringify({ error: 'Comment content is required' }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  const { data: comment, error } = await supabaseClient
    .from('community_post_comments')
    .insert({
      post_id: postId,
      user_id: user.id,
      content: content.trim(),
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error creating comment:', error);
    return new Response(JSON.stringify({ error: 'Failed to create comment' }), {
      status: 500,
      headers: corsHeaders,
    });
  }

  // Get user profile
  const { data: userProfile } = await supabaseClient
    .from('user_profiles')
    .select('first_name, last_name, role')
    .eq('id', user.id)
    .single();

  return new Response(JSON.stringify({
    success: true,
    comment: {
      ...comment,
      user: userProfile ? {
        firstName: userProfile.first_name,
        lastName: userProfile.last_name,
        role: userProfile.role,
      } : null,
    },
  }), {
    status: 201,
    headers: corsHeaders,
  });
}

// ────────────────────────────────────────────────────────────────────────────
// COMMUNITY DISCUSSIONS
// ────────────────────────────────────────────────────────────────────────────

if (pathname === '/community/discussions' && method === 'POST') {
  // Create a new discussion
  const user = await authenticateUser(req, supabaseClient);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  const { title, content, category, tags } = await req.json();

  if (!title || title.trim().length === 0) {
    return new Response(JSON.stringify({ error: 'Title is required' }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  if (!content || content.trim().length === 0) {
    return new Response(JSON.stringify({ error: 'Content is required' }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  if (!category) {
    return new Response(JSON.stringify({ error: 'Category is required' }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  const { data: discussion, error } = await supabaseClient
    .from('community_discussions')
    .insert({
      user_id: user.id,
      title: title.trim(),
      content: content.trim(),
      category,
      tags: tags || [],
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error creating discussion:', error);
    return new Response(JSON.stringify({ error: 'Failed to create discussion' }), {
      status: 500,
      headers: corsHeaders,
    });
  }

  // Get user profile
  const { data: userProfile } = await supabaseClient
    .from('user_profiles')
    .select('first_name, last_name, role')
    .eq('id', user.id)
    .single();

  return new Response(JSON.stringify({
    success: true,
    discussion: {
      ...discussion,
      user: userProfile ? {
        firstName: userProfile.first_name,
        lastName: userProfile.last_name,
        role: userProfile.role,
      } : null,
      replies: [],
    },
  }), {
    status: 201,
    headers: corsHeaders,
  });
}

if (pathname === '/community/discussions' && method === 'GET') {
  // Get all discussions with optional filtering and sorting
  const user = await authenticateUser(req, supabaseClient);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const sort = searchParams.get('sort') || 'recent';
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  // Build query
  let query = supabaseClient
    .from('community_discussions')
    .select('*');

  // Apply filters
  if (category) {
    query = query.eq('category', category);
  }

  // Apply sorting
  if (sort === 'popular') {
    query = query.order('replies_count', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data: discussions, error } = await query;

  if (error) {
    console.error('Error fetching discussions:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch discussions' }), {
      status: 500,
      headers: corsHeaders,
    });
  }

  // Enrich discussions with user data and replies
  const enrichedDiscussions = await Promise.all(discussions.map(async (discussion) => {
    // Get user profile
    const { data: userProfile } = await supabaseClient
      .from('user_profiles')
      .select('first_name, last_name, role')
      .eq('id', discussion.user_id)
      .single();

    // Get recent replies
    const { data: replies } = await supabaseClient
      .from('community_discussion_replies')
      .select('*, user_profiles!community_discussion_replies_user_id_fkey(first_name, last_name, role)')
      .eq('discussion_id', discussion.id)
      .order('created_at', { ascending: false })
      .limit(3);

    return {
      ...discussion,
      user: userProfile ? {
        firstName: userProfile.first_name,
        lastName: userProfile.last_name,
        role: userProfile.role,
      } : null,
      replies: (replies || []).map(r => ({
        id: r.id,
        content: r.content,
        createdAt: r.created_at,
        isBestAnswer: r.is_best_answer,
        user: r.user_profiles ? {
          firstName: r.user_profiles.first_name,
          lastName: r.user_profiles.last_name,
          role: r.user_profiles.role,
        } : null,
      })),
    };
  }));

  return new Response(JSON.stringify({
    success: true,
    discussions: enrichedDiscussions,
  }), {
    status: 200,
    headers: corsHeaders,
  });
}

if (pathname.match(/^\/community\/discussions\/[^/]+$/) && method === 'DELETE') {
  // Delete a discussion
  const user = await authenticateUser(req, supabaseClient);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  const discussionId = pathname.split('/').pop();

  // Check if discussion exists and belongs to user
  const { data: discussion } = await supabaseClient
    .from('community_discussions')
    .select('user_id')
    .eq('id', discussionId)
    .single();

  if (!discussion) {
    return new Response(JSON.stringify({ error: 'Discussion not found' }), {
      status: 404,
      headers: corsHeaders,
    });
  }

  if (discussion.user_id !== user.id) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: corsHeaders,
    });
  }

  const { error } = await supabaseClient
    .from('community_discussions')
    .delete()
    .eq('id', discussionId);

  if (error) {
    console.error('Error deleting discussion:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete discussion' }), {
      status: 500,
      headers: corsHeaders,
    });
  }

  return new Response(JSON.stringify({
    success: true,
    message: 'Discussion deleted successfully',
  }), {
    status: 200,
    headers: corsHeaders,
  });
}

if (pathname.match(/^\/community\/discussions\/[^/]+\/replies$/) && method === 'POST') {
  // Add a reply to a discussion
  const user = await authenticateUser(req, supabaseClient);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  const discussionId = pathname.split('/')[3];
  const { content } = await req.json();

  if (!content || content.trim().length === 0) {
    return new Response(JSON.stringify({ error: 'Reply content is required' }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  const { data: reply, error } = await supabaseClient
    .from('community_discussion_replies')
    .insert({
      discussion_id: discussionId,
      user_id: user.id,
      content: content.trim(),
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error creating reply:', error);
    return new Response(JSON.stringify({ error: 'Failed to create reply' }), {
      status: 500,
      headers: corsHeaders,
    });
  }

  // Get user profile
  const { data: userProfile } = await supabaseClient
    .from('user_profiles')
    .select('first_name, last_name, role')
    .eq('id', user.id)
    .single();

  return new Response(JSON.stringify({
    success: true,
    reply: {
      ...reply,
      user: userProfile ? {
        firstName: userProfile.first_name,
        lastName: userProfile.last_name,
        role: userProfile.role,
      } : null,
    },
  }), {
    status: 201,
    headers: corsHeaders,
  });
}

if (pathname.match(/^\/community\/discussions\/[^/]+\/best-answer$/) && method === 'POST') {
  // Mark a reply as best answer
  const user = await authenticateUser(req, supabaseClient);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  const discussionId = pathname.split('/')[3];
  const { replyId } = await req.json();

  if (!replyId) {
    return new Response(JSON.stringify({ error: 'Reply ID is required' }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  // Check if discussion belongs to user
  const { data: discussion } = await supabaseClient
    .from('community_discussions')
    .select('user_id')
    .eq('id', discussionId)
    .single();

  if (!discussion) {
    return new Response(JSON.stringify({ error: 'Discussion not found' }), {
      status: 404,
      headers: corsHeaders,
    });
  }

  if (discussion.user_id !== user.id) {
    return new Response(JSON.stringify({ error: 'Only the discussion author can mark best answer' }), {
      status: 403,
      headers: corsHeaders,
    });
  }

  // Update discussion with best answer
  const { error } = await supabaseClient
    .from('community_discussions')
    .update({
      best_answer_id: replyId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', discussionId);

  if (error) {
    console.error('Error marking best answer:', error);
    return new Response(JSON.stringify({ error: 'Failed to mark best answer' }), {
      status: 500,
      headers: corsHeaders,
    });
  }

  return new Response(JSON.stringify({
    success: true,
    message: 'Best answer marked successfully',
  }), {
    status: 200,
    headers: corsHeaders,
  });
}
```

---

## 🚀 Part 3: Deployment Instructions

### Step 1: Create Database Tables
1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the entire SQL from Part 1
4. Click **Run** to create all tables, indexes, and triggers

### Step 2: Update Edge Function
1. Open your existing `make-server-b8526fa6/index.ts` file in your Supabase project
2. Add all the routes from Part 2 to your existing routes (before the final catch-all route)
3. Make sure your `authenticateUser()` function is present (you should already have it)

### Step 3: Deploy
```bash
supabase functions deploy make-server-b8526fa6
```

### Step 4: Test the Endpoints

Test creating a post:
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/make-server-b8526fa6/community/posts \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"My first post!","category":"general"}'
```

Test getting posts:
```bash
curl https://YOUR_PROJECT.supabase.co/functions/v1/make-server-b8526fa6/community/posts?sort=recent \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 📊 Database Schema Summary

The implementation creates 5 new tables:

1. **community_posts** - Feed posts with likes and comments counts
2. **community_post_likes** - Post likes (unique per user per post)
3. **community_post_comments** - Comments on posts
4. **community_discussions** - Q&A discussions with best answers
5. **community_discussion_replies** - Replies to discussions

All tables have automatic triggers to maintain accurate counts and status.

---

## ✅ Testing Checklist

After deployment, test these features:
- [ ] Create a post
- [ ] View posts feed
- [ ] Like/unlike a post
- [ ] Comment on a post
- [ ] Delete own post
- [ ] Create a discussion
- [ ] View discussions
- [ ] Reply to a discussion
- [ ] Mark best answer (as discussion author)
- [ ] Delete own discussion

---

## 🔧 Troubleshooting

**Issue**: "Failed to parse JSON response"
- **Solution**: Make sure the Edge Function is deployed and the routes are added correctly

**Issue**: "Unauthorized" error
- **Solution**: Check that your JWT token is valid and the `authenticateUser()` function works

**Issue**: Foreign key constraint errors
- **Solution**: Ensure the `user_profiles` table exists with proper user data

**Issue**: Counts not updating
- **Solution**: Check that the database triggers were created successfully

---

## 🎉 Success!

Once deployed, your Community feature will be fully functional with:
- ✅ Real-time post creation and viewing
- ✅ Likes and comments
- ✅ Q&A discussions
- ✅ Best answer marking
- ✅ Automatic count updates
- ✅ Clean data deletion (cascading)

The frontend is already built and will automatically connect to these endpoints!
