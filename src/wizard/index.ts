/**
 * Video Wizard Module
 *
 * This module provides an AI-assisted configuration system for remotion-audio-skill.
 * Instead of requiring users to understand technical parameters, an AI assistant
 * can read the wizard configuration and ask simple questions about the user's intent.
 *
 * ## How it works:
 *
 * 1. AI reads VIDEO_WIZARD.questions to know what to ask
 * 2. User answers simple questions (video type, voice preference, etc.)
 * 3. AI calls resolvePresets() with the answers
 * 4. AI uses generateComponentCode() to create ready-to-use code
 *
 * ## Example AI flow:
 *
 * ```
 * AI: "What type of video are you creating?"
 * User: "A tutorial"
 *
 * AI: "What type of voice do you prefer?"
 * User: "Female, calm"
 *
 * AI: "Do you want background music?"
 * User: "Yes, with auto-ducking, lo-fi style"
 *
 * AI: "Do you want captions?"
 * User: "Yes, word-by-word highlighting"
 *
 * // AI generates code with correct presets
 * ```
 */

// Main wizard configuration
export {
  VIDEO_WIZARD,
  type WizardQuestion,
  type WizardOption,
  type WizardAnswers,
  type VideoWizardConfig,
  shouldShowQuestion,
  getActiveQuestions,
} from './video-wizard';

// Preset resolution
export {
  resolvePresets,
  getConfigSummary,
  type ResolvedConfig,
} from './resolve-presets';

// Code generation
export {
  generateComponentCode,
  generateConfigSnippet,
  generatePropsObject,
  type GenerateOptions,
} from './code-generator';
