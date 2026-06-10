import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiCache, debounce, throttle, createCacheKey } from './performance'

describe('APICache', () => {
  beforeEach(() => {
    apiCache.clear()
  })

  it('stores and retrieves data', () => {
    apiCache.set('key1', { name: 'test' })
    expect(apiCache.get('key1')).toEqual({ name: 'test' })
  })

  it('returns null for missing keys', () => {
    expect(apiCache.get('nonexistent')).toBeNull()
  })

  it('returns null for expired entries', () => {
    vi.useFakeTimers()
    apiCache.set('key1', 'data', 100) // 100ms TTL

    // Advance time past the TTL so the entry is stale
    vi.advanceTimersByTime(200)
    expect(apiCache.get('key1', 100)).toBeNull()
    vi.useRealTimers()
  })

  it('returns data when within TTL', () => {
    apiCache.set('key1', 'data')
    // Default TTL is 5 minutes; reading immediately should work
    expect(apiCache.get('key1')).toBe('data')
  })

  it('deletes a specific key', () => {
    apiCache.set('key1', 'a')
    apiCache.set('key2', 'b')
    apiCache.delete('key1')
    expect(apiCache.get('key1')).toBeNull()
    expect(apiCache.get('key2')).toBe('b')
  })

  it('clears all entries', () => {
    apiCache.set('key1', 'a')
    apiCache.set('key2', 'b')
    apiCache.clear()
    expect(apiCache.get('key1')).toBeNull()
    expect(apiCache.get('key2')).toBeNull()
  })
})

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('delays function execution', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)

    debounced()
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledOnce()
  })

  it('resets the timer on subsequent calls', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)

    debounced()
    vi.advanceTimersByTime(50)
    debounced() // reset timer
    vi.advanceTimersByTime(50)
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(50)
    expect(fn).toHaveBeenCalledOnce()
  })

  it('passes arguments to the underlying function', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)

    debounced('a', 'b')
    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledWith('a', 'b')
  })

  it('only calls function once for rapid successive calls', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)

    debounced()
    debounced()
    debounced()
    debounced()

    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledOnce()
  })
})

describe('throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('executes the function immediately on first call', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 100)

    throttled()
    expect(fn).toHaveBeenCalledOnce()
  })

  it('ignores calls within the throttle window', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 100)

    throttled()
    throttled()
    throttled()

    expect(fn).toHaveBeenCalledOnce()
  })

  it('allows a new call after the throttle period', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 100)

    throttled()
    vi.advanceTimersByTime(100)
    throttled()

    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('passes arguments to the underlying function', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 100)

    throttled('x', 'y')
    expect(fn).toHaveBeenCalledWith('x', 'y')
  })
})

describe('createCacheKey', () => {
  it('returns endpoint alone when no params', () => {
    expect(createCacheKey('/api/users')).toBe('/api/users')
    expect(createCacheKey('/api/users', undefined)).toBe('/api/users')
  })

  it('appends sorted params', () => {
    const key = createCacheKey('/api/users', { page: 1, sort: 'name' })
    expect(key).toBe('/api/users?page=1&sort=name')
  })

  it('sorts params alphabetically', () => {
    const key = createCacheKey('/api/data', { z: 3, a: 1, m: 2 })
    expect(key).toBe('/api/data?a=1&m=2&z=3')
  })

  it('handles empty params object', () => {
    const key = createCacheKey('/api/data', {})
    expect(key).toBe('/api/data?')
  })
})
