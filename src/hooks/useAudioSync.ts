import { useCurrentFrame, useVideoConfig } from 'remotion';
import { useMemo } from 'react';
import { UseAudioSyncResult, STTWord } from '../types';

/**
 * Hook to sync with audio playback
 */
export function useAudioSync(): UseAudioSyncResult {
  const currentFrame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const currentTime = useMemo(() => currentFrame / fps, [currentFrame, fps]);

  return {
    currentTime,
    currentFrame,
    isPlaying: true, // In Remotion, we're always "playing" during render
  };
}

/**
 * Hook to get the current word based on frame
 */
export function useCurrentWord(words: STTWord[]): STTWord | null {
  const { currentTime } = useAudioSync();

  return useMemo(() => {
    return words.find(w => currentTime >= w.start && currentTime <= w.end) || null;
  }, [words, currentTime]);
}

/**
 * Hook to get highlighted words up to current time
 */
export function useHighlightedWords(words: STTWord[]): STTWord[] {
  const { currentTime } = useAudioSync();

  return useMemo(() => {
    return words.filter(w => currentTime >= w.start);
  }, [words, currentTime]);
}
