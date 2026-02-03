import { AbsoluteFill, Audio, Sequence, staticFile } from 'remotion';
import type { PrerenderResult } from 'remotion-audio-skill';

interface Props {
  audioMeta?: PrerenderResult['audioMeta'];
}

/**
 * Example video component with AI voice-over
 *
 * Usage:
 *   1. npx tsx scripts/prerender-audio.ts
 *   2. npx remotion render SimpleTest out/video.mp4
 */
export const SimpleTest: React.FC<Props> = ({ audioMeta }) => {
  const voiceMeta = audioMeta?.voiceOvers['main'];
  const musicMeta = audioMeta?.backgroundMusic;

  return (
    <AbsoluteFill style={{
      backgroundColor: '#1a1a2e',
      fontFamily: 'Arial, sans-serif',
    }}>
      {/* Background Music (if provided) */}
      {musicMeta && (
        <Audio src={staticFile(musicMeta.src)} volume={0.2} loop />
      )}

      {/* Voice Over */}
      {voiceMeta && (
        <Sequence from={0} durationInFrames={voiceMeta.durationFrames}>
          <Audio src={staticFile(voiceMeta.src)} volume={1} />
        </Sequence>
      )}

      {/* Visual content */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: 'white',
        padding: 100,
      }}>
        <h1 style={{ fontSize: 72, margin: 0, color: '#e94560' }}>
          Remotion Audio Skill
        </h1>
        <p style={{ fontSize: 36, opacity: 0.8, textAlign: 'center', maxWidth: 800 }}>
          AI-powered voice-over for your videos
        </p>
        {voiceMeta && (
          <p style={{ fontSize: 24, opacity: 0.5, marginTop: 40 }}>
            Duration: {Math.round(voiceMeta.durationMs / 1000)}s
          </p>
        )}
      </div>
    </AbsoluteFill>
  );
};
