import * as fs from 'fs';
import * as path from 'path';
import { getConfig } from '../config';
import { CacheEntry, CacheOptions } from '../types';

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Two-level cache manager (L1: Memory, L2: Disk)
 */
export class CacheManager {
  private l1Cache: Map<string, CacheEntry<ArrayBuffer>> = new Map();
  private cacheDir: string;
  private defaultTTL: number;
  private maxL1Size: number;

  constructor(options?: { cacheDir?: string; ttlDays?: number; maxL1Size?: number }) {
    const config = getConfig();
    this.cacheDir = options?.cacheDir ?? config.cacheDir;
    this.defaultTTL = (options?.ttlDays ?? config.cacheTTL) * MILLISECONDS_PER_DAY;
    this.maxL1Size = options?.maxL1Size ?? 50; // Max 50 entries in memory
    this.ensureCacheDir();
  }

  private ensureCacheDir(): void {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  private getFilePath(key: string): string {
    return path.join(this.cacheDir, `${key}.cache`);
  }

  private getMetaPath(key: string): string {
    return path.join(this.cacheDir, `${key}.meta.json`);
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() > entry.expiresAt;
  }

  /**
   * Get item from cache (L1 first, then L2)
   */
  async get(key: string): Promise<ArrayBuffer | null> {
    // Check L1 (memory)
    const l1Entry = this.l1Cache.get(key);
    if (l1Entry) {
      if (this.isExpired(l1Entry)) {
        this.l1Cache.delete(key);
      } else {
        return l1Entry.data;
      }
    }

    // Check L2 (disk)
    const filePath = this.getFilePath(key);
    const metaPath = this.getMetaPath(key);

    if (!fs.existsSync(filePath) || !fs.existsSync(metaPath)) {
      return null;
    }

    try {
      const metaContent = fs.readFileSync(metaPath, 'utf-8');
      const meta = JSON.parse(metaContent) as Omit<CacheEntry, 'data'>;

      if (Date.now() > meta.expiresAt) {
        // Expired, clean up
        this.deleteFromDisk(key);
        return null;
      }

      const data = fs.readFileSync(filePath);
      const arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);

      // Promote to L1
      this.setL1(key, {
        data: arrayBuffer,
        createdAt: meta.createdAt,
        expiresAt: meta.expiresAt,
        metadata: meta.metadata,
      });

      return arrayBuffer;
    } catch {
      return null;
    }
  }

  /**
   * Set item in cache (both L1 and L2)
   */
  async set(
    key: string,
    data: ArrayBuffer,
    options?: CacheOptions & { metadata?: Record<string, unknown> }
  ): Promise<void> {
    const now = Date.now();
    const ttl = options?.ttl ?? this.defaultTTL;

    const entry: CacheEntry<ArrayBuffer> = {
      data,
      createdAt: now,
      expiresAt: now + ttl,
      metadata: options?.metadata,
    };

    // Set in L1
    this.setL1(key, entry);

    // Set in L2
    await this.setL2(key, entry);
  }

  private setL1(key: string, entry: CacheEntry<ArrayBuffer>): void {
    // Evict oldest entries if at capacity
    if (this.l1Cache.size >= this.maxL1Size) {
      const oldestKey = this.l1Cache.keys().next().value;
      if (oldestKey) {
        this.l1Cache.delete(oldestKey);
      }
    }

    this.l1Cache.set(key, entry);
  }

  private async setL2(key: string, entry: CacheEntry<ArrayBuffer>): Promise<void> {
    this.ensureCacheDir();

    const filePath = this.getFilePath(key);
    const metaPath = this.getMetaPath(key);

    // Write data file
    fs.writeFileSync(filePath, Buffer.from(entry.data));

    // Write metadata file
    const meta: Omit<CacheEntry, 'data'> = {
      createdAt: entry.createdAt,
      expiresAt: entry.expiresAt,
      metadata: entry.metadata,
    };
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
  }

  /**
   * Check if key exists in cache
   */
  async has(key: string): Promise<boolean> {
    // Check L1
    const l1Entry = this.l1Cache.get(key);
    if (l1Entry && !this.isExpired(l1Entry)) {
      return true;
    }

    // Check L2
    const metaPath = this.getMetaPath(key);
    if (!fs.existsSync(metaPath)) {
      return false;
    }

    try {
      const metaContent = fs.readFileSync(metaPath, 'utf-8');
      const meta = JSON.parse(metaContent) as Omit<CacheEntry, 'data'>;
      return Date.now() <= meta.expiresAt;
    } catch {
      return false;
    }
  }

  /**
   * Delete item from cache
   */
  async delete(key: string): Promise<void> {
    this.l1Cache.delete(key);
    this.deleteFromDisk(key);
  }

  private deleteFromDisk(key: string): void {
    const filePath = this.getFilePath(key);
    const metaPath = this.getMetaPath(key);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    if (fs.existsSync(metaPath)) {
      fs.unlinkSync(metaPath);
    }
  }

  /**
   * Clear all cache (L1 and L2)
   */
  async clear(): Promise<void> {
    this.l1Cache.clear();

    if (fs.existsSync(this.cacheDir)) {
      const files = fs.readdirSync(this.cacheDir);
      for (const file of files) {
        fs.unlinkSync(path.join(this.cacheDir, file));
      }
    }
  }

  /**
   * Purge expired entries from disk cache
   */
  async purgeExpired(): Promise<number> {
    let purgedCount = 0;

    // Purge L1
    for (const [key, entry] of this.l1Cache.entries()) {
      if (this.isExpired(entry)) {
        this.l1Cache.delete(key);
        purgedCount++;
      }
    }

    // Purge L2
    if (!fs.existsSync(this.cacheDir)) {
      return purgedCount;
    }

    const files = fs.readdirSync(this.cacheDir);
    const metaFiles = files.filter(f => f.endsWith('.meta.json'));

    for (const metaFile of metaFiles) {
      const metaPath = path.join(this.cacheDir, metaFile);
      try {
        const metaContent = fs.readFileSync(metaPath, 'utf-8');
        const meta = JSON.parse(metaContent) as Omit<CacheEntry, 'data'>;

        if (Date.now() > meta.expiresAt) {
          const key = metaFile.replace('.meta.json', '');
          this.deleteFromDisk(key);
          purgedCount++;
        }
      } catch {
        // If we can't read the meta file, delete both files
        const key = metaFile.replace('.meta.json', '');
        this.deleteFromDisk(key);
        purgedCount++;
      }
    }

    return purgedCount;
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    l1Size: number;
    l2Size: number;
    totalSizeBytes: number;
  }> {
    let l2Size = 0;
    let totalSizeBytes = 0;

    if (fs.existsSync(this.cacheDir)) {
      const files = fs.readdirSync(this.cacheDir);
      const cacheFiles = files.filter(f => f.endsWith('.cache'));
      l2Size = cacheFiles.length;

      for (const file of cacheFiles) {
        const stats = fs.statSync(path.join(this.cacheDir, file));
        totalSizeBytes += stats.size;
      }
    }

    return {
      l1Size: this.l1Cache.size,
      l2Size,
      totalSizeBytes,
    };
  }
}

// Singleton instance
let cacheInstance: CacheManager | null = null;

export function getCacheManager(): CacheManager {
  if (!cacheInstance) {
    cacheInstance = new CacheManager();
  }
  return cacheInstance;
}

export function resetCacheManager(): void {
  cacheInstance = null;
}
