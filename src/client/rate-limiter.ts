import { RateLimiterOptions, RateLimitError } from '../types';

/**
 * Token bucket rate limiter for API calls
 */
export class TokenBucketRateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number; // tokens per millisecond

  constructor(options: RateLimiterOptions) {
    this.maxTokens = options.tokensPerInterval;
    this.tokens = this.maxTokens;
    this.refillRate = options.tokensPerInterval / options.interval;
    this.lastRefill = Date.now();
  }

  /**
   * Refill tokens based on elapsed time
   */
  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const tokensToAdd = elapsed * this.refillRate;

    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  /**
   * Try to acquire a token. Throws RateLimitError if not available.
   */
  acquire(): void {
    this.refill();

    if (this.tokens < 1) {
      const waitTime = Math.ceil((1 - this.tokens) / this.refillRate);
      throw new RateLimitError(waitTime);
    }

    this.tokens -= 1;
  }

  /**
   * Wait until a token is available
   */
  async waitForToken(): Promise<void> {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }

    const waitTime = Math.ceil((1 - this.tokens) / this.refillRate);
    await new Promise(resolve => setTimeout(resolve, waitTime));

    this.refill();
    this.tokens -= 1;
  }

  /**
   * Check if a token is available without consuming it
   */
  canAcquire(): boolean {
    this.refill();
    return this.tokens >= 1;
  }

  /**
   * Get current available tokens
   */
  getAvailableTokens(): number {
    this.refill();
    return Math.floor(this.tokens);
  }

  /**
   * Reset the rate limiter
   */
  reset(): void {
    this.tokens = this.maxTokens;
    this.lastRefill = Date.now();
  }
}

/**
 * Create a rate limiter with default settings for ElevenLabs API
 */
export function createDefaultRateLimiter(requestsPerMinute: number = 100): TokenBucketRateLimiter {
  return new TokenBucketRateLimiter({
    tokensPerInterval: requestsPerMinute,
    interval: 60 * 1000, // 1 minute in milliseconds
  });
}
