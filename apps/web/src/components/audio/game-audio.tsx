"use client";

import { useCallback, useEffect, useRef } from "react";

import {
  getEventSound,
  shouldPlayVictory,
  SOUND_EFFECT_PATHS,
  type SoundEffect,
} from "@/lib/game/audio-cues";
import type { RoomEventView } from "@/lib/game/types";

const TURN_REMINDER_DELAY_MS = 25_000;

export function GameAudio({
  activePlayerId,
  events,
  phaseKind,
  soundEffectsVolume,
  viewerPlayerId,
  winnerPlayerId,
}: {
  activePlayerId: string;
  events: readonly RoomEventView[];
  phaseKind: string;
  soundEffectsVolume: number;
  viewerPlayerId: string;
  winnerPlayerId: string | null;
}) {
  const audioElementsRef = useRef(new Map<SoundEffect, HTMLAudioElement>());
  const lastEventSequenceRef = useRef(events.at(-1)?.sequence ?? 0);
  const previousActivePlayerIdRef = useRef<string | null>(null);
  const previousWinnerPlayerIdRef = useRef(winnerPlayerId);
  const soundEffectsVolumeRef = useRef(soundEffectsVolume);

  useEffect(() => {
    soundEffectsVolumeRef.current = soundEffectsVolume;
  }, [soundEffectsVolume]);

  const playSound = useCallback((sound: SoundEffect) => {
    const volume = soundEffectsVolumeRef.current;
    if (volume === 0) {
      return;
    }

    let audio = audioElementsRef.current.get(sound);
    if (!audio) {
      audio = new Audio(SOUND_EFFECT_PATHS[sound]);
      audio.preload = "auto";
      audioElementsRef.current.set(sound, audio);
    }

    audio.currentTime = 0;
    audio.volume = volume / 100;
    void audio.play().catch(() => undefined);
  }, []);

  useEffect(() => {
    const newestEvent = events.at(-1);
    if (!newestEvent || newestEvent.sequence <= lastEventSequenceRef.current) {
      return;
    }

    lastEventSequenceRef.current = newestEvent.sequence;
    if (shouldPlayVictory(previousWinnerPlayerIdRef.current, winnerPlayerId)) {
      return;
    }

    const sound = getEventSound(newestEvent.kind, newestEvent.sequence, phaseKind);
    if (sound) {
      playSound(sound);
    }
  }, [events, phaseKind, playSound, viewerPlayerId, winnerPlayerId]);

  useEffect(() => {
    const previousWinnerPlayerId = previousWinnerPlayerIdRef.current;
    previousWinnerPlayerIdRef.current = winnerPlayerId;
    if (shouldPlayVictory(previousWinnerPlayerId, winnerPlayerId)) {
      playSound("victory");
    }
  }, [playSound, winnerPlayerId]);

  useEffect(() => {
    const previousActivePlayerId = previousActivePlayerIdRef.current;
    previousActivePlayerIdRef.current = activePlayerId;
    if (previousActivePlayerId !== activePlayerId && activePlayerId === viewerPlayerId) {
      playSound("turn");
    }
  }, [activePlayerId, playSound, viewerPlayerId]);

  useEffect(() => {
    if (activePlayerId !== viewerPlayerId || winnerPlayerId !== null) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      playSound("turnReminder");
    }, TURN_REMINDER_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [activePlayerId, events, phaseKind, playSound, viewerPlayerId, winnerPlayerId]);

  return null;
}
