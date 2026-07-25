"use client";

import { useEffect, useRef } from "react";

export function BackgroundMusic({ src, volume }: { src: string; volume: number }) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.volume = volume / 100;
    if (volume === 0) {
      audio.pause();
    }
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    const removePlaybackListeners = () => {
      document.removeEventListener("keydown", startPlayback, true);
      document.removeEventListener("pointerdown", startPlayback, true);
    };

    const startPlayback = () => {
      if (audio.volume === 0) {
        return;
      }

      void audio
        .play()
        .then(removePlaybackListeners)
        .catch(() => undefined);
    };

    document.addEventListener("keydown", startPlayback, true);
    document.addEventListener("pointerdown", startPlayback, true);
    startPlayback();

    return () => {
      removePlaybackListeners();
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

  return <audio autoPlay loop preload="auto" ref={audioRef} src={src} />;
}
