"use client";

import { useEffect, useRef } from "react";

import { syncBackgroundMusic } from "@/lib/background-music";

export function BackgroundMusic({ src, volume }: { src: string; volume: number }) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    syncBackgroundMusic(audio, volume);
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    const startPlayback = () => {
      if (audio.volume === 0 || !audio.paused) {
        return;
      }

      void audio.play().catch(() => undefined);
    };

    document.addEventListener("keydown", startPlayback, true);
    document.addEventListener("pointerdown", startPlayback, true);

    return () => {
      document.removeEventListener("keydown", startPlayback, true);
      document.removeEventListener("pointerdown", startPlayback, true);
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

  return <audio autoPlay loop preload="auto" ref={audioRef} src={src} />;
}
