import { STTWord } from '../types';
import { getTTSService } from '../services/tts.service';
import { getMusicService } from '../services/music.service';
import { getSFXService } from '../services/sfx.service';
import { getSTTService } from '../services/stt.service';
import { getCacheManager } from '../cache/cache-manager';
import { computeTTSCacheKey, computeMusicCacheKey, computeSFXCacheKey } from '../utils/hash';
import { isVoicePreset, getVoicePreset, presetToVoiceSettings } from '../presets/voice-presets';
import { isMusicPreset, getMusicPreset } from '../presets/music-presets';
import { isSFXPreset, getSFXPreset } from '../presets/sfx-presets';
import { getConfig } from '../config';

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
    backgroundMusic?: BackgroundMusicMeta;
    /** Sound effects keyed by id */
    soundEffects: Record<string, SoundEffectMeta>;
  };
}

/**
 * Convert STTWord to WordAlignment with frame information
 */
function toWordAlignment(word: STTWord, fps: number): WordAlignment {
  return {
    word: word.word,
    startMs: word.start * 1000,
    endMs: word.end * 1000,
    startFrame: Math.floor(word.start * fps),
    endFrame: Math.ceil(word.end * fps),
  };
}

/**
 * Get audio duration from ArrayBuffer
 * Note: This is a simplified version that estimates duration from file size
 * For accurate duration, the audio should be decoded
 */
async function estimateAudioDuration(buffer: ArrayBuffer, _contentType: string = 'audio/mpeg'): Promise<number> {
  // For MP3 at 128kbps: 1 second ≈ 16KB
  // This is a rough estimate; in production, use Web Audio API to decode
  const bytes = buffer.byteLength;
  const bitrate = 128000; // 128kbps
  const durationSeconds = (bytes * 8) / bitrate;
  return durationSeconds * 1000; // Return milliseconds
}

/**
 * Pre-render all audio for a Remotion composition
 *
 * This function should be called in calculateMetadata to generate
 * all audio before rendering begins. It handles:
 * - TTS generation with caching
 * - Music generation with caching
 * - SFX generation with caching
 * - Transcription for subtitles
 *
 * @example
 * ```tsx
 * <Composition
 *   id="demo"
 *   calculateMetadata={async ({ props }) => {
 *     const result = await prerenderAudio({
 *       fps: 30,
 *       voiceOvers: [
 *         { id: 'intro', text: 'Welcome to the demo.' },
 *         { id: 'outro', text: 'Thanks for watching.' },
 *       ],
 *       backgroundMusic: { prompt: 'tech-corporate' },
 *       soundEffects: [
 *         { id: 'whoosh', prompt: 'transition-whoosh', from: 0 },
 *       ],
 *     });
 *     return {
 *       durationInFrames: result.totalDurationFrames,
 *       props: { ...props, audioMeta: result.audioMeta },
 *     };
 *   }}
 * />
 * ```
 */
export async function prerenderAudio(config: PrerenderConfig): Promise<PrerenderResult> {
  const { fps, voiceOvers = [], backgroundMusic, soundEffects = [] } = config;
  const globalConfig = getConfig();
  const cacheManager = getCacheManager();

  const result: PrerenderResult = {
    totalDurationFrames: 0,
    audioMeta: {
      voiceOvers: {},
      soundEffects: {},
    },
  };

  // Track maximum end frame for total duration calculation
  let maxEndFrame = 0;

  // Process voice-overs in parallel
  const voiceOverPromises = voiceOvers.map(async (vo) => {
    const ttsService = getTTSService();
    const sttService = getSTTService();

    // Resolve preset if specified
    let voiceId = vo.voiceId || globalConfig.defaultVoiceId;
    let voiceSettings = undefined;

    if (vo.preset && isVoicePreset(vo.preset)) {
      const preset = getVoicePreset(vo.preset);
      voiceId = preset.voiceId;
      voiceSettings = presetToVoiceSettings(preset);
    }

    const model = vo.model || globalConfig.defaultModel;

    // Check cache
    const cacheKey = computeTTSCacheKey(vo.text, voiceId, model, vo.language, voiceSettings as Record<string, unknown> | undefined);
    let audioBuffer = await cacheManager.get(cacheKey);

    if (!audioBuffer) {
      const response = await ttsService.generateSpeech(vo.text, {
        voiceId,
        model,
        voiceSettings,
        language: vo.language,
      });
      audioBuffer = response.audio;
      await cacheManager.set(cacheKey, audioBuffer);
    }

    // Get duration
    const durationMs = await estimateAudioDuration(audioBuffer);
    const durationFrames = Math.ceil((durationMs / 1000) * fps);

    // Transcribe for word timing
    let transcription: WordAlignment[] = [];
    try {
      const sttResult = await sttService.transcribe(audioBuffer, { language: vo.language });
      transcription = sttResult.words.map((w) => toWordAlignment(w, fps));
    } catch {
      // Transcription is optional
      console.warn(`Transcription failed for voice-over "${vo.id}"`);
    }

    // Create blob URL for the audio
    const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
    const src = URL.createObjectURL(blob);

    const meta: VoiceOverMeta = {
      src,
      durationFrames,
      durationMs,
      transcription,
    };

    // Update max end frame
    const startFrame = vo.from ?? 0;
    const endFrame = startFrame + durationFrames;
    maxEndFrame = Math.max(maxEndFrame, endFrame);

    return { id: vo.id, meta };
  });

  // Process background music
  let musicPromise: Promise<BackgroundMusicMeta | null> | null = null;
  if (backgroundMusic) {
    musicPromise = (async () => {
      const musicService = getMusicService();

      // Resolve preset
      let prompt = backgroundMusic.prompt;
      let duration = backgroundMusic.durationSeconds ?? 30;

      if (isMusicPreset(prompt)) {
        const preset = getMusicPreset(prompt);
        prompt = preset.prompt;
        duration = backgroundMusic.durationSeconds ?? preset.suggestedDuration ?? 30;
      }

      // Check cache
      const cacheKey = computeMusicCacheKey(prompt, duration, 0.5);
      let audioBuffer = await cacheManager.get(cacheKey);

      if (!audioBuffer) {
        const response = await musicService.generateMusic(prompt, {
          durationSeconds: duration,
          promptInfluence: 0.5,
        });
        audioBuffer = response.audio;
        await cacheManager.set(cacheKey, audioBuffer);
      }

      const durationMs = await estimateAudioDuration(audioBuffer);
      const durationFrames = Math.ceil((durationMs / 1000) * fps);

      const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
      const src = URL.createObjectURL(blob);

      maxEndFrame = Math.max(maxEndFrame, durationFrames);

      return {
        src,
        durationFrames,
        durationMs,
      };
    })();
  }

  // Process sound effects in parallel
  const sfxPromises = soundEffects.map(async (sfx) => {
    const sfxService = getSFXService();

    // Resolve preset
    let prompt = sfx.prompt;
    let duration = sfx.durationSeconds;

    if (isSFXPreset(prompt)) {
      const preset = getSFXPreset(prompt);
      prompt = preset.prompt;
      duration = sfx.durationSeconds ?? preset.suggestedDuration;
    }

    // Check cache
    const cacheKey = computeSFXCacheKey(prompt, duration);
    let audioBuffer = await cacheManager.get(cacheKey);

    if (!audioBuffer) {
      const response = await sfxService.generateSFX(prompt, {
        durationSeconds: duration,
      });
      audioBuffer = response.audio;
      await cacheManager.set(cacheKey, audioBuffer);
    }

    const durationMs = await estimateAudioDuration(audioBuffer);
    const durationFrames = Math.ceil((durationMs / 1000) * fps);

    const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
    const src = URL.createObjectURL(blob);

    const endFrame = sfx.from + durationFrames;
    maxEndFrame = Math.max(maxEndFrame, endFrame);

    return {
      id: sfx.id,
      meta: {
        src,
        durationFrames,
        durationMs,
      },
    };
  });

  // Wait for all audio generation to complete
  const [voiceOverResults, musicResult, sfxResults] = await Promise.all([
    Promise.all(voiceOverPromises),
    musicPromise,
    Promise.all(sfxPromises),
  ]);

  // Populate results
  for (const vo of voiceOverResults) {
    result.audioMeta.voiceOvers[vo.id] = vo.meta;
  }

  if (musicResult) {
    result.audioMeta.backgroundMusic = musicResult;
  }

  for (const sfx of sfxResults) {
    result.audioMeta.soundEffects[sfx.id] = sfx.meta;
  }

  // Set total duration with a small buffer
  result.totalDurationFrames = maxEndFrame + Math.round(fps * 0.5); // Add 0.5 second buffer

  return result;
}

/**
 * Create a simple prerender config from voice-over text segments
 */
export function createSimpleConfig(
  segments: Array<{ id: string; text: string }>,
  options: {
    fps?: number;
    backgroundMusic?: string;
    voicePreset?: string;
  } = {}
): PrerenderConfig {
  const { fps = 30, backgroundMusic, voicePreset } = options;

  return {
    fps,
    voiceOvers: segments.map((seg) => ({
      id: seg.id,
      text: seg.text,
      preset: voicePreset,
    })),
    backgroundMusic: backgroundMusic ? { prompt: backgroundMusic } : undefined,
  };
}
