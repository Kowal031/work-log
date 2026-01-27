import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { ActiveTimerViewModel } from "@/types";
import { calculateElapsedTime } from "@/lib/utils/recovery.utils";

interface CapacityExceededModalProps {
  activeTimer: ActiveTimerViewModel | null;
  isOpen: boolean;
  errorMessage: string;
  errorDetails: {
    day: string;
    existing_duration_formatted: string;
    new_duration_formatted: string;
    total_duration_formatted: string;
    limit: string;
  } | null;
  onDiscard: () => Promise<void>;
  onManualCorrect: () => void;
  onClose: () => void;
}

export function CapacityExceededModal({
  activeTimer,
  isOpen,
  errorMessage,
  errorDetails,
  onDiscard,
  onManualCorrect,
  onClose,
}: CapacityExceededModalProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Initial calculation
  useEffect(() => {
    if (activeTimer && isOpen) {
      const elapsed = calculateElapsedTime(activeTimer.start_time);
      setElapsedSeconds(elapsed);
    }
  }, [activeTimer, isOpen]);

  // Live counter - update every second
  useEffect(() => {
    if (!activeTimer || !isOpen) return;

    const interval = setInterval(() => {
      const elapsed = calculateElapsedTime(activeTimer.start_time);
      setElapsedSeconds(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimer, isOpen]);

  if (!activeTimer || !errorDetails) return null;

  // Format as HH:MM:SS like in timer display
  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;
  const formattedTime = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const handleDiscard = async () => {
    setIsProcessing(true);
    try {
      await onDiscard();
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualCorrect = () => {
    onManualCorrect();
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Przekroczono limit czasu dla dnia {errorDetails.day}</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p className="text-base font-semibold">Czas trwania: {formattedTime}</p>
            <div className="text-sm space-y-1"></div>
            <p className="text-amber-600 dark:text-amber-500 font-medium flex items-start gap-2">
              <span className="text-xl">⚠️</span>
              <span>{errorMessage}</span>
            </p>
            <p className="text-sm">Co chcesz zrobić z tym czasem?</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <button
            onClick={handleManualCorrect}
            disabled={isProcessing}
            className="w-full inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            Skoryguj ręcznie
          </button>
          <AlertDialogCancel onClick={handleDiscard} disabled={isProcessing} className="w-full mt-0">
            Odrzuć sesję
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
