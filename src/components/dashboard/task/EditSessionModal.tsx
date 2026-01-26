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
import type { TimeEntryResponseDto } from "@/types";
import { useEffect, useState } from "react";

interface EditSessionModalProps {
  isOpen: boolean;
  session: TimeEntryResponseDto | null;
  onClose: () => void;
  onSave: (sessionId: string, data: { start_time: string; end_time: string }) => Promise<void>;
}

export function EditSessionModal({ isOpen, session, onClose, onSave }: EditSessionModalProps) {
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Format datetime-local value (YYYY-MM-DDTHH:mm)
  const formatDateTimeLocal = (isoString: string) => {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Initialize form when session changes
  useEffect(() => {
    if (session) {
      setStartTime(formatDateTimeLocal(session.start_time));
      if (session.end_time) {
        setEndTime(formatDateTimeLocal(session.end_time));
      }
      setError(null);
    }
  }, [session]);

  // Get max datetime (current time)
  const getMaxDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session) return;

    setError(null);

    // Validation: end_time must be after start_time
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      setError("Czas zakończenia musi być późniejszy niż czas rozpoczęcia");
      return;
    }

    // Validation: times cannot be in the future
    const now = new Date();
    if (start > now || end > now) {
      setError("Nie można ustawić czasu w przyszłości");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSave(session.id, {
        start_time: start.toISOString(),
        end_time: end.toISOString(),
      });
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nie udało się zaktualizować sesji";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!session) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edycja sesji czasowej</DialogTitle>
          <DialogDescription>Zmień czas rozpoczęcia i zakończenia sesji</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="start_time" className="text-sm font-medium">
                Czas rozpoczęcia
              </Label>
              <Input
                id="start_time"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                max={getMaxDateTime()}
                step="1"
                required
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_time" className="text-sm font-medium">
                Czas zakończenia
              </Label>
              <Input
                id="end_time"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                max={getMaxDateTime()}
                step="1"
                required
                className="w-full"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Anuluj
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Zapisywanie..." : "Zapisz zmiany"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
