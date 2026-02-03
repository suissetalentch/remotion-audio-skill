# Instructions for Claude - remotion-audio-skill

## Project Overview

This is `remotion-audio-skill`, an npm library providing native ElevenLabs integration for Remotion. It allows developers to create videos with AI-generated voice-overs, background music, sound effects, and synchronized captions using declarative React components.

**Repository**: https://github.com/suissetalentch/remotion-audio-skill

## Claude Code Skill

This project includes a Claude Code skill (`/remotion-audio`) defined in `SKILL.md`. The skill provides an interactive wizard that guides users through creating video components.

To install as a skill:
```bash
npx remotion-audio-install-skill
# or manually:
ln -s /path/to/remotion-audio-skill ~/.claude/skills/remotion-audio-skill
```

## Key Architecture

```
src/
├── client/          # ElevenLabs API client with rate limiting & retry
├── services/        # TTS, Music, SFX, STT services
├── components/      # React components (VoiceOver, BackgroundMusic, etc.)
├── hooks/           # React hooks (useVoiceOver, useAudioDucking, etc.)
├── presets/         # Production-ready voice, music, SFX presets
├── pipeline/        # Prerendering for calculateMetadata
├── cache/           # Two-level caching (L1 memory, L2 disk)
├── wizard/          # AI-assisted configuration wizard
└── utils/           # Helpers (ducking curves, audio duration, hash)
```

## Development Commands

```bash
npm run build        # Build with tsup (CJS + ESM + types)
npm run dev          # Watch mode
npm test             # Run tests with Vitest
npm run test:watch   # Watch mode tests
npm run typecheck    # TypeScript check
```

## Component Reference

### VoiceOver
```tsx
<VoiceOver
  text="Narration text"
  voiceId="aria"              // or preset="narrator-warm"
  language="en"
  from={0}                    // Start frame
  ref={voiceRef}              // For ducking/captions
/>
```

### BackgroundMusic
```tsx
<BackgroundMusic
  preset="lofi-chill"         // or prompt="your description"
  volume={0.3}
  loop
  ducking={{
    enabled: true,
    triggerRef: voiceRef,
    duckTo: 0.15,
    attackFrames: 8,
    releaseFrames: 15,
  }}
/>
```

### AutoCaption
```tsx
<AutoCaption
  audioRef={voiceRef}
  style="word-highlight"
  position="bottom"
  fontSize={48}
  highlightColor="#FFD700"
/>
```

## Available Presets

**Voice**: `narrator-warm`, `narrator-energetic`, `conversational`, `dramatic`, `tutorial`, `friendly`, `news-anchor`

**Music**: `tech-corporate`, `lofi-chill`, `cinematic-epic`, `tutorial-calm`, `energetic-pop`, `ambient-minimal`, `acoustic-warm`, `news-documentary`, `retro-synthwave`, `inspirational`

**SFX**: `transition-whoosh`, `notification-ding`, `typing-keyboard`, `success-fanfare`, `button-click`, `magic-sparkle`, etc.

## Wizard Module

The `src/wizard/` module provides programmatic access to the configuration wizard:

```typescript
import { resolvePresets, generateComponentCode, getConfigSummary } from 'remotion-audio-skill/wizard';

const config = resolvePresets({
  video_type: 'tutorial',
  voice_gender: 'female',
  voice_style: 'calm',
  language: 'en',
  background_music: 'ducking',
  music_style: 'lofi',
  captions: 'word-highlight'
});

console.log(getConfigSummary(config));

const code = generateComponentCode(config, {
  componentName: 'MyVideo',
  textPlaceholder: 'Your narration text here...'
});
```

## Testing

Tests are in `/tests`. Run with:
```bash
npm test                    # All tests
npm test -- src/wizard      # Wizard tests only
```

## Important Notes

- Always configure with `configureAudioSkill({ apiKey: ... })` before using components
- Cache directory: `.remotion-audio-cache/` (add to .gitignore)
- ElevenLabs API key required: `ELEVENLABS_API_KEY` env var
- The library exports everything from `src/index.ts`
