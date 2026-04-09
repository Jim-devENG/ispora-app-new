/**
 * Calendar Utilities
 * Generate calendar links for multiple providers (Google, Outlook, Apple, etc.)
 * Universal iCalendar (.ics) format for download option
 */

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
  recurrenceRule?: string; // RRULE format
  recurrenceEndDate?: Date;
  allSessionDates?: Date[]; // All dates for platform calendar display
  // Ispora platform link
  sessionUrl?: string; // Link back to the session on Ispora
}

/**
 * Generate Google Calendar URL
 */
export function generateGoogleCalendarUrl(event: CalendarEvent): string {
  const formatGoogleDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  // Build description with session link
  let description = event.description || '';
  if (event.sessionUrl) {
    description = `Join on Ispora: ${event.sessionUrl}\\n\\n${description}`;
  }
  
  // Add recurring info to description if applicable
  if (event.isRecurring && event.allSessionDates && event.allSessionDates.length > 1) {
    description += `\\n\\nThis is a recurring event with ${event.allSessionDates.length} total sessions.`;
  }

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatGoogleDate(event.startTime)}/${formatGoogleDate(event.endTime)}`,
    details: description,
    location: event.location || '',
  });
  
  // Add recurrence rule if this is a recurring event
  if (event.isRecurring && event.recurrenceRule) {
    params.append('recur', `RRULE:${event.recurrenceRule}`);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate Outlook Calendar URL (Outlook.com/Office 365)
 */
export function generateOutlookCalendarUrl(event: CalendarEvent): string {
  const formatOutlookDate = (date: Date): string => {
    return date.toISOString();
  };

  // Build description with session link
  let description = event.description || '';
  if (event.sessionUrl) {
    description = `Join on Ispora: ${event.sessionUrl}\\n\\n${description}`;
  }
  
  // Add recurring info to description if applicable
  if (event.isRecurring && event.allSessionDates && event.allSessionDates.length > 1) {
    description += `\\n\\nThis is a recurring event with ${event.allSessionDates.length} total sessions.`;
  }

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    startdt: formatOutlookDate(event.startTime),
    enddt: formatOutlookDate(event.endTime),
    body: description,
    location: event.location || '',
  });
  
  // Note: Outlook web doesn't support RRULE in URL params
  // Users will need to use the .ics download for full recurring support

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/**
 * Format date to iCalendar format (YYYYMMDDTHHMMSSZ)
 */
function formatICalDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Generate a unique ID for the calendar event
 */
function generateEventId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@ispora.com`;
}

/**
 * Escape special characters for iCalendar format
 */
function escapeICalText(text: string): string {
  return text
    .replace(/\\\\/g, '\\\\\\\\')
    .replace(/;/g, '\\\\;')
    .replace(/,/g, '\\\\,')
    .replace(/\\n/g, '\\\\n');
}

/**
 * Generate RRULE from recurrence pattern
 * Converts session recurrence pattern to iCalendar RRULE format
 */
export function generateRRuleFromPattern(
  recurrencePattern: any,
  endDate: Date
): string {
  if (!recurrencePattern) return '';
  
  const parts: string[] = [];
  
  // Handle different pattern formats
  if (typeof recurrencePattern === 'string') {
    // Simple string patterns like "Every Monday", "Daily", etc.
    const pattern = recurrencePattern.toLowerCase();
    
    if (pattern.includes('daily') || pattern === 'every day') {
      parts.push('FREQ=DAILY');
    } else if (pattern.includes('weekly') || pattern.includes('every week')) {
      parts.push('FREQ=WEEKLY');
    } else if (pattern.includes('monday')) {
      parts.push('FREQ=WEEKLY');
      parts.push('BYDAY=MO');
    } else if (pattern.includes('tuesday')) {
      parts.push('FREQ=WEEKLY');
      parts.push('BYDAY=TU');
    } else if (pattern.includes('wednesday')) {
      parts.push('FREQ=WEEKLY');
      parts.push('BYDAY=WE');
    } else if (pattern.includes('thursday')) {
      parts.push('FREQ=WEEKLY');
      parts.push('BYDAY=TH');
    } else if (pattern.includes('friday')) {
      parts.push('FREQ=WEEKLY');
      parts.push('BYDAY=FR');
    } else if (pattern.includes('saturday')) {
      parts.push('FREQ=WEEKLY');
      parts.push('BYDAY=SA');
    } else if (pattern.includes('sunday')) {
      parts.push('FREQ=WEEKLY');
      parts.push('BYDAY=SU');
    } else {
      // Default to weekly if we can't parse
      parts.push('FREQ=WEEKLY');
    }
  } else if (typeof recurrencePattern === 'object' && recurrencePattern.days) {
    // Object format with days array
    const days = recurrencePattern.days;
    
    if (days.includes('daily')) {
      parts.push('FREQ=DAILY');
    } else {
      parts.push('FREQ=WEEKLY');
      
      // Map day names to iCalendar BYDAY format
      const dayMap: { [key: string]: string } = {
        'monday': 'MO',
        'tuesday': 'TU',
        'wednesday': 'WE',
        'thursday': 'TH',
        'friday': 'FR',
        'saturday': 'SA',
        'sunday': 'SU'
      };
      
      const byDays = days
        .map((day: string) => dayMap[day.toLowerCase()])
        .filter((d: string | undefined) => d !== undefined);
      
      if (byDays.length > 0) {
        parts.push(`BYDAY=${byDays.join(',')}`);
      }
    }
  } else {
    // Fallback to weekly
    parts.push('FREQ=WEEKLY');
  }
  
  // Add end date (UNTIL)
  if (endDate) {
    parts.push(`UNTIL=${formatICalDate(endDate)}`);
  }
  
  return parts.join(';');
}

/**
 * Generate iCalendar (.ics) file content
 */
export function generateICalendarFile(event: CalendarEvent): string {
  const now = new Date();
  const startDate = formatICalDate(event.startTime);
  const endDate = formatICalDate(event.endTime);
  const timestamp = formatICalDate(now);
  const eventId = generateEventId();
  
  // Build the description with additional info
  let description = '';
  
  // Add session link at the top if available
  if (event.sessionUrl) {
    description += `Join on Ispora: ${event.sessionUrl}\\n\\n`;
  }
  
  description += event.description || '';
  
  if (event.location) {
    description += `\\n\\nLocation: ${event.location}`;
  }
  if (event.isRecurring) {
    description += `\\n\\nThis is a recurring event. See your calendar for all scheduled sessions.`;
  }
  description += '\\n\\nPowered by Ispora - Connecting African Diaspora Mentors with Nigerian Students';
  
  // Build the organizer line
  const organizerLine = event.organizerEmail 
    ? `ORGANIZER;CN=${escapeICalText(event.organizerName || 'Ispora')}:mailto:${event.organizerEmail}`
    : '';
  
  // Build recurrence rule line if this is a recurring event
  const recurrenceLine = event.isRecurring && event.recurrenceRule 
    ? `RRULE:${event.recurrenceRule}`
    : '';
  
  // Generate the .ics content
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Ispora//Mentorship Platform//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${eventId}`,
    `DTSTAMP:${timestamp}`,
    `DTSTART:${startDate}`,
    `DTEND:${endDate}`,
    `SUMMARY:${escapeICalText(event.title)}`,
    `DESCRIPTION:${escapeICalText(description)}`,
    event.location ? `LOCATION:${escapeICalText(event.location)}` : '',
    organizerLine,
    recurrenceLine,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'BEGIN:VALARM',
    'TRIGGER:-PT15M', // 15 minutes before
    'ACTION:DISPLAY',
    `DESCRIPTION:Reminder: ${escapeICalText(event.title)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(line => line !== '').join('\r\n');
  
  return icsContent;
}

/**
 * Download iCalendar file
 */
export function downloadICalendarFile(event: CalendarEvent): void {
  const icsContent = generateICalendarFile(event);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  
  // Create a temporary link and trigger download
  const link = document.createElement('a');
  link.href = url;
  
  // Generate a clean filename
  const cleanTitle = event.title
    .replace(/[^a-z0-9]/gi, '_')
    .toLowerCase()
    .substring(0, 50);
  link.download = `ispora_${cleanTitle}.ics`;
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Create "Add to Calendar" button helper
 * Returns a function that can be called onClick
 */
export function createAddToCalendarHandler(event: CalendarEvent): () => void {
  return () => {
    try {
      downloadICalendarFile(event);
    } catch (error) {
      console.error('Failed to add event to calendar:', error);
      alert('Failed to create calendar event. Please try again.');
    }
  };
}

/**
 * Session-specific helper - converts session data to calendar event
 */
export interface SessionData {
  title: string;
  date: string; // ISO string or parseable date
  time: string; // "HH:MM" format
  duration?: number; // in minutes, default 60
  meetingLink?: string;
  mentorName?: string;
  studentName?: string;
  sessionType?: string;
}

export function addSessionToCalendar(session: SessionData): void {
  // Parse the date and time
  const [hours, minutes] = session.time.split(':').map(Number);
  const startTime = new Date(session.date);
  startTime.setHours(hours, minutes, 0, 0);
  
  // Calculate end time (default 60 minutes)
  const duration = session.duration || 60;
  const endTime = new Date(startTime.getTime() + duration * 60000);
  
  // Build description
  let description = `Mentorship session on Ispora platform`;
  if (session.sessionType) {
    description += `\\n\\nSession Type: ${session.sessionType}`;
  }
  if (session.mentorName) {
    description += `\\n\\nMentor: ${session.mentorName}`;
  }
  if (session.studentName) {
    description += `\\n\\nStudent: ${session.studentName}`;
  }
  
  // Create the calendar event
  const calendarEvent: CalendarEvent = {
    title: session.title,
    description: description,
    location: session.meetingLink || 'Online',
    startTime: startTime,
    endTime: endTime,
    organizerName: session.mentorName || 'Ispora',
    sessionUrl: session.meetingLink
  };
  
  downloadICalendarFile(calendarEvent);
}

/**
 * Community Event helper - converts community event to calendar event
 */
export interface CommunityEventData {
  title: string;
  description?: string;
  date: string; // ISO string
  time: string; // "HH:MM" format
  duration?: number; // in minutes, default 120
  location?: string;
  organizerName?: string;
}

export function addCommunityEventToCalendar(event: CommunityEventData): void {
  // Parse the date and time
  const [hours, minutes] = event.time.split(':').map(Number);
  const startTime = new Date(event.date);
  startTime.setHours(hours, minutes, 0, 0);
  
  // Calculate end time (default 120 minutes for community events)
  const duration = event.duration || 120;
  const endTime = new Date(startTime.getTime() + duration * 60000);
  
  // Create the calendar event
  const calendarEvent: CalendarEvent = {
    title: event.title,
    description: event.description || 'Community event on Ispora',
    location: event.location || 'Ispora Community',
    startTime: startTime,
    endTime: endTime,
    organizerName: event.organizerName || 'Ispora Community',
  };
  
  downloadICalendarFile(calendarEvent);
}