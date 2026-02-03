import { getConfig } from '../config';
import { TokenBucketRateLimiter, createDefaultRateLimiter } from './rate-limiter';
import { withRetry } from './retry';
import {
  TTSRequest,
  TTSResponse,
  MusicRequest,
  MusicResponse,
  SFXRequest,
  SFXResponse,
  STTRequest,
  STTResponse,
  Voice,
  APIError,
  ResolvedConfig,
} from '../types';

export class ElevenLabsClient {
  private config: ResolvedConfig;
  private rateLimiter: TokenBucketRateLimiter;

  constructor(config?: ResolvedConfig) {
    this.config = config ?? getConfig();
    this.rateLimiter = createDefaultRateLimiter(this.config.rateLimitPerMinute);
  }


  private async requestJson<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    await this.rateLimiter.waitForToken();

    const url = `${this.config.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'xi-api-key': this.config.apiKey,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      let details: unknown;
      try {
        details = JSON.parse(errorBody);
      } catch {
        details = errorBody;
      }
      throw new APIError(
        `ElevenLabs API error: ${response.statusText}`,
        response.status,
        details
      );
    }

    return response.json() as Promise<T>;
  }

  /**
   * Generate speech from text
   */
  async textToSpeech(request: TTSRequest): Promise<TTSResponse> {
    return withRetry(async () => {
      const voiceId = request.voiceId || this.config.defaultVoiceId;
      const model = request.model || this.config.defaultModel;

      const body: Record<string, unknown> = {
        text: request.text,
        model_id: model,
      };

      if (request.voiceSettings) {
        body.voice_settings = {
          stability: request.voiceSettings.stability,
          similarity_boost: request.voiceSettings.similarity_boost,
          style: request.voiceSettings.style,
          use_speaker_boost: request.voiceSettings.use_speaker_boost,
        };
      }

      if (request.language) {
        body.language_code = request.language;
      }

      await this.rateLimiter.waitForToken();

      const url = `${this.config.baseUrl}/text-to-speech/${voiceId}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'xi-api-key': this.config.apiKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new APIError(
          `TTS API error: ${response.statusText}`,
          response.status,
          errorBody
        );
      }

      const audio = await response.arrayBuffer();
      return {
        audio,
        contentType: response.headers.get('content-type') || 'audio/mpeg',
      };
    });
  }

  /**
   * Generate music from prompt
   */
  async generateMusic(request: MusicRequest): Promise<MusicResponse> {
    return withRetry(async () => {
      const body = {
        prompt: request.prompt,
        duration_seconds: request.durationSeconds,
        prompt_influence: request.promptInfluence ?? 0.5,
      };

      await this.rateLimiter.waitForToken();

      const url = `${this.config.baseUrl}/music/generate`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'xi-api-key': this.config.apiKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new APIError(
          `Music API error: ${response.statusText}`,
          response.status,
          errorBody
        );
      }

      const audio = await response.arrayBuffer();
      return {
        audio,
        contentType: response.headers.get('content-type') || 'audio/mpeg',
      };
    });
  }

  /**
   * Generate sound effects from prompt
   */
  async generateSFX(request: SFXRequest): Promise<SFXResponse> {
    return withRetry(async () => {
      const body: Record<string, unknown> = {
        text: request.prompt,
      };

      if (request.durationSeconds) {
        body.duration_seconds = request.durationSeconds;
      }

      await this.rateLimiter.waitForToken();

      const url = `${this.config.baseUrl}/sound-generation`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'xi-api-key': this.config.apiKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new APIError(
          `SFX API error: ${response.statusText}`,
          response.status,
          errorBody
        );
      }

      const audio = await response.arrayBuffer();
      return {
        audio,
        contentType: response.headers.get('content-type') || 'audio/mpeg',
      };
    });
  }

  /**
   * Speech to text transcription
   */
  async speechToText(request: STTRequest): Promise<STTResponse> {
    return withRetry(async () => {
      const formData = new FormData();
      // Create blob from audio data
      const audioBlob = new Blob([request.audio], { type: 'audio/mpeg' });
      formData.append('audio', audioBlob, 'audio.mp3');

      if (request.language) {
        formData.append('language_code', request.language);
      }

      await this.rateLimiter.waitForToken();

      const url = `${this.config.baseUrl}/speech-to-text`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'xi-api-key': this.config.apiKey,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new APIError(
          `STT API error: ${response.statusText}`,
          response.status,
          errorBody
        );
      }

      const data = await response.json();
      return {
        text: data.text,
        words: data.words || [],
        language: data.language_code,
      };
    });
  }

  /**
   * List available voices
   */
  async listVoices(): Promise<Voice[]> {
    return withRetry(async () => {
      const data = await this.requestJson<{ voices: Voice[] }>('/voices');
      return data.voices;
    });
  }

  /**
   * Get a specific voice by ID
   */
  async getVoice(voiceId: string): Promise<Voice> {
    return withRetry(async () => {
      return this.requestJson<Voice>(`/voices/${voiceId}`);
    });
  }
}

// Singleton instance
let clientInstance: ElevenLabsClient | null = null;

export function getClient(): ElevenLabsClient {
  if (!clientInstance) {
    clientInstance = new ElevenLabsClient();
  }
  return clientInstance;
}

export function resetClient(): void {
  clientInstance = null;
}
