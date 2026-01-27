import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { ActiveTimerViewModel } from "@/types";
import { Square } from "lucide-react";
import { TimerDisplay } from "./TimerDisplay";

interface ActiveTimerCardProps {
  activeTimer: ActiveTimerViewModel;
  onStop: (taskId: string, timeEntryId: string) => void;
}

export function ActiveTimerCard({ activeTimer, onStop }: ActiveTimerCardProps) {
  const handleStop = () => {
    onStop(activeTimer.task_id, activeTimer.id);
  };

  return (
    <div className="sticky top-4 z-50 mb-6" aria-label="Aktywny licznik czasu" role="region">
      <Card className="border-primary bg-primary/5 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold break-all">{activeTimer.taskName}</h3>
              <p className="text-sm text-muted-foreground">Aktywny licznik czasu</p>
            </div>
            <Button
              onClick={handleStop}
              variant="destructive"
              size="lg"
              className="shrink-0"
              aria-label={`Zatrzymaj licznik dla zadania ${activeTimer.taskName}`}
            >
              <Square className="h-5 w-5 mr-2" />
              Stop
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <TimerDisplay startTime={activeTimer.start_time} isPaused={false} />
        </CardContent>
      </Card>
    </div>
  );
}
