import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { VoiceOver } from '../../../src/components/VoiceOver';
import { configureAudioSkill, resetConfig } from '../../../src/config';
import { resetTTSService } from '../../../src/services/tts.service';
import { resetCacheManager } from '../../../src/cache/cache-manager';

// Mock the hooks
vi.mock('../../../src/hooks/useVoiceOver', () => ({
  useVoiceOver: vi.fn(() => ({
    audioSrc: 'blob:mock-audio-url',
    durationInFrames: 90,
    isLoading: false,
    error: null,
    words: [],
  })),
}));

describe('VoiceOver', () => {
  beforeEach(() => {
    resetConfig();
    resetTTSService();
    resetCacheManager();
    configureAudioSkill({ apiKey: 'test-api-key' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render without crashing', () => {
    const { container } = render(
      <VoiceOver text="Hello world" />
    );
    expect(container).toBeDefined();
  });

  it('should accept voiceId prop', () => {
    const { container } = render(
      <VoiceOver text="Hello world" voiceId="custom-voice" />
    );
    expect(container).toBeDefined();
  });

  it('should accept volume prop', () => {
    const { container } = render(
      <VoiceOver text="Hello world" volume={0.5} />
    );
    expect(container).toBeDefined();
  });

  it('should accept from prop', () => {
    const { container } = render(
      <VoiceOver text="Hello world" from={30} />
    );
    expect(container).toBeDefined();
  });

  it('should call onDurationChange when duration is available', async () => {
    const onDurationChange = vi.fn();

    render(
      <VoiceOver text="Hello world" onDurationChange={onDurationChange} />
    );

    // The mock returns durationInFrames: 90
    await vi.waitFor(() => {
      expect(onDurationChange).toHaveBeenCalledWith(90);
    });
  });

  it('should handle empty text gracefully', () => {
    const { container } = render(
      <VoiceOver text="" />
    );
    expect(container).toBeDefined();
  });

  it('should accept language prop', () => {
    const { container } = render(
      <VoiceOver text="Bonjour" language="fr" />
    );
    expect(container).toBeDefined();
  });

  it('should accept seed prop for reproducibility', () => {
    const { container } = render(
      <VoiceOver text="Hello world" seed={42} />
    );
    expect(container).toBeDefined();
  });

  it('should accept previousText and nextText for continuity', () => {
    const { container } = render(
      <VoiceOver
        text="Second segment"
        previousText="First segment"
        nextText="Third segment"
      />
    );
    expect(container).toBeDefined();
  });

  it('should accept trim props', () => {
    const { container } = render(
      <VoiceOver text="Hello world" trimBefore={10} trimAfter={5} />
    );
    expect(container).toBeDefined();
  });

  it('should calculate effective duration with trim props', async () => {
    const onDurationChange = vi.fn();

    render(
      <VoiceOver
        text="Hello world"
        trimBefore={10}
        trimAfter={5}
        onDurationChange={onDurationChange}
      />
    );

    // The mock returns durationInFrames: 90
    // With trimBefore=10 and trimAfter=5, effective duration should be 75
    await vi.waitFor(() => {
      expect(onDurationChange).toHaveBeenCalledWith(75);
    });
  });
});
