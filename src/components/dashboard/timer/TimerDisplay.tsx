import { memo, useEffect, useState } from "react";

interface TimerDisplayProps {
  startTime: string;
  isPaused?: boolean;
}

export const TimerDisplay = memo(function TimerDisplay({ startTime, isPaused = false }: TimerDisplayProps) {
  const [duration, setDuration] = useState("00:00:00");
  const [pausedAt, setPausedAt] = useState<number | null>(null);

  useEffect(() => {
    const calculateDuration = () => {
      const startTimeMs = new Date(startTime).getTime();
      const nowMs = pausedAt || Date.now();
      const diff = Math.floor((nowMs - startTimeMs) / 1000);

      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;

      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    };

    if (isPaused && !pausedAt) {
      setPausedAt(Date.now());
    } else if (!isPaused && pausedAt) {
      setPausedAt(null);
    }

    setDuration(calculateDuration());

    if (isPaused) {
      return;
    }

    const interval = setInterval(() => {
      setDuration(calculateDuration());
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, isPaused, pausedAt]);

  return (
    <div className="text-3xl font-mono font-bold tabular-nums" aria-live="polite" aria-atomic="true">
      {duration}
    </div>
  );
});
