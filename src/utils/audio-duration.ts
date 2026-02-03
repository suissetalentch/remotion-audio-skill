/**
 * Get the duration of an audio file in seconds
 */
export async function getAudioDuration(audioSrc: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();

    audio.addEventListener('loadedmetadata', () => {
      resolve(audio.duration);
    });

    audio.addEventListener('error', (e) => {
      reject(new Error(`Failed to load audio: ${e.message || 'Unknown error'}`));
    });

    audio.src = audioSrc;
  });
}

/**
 * Get the duration of an audio file in frames
 */
export async function getAudioDurationInFrames(
  audioSrc: string,
  fps: number
): Promise<number> {
  const durationSeconds = await getAudioDuration(audioSrc);
  return Math.ceil(durationSeconds * fps);
}

/**
 * Convert duration in seconds to frames
 */
export function secondsToFrames(seconds: number, fps: number): number {
  return Math.round(seconds * fps);
}

/**
 * Convert frames to seconds
 */
export function framesToSeconds(frames: number, fps: number): number {
  return frames / fps;
}

/**
 * Format duration as MM:SS
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format frame count as timecode (HH:MM:SS:FF)
 */
export function formatTimecode(frame: number, fps: number): string {
  const totalSeconds = frame / fps;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const frames = Math.floor(frame % fps);

  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    seconds.toString().padStart(2, '0'),
    frames.toString().padStart(2, '0'),
  ].join(':');
}
