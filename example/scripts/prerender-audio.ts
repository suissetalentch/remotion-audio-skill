/**
 * Script to prerender audio before Remotion render
 * Run: npx tsx scripts/prerender-audio.ts
 */
import { configureAudioSkill } from 'remotion-audio-skill';
import { prerenderAudio } from 'remotion-audio-skill/server';
import * as fs from 'fs';
import * as path from 'path';

// Load .env
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const env = fs.readFileSync(envPath, 'utf-8');
  env.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

async function main() {
  console.log('🎙️ Prerendering audio...');

  // Configure ElevenLabs
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.error('❌ ELEVENLABS_API_KEY not found in .env');
    process.exit(1);
  }

  configureAudioSkill({ apiKey });

  // Generate audio
  const result = await prerenderAudio({
    fps: 30,
    voiceOvers: [
      {
        id: 'main',
        text: 'Welcome to this demo video. Remotion Audio Skill makes it easy to add AI-powered voice-overs to your videos.',
        voiceId: 'bIHbv24MWmeRgasZH58o', // Will (male, calm)
        language: 'en',
      },
    ],
    // Uncomment to add background music:
    // backgroundMusic: {
    //   prompt: 'lo-fi chill hip hop beats',
    //   durationSeconds: 30,
    // },
  });

  console.log('✅ Audio generated!');
  console.log(`   Duration: ${Math.round(result.totalDurationFrames / 30)}s (${result.totalDurationFrames} frames)`);

  // Write metadata
  const metaPath = path.resolve(__dirname, '../public/audio/meta.json');
  fs.writeFileSync(metaPath, JSON.stringify(result, null, 2));
  console.log(`   Metadata: public/audio/meta.json`);

  console.log('\n📽️  Now run: npx remotion render SimpleTest out/video.mp4');
}

main().catch(console.error);
