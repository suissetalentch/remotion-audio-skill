import { useRef } from 'react';
import { useVideoConfig } from 'remotion';
import { STTWord } from '../types';

/**
 * Speech region representing a segment where voice is active
 */
export interface SpeechRegion {
  startFrame: number;
  endFrame: number;
}

/**
 * VoiceOver ref handle exposing audio metadata for other components
 */
export interface VoiceOverRefHandle {
  /** Source URL of the generated audio */
  audioSrc: string | null;
  /** Duration in frames */
  durationFrames: number;
  /** Duration in milliseconds */
  durationMs: number;
  /** Word-level transcription with timestamps */
  transcription: STTWord[] | null;
  /** Whether the audio is ready to use */
  isReady: boolean;
  /** Regions where speech is active (for ducking) */
  speechRegions: SpeechRegion[];
  /** Start frame of the VoiceOver component */
  startFrame: number;
}

/**
 * Internal handle used by VoiceOver component to update the ref
 */
export interface VoiceOverRefInternal extends VoiceOverRefHandle {
  _setAudioSrc: (src: string | null) => void;
  _setDurationFrames: (frames: number) => void;
  _setTranscription: (words: STTWord[] | null) => void;
  _setIsReady: (ready: boolean) => void;
  _setStartFrame: (frame: number) => void;
}

/**
 * Create initial ref handle with default values
 */
function createInitialHandle(fps: number): VoiceOverRefInternal {
  const handle: VoiceOverRefInternal = {
    audioSrc: null,
    durationFrames: 0,
    durationMs: 0,
    transcription: null,
    isReady: false,
    speechRegions: [],
    startFrame: 0,
    _setAudioSrc: () => {},
    _setDurationFrames: () => {},
    _setTranscription: () => {},
    _setIsReady: () => {},
    _setStartFrame: () => {},
  };

  // Closure variables for mutable state
  let _audioSrc: string | null = null;
  let _durationFrames = 0;
  let _transcription: STTWord[] | null = null;
  let _isReady = false;
  let _startFrame = 0;

  // Define property getters to access mutable state
  Object.defineProperties(handle, {
    audioSrc: {
      get: () => _audioSrc,
      enumerable: true,
    },
    durationFrames: {
      get: () => _durationFrames,
      enumerable: true,
    },
    durationMs: {
      get: () => (_durationFrames / fps) * 1000,
      enumerable: true,
    },
    isReady: {
      get: () => _isReady,
      enumerable: true,
    },
    transcription: {
      get: () => _transcription,
      enumerable: true,
    },
    startFrame: {
      get: () => _startFrame,
      enumerable: true,
    },
    speechRegions: {
      get: (): SpeechRegion[] => {
        if (!_transcription || _transcription.length === 0) {
          // No transcription: treat entire audio as speech
          if (_durationFrames > 0) {
            return [{ startFrame: _startFrame, endFrame: _startFrame + _durationFrames }];
          }
          return [];
        }
        // Convert word timestamps to speech regions
        return computeSpeechRegions(_transcription, fps, _startFrame);
      },
      enumerable: true,
    },
  });

  // Setter methods
  handle._setAudioSrc = (src: string | null) => {
    _audioSrc = src;
  };
  handle._setDurationFrames = (frames: number) => {
    _durationFrames = frames;
  };
  handle._setTranscription = (words: STTWord[] | null) => {
    _transcription = words;
  };
  handle._setIsReady = (ready: boolean) => {
    _isReady = ready;
  };
  handle._setStartFrame = (frame: number) => {
    _startFrame = frame;
  };

  return handle;
}

/**
 * Compute speech regions from word timestamps
 * Merges adjacent words with small gaps into continuous regions
 */
function computeSpeechRegions(
  words: STTWord[],
  fps: number,
  offset: number,
  maxGapMs: number = 300
): SpeechRegion[] {
  if (words.length === 0) return [];

  const regions: SpeechRegion[] = [];
  const maxGapSeconds = maxGapMs / 1000;

  let currentStart = words[0].start;
  let currentEnd = words[0].end;

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const gap = word.start - currentEnd;

    if (gap <= maxGapSeconds) {
      // Extend current region
      currentEnd = word.end;
    } else {
      // Close current region and start new one
      regions.push({
        startFrame: offset + Math.floor(currentStart * fps),
        endFrame: offset + Math.ceil(currentEnd * fps),
      });
      currentStart = word.start;
      currentEnd = word.end;
    }
  }

  // Add final region
  regions.push({
    startFrame: offset + Math.floor(currentStart * fps),
    endFrame: offset + Math.ceil(currentEnd * fps),
  });

  return regions;
}

/**
 * Hook to create a ref for VoiceOver that exposes metadata to other components
 *
 * @example
 * ```tsx
 * const voiceRef = useVoiceOverRef();
 *
 * <BackgroundMusic ducking={{ triggerRef: voiceRef }} />
 * <VoiceOver ref={voiceRef} text="Hello world" />
 * <AutoCaption audioRef={voiceRef} />
 * ```
 */
export function useVoiceOverRef(): React.RefObject<VoiceOverRefHandle> {
  const { fps } = useVideoConfig();

  // Create a stable ref that persists across renders
  const handleRef = useRef<VoiceOverRefInternal | null>(null);

  // Initialize on first access
  if (handleRef.current === null) {
    handleRef.current = createInitialHandle(fps);
  }

  // Return as readonly VoiceOverRefHandle
  return handleRef as unknown as React.RefObject<VoiceOverRefHandle>;
}

/**
 * Type guard to check if a ref is a VoiceOverRef with internal methods
 */
export function isVoiceOverRefInternal(
  ref: React.RefObject<VoiceOverRefHandle>
): ref is React.RefObject<VoiceOverRefInternal> {
  return ref.current !== null && '_setAudioSrc' in ref.current;
}

export default useVoiceOverRef;
