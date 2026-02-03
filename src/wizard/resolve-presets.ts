/**
 * Resolve Presets - Transform wizard answers into library configuration
 */

import { VIDEO_WIZARD, WizardAnswers } from './video-wizard';

export interface ResolvedConfig {
  voice: {
    preset?: string;
    voiceId?: string;
    language: string;
  };
  music: {
    enabled: boolean;
    preset?: string;
    ducking: boolean;
    duckingConfig?: {
      enabled: boolean;
      duckTo: number;
      attackFrames: number;
      releaseFrames: number;
    };
  };
  captions: {
    enabled: boolean;
    style?: 'word-highlight' | 'sentence' | 'karaoke';
  };
  summary: {
    videoType: string;
    voiceDescription: string;
    musicDescription: string;
    captionsDescription: string;
  };
}

/**
 * Resolves user wizard answers into a complete configuration.
 *
 * @param answers - The answers collected from the wizard questions
 * @returns A resolved configuration ready to use with components
 *
 * @example
 * const answers = {
 *   video_type: 'tutorial',
 *   voice_gender: 'female',
 *   voice_style: 'calm',
 *   language: 'en',
 *   background_music: 'ducking',
 *   music_style: 'lofi',
 *   captions: 'word-highlight'
 * };
 *
 * const config = resolvePresets(answers);
 * // Use config.voice.preset, config.music.preset, etc.
 */
export function resolvePresets(answers: WizardAnswers): ResolvedConfig {
  const {
    video_type = 'tutorial',
    voice_gender = 'any',
    voice_style = 'warm',
    language = 'en',
    background_music = 'ducking',
    music_style = 'lofi',
    captions = 'word-highlight',
  } = answers;

  // Resolve voice preset
  const voiceKey = `${video_type}.${voice_style}`;
  const voicePreset =
    VIDEO_WIZARD.presetMappings.voice[voiceKey] ||
    VIDEO_WIZARD.presetMappings.voice.default;

  // Resolve voice ID based on gender preference
  let voiceId: string | undefined;
  if (voice_gender !== 'any') {
    const genderVoices = VIDEO_WIZARD.presetMappings.voiceIds[voice_gender];
    voiceId = genderVoices[voice_style] || genderVoices.warm;
  }

  // Resolve music preset
  const musicEnabled = background_music !== 'none';
  const musicPreset = musicEnabled
    ? VIDEO_WIZARD.presetMappings.music[music_style]
    : undefined;

  // Resolve ducking config
  const duckingEnabled = background_music === 'ducking';
  const duckingConfig = duckingEnabled
    ? {
        enabled: true,
        duckTo: 0.15,
        attackFrames: 8,
        releaseFrames: 15,
      }
    : undefined;

  // Resolve captions
  const captionsEnabled = captions !== 'none';
  const captionStyle = captionsEnabled
    ? (captions as 'word-highlight' | 'sentence' | 'karaoke')
    : undefined;

  // Build summary for user feedback
  const summary = buildSummary(answers, voicePreset, musicPreset);

  return {
    voice: {
      preset: voicePreset,
      voiceId,
      language,
    },
    music: {
      enabled: musicEnabled,
      preset: musicPreset,
      ducking: duckingEnabled,
      duckingConfig,
    },
    captions: {
      enabled: captionsEnabled,
      style: captionStyle,
    },
    summary,
  };
}

function buildSummary(
  answers: WizardAnswers,
  voicePreset: string,
  _musicPreset?: string
): ResolvedConfig['summary'] {
  const videoTypeLabels: Record<string, string> = {
    tutorial: 'Tutorial / How-to video',
    marketing: 'Marketing / Product demo',
    documentary: 'Documentary / Explainer',
    social: 'Social media content',
    corporate: 'Corporate / Professional',
  };

  const genderLabels: Record<string, string> = {
    female: 'female',
    male: 'male',
    any: 'neutral',
  };

  const styleLabels: Record<string, string> = {
    warm: 'warm and professional',
    energetic: 'energetic and dynamic',
    calm: 'calm and instructional',
    conversational: 'conversational and friendly',
    dramatic: 'dramatic and emotional',
  };

  const musicLabels: Record<string, string> = {
    lofi: 'Lo-fi / Chill beats',
    corporate: 'Corporate / Tech music',
    cinematic: 'Cinematic / Epic soundtrack',
    ambient: 'Ambient / Minimal sounds',
    energetic: 'Energetic / Upbeat music',
  };

  const captionLabels: Record<string, string> = {
    'word-highlight': 'Word-by-word highlighting',
    sentence: 'Full sentence display',
    karaoke: 'Karaoke-style progressive fill',
    none: 'No captions',
  };

  return {
    videoType: videoTypeLabels[answers.video_type || 'tutorial'],
    voiceDescription: `A ${genderLabels[answers.voice_gender || 'any']} voice with a ${styleLabels[answers.voice_style || 'warm']} tone (using "${voicePreset}" preset)`,
    musicDescription: answers.background_music === 'none'
      ? 'No background music'
      : `${musicLabels[answers.music_style || 'lofi']}${answers.background_music === 'ducking' ? ' with auto-ducking' : ''}`,
    captionsDescription: captionLabels[answers.captions || 'word-highlight'],
  };
}

/**
 * Get a human-readable summary of the resolved configuration
 */
export function getConfigSummary(config: ResolvedConfig): string {
  const lines = [
    `Video Type: ${config.summary.videoType}`,
    `Voice: ${config.summary.voiceDescription}`,
    `Language: ${config.voice.language.toUpperCase()}`,
    `Music: ${config.summary.musicDescription}`,
    `Captions: ${config.summary.captionsDescription}`,
  ];

  return lines.join('\n');
}
