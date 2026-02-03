/**
 * Sound effect preset configuration
 */
export interface SFXPreset {
  /** Prompt for SFX generation */
  prompt: string;
  /** Suggested duration in seconds */
  suggestedDuration?: number;
  /** Description of the preset */
  description: string;
}

/**
 * Built-in SFX presets for common use cases
 *
 * These prompts are optimized for ElevenLabs SFX generation API
 * and designed to produce clean, usable sound effects.
 */
export const SFX_PRESETS = {
  /**
   * Smooth whoosh transition sound
   * Best for: Scene transitions, slide changes, reveals
   */
  'transition-whoosh': {
    prompt: 'smooth whoosh transition sound effect, clean swoosh, cinematic, modern, quick',
    suggestedDuration: 1,
    description: 'Smooth whoosh for transitions and reveals',
  },

  /**
   * Clean notification ding
   * Best for: Alerts, notifications, UI feedback
   */
  'notification-ding': {
    prompt: 'clean notification ding bell sound, pleasant, short, app notification, friendly alert',
    suggestedDuration: 0.5,
    description: 'Pleasant notification sound for alerts',
  },

  /**
   * Mechanical keyboard typing
   * Best for: Code demos, typing sequences, tech content
   */
  'typing-keyboard': {
    prompt: 'mechanical keyboard typing sound, clicky keys, computer typing, realistic',
    suggestedDuration: 3,
    description: 'Mechanical keyboard sounds for typing sequences',
  },

  /**
   * Quiet office ambient
   * Best for: Background ambience, workspace scenes
   */
  'ambient-office': {
    prompt: 'quiet office ambient background, subtle air conditioning, distant typing, workplace atmosphere, very quiet',
    suggestedDuration: 30,
    description: 'Quiet office ambience for workplace scenes',
  },

  /**
   * Success achievement fanfare
   * Best for: Achievements, level ups, celebrations
   */
  'success-fanfare': {
    prompt: 'success achievement fanfare sound, triumphant, short celebration, positive completion, game win',
    suggestedDuration: 2,
    description: 'Triumphant fanfare for success moments',
  },

  /**
   * Error/failure sound
   * Best for: Errors, failed actions, negative feedback
   */
  'error-buzz': {
    prompt: 'error buzz sound effect, wrong answer, mistake, failure, short negative feedback',
    suggestedDuration: 0.5,
    description: 'Error sound for failed actions',
  },

  /**
   * Button click
   * Best for: UI interactions, menu selections
   */
  'button-click': {
    prompt: 'clean button click sound, ui interface, menu selection, subtle tap',
    suggestedDuration: 0.3,
    description: 'Clean click for UI interactions',
  },

  /**
   * Page turn
   * Best for: Slide transitions, document navigation
   */
  'page-turn': {
    prompt: 'paper page turn sound effect, book flip, document, subtle',
    suggestedDuration: 0.5,
    description: 'Page turn sound for document transitions',
  },

  /**
   * Pop/bubble sound
   * Best for: Elements appearing, tooltips, notifications
   */
  'pop-bubble': {
    prompt: 'soft pop bubble sound effect, element appearing, friendly, cartoon style, subtle',
    suggestedDuration: 0.3,
    description: 'Soft pop for appearing elements',
  },

  /**
   * Countdown tick
   * Best for: Timers, countdowns, waiting
   */
  'countdown-tick': {
    prompt: 'countdown timer tick sound, clock ticking, anticipation, single tick',
    suggestedDuration: 0.3,
    description: 'Tick sound for countdown timers',
  },

  /**
   * Swipe/slide sound
   * Best for: Card swipes, sliding panels, navigation
   */
  'swipe-slide': {
    prompt: 'smooth swipe slide sound effect, card swipe, panel sliding, mobile gesture',
    suggestedDuration: 0.5,
    description: 'Smooth swipe for sliding animations',
  },

  /**
   * Camera shutter
   * Best for: Screenshots, photo taking, captures
   */
  'camera-shutter': {
    prompt: 'camera shutter click sound, photo capture, screenshot, mechanical camera',
    suggestedDuration: 0.5,
    description: 'Camera shutter for photo/screenshot moments',
  },

  /**
   * Magic sparkle
   * Best for: Highlights, special features, magic moments
   */
  'magic-sparkle': {
    prompt: 'magic sparkle shimmer sound effect, fairy dust, magical highlight, enchanting',
    suggestedDuration: 1,
    description: 'Magical sparkle for special highlights',
  },

  /**
   * Subtle impact
   * Best for: Text reveals, emphasis, landing elements
   */
  'subtle-impact': {
    prompt: 'subtle impact thud sound, soft landing, element arrival, gentle emphasis',
    suggestedDuration: 0.5,
    description: 'Subtle impact for element reveals',
  },

  /**
   * Loading/processing sound
   * Best for: Loading states, processing, waiting
   */
  'loading-process': {
    prompt: 'digital loading processing sound, computer working, data transfer, subtle electronic',
    suggestedDuration: 2,
    description: 'Processing sound for loading states',
  },
} as const;

/**
 * Type for preset names
 */
export type SFXPresetName = keyof typeof SFX_PRESETS;

/**
 * Get SFX preset by name
 */
export function getSFXPreset(presetName: SFXPresetName): SFXPreset {
  return SFX_PRESETS[presetName];
}

/**
 * Check if a string is a valid SFX preset name
 */
export function isSFXPreset(name: string): name is SFXPresetName {
  return name in SFX_PRESETS;
}

/**
 * Get all available SFX preset names
 */
export function getAvailableSFXPresets(): SFXPresetName[] {
  return Object.keys(SFX_PRESETS) as SFXPresetName[];
}
