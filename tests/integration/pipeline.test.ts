import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { configureAudioSkill, resetConfig, getConfig } from '../../src/config';
import { getCacheManager, resetCacheManager } from '../../src/cache';
import { computeTTSCacheKey, computeMusicCacheKey, computeSFXCacheKey } from '../../src/utils';

const TEST_CACHE_DIR = '/tmp/remotion-audio-skill-integration-test';

describe('Pipeline Integration', () => {
  beforeEach(() => {
    resetConfig();
    resetCacheManager();
    configureAudioSkill({
      apiKey: 'test-integration-key',
      cacheDir: TEST_CACHE_DIR,
      cacheTTL: 1,
    });
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

  describe('Configuration Flow', () => {
    it('should configure and retrieve config correctly', () => {
      const config = getConfig();

      expect(config.apiKey).toBe('test-integration-key');
      expect(config.cacheDir).toBe(TEST_CACHE_DIR);
      expect(config.cacheTTL).toBe(1);
      expect(config.defaultVoiceId).toBe('EXAVITQu4vr4xnSDxMaL');
      expect(config.defaultModel).toBe('eleven_multilingual_v2');
    });
  });

  describe('Cache Key Generation', () => {
    it('should generate consistent TTS cache keys', () => {
      const key1 = computeTTSCacheKey('Hello', 'aria', 'model1', 'en');
      const key2 = computeTTSCacheKey('Hello', 'aria', 'model1', 'en');

      expect(key1).toBe(key2);
      expect(key1).toHaveLength(64);
    });

    it('should generate different keys for different inputs', () => {
      const keyTTS = computeTTSCacheKey('Hello', 'aria', 'model1');
      const keyMusic = computeMusicCacheKey('lo-fi', 30);
      const keySFX = computeSFXCacheKey('whoosh');

      expect(keyTTS).not.toBe(keyMusic);
      expect(keyMusic).not.toBe(keySFX);
      expect(keyTTS).not.toBe(keySFX);
    });
  });

  describe('Cache Persistence', () => {
    it('should persist cache entries to disk', async () => {
      const cacheManager = getCacheManager();
      const testData = new ArrayBuffer(256);
      const view = new Uint8Array(testData);
      for (let i = 0; i < 256; i++) {
        view[i] = i % 256;
      }

      await cacheManager.set('persistence-test', testData);

      // Verify file exists on disk
      const cacheFile = path.join(TEST_CACHE_DIR, 'persistence-test.cache');
      const metaFile = path.join(TEST_CACHE_DIR, 'persistence-test.meta.json');

      expect(fs.existsSync(cacheFile)).toBe(true);
      expect(fs.existsSync(metaFile)).toBe(true);

      // Verify metadata
      const meta = JSON.parse(fs.readFileSync(metaFile, 'utf-8'));
      expect(meta.createdAt).toBeDefined();
      expect(meta.expiresAt).toBeDefined();
      expect(meta.expiresAt).toBeGreaterThan(meta.createdAt);
    });

    it('should retrieve cached entries after manager reset', async () => {
      const cacheManager1 = getCacheManager();
      const testData = new ArrayBuffer(128);
      const view = new Uint8Array(testData);
      view[0] = 42;
      view[127] = 24;

      await cacheManager1.set('reset-test', testData);

      // Reset and get new manager
      resetCacheManager();
      const cacheManager2 = getCacheManager();

      // Should still retrieve from disk
      const retrieved = await cacheManager2.get('reset-test');
      expect(retrieved).not.toBeNull();
      expect(retrieved!.byteLength).toBe(128);

      const retrievedView = new Uint8Array(retrieved!);
      expect(retrievedView[0]).toBe(42);
      expect(retrievedView[127]).toBe(24);
    });
  });
});
