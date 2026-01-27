import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { TimeEntryResponseDto, TaskStatus } from "@/types";
import { useEffect, useState, useCallback } from "react";
import { SessionHistoryList } from "@/components/dashboard/task/SessionHistoryList";
import { EditSessionModal } from "@/components/shared/EditSessionModal";
import { AddTimeEntryModal } from "./AddTimeEntryModal";
import * as tasksApi from "@/lib/api/tasks.api";
import { toast } from "sonner";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { Plus, CheckCircle } from "lucide-react";

interface EditTaskModalSummaryProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  taskName: string;
  taskStatus: TaskStatus;
  selectedDate: Date;
  onSessionUpdated?: () => void;
}

export function EditTaskModalSummary({
  isOpen,
  onClose,
  taskId,
  taskName,
  taskStatus,
  selectedDate,
  onSessionUpdated,
}: EditTaskModalSummaryProps) {
  const [sessions, setSessions] = useState<TimeEntryResponseDto[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [sessionToEdit, setSessionToEdit] = useState<TimeEntryResponseDto | null>(null);
  const [isEditSessionModalOpen, setIsEditSessionModalOpen] = useState(false);
  const [isAddSessionModalOpen, setIsAddSessionModalOpen] = useState(false);
  const [isCompletingTask, setIsCompletingTask] = useState(false);

  const filterSessionsByDate = useCallback((sessions: TimeEntryResponseDto[], date: Date): TimeEntryResponseDto[] => {
    const targetDate = format(date, "yyyy-MM-dd");

    return sessions.filter((session) => {
      const sessionDate = format(new Date(session.start_time), "yyyy-MM-dd");
      return sessionDate === targetDate;
    });
  }, []);

  const fetchSessions = useCallback(async () => {
    setIsLoadingSessions(true);
    try {
      const allSessions = await tasksApi.getTimeEntries(taskId);

      // Filter sessions by selectedDate
      const filteredSessions = filterSessionsByDate(allSessions, selectedDate);
      setSessions(filteredSessions);
    } catch {
      toast.error("Błąd", {
        description: "Nie udało się załadować historii sesji",
      });
    } finally {
      setIsLoadingSessions(false);
    }
  }, [taskId, selectedDate, filterSessionsByDate]);

  // Fetch sessions when modal opens or selectedDate changes
  useEffect(() => {
    if (isOpen) {
      fetchSessions();
    }
  }, [isOpen, fetchSessions]);

  const handleEditSession = (session: TimeEntryResponseDto) => {
    setSessionToEdit(session);
    setIsEditSessionModalOpen(true);
  };

  const handleSaveSession = async (
    sessionId: string,
    data: { start_time: string; end_time: string; timezone_offset: number }
  ) => {
    try {
      await tasksApi.updateTimeEntry(taskId, sessionId, data);
      toast.success("Sukces", {
        description: "Sesja została zaktualizowana",
      });

      // Refresh sessions
      await fetchSessions();

      // Notify parent to refresh summary
      if (onSessionUpdated) {
        onSessionUpdated();
      }

      setIsEditSessionModalOpen(false);
      setSessionToEdit(null);
    } catch (err: any) {
      // Check for DailyCapacityExceeded error
      if (err.code === "DailyCapacityExceeded" && err.details) {
        const details = err.details as {
          day: string;
          existing_duration_formatted: string;
          new_duration_formatted: string;
          total_duration_formatted: string;
          limit: string;
        };

        toast.error("Przekroczono limit czasu", {
          description: `Dzień ${details.day} ma już ${details.existing_duration_formatted} zajęte. (limit: ${details.limit})`,
          duration: 7000,
        });
      } else {
        const message = err instanceof Error ? err.message : "Nie udało się zaktualizować sesji";
        toast.error("Błąd", {
          description: message,
        });
      }
      throw err; // Re-throw so modal knows about the error
    }
  };

  const handleAddNewSession = async (data: { start_time: string; end_time: string; timezone_offset: number }) => {
    try {
      const result = await tasksApi.createTimeEntry(taskId, data);

      // Check if session was split across multiple days
      const isSplit = Array.isArray(result);
      const entriesCount = isSplit ? result.length : 1;

      toast.success("Sukces", {
        description: isSplit
          ? `Sesja została podzielona na ${entriesCount} wpisy (${entriesCount} dni)`
          : "Sesja została dodana",
      });

      // Refresh sessions
      await fetchSessions();

      // Notify parent to refresh summary
      if (onSessionUpdated) {
        onSessionUpdated();
      }

      setIsAddSessionModalOpen(false);
    } catch (err: any) {
      // Check for DailyCapacityExceeded error
      if (err.code === "DailyCapacityExceeded" && err.details) {
        const details = err.details as {
          day: string;
          existing_duration_formatted: string;
          new_duration_formatted: string;
          total_duration_formatted: string;
          limit: string;
        };

        toast.error("Przekroczono limit czasu", {
          description: `Dzień ${details.day} ma już ${details.existing_duration_formatted} zajęte. (limit: ${details.limit})`,
          duration: 7000,
        });
      } else {
        const message = err instanceof Error ? err.message : "Nie udało się dodać sesji";
        toast.error("Błąd", {
          description: message,
        });
      }
      throw err; // Re-throw so modal knows to stop loading
    }
  };

  const handleCompleteTask = async () => {
    setIsCompletingTask(true);
    try {
      await tasksApi.updateTask(taskId, { status: "completed" });
      toast.success("Sukces", {
        description: "Zadanie zostało oznaczone jako ukończone",
      });

      // Notify parent to refresh summary
      if (onSessionUpdated) {
        onSessionUpdated();
      }

      // Close modal
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nie udało się ukończyć zadania";
      toast.error("Błąd", {
        description: message,
      });
    } finally {
      setIsCompletingTask(false);
    }
  };

  const formattedDate = format(selectedDate, "d MMMM yyyy", { locale: pl });

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ wordBreak: "break-all", paddingRight: "0.5rem" }}>{taskName}</DialogTitle>
            <DialogDescription>Historia sesji czasowych dla dnia: {formattedDate}</DialogDescription>
          </DialogHeader>

          {/* Session History Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Sesje czasowe</h3>
              <div className="flex items-center gap-2">
                <Button onClick={() => setIsAddSessionModalOpen(true)} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Dodaj sesję
                </Button>
                {taskStatus !== "completed" && (
                  <Button
                    onClick={handleCompleteTask}
                    size="sm"
                    variant="default"
                    disabled={isCompletingTask}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {isCompletingTask ? "Ukańczanie..." : "Ukończ zadanie"}
                  </Button>
                )}
              </div>
            </div>

            {isLoadingSessions ? (
              <div className="text-center py-6 text-muted-foreground">Ładowanie...</div>
            ) : (
              <SessionHistoryList sessions={sessions} onEditSession={handleEditSession} />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Session Modal */}
      <EditSessionModal
        isOpen={isEditSessionModalOpen}
        session={sessionToEdit}
        onClose={() => {
          setIsEditSessionModalOpen(false);
          setSessionToEdit(null);
        }}
        onSave={handleSaveSession}
      />

      {/* Add New Session Modal */}
      <AddTimeEntryModal
        isOpen={isAddSessionModalOpen}
        onClose={() => setIsAddSessionModalOpen(false)}
        taskName={taskName}
        initialDate={selectedDate}
        onSave={handleAddNewSession}
      />
    </>
  );
}
