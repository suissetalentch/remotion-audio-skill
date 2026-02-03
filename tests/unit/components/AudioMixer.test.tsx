import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { AudioMixer, useMasterVolume, useAudioMixerContext } from '../../../src/components/AudioMixer';

// Test component to check context value
const VolumeDisplay: React.FC = () => {
  const volume = useMasterVolume();
  return <div data-testid="volume">{volume}</div>;
};

// Test component to check full context
const ContextDisplay: React.FC = () => {
  const context = useAudioMixerContext();
  return (
    <div>
      <span data-testid="normalize">{String(context.normalize)}</span>
      <span data-testid="targetLUFS">{context.targetLUFS}</span>
      <span data-testid="gainFactor">{context.gainFactor.toFixed(3)}</span>
    </div>
  );
};

describe('AudioMixer', () => {
  it('should render children', () => {
    render(
      <AudioMixer>
        <div data-testid="child">Child content</div>
      </AudioMixer>
    );
    expect(screen.getByTestId('child')).toBeDefined();
  });

  it('should provide default master volume of 1', () => {
    render(
      <AudioMixer>
        <VolumeDisplay />
      </AudioMixer>
    );
    expect(screen.getByTestId('volume').textContent).toBe('1');
  });

  it('should provide custom master volume', () => {
    render(
      <AudioMixer masterVolume={0.5}>
        <VolumeDisplay />
      </AudioMixer>
    );
    expect(screen.getByTestId('volume').textContent).toBe('0.5');
  });

  it('should update volume when prop changes', () => {
    const { rerender } = render(
      <AudioMixer masterVolume={0.8}>
        <VolumeDisplay />
      </AudioMixer>
    );
    expect(screen.getByTestId('volume').textContent).toBe('0.8');

    rerender(
      <AudioMixer masterVolume={0.3}>
        <VolumeDisplay />
      </AudioMixer>
    );
    expect(screen.getByTestId('volume').textContent).toBe('0.3');
  });
});

describe('useMasterVolume', () => {
  it('should return 1 when used outside AudioMixer', () => {
    render(<VolumeDisplay />);
    expect(screen.getByTestId('volume').textContent).toBe('1');
  });
});

describe('AudioMixer normalization', () => {
  it('should have normalization disabled by default', () => {
    render(
      <AudioMixer>
        <ContextDisplay />
      </AudioMixer>
    );
    expect(screen.getByTestId('normalize').textContent).toBe('false');
    expect(screen.getByTestId('gainFactor').textContent).toBe('1.000');
  });

  it('should enable normalization when normalize prop is true', () => {
    render(
      <AudioMixer normalize>
        <ContextDisplay />
      </AudioMixer>
    );
    expect(screen.getByTestId('normalize').textContent).toBe('true');
    // With default targetLUFS=-14 and estimatedInput=-18, gain should be < 1
    const gainFactor = parseFloat(screen.getByTestId('gainFactor').textContent!);
    expect(gainFactor).toBeGreaterThan(0);
    expect(gainFactor).toBeLessThan(2);
  });

  it('should use default targetLUFS of -14', () => {
    render(
      <AudioMixer normalize>
        <ContextDisplay />
      </AudioMixer>
    );
    expect(screen.getByTestId('targetLUFS').textContent).toBe('-14');
  });

  it('should accept custom targetLUFS', () => {
    render(
      <AudioMixer normalize targetLUFS={-16}>
        <ContextDisplay />
      </AudioMixer>
    );
    expect(screen.getByTestId('targetLUFS').textContent).toBe('-16');
  });

  it('should compute different gain factors for different LUFS targets', () => {
    const { rerender } = render(
      <AudioMixer normalize targetLUFS={-14}>
        <ContextDisplay />
      </AudioMixer>
    );
    const gain14 = parseFloat(screen.getByTestId('gainFactor').textContent!);

    rerender(
      <AudioMixer normalize targetLUFS={-10}>
        <ContextDisplay />
      </AudioMixer>
    );
    const gain10 = parseFloat(screen.getByTestId('gainFactor').textContent!);

    // Higher LUFS target (closer to 0) should have higher gain
    expect(gain10).toBeGreaterThan(gain14);
  });
});
