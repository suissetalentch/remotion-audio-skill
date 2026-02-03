import React, { useState, useEffect } from 'react';
import { Audio, Sequence, delayRender, continueRender } from 'remotion';
import { getSFXService } from '../services';
import { getBrowserCache } from '../cache/browser-cache';
import { computeSFXCacheKey } from '../utils';
import { SoundEffectProps } from '../types';

/**
 * SoundEffect component for AI-generated sound effects
 */
export const SoundEffect: React.FC<SoundEffectProps> = ({
  prompt,
  durationSeconds = 2,
  from = 0,
  volume = 1,
}) => {
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [audioDurationFrames, setAudioDurationFrames] = useState(60); // Default 2 seconds at 30fps
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!prompt) return;

    let handle: number | null = null;
    let cancelled = false;

    async function generateSFX() {
      try {
        handle = delayRender('Generating sound effect');

        const sfxService = getSFXService();
        const cache = getBrowserCache();

        // Check cache first (memory-only in browser)
        const cacheKey = computeSFXCacheKey(prompt, durationSeconds);
        let audioBuffer: ArrayBuffer | null = await cache.get(cacheKey);

        if (!audioBuffer) {
          const response = await sfxService.generateSFX(prompt, { durationSeconds });
          audioBuffer = response.audio;
          await cache.set(cacheKey, audioBuffer);
        }

        if (cancelled) return;

        const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        setAudioSrc(url);

        // Get actual duration
        const audioEl = document.createElement('audio');
        audioEl.src = url;
        await new Promise<void>((resolve) => {
          audioEl.addEventListener('loadedmetadata', () => {
            setAudioDurationFrames(Math.ceil(audioEl.duration * 30));
            resolve();
          });
        });
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (handle !== null) {
          continueRender(handle);
        }
      }
    }

    generateSFX();

    return () => {
      cancelled = true;
    };
  }, [prompt, durationSeconds]);

  if (error) {
    console.error('SoundEffect error:', error);
    return null;
  }

  if (!audioSrc) {
    return null;
  }

  return (
    <Sequence from={from} durationInFrames={audioDurationFrames}>
      <Audio src={audioSrc} volume={volume} />
    </Sequence>
  );
};

export default SoundEffect;
