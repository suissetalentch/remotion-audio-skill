import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { withRetry, createRetryWrapper } from '../../../src/client/retry';
import { APIError, RateLimitError } from '../../../src/types';

describe('withRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return result on first success', async () => {
    const fn = vi.fn().mockResolvedValue('success');

    const result = await withRetry(fn);

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on retryable error and succeed', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new APIError('Server error', 500))
      .mockResolvedValueOnce('success');

    const resultPromise = withRetry(fn);
    await vi.advanceTimersByTimeAsync(2000);
    const result = await resultPromise;

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should retry on rate limit error', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new RateLimitError(1000))
      .mockResolvedValueOnce('success');

    const resultPromise = withRetry(fn);
    await vi.advanceTimersByTimeAsync(2000);
    const result = await resultPromise;

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should not retry on non-retryable error', async () => {
    const fn = vi.fn().mockRejectedValue(new APIError('Bad request', 400));

    await expect(withRetry(fn)).rejects.toThrow(APIError);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should throw after max retries', async () => {
    const error = new APIError('Server error', 500);
    const fn = vi.fn().mockRejectedValue(error);

    // Use try/catch to properly handle the rejection
    let caughtError: Error | null = null;
    const resultPromise = withRetry(fn, { maxRetries: 2 }).catch((e) => {
      caughtError = e;
    });

    // Advance through all retry delays
    await vi.advanceTimersByTimeAsync(100000);
    await resultPromise;

    expect(caughtError).toBeInstanceOf(APIError);
    expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });

  it('should use exponential backoff', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new APIError('Error', 500))
      .mockRejectedValueOnce(new APIError('Error', 500))
      .mockResolvedValueOnce('success');

    const resultPromise = withRetry(fn, { baseDelay: 100, maxRetries: 3 });

    // First retry after ~100ms
    expect(fn).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(150);
    expect(fn).toHaveBeenCalledTimes(2);

    // Second retry after ~200ms (exponential)
    await vi.advanceTimersByTimeAsync(300);
    expect(fn).toHaveBeenCalledTimes(3);

    const result = await resultPromise;
    expect(result).toBe('success');
  });

  it('should respect maxDelay option', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new APIError('Error', 500))
      .mockRejectedValueOnce(new APIError('Error', 500))
      .mockRejectedValueOnce(new APIError('Error', 500))
      .mockResolvedValueOnce('success');

    const resultPromise = withRetry(fn, {
      baseDelay: 1000,
      maxDelay: 1500,
      maxRetries: 4,
    });

    // Even with exponential backoff, delay should not exceed maxDelay
    await vi.advanceTimersByTimeAsync(10000);

    const result = await resultPromise;
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(4);
  });
});

describe('createRetryWrapper', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create a reusable retry wrapper', async () => {
    const retry = createRetryWrapper({ maxRetries: 1 });
    const fn = vi.fn().mockResolvedValue('result');

    const result = await retry(fn);

    expect(result).toBe('result');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should use configured options', async () => {
    const retry = createRetryWrapper({ maxRetries: 1 });
    const fn = vi.fn().mockRejectedValue(new APIError('Error', 500));

    // Use try/catch to properly handle the rejection
    let caughtError: Error | null = null;
    const resultPromise = retry(fn).catch((e) => {
      caughtError = e;
    });

    await vi.advanceTimersByTimeAsync(10000);
    await resultPromise;

    expect(caughtError).toBeInstanceOf(APIError);
    expect(fn).toHaveBeenCalledTimes(2); // Initial + 1 retry
  });
});
