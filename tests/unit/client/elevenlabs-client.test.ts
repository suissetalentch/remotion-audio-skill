import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ElevenLabsClient, resetClient } from '../../../src/client/elevenlabs-client';
import { resetConfig, configureAudioSkill } from '../../../src/config';
import { createMockResponse, createMockAudioBuffer } from '../../setup';

describe('ElevenLabsClient', () => {
  beforeEach(() => {
    resetConfig();
    resetClient();
    configureAudioSkill({ apiKey: 'test-api-key' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('textToSpeech', () => {
    it('should generate audio from text', async () => {
      const mockAudio = createMockAudioBuffer(1024);
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'audio/mpeg' }),
        arrayBuffer: () => Promise.resolve(mockAudio),
      } as Response);

      const client = new ElevenLabsClient();
      const result = await client.textToSpeech({
        text: 'Hello world',
        voiceId: 'aria',
      });

      expect(result.audio).toBe(mockAudio);
      expect(result.contentType).toBe('audio/mpeg');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/text-to-speech/aria'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'xi-api-key': 'test-api-key',
          }),
        })
      );
    });

    it('should use default voice when not specified', async () => {
      const mockAudio = createMockAudioBuffer(512);
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'audio/mpeg' }),
        arrayBuffer: () => Promise.resolve(mockAudio),
      } as Response);

      const client = new ElevenLabsClient();
      await client.textToSpeech({
        text: 'Test',
        voiceId: '', // Empty to use default
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/text-to-speech/EXAVITQu4vr4xnSDxMaL'), // default aria voice
        expect.any(Object)
      );
    });

    it('should throw APIError on failure', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: () => Promise.resolve('Invalid API key'),
      } as Response);

      const client = new ElevenLabsClient();

      await expect(
        client.textToSpeech({
          text: 'Hello',
          voiceId: 'aria',
        })
      ).rejects.toThrow('TTS API error');
    });
  });

  describe('generateMusic', () => {
    it('should generate music from prompt', async () => {
      const mockAudio = createMockAudioBuffer(2048);
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'audio/mpeg' }),
        arrayBuffer: () => Promise.resolve(mockAudio),
      } as Response);

      const client = new ElevenLabsClient();
      const result = await client.generateMusic({
        prompt: 'lo-fi chill beats',
        durationSeconds: 30,
      });

      expect(result.audio).toBe(mockAudio);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/music/generate'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('lo-fi chill beats'),
        })
      );
    });
  });

  describe('generateSFX', () => {
    it('should generate sound effects from prompt', async () => {
      const mockAudio = createMockAudioBuffer(512);
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'audio/mpeg' }),
        arrayBuffer: () => Promise.resolve(mockAudio),
      } as Response);

      const client = new ElevenLabsClient();
      const result = await client.generateSFX({
        prompt: 'whoosh transition',
      });

      expect(result.audio).toBe(mockAudio);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/sound-generation'),
        expect.any(Object)
      );
    });
  });

  describe('speechToText', () => {
    it('should transcribe audio', async () => {
      const mockTranscription = {
        text: 'Hello world',
        words: [
          { word: 'Hello', start: 0, end: 0.5, confidence: 0.95 },
          { word: 'world', start: 0.5, end: 1.0, confidence: 0.92 },
        ],
        language_code: 'en',
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockTranscription),
      } as Response);

      const client = new ElevenLabsClient();
      const result = await client.speechToText({
        audio: createMockAudioBuffer(1024),
      });

      expect(result.text).toBe('Hello world');
      expect(result.words).toHaveLength(2);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/speech-to-text'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  describe('listVoices', () => {
    it('should list available voices', async () => {
      const mockVoices = {
        voices: [
          { voice_id: 'voice1', name: 'Voice 1' },
          { voice_id: 'voice2', name: 'Voice 2' },
        ],
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockVoices),
      } as Response);

      const client = new ElevenLabsClient();
      const voices = await client.listVoices();

      expect(voices).toHaveLength(2);
      expect(voices[0].name).toBe('Voice 1');
    });
  });
});
