import type { TaskSummaryDto } from "@/types";
import { SummaryTaskItem } from "./SummaryTaskItem";

interface SummaryTaskListProps {
  tasks: TaskSummaryDto[];
  isLoading: boolean;
  selectedDate: Date;
  onTaskClick: (taskId: string, selectedDate: Date) => void;
}

export function SummaryTaskList({ tasks, isLoading, selectedDate, onTaskClick }: SummaryTaskListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg text-muted-foreground">Nie zarejestrowano czasu pracy w tym dniu.</p>
        <p className="text-sm text-muted-foreground mt-2">
          Rozpocznij pracę nad zadaniem, aby zobaczyć tutaj podsumowanie.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <SummaryTaskItem key={task.task_id} task={task} selectedDate={selectedDate} onTaskClick={onTaskClick} />
      ))}
    </div>
  );
}
