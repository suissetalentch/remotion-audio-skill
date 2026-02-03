import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { CacheManager, resetCacheManager } from '../../../src/cache/cache-manager';
import { configureAudioSkill, resetConfig } from '../../../src/config';
import { createMockAudioBuffer } from '../../setup';

const TEST_CACHE_DIR = '/tmp/remotion-audio-skill-test-cache';

describe('CacheManager', () => {
  let cacheManager: CacheManager;

  beforeEach(() => {
    resetConfig();
    resetCacheManager();
    configureAudioSkill({
      apiKey: 'test-key',
      cacheDir: TEST_CACHE_DIR,
      cacheTTL: 1, // 1 day
    });
    cacheManager = new CacheManager({ cacheDir: TEST_CACHE_DIR, ttlDays: 1 });
  });

  afterEach(() => {
    // Clean up test cache directory
    if (fs.existsSync(TEST_CACHE_DIR)) {
      const files = fs.readdirSync(TEST_CACHE_DIR);
      for (const file of files) {
        fs.unlinkSync(path.join(TEST_CACHE_DIR, file));
      }
      fs.rmdirSync(TEST_CACHE_DIR);
    }
  });

  describe('get/set', () => {
    it('should store and retrieve data from L1 cache', async () => {
      const data = createMockAudioBuffer(1024);
      await cacheManager.set('test-key', data);

      const result = await cacheManager.get('test-key');
      expect(result).not.toBeNull();
      expect(result!.byteLength).toBe(1024);
    });

    it('should store data in L2 (disk) cache', async () => {
      const data = createMockAudioBuffer(512);
      await cacheManager.set('disk-key', data);

      // Verify files exist on disk
      const cacheFile = path.join(TEST_CACHE_DIR, 'disk-key.cache');
      const metaFile = path.join(TEST_CACHE_DIR, 'disk-key.meta.json');

      expect(fs.existsSync(cacheFile)).toBe(true);
      expect(fs.existsSync(metaFile)).toBe(true);
    });

    it('should return null for non-existent key', async () => {
      const result = await cacheManager.get('non-existent');
      expect(result).toBeNull();
    });

    it('should promote L2 entry to L1 on read', async () => {
      const data = createMockAudioBuffer(256);
      await cacheManager.set('promote-key', data);

      // Create new cache manager instance (clears L1)
      const newManager = new CacheManager({ cacheDir: TEST_CACHE_DIR, ttlDays: 1 });

      // Should still get data from L2
      const result = await newManager.get('promote-key');
      expect(result).not.toBeNull();
    });
  });

  describe('has', () => {
    it('should return true for existing key', async () => {
      await cacheManager.set('exists-key', createMockAudioBuffer(128));
      const exists = await cacheManager.has('exists-key');
      expect(exists).toBe(true);
    });

    it('should return false for non-existent key', async () => {
      const exists = await cacheManager.has('not-exists');
      expect(exists).toBe(false);
    });
  });

  describe('delete', () => {
    it('should remove entry from both L1 and L2', async () => {
      await cacheManager.set('delete-key', createMockAudioBuffer(128));
      await cacheManager.delete('delete-key');

      const result = await cacheManager.get('delete-key');
      expect(result).toBeNull();

      const cacheFile = path.join(TEST_CACHE_DIR, 'delete-key.cache');
      expect(fs.existsSync(cacheFile)).toBe(false);
    });
  });

  describe('clear', () => {
    it('should remove all entries', async () => {
      await cacheManager.set('key1', createMockAudioBuffer(128));
      await cacheManager.set('key2', createMockAudioBuffer(128));

      await cacheManager.clear();

      expect(await cacheManager.get('key1')).toBeNull();
      expect(await cacheManager.get('key2')).toBeNull();
    });
  });

  describe('purgeExpired', () => {
    it('should remove expired entries', async () => {
      // Set with very short TTL
      await cacheManager.set('expired-key', createMockAudioBuffer(128), {
        ttl: 1, // 1ms
      });

      // Wait for expiry
      await new Promise(resolve => setTimeout(resolve, 10));

      const purged = await cacheManager.purgeExpired();
      expect(purged).toBeGreaterThan(0);

      const result = await cacheManager.get('expired-key');
      expect(result).toBeNull();
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', async () => {
      await cacheManager.set('stat1', createMockAudioBuffer(1024));
      await cacheManager.set('stat2', createMockAudioBuffer(2048));

      const stats = await cacheManager.getStats();

      expect(stats.l1Size).toBe(2);
      expect(stats.l2Size).toBe(2);
      expect(stats.totalSizeBytes).toBeGreaterThan(0);
    });
  });
});
