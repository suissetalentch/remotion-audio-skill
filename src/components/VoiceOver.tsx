import React, { useEffect, forwardRef } from 'react';
import { Audio, Sequence } from 'remotion';
import { useVoiceOver } from '../hooks/useVoiceOver';
import { VoiceOverProps } from '../types';
import { VoiceOverRefHandle, VoiceOverRefInternal, isVoiceOverRefInternal } from '../hooks/useVoiceOverRef';

/**
 * VoiceOver component for text-to-speech audio
 * Supports forwardRef to expose metadata to BackgroundMusic and AutoCaption
 */
export const VoiceOver = forwardRef<VoiceOverRefHandle, VoiceOverProps>(
  (
    {
      text,
      src,
      durationInFrames: propDurationInFrames,
      voiceId,
      model,
      voiceSettings,
      language,
      from = 0,
      volume = 1,
      playbackRate = 1,
      onDurationChange,
      seed,
      previousText,
      nextText,
      trimBefore = 0,
      trimAfter = 0,
    },
    ref
  ) => {
    // If src is provided, use it directly (prerendered mode)
    // Otherwise, use the hook to generate audio dynamically
    const hookResult = useVoiceOver({
      text,
      voiceId,
      model,
      voiceSettings,
      language,
      transcribe: !src, // Skip transcription if using prerendered audio
      seed,
      previousText,
      nextText,
    });

    // Use prerendered src/duration or hook result
    const audioSrc = src || hookResult.audioSrc;
    const durationInFrames = propDurationInFrames || hookResult.durationInFrames;
    const isLoading = src ? false : hookResult.isLoading;
    const error = src ? null : hookResult.error;
    const words = hookResult.words;

    // Calculate effective duration after trimming
    const effectiveDuration = Math.max(0, durationInFrames - trimBefore - trimAfter);

    // Update ref handle when audio is ready
    useEffect(() => {
      if (ref && typeof ref !== 'function' && isVoiceOverRefInternal(ref as React.RefObject<VoiceOverRefHandle>)) {
        const internal = (ref as React.RefObject<VoiceOverRefInternal>).current;
        if (internal) {
          internal._setAudioSrc(audioSrc);
          internal._setDurationFrames(effectiveDuration);
          internal._setTranscription(words.length > 0 ? words : null);
          internal._setIsReady(!isLoading && audioSrc !== null);
          internal._setStartFrame(from);
        }
      }
    }, [ref, audioSrc, effectiveDuration, words, isLoading, from]);

    useEffect(() => {
      if (effectiveDuration > 0 && onDurationChange) {
        onDurationChange(effectiveDuration);
      }
    }, [effectiveDuration, onDurationChange]);

    if (error) {
      console.error('VoiceOver error:', error);
      return null;
    }

    if (isLoading || !audioSrc) {
      return null;
    }

    return (
      <Sequence from={from} durationInFrames={effectiveDuration}>
        <Audio
          src={audioSrc}
          volume={volume}
          playbackRate={playbackRate}
          startFrom={trimBefore}
          endAt={durationInFrames - trimAfter}
        />
      </Sequence>
    );
  }
);

VoiceOver.displayName = 'VoiceOver';

export default VoiceOver;
