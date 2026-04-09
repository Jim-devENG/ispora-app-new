import { X, Calendar as CalendarIcon, Download } from 'lucide-react';
import { generateGoogleCalendarUrl, generateOutlookCalendarUrl, downloadICalendarFile } from '../utils/calendar';

interface CalendarEvent {
  title: string;
  description?: string;
  location?: string;
  startTime: Date;
  endTime: Date;
  organizerName?: string;
  organizerEmail?: string;
  // Recurring event properties
  isRecurring?: boolean;
  recurrenceRule?: string;
  recurrenceEndDate?: Date;
  allSessionDates?: Date[];
  sessionUrl?: string; // Link back to Ispora platform
}

interface CalendarModalProps {
  event: CalendarEvent;
  onClose: () => void;
}

export default function CalendarModal({ event, onClose }: CalendarModalProps) {
  const handleGoogleCalendar = () => {
    const url = generateGoogleCalendarUrl(event);
    window.open(url, '_blank');
    onClose();
  };

  const handleOutlookCalendar = () => {
    const url = generateOutlookCalendarUrl(event);
    window.open(url, '_blank');
    onClose();
  };

  const handleAppleCalendar = () => {
    downloadICalendarFile(event);
    onClose();
  };

  const handleDownloadICS = () => {
    downloadICalendarFile(event);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b-[1.5px] border-[var(--ispora-border)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--ispora-brand-light)] flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-[var(--ispora-brand)]" strokeWidth={2} />
            </div>
            <div>
              <h3 className="font-syne font-bold text-base text-[var(--ispora-text)]">
                Add to Calendar
              </h3>
              <p className="text-xs text-[var(--ispora-text3)]">
                Choose your calendar app
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-[var(--ispora-bg)] flex items-center justify-center text-[var(--ispora-text2)] transition-colors"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>

        {/* Event Preview */}
        <div className="px-6 py-4 bg-[var(--ispora-bg)]">
          <div className="text-sm font-semibold text-[var(--ispora-text)] mb-1">
            {event.title}
            {event.isRecurring && (
              <span className="ml-2 inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-[var(--ispora-accent)] text-white">
                🔄 RECURRING
              </span>
            )}
          </div>
          <div className="text-xs text-[var(--ispora-text3)]">
            {event.isRecurring ? 'Starts: ' : ''}{event.startTime.toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric', 
              year: 'numeric' 
            })}
          </div>
          <div className="text-xs text-[var(--ispora-text3)] mt-0.5">
            {event.startTime.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })} - {event.endTime.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
          {event.isRecurring && event.allSessionDates && event.allSessionDates.length > 1 && (
            <div className="mt-2 pt-2 border-t border-[var(--ispora-border)]">
              <div className="text-xs font-semibold text-[var(--ispora-brand)] mb-1">
                {event.allSessionDates.length} total sessions
              </div>
              <div className="text-[10px] text-[var(--ispora-text3)]">
                Until {event.allSessionDates[event.allSessionDates.length - 1].toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
            </div>
          )}
        </div>

        {/* Calendar Options */}
        <div className="p-6 space-y-3">
          {/* Google Calendar */}
          <button
            onClick={handleGoogleCalendar}
            className="w-full flex items-center gap-4 p-4 rounded-xl border-[1.5px] border-[var(--ispora-border)] hover:border-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-white border-[1.5px] border-[var(--ispora-border)] flex items-center justify-center flex-shrink-0 group-hover:border-[var(--ispora-brand)] transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" fill="#4285F4"/>
                <path d="M12 4.5c2.156 0 3.956.744 5.28 1.968l3.96-3.96C18.744 1.008 15.696 0 12 0 7.392 0 3.396 2.52 1.332 6.264l4.608 3.576C6.984 7.104 9.24 4.5 12 4.5z" fill="#EA4335"/>
                <path d="M5.76 12c0-.72.12-1.416.36-2.064L1.332 6.264C.48 7.896 0 9.9 0 12s.48 4.104 1.332 5.736l4.788-3.672A7.152 7.152 0 015.76 12z" fill="#FBBC05"/>
                <path d="M12 19.5c-2.76 0-5.016-2.604-6.06-5.34l-4.608 3.576C3.396 21.48 7.392 24 12 24c3.456 0 6.432-.948 8.616-2.58l-4.332-3.36c-1.176.792-2.676 1.44-4.284 1.44z" fill="#34A853"/>
              </svg>
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-sm text-[var(--ispora-text)] group-hover:text-[var(--ispora-brand)] transition-colors">
                Google Calendar
              </div>
              <div className="text-xs text-[var(--ispora-text3)]">
                Opens instantly in your browser
              </div>
            </div>
          </button>

          {/* Outlook Calendar */}
          <button
            onClick={handleOutlookCalendar}
            className="w-full flex items-center gap-4 p-4 rounded-xl border-[1.5px] border-[var(--ispora-border)] hover:border-[#0078D4] hover:bg-[#E6F2FF] transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-white border-[1.5px] border-[var(--ispora-border)] flex items-center justify-center flex-shrink-0 group-hover:border-[#0078D4] transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <rect width="24" height="24" rx="2" fill="#0078D4"/>
                <path d="M8 7h8v2H8V7zm0 4h8v2H8v-2zm0 4h5v2H8v-2z" fill="white"/>
              </svg>
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-sm text-[var(--ispora-text)] group-hover:text-[#0078D4] transition-colors">
                Outlook Calendar
              </div>
              <div className="text-xs text-[var(--ispora-text3)]">
                For Outlook.com & Office 365
              </div>
            </div>
          </button>

          {/* Apple Calendar */}
          <button
            onClick={handleAppleCalendar}
            className="w-full flex items-center gap-4 p-4 rounded-xl border-[1.5px] border-[var(--ispora-border)] hover:border-[#000000] hover:bg-[#F5F5F7] transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-white border-[1.5px] border-[var(--ispora-border)] flex items-center justify-center flex-shrink-0 group-hover:border-[#000000] transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" fill="#000000"/>
              </svg>
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-sm text-[var(--ispora-text)] group-hover:text-[#000000] transition-colors">
                Apple Calendar
              </div>
              <div className="text-xs text-[var(--ispora-text3)]">
                For iPhone, iPad, or Mac
              </div>
            </div>
          </button>

          {/* Other (Download ICS) */}
          <button
            onClick={handleDownloadICS}
            className="w-full flex items-center gap-4 p-4 rounded-xl border-[1.5px] border-[var(--ispora-border)] hover:border-[var(--ispora-accent)] hover:bg-[#FFF8E6] transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-white border-[1.5px] border-[var(--ispora-border)] flex items-center justify-center flex-shrink-0 group-hover:border-[var(--ispora-accent)] transition-colors">
              <Download className="w-5 h-5 text-[var(--ispora-text2)] group-hover:text-[var(--ispora-accent)]" strokeWidth={2} />
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-sm text-[var(--ispora-text)] group-hover:text-[var(--ispora-accent)] transition-colors">
                Other Calendar Apps
              </div>
              <div className="text-xs text-[var(--ispora-text3)]">
                Download .ics file (safe & universal format)
              </div>
            </div>
          </button>
        </div>

        {/* Footer Info */}
        <div className="px-6 py-4 bg-[var(--ispora-bg)] border-t-[1.5px] border-[var(--ispora-border)]">
          <p className="text-xs text-[var(--ispora-text3)] text-center">
            🔒 Your calendar data stays private. We don't store any information.
          </p>
        </div>
      </div>
    </div>
  );
}