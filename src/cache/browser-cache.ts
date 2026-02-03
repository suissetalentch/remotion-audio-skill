/**
 * Browser-safe cache using memory only (no fs dependency)
 * For use in Remotion components during render
 */
export class BrowserCache {
  private cache: Map<string, { data: ArrayBuffer; expiresAt: number }> = new Map();
  private maxSize: number;

  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  async get(key: string): Promise<ArrayBuffer | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  async set(key: string, data: ArrayBuffer, ttlMs = 3600000): Promise<void> {
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  }

  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }
}

// Singleton instance
let browserCacheInstance: BrowserCache | null = null;

export function getBrowserCache(): BrowserCache {
  if (!browserCacheInstance) {
    browserCacheInstance = new BrowserCache();
  }
  return browserCacheInstance;
}

export function resetBrowserCache(): void {
  browserCacheInstance = null;
}
