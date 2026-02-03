import { RetryOptions, APIError, RateLimitError } from '../types';

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(attempt: number, options: RetryOptions): number {
  const exponentialDelay = options.baseDelay * Math.pow(2, attempt);
  const jitter = Math.random() * 0.3 * exponentialDelay; // 0-30% jitter
  return Math.min(exponentialDelay + jitter, options.maxDelay);
}

/**
 * Check if an error is retryable
 */
function isRetryable(error: unknown, options: RetryOptions): boolean {
  if (error instanceof RateLimitError) {
    return true;
  }

  if (error instanceof APIError) {
    return options.retryableStatusCodes?.includes(error.statusCode ?? 0) ?? false;
  }

  // Retry on network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }

  return false;
}

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wrap an async function with retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt >= opts.maxRetries) {
        break;
      }

      if (!isRetryable(error, opts)) {
        throw error;
      }

      const delay = calculateDelay(attempt, opts);
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Create a retry wrapper with pre-configured options
 */
export function createRetryWrapper(options: Partial<RetryOptions> = {}) {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  return <T>(fn: () => Promise<T>) => withRetry(fn, opts);
}
