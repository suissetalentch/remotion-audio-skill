# remotion-audio-skill

<div align="center">

**The first native ElevenLabs integration for Remotion**

AI-powered audio generation with React components for video creation

[![npm version](https://img.shields.io/npm/v/remotion-audio-skill.svg)](https://www.npmjs.com/package/remotion-audio-skill)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)

[Installation](#installation) • [Quick Start](#quick-start) • [Components](#components) • [API Reference](#api-reference) • [Examples](#examples)

</div>

---

## Why remotion-audio-skill?

Creating videos with Remotion is powerful, but integrating audio has always been a manual process:

1. Generate audio in external tools (ElevenLabs UI, other TTS services)
2. Download MP3 files manually
3. Place them in your `public/` folder
4. Write `<Audio>` components with manual timing calculations
5. Synchronize captions by hand
6. **Repeat this entire workflow every time text changes**

This breaks React's declarative model. Everything is code **except** the audio.

**remotion-audio-skill solves this.** It's the first npm package that brings native ElevenLabs integration to Remotion with declarative React components. Just write:

```tsx
<VoiceOver text="Welcome to my video!" voiceId="aria" />
<BackgroundMusic prompt="lo-fi chill beats" ducking={{ enabled: true }} />
<AutoCaption audioRef={voiceRef} style="word-highlight" />
```

Audio is generated at build-time, cached intelligently, and synchronized automatically. Your entire video pipeline stays in React.

---

## Features

### Core Capabilities

- **🎙️ VoiceOver** - AI text-to-speech with 100+ multilingual voices
- **🎵 BackgroundMusic** - AI-generated music from text prompts
- **🔊 SoundEffect** - AI-generated sound effects on demand
- **📝 AutoCaption** - Word-level synchronized captions with styling
- **🎚️ AudioMixer** - Global volume control and normalization

### Advanced Features

- **🎯 Auto-Ducking** - Automatic music volume reduction during voice-overs with exponential smoothing
- **💾 Two-Level Caching** - L1 memory (sub-millisecond) + L2 disk (persistent) with SHA256 keys
- **🔄 Smart Prerendering** - Pipeline integration with Remotion's `calculateMetadata`
- **🎨 Presets** - Production-ready voice, music, and SFX configurations
- **📊 Word Transcription** - Accurate word-level timestamps for perfect caption sync
- **⚡ Rate Limiting** - Token bucket algorithm prevents API throttling
- **🔁 Retry Logic** - Exponential backoff with jitter for resilient API calls

---

## Installation

```bash
npm install remotion-audio-skill
```

### Requirements

- Node.js 18+
- Remotion 4.0+
- React 18+
- ElevenLabs API key ([get one free](https://elevenlabs.io))

---

## Quick Start

### 1. Configure the Library

Create a configuration file or add to your `remotion.config.ts`:

```typescript
import { configureAudioSkill } from 'remotion-audio-skill';

configureAudioSkill({
  apiKey: process.env.ELEVENLABS_API_KEY!,
  cacheDir: './.remotion-audio-cache',
  defaultVoiceId: 'aria',
  defaultModel: 'eleven_multilingual_v2',
});
```

### 2. Create Your First Video

```tsx
import { AbsoluteFill } from 'remotion';
import { VoiceOver, BackgroundMusic, AutoCaption, useVoiceOverRef } from 'remotion-audio-skill';

export const MyVideo: React.FC = () => {
  const voiceRef = useVoiceOverRef();

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <BackgroundMusic
        prompt="upbeat corporate technology"
        volume={0.3}
        loop
        ducking={{
          enabled: true,
          triggerRef: voiceRef,
          duckTo: 0.1,
          attackFrames: 8,
          releaseFrames: 15
        }}
      />

      <VoiceOver
        ref={voiceRef}
        text="Welcome to the future of video creation with AI-powered audio!"
        voiceId="aria"
        language="en"
        from={30}
      />

      <AutoCaption
        audioRef={voiceRef}
        style="word-highlight"
        fontSize={48}
        highlightColor="#FFD700"
      />
    </AbsoluteFill>
  );
};
```

### 3. Set Environment Variables

```bash
export ELEVENLABS_API_KEY=your_api_key_here
```

### 4. Run Remotion Studio

```bash
npx remotion studio
```

That's it! Your audio will be generated, cached, and synchronized automatically.

---

## Components

### `<VoiceOver />`

Generate AI voice-over narration with word-level transcription.

```tsx
<VoiceOver
  text="Your narration text here"
  voiceId="aria"                    // ElevenLabs voice ID or preset name
  model="eleven_multilingual_v2"    // TTS model
  language="en"                     // ISO 639-1 language code
  from={0}                          // Start frame (default: 0)
  volume={1}                        // Volume 0-1 or callback function

  // Voice settings (0-1)
  stability={0.5}
  similarityBoost={0.75}
  style={0}

  // Advanced options
  seed={42}                         // For reproducibility
  previousText="..."                // Context for continuity
  nextText="..."                    // Context for continuity
  trimBefore={10}                   // Trim frames from start
  trimAfter={10}                    // Trim frames from end
  preset="narrator-warm"            // Use preset configuration

  // Callbacks
  ref={voiceRef}                    // Access metadata and transcription
  name="intro-voiceover"            // Sequence name in timeline
/>
```

**Available Presets:**
- `narrator-warm` - Warm, professional (documentaries, explainers)
- `narrator-energetic` - Energetic (marketing, product launches)
- `conversational` - Natural tone (podcasts, casual content)
- `dramatic` - Strong emotion (trailers, storytelling)
- `tutorial` - Clear instruction (how-to videos)
- `friendly` - Approachable (customer service, onboarding)
- `news-anchor` - Professional (news, formal announcements)

### `<BackgroundMusic />`

AI-generated background music with auto-ducking support.

```tsx
<BackgroundMusic
  prompt="lo-fi chill hip hop beats"
  durationSeconds={120}             // Duration (10-300 seconds)
  volume={0.5}                      // Static volume or callback
  loop={true}                       // Loop the audio

  // Fade effects
  fadeInFrames={30}                 // Fade in duration
  fadeOutFrames={60}                // Fade out duration

  // Auto-ducking configuration
  ducking={{
    enabled: true,
    triggerRef: voiceRef,           // Reference to VoiceOver
    duckTo: 0.15,                   // Target volume during speech
    attackFrames: 8,                // Frames to duck down
    releaseFrames: 15,              // Frames to restore
  }}

  from={0}                          // Start frame
  preset="lofi-chill"               // Use preset configuration
  name="background-music"           // Sequence name
/>
```

**Available Presets:**
- `tech-corporate` - Upbeat technology (product demos)
- `lofi-chill` - Relaxed beats (tutorials, study content)
- `cinematic-epic` - Orchestral drama (trailers)
- `tutorial-calm` - Ambient calm (how-to videos)
- `energetic-pop` - Upbeat pop (marketing, social media)
- `ambient-minimal` - Minimal soundscape (focus, meditation)
- `acoustic-warm` - Acoustic guitar (lifestyle, vlogs)
- `news-documentary` - Professional (news, documentaries)
- `retro-synthwave` - 80s synth (gaming, retro content)
- `inspirational` - Uplifting (motivational content)

### `<SoundEffect />`

AI-generated sound effects for transitions and interactions.

```tsx
<SoundEffect
  prompt="smooth whoosh transition"
  durationSeconds={1}               // Duration (0.5-22 seconds)
  from={60}                         // Start frame
  volume={0.8}                      // Volume 0-1
  promptInfluence={0.5}             // AI prompt strength
  preset="transition-whoosh"        // Use preset configuration
/>
```

**Available Presets:**
- `transition-whoosh` - Smooth swoosh (scene transitions)
- `notification-ding` - Pleasant ding (alerts, notifications)
- `typing-keyboard` - Mechanical typing (code demos)
- `ambient-office` - Office ambience (workspace scenes)
- `success-fanfare` - Triumphant sound (achievements)
- `error-buzz` - Error sound (failed actions)
- `button-click` - UI click (menu selections)
- `page-turn` - Paper flip (document navigation)
- `pop-bubble` - Soft pop (appearing elements)
- `countdown-tick` - Timer tick (countdowns)
- `swipe-slide` - Smooth swipe (card swipes)
- `camera-shutter` - Shutter click (screenshots)
- `magic-sparkle` - Magical shimmer (special highlights)
- `subtle-impact` - Gentle thud (text reveals)
- `loading-process` - Processing sound (loading states)

### `<AutoCaption />`

Synchronized word-by-word captions using transcription data.

```tsx
<AutoCaption
  audioRef={voiceRef}               // Reference to VoiceOver
  style="word-highlight"            // Caption style

  // Positioning
  position="bottom"                 // "top" | "center" | "bottom"

  // Styling
  fontSize={48}
  fontColor="#FFFFFF"
  backgroundColor="rgba(0,0,0,0.7)"
  highlightColor="#FFD700"          // Active word color
  fontFamily="Arial, sans-serif"

  // Layout
  maxWordsPerLine={8}               // Words per line
  animationStyle="fade"             // "fade" | "slide" | "scale"
/>
```

**Caption Styles:**
- `word-highlight` - Highlight each word as it's spoken
- `sentence` - Show full sentences
- `karaoke` - Karaoke-style progressive highlighting

### `<AudioMixer />`

Global audio control wrapper with normalization support.

```tsx
<AudioMixer
  masterVolume={0.8}                // Global volume multiplier
  normalize={true}                  // Enable LUFS normalization
  targetLUFS={-14}                  // Target loudness (broadcast standard)
>
  <VoiceOver text="..." />
  <BackgroundMusic prompt="..." />
  <SoundEffect prompt="..." />
</AudioMixer>
```

---

## Hooks

### `useVoiceOver()`

Programmatic access to voice-over generation.

```tsx
const {
  audioSrc,           // Path to generated audio
  durationInFrames,   // Duration in frames
  durationMs,         // Duration in milliseconds
  isLoading,          // Generation in progress
  error,              // Error if generation failed
  words,              // Word-level transcription
  isReady,            // Audio ready to play
} = useVoiceOver({
  text: "Hello, world!",
  voiceId: "aria",
  language: "en",
  transcribe: true,
});
```

### `useVoiceOverRef()`

Create a reference for accessing voice-over metadata and enabling auto-ducking.

```tsx
const voiceRef = useVoiceOverRef();

// Use with components
<VoiceOver ref={voiceRef} text="..." />
<BackgroundMusic ducking={{ triggerRef: voiceRef }} />
<AutoCaption audioRef={voiceRef} />

// Access metadata
console.log(voiceRef.current?.durationFrames);
console.log(voiceRef.current?.transcription);
console.log(voiceRef.current?.speechRegions);
```

**VoiceOverRefHandle:**
```typescript
interface VoiceOverRefHandle {
  audioSrc: string | null;
  durationFrames: number;
  durationMs: number;
  transcription: WordAlignment[] | null;
  isReady: boolean;
  speechRegions: Array<{ startFrame: number; endFrame: number }>;
}
```

### `useBackgroundMusic()`

Programmatic music generation.

```tsx
const { audioSrc, isLoading, error } = useBackgroundMusic({
  prompt: "epic cinematic orchestral",
  durationSeconds: 60,
});
```

### `useAudioDucking()`

Manual control over ducking volume curves.

```tsx
const { volume, setVoiceActive } = useAudioDucking({
  ducking: {
    enabled: true,
    targetVolume: 0.2,
    attackFrames: 10,
    releaseFrames: 20,
  },
  voiceStartFrame: 30,
  voiceEndFrame: 120,
});

// Use in volume callback
<Audio src={musicSrc} volume={volume} />
```

### `useAudioSync()`

Synchronize animations with audio transcription.

```tsx
const { currentWord, highlightedWords } = useAudioSync({
  words: transcription,
  frame: useCurrentFrame(),
});
```

---

## API Reference

### Configuration

```typescript
configureAudioSkill({
  apiKey: string;                   // Required: ElevenLabs API key
  baseUrl?: string;                 // Default: https://api.elevenlabs.io/v1
  cacheDir?: string;                // Default: ./.remotion-audio-cache
  cacheTTL?: number;                // Cache TTL in days (default: 30)
  cacheEnabled?: boolean;           // Enable caching (default: true)
  rateLimitPerMinute?: number;      // API rate limit (default: 100)
  maxRetries?: number;              // Retry attempts (default: 3)
  timeoutMs?: number;               // Request timeout (default: 30000)
  defaultVoiceId?: string;          // Default voice (default: aria)
  defaultModel?: string;            // Default TTS model
  budgetLimitCredits?: number;      // Optional budget safety limit
});
```

### Services

Access ElevenLabs services directly for advanced use cases:

```typescript
import {
  getTTSService,
  getMusicService,
  getSFXService,
  getSTTService
} from 'remotion-audio-skill';

// Text-to-Speech
const ttsService = getTTSService();
const ttsResponse = await ttsService.generateSpeech("Hello!", {
  voiceId: "aria",
  model: "eleven_multilingual_v2",
  language: "en",
});

// Music Generation
const musicService = getMusicService();
const musicResponse = await musicService.generateMusic(
  "upbeat electronic",
  { durationSeconds: 30 }
);

// Sound Effects
const sfxService = getSFXService();
const sfxResponse = await sfxService.generateSFX(
  "whoosh transition",
  { durationSeconds: 1 }
);

// Speech-to-Text (Transcription)
const sttService = getSTTService();
const transcription = await sttService.transcribe(audioBuffer, {
  language: "en",
});
```

### Cache Management

```typescript
import { getCacheManager } from 'remotion-audio-skill';

const cache = getCacheManager();

// Get cache statistics
const stats = await cache.getStats();
console.log(`L1: ${stats.l1Size}, L2: ${stats.l2Size}`);
console.log(`Total size: ${stats.totalSizeBytes} bytes`);

// Purge expired entries
const purged = await cache.purgeExpired();
console.log(`Removed ${purged.count} entries, freed ${purged.bytesFreed} bytes`);

// Clear all cache
await cache.clear();

// Manual cache operations
const key = computeTTSCacheKey({ text: "Hello", voiceId: "aria" });
const cached = await cache.get(key);
await cache.set(key, audioBuffer, { ttl: 30 });
```

### Pipeline Prerendering

For advanced workflows, prerender all audio in `calculateMetadata`:

```tsx
import { Composition } from 'remotion';
import { prerenderAudio } from 'remotion-audio-skill';

export const MyComposition = () => (
  <Composition
    id="my-video"
    component={MyVideo}
    fps={30}
    width={1920}
    height={1080}
    durationInFrames={300}
    calculateMetadata={async ({ props }) => {
      const result = await prerenderAudio({
        fps: 30,
        voiceOvers: [
          {
            id: 'intro',
            text: 'Welcome to my video!',
            preset: 'narrator-warm'
          },
          {
            id: 'outro',
            text: 'Thanks for watching!',
            voiceId: 'aria'
          },
        ],
        backgroundMusic: {
          prompt: 'tech-corporate',
          durationSeconds: 120,
        },
        soundEffects: [
          {
            id: 'transition',
            preset: 'transition-whoosh',
            from: 60
          },
        ],
      });

      return {
        durationInFrames: result.totalDurationFrames,
        props: { ...props, audioMeta: result.audioMeta },
      };
    }}
  />
);
```

---

## Presets

Presets provide production-ready configurations for common use cases.

### Voice Presets

```typescript
import { getVoicePreset, getAvailableVoicePresets } from 'remotion-audio-skill';

// Get all preset names
const presets = getAvailableVoicePresets();
// ['narrator-warm', 'narrator-energetic', 'conversational', ...]

// Get preset configuration
const preset = getVoicePreset('narrator-warm');
console.log(preset.voiceId);        // "EXAVITQu4vr4xnSDxMaL"
console.log(preset.stability);      // 0.6
console.log(preset.description);    // "Warm, professional narrator..."
```

### Music Presets

```typescript
import { getMusicPreset, getAvailableMusicPresets } from 'remotion-audio-skill';

const presets = getAvailableMusicPresets();
const preset = getMusicPreset('lofi-chill');
console.log(preset.prompt);         // "lo-fi chill hip hop beats..."
console.log(preset.suggestedDuration); // 180
```

### SFX Presets

```typescript
import { getSFXPreset, getAvailableSFXPresets } from 'remotion-audio-skill';

const presets = getAvailableSFXPresets();
const preset = getSFXPreset('transition-whoosh');
console.log(preset.prompt);         // "smooth whoosh transition..."
console.log(preset.suggestedDuration); // 1
```

---

## Utilities

### Audio Duration

```typescript
import {
  getAudioDuration,
  getAudioDurationInFrames,
  secondsToFrames,
  framesToSeconds,
  formatDuration,
} from 'remotion-audio-skill';

// Get duration from audio buffer
const durationMs = await getAudioDuration(audioBuffer);
const durationFrames = getAudioDurationInFrames(audioBuffer, 30);

// Convert between seconds and frames
const frames = secondsToFrames(5.5, 30);    // 165 frames
const seconds = framesToSeconds(165, 30);   // 5.5 seconds

// Format duration for display
const formatted = formatDuration(125500);   // "2:05.500"
```

### Ducking Utilities

```typescript
import {
  computeDuckingCurveExponential,
  wordsToDuckingSegments,
} from 'remotion-audio-skill';

// Create ducking curve from speech regions
const curve = computeDuckingCurveExponential(
  totalFrames,
  speechRegions,
  {
    baseVolume: 0.5,
    duckTo: 0.15,
    attackFrames: 8,
    releaseFrames: 15,
  }
);

// Convert word alignments to speech segments
const segments = wordsToDuckingSegments(wordAlignments, 30);
```

### Hash Utilities

```typescript
import {
  sha256,
  computeCacheKey,
  computeTTSCacheKey,
} from 'remotion-audio-skill';

// Generate cache key for TTS
const key = computeTTSCacheKey({
  text: "Hello, world!",
  voiceId: "aria",
  model: "eleven_multilingual_v2",
  stability: 0.5,
  similarityBoost: 0.75,
});
```

---

## Examples

### Complete Video with Auto-Ducking

```tsx
import { AbsoluteFill, Sequence } from 'remotion';
import {
  VoiceOver,
  BackgroundMusic,
  SoundEffect,
  AutoCaption,
  AudioMixer,
  useVoiceOverRef,
} from 'remotion-audio-skill';

export const DemoVideo: React.FC = () => {
  const voiceRef = useVoiceOverRef();

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a0a' }}>
      <AudioMixer masterVolume={1} normalize targetLUFS={-14}>

        {/* Background music with auto-ducking */}
        <BackgroundMusic
          preset="lofi-chill"
          volume={0.3}
          loop
          fadeInFrames={30}
          fadeOutFrames={60}
          ducking={{
            enabled: true,
            triggerRef: voiceRef,
            duckTo: 0.08,
            attackFrames: 8,
            releaseFrames: 15,
          }}
        />

        {/* Transition sound effect */}
        <SoundEffect
          preset="transition-whoosh"
          from={60}
          volume={0.7}
        />

        {/* Voice-over narration */}
        <VoiceOver
          ref={voiceRef}
          text="Welcome to this demonstration of AI-powered video creation with seamless audio integration."
          preset="narrator-warm"
          from={90}
        />

        {/* Synchronized captions */}
        <AutoCaption
          audioRef={voiceRef}
          style="word-highlight"
          position="bottom"
          fontSize={42}
          highlightColor="#FFD700"
        />

      </AudioMixer>
    </AbsoluteFill>
  );
};
```

### Multi-Language Tutorial

```tsx
export const TutorialVideo: React.FC = () => {
  const voiceRefEn = useVoiceOverRef();
  const voiceRefFr = useVoiceOverRef();

  return (
    <AbsoluteFill>
      <AudioMixer masterVolume={0.9}>

        <BackgroundMusic preset="tutorial-calm" loop />

        {/* English narration */}
        <VoiceOver
          ref={voiceRefEn}
          text="This tutorial will guide you through the basics."
          language="en"
          preset="tutorial"
          from={0}
        />
        <AutoCaption audioRef={voiceRefEn} position="bottom" />

        {/* French narration */}
        <VoiceOver
          ref={voiceRefFr}
          text="Ce tutoriel vous guidera à travers les bases."
          language="fr"
          preset="tutorial"
          from={180}
        />
        <AutoCaption audioRef={voiceRefFr} position="bottom" />

      </AudioMixer>
    </AbsoluteFill>
  );
};
```

### Dynamic Volume Control

```tsx
export const DynamicVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Fade in music over 2 seconds
  const musicVolume = interpolate(
    frame,
    [0, fps * 2],
    [0, 0.4],
    { extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill>
      <BackgroundMusic
        preset="cinematic-epic"
        volume={musicVolume}  // Dynamic volume
      />

      <VoiceOver
        text="Experience the power of dynamic audio control."
        volume={(f) => interpolate(f, [0, 30], [0, 1])} // Fade in voice
      />
    </AbsoluteFill>
  );
};
```

---

## Configuration Best Practices

### Environment Variables

Create a `.env` file in your project root:

```bash
ELEVENLABS_API_KEY=sk_your_api_key_here
```

### Remotion Configuration

Add to `remotion.config.ts`:

```typescript
import { Config } from '@remotion/cli/config';
import { configureAudioSkill } from 'remotion-audio-skill';

// Configure audio skill
configureAudioSkill({
  apiKey: process.env.ELEVENLABS_API_KEY!,
  cacheDir: './.remotion-audio-cache',
  cacheTTL: 30,
  defaultVoiceId: 'aria',
  defaultModel: 'eleven_multilingual_v2',
  rateLimitPerMinute: 100,
});

// Remotion config
Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
```

### Cache Directory

Add to `.gitignore`:

```
.remotion-audio-cache/
```

---

## Performance & Caching

### Two-Level Cache System

**L1 Cache (Memory):**
- In-memory Map with sub-millisecond access
- Cleared when Node.js process exits
- Ideal for repeated renders in the same session

**L2 Cache (Disk):**
- Persistent file-based cache in `.remotion-audio-cache/`
- Survives process restarts
- TTL-based expiration (default: 30 days)
- SHA256 keys for deterministic caching

### Cache Key Generation

Cache keys are deterministic hashes based on:
- Text content
- Voice ID
- Model name
- Voice settings (stability, similarity boost, style)
- Language
- Seed (if specified)

**Same inputs = same cache key = instant retrieval**

### Cost Optimization

With caching, you only pay for audio generation **once**:

```
First render:  API call → $0.XXX
Second render: Cache hit → $0.000
Third render:  Cache hit → $0.000
...
```

For a typical 2-minute video:
- ~600 TTS credits (~$0.06)
- 4 music generations (included in free tier)

After initial generation, subsequent renders are **free**.

---

## Troubleshooting

### Common Issues

**Audio not generating:**
```bash
# Check API key is set
echo $ELEVENLABS_API_KEY

# Verify configuration
node -e "require('./dist').getConfig()"
```

**Cache issues:**
```bash
# Clear cache manually
rm -rf .remotion-audio-cache/

# Or use cache manager
npx tsx -e "
  import { getCacheManager } from 'remotion-audio-skill';
  await getCacheManager().clear();
"
```

**Rate limiting:**
```typescript
// Reduce rate limit in config
configureAudioSkill({
  rateLimitPerMinute: 50,  // Lower limit
});
```

**Slow generation:**
```typescript
// Use faster model
configureAudioSkill({
  defaultModel: 'eleven_flash_v2_5',  // 75ms latency
});
```

---

## TypeScript Support

Full TypeScript support with comprehensive type definitions:

```typescript
import type {
  VoiceOverProps,
  BackgroundMusicProps,
  SoundEffectProps,
  AutoCaptionProps,
  DuckingConfig,
  VoiceSettings,
  TTSRequest,
  TTSResponse,
  WordAlignment,
  VoiceOverRefHandle,
} from 'remotion-audio-skill';
```

---

## Contributing

Contributions are welcome! This library is in active development.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/remotion-audio-skill.git
cd remotion-audio-skill

# Install dependencies
npm install

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Build the library
npm run build

# Run example in Remotion Studio
cd example
npm install
npx remotion studio
```

### Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

For detailed contribution guidelines, see [CONTRIBUTING.md](./CONTRIBUTING.md).

---

## Roadmap

- [ ] Support for ElevenLabs Voice Isolation
- [ ] Real-time audio generation mode
- [ ] Audio effects (reverb, EQ, compression)
- [ ] Visual waveform components
- [ ] SSML support for advanced voice control
- [ ] Batch generation optimization
- [ ] Audio visualization components
- [ ] Custom voice cloning support

---

## License

MIT License - see [LICENSE](./LICENSE) file for details.

---

## Credits

Built with:
- [Remotion](https://remotion.dev) - Programmatic video framework
- [ElevenLabs](https://elevenlabs.io) - AI audio generation API
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Vitest](https://vitest.dev/) - Testing framework

---

## Support

- **Documentation**: [Full API docs](#api-reference)
- **Examples**: See [`/example`](./example) directory
- **Issues**: [GitHub Issues](https://github.com/yourusername/remotion-audio-skill/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/remotion-audio-skill/discussions)

---

<div align="center">

Made with ❤️ for the Remotion community

[⭐ Star on GitHub](https://github.com/yourusername/remotion-audio-skill) • [📦 npm Package](https://www.npmjs.com/package/remotion-audio-skill) • [📖 Documentation](#readme)

</div>
