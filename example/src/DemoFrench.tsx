import React from 'react';
import { AbsoluteFill } from 'remotion';
import {
  configureAudioSkill,
  VoiceOver,
  BackgroundMusic,
  AutoCaption,
  useVoiceOver,
} from 'remotion-audio-skill';

// Configure the audio skill (in a real app, load from env)
if (process.env.ELEVENLABS_API_KEY) {
  configureAudioSkill({
    apiKey: process.env.ELEVENLABS_API_KEY,
  });
}

export const DemoFrench: React.FC = () => {
  const { words } = useVoiceOver({
    text: 'Bonjour, bienvenue dans cette demonstration. Decouvrez comment integrer ElevenLabs avec Remotion.',
    language: 'fr',
    transcribe: true,
  });

  return (
    <AbsoluteFill style={{ backgroundColor: '#1a1a2e' }}>
      {/* Background gradient */}
      <AbsoluteFill
        style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        }}
      />

      {/* Title */}
      <div
        style={{
          position: 'absolute',
          top: 100,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: 72,
          fontWeight: 'bold',
          color: '#e94560',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        Demo ElevenLabs + Remotion
      </div>

      {/* Subtitle */}
      <div
        style={{
          position: 'absolute',
          top: 200,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: 36,
          color: '#ffffff',
          opacity: 0.8,
          fontFamily: 'Arial, sans-serif',
        }}
      >
        Synthese vocale en francais
      </div>

      {/* Background Music with ducking */}
      <BackgroundMusic
        prompt="lo-fi chill beats, calm ambient music"
        durationSeconds={30}
        volume={0.4}
        ducking={{
          enabled: true,
          targetVolume: 0.15,
          attackTime: 9,
          releaseTime: 15,
        }}
      />

      {/* Voice-over */}
      <VoiceOver
        text="Bonjour, bienvenue dans cette demonstration. Decouvrez comment integrer ElevenLabs avec Remotion."
        language="fr"
        from={30}
        volume={1}
      />

      {/* Auto captions */}
      <AutoCaption
        words={words}
        style="word-highlight"
        fontSize={42}
        position="bottom"
      />
    </AbsoluteFill>
  );
};
