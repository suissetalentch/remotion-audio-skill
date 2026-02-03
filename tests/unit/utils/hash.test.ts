import { describe, it, expect } from 'vitest';
import {
  sha256,
  computeCacheKey,
  computeTTSCacheKey,
  computeMusicCacheKey,
  computeSFXCacheKey,
} from '../../../src/utils/hash';

describe('hash utilities', () => {
  describe('sha256', () => {
    it('should generate consistent hash for same input', () => {
      const hash1 = sha256('hello');
      const hash2 = sha256('hello');
      expect(hash1).toBe(hash2);
    });

    it('should generate different hash for different input', () => {
      const hash1 = sha256('hello');
      const hash2 = sha256('world');
      expect(hash1).not.toBe(hash2);
    });

    it('should generate 64-character hex string', () => {
      const hash = sha256('test');
      expect(hash).toHaveLength(64);
      expect(/^[a-f0-9]+$/.test(hash)).toBe(true);
    });
  });

  describe('computeCacheKey', () => {
    it('should generate consistent key for same params', () => {
      const key1 = computeCacheKey('tts', { text: 'hello', voiceId: 'aria' });
      const key2 = computeCacheKey('tts', { text: 'hello', voiceId: 'aria' });
      expect(key1).toBe(key2);
    });

    it('should generate same key regardless of param order', () => {
      const key1 = computeCacheKey('tts', { text: 'hello', voiceId: 'aria' });
      const key2 = computeCacheKey('tts', { voiceId: 'aria', text: 'hello' });
      expect(key1).toBe(key2);
    });

    it('should generate different key for different type', () => {
      const key1 = computeCacheKey('tts', { prompt: 'hello' });
      const key2 = computeCacheKey('sfx', { prompt: 'hello' });
      expect(key1).not.toBe(key2);
    });

    it('should ignore undefined values', () => {
      const key1 = computeCacheKey('tts', { text: 'hello', language: undefined });
      const key2 = computeCacheKey('tts', { text: 'hello' });
      expect(key1).toBe(key2);
    });
  });

  describe('computeTTSCacheKey', () => {
    it('should generate key for TTS request', () => {
      const key = computeTTSCacheKey('Hello', 'aria', 'eleven_multilingual_v2');
      expect(key).toHaveLength(64);
    });

    it('should include all params in key', () => {
      const key1 = computeTTSCacheKey('Hello', 'aria', 'model1', 'en');
      const key2 = computeTTSCacheKey('Hello', 'aria', 'model1', 'fr');
      expect(key1).not.toBe(key2);
    });
  });

  describe('computeMusicCacheKey', () => {
    it('should generate key for music request', () => {
      const key = computeMusicCacheKey('lo-fi beats', 30);
      expect(key).toHaveLength(64);
    });

    it('should differentiate by duration', () => {
      const key1 = computeMusicCacheKey('lo-fi beats', 30);
      const key2 = computeMusicCacheKey('lo-fi beats', 60);
      expect(key1).not.toBe(key2);
    });
  });

  describe('computeSFXCacheKey', () => {
    it('should generate key for SFX request', () => {
      const key = computeSFXCacheKey('whoosh');
      expect(key).toHaveLength(64);
    });

    it('should differentiate by duration', () => {
      const key1 = computeSFXCacheKey('whoosh', 1);
      const key2 = computeSFXCacheKey('whoosh', 2);
      expect(key1).not.toBe(key2);
    });
  });
});
