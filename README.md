# remotion-audio-skill

Add AI-powered voice-over to your Remotion videos with ElevenLabs.

## Installation

```bash
npm install remotion-audio-skill
```

**Requirements:**
- Node.js 18+
- Remotion 4.0+
- ElevenLabs API key ([get one free](https://elevenlabs.io))

## Quick Start

### Option 1: Using Claude Code (Recommended)

If you use [Claude Code](https://claude.ai/claude-code), install the skill:

```bash
npx remotion-audio-install-skill
```

Then in your Remotion project:

```
/remotion-audio
```

The skill will:
1. Detect your existing video compositions
2. Ask what voice/music you want
3. Modify your component automatically
4. Create the prerender script

### Option 2: Manual Setup

**1. Create a prerender script** (`scripts/prerender-audio.ts`):

```typescript
import { configureAudioSkill } from 'remotion-audio-skill';
import { prerenderAudio } from 'remotion-audio-skill/server';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  configureAudioSkill({ apiKey: process.env.ELEVENLABS_API_KEY! });

  const result = await prerenderAudio({
    fps: 30,
    voiceOvers: [{
      id: 'main',
      text: 'Your narration text here.',
      voiceId: 'bIHbv24MWmeRgasZH58o', // Will (calm male)
      language: 'en',
    }],
  });

  const metaPath = path.resolve(__dirname, '../public/audio/meta.json');
  fs.mkdirSync(path.dirname(metaPath), { recursive: true });
  fs.writeFileSync(metaPath, JSON.stringify(result, null, 2));

  console.log('Audio generated!');
}

main();
```

**2. Add audio to your component:**

```tsx
import { AbsoluteFill, Audio, Sequence, staticFile } from 'remotion';
import type { PrerenderResult } from 'remotion-audio-skill';

interface Props {
  audioMeta?: PrerenderResult['audioMeta'];
}

export const MyVideo: React.FC<Props> = ({ audioMeta }) => {
  const voice = audioMeta?.voiceOvers['main'];

  return (
    <AbsoluteFill>
      {voice && (
        <Sequence from={0} durationInFrames={voice.durationFrames}>
          <Audio src={staticFile(voice.src)} />
        </Sequence>
      )}
      {/* Your video content */}
    </AbsoluteFill>
  );
};
```

**3. Load audio in your composition** (`Root.tsx`):

```tsx
<Composition
  id="MyVideo"
  component={MyVideo}
  durationInFrames={300}
  fps={30}
  width={1920}
  height={1080}
  defaultProps={{ audioMeta: { voiceOvers: {}, backgroundMusic: null, soundEffects: {} } }}
  calculateMetadata={async ({ props }) => {
    try {
      const response = await fetch(staticFile('audio/meta.json'));
      const result = await response.json();
      return {
        durationInFrames: result.totalDurationFrames + 30,
        props: { ...props, audioMeta: result.audioMeta },
      };
    } catch {
      return { props };
    }
  }}
/>
```

**4. Generate and render:**

```bash
# Set your API key
export ELEVENLABS_API_KEY=sk_your_key_here

# Generate audio
npx tsx scripts/prerender-audio.ts

# Render video
npx remotion render MyVideo out/video.mp4
```

## Voice Options

| Style | Male | Female |
|-------|------|--------|
| Calm | `bIHbv24MWmeRgasZH58o` (Will) | `FGY2WhTYpPnrIDTdsKH5` (Laura) |
| Warm | `TX3LPaxmHKxFdv7VOQHJ` (Liam) | `EXAVITQu4vr4xnSDxMaL` (Sarah) |
| Energetic | `CwhRBWXzGAHq8TQ4Fs17` (Roger) | `jBpfuIE2acCO8z3wKNLl` (Aria) |
| Conversational | `iP95p4xoKVk53GoZ742B` (Chris) | `XB0fDUnXU5powFXDhCwa` (Charlotte) |

## Adding Background Music

```typescript
const result = await prerenderAudio({
  fps: 30,
  voiceOvers: [{ id: 'main', text: '...', voiceId: '...', language: 'en' }],
  backgroundMusic: {
    prompt: 'lo-fi chill beats',
    durationSeconds: 60,
  },
});
```

Then in your component:

```tsx
{audioMeta?.backgroundMusic && (
  <Audio src={staticFile(audioMeta.backgroundMusic.src)} volume={0.2} loop />
)}
```

## Troubleshooting

**"ELEVENLABS_API_KEY not found"**
```bash
# Add to .env file
ELEVENLABS_API_KEY=sk_your_key_here
```

**Audio not playing in rendered video**
- Make sure you ran the prerender script first
- Check that `public/audio/meta.json` exists
- Verify the audio files are in `public/audio/`

## License

MIT
