"use client";

import { useEffect, useState } from "react";

export function useActionCountdown({
  isPaused,
  nextActionAt,
}: {
  isPaused: boolean;
  nextActionAt?: number;
}) {
  const [remainingMs, setRemainingMs] = useState<number | null>(null);

  useEffect(() => {
    if (isPaused || !nextActionAt) {
      setRemainingMs(nextActionAt ? Math.max(0, nextActionAt - Date.now()) : null);
      return;
    }

    const updateRemainingTime = () => {
      const nextRemainingMs = Math.max(0, nextActionAt - Date.now());
      setRemainingMs(nextRemainingMs);
      return nextRemainingMs;
    };

    if (updateRemainingTime() === 0) {
      return;
    }

    const timer = window.setInterval(() => {
      if (updateRemainingTime() === 0) {
        window.clearInterval(timer);
      }
    }, 250);
    return () => window.clearInterval(timer);
  }, [isPaused, nextActionAt]);

  return {
    isExpired: !isPaused && nextActionAt !== undefined && remainingMs === 0,
    seconds: remainingMs === null ? null : Math.ceil(remainingMs / 1_000),
  };
}
