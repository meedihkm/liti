/**
 * Cache configuration for different resource types
 */

export const CACHE_DURATIONS = {
  // Static assets (images, fonts, etc.)
  STATIC: 31536000, // 1 year
  
  // Product data (changes occasionally)
  PRODUCTS: 3600, // 1 hour
  
  // Gallery/Content (changes rarely)
  CONTENT: 86400, // 24 hours
  
  // Order tracking (must be fresh)
  TRACKING: 0, // no cache
  
  // Public pages
  PAGES: 300, // 5 minutes
} as const;

export function getCacheHeaders(duration: number, isPrivate = false) {
  if (duration === 0) {
    return {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    };
  }

  const visibility = isPrivate ? 'private' : 'public';
  return {
    'Cache-Control': `${visibility}, max-age=${duration}, s-maxage=${duration}, stale-while-revalidate=${duration * 2}`,
  };
}
