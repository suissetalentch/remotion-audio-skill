import React, { createContext, useContext, useMemo } from 'react';
import { AudioMixerProps } from '../types';

interface AudioMixerContextValue {
  masterVolume: number;
  normalize: boolean;
  targetLUFS: number;
  /** Computed gain factor for normalization (applied by child components) */
  gainFactor: number;
}

const AudioMixerContext = createContext<AudioMixerContextValue>({
  masterVolume: 1,
  normalize: false,
  targetLUFS: -14,
  gainFactor: 1,
});

/**
 * Hook to get the master volume from AudioMixer context
 */
export function useMasterVolume(): number {
  const context = useContext(AudioMixerContext);
  return context.masterVolume;
}

/**
 * Hook to get full AudioMixer context including normalization settings
 */
export function useAudioMixerContext(): AudioMixerContextValue {
  return useContext(AudioMixerContext);
}

/**
 * Compute gain factor for LUFS normalization
 *
 * LUFS (Loudness Units Full Scale) is a standard for measuring perceived loudness.
 * - Broadcast standard: -14 LUFS
 * - Spotify: -14 LUFS
 * - Apple Music: -16 LUFS
 * - YouTube: -14 LUFS
 *
 * Since we can't measure actual LUFS in real-time without audio analysis,
 * we provide a gain factor hint that child components can use.
 * For accurate LUFS normalization, audio should be pre-analyzed.
 *
 * The gain factor represents the multiplier needed to reach target LUFS
 * from an assumed input level. This is a simplified approach that works
 * well for voice-over content.
 */
function computeGainFactor(
  targetLUFS: number,
  estimatedInputLUFS: number = -18 // Typical for unprocessed voice
): number {
  // Convert LUFS difference to linear gain
  // dB = 10 * log10(power ratio)
  // LUFS difference ≈ dB difference for our purposes
  const lufsGain = targetLUFS - estimatedInputLUFS;
  // Convert dB to linear: linearGain = 10^(dB/20)
  const linearGain = Math.pow(10, lufsGain / 20);

  // Clamp to reasonable range to avoid clipping
  return Math.max(0.1, Math.min(2, linearGain));
}

/**
 * AudioMixer component for global audio control
 *
 * Provides:
 * - Master volume control for all child audio
 * - Optional LUFS loudness normalization
 *
 * @example
 * ```tsx
 * <AudioMixer masterVolume={0.8} normalize targetLUFS={-14}>
 *   <VoiceOver text="Hello" />
 *   <BackgroundMusic prompt="ambient" />
 * </AudioMixer>
 * ```
 */
export const AudioMixer: React.FC<AudioMixerProps> = ({
  children,
  masterVolume = 1,
  normalize = false,
  targetLUFS = -14,
}) => {
  const contextValue = useMemo<AudioMixerContextValue>(() => {
    const gainFactor = normalize ? computeGainFactor(targetLUFS) : 1;

    return {
      masterVolume,
      normalize,
      targetLUFS,
      gainFactor,
    };
  }, [masterVolume, normalize, targetLUFS]);

  return (
    <AudioMixerContext.Provider value={contextValue}>
      {children}
    </AudioMixerContext.Provider>
  );
};

export default AudioMixer;
