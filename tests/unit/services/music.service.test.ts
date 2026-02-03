import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MusicService, resetMusicService } from '../../../src/services/music.service';
import { ElevenLabsClient, resetClient } from '../../../src/client/elevenlabs-client';
import { resetConfig, configureAudioSkill } from '../../../src/config';
import { createMockAudioBuffer } from '../../setup';
import { AudioSkillError } from '../../../src/types';

describe('MusicService', () => {
  let service: MusicService;
  let mockClient: ElevenLabsClient;

  beforeEach(() => {
    resetConfig();
    resetClient();
    resetMusicService();
    configureAudioSkill({ apiKey: 'test-api-key' });

    mockClient = {
      generateMusic: vi.fn(),
    } as unknown as ElevenLabsClient;

    service = new MusicService(mockClient);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateMusic', () => {
    it('should generate music from prompt', async () => {
      const mockAudio = createMockAudioBuffer(2048);
      vi.mocked(mockClient.generateMusic).mockResolvedValue({
        audio: mockAudio,
        contentType: 'audio/mpeg',
      });

      const result = await service.generateMusic('lo-fi chill beats');

      expect(result.audio).toBe(mockAudio);
      expect(mockClient.generateMusic).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: 'lo-fi chill beats',
          durationSeconds: 30, // default
        })
      );
    });

    it('should throw error for empty prompt', async () => {
      await expect(service.generateMusic('')).rejects.toThrow(AudioSkillError);
    });

    it('should throw error for invalid duration', async () => {
      await expect(
        service.generateMusic('test', { durationSeconds: 2 })
      ).rejects.toThrow(AudioSkillError);

      await expect(
        service.generateMusic('test', { durationSeconds: 500 })
      ).rejects.toThrow(AudioSkillError);
    });

    it('should use custom duration and prompt influence', async () => {
      const mockAudio = createMockAudioBuffer(1024);
      vi.mocked(mockClient.generateMusic).mockResolvedValue({
        audio: mockAudio,
        contentType: 'audio/mpeg',
      });

      await service.generateMusic('epic orchestral', {
        durationSeconds: 60,
        promptInfluence: 0.8,
      });

      expect(mockClient.generateMusic).toHaveBeenCalledWith(
        expect.objectContaining({
          durationSeconds: 60,
          promptInfluence: 0.8,
        })
      );
    });
  });

  describe('generateAmbientLoop', () => {
    it('should generate ambient music with loop-optimized prompt', async () => {
      const mockAudio = createMockAudioBuffer(1024);
      vi.mocked(mockClient.generateMusic).mockResolvedValue({
        audio: mockAudio,
        contentType: 'audio/mpeg',
      });

      await service.generateAmbientLoop('calm', 45);

      expect(mockClient.generateMusic).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining('ambient'),
          prompt: expect.stringContaining('calm'),
          durationSeconds: 45,
          promptInfluence: 0.7,
        })
      );
    });
  });
});
