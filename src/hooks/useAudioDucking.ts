import { useState, useCallback, useMemo } from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { DuckingConfig, UseAudioDuckingResult } from '../types';

export interface UseAudioDuckingOptions {
  ducking: DuckingConfig;
  voiceStartFrame?: number;
  voiceEndFrame?: number;
}

/**
 * Hook to manage audio ducking based on voice activity
 */
export function useAudioDucking(options: UseAudioDuckingOptions): UseAudioDuckingResult {
  const { fps } = useVideoConfig();
  const currentFrame = useCurrentFrame();
  const [, setVoiceActive] = useState(false);

  const {
    ducking,
    voiceStartFrame = 0,
    voiceEndFrame = Infinity,
  } = options;

  const {
    enabled = false,
    targetVolume = 0.2,
    attackTime = Math.round(fps * 0.3), // 300ms default
    releaseTime = Math.round(fps * 0.5), // 500ms default
  } = ducking;

  const volume = useMemo(() => {
    if (!enabled) return 1;

    const voiceActive = currentFrame >= voiceStartFrame && currentFrame <= voiceEndFrame;

    if (voiceActive) {
      // Duck the volume during voice
      const attackEnd = voiceStartFrame + attackTime;
      if (currentFrame < attackEnd) {
        // Attack phase - fade to target volume
        return interpolate(
          currentFrame,
          [voiceStartFrame, attackEnd],
          [1, targetVolume],
          { extrapolateRight: 'clamp' }
        );
      }
      return targetVolume;
    } else if (currentFrame > voiceEndFrame) {
      // Release phase - fade back to full volume
      const releaseEnd = voiceEndFrame + releaseTime;
      if (currentFrame < releaseEnd) {
        return interpolate(
          currentFrame,
          [voiceEndFrame, releaseEnd],
          [targetVolume, 1],
          { extrapolateRight: 'clamp' }
        );
      }
      return 1;
    }

    return 1;
  }, [currentFrame, enabled, voiceStartFrame, voiceEndFrame, targetVolume, attackTime, releaseTime]);

  const setVoiceActiveCallback = useCallback((active: boolean) => {
    setVoiceActive(active);
  }, []);

  return { volume, setVoiceActive: setVoiceActiveCallback };
}
