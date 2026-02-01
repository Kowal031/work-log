import { useEffect, useRef } from "react";
import { ActiveTimerCard } from "./timer/ActiveTimerCard";
import type { ActiveTimerViewModel } from "@/types";

interface ActiveTimerSectionProps {
  activeTimer: ActiveTimerViewModel | null;
  onStop: (taskId: string, timeEntryId: string) => void;
}

export function ActiveTimerSection({ activeTimer, onStop }: ActiveTimerSectionProps) {
  const activeTimerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when timer starts
  useEffect(() => {
    if (activeTimer) {
      setTimeout(() => {
        activeTimerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [activeTimer]);

  if (!activeTimer) return null;

  return (
    <div ref={activeTimerRef}>
      <ActiveTimerCard activeTimer={activeTimer} onStop={onStop} />
    </div>
  );
}
