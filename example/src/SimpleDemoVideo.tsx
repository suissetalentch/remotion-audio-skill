import React, { useState, useEffect } from 'react';
import { AbsoluteFill, Sequence, Audio, staticFile, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

/**
 * Simple demo video using pre-generated audio files
 * This bypasses the hooks to test direct audio integration
 */
export const SimpleDemoVideo: React.FC<{
  voiceAudioSrc?: string;
  sfxAudioSrc?: string;
}> = ({ voiceAudioSrc, sfxAudioSrc }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Title animation
  const titleOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });
  const titleY = interpolate(frame, [0, 30], [50, 0], { extrapolateRight: 'clamp' });

  // Subtitle animation (appears after title)
  const subtitleOpacity = interpolate(frame, [30, 60], [0, 1], { extrapolateRight: 'clamp' });

  // Voice section indicator
  const voiceStartFrame = 60;
  const isVoiceSection = frame >= voiceStartFrame;

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      {/* Background pattern */}
      <AbsoluteFill
        style={{
          opacity: 0.1,
          backgroundImage: `radial-gradient(circle at 25% 25%, #e94560 1px, transparent 1px),
                           radial-gradient(circle at 75% 75%, #e94560 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Title */}
      <div
        style={{
          position: 'absolute',
          top: 200,
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
        }}
      >
        <h1
          style={{
            fontSize: 72,
            fontWeight: 'bold',
            color: '#e94560',
            margin: 0,
            textShadow: '0 4px 20px rgba(233, 69, 96, 0.3)',
          }}
        >
          Remotion Audio Skill
        </h1>
      </div>

      {/* Subtitle */}
      <div
        style={{
          position: 'absolute',
          top: 300,
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: subtitleOpacity,
        }}
      >
        <p
          style={{
            fontSize: 36,
            color: '#ffffff',
            margin: 0,
            opacity: 0.8,
          }}
        >
          ElevenLabs + Remotion Integration
        </p>
      </div>

      {/* Voice indicator */}
      {isVoiceSection && (
        <div
          style={{
            position: 'absolute',
            bottom: 150,
            left: 0,
            right: 0,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'inline-block',
              backgroundColor: 'rgba(233, 69, 96, 0.2)',
              border: '2px solid #e94560',
              borderRadius: 50,
              padding: '15px 40px',
            }}
          >
            <span style={{ fontSize: 24, color: '#e94560' }}>
              🎙️ Voice-over playing...
            </span>
          </div>
        </div>
      )}

      {/* Frame counter */}
      <div
        style={{
          position: 'absolute',
          bottom: 30,
          right: 30,
          fontSize: 18,
          color: 'rgba(255,255,255,0.4)',
        }}
      >
        Frame: {frame} / {durationInFrames} | FPS: {fps}
      </div>

      {/* SFX at start */}
      {sfxAudioSrc && (
        <Sequence from={0} durationInFrames={60}>
          <Audio src={sfxAudioSrc} volume={0.7} />
        </Sequence>
      )}

      {/* Voice-over */}
      {voiceAudioSrc && (
        <Sequence from={voiceStartFrame} durationInFrames={durationInFrames - voiceStartFrame}>
          <Audio src={voiceAudioSrc} volume={1} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};

export default SimpleDemoVideo;
