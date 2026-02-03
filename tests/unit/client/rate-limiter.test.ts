import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TokenBucketRateLimiter, createDefaultRateLimiter } from '../../../src/client/rate-limiter';
import { RateLimitError } from '../../../src/types';

describe('TokenBucketRateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  describe('acquire', () => {
    it('should allow acquiring tokens up to the limit', () => {
      const limiter = new TokenBucketRateLimiter({
        tokensPerInterval: 3,
        interval: 1000,
      });

      // Should be able to acquire 3 tokens
      expect(() => limiter.acquire()).not.toThrow();
      expect(() => limiter.acquire()).not.toThrow();
      expect(() => limiter.acquire()).not.toThrow();

      // 4th should fail
      expect(() => limiter.acquire()).toThrow(RateLimitError);
    });

    it('should refill tokens over time', () => {
      const limiter = new TokenBucketRateLimiter({
        tokensPerInterval: 2,
        interval: 1000,
      });

      // Use both tokens
      limiter.acquire();
      limiter.acquire();
      expect(() => limiter.acquire()).toThrow(RateLimitError);

      // Advance time to refill 1 token
      vi.advanceTimersByTime(500);
      expect(() => limiter.acquire()).not.toThrow();
    });

    it('should not exceed max tokens when refilling', () => {
      const limiter = new TokenBucketRateLimiter({
        tokensPerInterval: 2,
        interval: 1000,
      });

      // Wait a long time
      vi.advanceTimersByTime(10000);

      // Should still only have max tokens
      expect(limiter.getAvailableTokens()).toBe(2);
    });
  });

  describe('waitForToken', () => {
    it('should resolve immediately when tokens available', async () => {
      const limiter = new TokenBucketRateLimiter({
        tokensPerInterval: 5,
        interval: 1000,
      });

      const start = Date.now();
      await limiter.waitForToken();
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(10);
    });

    it('should wait for token refill when none available', async () => {
      const limiter = new TokenBucketRateLimiter({
        tokensPerInterval: 1,
        interval: 1000,
      });

      // Use the only token
      limiter.acquire();

      // Start waiting for next token
      const waitPromise = limiter.waitForToken();

      // Advance timers
      await vi.advanceTimersByTimeAsync(1000);
      await waitPromise;

      // Should have consumed the refilled token
      expect(limiter.getAvailableTokens()).toBe(0);
    });
  });

  describe('canAcquire', () => {
    it('should return true when tokens available', () => {
      const limiter = new TokenBucketRateLimiter({
        tokensPerInterval: 2,
        interval: 1000,
      });

      expect(limiter.canAcquire()).toBe(true);
    });

    it('should return false when no tokens available', () => {
      const limiter = new TokenBucketRateLimiter({
        tokensPerInterval: 1,
        interval: 1000,
      });

      limiter.acquire();
      expect(limiter.canAcquire()).toBe(false);
    });
  });

  describe('reset', () => {
    it('should restore all tokens', () => {
      const limiter = new TokenBucketRateLimiter({
        tokensPerInterval: 5,
        interval: 1000,
      });

      // Use some tokens
      limiter.acquire();
      limiter.acquire();
      limiter.acquire();
      expect(limiter.getAvailableTokens()).toBe(2);

      // Reset
      limiter.reset();
      expect(limiter.getAvailableTokens()).toBe(5);
    });
  });
});

describe('createDefaultRateLimiter', () => {
  it('should create a limiter with 100 requests per minute by default', () => {
    const limiter = createDefaultRateLimiter();
    expect(limiter.getAvailableTokens()).toBe(100);
  });

  it('should create a limiter with custom rate', () => {
    const limiter = createDefaultRateLimiter(50);
    expect(limiter.getAvailableTokens()).toBe(50);
  });
});
