import { VoiceSettings } from '../types';

/**
 * Voice preset configuration
 */
export interface VoicePreset {
  /** ElevenLabs voice ID */
  voiceId: string;
  /** Stability (0-1): Higher = more consistent, lower = more expressive */
  stability: number;
  /** Similarity boost (0-1): Higher = closer to original voice */
  similarityBoost: number;
  /** Style (0-1): Amount of style exaggeration */
  style?: number;
  /** Description of the preset */
  description: string;
}

/**
 * Built-in voice presets for common use cases
 *
 * These presets are designed for ElevenLabs voices and optimized
 * for different content types (narration, tutorial, dramatic, etc.)
 */
export const VOICE_PRESETS = {
  /**
   * Warm, professional narrator voice
   * Best for: Documentaries, explainer videos, corporate content
   */
  'narrator-warm': {
    voiceId: 'EXAVITQu4vr4xnSDxMaL', // Sarah
    stability: 0.6,
    similarityBoost: 0.8,
    description: 'Warm, professional narrator for documentaries and explainers',
  },

  /**
   * Energetic narrator with more expression
   * Best for: Marketing videos, product launches, upbeat content
   */
  'narrator-energetic': {
    voiceId: 'EXAVITQu4vr4xnSDxMaL', // Sarah
    stability: 0.4,
    similarityBoost: 0.7,
    style: 0.3,
    description: 'Energetic narrator for marketing and upbeat content',
  },

  /**
   * Natural conversational tone
   * Best for: Podcasts, interviews, casual content
   */
  'conversational': {
    voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel
    stability: 0.5,
    similarityBoost: 0.75,
    description: 'Natural conversational tone for podcasts and casual content',
  },

  /**
   * Dramatic voice with strong emotion
   * Best for: Movie trailers, dramatic content, storytelling
   */
  'dramatic': {
    voiceId: 'VR6AewLTigWG4xSOukaG', // Arnold
    stability: 0.7,
    similarityBoost: 0.9,
    style: 0.5,
    description: 'Dramatic voice for trailers and storytelling',
  },

  /**
   * Clear, instructional voice
   * Best for: Tutorials, educational content, how-to videos
   */
  'tutorial': {
    voiceId: 'pNInz6obpgDQGcFmaJgB', // Adam
    stability: 0.65,
    similarityBoost: 0.8,
    description: 'Clear instructional voice for tutorials and education',
  },

  /**
   * Friendly, approachable voice
   * Best for: Customer service, onboarding, welcome messages
   */
  'friendly': {
    voiceId: 'MF3mGyEYCl7XYWbV9V6O', // Emily
    stability: 0.55,
    similarityBoost: 0.75,
    style: 0.2,
    description: 'Friendly voice for customer service and onboarding',
  },

  /**
   * Professional news anchor style
   * Best for: News, reports, formal announcements
   */
  'news-anchor': {
    voiceId: 'onwK4e9ZLuTAKqWW03F9', // Daniel
    stability: 0.75,
    similarityBoost: 0.85,
    description: 'Professional news anchor for formal content',
  },
} as const;

/**
 * Type for preset names
 */
export type VoicePresetName = keyof typeof VOICE_PRESETS;

/**
 * Get voice settings from a preset name
 */
export function getVoicePreset(presetName: VoicePresetName): VoicePreset {
  return VOICE_PRESETS[presetName];
}

/**
 * Convert a voice preset to VoiceSettings format
 */
export function presetToVoiceSettings(preset: VoicePreset): VoiceSettings {
  return {
    stability: preset.stability,
    similarity_boost: preset.similarityBoost,
    style: preset.style,
  };
}

/**
 * Check if a string is a valid voice preset name
 */
export function isVoicePreset(name: string): name is VoicePresetName {
  return name in VOICE_PRESETS;
}

/**
 * Get all available voice preset names
 */
export function getAvailableVoicePresets(): VoicePresetName[] {
  return Object.keys(VOICE_PRESETS) as VoicePresetName[];
}
