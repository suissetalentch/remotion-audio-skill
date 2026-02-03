// Node.js cache (with fs) - only import in Node.js environment
export { CacheManager, getCacheManager, resetCacheManager } from './cache-manager';

// Browser-safe cache (memory only)
export { BrowserCache, getBrowserCache, resetBrowserCache } from './browser-cache';

/**
 * Universal cache interface
 */
export interface UniversalCache {
  get(key: string): Promise<ArrayBuffer | null>;
  set(key: string, data: ArrayBuffer, ttlMs?: number): Promise<void>;
  delete(key: string): Promise<boolean>;
  has(key: string): Promise<boolean>;
}

/**
 * Get the appropriate cache for the current environment
 * In browser (Remotion render): uses BrowserCache (memory-only)
 * In Node.js (calculateMetadata): uses CacheManager (fs-based)
 */
export function getUniversalCache(): UniversalCache {
  // Check if we're in a browser environment
  const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';

  if (isBrowser) {
    // Use browser-safe cache
    const { getBrowserCache } = require('./browser-cache');
    return getBrowserCache();
  } else {
    // Use Node.js cache with fs
    const { getCacheManager } = require('./cache-manager');
    return getCacheManager();
  }
}
