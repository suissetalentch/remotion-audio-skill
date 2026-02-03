import { getClient, ElevenLabsClient } from '../client';
import { SFXRequest, SFXResponse, AudioSkillError } from '../types';

export interface SFXOptions {
  durationSeconds?: number;
}

const DEFAULT_DURATION = 2;
const MIN_DURATION = 0.5;
const MAX_DURATION = 22;

export class SFXService {
  private client: ElevenLabsClient;

  constructor(client?: ElevenLabsClient) {
    this.client = client ?? getClient();
  }

  /**
   * Generate sound effect from a prompt
   */
  async generateSFX(prompt: string, options: SFXOptions = {}): Promise<SFXResponse> {
    if (!prompt || prompt.trim().length === 0) {
      throw new AudioSkillError('SFX prompt cannot be empty', 'INVALID_INPUT');
    }

    const duration = options.durationSeconds ?? DEFAULT_DURATION;

    if (duration < MIN_DURATION || duration > MAX_DURATION) {
      throw new AudioSkillError(
        `Duration must be between ${MIN_DURATION} and ${MAX_DURATION} seconds`,
        'INVALID_INPUT'
      );
    }

    const request: SFXRequest = {
      prompt: prompt.trim(),
      durationSeconds: duration,
    };

    return this.client.generateSFX(request);
  }

  /**
   * Generate SFX and return as base64 data URL
   */
  async generateSFXAsDataUrl(
    prompt: string,
    options: SFXOptions = {}
  ): Promise<string> {
    const response = await this.generateSFX(prompt, options);
    const base64 = arrayBufferToBase64(response.audio);
    return `data:${response.contentType};base64,${base64}`;
  }

  /**
   * Generate SFX and return as Blob URL
   */
  async generateSFXAsBlobUrl(
    prompt: string,
    options: SFXOptions = {}
  ): Promise<string> {
    const response = await this.generateSFX(prompt, options);
    const blob = new Blob([response.audio], { type: response.contentType });
    return URL.createObjectURL(blob);
  }

  /**
   * Common sound effect presets
   */
  async generatePreset(
    preset: 'whoosh' | 'ding' | 'click' | 'pop' | 'swoosh' | 'notification'
  ): Promise<SFXResponse> {
    const presets: Record<string, string> = {
      whoosh: 'fast whoosh transition sound effect',
      ding: 'bright success notification ding',
      click: 'soft button click sound',
      pop: 'bubble pop sound effect',
      swoosh: 'smooth swoosh transition',
      notification: 'gentle notification chime',
    };

    return this.generateSFX(presets[preset], { durationSeconds: 1 });
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
let serviceInstance: SFXService | null = null;

export function getSFXService(): SFXService {
  if (!serviceInstance) {
    serviceInstance = new SFXService();
  }
  return serviceInstance;
}

export function resetSFXService(): void {
  serviceInstance = null;
}
