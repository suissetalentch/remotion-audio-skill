import React from 'react';
import { Composition, staticFile } from 'remotion';
import { SimpleDemoVideo } from './SimpleDemoVideo';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="DemoVideo"
        component={SimpleDemoVideo}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          voiceAudioSrc: staticFile('test-tts-fr.mp3'),
          sfxAudioSrc: staticFile('test-sfx-whoosh.mp3'),
        }}
      />
    </>
  );
};
