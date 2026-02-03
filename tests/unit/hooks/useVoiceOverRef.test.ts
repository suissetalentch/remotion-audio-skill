import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useVoiceOverRef, isVoiceOverRefInternal } from '../../../src/hooks/useVoiceOverRef';

// Mock Remotion
vi.mock('remotion', () => ({
  useVideoConfig: vi.fn(() => ({
    fps: 30,
    durationInFrames: 300,
    width: 1920,
    height: 1080,
    id: 'test',
    defaultProps: {},
    props: {},
    defaultCodec: 'h264',
  })),
}));

describe('useVoiceOverRef', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return a ref object', () => {
    const { result } = renderHook(() => useVoiceOverRef());
    expect(result.current).toBeDefined();
    expect(result.current.current).not.toBeNull();
  });

  it('should have initial values', () => {
    const { result } = renderHook(() => useVoiceOverRef());
    const handle = result.current.current!;

    expect(handle.audioSrc).toBeNull();
    expect(handle.durationFrames).toBe(0);
    expect(handle.durationMs).toBe(0);
    expect(handle.transcription).toBeNull();
    expect(handle.isReady).toBe(false);
    expect(handle.speechRegions).toEqual([]);
    expect(handle.startFrame).toBe(0);
  });

  it('should allow updating values via internal methods', () => {
    const { result } = renderHook(() => useVoiceOverRef());
    const ref = result.current;

    expect(isVoiceOverRefInternal(ref)).toBe(true);

    if (isVoiceOverRefInternal(ref)) {
      const internal = ref.current!;

      internal._setAudioSrc('blob:test-url');
      internal._setDurationFrames(90);
      internal._setIsReady(true);
      internal._setStartFrame(30);

      expect(ref.current!.audioSrc).toBe('blob:test-url');
      expect(ref.current!.durationFrames).toBe(90);
      expect(ref.current!.durationMs).toBe(3000); // 90 frames / 30 fps * 1000
      expect(ref.current!.isReady).toBe(true);
      expect(ref.current!.startFrame).toBe(30);
    }
  });

  it('should compute speech regions from transcription', () => {
    const { result } = renderHook(() => useVoiceOverRef());

    if (isVoiceOverRefInternal(result.current)) {
      const internal = result.current.current!;

      internal._setStartFrame(60);
      internal._setDurationFrames(90);
      internal._setTranscription([
        { word: 'Hello', start: 0, end: 0.3, confidence: 0.9 },
        { word: 'world', start: 0.35, end: 0.7, confidence: 0.95 },
        // Gap > 300ms
        { word: 'test', start: 1.5, end: 1.8, confidence: 0.9 },
      ]);

      const regions = result.current.current!.speechRegions;

      // Should merge "Hello" and "world" (gap < 300ms)
      // "test" should be separate region
      expect(regions).toHaveLength(2);

      // First region: "Hello world" (frames 60 + 0*30 to 60 + 0.7*30)
      expect(regions[0].startFrame).toBe(60); // 60 + floor(0 * 30)
      expect(regions[0].endFrame).toBe(81); // 60 + ceil(0.7 * 30)

      // Second region: "test" (frames 60 + 1.5*30 to 60 + 1.8*30)
      expect(regions[1].startFrame).toBe(105); // 60 + floor(1.5 * 30)
      expect(regions[1].endFrame).toBe(114); // 60 + ceil(1.8 * 30)
    }
  });

  it('should return entire audio as single speech region when no transcription', () => {
    const { result } = renderHook(() => useVoiceOverRef());

    if (isVoiceOverRefInternal(result.current)) {
      const internal = result.current.current!;

      internal._setStartFrame(30);
      internal._setDurationFrames(60);
      // No transcription set

      const regions = result.current.current!.speechRegions;

      expect(regions).toHaveLength(1);
      expect(regions[0].startFrame).toBe(30);
      expect(regions[0].endFrame).toBe(90); // 30 + 60
    }
  });

  it('should maintain ref stability across renders', () => {
    const { result, rerender } = renderHook(() => useVoiceOverRef());
    const firstRef = result.current;

    rerender();

    expect(result.current).toBe(firstRef);
  });
});
