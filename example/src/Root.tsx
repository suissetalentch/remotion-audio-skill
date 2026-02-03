import React from 'react';
import { Composition, staticFile } from 'remotion';
import { SimpleTest } from './SimpleTest';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="SimpleTest"
      component={SimpleTest}
      durationInFrames={90}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{
        audioMeta: {
          voiceOvers: {},
          backgroundMusic: null,
          soundEffects: {},
        },
      }}
      calculateMetadata={async ({ props }) => {
        try {
          const response = await fetch(staticFile('audio/meta.json'));
          const result = await response.json();
          return {
            durationInFrames: Math.max(result.totalDurationFrames + 30, 90),
            props: { ...props, audioMeta: result.audioMeta },
          };
        } catch {
          return { props };
        }
      }}
    />
  );
};
