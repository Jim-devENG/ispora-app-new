import { describe, it, expect } from 'vitest'
import {
  generateGoogleCalendarUrl,
  generateOutlookCalendarUrl,
  generateRRuleFromPattern,
  generateICalendarFile,
} from './calendar'

const baseEvent = {
  title: 'Mentorship Session',
  description: 'Weekly session with mentor',
  location: 'Zoom',
  startTime: new Date('2025-03-15T14:00:00Z'),
  endTime: new Date('2025-03-15T15:00:00Z'),
}

describe('generateGoogleCalendarUrl', () => {
  it('returns a Google Calendar URL with correct base', () => {
    const url = generateGoogleCalendarUrl(baseEvent)
    expect(url).toContain('https://calendar.google.com/calendar/render')
  })

  it('includes the event title in the URL', () => {
    const url = generateGoogleCalendarUrl(baseEvent)
    expect(url).toContain('Mentorship+Session')
  })

  it('formats dates in the expected compact format', () => {
    const url = generateGoogleCalendarUrl(baseEvent)
    // Should contain YYYYMMDDTHHMMSSZ format
    expect(url).toContain('20250315T140000Z')
    expect(url).toContain('20250315T150000Z')
  })

  it('includes session URL in description when provided', () => {
    const url = generateGoogleCalendarUrl({
      ...baseEvent,
      sessionUrl: 'https://ispora.app/session/123',
    })
    expect(url).toContain('ispora.app')
  })

  it('adds recurrence rule when event is recurring', () => {
    const url = generateGoogleCalendarUrl({
      ...baseEvent,
      isRecurring: true,
      recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO',
    })
    expect(url).toContain('RRULE')
  })
})

describe('generateOutlookCalendarUrl', () => {
  it('returns an Outlook calendar URL with correct base', () => {
    const url = generateOutlookCalendarUrl(baseEvent)
    expect(url).toContain('https://outlook.live.com/calendar')
  })

  it('includes the event subject', () => {
    const url = generateOutlookCalendarUrl(baseEvent)
    expect(url).toContain('Mentorship+Session')
  })

  it('includes ISO date format', () => {
    const url = generateOutlookCalendarUrl(baseEvent)
    expect(url).toContain('2025-03-15')
  })
})

describe('generateRRuleFromPattern', () => {
  const endDate = new Date('2025-06-15T00:00:00Z')

  it('returns empty string for null/undefined pattern', () => {
    expect(generateRRuleFromPattern(null, endDate)).toBe('')
    expect(generateRRuleFromPattern(undefined, endDate)).toBe('')
  })

  it('generates FREQ=DAILY for "daily" string', () => {
    const rule = generateRRuleFromPattern('daily', endDate)
    expect(rule).toContain('FREQ=DAILY')
  })

  it('generates FREQ=WEEKLY for "weekly" string', () => {
    const rule = generateRRuleFromPattern('weekly', endDate)
    expect(rule).toContain('FREQ=WEEKLY')
  })

  it('maps day names to BYDAY codes', () => {
    expect(generateRRuleFromPattern('Every Monday', endDate)).toContain('BYDAY=MO')
    expect(generateRRuleFromPattern('Every Tuesday', endDate)).toContain('BYDAY=TU')
    expect(generateRRuleFromPattern('Every Wednesday', endDate)).toContain('BYDAY=WE')
    expect(generateRRuleFromPattern('Every Thursday', endDate)).toContain('BYDAY=TH')
    expect(generateRRuleFromPattern('Every Friday', endDate)).toContain('BYDAY=FR')
    expect(generateRRuleFromPattern('Every Saturday', endDate)).toContain('BYDAY=SA')
    expect(generateRRuleFromPattern('Every Sunday', endDate)).toContain('BYDAY=SU')
  })

  it('defaults to FREQ=WEEKLY for unrecognized string pattern', () => {
    const rule = generateRRuleFromPattern('something random', endDate)
    expect(rule).toContain('FREQ=WEEKLY')
  })

  it('includes UNTIL date', () => {
    const rule = generateRRuleFromPattern('weekly', endDate)
    expect(rule).toContain('UNTIL=20250615T000000Z')
  })

  it('handles object pattern with days array', () => {
    const rule = generateRRuleFromPattern({ days: ['monday', 'wednesday'] }, endDate)
    expect(rule).toContain('FREQ=WEEKLY')
    expect(rule).toContain('BYDAY=MO,WE')
  })

  it('handles object pattern with daily in days array', () => {
    const rule = generateRRuleFromPattern({ days: ['daily'] }, endDate)
    expect(rule).toContain('FREQ=DAILY')
  })
})

describe('generateICalendarFile', () => {
  it('generates valid iCalendar format', () => {
    const ics = generateICalendarFile(baseEvent)
    expect(ics).toContain('BEGIN:VCALENDAR')
    expect(ics).toContain('END:VCALENDAR')
    expect(ics).toContain('BEGIN:VEVENT')
    expect(ics).toContain('END:VEVENT')
  })

  it('includes PRODID for Ispora', () => {
    const ics = generateICalendarFile(baseEvent)
    expect(ics).toContain('PRODID:-//Ispora//Mentorship Platform//EN')
  })

  it('includes event summary', () => {
    const ics = generateICalendarFile(baseEvent)
    expect(ics).toContain('SUMMARY:Mentorship Session')
  })

  it('includes DTSTART and DTEND', () => {
    const ics = generateICalendarFile(baseEvent)
    expect(ics).toContain('DTSTART:20250315T140000Z')
    expect(ics).toContain('DTEND:20250315T150000Z')
  })

  it('includes a 15-minute reminder alarm', () => {
    const ics = generateICalendarFile(baseEvent)
    expect(ics).toContain('TRIGGER:-PT15M')
  })

  it('includes organizer when provided', () => {
    const ics = generateICalendarFile({
      ...baseEvent,
      organizerName: 'John',
      organizerEmail: 'john@example.com',
    })
    expect(ics).toContain('ORGANIZER')
    expect(ics).toContain('john@example.com')
  })

  it('includes RRULE for recurring events', () => {
    const ics = generateICalendarFile({
      ...baseEvent,
      isRecurring: true,
      recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO',
    })
    expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=MO')
  })

  it('includes session URL in description when provided', () => {
    const ics = generateICalendarFile({
      ...baseEvent,
      sessionUrl: 'https://ispora.app/session/abc',
    })
    expect(ics).toContain('ispora.app/session/abc')
  })
})
