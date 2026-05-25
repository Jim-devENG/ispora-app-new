export type SessionCapacity = number | 'unlimited';

function toPositiveInteger(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return Math.floor(parsed);
}

export function normalizeSessionCapacity(value: unknown): SessionCapacity {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (!normalized || normalized === 'unlimited' || normalized === 'infinite' || normalized === 'none') {
      return 'unlimited';
    }
  }

  const numericCapacity = toPositiveInteger(value);
  return numericCapacity ?? 'unlimited';
}

export function normalizeRegisteredCount(value: unknown): number {
  return toPositiveInteger(value) ?? 0;
}

export function getSessionCapacityState(capacity: unknown, registeredCount: unknown) {
  const normalizedCapacity = normalizeSessionCapacity(capacity);
  const normalizedRegisteredCount = normalizeRegisteredCount(registeredCount);
  const isUnlimited = normalizedCapacity === 'unlimited';
  const spotsLeft = isUnlimited ? null : Math.max(0, normalizedCapacity - normalizedRegisteredCount);
  const isFull = !isUnlimited && spotsLeft === 0;

  return {
    capacity: normalizedCapacity,
    registeredCount: normalizedRegisteredCount,
    isUnlimited,
    spotsLeft,
    isFull,
  };
}
