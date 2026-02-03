import { AudioSkillConfig, ResolvedConfig, AudioSkillError } from './types';

let globalConfig: ResolvedConfig | null = null;

const DEFAULT_CONFIG: Omit<ResolvedConfig, 'apiKey'> = {
  baseUrl: 'https://api.elevenlabs.io/v1',
  cacheDir: '.remotion-audio-cache',
  cacheTTL: 30,
  rateLimitPerMinute: 100,
  defaultVoiceId: 'EXAVITQu4vr4xnSDxMaL', // aria
  defaultModel: 'eleven_multilingual_v2',
};

/**
 * Configure the audio skill with ElevenLabs API credentials
 */
export function configureAudioSkill(config: AudioSkillConfig): ResolvedConfig {
  if (!config.apiKey) {
    throw new AudioSkillError(
      'API key is required. Set ELEVENLABS_API_KEY environment variable or pass apiKey in config.',
      'MISSING_API_KEY'
    );
  }

  globalConfig = {
    apiKey: config.apiKey,
    baseUrl: config.baseUrl ?? DEFAULT_CONFIG.baseUrl,
    cacheDir: config.cacheDir ?? DEFAULT_CONFIG.cacheDir,
    cacheTTL: config.cacheTTL ?? DEFAULT_CONFIG.cacheTTL,
    rateLimitPerMinute: config.rateLimitPerMinute ?? DEFAULT_CONFIG.rateLimitPerMinute,
    defaultVoiceId: config.defaultVoiceId ?? DEFAULT_CONFIG.defaultVoiceId,
    defaultModel: config.defaultModel ?? DEFAULT_CONFIG.defaultModel,
  };

  return globalConfig;
}

/**
 * Get the current configuration
 */
export function getConfig(): ResolvedConfig {
  if (!globalConfig) {
    // Try to auto-configure from environment
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (apiKey) {
      return configureAudioSkill({ apiKey });
    }
    throw new AudioSkillError(
      'Audio skill not configured. Call configureAudioSkill() first or set ELEVENLABS_API_KEY.',
      'NOT_CONFIGURED'
    );
  }
  return globalConfig;
}

/**
 * Reset configuration (mainly for testing)
 */
export function resetConfig(): void {
  globalConfig = null;
}

/**
 * Check if the skill is configured
 */
export function isConfigured(): boolean {
  return globalConfig !== null || !!process.env.ELEVENLABS_API_KEY;
}
