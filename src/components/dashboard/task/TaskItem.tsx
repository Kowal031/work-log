import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { TaskViewModel } from "@/types";
import { CheckCircle2, Pencil, Play } from "lucide-react";

interface TaskItemProps {
  task: TaskViewModel;
  onStartTimer: (taskId: string) => void;
  onEdit: (task: TaskViewModel) => void;
  onComplete: (task: TaskViewModel) => void;
  isTimerActive: boolean;
  isCurrentTaskActive: boolean;
}

export function TaskItem({
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
            <CardTitle className="text-lg">{task.name}</CardTitle>
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
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Button
            onClick={handleStart}
            disabled={isTimerActive}
            size="lg"
            className="flex-1"
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
            className="flex-1"
            aria-label={`Ukończ zadanie ${task.name}`}
          >
            <CheckCircle2 className="h-5 w-5 mr-2" />
            Ukończ
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
