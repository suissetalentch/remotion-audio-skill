/**
 * Music preset configuration
 */
export interface MusicPreset {
  /** Prompt for music generation */
  prompt: string;
  /** Suggested duration in seconds */
  suggestedDuration?: number;
  /** Description of the preset */
  description: string;
}

/**
 * Built-in music presets for common use cases
 *
 * These prompts are optimized for ElevenLabs music generation API
 * and designed to produce consistent, high-quality background music.
 */
export const MUSIC_PRESETS = {
  /**
   * Upbeat corporate technology music
   * Best for: Tech demos, product videos, SaaS content
   */
  'tech-corporate': {
    prompt: 'upbeat corporate technology background music, modern electronic, optimistic, clean production, subtle synths',
    suggestedDuration: 120,
    description: 'Upbeat tech/corporate background for product demos',
  },

  /**
   * Relaxed lo-fi hip hop beats
   * Best for: Tutorials, study videos, chill content
   */
  'lofi-chill': {
    prompt: 'lo-fi chill hip hop beats, relaxing, vinyl crackle, jazzy piano chords, mellow drums, nostalgic',
    suggestedDuration: 180,
    description: 'Relaxed lo-fi beats for tutorials and chill content',
  },

  /**
   * Epic cinematic orchestral music
   * Best for: Trailers, dramatic reveals, storytelling
   */
  'cinematic-epic': {
    prompt: 'epic cinematic orchestral dramatic music, sweeping strings, powerful brass, emotional, building tension, movie trailer',
    suggestedDuration: 90,
    description: 'Dramatic orchestral music for trailers and reveals',
  },

  /**
   * Calm tutorial background
   * Best for: How-to videos, educational content, walkthroughs
   */
  'tutorial-calm': {
    prompt: 'calm tutorial background music, soft ambient, gentle piano, minimal, unobtrusive, educational',
    suggestedDuration: 300,
    description: 'Calm ambient music for tutorials and education',
  },

  /**
   * Energetic pop/electronic
   * Best for: Marketing, social media, upbeat announcements
   */
  'energetic-pop': {
    prompt: 'energetic pop electronic music, upbeat, catchy rhythm, modern production, positive vibes, social media',
    suggestedDuration: 60,
    description: 'Energetic pop for marketing and social media',
  },

  /**
   * Minimal ambient soundscape
   * Best for: Focus content, meditation, background noise
   */
  'ambient-minimal': {
    prompt: 'minimal ambient soundscape, atmospheric pads, space, ethereal, meditation, very quiet and subtle',
    suggestedDuration: 300,
    description: 'Minimal ambient for focus and meditation content',
  },

  /**
   * Acoustic guitar chill
   * Best for: Lifestyle content, vlogs, warm storytelling
   */
  'acoustic-warm': {
    prompt: 'acoustic guitar warm background music, folk inspired, gentle strumming, cozy, intimate, heartfelt',
    suggestedDuration: 120,
    description: 'Warm acoustic guitar for lifestyle and vlogs',
  },

  /**
   * News/documentary style
   * Best for: News segments, documentaries, serious topics
   */
  'news-documentary': {
    prompt: 'news documentary background music, professional, subtle tension, informative, neutral tone, broadcast quality',
    suggestedDuration: 120,
    description: 'Professional background for news and documentaries',
  },

  /**
   * Retro synthwave
   * Best for: Gaming content, retro-themed videos, 80s vibe
   */
  'retro-synthwave': {
    prompt: 'retro synthwave music, 80s inspired, analog synths, neon vibes, nostalgic electronic, driving beat',
    suggestedDuration: 120,
    description: 'Retro synthwave for gaming and 80s-themed content',
  },

  /**
   * Inspirational corporate
   * Best for: Motivational content, success stories, achievements
   */
  'inspirational': {
    prompt: 'inspirational corporate music, uplifting, motivational, building momentum, positive achievement, success',
    suggestedDuration: 90,
    description: 'Inspirational music for motivational content',
  },
} as const;

/**
 * Type for preset names
 */
export type MusicPresetName = keyof typeof MUSIC_PRESETS;

/**
 * Get music preset by name
 */
export function getMusicPreset(presetName: MusicPresetName): MusicPreset {
  return MUSIC_PRESETS[presetName];
}

/**
 * Check if a string is a valid music preset name
 */
export function isMusicPreset(name: string): name is MusicPresetName {
  return name in MUSIC_PRESETS;
}

/**
 * Get all available music preset names
 */
export function getAvailableMusicPresets(): MusicPresetName[] {
  return Object.keys(MUSIC_PRESETS) as MusicPresetName[];
}
