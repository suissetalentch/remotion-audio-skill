import CryptoJS from 'crypto-js';

/**
 * Generate a SHA256 hash from input
 */
export function sha256(input: string): string {
  return CryptoJS.SHA256(input).toString(CryptoJS.enc.Hex);
}

/**
 * Compute a cache key from request parameters
 */
export function computeCacheKey(
  type: 'tts' | 'music' | 'sfx' | 'stt',
  params: Record<string, unknown>
): string {
  // Sort keys for consistent hashing
  const sortedKeys = Object.keys(params).sort();
  const normalized: Record<string, unknown> = {};

  for (const key of sortedKeys) {
    const value = params[key];
    // Skip undefined values
    if (value !== undefined) {
      normalized[key] = value;
    }
  }

  const input = `${type}:${JSON.stringify(normalized)}`;
  return sha256(input);
}

/**
 * Generate a unique cache key for TTS requests
 */
export function computeTTSCacheKey(
  text: string,
  voiceId: string,
  model: string,
  language?: string,
  voiceSettings?: Record<string, unknown>
): string {
  return computeCacheKey('tts', {
    text,
    voiceId,
    model,
    language,
    voiceSettings,
  });
}

/**
 * Generate a unique cache key for music requests
 */
export function computeMusicCacheKey(
  prompt: string,
  durationSeconds: number,
  promptInfluence?: number
): string {
  return computeCacheKey('music', {
    prompt,
    durationSeconds,
    promptInfluence,
  });
}

/**
 * Generate a unique cache key for SFX requests
 */
export function computeSFXCacheKey(
  prompt: string,
  durationSeconds?: number
): string {
  return computeCacheKey('sfx', {
    prompt,
    durationSeconds,
  });
}
