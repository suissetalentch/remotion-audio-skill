/**
 * Server-side exports (Node.js only)
 * Use this for calculateMetadata, prerendering, and CLI tools
 *
 * Import from 'remotion-audio-skill/server'
 */

// Cache (with fs)
export { CacheManager, getCacheManager, resetCacheManager } from './cache/cache-manager';

// Pipeline (for calculateMetadata)
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
