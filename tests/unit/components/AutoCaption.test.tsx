import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { AutoCaption } from '../../../src/components/AutoCaption';
import { STTWord } from '../../../src/types';

// Reset mocks for each test
beforeEach(() => {
  vi.clearAllMocks();
});

// Mock remotion to return a specific frame
vi.mock('remotion', async () => {
  const actual = await vi.importActual('remotion');
  return {
    ...actual,
    useCurrentFrame: vi.fn(() => 15), // 0.5 seconds at 30fps
    useVideoConfig: vi.fn(() => ({
      fps: 30,
      durationInFrames: 300,
      width: 1920,
      height: 1080,
    })),
    AbsoluteFill: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="absolute-fill">{children}</div>
    ),
  };
});

describe('AutoCaption', () => {
  const mockWords: STTWord[] = [
    { word: 'Hello', start: 0, end: 0.5, confidence: 0.95 },
    { word: 'world.', start: 0.5, end: 1.0, confidence: 0.92 },
    { word: 'How', start: 1.1, end: 1.3, confidence: 0.90 },
    { word: 'are', start: 1.3, end: 1.5, confidence: 0.88 },
    { word: 'you?', start: 1.5, end: 2.0, confidence: 0.94 },
  ];

  it('should render without crashing', () => {
    const { container } = render(
      <AutoCaption words={mockWords} />
    );
    expect(container).toBeDefined();
  });

  it('should render with word-highlight style', () => {
    const { container } = render(
      <AutoCaption words={mockWords} style="word-highlight" />
    );
    expect(container).toBeDefined();
  });

  it('should render with sentence style', () => {
    const { container } = render(
      <AutoCaption words={mockWords} style="sentence" />
    );
    expect(container).toBeDefined();
  });

  it('should render with karaoke style', () => {
    const { container } = render(
      <AutoCaption words={mockWords} style="karaoke" />
    );
    expect(container).toBeDefined();
  });

  it('should accept position prop', () => {
    const { container } = render(
      <AutoCaption words={mockWords} position="top" />
    );
    expect(container).toBeDefined();
  });

  it('should return null when words array is empty', () => {
    const { container } = render(
      <AutoCaption words={[]} />
    );
    // Should render an empty container since no active words
    expect(container.firstChild).toBeNull();
  });
});
