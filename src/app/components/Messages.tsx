import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Search, MoreVertical } from 'lucide-react';
import { api } from '../lib/api';

interface Message {
  id: string;
  mentorshipId: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  createdAt: string;
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

interface Conversation {
  mentorshipId: string;
  mentorId: string;
  studentId: string;
  otherUser: {
    id: string;
    name: string;
    initials: string;
    avatar?: string;
    role: string;
    field?: string;
  };
  lastMessage?: Message;
  unreadCount: number;
  messages: Message[];
}

interface MessagesProps {
  userRole: 'mentor' | 'student';
  userId: string;
  mentorships: any[];
  onBack?: () => void;
}

export function Messages({ userRole, userId, mentorships, onBack }: MessagesProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load all conversations
  const loadConversations = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      
      // For each mentorship, fetch messages
      const conversationPromises = mentorships
        .filter(m => m.status === 'active' || m.status === 'completed')
        .map(async (mentorship) => {
          try {
            const response = await api.message.getAll(mentorship.id);
            const messages = response.messages || [];
            
            // Determine the other user
            const otherUser = userRole === 'mentor' 
              ? {
                  id: mentorship.studentId,
                  name: mentorship.student ? `${mentorship.student.firstName} ${mentorship.student.lastName}` : 'Student',
                  initials: mentorship.student ? `${mentorship.student.firstName[0]}${mentorship.student.lastName[0]}` : 'S',
                  avatar: mentorship.student?.profilePicture,
                  role: 'Student',
                  field: mentorship.student?.fieldOfStudy
                }
              : {
                  id: mentorship.mentorId,
                  name: mentorship.mentor ? `${mentorship.mentor.firstName} ${mentorship.mentor.lastName}` : 'Mentor',
                  initials: mentorship.mentor ? `${mentorship.mentor.firstName[0]}${mentorship.mentor.lastName[0]}` : 'M',
                  avatar: mentorship.mentor?.profilePicture,
                  role: 'Mentor',
                  field: mentorship.mentor?.jobTitle
                };
            
            // Count unread messages
            const unreadCount = messages.filter((m: Message) => 
              !m.read && m.senderId !== userId
            ).length;
            
            // Get last message
            const lastMessage = messages.length > 0 
              ? messages[messages.length - 1]
              : undefined;
            
            return {
              mentorshipId: mentorship.id,
              mentorId: mentorship.mentorId,
              studentId: mentorship.studentId,
              otherUser,
              lastMessage,
              unreadCount,
              messages: messages.sort((a: Message, b: Message) => 
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
              )
            };
          } catch (error) {
            console.error(`Failed to load messages for mentorship ${mentorship.id}:`, error);
            return null;
          }
        });
      
      const results = await Promise.all(conversationPromises);
      const validConversations = results.filter(c => c !== null) as Conversation[];
      
      // Sort by last message time
      validConversations.sort((a, b) => {
        const aTime = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
        const bTime = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
        return bTime - aTime;
      });
      
      setConversations(validConversations);
      
      // If a conversation is selected, update it silently
      if (silent && selectedConversation) {
        const updatedConv = validConversations.find(c => c.mentorshipId === selectedConversation.mentorshipId);
        if (updatedConv) {
          setSelectedConversation(updatedConv);
        }
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadConversations();
    
    // Silent auto-refresh every 30 seconds in the background
    const interval = setInterval(() => {
      loadConversations(true);
    }, 30000);
    
    return () => clearInterval(interval);
  }, [mentorships, userId, userRole]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedConversation?.messages]);

  // Mark messages as read when conversation is opened
  useEffect(() => {
    if (selectedConversation) {
      const unreadMessages = selectedConversation.messages.filter(
        m => !m.read && m.senderId !== userId
      );
      
      unreadMessages.forEach(async (message) => {
        try {
          await api.message.markAsRead(message.id);
        } catch (error) {
          console.error('Failed to mark message as read:', error);
        }
      });
      
      // Update local state
      if (unreadMessages.length > 0) {
        setConversations(prev => prev.map(conv => 
          conv.mentorshipId === selectedConversation.mentorshipId
            ? { ...conv, unreadCount: 0, messages: conv.messages.map(m => ({ ...m, read: true })) }
            : conv
        ));
      }
    }
  }, [selectedConversation?.mentorshipId]);

  // Send message
  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation || sending) return;
    
    const messageContent = messageText.trim();
    const tempId = `temp-${Date.now()}`;
    
    try {
      setSending(true);
      setMessageText('');
      
      // Optimistically add the message to UI immediately
      const optimisticMessage: Message = {
        id: tempId,
        mentorshipId: selectedConversation.mentorshipId,
        senderId: userId,
        receiverId: userRole === 'mentor' ? selectedConversation.studentId : selectedConversation.mentorId,
        content: messageContent,
        read: false,
        createdAt: new Date().toISOString()
      };
      
      // Update selected conversation with new message
      const updatedConversation = {
        ...selectedConversation,
        messages: [...selectedConversation.messages, optimisticMessage],
        lastMessage: optimisticMessage
      };
      
      setSelectedConversation(updatedConversation);
      
      // Update conversations list
      setConversations(prev => prev.map(conv => 
        conv.mentorshipId === selectedConversation.mentorshipId
          ? updatedConversation
          : conv
      ));
      
      // Send to server
      await api.message.send({
        mentorshipId: selectedConversation.mentorshipId,
        content: messageContent
      });
      
      // Silently refresh to get actual message from server
      setTimeout(() => {
        loadConversations(true);
      }, 500);
      
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
      
      // Revert optimistic update on error
      setMessageText(messageContent);
      setSelectedConversation(selectedConversation);
      setConversations(prev => prev.map(conv => 
        conv.mentorshipId === selectedConversation.mentorshipId
          ? selectedConversation
          : conv
      ));
    } finally {
      setSending(false);
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter(conv =>
    conv.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + 
             date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
  };

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-[var(--ispora-brand)] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-[var(--ispora-text2)]">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-white rounded-2xl border border-[var(--ispora-border)] overflow-hidden shadow-sm">
      {/* Conversations List */}
      <div className={`${selectedConversation ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-col border-r border-[var(--ispora-border)]`}>
        {/* Header */}
        <div className="p-4 border-b border-[var(--ispora-border)]">
          <div className="flex items-center justify-between mb-4">
            {onBack && (
              <button
                onClick={onBack}
                className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--ispora-bg)] transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-[var(--ispora-text2)]" />
              </button>
            )}
            <h2 className="font-syne text-lg font-bold text-[var(--ispora-text)]">
              Messages {totalUnread > 0 && <span className="text-[var(--ispora-brand)]">({totalUnread})</span>}
            </h2>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ispora-text3)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-3 py-2 bg-[var(--ispora-bg)] border border-[var(--ispora-border)] rounded-lg text-sm text-[var(--ispora-text)] placeholder:text-[var(--ispora-text3)] outline-none focus:border-[var(--ispora-brand)] transition-all"
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--ispora-bg)] flex items-center justify-center mb-3">
                <Send className="w-8 h-8 text-[var(--ispora-text3)]" />
              </div>
              <p className="text-sm font-semibold text-[var(--ispora-text)] mb-1">No conversations yet</p>
              <p className="text-xs text-[var(--ispora-text3)]">
                {searchQuery ? 'No conversations match your search' : 'Start messaging your ' + (userRole === 'mentor' ? 'mentees' : 'mentor')}
              </p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv.mentorshipId}
                onClick={() => setSelectedConversation(conv)}
                className={`w-full p-4 flex items-start gap-3 hover:bg-[var(--ispora-bg)] transition-colors border-b border-[var(--ispora-border)] ${
                  selectedConversation?.mentorshipId === conv.mentorshipId ? 'bg-[var(--ispora-brand-light)]' : ''
                }`}
              >
                {/* Avatar */}
                {conv.otherUser.avatar ? (
                  <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                    <img 
                      src={conv.otherUser.avatar} 
                      alt={conv.otherUser.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[var(--ispora-brand)] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {conv.otherUser.initials}
                  </div>
                )}
                
                {/* Content */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-sm text-[var(--ispora-text)] truncate">
                      {conv.otherUser.name}
                    </h3>
                    {conv.lastMessage && (
                      <span className="text-xs text-[var(--ispora-text3)] flex-shrink-0 ml-2">
                        {formatTimestamp(conv.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--ispora-text3)] mb-1">
                    {conv.otherUser.role} {conv.otherUser.field && `• ${conv.otherUser.field}`}
                  </p>
                  {conv.lastMessage ? (
                    <p className="text-xs text-[var(--ispora-text2)] truncate">
                      {conv.lastMessage.senderId === userId ? 'You: ' : ''}{conv.lastMessage.content}
                    </p>
                  ) : (
                    <p className="text-xs text-[var(--ispora-text3)] italic">No messages yet</p>
                  )}
                </div>
                
                {/* Unread badge */}
                {conv.unreadCount > 0 && (
                  <div className="w-5 h-5 rounded-full bg-[var(--ispora-brand)] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {conv.unreadCount}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Message Thread */}
      {selectedConversation ? (
        <div className={`${selectedConversation ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}>
          {/* Thread Header */}
          <div className="p-4 border-b border-[var(--ispora-border)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedConversation(null)}
                className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--ispora-bg)] transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-[var(--ispora-text2)]" />
              </button>
              
              {selectedConversation.otherUser.avatar ? (
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                  <img 
                    src={selectedConversation.otherUser.avatar} 
                    alt={selectedConversation.otherUser.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-[var(--ispora-brand)] flex items-center justify-center text-white font-bold text-sm">
                  {selectedConversation.otherUser.initials}
                </div>
              )}
              
              <div>
                <h3 className="font-syne text-sm font-bold text-[var(--ispora-text)]">
                  {selectedConversation.otherUser.name}
                </h3>
                <p className="text-xs text-[var(--ispora-text3)]">
                  {selectedConversation.otherUser.role} {selectedConversation.otherUser.field && `• ${selectedConversation.otherUser.field}`}
                </p>
              </div>
            </div>
            
            <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--ispora-bg)] transition-colors">
              <MoreVertical className="w-5 h-5 text-[var(--ispora-text2)]" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-4">
            {selectedConversation.messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 rounded-full bg-[var(--ispora-bg)] flex items-center justify-center mb-3">
                  <Send className="w-8 h-8 text-[var(--ispora-text3)]" />
                </div>
                <p className="text-sm font-semibold text-[var(--ispora-text)] mb-1">No messages yet</p>
                <p className="text-xs text-[var(--ispora-text3)]">Send a message to start the conversation</p>
              </div>
            ) : (
              selectedConversation.messages.map((message) => {
                const isMine = message.senderId === userId;
                
                return (
                  <div
                    key={message.id}
                    className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[75%] md:max-w-[70%] ${isMine ? 'order-2' : 'order-1'}`}>
                      <div
                        className={`px-3 md:px-4 py-2.5 rounded-2xl ${
                          isMine
                            ? 'bg-[var(--ispora-brand)] text-white rounded-br-sm'
                            : 'bg-[var(--ispora-bg)] text-[var(--ispora-text)] rounded-bl-sm'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                      </div>
                      <p className={`text-xs text-[var(--ispora-text3)] mt-1 px-1 ${isMine ? 'text-right' : 'text-left'}`}>
                        {formatMessageTime(message.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-3 md:p-4 border-t border-[var(--ispora-border)]">
            <div className="flex items-end gap-2">
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Type your message..."
                rows={1}
                className="flex-1 px-4 py-2.5 bg-[var(--ispora-bg)] border border-[var(--ispora-border)] rounded-xl text-sm text-[var(--ispora-text)] placeholder:text-[var(--ispora-text3)] outline-none focus:border-[var(--ispora-brand)] transition-all resize-none max-h-32"
                style={{ minHeight: '42px' }}
              />
              <button
                onClick={handleSendMessage}
                disabled={!messageText.trim() || sending}
                className="w-10 h-10 rounded-xl bg-[var(--ispora-brand)] text-white flex items-center justify-center hover:bg-[var(--ispora-brand-hover)] hover:shadow-[0_6px_18px_rgba(2,31,246,0.35)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[var(--ispora-text3)] mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center bg-[var(--ispora-bg)]">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Send className="w-10 h-10 text-[var(--ispora-text3)]" />
            </div>
            <p className="text-sm font-semibold text-[var(--ispora-text)] mb-1">Select a conversation</p>
            <p className="text-xs text-[var(--ispora-text3)]">Choose a conversation from the list to start messaging</p>
          </div>
        </div>
      )}
    </div>
  );
}