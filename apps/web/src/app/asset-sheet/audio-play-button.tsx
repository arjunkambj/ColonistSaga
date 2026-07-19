"use client";

import { Button } from "@heroui/react";
import pauseIcon from "@iconify-icons/solar/pause-outline";
import playIcon from "@iconify-icons/solar/play-outline";
import { Icon } from "@iconify/react";
import { useRef, useState } from "react";

import styles from "./asset-sheet.module.css";

export function AudioPlayButton({ name, src }: { name: string; src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    if (audio.paused) {
      void audio.play().catch(() => setIsPlaying(false));
      return;
    }

    audio.pause();
  };

  return (
    <>
      <Button
        aria-label={isPlaying ? `Pause ${name}` : `Play ${name}`}
        aria-pressed={isPlaying}
        className={styles.audioPlayButton}
        onPress={togglePlayback}
        size="sm"
        variant="secondary"
      >
        <Icon aria-hidden="true" icon={isPlaying ? pauseIcon : playIcon} />
        {isPlaying ? "Pause" : "Play"}
      </Button>
      <audio
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        preload="metadata"
        ref={audioRef}
        src={src}
      />
    </>
  );
}
