interface BackgroundAudio {
  pause(): void;
  play(): Promise<void>;
  readonly paused: boolean;
  volume: number;
}

export function syncBackgroundMusic(audio: BackgroundAudio, volume: number): void {
  audio.volume = volume / 100;
  if (volume === 0) {
    audio.pause();
    return;
  }

  if (audio.paused) {
    void audio.play().catch(() => undefined);
  }
}
