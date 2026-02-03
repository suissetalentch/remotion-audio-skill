import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { SoundEffect } from '../../../src/components/SoundEffect';
import { configureAudioSkill, resetConfig } from '../../../src/config';
import { resetSFXService } from '../../../src/services/sfx.service';
import { resetCacheManager } from '../../../src/cache/cache-manager';

describe('SoundEffect', () => {
  beforeEach(() => {
    resetConfig();
    resetSFXService();
    resetCacheManager();
    configureAudioSkill({ apiKey: 'test-api-key' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render without crashing', () => {
    const { container } = render(
      <SoundEffect prompt="whoosh transition" />
    );
    expect(container).toBeDefined();
  });

  it('should accept durationSeconds prop', () => {
    const { container } = render(
      <SoundEffect prompt="ding" durationSeconds={1} />
    );
    expect(container).toBeDefined();
  });

  it('should accept volume prop', () => {
    const { container } = render(
      <SoundEffect prompt="click" volume={0.8} />
    );
    expect(container).toBeDefined();
  });
});
