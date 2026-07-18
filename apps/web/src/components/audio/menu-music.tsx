"use client";

import { useEffect, useRef } from "react";

const MENU_MUSIC_SRC = "/music/main-loby-music.mp3";

export function MenuMusic({ volume }: { volume: number }) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume / 100;
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
      void audio
        .play()
        .then(removePlaybackListeners)
        .catch(() => {
          // Browsers can block autoplay until the player first interacts with the page.
        });
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

  return <audio autoPlay loop preload="auto" ref={audioRef} src={MENU_MUSIC_SRC} />;
}
