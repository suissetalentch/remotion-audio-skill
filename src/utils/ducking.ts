export interface DuckingSegment {
  startFrame: number;
  endFrame: number;
}

export interface DuckingCurve {
  frame: number;
  volume: number;
}

export interface DuckingCurveOptions {
  targetVolume?: number;
  attackFrames?: number;
  releaseFrames?: number;
  fps?: number;
  /** Use exponential smoothing instead of linear interpolation */
  exponential?: boolean;
}

const DEFAULT_OPTIONS: Required<DuckingCurveOptions> = {
  targetVolume: 0.2,
  attackFrames: 9, // ~300ms at 30fps
  releaseFrames: 15, // ~500ms at 30fps
  fps: 30,
  exponential: true, // PRD default
};

/**
 * Compute a ducking volume curve for background music using exponential smoothing
 *
 * Algorithm (from PRD section 4.1):
 * - During speech: target = duckTo, use alpha_attack
 * - After speech: target = baseVolume, use alpha_release
 * - volume[f] = volume[f-1] + alpha * (target - volume[f-1])
 * - alpha = 1 - e^(-1 / time_constant)
 *
 * @param voiceSegments Array of segments where voice is active
 * @param totalFrames Total duration in frames
 * @param options Ducking curve options
 * @returns Float32Array of volume values for each frame
 */
export function computeDuckingCurveExponential(
  voiceSegments: DuckingSegment[],
  totalFrames: number,
  options: DuckingCurveOptions = {}
): Float32Array {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { targetVolume, attackFrames, releaseFrames } = opts;
  const baseVolume = 1;

  const curve = new Float32Array(totalFrames);

  if (voiceSegments.length === 0) {
    curve.fill(baseVolume);
    return curve;
  }

  // Sort and merge overlapping segments
  const sortedSegments = [...voiceSegments].sort((a, b) => a.startFrame - b.startFrame);
  const mergedSegments = mergeOverlappingSegments(sortedSegments);

  // Calculate exponential smoothing coefficients
  const alphaAttack = 1 - Math.exp(-1 / attackFrames);
  const alphaRelease = 1 - Math.exp(-1 / releaseFrames);

  let currentVolume = baseVolume;

  for (let f = 0; f < totalFrames; f++) {
    // Check if current frame is in any speech region
    const isSpeech = mergedSegments.some(
      (r) => f >= r.startFrame && f <= r.endFrame
    );

    const target = isSpeech ? targetVolume : baseVolume;
    const alpha = isSpeech ? alphaAttack : alphaRelease;

    // Exponential smoothing
    currentVolume += alpha * (target - currentVolume);

    // Clamp to valid range
    curve[f] = Math.max(0, Math.min(1, currentVolume));
  }

  return curve;
}

/**
 * Compute a ducking volume curve for background music (legacy linear version)
 * @param voiceSegments Array of segments where voice is active
 * @param totalFrames Total duration in frames
 * @param options Ducking curve options
 * @returns Array of volume keyframes
 */
export function computeDuckingCurve(
  voiceSegments: DuckingSegment[],
  totalFrames: number,
  options: DuckingCurveOptions = {}
): DuckingCurve[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { targetVolume, attackFrames, releaseFrames, exponential } = opts;

  // If exponential mode, compute full curve and convert to keyframes
  if (exponential) {
    const fullCurve = computeDuckingCurveExponential(voiceSegments, totalFrames, options);
    return curveArrayToKeyframes(fullCurve);
  }

  // Legacy linear mode
  if (voiceSegments.length === 0) {
    return [
      { frame: 0, volume: 1 },
      { frame: totalFrames, volume: 1 },
    ];
  }

  // Sort segments by start frame
  const sortedSegments = [...voiceSegments].sort((a, b) => a.startFrame - b.startFrame);

  // Merge overlapping segments
  const mergedSegments = mergeOverlappingSegments(sortedSegments);

  const curve: DuckingCurve[] = [];

  // Start at full volume
  let lastVolume = 1;
  let lastFrame = 0;

  for (const segment of mergedSegments) {
    // Pre-attack: maintain current volume until attack starts
    const attackStart = Math.max(0, segment.startFrame - attackFrames);

    if (attackStart > lastFrame) {
      curve.push({ frame: lastFrame, volume: lastVolume });
      curve.push({ frame: attackStart, volume: 1 });
    }

    // Attack: duck to target volume
    curve.push({ frame: segment.startFrame, volume: targetVolume });

    // During voice segment: maintain target volume
    lastVolume = targetVolume;
    lastFrame = segment.endFrame;

    // Release: fade back to full volume
    const releaseEnd = Math.min(totalFrames, segment.endFrame + releaseFrames);
    curve.push({ frame: segment.endFrame, volume: targetVolume });
    curve.push({ frame: releaseEnd, volume: 1 });

    lastVolume = 1;
    lastFrame = releaseEnd;
  }

  // Ensure we end at full volume
  if (lastFrame < totalFrames) {
    curve.push({ frame: totalFrames, volume: 1 });
  }

  return deduplicateCurve(curve);
}

/**
 * Convert a Float32Array curve to keyframes for more efficient storage
 * Only keeps frames where the volume changes significantly
 */
function curveArrayToKeyframes(curve: Float32Array, tolerance: number = 0.001): DuckingCurve[] {
  if (curve.length === 0) return [];
  if (curve.length === 1) return [{ frame: 0, volume: curve[0] }];

  const keyframes: DuckingCurve[] = [{ frame: 0, volume: curve[0] }];
  let lastKeyframeVolume = curve[0];

  for (let i = 1; i < curve.length; i++) {
    const volumeDiff = Math.abs(curve[i] - lastKeyframeVolume);

    // Add keyframe if volume changed significantly or it's the last frame
    if (volumeDiff > tolerance || i === curve.length - 1) {
      // Check if we need to add the previous frame to mark the start of change
      if (keyframes[keyframes.length - 1].frame < i - 1) {
        keyframes.push({ frame: i - 1, volume: curve[i - 1] });
      }
      keyframes.push({ frame: i, volume: curve[i] });
      lastKeyframeVolume = curve[i];
    }
  }

  return keyframes;
}

/**
 * Merge overlapping voice segments
 */
function mergeOverlappingSegments(segments: DuckingSegment[]): DuckingSegment[] {
  if (segments.length === 0) return [];

  const merged: DuckingSegment[] = [{ ...segments[0] }];

  for (let i = 1; i < segments.length; i++) {
    const current = segments[i];
    const previous = merged[merged.length - 1];

    if (current.startFrame <= previous.endFrame) {
      // Merge overlapping segments
      previous.endFrame = Math.max(previous.endFrame, current.endFrame);
    } else {
      merged.push({ ...current });
    }
  }

  return merged;
}

/**
 * Remove duplicate consecutive points with same volume
 */
function deduplicateCurve(curve: DuckingCurve[]): DuckingCurve[] {
  if (curve.length <= 1) return curve;

  const deduplicated: DuckingCurve[] = [curve[0]];

  for (let i = 1; i < curve.length; i++) {
    const prev = deduplicated[deduplicated.length - 1];
    const current = curve[i];

    // Skip if same frame or if we have 3+ consecutive same volumes
    if (current.frame === prev.frame) {
      // Keep the later value
      deduplicated[deduplicated.length - 1] = current;
    } else {
      deduplicated.push(current);
    }
  }

  return deduplicated;
}

/**
 * Get the volume at a specific frame from a ducking curve
 */
export function getVolumeAtFrame(curve: DuckingCurve[], frame: number): number {
  if (curve.length === 0) return 1;
  if (frame <= curve[0].frame) return curve[0].volume;
  if (frame >= curve[curve.length - 1].frame) return curve[curve.length - 1].volume;

  // Find the two points we're between
  for (let i = 0; i < curve.length - 1; i++) {
    const current = curve[i];
    const next = curve[i + 1];

    if (frame >= current.frame && frame <= next.frame) {
      // Linear interpolation between keyframes
      const progress = (frame - current.frame) / (next.frame - current.frame);
      return current.volume + progress * (next.volume - current.volume);
    }
  }

  return 1;
}

/**
 * Get the volume at a specific frame from an exponential curve array
 */
export function getVolumeFromArray(curve: Float32Array, frame: number): number {
  if (curve.length === 0) return 1;
  if (frame < 0) return curve[0];
  if (frame >= curve.length) return curve[curve.length - 1];
  return curve[Math.floor(frame)];
}

/**
 * Convert word timestamps to ducking segments
 */
export function wordsToDuckingSegments(
  words: Array<{ start: number; end: number }>,
  fps: number
): DuckingSegment[] {
  return words.map(word => ({
    startFrame: Math.floor(word.start * fps),
    endFrame: Math.ceil(word.end * fps),
  }));
}

/**
 * Create ducking segments from voice-over timing
 */
export function createVoiceSegment(
  startFrame: number,
  durationInFrames: number
): DuckingSegment {
  return {
    startFrame,
    endFrame: startFrame + durationInFrames,
  };
}
