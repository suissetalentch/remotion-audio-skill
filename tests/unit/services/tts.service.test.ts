import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TTSService, resetTTSService } from '../../../src/services/tts.service';
import { ElevenLabsClient, resetClient } from '../../../src/client/elevenlabs-client';
import { resetConfig, configureAudioSkill } from '../../../src/config';
import { createMockAudioBuffer } from '../../setup';
import { AudioSkillError } from '../../../src/types';

describe('TTSService', () => {
  let service: TTSService;
  let mockClient: ElevenLabsClient;

  beforeEach(() => {
    resetConfig();
    resetClient();
    resetTTSService();
    configureAudioSkill({ apiKey: 'test-api-key' });

    mockClient = {
      textToSpeech: vi.fn(),
    } as unknown as ElevenLabsClient;

    service = new TTSService(mockClient);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateSpeech', () => {
    it('should generate speech from text', async () => {
      const mockAudio = createMockAudioBuffer(1024);
      vi.mocked(mockClient.textToSpeech).mockResolvedValue({
        audio: mockAudio,
        contentType: 'audio/mpeg',
      });

      const result = await service.generateSpeech('Hello world');

      expect(result.audio).toBe(mockAudio);
      expect(result.contentType).toBe('audio/mpeg');
      expect(mockClient.textToSpeech).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'Hello world',
        })
      );
    });

    it('should throw error for empty text', async () => {
      await expect(service.generateSpeech('')).rejects.toThrow(AudioSkillError);
      await expect(service.generateSpeech('   ')).rejects.toThrow(AudioSkillError);
    });

    it('should use custom voice settings', async () => {
      const mockAudio = createMockAudioBuffer(512);
      vi.mocked(mockClient.textToSpeech).mockResolvedValue({
        audio: mockAudio,
        contentType: 'audio/mpeg',
      });

      await service.generateSpeech('Test', {
        voiceId: 'custom-voice',
        voiceSettings: {
          stability: 0.8,
          similarity_boost: 0.9,
        },
      });

      expect(mockClient.textToSpeech).toHaveBeenCalledWith(
        expect.objectContaining({
          voiceId: 'custom-voice',
          voiceSettings: expect.objectContaining({
            stability: 0.8,
            similarity_boost: 0.9,
          }),
        })
      );
    });

    it('should use default voice when not specified', async () => {
      const mockAudio = createMockAudioBuffer(512);
      vi.mocked(mockClient.textToSpeech).mockResolvedValue({
        audio: mockAudio,
        contentType: 'audio/mpeg',
      });

      await service.generateSpeech('Test');

      expect(mockClient.textToSpeech).toHaveBeenCalledWith(
        expect.objectContaining({
          voiceId: 'EXAVITQu4vr4xnSDxMaL', // default aria
        })
      );
    });
  });

  describe('estimateDuration', () => {
    it('should estimate duration based on word count', () => {
      // "Hello world" = 2 words, ~0.8 seconds at 150 wpm
      const duration = service.estimateDuration('Hello world');
      expect(duration).toBeGreaterThan(0);
      expect(duration).toBeLessThan(5000);
    });

    it('should return higher duration for longer text', () => {
      const short = service.estimateDuration('Hello');
      const long = service.estimateDuration('Hello world this is a longer sentence with more words');
      expect(long).toBeGreaterThan(short);
    });
  });

  describe('splitTextIntoChunks', () => {
    it('should not split short text', () => {
      const chunks = service.splitTextIntoChunks('Hello world.', 100);
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toBe('Hello world.');
    });

    it('should split long text at sentence boundaries', () => {
      const text = 'First sentence. Second sentence. Third sentence.';
      const chunks = service.splitTextIntoChunks(text, 30);
      expect(chunks.length).toBeGreaterThan(1);
      chunks.forEach(chunk => {
        expect(chunk.length).toBeLessThanOrEqual(35); // Some tolerance
      });
    });

    it('should handle text without punctuation', () => {
      const text = 'This is a text without any sentence ending punctuation';
      const chunks = service.splitTextIntoChunks(text, 20);
      expect(chunks.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('generateLongSpeech', () => {
    it('should generate speech for each chunk', async () => {
      const mockAudio = createMockAudioBuffer(512);
      vi.mocked(mockClient.textToSpeech).mockResolvedValue({
        audio: mockAudio,
        contentType: 'audio/mpeg',
      });

      const longText = 'First sentence. Second sentence. Third sentence.';
      const results = await service.generateLongSpeech(longText);

      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(mockClient.textToSpeech).toHaveBeenCalled();
    });
  });
});
