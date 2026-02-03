import React, { useMemo } from 'react';
import { Audio, Sequence, useVideoConfig, useCurrentFrame, interpolate } from 'remotion';
import { useBackgroundMusic } from '../hooks/useBackgroundMusic';
import { BackgroundMusicProps } from '../types';

/**
 * BackgroundMusic component for AI-generated background music
 * Supports fade in/out and auto-ducking via triggerRef
 */
export const BackgroundMusic: React.FC<BackgroundMusicProps> = ({
  prompt,
  durationSeconds,
  promptInfluence,
  from = 0,
  volume = 0.5,
  loop = true,
  ducking,
  fadeInFrames = 0,
  fadeOutFrames = 0,
}) => {
  const { durationInFrames } = useVideoConfig();
  const currentFrame = useCurrentFrame();
  const { audioSrc, isLoading, error } = useBackgroundMusic({
    prompt,
    durationSeconds,
    promptInfluence,
  });

  // Compute volume with fades and ducking
  const computedVolume = useMemo(() => {
    const sequenceDuration = durationInFrames - from;
    let baseVolume = volume;

    // Apply fade in
    if (fadeInFrames > 0 && currentFrame < fadeInFrames) {
      const fadeInVolume = interpolate(
        currentFrame,
        [0, fadeInFrames],
        [0, 1],
        { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }
      );
      baseVolume *= fadeInVolume;
    }

    // Apply fade out
    if (fadeOutFrames > 0 && currentFrame > sequenceDuration - fadeOutFrames) {
      const fadeOutVolume = interpolate(
        currentFrame,
        [sequenceDuration - fadeOutFrames, sequenceDuration],
        [1, 0],
        { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }
      );
      baseVolume *= fadeOutVolume;
    }

    // Apply ducking from triggerRef
    if (ducking?.enabled && ducking.triggerRef?.current?.isReady) {
      const targetVolume = ducking.duckTo ?? ducking.targetVolume ?? 0.2;
      const attackFrames = ducking.attackFrames ?? ducking.attackTime ?? 9;
      const releaseFrames = ducking.releaseFrames ?? ducking.releaseTime ?? 15;

      const speechRegions = ducking.triggerRef.current.speechRegions;
      const absoluteFrame = currentFrame + from;

      // Check if currently in speech region
      const inSpeech = speechRegions.some(
        (r) => absoluteFrame >= r.startFrame && absoluteFrame <= r.endFrame
      );

      // Find nearest speech region for smooth transitions
      let duckingMultiplier = 1;

      if (inSpeech) {
        // Inside speech: apply full ducking
        duckingMultiplier = targetVolume;
      } else {
        // Check proximity to speech regions for attack/release
        for (const region of speechRegions) {
          // Before speech (attack)
          if (absoluteFrame >= region.startFrame - attackFrames && absoluteFrame < region.startFrame) {
            const progress = (region.startFrame - absoluteFrame) / attackFrames;
            duckingMultiplier = Math.min(duckingMultiplier, targetVolume + progress * (1 - targetVolume));
          }
          // After speech (release)
          if (absoluteFrame > region.endFrame && absoluteFrame <= region.endFrame + releaseFrames) {
            const progress = (absoluteFrame - region.endFrame) / releaseFrames;
            duckingMultiplier = Math.min(duckingMultiplier, targetVolume + progress * (1 - targetVolume));
          }
        }
      }

      baseVolume *= duckingMultiplier;
    } else if (ducking?.enabled) {
      // Legacy ducking without triggerRef
      // Without a ref, we can't know when speech occurs, so no ducking applied
      // This maintains backwards compatibility
    }

    return Math.max(0, Math.min(1, baseVolume));
  }, [currentFrame, volume, fadeInFrames, fadeOutFrames, durationInFrames, from, ducking]);

  if (error) {
    console.error('BackgroundMusic error:', error);
    return null;
  }

  if (isLoading || !audioSrc) {
    return null;
  }

  return (
    <Sequence from={from} durationInFrames={durationInFrames - from}>
      <Audio
        src={audioSrc}
        volume={computedVolume}
        loop={loop}
      />
    </Sequence>
  );
};

export default BackgroundMusic;
