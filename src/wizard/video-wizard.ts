/**
 * Video Wizard - Interactive prompts for AI-assisted video configuration
 *
 * This file defines the questions an AI assistant should ask when helping
 * a user create a video with remotion-audio-skill. Instead of asking for
 * technical parameters, the AI asks about the user's intent and maps
 * responses to appropriate presets.
 *
 * Usage with Claude or other LLMs:
 * 1. Read VIDEO_WIZARD.questions
 * 2. Ask each question to the user
 * 3. Use resolvePresets() to get the configuration
 * 4. Use generateComponentCode() to create the component
 */

export interface WizardQuestion {
  id: string;
  question: string;
  description?: string;
  options: WizardOption[];
  condition?: {
    field: string;
    equals?: string;
    notEquals?: string;
  };
}

export interface WizardOption {
  label: string;
  value: string;
  description?: string;
}

export interface WizardAnswers {
  video_type?: 'tutorial' | 'marketing' | 'documentary' | 'social' | 'corporate';
  voice_gender?: 'female' | 'male' | 'any';
  voice_style?: 'warm' | 'energetic' | 'calm' | 'conversational' | 'dramatic';
  language?: string;
  background_music?: 'ducking' | 'constant' | 'none';
  music_style?: 'lofi' | 'corporate' | 'cinematic' | 'ambient' | 'energetic';
  captions?: 'word-highlight' | 'sentence' | 'karaoke' | 'none';
}

export interface VideoWizardConfig {
  questions: WizardQuestion[];
  presetMappings: {
    voice: Record<string, string>;
    music: Record<string, string>;
    voiceIds: {
      female: Record<string, string>;
      male: Record<string, string>;
    };
  };
  defaults: {
    voicePreset: string;
    musicPreset: string;
    captionStyle: string;
  };
}

/**
 * The main wizard configuration.
 * AI assistants should read this to know what questions to ask.
 */
export const VIDEO_WIZARD: VideoWizardConfig = {
  questions: [
    {
      id: 'video_type',
      question: 'What type of video are you creating?',
      description: 'This helps choose the right voice tone and music style',
      options: [
        {
          label: 'Tutorial / How-to',
          value: 'tutorial',
          description: 'Educational content, step-by-step guides',
        },
        {
          label: 'Marketing / Product demo',
          value: 'marketing',
          description: 'Product showcases, promotional content',
        },
        {
          label: 'Documentary / Explainer',
          value: 'documentary',
          description: 'Informative content, storytelling',
        },
        {
          label: 'Social media content',
          value: 'social',
          description: 'Short-form content, reels, TikTok',
        },
        {
          label: 'Corporate / Professional',
          value: 'corporate',
          description: 'Business presentations, internal comms',
        },
      ],
    },
    {
      id: 'voice_gender',
      question: 'What type of voice do you prefer?',
      options: [
        { label: 'Female voice', value: 'female' },
        { label: 'Male voice', value: 'male' },
        { label: 'No preference', value: 'any' },
      ],
    },
    {
      id: 'voice_style',
      question: 'What voice style fits your content?',
      description: 'The tone and energy of the narration',
      options: [
        {
          label: 'Warm & Professional',
          value: 'warm',
          description: 'Trustworthy, documentary-style',
        },
        {
          label: 'Energetic & Dynamic',
          value: 'energetic',
          description: 'Exciting, promotional tone',
        },
        {
          label: 'Calm & Instructional',
          value: 'calm',
          description: 'Clear, educational tone',
        },
        {
          label: 'Conversational & Friendly',
          value: 'conversational',
          description: 'Casual, approachable tone',
        },
        {
          label: 'Dramatic & Emotional',
          value: 'dramatic',
          description: 'Impactful, storytelling tone',
        },
      ],
    },
    {
      id: 'language',
      question: 'What language for the voice-over?',
      options: [
        { label: 'English', value: 'en' },
        { label: 'French', value: 'fr' },
        { label: 'German', value: 'de' },
        { label: 'Spanish', value: 'es' },
        { label: 'Italian', value: 'it' },
        { label: 'Portuguese', value: 'pt' },
        { label: 'Japanese', value: 'ja' },
        { label: 'Chinese', value: 'zh' },
        { label: 'Korean', value: 'ko' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      id: 'background_music',
      question: 'Do you want background music?',
      options: [
        {
          label: 'Yes, with auto-ducking',
          value: 'ducking',
          description: 'Music volume lowers automatically during speech (recommended)',
        },
        {
          label: 'Yes, constant volume',
          value: 'constant',
          description: 'Music plays at the same volume throughout',
        },
        {
          label: 'No background music',
          value: 'none',
        },
      ],
    },
    {
      id: 'music_style',
      question: 'What music style?',
      condition: { field: 'background_music', notEquals: 'none' },
      options: [
        {
          label: 'Lo-fi / Chill',
          value: 'lofi',
          description: 'Relaxed beats, great for tutorials',
        },
        {
          label: 'Corporate / Tech',
          value: 'corporate',
          description: 'Modern, professional feel',
        },
        {
          label: 'Cinematic / Epic',
          value: 'cinematic',
          description: 'Dramatic, impactful',
        },
        {
          label: 'Ambient / Minimal',
          value: 'ambient',
          description: 'Subtle, unobtrusive',
        },
        {
          label: 'Energetic / Upbeat',
          value: 'energetic',
          description: 'High energy, motivating',
        },
      ],
    },
    {
      id: 'captions',
      question: 'Do you want synchronized captions?',
      description: 'Captions are generated automatically from the voice-over',
      options: [
        {
          label: 'Word-by-word highlight',
          value: 'word-highlight',
          description: 'Each word highlights as it\'s spoken (recommended)',
        },
        {
          label: 'Full sentences',
          value: 'sentence',
          description: 'Shows complete sentences',
        },
        {
          label: 'Karaoke style',
          value: 'karaoke',
          description: 'Progressive fill effect',
        },
        {
          label: 'No captions',
          value: 'none',
        },
      ],
    },
  ],

  /**
   * Maps user choices to library presets.
   * Format: 'video_type.voice_style' -> preset name
   */
  presetMappings: {
    voice: {
      // Tutorial combinations
      'tutorial.calm': 'tutorial',
      'tutorial.warm': 'narrator-warm',
      'tutorial.conversational': 'conversational',
      'tutorial.energetic': 'narrator-energetic',
      'tutorial.dramatic': 'dramatic',

      // Marketing combinations
      'marketing.energetic': 'narrator-energetic',
      'marketing.warm': 'narrator-warm',
      'marketing.dramatic': 'dramatic',
      'marketing.conversational': 'conversational',
      'marketing.calm': 'tutorial',

      // Documentary combinations
      'documentary.warm': 'narrator-warm',
      'documentary.dramatic': 'dramatic',
      'documentary.calm': 'narrator-warm',
      'documentary.conversational': 'conversational',
      'documentary.energetic': 'narrator-energetic',

      // Social media combinations
      'social.conversational': 'conversational',
      'social.energetic': 'narrator-energetic',
      'social.warm': 'friendly',
      'social.calm': 'conversational',
      'social.dramatic': 'dramatic',

      // Corporate combinations
      'corporate.warm': 'narrator-warm',
      'corporate.calm': 'news-anchor',
      'corporate.conversational': 'conversational',
      'corporate.energetic': 'narrator-energetic',
      'corporate.dramatic': 'dramatic',

      // Default fallback
      default: 'narrator-warm',
    },

    music: {
      lofi: 'lofi-chill',
      corporate: 'tech-corporate',
      cinematic: 'cinematic-epic',
      ambient: 'ambient-minimal',
      energetic: 'energetic-pop',
    },

    /**
     * Voice IDs by gender preference.
     * These are ElevenLabs voice IDs for common use cases.
     */
    voiceIds: {
      female: {
        warm: 'EXAVITQu4vr4xnSDxMaL', // Sarah
        energetic: 'jBpfuIE2acCO8z3wKNLl', // Aria
        calm: 'FGY2WhTYpPnrIDTdsKH5', // Laura
        conversational: 'XB0fDUnXU5powFXDhCwa', // Charlotte
        dramatic: 'pFZP5JQG7iQjIQuC4Bku', // Lily
      },
      male: {
        warm: 'TX3LPaxmHKxFdv7VOQHJ', // Liam
        energetic: 'CwhRBWXzGAHq8TQ4Fs17', // Roger
        calm: 'bIHbv24MWmeRgasZH58o', // Will
        conversational: 'iP95p4xoKVk53GoZ742B', // Chris
        dramatic: 'N2lVS1w4EtoT3dr4eOWO', // Callum
      },
    },
  },

  defaults: {
    voicePreset: 'narrator-warm',
    musicPreset: 'lofi-chill',
    captionStyle: 'word-highlight',
  },
};

/**
 * Helper to check if a question should be shown based on conditions
 */
export function shouldShowQuestion(
  question: WizardQuestion,
  answers: WizardAnswers
): boolean {
  if (!question.condition) return true;

  const { field, equals, notEquals } = question.condition;
  const value = answers[field as keyof WizardAnswers];

  if (equals !== undefined) {
    return value === equals;
  }
  if (notEquals !== undefined) {
    return value !== notEquals;
  }

  return true;
}

/**
 * Get all questions that should be asked based on current answers
 */
export function getActiveQuestions(answers: WizardAnswers = {}): WizardQuestion[] {
  return VIDEO_WIZARD.questions.filter((q) => shouldShowQuestion(q, answers));
}
