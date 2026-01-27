import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { TimeEntryResponseDto } from "@/types";
import { useEffect, useState, useCallback } from "react";
import { SessionHistoryList } from "@/components/dashboard/task/SessionHistoryList";
import { EditSessionModal } from "@/components/shared/EditSessionModal";
import * as tasksApi from "@/lib/api/tasks.api";
import { toast } from "sonner";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

interface EditTaskModalSummaryProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  taskName: string;
  selectedDate: Date;
  onSessionUpdated?: () => void;
}

export function EditTaskModalSummary({
  isOpen,
  onClose,
  taskId,
  taskName,
  selectedDate,
  onSessionUpdated,
}: EditTaskModalSummaryProps) {
  const [sessions, setSessions] = useState<TimeEntryResponseDto[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [sessionToEdit, setSessionToEdit] = useState<TimeEntryResponseDto | null>(null);
  const [isEditSessionModalOpen, setIsEditSessionModalOpen] = useState(false);

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

  const handleSaveSession = async (sessionId: string, data: { start_time: string; end_time: string }) => {
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
  };

  const formattedDate = format(selectedDate, "d MMMM yyyy", { locale: pl });

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{taskName}</DialogTitle>
            <DialogDescription>Historia sesji czasowych dla dnia: {formattedDate}</DialogDescription>
          </DialogHeader>

          {/* Session History Section */}
          <div className="space-y-4">
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
    </>
  );
}
