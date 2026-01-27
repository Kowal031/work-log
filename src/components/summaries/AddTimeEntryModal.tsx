import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";

interface AddTimeEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskName: string;
  initialDate: Date;
  onSave: (data: { start_time: string; end_time: string; timezone_offset: number }) => Promise<void>;
}

export function AddTimeEntryModal({ isOpen, onClose, taskName, initialDate, onSave }: AddTimeEntryModalProps) {
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Format datetime-local value (YYYY-MM-DDTHH:mm)
  const formatDateTimeLocal = (date: Date, hours = 9, minutes = 0) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const h = String(hours).padStart(2, "0");
    const m = String(minutes).padStart(2, "0");
    return `${year}-${month}-${day}T${h}:${m}`;
  };

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen) {
      // Default: 9:00 - 17:00
      setStartTime(formatDateTimeLocal(initialDate, 9, 0));
      setEndTime(formatDateTimeLocal(initialDate, 17, 0));
      setError(null);
    }
  }, [isOpen, initialDate]);

  // Get start of selected date (00:00:00)
  const getStartOfSelectedDate = () => {
    const start = new Date(initialDate);
    start.setHours(0, 0, 0, 0);
    return start;
  };

  // Get end of selected date (23:59:59)
  const getEndOfSelectedDate = () => {
    const end = new Date(initialDate);
    end.setHours(23, 59, 59, 999);
    return end;
  };

  // Get max datetime for start_time (end of selected date or now, whichever is earlier)
  const getMaxStartDateTime = () => {
    const now = new Date();
    const endOfSelectedDate = getEndOfSelectedDate();
    const maxDate = now < endOfSelectedDate ? now : endOfSelectedDate;
    return formatDateTimeLocal(maxDate, maxDate.getHours(), maxDate.getMinutes());
  };

  // Get min datetime for start_time (start of selected date)
  const getMinStartDateTime = () => {
    const startOfSelectedDate = getStartOfSelectedDate();
    return formatDateTimeLocal(startOfSelectedDate, 0, 0);
  };

  // Get max datetime for end_time (just use current time as max)
  const getMaxEndDateTime = () => {
    const now = new Date();
    return formatDateTimeLocal(now, now.getHours(), now.getMinutes());
  };

  // Get min datetime for end_time (same as start_time)
  const getMinEndDateTime = () => {
    return startTime || getMinStartDateTime();
  };

  // Calculate duration
  const calculateDuration = () => {
    if (!startTime || !endTime) return null;

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) return null;

    const durationMs = end.getTime() - start.getTime();
    const durationSeconds = Math.floor(durationMs / 1000);

    const hours = Math.floor(durationSeconds / 3600);
    const minutes = Math.floor((durationSeconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const duration = calculateDuration();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();
    const startOfSelectedDate = getStartOfSelectedDate();
    const endOfSelectedDate = getEndOfSelectedDate();

    // Validation: start_time must be within selected date
    if (start < startOfSelectedDate || start > endOfSelectedDate) {
      setError("Czas rozpoczęcia musi być w wybranym dniu");
      return;
    }

    // Validation: end_time must be after start_time
    if (end <= start) {
      setError("Czas zakończenia musi być późniejszy niż czas rozpoczęcia");
      return;
    }

    // Validation: times cannot be in the future
    if (start > now || end > now) {
      setError("Nie można ustawić czasu w przyszłości");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSave({
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        timezone_offset: -start.getTimezoneOffset(), // Convert to minutes offset from UTC
      });
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nie udało się dodać sesji";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dodaj sesję czasową</DialogTitle>
          <DialogDescription>
            Dodaj nową sesję dla zadania: <strong>{taskName}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-6">
            <div className="space-y-3">
              <Label htmlFor="start_time" className="text-sm font-semibold">
                Czas rozpoczęcia
              </Label>
              <Input
                id="start_time"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                min={getMinStartDateTime()}
                max={getMaxStartDateTime()}
                required
                className="w-full text-base h-11 px-4"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="end_time" className="text-sm font-semibold">
                Czas zakończenia
              </Label>
              <Input
                id="end_time"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                min={getMinEndDateTime()}
                max={getMaxEndDateTime()}
                required
                className="w-full text-base h-11 px-4"
              />
            </div>

            {duration && (
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm font-medium">
                  Czas trwania: <span className="text-primary">{duration}</span>
                </p>
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-destructive/10 p-4 border border-destructive/20">
                <p className="text-sm font-medium text-destructive">{error}</p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="min-w-[100px]">
              Anuluj
            </Button>
            <Button type="submit" disabled={isSubmitting || !duration} className="min-w-[100px]">
              {isSubmitting ? "Zapisywanie..." : "Dodaj sesję"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
