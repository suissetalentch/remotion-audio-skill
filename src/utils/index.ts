export {
  sha256,
  computeCacheKey,
  computeTTSCacheKey,
  computeMusicCacheKey,
  computeSFXCacheKey,
} from './hash';

export {
  computeDuckingCurve,
  computeDuckingCurveExponential,
  getVolumeAtFrame,
  getVolumeFromArray,
  wordsToDuckingSegments,
  createVoiceSegment,
} from './ducking';
export type { DuckingSegment, DuckingCurve, DuckingCurveOptions } from './ducking';

export {
  getAudioDuration,
  getAudioDurationInFrames,
  secondsToFrames,
  framesToSeconds,
  formatDuration,
  formatTimecode,
} from './audio-duration';
