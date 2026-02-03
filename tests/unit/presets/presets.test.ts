import { describe, it, expect } from 'vitest';
import {
  VOICE_PRESETS,
  getVoicePreset,
  presetToVoiceSettings,
  isVoicePreset,
  getAvailableVoicePresets,
  MUSIC_PRESETS,
  getMusicPreset,
  isMusicPreset,
  getAvailableMusicPresets,
  SFX_PRESETS,
  getSFXPreset,
  isSFXPreset,
  getAvailableSFXPresets,
} from '../../../src/presets';

describe('Voice Presets', () => {
  it('should have expected presets defined', () => {
    expect(VOICE_PRESETS['narrator-warm']).toBeDefined();
    expect(VOICE_PRESETS['narrator-energetic']).toBeDefined();
    expect(VOICE_PRESETS['conversational']).toBeDefined();
    expect(VOICE_PRESETS['dramatic']).toBeDefined();
  });

  it('should get voice preset by name', () => {
    const preset = getVoicePreset('narrator-warm');
    expect(preset.voiceId).toBeDefined();
    expect(preset.stability).toBeGreaterThanOrEqual(0);
    expect(preset.stability).toBeLessThanOrEqual(1);
    expect(preset.similarityBoost).toBeGreaterThanOrEqual(0);
    expect(preset.similarityBoost).toBeLessThanOrEqual(1);
    expect(preset.description).toBeDefined();
  });

  it('should convert preset to VoiceSettings', () => {
    const preset = getVoicePreset('narrator-energetic');
    const settings = presetToVoiceSettings(preset);

    expect(settings.stability).toBe(preset.stability);
    expect(settings.similarity_boost).toBe(preset.similarityBoost);
    expect(settings.style).toBe(preset.style);
  });

  it('should validate preset names', () => {
    expect(isVoicePreset('narrator-warm')).toBe(true);
    expect(isVoicePreset('invalid-preset')).toBe(false);
    expect(isVoicePreset('')).toBe(false);
  });

  it('should list all available presets', () => {
    const presets = getAvailableVoicePresets();
    expect(presets).toContain('narrator-warm');
    expect(presets).toContain('conversational');
    expect(presets.length).toBeGreaterThan(3);
  });
});

describe('Music Presets', () => {
  it('should have expected presets defined', () => {
    expect(MUSIC_PRESETS['tech-corporate']).toBeDefined();
    expect(MUSIC_PRESETS['lofi-chill']).toBeDefined();
    expect(MUSIC_PRESETS['cinematic-epic']).toBeDefined();
    expect(MUSIC_PRESETS['tutorial-calm']).toBeDefined();
  });

  it('should get music preset by name', () => {
    const preset = getMusicPreset('tech-corporate');
    expect(preset.prompt).toBeDefined();
    expect(preset.prompt.length).toBeGreaterThan(10);
    expect(preset.description).toBeDefined();
  });

  it('should have suggested durations', () => {
    const preset = getMusicPreset('lofi-chill');
    expect(preset.suggestedDuration).toBeDefined();
    expect(preset.suggestedDuration).toBeGreaterThan(0);
  });

  it('should validate preset names', () => {
    expect(isMusicPreset('tech-corporate')).toBe(true);
    expect(isMusicPreset('invalid-preset')).toBe(false);
  });

  it('should list all available presets', () => {
    const presets = getAvailableMusicPresets();
    expect(presets).toContain('tech-corporate');
    expect(presets).toContain('lofi-chill');
    expect(presets.length).toBeGreaterThan(5);
  });
});

describe('SFX Presets', () => {
  it('should have expected presets defined', () => {
    expect(SFX_PRESETS['transition-whoosh']).toBeDefined();
    expect(SFX_PRESETS['notification-ding']).toBeDefined();
    expect(SFX_PRESETS['typing-keyboard']).toBeDefined();
    expect(SFX_PRESETS['ambient-office']).toBeDefined();
    expect(SFX_PRESETS['success-fanfare']).toBeDefined();
  });

  it('should get SFX preset by name', () => {
    const preset = getSFXPreset('transition-whoosh');
    expect(preset.prompt).toBeDefined();
    expect(preset.prompt.length).toBeGreaterThan(10);
    expect(preset.description).toBeDefined();
  });

  it('should have appropriate durations for different types', () => {
    const whoosh = getSFXPreset('transition-whoosh');
    const typing = getSFXPreset('typing-keyboard');
    const ambient = getSFXPreset('ambient-office');

    // Short sounds should be < 2 seconds
    expect(whoosh.suggestedDuration).toBeLessThanOrEqual(2);
    // Typing should be longer
    expect(typing.suggestedDuration).toBeGreaterThan(1);
    // Ambient should be longest
    expect(ambient.suggestedDuration).toBeGreaterThan(10);
  });

  it('should validate preset names', () => {
    expect(isSFXPreset('transition-whoosh')).toBe(true);
    expect(isSFXPreset('invalid-preset')).toBe(false);
  });

  it('should list all available presets', () => {
    const presets = getAvailableSFXPresets();
    expect(presets).toContain('transition-whoosh');
    expect(presets).toContain('success-fanfare');
    expect(presets.length).toBeGreaterThan(10);
  });
});
