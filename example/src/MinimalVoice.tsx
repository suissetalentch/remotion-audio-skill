import React from 'react';
import { AbsoluteFill } from 'remotion';
import { configureAudioSkill, VoiceOver } from 'remotion-audio-skill';

// Configure the audio skill
if (process.env.ELEVENLABS_API_KEY) {
  configureAudioSkill({
    apiKey: process.env.ELEVENLABS_API_KEY,
  });
}

export const MinimalVoice: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          fontSize: 48,
          color: '#ffffff',
          fontFamily: 'Arial, sans-serif',
          textAlign: 'center',
          padding: 40,
        }}
      >
        This is a simple voice test.
      </div>

      <VoiceOver
        text="This is a simple voice test."
        volume={1}
      />
    </AbsoluteFill>
  );
};
