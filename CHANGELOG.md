# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2024-02-03

### Added

#### Core Components
- `<VoiceOver />` - Text-to-speech component with ElevenLabs integration
  - Support for all ElevenLabs models (eleven_multilingual_v2, eleven_flash_v2_5, etc.)
  - Voice settings: stability, similarity boost, style
  - Word-level transcription with timestamps
  - Seed parameter for reproducible generation
  - Context continuity with `previousText` and `nextText`
  - Audio trimming with `trimBefore` and `trimAfter`

- `<BackgroundMusic />` - AI-generated background music
  - Prompt-based music generation
  - Auto-ducking with exponential smoothing algorithm
  - Fade in/out transitions
  - Loop support
  - Integration with VoiceOver via ref for automatic ducking triggers

- `<SoundEffect />` - AI-generated sound effects
  - Prompt-based SFX generation
  - Duration control (0.5-22 seconds)
  - Prompt influence parameter

- `<AutoCaption />` - Synchronized captions from transcription
  - Three display styles: word-highlight, sentence, karaoke
  - Customizable positioning (top, center, bottom)
  - Font styling options

- `<AudioMixer />` - Global audio control wrapper
  - Master volume control
  - LUFS loudness normalization
  - React Context for child components

#### Hooks
- `useVoiceOver()` - Programmatic TTS generation
- `useVoiceOverRef()` - Expose VoiceOver metadata for ducking
- `useBackgroundMusic()` - Programmatic music generation
- `useAudioDucking()` - Manual ducking control
- `useAudioSync()` - Playback synchronization utilities

#### Services
- `TTSService` - Direct ElevenLabs TTS API access
- `MusicService` - AI music generation
- `SFXService` - AI sound effect generation
- `STTService` - Speech-to-text with word timestamps

#### Cache System
- Two-level caching (L1: Memory, L2: Disk)
- SHA256-based deterministic cache keys
- Configurable TTL (default: 30 days)
- Automatic cache promotion from L2 to L1

#### Presets
- 7 voice presets (narrator-warm, narrator-energetic, conversational, dramatic, tutorial, friendly, news-anchor)
- 10 music presets (tech-corporate, lofi-chill, cinematic-epic, tutorial-calm, energetic-pop, ambient-minimal, acoustic-warm, news-documentary, suspense-thriller, celebration)
- 15 SFX presets (transition-whoosh, notification-ding, click, pop, swoosh, success, error, typing, ambient-office, nature-birds, rain, thunder, applause, countdown-beep, logo-reveal)

#### Pipeline
- `prerenderAudio()` - Batch audio generation for `calculateMetadata`
- `createSimpleConfig()` - Quick configuration helper

#### Utilities
- Audio duration calculation and conversion
- Ducking curve computation with exponential smoothing
- SHA256 hashing for cache keys
- Frame/second conversion utilities

#### Infrastructure
- Full TypeScript support with strict mode
- ESM and CommonJS dual module output
- Comprehensive test suite (70+ unit tests)
- Rate limiting with token bucket algorithm
- Automatic retry with exponential backoff

### Technical Details

- **Minimum Node.js**: 18.0.0
- **Peer Dependencies**: React 18+, Remotion 4.0+
- **Bundle Formats**: ESM (.mjs) and CommonJS (.js)
- **TypeScript**: Strict mode with full type declarations

---

## Version History

| Version | Date | Highlights |
|---------|------|------------|
| 0.1.0 | 2024-02-03 | Initial release with full feature set |

[Unreleased]: https://github.com/suissetalentch/remotion-audio-skill/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/suissetalentch/remotion-audio-skill/releases/tag/v0.1.0
