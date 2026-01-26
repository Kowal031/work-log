import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { TaskViewModel } from "@/types";
import { CheckCircle2, Pencil, Play } from "lucide-react";
import { memo } from "react";

interface TaskItemProps {
  task: TaskViewModel;
  onStartTimer: (taskId: string) => void;
  onEdit: (task: TaskViewModel) => void;
  onComplete: (task: TaskViewModel) => void;
  isTimerActive: boolean;
  isCurrentTaskActive: boolean;
}

export const TaskItem = memo(function TaskItem({
  task,
  onStartTimer,
  onEdit,
  onComplete,
  isTimerActive,
  isCurrentTaskActive,
}: TaskItemProps) {
  const handleStart = () => {
    onStartTimer(task.id);
  };

  const handleEdit = () => {
    onEdit(task);
  };

  const handleComplete = () => {
    onComplete(task);
  };

  return (
    <Card className={isCurrentTaskActive ? "border-primary bg-primary/5" : ""}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {isCurrentTaskActive && (
                <div className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
                </div>
              )}
              <CardTitle className="text-lg">{task.name}</CardTitle>
            </div>
            {task.total_time && <p className="text-sm text-muted-foreground mt-1">Łącznie: {task.total_time}</p>}
            {task.description && (
              <CardDescription className="mt-1 whitespace-pre-wrap break-words">{task.description}</CardDescription>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              size="icon"
              onClick={handleEdit}
              disabled={isCurrentTaskActive}
              aria-label="Edytuj zadanie"
              className="sm:h-9 sm:w-9"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={handleStart}
            disabled={isTimerActive}
            size="lg"
            className="flex-1 sm:text-base text-sm sm:h-11 h-10"
            aria-label={`Rozpocznij licznik dla zadania ${task.name}`}
          >
            <Play className="h-5 w-5 mr-2" />
            {isCurrentTaskActive ? "Licznik aktywny" : "Start"}
          </Button>
          <Button
            onClick={handleComplete}
            disabled={isCurrentTaskActive}
            size="lg"
            variant="outline"
            className="flex-1 sm:text-base text-sm sm:h-11 h-10"
            aria-label={`Ukończ zadanie ${task.name}`}
          >
            <CheckCircle2 className="h-5 w-5 mr-2" />
            Ukończ
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});
