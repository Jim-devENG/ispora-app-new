/**
 * Shared avatar utilities used across the application.
 *
 * Consolidates the duplicated initials-extraction and deterministic
 * avatar-colour logic that was copy-pasted in many components.
 */

const AVATAR_COLORS = [
  '#021ff6', // brand
  '#00c896', // accent
  '#f59e0b', // warn
  '#10b981', // success
  '#ef4444', // danger
  '#7c3aed', // purple
] as const;

/**
 * Derive up to two uppercase initials from a display name.
 * Handles single-word names, empty strings, and undefined.
 *
 * @example getInitials('Korede Adeyemi') // 'KA'
 * @example getInitials('Korede')          // 'K'
 * @example getInitials(undefined)         // 'U'
 */
export function getInitials(name: string | undefined | null, fallback = 'U'): string {
  if (!name) return fallback;
  return (
    name
      .trim()
      .split(' ')
      .filter((part) => part.length > 0)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || fallback
  );
}

/**
 * Return a deterministic colour from a fixed palette based on a string id.
 * Useful for giving each user a consistent avatar background colour.
 */
export function getAvatarColor(id: string): string {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}
