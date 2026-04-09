/**
 * URL Helper Utilities
 * Functions to normalize and validate URLs across the application
 */

/**
 * Normalizes a URL by ensuring it has a proper protocol (http:// or https://)
 * Examples:
 * - "paystack.com" -> "https://paystack.com"
 * - "www.paystack.com" -> "https://www.paystack.com"  
 * - "https://paystack.com" -> "https://paystack.com" (unchanged)
 * - "http://paystack.com" -> "http://paystack.com" (unchanged)
 */
export function normalizeUrl(url: string): string {
  if (!url || url.trim() === '' || url === '#') {
    return '';
  }
  
  const trimmedUrl = url.trim();
  
  // If it already has http:// or https://, return as-is
  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    return trimmedUrl;
  }
  
  // Add https:// prefix for all other cases
  return `https://${trimmedUrl}`;
}

/**
 * Validates if a URL is valid and can be opened
 * Returns true if the URL is properly formatted and has an http/https protocol
 */
export function isValidUrl(url: string): boolean {
  if (!url || url.trim() === '' || url === '#') {
    return false;
  }
  
  try {
    const normalizedUrl = normalizeUrl(url);
    const urlObj = new URL(normalizedUrl);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

/**
 * Safely opens a URL in a new tab after normalizing it
 * Returns true if successful, false if the URL is invalid
 */
export function openUrl(url: string): boolean {
  if (!isValidUrl(url)) {
    console.warn('[URL Helper] Invalid URL:', url);
    return false;
  }
  
  const normalizedUrl = normalizeUrl(url);
  window.open(normalizedUrl, '_blank', 'noopener,noreferrer');
  return true;
}
