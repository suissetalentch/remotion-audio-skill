import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SFXService, resetSFXService } from '../../../src/services/sfx.service';
import { ElevenLabsClient, resetClient } from '../../../src/client/elevenlabs-client';
import { resetConfig, configureAudioSkill } from '../../../src/config';
import { createMockAudioBuffer } from '../../setup';
import { AudioSkillError } from '../../../src/types';

describe('SFXService', () => {
  let service: SFXService;
  let mockClient: ElevenLabsClient;

  beforeEach(() => {
    resetConfig();
    resetClient();
    resetSFXService();
    configureAudioSkill({ apiKey: 'test-api-key' });

    mockClient = {
      generateSFX: vi.fn(),
    } as unknown as ElevenLabsClient;

    service = new SFXService(mockClient);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateSFX', () => {
    it('should generate sound effect from prompt', async () => {
      const mockAudio = createMockAudioBuffer(512);
      vi.mocked(mockClient.generateSFX).mockResolvedValue({
        audio: mockAudio,
        contentType: 'audio/mpeg',
      });

      const result = await service.generateSFX('whoosh transition');

      expect(result.audio).toBe(mockAudio);
      expect(mockClient.generateSFX).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: 'whoosh transition',
          durationSeconds: 2, // default
        })
      );
    });

    it('should throw error for empty prompt', async () => {
      await expect(service.generateSFX('')).rejects.toThrow(AudioSkillError);
    });

    it('should throw error for invalid duration', async () => {
      await expect(
        service.generateSFX('test', { durationSeconds: 0.1 })
      ).rejects.toThrow(AudioSkillError);

      await expect(
        service.generateSFX('test', { durationSeconds: 30 })
      ).rejects.toThrow(AudioSkillError);
    });
  });

  describe('generatePreset', () => {
    it('should generate whoosh preset', async () => {
      const mockAudio = createMockAudioBuffer(256);
      vi.mocked(mockClient.generateSFX).mockResolvedValue({
        audio: mockAudio,
        contentType: 'audio/mpeg',
      });

      await service.generatePreset('whoosh');

      expect(mockClient.generateSFX).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining('whoosh'),
          durationSeconds: 1,
        })
      );
    });

    it('should generate ding preset', async () => {
      const mockAudio = createMockAudioBuffer(256);
      vi.mocked(mockClient.generateSFX).mockResolvedValue({
        audio: mockAudio,
        contentType: 'audio/mpeg',
      });

      await service.generatePreset('ding');

      expect(mockClient.generateSFX).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining('ding'),
        })
      );
    });
  });
});
