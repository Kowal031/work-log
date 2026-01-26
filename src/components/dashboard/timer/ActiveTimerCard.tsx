import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { ActiveTimerViewModel } from "@/types";
import { Pause, Play, Square } from "lucide-react";
import { useState } from "react";
import { TimerDisplay } from "./TimerDisplay";

interface ActiveTimerCardProps {
  activeTimer: ActiveTimerViewModel;
  onStop: (taskId: string, timeEntryId: string) => void;
}

export function ActiveTimerCard({ activeTimer, onStop }: ActiveTimerCardProps) {
  const [isPaused, setIsPaused] = useState(false);

  const handleStop = () => {
    onStop(activeTimer.task_id, activeTimer.id);
  };

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
  };

  return (
    <div className="sticky top-4 z-50 mb-6">
      <Card className="border-primary bg-primary/5 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold truncate">{activeTimer.taskName}</h3>
              <p className="text-sm text-muted-foreground">Aktywny licznik czasu</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button onClick={handlePauseResume} variant="outline" size="lg">
                {isPaused ? (
                  <>
                    <Play className="h-5 w-5 mr-2" />
                    Wznów
                  </>
                ) : (
                  <>
                    <Pause className="h-5 w-5 mr-2" />
                    Pauza
                  </>
                )}
              </Button>
              <Button onClick={handleStop} variant="destructive" size="lg">
                <Square className="h-5 w-5 mr-2" />
                Stop
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <TimerDisplay startTime={activeTimer.start_time} isPaused={isPaused} />
        </CardContent>
      </Card>
    </div>
  );
}
