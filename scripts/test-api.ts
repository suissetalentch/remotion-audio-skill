/**
 * Test script pour valider l'API ElevenLabs
 * Usage: npx tsx scripts/test-api.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { configureAudioSkill, getConfig } from '../src/config';
import { getTTSService } from '../src/services/tts.service';
import { getMusicService } from '../src/services/music.service';
import { getSFXService } from '../src/services/sfx.service';

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

const OUTPUT_DIR = path.join(__dirname, '..', 'test-output');

async function main() {
  console.log('🎯 Test API ElevenLabs - remotion-audio-skill\n');

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Configure
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.error('❌ ELEVENLABS_API_KEY non trouvée dans .env');
    process.exit(1);
  }

  configureAudioSkill({ apiKey });
  console.log('✅ Configuration chargée\n');

  // Test 1: TTS
  console.log('📝 Test 1: Text-to-Speech (français)...');
  try {
    const ttsService = getTTSService();
    const ttsResult = await ttsService.generateSpeech(
      'Bonjour, bienvenue dans cette démonstration de remotion audio skill.',
      { language: 'fr' }
    );

    const ttsPath = path.join(OUTPUT_DIR, 'test-tts-fr.mp3');
    fs.writeFileSync(ttsPath, Buffer.from(ttsResult.audio));
    console.log(`   ✅ TTS généré: ${ttsPath}`);
    console.log(`   📊 Taille: ${(ttsResult.audio.byteLength / 1024).toFixed(1)} KB\n`);
  } catch (error) {
    console.error('   ❌ Erreur TTS:', error);
  }

  // Test 2: TTS English
  console.log('📝 Test 2: Text-to-Speech (anglais)...');
  try {
    const ttsService = getTTSService();
    const ttsResult = await ttsService.generateSpeech(
      'Welcome to this demonstration of AI-powered audio generation.',
      { language: 'en' }
    );

    const ttsPath = path.join(OUTPUT_DIR, 'test-tts-en.mp3');
    fs.writeFileSync(ttsPath, Buffer.from(ttsResult.audio));
    console.log(`   ✅ TTS généré: ${ttsPath}`);
    console.log(`   📊 Taille: ${(ttsResult.audio.byteLength / 1024).toFixed(1)} KB\n`);
  } catch (error) {
    console.error('   ❌ Erreur TTS EN:', error);
  }

  // Test 3: SFX
  console.log('🔊 Test 3: Sound Effect (whoosh)...');
  try {
    const sfxService = getSFXService();
    const sfxResult = await sfxService.generateSFX('whoosh transition sound effect', {
      durationSeconds: 1.5,
    });

    const sfxPath = path.join(OUTPUT_DIR, 'test-sfx-whoosh.mp3');
    fs.writeFileSync(sfxPath, Buffer.from(sfxResult.audio));
    console.log(`   ✅ SFX généré: ${sfxPath}`);
    console.log(`   📊 Taille: ${(sfxResult.audio.byteLength / 1024).toFixed(1)} KB\n`);
  } catch (error) {
    console.error('   ❌ Erreur SFX:', error);
  }

  // Test 4: Music (si disponible dans le tier)
  console.log('🎵 Test 4: Background Music (30s)...');
  try {
    const musicService = getMusicService();
    const musicResult = await musicService.generateMusic('lo-fi chill hip hop beats calm ambient', {
      durationSeconds: 30,
    });

    const musicPath = path.join(OUTPUT_DIR, 'test-music-lofi.mp3');
    fs.writeFileSync(musicPath, Buffer.from(musicResult.audio));
    console.log(`   ✅ Music généré: ${musicPath}`);
    console.log(`   📊 Taille: ${(musicResult.audio.byteLength / 1024).toFixed(1)} KB\n`);
  } catch (error: any) {
    if (error.statusCode === 403 || error.statusCode === 401) {
      console.log('   ⚠️  Music API non disponible (tier limité ou feature non activée)\n');
    } else {
      console.error('   ❌ Erreur Music:', error.message || error);
    }
  }

  console.log('═'.repeat(50));
  console.log('🎉 Tests terminés!');
  console.log(`📁 Fichiers de sortie: ${OUTPUT_DIR}`);
  console.log('\n💡 Écoute les fichiers MP3 pour valider la qualité audio.');
}

main().catch(console.error);
