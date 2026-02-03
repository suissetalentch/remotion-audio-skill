import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { STTService, resetSTTService } from '../../../src/services/stt.service';
import { ElevenLabsClient, resetClient } from '../../../src/client/elevenlabs-client';
import { resetConfig, configureAudioSkill } from '../../../src/config';
import { createMockAudioBuffer } from '../../setup';
import { AudioSkillError, STTWord } from '../../../src/types';

describe('STTService', () => {
  let service: STTService;
  let mockClient: ElevenLabsClient;

  const mockWords: STTWord[] = [
    { word: 'Hello', start: 0, end: 0.5, confidence: 0.95 },
    { word: 'world.', start: 0.5, end: 1.0, confidence: 0.92 },
    { word: 'How', start: 1.1, end: 1.3, confidence: 0.90 },
    { word: 'are', start: 1.3, end: 1.5, confidence: 0.88 },
    { word: 'you?', start: 1.5, end: 2.0, confidence: 0.94 },
  ];

  beforeEach(() => {
    resetConfig();
    resetClient();
    resetSTTService();
    configureAudioSkill({ apiKey: 'test-api-key' });

    mockClient = {
      speechToText: vi.fn(),
    } as unknown as ElevenLabsClient;

    service = new STTService(mockClient);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('transcribe', () => {
    it('should transcribe audio', async () => {
      vi.mocked(mockClient.speechToText).mockResolvedValue({
        text: 'Hello world. How are you?',
        words: mockWords,
        language: 'en',
      });

      const result = await service.transcribe(createMockAudioBuffer(1024));

      expect(result.text).toBe('Hello world. How are you?');
      expect(result.words).toHaveLength(5);
    });

    it('should throw error for empty audio', async () => {
      await expect(service.transcribe(new ArrayBuffer(0))).rejects.toThrow(
        AudioSkillError
      );
    });
  });

  describe('wordsToFrames', () => {
    it('should convert word timestamps to frames', () => {
      const result = service.wordsToFrames(mockWords, 30);

      expect(result[0].startFrame).toBe(0);
      expect(result[0].endFrame).toBe(15); // 0.5 * 30
      expect(result[1].startFrame).toBe(15);
      expect(result[1].endFrame).toBe(30);
    });
  });

  describe('groupIntoSentences', () => {
    it('should group words into sentences', () => {
      const sentences = service.groupIntoSentences(mockWords);

      expect(sentences).toHaveLength(2);
      expect(sentences[0].text).toBe('Hello world.');
      expect(sentences[1].text).toBe('How are you?');
    });

    it('should handle empty words array', () => {
      const sentences = service.groupIntoSentences([]);
      expect(sentences).toHaveLength(0);
    });

    it('should handle words without sentence enders', () => {
      const words: STTWord[] = [
        { word: 'Hello', start: 0, end: 0.5, confidence: 0.95 },
        { word: 'world', start: 0.5, end: 1.0, confidence: 0.92 },
      ];

      const sentences = service.groupIntoSentences(words);
      expect(sentences).toHaveLength(1);
      expect(sentences[0].text).toBe('Hello world');
    });
  });

  describe('getWordAtTime', () => {
    it('should return word at specific time', () => {
      const word = service.getWordAtTime(mockWords, 0.25);
      expect(word?.word).toBe('Hello');
    });

    it('should return null when no word at time', () => {
      const word = service.getWordAtTime(mockWords, 1.05);
      expect(word).toBeNull();
    });
  });

  describe('getWordAtFrame', () => {
    it('should return word at specific frame', () => {
      const word = service.getWordAtFrame(mockWords, 10, 30); // 10/30 = 0.33s
      expect(word?.word).toBe('Hello');
    });
  });
});
