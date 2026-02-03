import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { BackgroundMusic } from '../../../src/components/BackgroundMusic';
import { configureAudioSkill, resetConfig } from '../../../src/config';
import { resetMusicService } from '../../../src/services/music.service';
import { resetCacheManager } from '../../../src/cache/cache-manager';

// Mock the hooks
vi.mock('../../../src/hooks/useBackgroundMusic', () => ({
  useBackgroundMusic: vi.fn(() => ({
    audioSrc: 'blob:mock-music-url',
    isLoading: false,
    error: null,
  })),
}));

vi.mock('../../../src/hooks/useAudioDucking', () => ({
  useAudioDucking: vi.fn(() => ({
    volume: 1,
    setVoiceActive: vi.fn(),
  })),
}));

describe('BackgroundMusic', () => {
  beforeEach(() => {
    resetConfig();
    resetMusicService();
    resetCacheManager();
    configureAudioSkill({ apiKey: 'test-api-key' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render without crashing', () => {
    const { container } = render(
      <BackgroundMusic prompt="lo-fi chill beats" />
    );
    expect(container).toBeDefined();
  });

  it('should accept durationSeconds prop', () => {
    const { container } = render(
      <BackgroundMusic prompt="ambient music" durationSeconds={60} />
    );
    expect(container).toBeDefined();
  });

  it('should accept volume prop', () => {
    const { container } = render(
      <BackgroundMusic prompt="ambient music" volume={0.3} />
    );
    expect(container).toBeDefined();
  });

  it('should accept ducking config', () => {
    const { container } = render(
      <BackgroundMusic
        prompt="ambient music"
        ducking={{
          enabled: true,
          targetVolume: 0.2,
        }}
      />
    );
    expect(container).toBeDefined();
  });

  it('should accept loop prop', () => {
    const { container } = render(
      <BackgroundMusic prompt="ambient music" loop={false} />
    );
    expect(container).toBeDefined();
  });

  it('should accept fadeInFrames prop', () => {
    const { container } = render(
      <BackgroundMusic prompt="ambient music" fadeInFrames={30} />
    );
    expect(container).toBeDefined();
  });

  it('should accept fadeOutFrames prop', () => {
    const { container } = render(
      <BackgroundMusic prompt="ambient music" fadeOutFrames={60} />
    );
    expect(container).toBeDefined();
  });

  it('should accept both fade props', () => {
    const { container } = render(
      <BackgroundMusic
        prompt="ambient music"
        fadeInFrames={30}
        fadeOutFrames={60}
      />
    );
    expect(container).toBeDefined();
  });

  it('should accept ducking with PRD-style props', () => {
    const { container } = render(
      <BackgroundMusic
        prompt="ambient music"
        ducking={{
          enabled: true,
          duckTo: 0.15,
          attackFrames: 8,
          releaseFrames: 15,
        }}
      />
    );
    expect(container).toBeDefined();
  });
});
