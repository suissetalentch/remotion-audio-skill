/**
 * Script pour générer et rendre une vidéo de démo complète
 * Usage: npx tsx scripts/render-demo.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// Load .env
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

// Dynamic imports after env is loaded
async function main() {
  const { configureAudioSkill } = await import('../src/config');
  const { getTTSService } = await import('../src/services/tts.service');
  const { getSFXService } = await import('../src/services/sfx.service');

  console.log('🎬 Remotion Audio Skill - Demo Video Generator\n');

  const EXAMPLE_DIR = path.join(__dirname, '..', 'example');
  const PUBLIC_DIR = path.join(EXAMPLE_DIR, 'public');
  const OUTPUT_DIR = path.join(EXAMPLE_DIR, 'out');

  // Ensure directories exist
  [PUBLIC_DIR, OUTPUT_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // Configure API
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.error('❌ ELEVENLABS_API_KEY non trouvée');
    process.exit(1);
  }
  configureAudioSkill({ apiKey });
  console.log('✅ API configurée\n');

  // Step 1: Generate Voice-over
  console.log('🎙️  Génération de la voix-off...');
  const ttsService = getTTSService();
  const voiceResult = await ttsService.generateSpeech(
    'Bonjour et bienvenue. Ceci est une démonstration de remotion audio skill. ' +
    'Ce package permet de générer automatiquement des voix off, de la musique et des effets sonores ' +
    'directement dans vos compositions Remotion.',
    { language: 'fr' }
  );
  const voicePath = path.join(PUBLIC_DIR, 'voice.mp3');
  fs.writeFileSync(voicePath, Buffer.from(voiceResult.audio));
  console.log(`   ✅ Voix générée: ${voicePath}\n`);

  // Step 2: Generate SFX
  console.log('🔊 Génération de l\'effet sonore...');
  const sfxService = getSFXService();
  const sfxResult = await sfxService.generateSFX('smooth whoosh transition intro', {
    durationSeconds: 1.5,
  });
  const sfxPath = path.join(PUBLIC_DIR, 'sfx.mp3');
  fs.writeFileSync(sfxPath, Buffer.from(sfxResult.audio));
  console.log(`   ✅ SFX généré: ${sfxPath}\n`);

  // Step 3: Get audio duration for video length
  console.log('📐 Calcul de la durée...');
  const voiceDuration = await getAudioDuration(voicePath);
  const fps = 30;
  const voiceStartFrame = 60; // 2 seconds intro
  const totalFrames = Math.ceil((voiceDuration + 2 + 1) * fps); // voice + intro + outro
  console.log(`   📊 Durée voix: ${voiceDuration.toFixed(2)}s`);
  console.log(`   📊 Total frames: ${totalFrames} (${(totalFrames/fps).toFixed(1)}s)\n`);

  // Step 4: Create Root.tsx with correct paths
  console.log('📝 Création de la composition Remotion...');
  const rootContent = `
import { Composition } from 'remotion';
import { SimpleDemoVideo } from './SimpleDemoVideo';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="DemoVideo"
      component={SimpleDemoVideo}
      durationInFrames={${totalFrames}}
      fps={${fps}}
      width={1920}
      height={1080}
      defaultProps={{
        voiceAudioSrc: require('./public/voice.mp3'),
        sfxAudioSrc: require('./public/sfx.mp3'),
      }}
    />
  );
};
`;
  // Actually use staticFile approach
  const rootContentFixed = `
import React from 'react';
import { Composition, staticFile } from 'remotion';
import { SimpleDemoVideo } from './SimpleDemoVideo';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="DemoVideo"
      component={SimpleDemoVideo}
      durationInFrames={${totalFrames}}
      fps={${fps}}
      width={1920}
      height={1080}
      defaultProps={{
        voiceAudioSrc: staticFile('voice.mp3'),
        sfxAudioSrc: staticFile('sfx.mp3'),
      }}
    />
  );
};
`;
  fs.writeFileSync(path.join(EXAMPLE_DIR, 'src', 'Root.tsx'), rootContentFixed);
  console.log(`   ✅ Root.tsx créé\n`);

  // Step 5: Render video
  console.log('🎬 Rendu de la vidéo...');
  console.log('   (Cela peut prendre quelques minutes)\n');

  const outputPath = path.join(OUTPUT_DIR, 'demo-video.mp4');

  try {
    execSync(
      `cd ${EXAMPLE_DIR} && npx remotion render DemoVideo ${outputPath} --props='{"voiceAudioSrc":"voice.mp3","sfxAudioSrc":"sfx.mp3"}'`,
      { stdio: 'inherit', timeout: 300000 }
    );
    console.log(`\n✅ Vidéo rendue: ${outputPath}`);
  } catch (error) {
    console.error('❌ Erreur de rendu:', error);
  }

  console.log('\n═'.repeat(50));
  console.log('🎉 Terminé!');
  console.log(`📁 Vidéo de sortie: ${outputPath}`);
}

function getAudioDuration(filePath: string): Promise<number> {
  return new Promise((resolve) => {
    // Use ffprobe or estimate from file size
    // For MP3 ~128kbps: size / (128000/8) = duration
    const stats = fs.statSync(filePath);
    const estimatedDuration = stats.size / (128000 / 8);
    resolve(estimatedDuration);
  });
}

main().catch(console.error);
