import { getClient, ElevenLabsClient } from '../client';
import { MusicRequest, MusicResponse, AudioSkillError } from '../types';

export interface MusicOptions {
  durationSeconds?: number;
  promptInfluence?: number;
}

const DEFAULT_DURATION = 30;
const MIN_DURATION = 5;
const MAX_DURATION = 300;

export class MusicService {
  private client: ElevenLabsClient;

  constructor(client?: ElevenLabsClient) {
    this.client = client ?? getClient();
  }

  /**
   * Generate background music from a prompt
   */
  async generateMusic(prompt: string, options: MusicOptions = {}): Promise<MusicResponse> {
    if (!prompt || prompt.trim().length === 0) {
      throw new AudioSkillError('Music prompt cannot be empty', 'INVALID_INPUT');
    }

    const duration = options.durationSeconds ?? DEFAULT_DURATION;

    if (duration < MIN_DURATION || duration > MAX_DURATION) {
      throw new AudioSkillError(
        `Duration must be between ${MIN_DURATION} and ${MAX_DURATION} seconds`,
        'INVALID_INPUT'
      );
    }

    const request: MusicRequest = {
      prompt: prompt.trim(),
      durationSeconds: duration,
      promptInfluence: options.promptInfluence ?? 0.5,
    };

    return this.client.generateMusic(request);
  }

  /**
   * Generate music and return as base64 data URL
   */
  async generateMusicAsDataUrl(
    prompt: string,
    options: MusicOptions = {}
  ): Promise<string> {
    const response = await this.generateMusic(prompt, options);
    const base64 = arrayBufferToBase64(response.audio);
    return `data:${response.contentType};base64,${base64}`;
  }

  /**
   * Generate music and return as Blob URL
   */
  async generateMusicAsBlobUrl(
    prompt: string,
    options: MusicOptions = {}
  ): Promise<string> {
    const response = await this.generateMusic(prompt, options);
    const blob = new Blob([response.audio], { type: response.contentType });
    return URL.createObjectURL(blob);
  }

  /**
   * Generate loopable ambient music
   * This generates music optimized for looping in background
   */
  async generateAmbientLoop(
    mood: string,
    durationSeconds: number = 30
  ): Promise<MusicResponse> {
    const prompt = `ambient ${mood} music, seamless loop, no sudden changes, consistent tempo`;
    return this.generateMusic(prompt, {
      durationSeconds,
      promptInfluence: 0.7,
    });
  }
}

/**
 * Convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Singleton instance
let serviceInstance: MusicService | null = null;

export function getMusicService(): MusicService {
  if (!serviceInstance) {
    serviceInstance = new MusicService();
  }
  return serviceInstance;
}

export function resetMusicService(): void {
  serviceInstance = null;
}
