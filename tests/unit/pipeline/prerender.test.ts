import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { prerenderAudio, createSimpleConfig, PrerenderConfig } from '../../../src/pipeline/prerender';
import { configureAudioSkill, resetConfig } from '../../../src/config';
import { resetTTSService, getTTSService } from '../../../src/services/tts.service';
import { resetMusicService, getMusicService } from '../../../src/services/music.service';
import { resetSFXService, getSFXService } from '../../../src/services/sfx.service';
import { resetSTTService, getSTTService } from '../../../src/services/stt.service';
import { resetCacheManager, getCacheManager } from '../../../src/cache/cache-manager';

// Create mock audio data
const mockAudioBuffer = new ArrayBuffer(16000); // ~1 second at 128kbps

// Mock URL.createObjectURL for Node.js environment
let urlCounter = 0;
globalThis.URL.createObjectURL = vi.fn(() => `blob:mock-url-${++urlCounter}`);
globalThis.URL.revokeObjectURL = vi.fn();

describe('prerenderAudio', () => {
  beforeEach(() => {
    resetConfig();
    resetTTSService();
    resetMusicService();
    resetSFXService();
    resetSTTService();
    resetCacheManager();

    configureAudioSkill({
      apiKey: 'test-api-key',
      defaultVoiceId: 'test-voice',
      defaultModel: 'test-model',
    });

    // Mock TTS service
    const ttsService = getTTSService();
    vi.spyOn(ttsService, 'generateSpeech').mockResolvedValue({
      audio: mockAudioBuffer,
      contentType: 'audio/mpeg',
    });

    // Mock Music service
    const musicService = getMusicService();
    vi.spyOn(musicService, 'generateMusic').mockResolvedValue({
      audio: mockAudioBuffer,
      contentType: 'audio/mpeg',
    });

    // Mock SFX service
    const sfxService = getSFXService();
    vi.spyOn(sfxService, 'generateSFX').mockResolvedValue({
      audio: mockAudioBuffer,
      contentType: 'audio/mpeg',
    });

    // Mock STT service
    const sttService = getSTTService();
    vi.spyOn(sttService, 'transcribe').mockResolvedValue({
      text: 'Hello world',
      words: [
        { word: 'Hello', start: 0, end: 0.5, confidence: 0.9 },
        { word: 'world', start: 0.5, end: 1.0, confidence: 0.95 },
      ],
      language: 'en',
    });

    // Mock cache to always miss
    const cacheManager = getCacheManager();
    vi.spyOn(cacheManager, 'get').mockResolvedValue(null);
    vi.spyOn(cacheManager, 'set').mockResolvedValue();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return empty result for empty config', async () => {
    const config: PrerenderConfig = { fps: 30 };
    const result = await prerenderAudio(config);

    expect(result.audioMeta.voiceOvers).toEqual({});
    expect(result.audioMeta.soundEffects).toEqual({});
    expect(result.audioMeta.backgroundMusic).toBeUndefined();
  });

  it('should process single voice-over', async () => {
    const config: PrerenderConfig = {
      fps: 30,
      voiceOvers: [
        { id: 'intro', text: 'Hello world' },
      ],
    };

    const result = await prerenderAudio(config);

    expect(result.audioMeta.voiceOvers['intro']).toBeDefined();
    expect(result.audioMeta.voiceOvers['intro'].src).toMatch(/^blob:/);
    expect(result.audioMeta.voiceOvers['intro'].durationFrames).toBeGreaterThan(0);
    expect(result.audioMeta.voiceOvers['intro'].transcription).toHaveLength(2);
  });

  it('should process multiple voice-overs', async () => {
    const config: PrerenderConfig = {
      fps: 30,
      voiceOvers: [
        { id: 'intro', text: 'Hello world' },
        { id: 'outro', text: 'Goodbye world' },
      ],
    };

    const result = await prerenderAudio(config);

    expect(Object.keys(result.audioMeta.voiceOvers)).toHaveLength(2);
    expect(result.audioMeta.voiceOvers['intro']).toBeDefined();
    expect(result.audioMeta.voiceOvers['outro']).toBeDefined();
  });

  it('should process background music', async () => {
    const config: PrerenderConfig = {
      fps: 30,
      backgroundMusic: {
        prompt: 'upbeat corporate music',
        durationSeconds: 60,
      },
    };

    const result = await prerenderAudio(config);

    expect(result.audioMeta.backgroundMusic).toBeDefined();
    expect(result.audioMeta.backgroundMusic!.src).toMatch(/^blob:/);
    expect(result.audioMeta.backgroundMusic!.durationFrames).toBeGreaterThan(0);
  });

  it('should process sound effects', async () => {
    const config: PrerenderConfig = {
      fps: 30,
      soundEffects: [
        { id: 'whoosh', prompt: 'whoosh sound', from: 0 },
        { id: 'ding', prompt: 'notification ding', from: 30 },
      ],
    };

    const result = await prerenderAudio(config);

    expect(Object.keys(result.audioMeta.soundEffects)).toHaveLength(2);
    expect(result.audioMeta.soundEffects['whoosh']).toBeDefined();
    expect(result.audioMeta.soundEffects['ding']).toBeDefined();
  });

  it('should calculate total duration based on content', async () => {
    const config: PrerenderConfig = {
      fps: 30,
      voiceOvers: [
        { id: 'intro', text: 'Hello world', from: 0 },
      ],
    };

    const result = await prerenderAudio(config);

    // Total duration should include voice-over duration plus buffer
    expect(result.totalDurationFrames).toBeGreaterThan(0);
  });

  it('should include word alignment with frame numbers', async () => {
    const config: PrerenderConfig = {
      fps: 30,
      voiceOvers: [
        { id: 'test', text: 'Hello world' },
      ],
    };

    const result = await prerenderAudio(config);
    const transcription = result.audioMeta.voiceOvers['test'].transcription;

    expect(transcription[0].word).toBe('Hello');
    expect(transcription[0].startFrame).toBe(0);
    expect(transcription[0].endFrame).toBe(15); // 0.5s * 30fps
    expect(transcription[1].word).toBe('world');
    expect(transcription[1].startFrame).toBe(15);
    expect(transcription[1].endFrame).toBe(30);
  });
});

describe('createSimpleConfig', () => {
  it('should create config from text segments', () => {
    const segments = [
      { id: 'intro', text: 'Welcome to the demo.' },
      { id: 'main', text: 'This is the main content.' },
    ];

    const config = createSimpleConfig(segments);

    expect(config.fps).toBe(30);
    expect(config.voiceOvers).toHaveLength(2);
    expect(config.voiceOvers![0].id).toBe('intro');
    expect(config.voiceOvers![0].text).toBe('Welcome to the demo.');
  });

  it('should accept custom fps', () => {
    const config = createSimpleConfig([], { fps: 60 });
    expect(config.fps).toBe(60);
  });

  it('should accept background music preset', () => {
    const config = createSimpleConfig([], { backgroundMusic: 'tech-corporate' });
    expect(config.backgroundMusic).toEqual({ prompt: 'tech-corporate' });
  });

  it('should apply voice preset to all segments', () => {
    const segments = [
      { id: 'a', text: 'First' },
      { id: 'b', text: 'Second' },
    ];

    const config = createSimpleConfig(segments, { voicePreset: 'narrator-warm' });

    expect(config.voiceOvers![0].preset).toBe('narrator-warm');
    expect(config.voiceOvers![1].preset).toBe('narrator-warm');
  });
});
