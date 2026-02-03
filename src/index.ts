// Configuration
export { configureAudioSkill, getConfig, resetConfig, isConfigured } from './config';

// Types
export type {
  AudioSkillConfig,
  ResolvedConfig,
  Voice,
  VoiceSettings,
  TTSRequest,
  TTSResponse,
  MusicRequest,
  MusicResponse,
  SFXRequest,
  SFXResponse,
  STTRequest,
  STTResponse,
  STTWord,
  CacheEntry,
  CacheOptions,
  VoiceOverProps,
  BackgroundMusicProps,
  DuckingConfig,
  SoundEffectProps,
  AutoCaptionProps,
  AudioMixerProps,
  UseVoiceOverResult,
  UseBackgroundMusicResult,
  UseAudioDuckingResult,
  UseAudioSyncResult,
  PrerenderTask,
  // PrerenderResult exported from ./pipeline instead (more complete)
  RateLimiterOptions,
  RetryOptions,
} from './types';

export { AudioSkillError, RateLimitError, APIError } from './types';

// Client
export { ElevenLabsClient, getClient, resetClient } from './client';
export { TokenBucketRateLimiter, createDefaultRateLimiter } from './client';
export { withRetry, createRetryWrapper } from './client';

// Services
export { TTSService, getTTSService, resetTTSService } from './services';
export { MusicService, getMusicService, resetMusicService } from './services';
export { SFXService, getSFXService, resetSFXService } from './services';
export { STTService, getSTTService, resetSTTService } from './services';
export type { TTSOptions, MusicOptions, SFXOptions, STTOptions } from './services';

// Cache
export { CacheManager, getCacheManager, resetCacheManager } from './cache';

// Utils
export {
  sha256,
  computeCacheKey,
  computeTTSCacheKey,
  computeMusicCacheKey,
  computeSFXCacheKey,
  computeDuckingCurve,
  computeDuckingCurveExponential,
  getVolumeAtFrame,
  getVolumeFromArray,
  wordsToDuckingSegments,
  createVoiceSegment,
  getAudioDuration,
  getAudioDurationInFrames,
  secondsToFrames,
  framesToSeconds,
  formatDuration,
  formatTimecode,
} from './utils';
export type { DuckingSegment, DuckingCurve, DuckingCurveOptions } from './utils';

// Components
export { VoiceOver } from './components';
export { BackgroundMusic } from './components';
export { SoundEffect } from './components';
export { AutoCaption } from './components';
export { AudioMixer, useMasterVolume, useAudioMixerContext } from './components';

// Hooks
export { useVoiceOver } from './hooks';
export { useBackgroundMusic } from './hooks';
export { useAudioDucking } from './hooks';
export { useAudioSync, useCurrentWord, useHighlightedWords } from './hooks';
export { useVoiceOverRef, isVoiceOverRefInternal } from './hooks';
export type { UseVoiceOverOptions, UseBackgroundMusicOptions, UseAudioDuckingOptions } from './hooks';
export type { VoiceOverRefHandle, VoiceOverRefInternal, SpeechRegion } from './hooks';

// Presets
export {
  VOICE_PRESETS,
  getVoicePreset,
  presetToVoiceSettings,
  isVoicePreset,
  getAvailableVoicePresets,
  MUSIC_PRESETS,
  getMusicPreset,
  isMusicPreset,
  getAvailableMusicPresets,
  SFX_PRESETS,
  getSFXPreset,
  isSFXPreset,
  getAvailableSFXPresets,
} from './presets';
export type {
  VoicePreset,
  VoicePresetName,
  MusicPreset,
  MusicPresetName,
  SFXPreset,
  SFXPresetName,
} from './presets';

// Pipeline
export { prerenderAudio, createSimpleConfig } from './pipeline';
export type {
  PrerenderConfig,
  PrerenderResult,
  VoiceOverConfig,
  BackgroundMusicConfig,
  SoundEffectConfig,
  VoiceOverMeta,
  BackgroundMusicMeta,
  SoundEffectMeta,
  WordAlignment,
} from './pipeline';
