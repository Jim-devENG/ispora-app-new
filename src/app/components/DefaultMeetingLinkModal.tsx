import { useState } from 'react';
import { X, Link as LinkIcon, AlertCircle, Info } from 'lucide-react';

interface DefaultMeetingLinkModalProps {
  onSave: (link: string) => void;
  onSkip: () => void;
  onClose: () => void;
}

export default function DefaultMeetingLinkModal({ onSave, onSkip, onClose }: DefaultMeetingLinkModalProps) {
  const [meetingLink, setMeetingLink] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const validateUrl = (url: string): boolean => {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSave = async () => {
    if (!meetingLink.trim()) {
      setError('Please enter a meeting link');
      return;
    }

    if (!validateUrl(meetingLink)) {
      setError('Please enter a valid URL (e.g., https://meet.google.com/...)');
      return;
    }

    setSaving(true);
    setError('');
    
    try {
      await onSave(meetingLink);
    } catch (err) {
      setError('Failed to save. Please try again.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Set Your Default Meeting Link</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Info Banner */}
          <div className="flex gap-3 p-3.5 bg-blue-50/50 border border-blue-100 rounded-lg">
            <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">Save time on scheduling!</p>
              <p className="text-xs text-blue-700 mt-1">
                Set up your default meeting link once, and it will automatically be used for all future sessions. You can always change it per session if needed.
              </p>
            </div>
          </div>

          {/* Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900">
              Meeting Link <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="url"
                value={meetingLink}
                onChange={(e) => {
                  setMeetingLink(e.target.value);
                  setError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !saving) {
                    handleSave();
                  }
                }}
                placeholder="https://meet.google.com/... or https://zoom.us/j/..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-[var(--ispora-brand)] focus:ring-2 focus:ring-[var(--ispora-brand)]/20 transition-all"
                autoFocus
                disabled={saving}
              />
            </div>
            {error && (
              <p className="text-xs text-red-600 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                {error}
              </p>
            )}
            <p className="text-xs text-gray-500">
              Works with Zoom, Google Meet, Microsoft Teams, or any other meeting platform
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between gap-3">
          <button
            onClick={onSkip}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            disabled={saving}
          >
            Skip for now
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !meetingLink.trim()}
              className="px-5 py-2 bg-[var(--ispora-brand)] hover:bg-[var(--ispora-brand)]/90 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                'Save & Continue'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
