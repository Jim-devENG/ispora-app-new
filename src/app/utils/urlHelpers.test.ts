import { describe, it, expect } from 'vitest'
import { normalizeUrl, isValidUrl } from './urlHelpers'

describe('normalizeUrl', () => {
  it('returns empty string for empty/falsy input', () => {
    expect(normalizeUrl('')).toBe('')
    expect(normalizeUrl('   ')).toBe('')
    expect(normalizeUrl('#')).toBe('')
  })

  it('adds https:// when no protocol is present', () => {
    expect(normalizeUrl('paystack.com')).toBe('https://paystack.com')
    expect(normalizeUrl('www.paystack.com')).toBe('https://www.paystack.com')
    expect(normalizeUrl('example.com/path')).toBe('https://example.com/path')
  })

  it('preserves existing https://', () => {
    expect(normalizeUrl('https://paystack.com')).toBe('https://paystack.com')
  })

  it('preserves existing http://', () => {
    expect(normalizeUrl('http://paystack.com')).toBe('http://paystack.com')
  })

  it('trims whitespace', () => {
    expect(normalizeUrl('  paystack.com  ')).toBe('https://paystack.com')
  })
})

describe('isValidUrl', () => {
  it('returns false for empty/falsy input', () => {
    expect(isValidUrl('')).toBe(false)
    expect(isValidUrl('   ')).toBe(false)
    expect(isValidUrl('#')).toBe(false)
  })

  it('returns true for valid URLs with protocol', () => {
    expect(isValidUrl('https://example.com')).toBe(true)
    expect(isValidUrl('http://example.com')).toBe(true)
  })

  it('returns true for valid URLs without protocol (normalizeUrl adds it)', () => {
    expect(isValidUrl('example.com')).toBe(true)
    expect(isValidUrl('www.google.com')).toBe(true)
  })

  it('returns true for URLs with paths and query params', () => {
    expect(isValidUrl('https://example.com/path?q=1')).toBe(true)
  })

  it('returns false for completely invalid URLs', () => {
    // After prepending https://, "https://" alone is invalid
    expect(isValidUrl('://')).toBe(false)
  })
})
