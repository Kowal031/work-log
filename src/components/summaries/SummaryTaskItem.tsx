import { Card, CardContent } from "@/components/ui/card";
import type { TaskSummaryDto } from "@/types";

interface SummaryTaskItemProps {
  task: TaskSummaryDto;
  selectedDate: Date;
  onTaskClick: (taskId: string, selectedDate: Date) => void;
}

export function SummaryTaskItem({ task, selectedDate, onTaskClick }: SummaryTaskItemProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600";
      case "in-progress":
        return "text-blue-600";
      case "pending":
        return "text-gray-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Ukończone";
      case "in-progress":
        return "W trakcie";
      case "pending":
        return "Oczekujące";
      default:
        return status;
    }
  };

  return (
    <Card
      className="hover:bg-accent/50 transition-colors cursor-pointer h-full"
      onClick={() => onTaskClick(task.task_id, selectedDate)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-base" style={{ wordBreak: "break-all" }}>
              {task.task_name}
            </h3>
            <p className={`text-sm ${getStatusColor(task.task_status)}`}>{getStatusLabel(task.task_status)}</p>
          </div>
          <div className="flex flex-col items-start ml-4 self-start">
            <p className="text-lg font-semibold text-primary">{task.duration_formatted}</p>
            <p className="text-xs text-muted-foreground">
              {task.entries_count} {task.entries_count === 1 ? "sesja" : "sesji"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
