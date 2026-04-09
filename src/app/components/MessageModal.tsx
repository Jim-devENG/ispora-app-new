import { useState } from 'react';
import { X, Send } from 'lucide-react';
import { api } from '../lib/api';

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  mentorshipId: string;
  recipientName: string;
  recipientInitials: string;
  recipientRole: string;
  recipientField?: string;
  onViewFullConversation?: () => void;
}

export default function MessageModal({
  isOpen,
  onClose,
  mentorshipId,
  recipientName,
  recipientInitials,
  recipientRole,
  recipientField,
  onViewFullConversation
}: MessageModalProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!message.trim() || sending) return;

    try {
      setSending(true);
      
      // Send message using the same API as Messages page
      await api.message.send({
        mentorshipId,
        content: message.trim()
      });

      setSuccess(true);
      setMessage('');
      
      // Show success briefly then close
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    if (!sending) {
      setMessage('');
      setSuccess(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-[var(--ispora-border)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-syne text-lg font-bold text-[var(--ispora-text)]">
              Send Message
            </h2>
            <button
              onClick={handleClose}
              disabled={sending}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--ispora-bg)] transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5 text-[var(--ispora-text2)]" />
            </button>
          </div>

          {/* Recipient Info */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[var(--ispora-brand)] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {recipientInitials}
            </div>
            <div>
              <h3 className="font-semibold text-sm text-[var(--ispora-text)]">
                {recipientName}
              </h3>
              <p className="text-xs text-[var(--ispora-text3)]">
                {recipientRole} {recipientField && `• ${recipientField}`}
              </p>
            </div>
          </div>
        </div>

        {/* Message Input */}
        <div className="p-6">
          {success ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-3">
                <Send className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-sm font-semibold text-[var(--ispora-text)] mb-1">Message sent!</p>
              <p className="text-xs text-[var(--ispora-text3)]">Your message has been delivered</p>
            </div>
          ) : (
            <>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Type your message..."
                rows={6}
                disabled={sending}
                className="w-full px-4 py-3 bg-[var(--ispora-bg)] border border-[var(--ispora-border)] rounded-xl text-sm text-[var(--ispora-text)] placeholder:text-[var(--ispora-text3)] outline-none focus:border-[var(--ispora-brand)] transition-all resize-none disabled:opacity-50"
              />
              <p className="text-xs text-[var(--ispora-text3)] mt-2">
                Press Enter to send, Shift+Enter for new line
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="p-6 pt-0 flex items-center gap-3">
            {onViewFullConversation && (
              <button
                onClick={() => {
                  handleClose();
                  onViewFullConversation();
                }}
                disabled={sending}
                className="flex-1 px-4 py-2.5 rounded-xl border-[1.5px] border-[var(--ispora-border)] text-sm font-semibold text-[var(--ispora-text)] hover:border-[var(--ispora-brand)] hover:text-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] transition-all disabled:opacity-50"
              >
                View Full Conversation
              </button>
            )}
            <button
              onClick={handleSend}
              disabled={!message.trim() || sending}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--ispora-brand)] text-white text-sm font-semibold hover:bg-[var(--ispora-brand-hover)] hover:shadow-[0_6px_18px_rgba(2,31,246,0.35)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Message
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
