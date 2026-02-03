import React, { useMemo } from 'react';
import { useCurrentFrame, useVideoConfig, AbsoluteFill } from 'remotion';
import { AutoCaptionProps, STTWord } from '../types';

/**
 * AutoCaption component for displaying synchronized captions
 */
export const AutoCaption: React.FC<AutoCaptionProps> = ({
  words = [],
  style = 'word-highlight',
  fontSize = 48,
  fontColor = '#FFFFFF',
  backgroundColor = 'rgba(0, 0, 0, 0.7)',
  position = 'bottom',
}) => {
  const currentFrame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = currentFrame / fps;

  const positionStyle = useMemo(() => {
    switch (position) {
      case 'top':
        return { top: 50 };
      case 'center':
        return { top: '50%', transform: 'translateY(-50%)' };
      case 'bottom':
      default:
        return { bottom: 50 };
    }
  }, [position]);

  const renderContent = () => {
    switch (style) {
      case 'word-highlight':
        return renderWordHighlight(words, currentTime, fontColor);
      case 'karaoke':
        return renderKaraoke(words, currentTime, fontColor);
      case 'sentence':
      default:
        return renderSentence(words, currentTime, fontColor);
    }
  };

  // Don't render if no words or outside of word timing
  const hasActiveWord = words.some(w => currentTime >= w.start - 0.5 && currentTime <= w.end + 0.5);
  if (words.length === 0 || !hasActiveWord) {
    return null;
  }

  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          padding: '0 50px',
          ...positionStyle,
        }}
      >
        <div
          style={{
            backgroundColor,
            padding: '15px 30px',
            borderRadius: 8,
            fontSize,
            fontWeight: 'bold',
            textAlign: 'center',
            maxWidth: '80%',
          }}
        >
          {renderContent()}
        </div>
      </div>
    </AbsoluteFill>
  );
};

function renderWordHighlight(
  words: STTWord[],
  currentTime: number,
  fontColor: string
): React.ReactNode {
  // Get context words (a few words around current)
  const currentIndex = words.findIndex(
    w => currentTime >= w.start && currentTime <= w.end
  );

  if (currentIndex === -1) {
    // Show upcoming words
    const nextIndex = words.findIndex(w => w.start > currentTime);
    if (nextIndex === -1) return null;
    const contextWords = words.slice(Math.max(0, nextIndex - 2), nextIndex + 5);
    return (
      <span style={{ color: fontColor, opacity: 0.5 }}>
        {contextWords.map(w => w.word).join(' ')}
      </span>
    );
  }

  const start = Math.max(0, currentIndex - 3);
  const end = Math.min(words.length, currentIndex + 4);
  const contextWords = words.slice(start, end);

  return contextWords.map((word, i) => {
    const isCurrentWord = start + i === currentIndex;
    return (
      <span
        key={`${word.word}-${i}`}
        style={{
          color: isCurrentWord ? '#FFD700' : fontColor,
          opacity: isCurrentWord ? 1 : 0.7,
          transition: 'all 0.1s ease',
        }}
      >
        {word.word}
        {i < contextWords.length - 1 ? ' ' : ''}
      </span>
    );
  });
}

function renderKaraoke(
  words: STTWord[],
  currentTime: number,
  fontColor: string
): React.ReactNode {
  return words.map((word, i) => {
    const isPast = currentTime > word.end;
    const isCurrent = currentTime >= word.start && currentTime <= word.end;
    const progress = isCurrent
      ? (currentTime - word.start) / (word.end - word.start)
      : isPast
      ? 1
      : 0;

    return (
      <span
        key={`${word.word}-${i}`}
        style={{
          background: `linear-gradient(to right, #FFD700 ${progress * 100}%, ${fontColor} ${progress * 100}%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        {word.word}
        {i < words.length - 1 ? ' ' : ''}
      </span>
    );
  });
}

function renderSentence(
  words: STTWord[],
  currentTime: number,
  fontColor: string
): React.ReactNode {
  // Find current sentence
  const sentences: STTWord[][] = [];
  let currentSentence: STTWord[] = [];

  for (const word of words) {
    currentSentence.push(word);
    if (/[.!?]$/.test(word.word)) {
      sentences.push([...currentSentence]);
      currentSentence = [];
    }
  }
  if (currentSentence.length > 0) {
    sentences.push(currentSentence);
  }

  const activeSentence = sentences.find(
    s => currentTime >= s[0].start && currentTime <= s[s.length - 1].end
  );

  if (!activeSentence) return null;

  return (
    <span style={{ color: fontColor }}>
      {activeSentence.map(w => w.word).join(' ')}
    </span>
  );
}

export default AutoCaption;
