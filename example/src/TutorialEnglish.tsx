import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import {
  configureAudioSkill,
  VoiceOver,
  SoundEffect,
} from 'remotion-audio-skill';

// Configure the audio skill
if (process.env.ELEVENLABS_API_KEY) {
  configureAudioSkill({
    apiKey: process.env.ELEVENLABS_API_KEY,
  });
}

export const TutorialEnglish: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#0d1b2a' }}>
      {/* Background */}
      <AbsoluteFill
        style={{
          background: 'linear-gradient(180deg, #0d1b2a 0%, #1b263b 100%)',
        }}
      />

      {/* Opening whoosh */}
      <SoundEffect
        prompt="whoosh transition sound effect"
        from={0}
        volume={0.7}
      />

      {/* Title sequence */}
      <Sequence from={0} durationInFrames={60}>
        <AbsoluteFill
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              fontSize: 64,
              fontWeight: 'bold',
              color: '#e0e1dd',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            Quick Tutorial
          </div>
          <div
            style={{
              fontSize: 32,
              color: '#778da9',
              marginTop: 20,
              fontFamily: 'Arial, sans-serif',
            }}
          >
            AI-Powered Audio in Remotion
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* Main content */}
      <Sequence from={60} durationInFrames={150}>
        <AbsoluteFill
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              maxWidth: 1200,
              padding: 60,
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 20,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: 42,
                color: '#e0e1dd',
                lineHeight: 1.6,
                fontFamily: 'Arial, sans-serif',
              }}
            >
              Welcome to this quick tutorial. Learn how to add AI-generated voice and sound effects to your Remotion videos.
            </div>
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* Voice-over for tutorial */}
      <VoiceOver
        text="Welcome to this quick tutorial. Learn how to add AI-generated voice and sound effects to your Remotion videos."
        language="en"
        from={60}
        volume={1}
      />

      {/* Success sound at end */}
      <SoundEffect
        prompt="success notification ding bright"
        from={210}
        volume={0.8}
      />

      {/* End card */}
      <Sequence from={210} durationInFrames={30}>
        <AbsoluteFill
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#415a77',
          }}
        >
          <div
            style={{
              fontSize: 56,
              fontWeight: 'bold',
              color: '#e0e1dd',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            Done!
          </div>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
