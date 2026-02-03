import { useState, useEffect } from 'react';
import { delayRender, continueRender } from 'remotion';
import { getMusicService } from '../services';
import { getBrowserCache } from '../cache/browser-cache';
import { computeMusicCacheKey } from '../utils';
import { UseBackgroundMusicResult } from '../types';

export interface UseBackgroundMusicOptions {
  prompt: string;
  durationSeconds?: number;
  promptInfluence?: number;
}

/**
 * Hook to generate background music with caching
 */
export function useBackgroundMusic(
  options: UseBackgroundMusicOptions
): UseBackgroundMusicResult {
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { prompt, durationSeconds = 30, promptInfluence = 0.5 } = options;

  useEffect(() => {
    if (!prompt) {
      setIsLoading(false);
      return;
    }

    let handle: number | null = null;
    let cancelled = false;

    async function generateMusic() {
      try {
        handle = delayRender('Generating background music');
        setIsLoading(true);
        setError(null);

        const musicService = getMusicService();
        const cache = getBrowserCache();

        // Check cache first (memory-only in browser)
        const cacheKey = computeMusicCacheKey(prompt, durationSeconds, promptInfluence);
        let audioBuffer: ArrayBuffer | null = await cache.get(cacheKey);

        if (!audioBuffer) {
          // Generate new music
          const response = await musicService.generateMusic(prompt, {
            durationSeconds,
            promptInfluence,
          });
          audioBuffer = response.audio;

          // Cache the result (memory-only in browser)
          await cache.set(cacheKey, audioBuffer);
        }

        if (cancelled) return;

        // Create blob URL
        const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        setAudioSrc(url);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
        if (handle !== null) {
          continueRender(handle);
        }
      }
    }

    generateMusic();

    return () => {
      cancelled = true;
    };
  }, [prompt, durationSeconds, promptInfluence]);

  return { audioSrc, isLoading, error };
}
