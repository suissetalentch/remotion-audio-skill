// ============================================================================
// Core Configuration Types
// ============================================================================

export interface AudioSkillConfig {
  apiKey: string;
  baseUrl?: string;
  cacheDir?: string;
  cacheTTL?: number; // in days, default 30
  rateLimitPerMinute?: number;
  defaultVoiceId?: string;
  defaultModel?: string;
}

export interface ResolvedConfig extends Required<AudioSkillConfig> {}

// ============================================================================
// ElevenLabs API Types
// ============================================================================

export interface Voice {
  voice_id: string;
  name: string;
  category?: string;
  labels?: Record<string, string>;
  description?: string;
  preview_url?: string;
}

export interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style?: number;
  use_speaker_boost?: boolean;
}

export interface TTSRequest {
  text: string;
  voiceId: string;
  model?: string;
  voiceSettings?: VoiceSettings;
  language?: string;
}

export interface TTSResponse {
  audio: ArrayBuffer;
  contentType: string;
}

export interface MusicRequest {
  prompt: string;
  durationSeconds: number;
  promptInfluence?: number;
}

export interface MusicResponse {
  audio: ArrayBuffer;
  contentType: string;
}

export interface SFXRequest {
  prompt: string;
  durationSeconds?: number;
}

export interface SFXResponse {
  audio: ArrayBuffer;
  contentType: string;
}

export interface STTRequest {
  audio: ArrayBuffer;
  language?: string;
}

export interface STTWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

export interface STTResponse {
  text: string;
  words: STTWord[];
  language?: string;
}

// ============================================================================
// Cache Types
// ============================================================================

export interface CacheEntry<T = ArrayBuffer> {
  data: T;
  createdAt: number;
  expiresAt: number;
  metadata?: Record<string, unknown>;
}

export interface CacheOptions {
  ttl?: number; // in milliseconds
  skipCache?: boolean;
}

// ============================================================================
// Component Props Types
// ============================================================================

export interface VoiceOverProps {
  /** Text to speak (required if src not provided) */
  text: string;
  /** Pre-rendered audio source URL (from calculateMetadata/prerenderAudio). Use staticFile() for local files. */
  src?: string;
  /** Duration in frames (required when using src) */
  durationInFrames?: number;
  voiceId?: string;
  model?: string;
  voiceSettings?: VoiceSettings;
  language?: string;
  from?: number;
  volume?: number;
  playbackRate?: number;
  onDurationChange?: (durationInFrames: number) => void;
  /** Seed for reproducible generation */
  seed?: number;
  /** Previous text for continuity between segments */
  previousText?: string;
  /** Next text for continuity between segments */
  nextText?: string;
  /** Frames to trim from the beginning of the audio */
  trimBefore?: number;
  /** Frames to trim from the end of the audio */
  trimAfter?: number;
  /** Ref to expose VoiceOver metadata to other components */
  ref?: React.Ref<import('./hooks/useVoiceOverRef').VoiceOverRefHandle>;
  /** Preset name to use default voice settings */
  preset?: string;
}

export interface BackgroundMusicProps {
  /** Prompt for music generation (required if src not provided) */
  prompt?: string;
  /** Pre-rendered audio source URL (from calculateMetadata/prerenderAudio). Use staticFile() for local files. */
  src?: string;
  durationSeconds?: number;
  promptInfluence?: number;
  from?: number;
  volume?: number;
  loop?: boolean;
  ducking?: DuckingConfig;
  /** Frames to fade in from 0 to full volume */
  fadeInFrames?: number;
  /** Frames to fade out from full volume to 0 */
  fadeOutFrames?: number;
  /** Preset name for common music styles */
  preset?: string;
}

export interface DuckingConfig {
  enabled: boolean;
  targetVolume?: number; // 0-1, default 0.2
  attackTime?: number; // in frames
  releaseTime?: number; // in frames
  /** Alias for targetVolume (PRD naming) */
  duckTo?: number;
  /** Alias for attackTime (PRD naming) */
  attackFrames?: number;
  /** Alias for releaseTime (PRD naming) */
  releaseFrames?: number;
  /** Reference to VoiceOver for automatic ducking */
  triggerRef?: React.RefObject<import('./hooks/useVoiceOverRef').VoiceOverRefHandle>;
}

export interface SoundEffectProps {
  prompt: string;
  durationSeconds?: number;
  from?: number;
  volume?: number;
}

export interface AutoCaptionProps {
  audioSrc?: string;
  style?: 'word-highlight' | 'sentence' | 'karaoke';
  fontSize?: number;
  fontColor?: string;
  backgroundColor?: string;
  position?: 'top' | 'center' | 'bottom';
  words?: STTWord[];
}

export interface AudioMixerProps {
  children: React.ReactNode;
  masterVolume?: number;
  /** Enable LUFS loudness normalization */
  normalize?: boolean;
  /** Target LUFS level for normalization (default: -14, broadcast standard) */
  targetLUFS?: number;
}

// ============================================================================
// Hook Types
// ============================================================================

export interface UseVoiceOverResult {
  audioSrc: string | null;
  durationInFrames: number;
  isLoading: boolean;
  error: Error | null;
  words: STTWord[];
}

export interface UseBackgroundMusicResult {
  audioSrc: string | null;
  isLoading: boolean;
  error: Error | null;
}

export interface UseAudioDuckingResult {
  volume: number;
  setVoiceActive: (active: boolean) => void;
}

export interface UseAudioSyncResult {
  currentTime: number;
  currentFrame: number;
  isPlaying: boolean;
}

// ============================================================================
// Pipeline Types
// ============================================================================

export interface PrerenderTask {
  type: 'tts' | 'music' | 'sfx';
  request: TTSRequest | MusicRequest | SFXRequest;
  cacheKey: string;
}

export interface PrerenderResult {
  cacheKey: string;
  audioPath: string;
  durationMs: number;
}

// ============================================================================
// Rate Limiter Types
// ============================================================================

export interface RateLimiterOptions {
  tokensPerInterval: number;
  interval: number; // in milliseconds
}

// ============================================================================
// Retry Types
// ============================================================================

export interface RetryOptions {
  maxRetries: number;
  baseDelay: number; // in milliseconds
  maxDelay: number;
  retryableStatusCodes?: number[];
}

// ============================================================================
// Error Types
// ============================================================================

export class AudioSkillError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AudioSkillError';
  }
}

export class RateLimitError extends AudioSkillError {
  constructor(retryAfter?: number) {
    super(
      `Rate limit exceeded. ${retryAfter ? `Retry after ${retryAfter}ms` : ''}`,
      'RATE_LIMIT_EXCEEDED',
      429
    );
    this.name = 'RateLimitError';
  }
}

export class APIError extends AudioSkillError {
  constructor(message: string, statusCode: number, details?: unknown) {
    super(message, 'API_ERROR', statusCode, details);
    this.name = 'APIError';
  }
}
