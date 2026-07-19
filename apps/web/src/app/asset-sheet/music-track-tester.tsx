"use client";

import { Button } from "@heroui/react";
import { Music2, Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import styles from "./asset-sheet.module.css";

export interface MusicTrack {
  description: string;
  format: string;
  id: string;
  name: string;
  path: string;
}

export function MusicTrackTester({ tracks }: { tracks: readonly MusicTrack[] }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [activeTrackIndex, setActiveTrackIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const activeTrack = tracks[activeTrackIndex];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    if (!isPlaying) {
      audio.pause();
      return;
    }

    void audio.play().catch(() => setIsPlaying(false));
  }, [activeTrackIndex, isPlaying]);

  if (!activeTrack) {
    return null;
  }

  const selectTrack = (index: number) => {
    if (index === activeTrackIndex) {
      setIsPlaying((playing) => !playing);
      return;
    }

    setCurrentTime(0);
    setDuration(0);
    setActiveTrackIndex(index);
    setIsPlaying(true);
  };

  const seek = (value: string) => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    const nextTime = Number(value);
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  return (
    <div className={styles.musicTester}>
      <div className={styles.musicNowPlaying}>
        <div className={styles.musicArtwork} data-playing={isPlaying}>
          <Music2 aria-hidden="true" />
        </div>

        <div className={styles.musicDetails}>
          <span>Music test deck</span>
          <strong>{activeTrack.name}</strong>
          <small>{activeTrack.description}</small>
        </div>

        <Button
          aria-label={isPlaying ? `Pause ${activeTrack.name}` : `Play ${activeTrack.name}`}
          className={styles.musicPlayButton}
          isIconOnly
          onPress={() => setIsPlaying((playing) => !playing)}
          size="lg"
          variant="secondary"
        >
          {isPlaying ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
        </Button>
      </div>

      <div className={styles.musicTimeline}>
        <span>{formatTime(currentTime)}</span>
        <input
          aria-label={`Seek through ${activeTrack.name}`}
          max={duration || 0}
          min={0}
          onChange={(event) => seek(event.currentTarget.value)}
          step={0.1}
          type="range"
          value={Math.min(currentTime, duration || 0)}
        />
        <span>{formatTime(duration)}</span>
      </div>

      <div className={styles.trackList} aria-label="Available music tracks">
        {tracks.map((track, index) => {
          const isActive = index === activeTrackIndex;
          const isTrackPlaying = isActive && isPlaying;

          return (
            <Button
              aria-label={`${isTrackPlaying ? "Pause" : "Play"} ${track.name}`}
              aria-pressed={isTrackPlaying}
              className={styles.trackButton}
              data-active={isActive}
              key={track.id}
              onPress={() => selectTrack(index)}
              variant={isActive ? "secondary" : "ghost"}
            >
              <span className={styles.trackNumber}>{String(index + 1).padStart(2, "0")}</span>
              <span className={styles.trackName}>
                <strong>{track.name}</strong>
                <small>{track.format}</small>
              </span>
              {isTrackPlaying ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
            </Button>
          );
        })}
      </div>

      <audio
        onDurationChange={(event) => setDuration(event.currentTarget.duration || 0)}
        onEnded={() => {
          setCurrentTime(0);
          setIsPlaying(false);
        }}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        preload="metadata"
        ref={audioRef}
        src={activeTrack.path}
      />
    </div>
  );
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}
