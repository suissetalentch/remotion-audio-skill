import { getClient, ElevenLabsClient } from '../client';
import { getConfig } from '../config';
import {
  TTSRequest,
  TTSResponse,
  VoiceSettings,
  AudioSkillError,
} from '../types';

export interface TTSOptions {
  voiceId?: string;
  model?: string;
  voiceSettings?: VoiceSettings;
  language?: string;
  /** Seed for reproducible generation */
  seed?: number;
  /** Previous text for continuity between segments */
  previousText?: string;
  /** Next text for continuity between segments */
  nextText?: string;
}

const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  stability: 0.5,
  similarity_boost: 0.75,
  style: 0,
  use_speaker_boost: true,
};

export class TTSService {
  private client: ElevenLabsClient;

  constructor(client?: ElevenLabsClient) {
    this.client = client ?? getClient();
  }

  /**
   * Generate speech from text
   */
  async generateSpeech(text: string, options: TTSOptions = {}): Promise<TTSResponse> {
    if (!text || text.trim().length === 0) {
      throw new AudioSkillError('Text cannot be empty', 'INVALID_INPUT');
    }

    const config = getConfig();

    const request: TTSRequest = {
      text: text.trim(),
      voiceId: options.voiceId || config.defaultVoiceId,
      model: options.model || config.defaultModel,
      voiceSettings: options.voiceSettings || DEFAULT_VOICE_SETTINGS,
      language: options.language,
    };

    return this.client.textToSpeech(request);
  }

  /**
   * Generate speech and return as base64 data URL
   */
  async generateSpeechAsDataUrl(
    text: string,
    options: TTSOptions = {}
  ): Promise<string> {
    const response = await this.generateSpeech(text, options);
    const base64 = arrayBufferToBase64(response.audio);
    return `data:${response.contentType};base64,${base64}`;
  }

  /**
   * Generate speech and return as Blob URL
   */
  async generateSpeechAsBlobUrl(
    text: string,
    options: TTSOptions = {}
  ): Promise<string> {
    const response = await this.generateSpeech(text, options);
    const blob = new Blob([response.audio], { type: response.contentType });
    return URL.createObjectURL(blob);
  }

  /**
   * Estimate duration in milliseconds based on text length
   * This is a rough estimate - actual duration depends on voice and settings
   */
  estimateDuration(text: string): number {
    // Average speaking rate is about 150 words per minute
    // Average word length is about 5 characters
    const words = text.trim().split(/\s+/).length;
    const durationMinutes = words / 150;
    return Math.ceil(durationMinutes * 60 * 1000);
  }

  /**
   * Split long text into chunks for better processing
   */
  splitTextIntoChunks(text: string, maxChars: number = 2500): string[] {
    if (text.length <= maxChars) {
      return [text];
    }

    const chunks: string[] = [];
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    let currentChunk = '';

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > maxChars) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = sentence;
      } else {
        currentChunk += sentence;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  /**
   * Generate speech for long text by splitting into chunks
   */
  async generateLongSpeech(
    text: string,
    options: TTSOptions = {}
  ): Promise<TTSResponse[]> {
    const chunks = this.splitTextIntoChunks(text);
    const responses: TTSResponse[] = [];

    for (const chunk of chunks) {
      const response = await this.generateSpeech(chunk, options);
      responses.push(response);
    }

    return responses;
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
let serviceInstance: TTSService | null = null;

export function getTTSService(): TTSService {
  if (!serviceInstance) {
    serviceInstance = new TTSService();
  }
  return serviceInstance;
}

export function resetTTSService(): void {
  serviceInstance = null;
}
