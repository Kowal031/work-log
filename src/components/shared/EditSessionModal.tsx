import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TimeEntryResponseDto, TaskStatus } from "@/types";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface EditSessionModalProps {
  isOpen: boolean;
  session: TimeEntryResponseDto | null;
  taskStatus: TaskStatus;
  onClose: () => void;
  onSave: (sessionId: string, data: { start_time: string; end_time: string; timezone_offset: number }) => Promise<void>;
}

export function EditSessionModal({ isOpen, session, taskStatus, onClose, onSave }: EditSessionModalProps) {
  const [startDate, setStartDate] = useState<Date>();
  const [startHour, setStartHour] = useState("");
  const [startMinute, setStartMinute] = useState("");
  const [endDate, setEndDate] = useState<Date>();
  const [endHour, setEndHour] = useState("");
  const [endMinute, setEndMinute] = useState("");
  const [startPopoverOpen, setStartPopoverOpen] = useState(false);
  const [endPopoverOpen, setEndPopoverOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Reset confirmation when modal opens/closes
  useEffect(() => {
    setShowConfirmation(false);
  }, [isOpen]);

  // Initialize form when session changes
  useEffect(() => {
    if (session) {
      const startDateTime = new Date(session.start_time);
      setStartDate(startDateTime);
      setStartHour(String(startDateTime.getHours()).padStart(2, "0"));
      setStartMinute(String(startDateTime.getMinutes()).padStart(2, "0"));

      if (session.end_time) {
        const endDateTime = new Date(session.end_time);
        setEndDate(endDateTime);
        setEndHour(String(endDateTime.getHours()).padStart(2, "0"));
        setEndMinute(String(endDateTime.getMinutes()).padStart(2, "0"));
      }
      setError(null);
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session || !startDate || !endDate) return;

    setError(null);

    // Combine date and time
    const startDateTime = new Date(startDate);
    startDateTime.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);

    const endDateTime = new Date(endDate);
    endDateTime.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);

    // Validation: end_time must be after start_time
    if (endDateTime <= startDateTime) {
      setError("Czas zakończenia musi być późniejszy niż czas rozpoczęcia");
      return;
    }

    // Validation: times cannot be in the future
    const now = new Date();
    if (startDateTime > now || endDateTime > now) {
      setError("Nie można ustawić czasu w przyszłości");
      return;
    }

    // If task is completed, show confirmation
    if (taskStatus === "completed") {
      setShowConfirmation(true);
      return;
    }

    setIsSubmitting(true);

    try {
      await onSave(session.id, {
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        timezone_offset: -startDateTime.getTimezoneOffset(), // Convert to minutes offset from UTC
      });
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nie udało się zaktualizować sesji";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmedSubmit = async () => {
    if (!session || !startDate || !endDate) return;

    setShowConfirmation(false);
    setError(null);

    // Combine date and time
    const startDateTime = new Date(startDate);
    startDateTime.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);

    const endDateTime = new Date(endDate);
    endDateTime.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);

    setIsSubmitting(true);

    try {
      await onSave(session.id, {
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        timezone_offset: -startDateTime.getTimezoneOffset(), // Convert to minutes offset from UTC
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
        {showConfirmation ? (
          <>
            <DialogHeader>
              <DialogTitle> Uwaga! </DialogTitle>
              <DialogDescription>
                Zadanie zostało już ukończone. Czy na pewno chcesz edytować ten wpis?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowConfirmation(false)}
                className="min-w-[100px]"
              >
                Anuluj
              </Button>
              <Button onClick={handleConfirmedSubmit} disabled={isSubmitting} className="min-w-[100px]">
                {isSubmitting ? "Zapisywanie..." : "Edytuj wpis"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Edycja sesji czasowej</DialogTitle>
              <DialogDescription>Zmień czas rozpoczęcia i zakończenia sesji</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit}>
              <div className="space-y-6 py-6">
                <div className="space-y-3">
                  <Label htmlFor="start_date" className="text-sm font-semibold">
                    Czas rozpoczęcia
                  </Label>
                  <div className="flex gap-2">
                    <Popover open={startPopoverOpen} onOpenChange={setStartPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-[200px] justify-start text-left font-normal",
                            !startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate?.toLocaleDateString("pl-PL") || "Wybierz datę"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={(date) => {
                            setStartDate(date);
                            setStartPopoverOpen(false);
                          }}
                          disabled={(date) => date > new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <div className="flex gap-2">
                      <Select value={startHour} onValueChange={setStartHour}>
                        <SelectTrigger className="w-[80px]">
                          <SelectValue placeholder="HH" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 24 }, (_, i) => (
                            <SelectItem key={i} value={String(i).padStart(2, "0")}>
                              {String(i).padStart(2, "0")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="flex items-center">:</span>
                      <Select value={startMinute} onValueChange={setStartMinute}>
                        <SelectTrigger className="w-[80px]">
                          <SelectValue placeholder="MM" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 60 }, (_, i) => (
                            <SelectItem key={i} value={String(i).padStart(2, "0")}>
                              {String(i).padStart(2, "0")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="end_date" className="text-sm font-semibold">
                    Czas zakończenia
                  </Label>
                  <div className="flex gap-2">
                    <Popover open={endPopoverOpen} onOpenChange={setEndPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-[200px] justify-start text-left font-normal",
                            !endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate?.toLocaleDateString("pl-PL") || "Wybierz datę"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={(date) => {
                            setEndDate(date);
                            setEndPopoverOpen(false);
                          }}
                          disabled={(date) => date > new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <div className="flex gap-2">
                      <Select value={endHour} onValueChange={setEndHour}>
                        <SelectTrigger className="w-[80px]">
                          <SelectValue placeholder="HH" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 24 }, (_, i) => (
                            <SelectItem key={i} value={String(i).padStart(2, "0")}>
                              {String(i).padStart(2, "0")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="flex items-center">:</span>
                      <Select value={endMinute} onValueChange={setEndMinute}>
                        <SelectTrigger className="w-[80px]">
                          <SelectValue placeholder="MM" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 60 }, (_, i) => (
                            <SelectItem key={i} value={String(i).padStart(2, "0")}>
                              {String(i).padStart(2, "0")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

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
                <Button type="submit" disabled={isSubmitting} className="min-w-[100px]">
                  {isSubmitting ? "Zapisywanie..." : "Zapisz zmiany"}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
