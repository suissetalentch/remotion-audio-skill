import { getClient, ElevenLabsClient } from '../client';
import { STTRequest, STTResponse, STTWord, AudioSkillError } from '../types';

export interface STTOptions {
  language?: string;
}

export class STTService {
  private client: ElevenLabsClient;

  constructor(client?: ElevenLabsClient) {
    this.client = client ?? getClient();
  }

  /**
   * Transcribe audio to text with word-level timestamps
   */
  async transcribe(
    audio: ArrayBuffer,
    options: STTOptions = {}
  ): Promise<STTResponse> {
    if (!audio || audio.byteLength === 0) {
      throw new AudioSkillError('Audio cannot be empty', 'INVALID_INPUT');
    }

    const request: STTRequest = {
      audio,
      language: options.language,
    };

    return this.client.speechToText(request);
  }

  /**
   * Get word-level timestamps from audio
   */
  async getWordTimestamps(
    audio: ArrayBuffer,
    options: STTOptions = {}
  ): Promise<STTWord[]> {
    const response = await this.transcribe(audio, options);
    return response.words;
  }

  /**
   * Convert timestamps to frames for Remotion
   */
  wordsToFrames(words: STTWord[], fps: number): Array<STTWord & { startFrame: number; endFrame: number }> {
    return words.map(word => ({
      ...word,
      startFrame: Math.round(word.start * fps),
      endFrame: Math.round(word.end * fps),
    }));
  }

  /**
   * Group words into sentences
   */
  groupIntoSentences(words: STTWord[]): Array<{
    text: string;
    start: number;
    end: number;
    words: STTWord[];
  }> {
    if (words.length === 0) return [];

    const sentences: Array<{
      text: string;
      start: number;
      end: number;
      words: STTWord[];
    }> = [];

    let currentSentence: STTWord[] = [];
    const sentenceEnders = /[.!?]/;

    for (const word of words) {
      currentSentence.push(word);

      if (sentenceEnders.test(word.word)) {
        sentences.push({
          text: currentSentence.map(w => w.word).join(' '),
          start: currentSentence[0].start,
          end: word.end,
          words: [...currentSentence],
        });
        currentSentence = [];
      }
    }

    // Handle remaining words without sentence ender
    if (currentSentence.length > 0) {
      sentences.push({
        text: currentSentence.map(w => w.word).join(' '),
        start: currentSentence[0].start,
        end: currentSentence[currentSentence.length - 1].end,
        words: currentSentence,
      });
    }

    return sentences;
  }

  /**
   * Get current word at a specific time
   */
  getWordAtTime(words: STTWord[], timeInSeconds: number): STTWord | null {
    return words.find(w => timeInSeconds >= w.start && timeInSeconds <= w.end) || null;
  }

  /**
   * Get current word at a specific frame
   */
  getWordAtFrame(words: STTWord[], frame: number, fps: number): STTWord | null {
    const timeInSeconds = frame / fps;
    return this.getWordAtTime(words, timeInSeconds);
  }
}

// Singleton instance
let serviceInstance: STTService | null = null;

export function getSTTService(): STTService {
  if (!serviceInstance) {
    serviceInstance = new STTService();
  }
  return serviceInstance;
}

export function resetSTTService(): void {
  serviceInstance = null;
}
