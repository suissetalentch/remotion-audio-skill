import { useState, useEffect } from 'react';
import { delayRender, continueRender, useVideoConfig } from 'remotion';
import { getTTSService } from '../services';
import { getSTTService } from '../services';
import { getBrowserCache } from '../cache/browser-cache';
import { computeTTSCacheKey } from '../utils';
import { getConfig } from '../config';
import { UseVoiceOverResult, VoiceSettings, STTWord } from '../types';

export interface UseVoiceOverOptions {
  text: string;
  voiceId?: string;
  model?: string;
  voiceSettings?: VoiceSettings;
  language?: string;
  transcribe?: boolean;
  /** Seed for reproducible generation */
  seed?: number;
  /** Previous text for continuity between segments */
  previousText?: string;
  /** Next text for continuity between segments */
  nextText?: string;
}

/**
 * Hook to generate voice-over audio with caching and transcription
 */
export function useVoiceOver(options: UseVoiceOverOptions): UseVoiceOverResult {
  const { fps } = useVideoConfig();
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [durationInFrames, setDurationInFrames] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [words, setWords] = useState<STTWord[]>([]);

  const {
    text,
    voiceId,
    model,
    voiceSettings,
    language,
    transcribe = true,
    seed,
    previousText,
    nextText,
  } = options;

  useEffect(() => {
    if (!text) {
      setIsLoading(false);
      return;
    }

    let handle: number | null = null;
    let cancelled = false;

    async function generateAudio() {
      try {
        handle = delayRender('Generating voice-over audio');
        setIsLoading(true);
        setError(null);

        const config = getConfig();
        const ttsService = getTTSService();
        const cache = getBrowserCache();

        const effectiveVoiceId = voiceId || config.defaultVoiceId;
        const effectiveModel = model || config.defaultModel;

        // Check cache first (include seed/previousText/nextText in cache key)
        const cacheKey = computeTTSCacheKey(
          text,
          effectiveVoiceId,
          effectiveModel,
          language,
          {
            ...voiceSettings as Record<string, unknown> | undefined,
            seed,
            previousText,
            nextText,
          }
        );

        let audioBuffer: ArrayBuffer | null = await cache.get(cacheKey);

        if (!audioBuffer) {
          // Generate new audio
          const response = await ttsService.generateSpeech(text, {
            voiceId: effectiveVoiceId,
            model: effectiveModel,
            voiceSettings,
            language,
            seed,
            previousText,
            nextText,
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

        // Get audio duration
        const audioDuration = await getAudioDuration(url);
        const frames = Math.ceil(audioDuration * fps);
        setDurationInFrames(frames);

        // Transcribe for word timing if requested
        if (transcribe) {
          try {
            const sttService = getSTTService();
            const transcription = await sttService.transcribe(audioBuffer, { language });
            if (!cancelled) {
              setWords(transcription.words);
            }
          } catch (sttError) {
            // Transcription failure is not critical
            console.warn('Transcription failed:', sttError);
          }
        }
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

    generateAudio();

    return () => {
      cancelled = true;
    };
  }, [text, voiceId, model, JSON.stringify(voiceSettings), language, transcribe, fps, seed, previousText, nextText]);

  return { audioSrc, durationInFrames, isLoading, error, words };
}

/**
 * Get audio duration from a URL
 */
function getAudioDuration(url: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.addEventListener('loadedmetadata', () => {
      resolve(audio.duration);
    });
    audio.addEventListener('error', () => {
      reject(new Error('Failed to load audio'));
    });
    audio.src = url;
  });
}
