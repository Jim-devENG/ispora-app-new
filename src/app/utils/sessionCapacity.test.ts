import { describe, it, expect } from 'vitest'
import {
  normalizeSessionCapacity,
  normalizeRegisteredCount,
  getSessionCapacityState,
} from './sessionCapacity'

describe('normalizeSessionCapacity', () => {
  it('returns "unlimited" for empty string', () => {
    expect(normalizeSessionCapacity('')).toBe('unlimited')
  })

  it('returns "unlimited" for whitespace-only string', () => {
    expect(normalizeSessionCapacity('  ')).toBe('unlimited')
  })

  it('returns "unlimited" for the word "unlimited" (case-insensitive)', () => {
    expect(normalizeSessionCapacity('unlimited')).toBe('unlimited')
    expect(normalizeSessionCapacity('UNLIMITED')).toBe('unlimited')
    expect(normalizeSessionCapacity(' Unlimited ')).toBe('unlimited')
  })

  it('returns "unlimited" for "infinite" and "none"', () => {
    expect(normalizeSessionCapacity('infinite')).toBe('unlimited')
    expect(normalizeSessionCapacity('none')).toBe('unlimited')
  })

  it('returns a number for valid positive numeric strings', () => {
    expect(normalizeSessionCapacity('10')).toBe(10)
    expect(normalizeSessionCapacity('1')).toBe(1)
    expect(normalizeSessionCapacity('100')).toBe(100)
  })

  it('floors decimal values', () => {
    expect(normalizeSessionCapacity(5.7)).toBe(5)
    expect(normalizeSessionCapacity('3.9')).toBe(3)
  })

  it('returns a number for positive number input', () => {
    expect(normalizeSessionCapacity(25)).toBe(25)
  })

  it('returns "unlimited" for zero', () => {
    expect(normalizeSessionCapacity(0)).toBe('unlimited')
  })

  it('returns "unlimited" for negative numbers', () => {
    expect(normalizeSessionCapacity(-5)).toBe('unlimited')
  })

  it('returns "unlimited" for NaN-producing values', () => {
    expect(normalizeSessionCapacity('abc')).toBe('unlimited')
  })

  it('returns "unlimited" for null and undefined', () => {
    expect(normalizeSessionCapacity(null)).toBe('unlimited')
    expect(normalizeSessionCapacity(undefined)).toBe('unlimited')
  })
})

describe('normalizeRegisteredCount', () => {
  it('returns 0 for null/undefined', () => {
    expect(normalizeRegisteredCount(null)).toBe(0)
    expect(normalizeRegisteredCount(undefined)).toBe(0)
  })

  it('returns 0 for non-numeric strings', () => {
    expect(normalizeRegisteredCount('abc')).toBe(0)
  })

  it('returns 0 for zero', () => {
    expect(normalizeRegisteredCount(0)).toBe(0)
  })

  it('returns 0 for negative numbers', () => {
    expect(normalizeRegisteredCount(-3)).toBe(0)
  })

  it('returns the number for valid positive values', () => {
    expect(normalizeRegisteredCount(5)).toBe(5)
    expect(normalizeRegisteredCount('10')).toBe(10)
  })

  it('floors decimal values', () => {
    expect(normalizeRegisteredCount(3.7)).toBe(3)
  })
})

describe('getSessionCapacityState', () => {
  it('returns unlimited state when capacity is "unlimited"', () => {
    const state = getSessionCapacityState('unlimited', 5)
    expect(state.capacity).toBe('unlimited')
    expect(state.registeredCount).toBe(5)
    expect(state.isUnlimited).toBe(true)
    expect(state.spotsLeft).toBeNull()
    expect(state.isFull).toBe(false)
  })

  it('calculates spots left correctly for numeric capacity', () => {
    const state = getSessionCapacityState(10, 3)
    expect(state.capacity).toBe(10)
    expect(state.registeredCount).toBe(3)
    expect(state.isUnlimited).toBe(false)
    expect(state.spotsLeft).toBe(7)
    expect(state.isFull).toBe(false)
  })

  it('returns isFull when registered equals capacity', () => {
    const state = getSessionCapacityState(5, 5)
    expect(state.spotsLeft).toBe(0)
    expect(state.isFull).toBe(true)
  })

  it('clamps spotsLeft to 0 when over capacity', () => {
    const state = getSessionCapacityState(5, 8)
    expect(state.spotsLeft).toBe(0)
    expect(state.isFull).toBe(true)
  })

  it('handles raw unknown inputs gracefully', () => {
    const state = getSessionCapacityState(null, null)
    expect(state.capacity).toBe('unlimited')
    expect(state.registeredCount).toBe(0)
    expect(state.isUnlimited).toBe(true)
  })
})
