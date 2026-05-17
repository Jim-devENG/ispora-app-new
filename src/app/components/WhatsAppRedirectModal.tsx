import { useState, useEffect } from 'react';
import { MessageCircle, X, ExternalLink, Clock } from 'lucide-react';

interface WhatsAppRedirectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRedirect: () => void;
}

export default function WhatsAppRedirectModal({ isOpen, onClose, onRedirect }: WhatsAppRedirectModalProps) {
  const [countdown, setCountdown] = useState(10);
  const [autoRedirect, setAutoRedirect] = useState(true);

  useEffect(() => {
    if (!isOpen || !autoRedirect) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onRedirect();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, autoRedirect, onRedirect]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-[scaleUp_0.3s_ease]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#25D366] to-[#128C7E] p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <MessageCircle className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Join Our Community</h3>
                <p className="text-white/80 text-sm">Ispora WhatsApp Group</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-[var(--ispora-text)] text-sm leading-relaxed mb-4">
            Join the Ispora WhatsApp community to get prompt updates, connect with other members, and stay informed about new opportunities and events.
          </p>

          {/* Countdown */}
          {autoRedirect && (
            <div className="bg-[#25D366]/10 border border-[#25D366]/20 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-[#25D366]" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[var(--ispora-text)]">
                    Redirecting in {countdown} seconds...
                  </p>
                  <div className="w-full bg-[#25D366]/20 rounded-full h-2 mt-2">
                    <div 
                      className="bg-[#25D366] h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${(countdown / 10) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={onRedirect}
              className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white font-semibold py-3 px-4 rounded-xl transition-all"
            >
              <ExternalLink className="w-5 h-5" />
              Join WhatsApp Group Now
            </button>
            
            <button
              onClick={() => {
                setAutoRedirect(false);
                onClose();
              }}
              className="w-full text-[var(--ispora-text2)] hover:text-[var(--ispora-text)] font-medium py-2 px-4 transition-all"
            >
              Skip for now
            </button>
          </div>

          <p className="text-xs text-[var(--ispora-text3)] text-center mt-4">
            You can always join later from your profile settings
          </p>
        </div>
      </div>
    </div>
  );
}
