import { vi, beforeEach, afterEach } from 'vitest';

// Mock Remotion modules
vi.mock('remotion', () => ({
  useCurrentFrame: vi.fn(() => 0),
  useVideoConfig: vi.fn(() => ({
    fps: 30,
    durationInFrames: 300,
    width: 1920,
    height: 1080,
  })),
  Audio: vi.fn(({ src, volume }) => null),
  Sequence: vi.fn(({ children }) => children),
  staticFile: vi.fn((path: string) => `/static/${path}`),
  interpolate: vi.fn((frame: number, inputRange: number[], outputRange: number[]) => {
    if (frame <= inputRange[0]) return outputRange[0];
    if (frame >= inputRange[inputRange.length - 1]) return outputRange[outputRange.length - 1];
    // Simple linear interpolation
    for (let i = 0; i < inputRange.length - 1; i++) {
      if (frame >= inputRange[i] && frame <= inputRange[i + 1]) {
        const progress = (frame - inputRange[i]) / (inputRange[i + 1] - inputRange[i]);
        return outputRange[i] + progress * (outputRange[i + 1] - outputRange[i]);
      }
    }
    return outputRange[0];
  }),
  continueRender: vi.fn(),
  delayRender: vi.fn(() => 1),
  getRemotionEnvironment: vi.fn(() => ({
    isStudio: false,
    isRendering: false,
    isPreview: false,
  })),
}));

// Mock fetch globally
global.fetch = vi.fn();

// Reset mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// Helper to create mock Response
export function createMockResponse(
  body: unknown,
  options: { status?: number; headers?: Record<string, string> } = {}
): Response {
  const { status = 200, headers = {} } = options;

  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: new Headers(headers),
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)),
    arrayBuffer: () => Promise.resolve(body instanceof ArrayBuffer ? body : new ArrayBuffer(0)),
  } as Response;
}

// Helper to create mock ArrayBuffer with audio data
export function createMockAudioBuffer(size: number = 1024): ArrayBuffer {
  const buffer = new ArrayBuffer(size);
  const view = new Uint8Array(buffer);
  // Fill with some data to simulate audio
  for (let i = 0; i < size; i++) {
    view[i] = Math.floor(Math.random() * 256);
  }
  return buffer;
}
