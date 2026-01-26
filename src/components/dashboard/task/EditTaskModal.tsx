import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import type { TaskViewModel, TimeEntryResponseDto } from "@/types";
import { useEffect, useState } from "react";
import { TaskForm } from "./TaskForm";
import { SessionHistoryList } from "./SessionHistoryList";
import { EditSessionModal } from "./EditSessionModal";
import * as tasksApi from "@/lib/api/tasks.api";
import { toast } from "sonner";

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; description?: string }) => void;
  task: TaskViewModel;
  hasActiveTimer: boolean;
}

export function EditTaskModal({ isOpen, onClose, onSave, task, hasActiveTimer }: EditTaskModalProps) {
  const [sessions, setSessions] = useState<TimeEntryResponseDto[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [sessionToEdit, setSessionToEdit] = useState<TimeEntryResponseDto | null>(null);
  const [isEditSessionModalOpen, setIsEditSessionModalOpen] = useState(false);
  const [highlightedSessionId, setHighlightedSessionId] = useState<string | null>(null);

  // Fetch sessions when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchSessions();

      // Check if we should highlight a session (from recovery modal)
      const sessionId = sessionStorage.getItem("highlightSessionId");
      if (sessionId) {
        setHighlightedSessionId(sessionId);
        sessionStorage.removeItem("highlightSessionId");
      }
    }
  }, [isOpen, task.id]);

  // Auto-open highlighted session when sessions are loaded
  useEffect(() => {
    if (highlightedSessionId && sessions.length > 0) {
      const session = sessions.find((s) => s.id === highlightedSessionId);
      if (session && session.end_time) {
        // Only auto-open if session is stopped (has end_time)
        setTimeout(() => {
          handleEditSession(session);
        }, 300);
      }
    }
  }, [highlightedSessionId, sessions]);

  const fetchSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const data = await tasksApi.getTimeEntries(task.id);
      setSessions(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch sessions";
      toast.error("Błąd", {
        description: "Nie udało się załadować historii sesji",
      });
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const handleEditSession = (session: TimeEntryResponseDto) => {
    setSessionToEdit(session);
    setIsEditSessionModalOpen(true);
  };

  const handleSaveSession = async (sessionId: string, data: { start_time: string; end_time: string }) => {
    try {
      await tasksApi.updateTimeEntry(task.id, sessionId, data);
      toast.success("Sukces", {
        description: "Sesja została zaktualizowana",
      });
      // Clear highlighted session to prevent re-opening modal
      setHighlightedSessionId(null);
      // Refresh sessions
      await fetchSessions();
      setIsEditSessionModalOpen(false);
      setSessionToEdit(null);
    } catch (err) {
      throw err; // Let EditSessionModal handle the error
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edytuj zadanie</DialogTitle>
            <DialogDescription>
              {hasActiveTimer
                ? "Zatrzymaj timer aby edytować szczegóły zadania"
                : "Zaktualizuj informacje o zadaniu i zarządzaj historią sesji"}
            </DialogDescription>
          </DialogHeader>

          {/* Task Details Section */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold mb-3">Szczegóły zadania</h3>
              {hasActiveTimer ? (
                <div className="p-4 border rounded-lg bg-muted/50 text-sm text-muted-foreground">
                  Edycja szczegółów jest zablokowana podczas aktywnego timera
                </div>
              ) : (
                <TaskForm
                  onSubmit={onSave}
                  onCancel={onClose}
                  initialData={{
                    name: task.name,
                    description: task.description,
                  }}
                />
              )}
            </div>

            <Separator />

            {/* Session History Section */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Historia sesji</h3>
              {isLoadingSessions ? (
                <div className="text-center py-6 text-muted-foreground">Ładowanie...</div>
              ) : (
                <SessionHistoryList
                  sessions={sessions}
                  onEditSession={handleEditSession}
                  highlightedSessionId={highlightedSessionId}
                />
              )}
            </div>
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
