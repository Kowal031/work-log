import { Button } from "@/components/ui/button";
import type { TimeEntryResponseDto } from "@/types";
import { Pencil } from "lucide-react";
import { memo, useMemo } from "react";

export interface SessionHistoryListProps {
  sessions: TimeEntryResponseDto[];
  onEditSession: (session: TimeEntryResponseDto) => void;
  highlightedSessionId?: string | null;
}

export const SessionHistoryList = memo(function SessionHistoryList({
  sessions,
  onEditSession,
  highlightedSessionId,
}: SessionHistoryListProps) {
  const formatTime = useMemo(
    () => (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleTimeString("pl-PL", {
        hour: "2-digit",
        minute: "2-digit",
      });
    },
    []
  );

  const formatDate = useMemo(
    () => (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString("pl-PL", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    },
    []
  );

  const calculateDuration = useMemo(
    () => (startTime: string, endTime: string | null) => {
      if (!endTime) return "w trakcie";

      const start = new Date(startTime).getTime();
      const end = new Date(endTime).getTime();
      const durationSeconds = Math.floor((end - start) / 1000);

      const hours = Math.floor(durationSeconds / 3600);
      const minutes = Math.floor((durationSeconds % 3600) / 60);
      const seconds = durationSeconds % 60;

      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      if (minutes > 0) {
        return `${minutes}m`;
      }
      return `${seconds}s`;
    },
    []
  );

  if (sessions.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <p>Brak sesji czasowych dla tego zadania</p>
      </div>
    );
  }

  return (
    <div
      className="space-y-2 max-h-[20rem] overflow-y-auto"
      style={{ scrollbarWidth: "thin", scrollbarColor: "rgb(203 213 225) transparent" }}
    >
      {sessions.map((session) => {
        const isHighlighted = highlightedSessionId === session.id;
        return (
          <div
            key={session.id}
            className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
              isHighlighted ? "border-primary bg-primary/10 ring-2 ring-primary/50" : "hover:bg-accent/50"
            }`}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">{formatDate(session.start_time)}</span>
                <span className="text-muted-foreground">
                  {formatTime(session.start_time)}
                  {session.end_time && (
                    <>
                      {" - "}
                      {formatTime(session.end_time)}
                    </>
                  )}
                </span>
                {isHighlighted && (
                  <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Do edycji</span>
                )}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Czas trwania: {calculateDuration(session.start_time, session.end_time)}
              </div>
            </div>
            {session.end_time && (
              <Button variant="ghost" size="icon" onClick={() => onEditSession(session)} aria-label="Edytuj sesję">
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
});
