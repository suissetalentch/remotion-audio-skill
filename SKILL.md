---
name: remotion-audio
description: Add AI-powered voice-over to existing Remotion videos. Detects your video components and enriches them with ElevenLabs audio.
argument-hint: ""
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, AskUserQuestion
---

<remotion-audio>

# Remotion Audio Skill

You help users add AI-powered voice-over to their **existing Remotion video components**.

## Step 1: Project Validation (BLOCKING)

### Check 1: Is this a Remotion project?

Look for `remotion.config.ts`, `remotion.config.js`, or `"remotion"` in `package.json`.

**If NOT a Remotion project:**
```
⚠️ This doesn't appear to be a Remotion project.
Run: npx create-video@latest
```
**STOP HERE.**

### Check 2: Is remotion-audio-skill installed?

Check `package.json` for `remotion-audio-skill`.

**If NOT installed:** Ask to install automatically:
- **Install now (Recommended)** → Run `npm install remotion-audio-skill`
- **I'll install manually** → STOP

### Check 3: ELEVENLABS_API_KEY (warning only)

If `.env` missing `ELEVENLABS_API_KEY`, warn but continue.

## Step 2: Detect Existing Video Components

Search for existing Remotion compositions:

1. Read `src/Root.tsx` (or equivalent) to find `<Composition>` declarations
2. List all component files that are used as compositions
3. Read each component file to understand its structure

**Store a list of:**
- Composition ID
- Component file path
- Whether it already has audio (imports `Audio` from remotion)

## Step 3: Select Component to Enrich

Use AskUserQuestion to ask which component to add voice-over to:

```
Which video component do you want to add voice-over to?
```

Options should list the detected compositions, e.g.:
- **MyVideo** (src/MyVideo.tsx) - No audio yet
- **IntroVideo** (src/IntroVideo.tsx) - Already has audio
- **Create new component** - Start fresh

## Step 4: Audio Configuration Wizard

Ask these questions IN ORDER:

### Question 1: Narration Text
Ask what text should be spoken:
```
What should the voice say? (You can edit this later in the prerender script)
```
Let user type their narration text.

### Question 2: Voice Gender
- **Female voice**
- **Male voice**
- **No preference**

### Question 3: Voice Style
- **Calm & Instructional** - Clear, educational tone
- **Warm & Professional** - Trustworthy, documentary-style
- **Energetic & Dynamic** - Exciting, promotional tone
- **Conversational & Friendly** - Casual, approachable

### Question 4: Language
- English, French, German, Spanish, etc.

### Question 5: Background Music
- **Yes, with auto-ducking (Recommended)**
- **Yes, constant volume**
- **No background music**

### Question 6: Music Style (if music enabled)
- Lo-fi / Chill, Corporate / Tech, Cinematic, Ambient, Energetic

## Voice ID Mapping

**Female voices:**
- calm: `FGY2WhTYpPnrIDTdsKH5` (Laura)
- warm: `EXAVITQu4vr4xnSDxMaL` (Sarah)
- energetic: `jBpfuIE2acCO8z3wKNLl` (Aria)
- conversational: `XB0fDUnXU5powFXDhCwa` (Charlotte)

**Male voices:**
- calm: `bIHbv24MWmeRgasZH58o` (Will)
- warm: `TX3LPaxmHKxFdv7VOQHJ` (Liam)
- energetic: `CwhRBWXzGAHq8TQ4Fs17` (Roger)
- conversational: `iP95p4xoKVk53GoZ742B` (Chris)

**Music presets:**
- lofi → `lofi-chill`
- corporate → `tech-corporate`
- cinematic → `cinematic-epic`
- ambient → `ambient-minimal`
- energetic → `energetic-pop`

## Step 5: Modify Existing Component

### 5.1 Add imports to the component file

Add these imports at the top (if not already present):
```typescript
import { Audio, Sequence, staticFile } from 'remotion';
```

### 5.2 Add props interface

Add or extend the Props interface:
```typescript
interface Props {
  // ... existing props
  audioMeta?: {
    voiceOvers: Record<string, { src: string; durationFrames: number }>;
    backgroundMusic: { src: string } | null;
  };
}
```

### 5.3 Inject audio components

Inside the component's return JSX, add:
```tsx
{/* Voice Over */}
{props.audioMeta?.voiceOvers['main'] && (
  <Sequence from={0} durationInFrames={props.audioMeta.voiceOvers['main'].durationFrames}>
    <Audio src={staticFile(props.audioMeta.voiceOvers['main'].src)} volume={1} />
  </Sequence>
)}

{/* Background Music */}
{props.audioMeta?.backgroundMusic && (
  <Audio src={staticFile(props.audioMeta.backgroundMusic.src)} volume={0.2} loop />
)}
```

### 5.4 Update Root.tsx composition

Modify the existing `<Composition>` to add `calculateMetadata`:

```tsx
<Composition
  id="ExistingId"
  component={ExistingComponent}
  // ... existing props
  defaultProps={{
    // ... existing defaultProps
    audioMeta: { voiceOvers: {}, backgroundMusic: null, soundEffects: {} },
  }}
  calculateMetadata={async ({ props }) => {
    try {
      const response = await fetch(staticFile('audio/meta.json'));
      const result = await response.json();
      return {
        props: { ...props, audioMeta: result.audioMeta },
      };
    } catch {
      return { props };
    }
  }}
/>
```

### 5.5 Create prerender script

Create `scripts/prerender-audio.ts`:

```typescript
import { configureAudioSkill } from 'remotion-audio-skill';
import { prerenderAudio } from 'remotion-audio-skill/server';
import * as fs from 'fs';
import * as path from 'path';

// Load .env
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) process.env[key.trim()] = value.trim();
  });
}

async function main() {
  console.log('🎙️ Generating voice-over...');

  configureAudioSkill({ apiKey: process.env.ELEVENLABS_API_KEY! });

  const result = await prerenderAudio({
    fps: 30,
    voiceOvers: [{
      id: 'main',
      text: `NARRATION_TEXT_HERE`,
      voiceId: 'VOICE_ID',
      language: 'LANGUAGE',
    }],
    // backgroundMusic: { prompt: 'MUSIC_PRESET', durationSeconds: 30 },
  });

  const metaDir = path.resolve(__dirname, '../public/audio');
  if (!fs.existsSync(metaDir)) fs.mkdirSync(metaDir, { recursive: true });

  fs.writeFileSync(path.join(metaDir, 'meta.json'), JSON.stringify(result, null, 2));

  console.log('✅ Voice-over generated!');
  console.log(`   Duration: ${Math.round(result.totalDurationFrames / 30)}s`);
  console.log('\n📽️  Now render: npx remotion render COMPOSITION_ID out/video.mp4');
}

main().catch(console.error);
```

## Step 6: Output Summary

```
✅ Audio integration complete!

Modified files:
  - src/YourComponent.tsx (added audio imports and components)
  - src/Root.tsx (added calculateMetadata)
  - scripts/prerender-audio.ts (created)

Next steps:
  1. Make sure ELEVENLABS_API_KEY is in your .env file
  2. Run: npx tsx scripts/prerender-audio.ts
  3. Run: npx remotion render YourComposition out/video.mp4

Voice: Female, calm (Laura)
Language: English
Music: Lo-fi with auto-ducking
```

## Important Rules

1. **NEVER create a new component if user selects an existing one** - modify the existing file
2. **Preserve all existing code** - only ADD audio-related code
3. **Use Edit tool** to modify existing files, not Write
4. **Create scripts folder** if it doesn't exist
5. **Don't ask for filename** - detect from existing compositions

</remotion-audio>
