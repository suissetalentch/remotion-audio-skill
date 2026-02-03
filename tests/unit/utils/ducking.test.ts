import { describe, it, expect } from 'vitest';
import {
  computeDuckingCurve,
  computeDuckingCurveExponential,
  getVolumeAtFrame,
  getVolumeFromArray,
  wordsToDuckingSegments,
  createVoiceSegment,
  DuckingSegment,
} from '../../../src/utils/ducking';

describe('ducking utilities', () => {
  describe('computeDuckingCurve', () => {
    it('should return flat curve when no voice segments', () => {
      // Use linear mode for this test
      const curve = computeDuckingCurve([], 300, { exponential: false });

      expect(curve).toHaveLength(2);
      expect(curve[0]).toEqual({ frame: 0, volume: 1 });
      expect(curve[1]).toEqual({ frame: 300, volume: 1 });
    });

    it('should create attack and release for single segment', () => {
      const segments: DuckingSegment[] = [
        { startFrame: 60, endFrame: 120 },
      ];

      // Use linear mode for predictable keyframe test
      const curve = computeDuckingCurve(segments, 300, {
        targetVolume: 0.2,
        attackFrames: 9,
        releaseFrames: 15,
        exponential: false,
      });

      // Should have attack, hold, and release phases
      expect(curve.length).toBeGreaterThan(2);

      // Find the ducked volume point
      const duckedPoint = curve.find(c => c.volume === 0.2);
      expect(duckedPoint).toBeDefined();
    });

    it('should handle multiple non-overlapping segments', () => {
      const segments: DuckingSegment[] = [
        { startFrame: 30, endFrame: 60 },
        { startFrame: 120, endFrame: 150 },
      ];

      const curve = computeDuckingCurve(segments, 300);

      // Should return to full volume between segments
      const fullVolumePoints = curve.filter(c => c.volume === 1);
      expect(fullVolumePoints.length).toBeGreaterThan(0);
    });

    it('should merge overlapping segments', () => {
      const segments: DuckingSegment[] = [
        { startFrame: 30, endFrame: 90 },
        { startFrame: 60, endFrame: 120 }, // Overlaps with first
      ];

      const curve = computeDuckingCurve(segments, 300);

      // Should be treated as one continuous ducking period
      const duckedPoints = curve.filter(c => c.volume < 1);
      expect(duckedPoints.length).toBeGreaterThan(0);
    });

    it('should use custom target volume', () => {
      const segments: DuckingSegment[] = [
        { startFrame: 60, endFrame: 120 },
      ];

      // Use linear mode for predictable keyframe test
      const curve = computeDuckingCurve(segments, 300, {
        targetVolume: 0.3,
        exponential: false,
      });

      const duckedPoint = curve.find(c => c.volume === 0.3);
      expect(duckedPoint).toBeDefined();
    });

    it('should respect attack frames setting', () => {
      const segments: DuckingSegment[] = [
        { startFrame: 60, endFrame: 120 },
      ];

      // With different attack frames, the pre-attack point should differ
      const curveShortAttack = computeDuckingCurve(segments, 300, { attackFrames: 5, releaseFrames: 15 });
      const curveLongAttack = computeDuckingCurve(segments, 300, { attackFrames: 20, releaseFrames: 15 });

      // Find the frame where volume starts to decrease (still at 1)
      const findAttackStartFrame = (curve: typeof curveShortAttack) => {
        for (let i = 0; i < curve.length - 1; i++) {
          if (curve[i].volume === 1 && curve[i + 1].volume < 1) {
            return curve[i].frame;
          }
        }
        return 0;
      };

      const shortAttackStart = findAttackStartFrame(curveShortAttack);
      const longAttackStart = findAttackStartFrame(curveLongAttack);

      // Long attack should start transitioning earlier
      expect(longAttackStart).toBeLessThanOrEqual(shortAttackStart);
    });

    it('should respect release frames setting', () => {
      const segments: DuckingSegment[] = [
        { startFrame: 60, endFrame: 90 },
      ];

      const curveShortRelease = computeDuckingCurve(segments, 300, { attackFrames: 9, releaseFrames: 10 });
      const curveLongRelease = computeDuckingCurve(segments, 300, { attackFrames: 9, releaseFrames: 30 });

      // Find the frame where volume returns to 1 after ducking
      const findReleaseEndFrame = (curve: typeof curveShortRelease) => {
        let foundDuck = false;
        for (const point of curve) {
          if (point.volume < 1) foundDuck = true;
          if (foundDuck && point.volume === 1) return point.frame;
        }
        return curve[curve.length - 1].frame;
      };

      const shortReleaseEnd = findReleaseEndFrame(curveShortRelease);
      const longReleaseEnd = findReleaseEndFrame(curveLongRelease);

      // Long release should end later
      expect(longReleaseEnd).toBeGreaterThanOrEqual(shortReleaseEnd);
    });

    it('should handle segment at very start', () => {
      const segments: DuckingSegment[] = [
        { startFrame: 0, endFrame: 60 },
      ];

      const curve = computeDuckingCurve(segments, 300);

      expect(curve.length).toBeGreaterThan(0);
      // Should not have negative frames
      curve.forEach(point => {
        expect(point.frame).toBeGreaterThanOrEqual(0);
      });
    });

    it('should handle segment at very end', () => {
      const segments: DuckingSegment[] = [
        { startFrame: 280, endFrame: 300 },
      ];

      const curve = computeDuckingCurve(segments, 300);

      expect(curve.length).toBeGreaterThan(0);
      // Should not exceed total frames
      curve.forEach(point => {
        expect(point.frame).toBeLessThanOrEqual(300);
      });
    });
  });

  describe('getVolumeAtFrame', () => {
    it('should interpolate between keyframes', () => {
      const curve = [
        { frame: 0, volume: 1 },
        { frame: 30, volume: 0.2 },
        { frame: 60, volume: 0.2 },
        { frame: 90, volume: 1 },
      ];

      // At frame 15, should be halfway between 1 and 0.2
      const volumeAt15 = getVolumeAtFrame(curve, 15);
      expect(volumeAt15).toBeCloseTo(0.6, 1);

      // At frame 45, should be at target volume
      const volumeAt45 = getVolumeAtFrame(curve, 45);
      expect(volumeAt45).toBe(0.2);

      // At frame 75, should be halfway back
      const volumeAt75 = getVolumeAtFrame(curve, 75);
      expect(volumeAt75).toBeCloseTo(0.6, 1);
    });

    it('should return first volume for frames before start', () => {
      const curve = [
        { frame: 30, volume: 0.5 },
        { frame: 60, volume: 1 },
      ];

      expect(getVolumeAtFrame(curve, 0)).toBe(0.5);
      expect(getVolumeAtFrame(curve, 15)).toBe(0.5);
    });

    it('should return last volume for frames after end', () => {
      const curve = [
        { frame: 0, volume: 1 },
        { frame: 30, volume: 0.5 },
      ];

      expect(getVolumeAtFrame(curve, 60)).toBe(0.5);
    });

    it('should return 1 for empty curve', () => {
      expect(getVolumeAtFrame([], 50)).toBe(1);
    });
  });

  describe('wordsToDuckingSegments', () => {
    it('should convert word timestamps to frame segments', () => {
      const words = [
        { start: 0, end: 0.5 },
        { start: 1, end: 1.5 },
      ];

      const segments = wordsToDuckingSegments(words, 30);

      expect(segments).toHaveLength(2);
      expect(segments[0]).toEqual({ startFrame: 0, endFrame: 15 });
      expect(segments[1]).toEqual({ startFrame: 30, endFrame: 45 });
    });

    it('should handle empty words array', () => {
      const segments = wordsToDuckingSegments([], 30);
      expect(segments).toHaveLength(0);
    });
  });

  describe('createVoiceSegment', () => {
    it('should create segment from start frame and duration', () => {
      const segment = createVoiceSegment(30, 60);

      expect(segment).toEqual({
        startFrame: 30,
        endFrame: 90,
      });
    });
  });

  describe('computeDuckingCurveExponential', () => {
    it('should return Float32Array of correct length', () => {
      const segments: DuckingSegment[] = [
        { startFrame: 60, endFrame: 120 },
      ];
      const curve = computeDuckingCurveExponential(segments, 300);

      expect(curve).toBeInstanceOf(Float32Array);
      expect(curve.length).toBe(300);
    });

    it('should maintain baseVolume when no speech', () => {
      const curve = computeDuckingCurveExponential([], 300);

      // All values should be 1 (baseVolume)
      for (let i = 0; i < curve.length; i++) {
        expect(curve[i]).toBe(1);
      }
    });

    it('should duck during speech regions', () => {
      const segments: DuckingSegment[] = [
        { startFrame: 60, endFrame: 120 },
      ];
      const curve = computeDuckingCurveExponential(segments, 300, {
        targetVolume: 0.2,
        attackFrames: 9,
        releaseFrames: 15,
      });

      // During speech, volume should be close to targetVolume
      // After exponential decay, should be near target by mid-segment
      const midSpeechFrame = 90;
      expect(curve[midSpeechFrame]).toBeLessThan(0.5);
    });

    it('should have smooth attack (no instantaneous drop)', () => {
      const segments: DuckingSegment[] = [
        { startFrame: 60, endFrame: 120 },
      ];
      const curve = computeDuckingCurveExponential(segments, 300, {
        targetVolume: 0.2,
        attackFrames: 9,
      });

      // Volume should decrease gradually, not instantaneously
      // Check frames around speech start
      const beforeSpeech = curve[59];
      const atSpeechStart = curve[60];
      const afterSpeechStart = curve[61];

      // Volume at speech start should still be close to previous (exponential smoothing)
      expect(Math.abs(atSpeechStart - beforeSpeech)).toBeLessThan(0.3);
      expect(afterSpeechStart).toBeLessThan(beforeSpeech);
    });

    it('should have smooth release (no instantaneous jump)', () => {
      const segments: DuckingSegment[] = [
        { startFrame: 60, endFrame: 120 },
      ];
      const curve = computeDuckingCurveExponential(segments, 300, {
        targetVolume: 0.2,
        releaseFrames: 15,
      });

      // After speech ends, volume should increase gradually
      const atSpeechEnd = curve[120];
      const afterSpeechEnd = curve[121];

      // Should not jump to 1 immediately
      expect(afterSpeechEnd).toBeLessThan(0.8);
      expect(afterSpeechEnd).toBeGreaterThan(atSpeechEnd);
    });

    it('should clamp values between 0 and 1', () => {
      const segments: DuckingSegment[] = [
        { startFrame: 0, endFrame: 300 },
      ];
      const curve = computeDuckingCurveExponential(segments, 300);

      for (let i = 0; i < curve.length; i++) {
        expect(curve[i]).toBeGreaterThanOrEqual(0);
        expect(curve[i]).toBeLessThanOrEqual(1);
      }
    });

    it('should handle multiple speech regions', () => {
      const segments: DuckingSegment[] = [
        { startFrame: 30, endFrame: 60 },
        { startFrame: 120, endFrame: 150 },
      ];
      const curve = computeDuckingCurveExponential(segments, 300, {
        targetVolume: 0.2,
      });

      // Volume should be ducked during both speech regions
      expect(curve[45]).toBeLessThan(0.8);
      expect(curve[135]).toBeLessThan(0.8);

      // Volume should recover between regions
      expect(curve[90]).toBeGreaterThan(0.5);
    });

    it('should handle adjacent speech regions', () => {
      const segments: DuckingSegment[] = [
        { startFrame: 30, endFrame: 60 },
        { startFrame: 60, endFrame: 90 }, // Starts immediately after first ends
      ];
      const curve = computeDuckingCurveExponential(segments, 300, {
        targetVolume: 0.2,
      });

      // Volume should stay ducked across both regions
      expect(curve[50]).toBeLessThan(0.5);
      expect(curve[70]).toBeLessThan(0.5);
    });

    it('should respect different attack/release times', () => {
      const segments: DuckingSegment[] = [
        { startFrame: 60, endFrame: 120 },
      ];

      // Fast attack, slow release
      const fastAttackCurve = computeDuckingCurveExponential(segments, 300, {
        targetVolume: 0.2,
        attackFrames: 3,
        releaseFrames: 30,
      });

      // Slow attack, fast release
      const slowAttackCurve = computeDuckingCurveExponential(segments, 300, {
        targetVolume: 0.2,
        attackFrames: 30,
        releaseFrames: 3,
      });

      // Fast attack should reach target faster
      expect(fastAttackCurve[65]).toBeLessThan(slowAttackCurve[65]);

      // Fast release should recover faster
      expect(fastAttackCurve[150]).toBeLessThan(slowAttackCurve[150]);
    });
  });

  describe('getVolumeFromArray', () => {
    it('should return volume at specific frame', () => {
      const curve = new Float32Array([1, 0.9, 0.8, 0.7, 0.6]);

      expect(getVolumeFromArray(curve, 0)).toBe(1);
      expect(getVolumeFromArray(curve, 2)).toBeCloseTo(0.8, 5);
      expect(getVolumeFromArray(curve, 4)).toBeCloseTo(0.6, 5);
    });

    it('should return first value for negative frames', () => {
      const curve = new Float32Array([0.5, 0.6, 0.7]);
      expect(getVolumeFromArray(curve, -5)).toBeCloseTo(0.5, 5);
    });

    it('should return last value for frames beyond array', () => {
      const curve = new Float32Array([0.5, 0.6, 0.7]);
      expect(getVolumeFromArray(curve, 100)).toBeCloseTo(0.7, 5);
    });

    it('should return 1 for empty array', () => {
      const curve = new Float32Array(0);
      expect(getVolumeFromArray(curve, 50)).toBe(1);
    });
  });
});
