/**
 * Pipeline types (browser-safe, no fs dependency)
 */

/**
 * Word alignment with frame information
 */
export interface WordAlignment {
  word: string;
  startMs: number;
  endMs: number;
  startFrame: number;
  endFrame: number;
}

/**
 * Voice-over configuration for prerender
 */
export interface VoiceOverConfig {
  /** Unique identifier for this voice-over */
  id: string;
  /** Text to speak */
  text: string;
  /** Start frame (optional, for sequencing) */
  from?: number;
  /** Voice ID or preset name */
  voiceId?: string;
  /** Model to use */
  model?: string;
  /** Language code */
  language?: string;
  /** Voice preset name */
  preset?: string;
}

/**
 * Background music configuration for prerender
 */
export interface BackgroundMusicConfig {
  /** Prompt or preset name */
  prompt: string;
  /** Duration in seconds */
  durationSeconds?: number;
}

/**
 * Sound effect configuration for prerender
 */
export interface SoundEffectConfig {
  /** Unique identifier for this SFX */
  id: string;
  /** Prompt or preset name */
  prompt: string;
  /** Start frame */
  from: number;
  /** Duration in seconds (optional) */
  durationSeconds?: number;
}

/**
 * Prerender configuration
 */
export interface PrerenderConfig {
  /** Frames per second */
  fps: number;
  /** Voice-over configurations */
  voiceOvers?: VoiceOverConfig[];
  /** Background music configuration */
  backgroundMusic?: BackgroundMusicConfig;
  /** Sound effect configurations */
  soundEffects?: SoundEffectConfig[];
}

/**
 * Voice-over metadata result
 */
export interface VoiceOverMeta {
  /** Audio source URL or path */
  src: string;
  /** Duration in frames */
  durationFrames: number;
  /** Duration in milliseconds */
  durationMs: number;
  /** Word-level transcription */
  transcription: WordAlignment[];
}

/**
 * Background music metadata result
 */
export interface BackgroundMusicMeta {
  /** Audio source URL or path */
  src: string;
  /** Duration in frames */
  durationFrames: number;
  /** Duration in milliseconds */
  durationMs: number;
}

/**
 * Sound effect metadata result
 */
export interface SoundEffectMeta {
  /** Audio source URL or path */
  src: string;
  /** Duration in frames */
  durationFrames: number;
  /** Duration in milliseconds */
  durationMs: number;
}

/**
 * Complete prerender result
 */
export interface PrerenderResult {
  /** Total duration in frames (based on longest audio + padding) */
  totalDurationFrames: number;
  /** Audio metadata organized by type */
  audioMeta: {
    /** Voice-overs keyed by id */
    voiceOvers: Record<string, VoiceOverMeta>;
    /** Background music (if configured) */
    backgroundMusic: BackgroundMusicMeta | null;
    /** Sound effects keyed by id */
    soundEffects: Record<string, SoundEffectMeta>;
  };
}
