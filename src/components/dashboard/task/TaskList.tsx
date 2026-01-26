import type { ActiveTimerViewModel, TaskViewModel } from "@/types";
import { TaskItem } from "./TaskItem";
import { TaskListEmptyState } from "./TaskListEmptyState";

interface TaskListProps {
  tasks: TaskViewModel[];
  onStartTimer: (taskId: string) => void;
  onEdit: (task: TaskViewModel) => void;
  onComplete: (task: TaskViewModel) => void;
  onCreateTask: () => void;
  activeTimer: ActiveTimerViewModel | null;
  isLoading: boolean;
}

export function TaskList({
  tasks,
  onStartTimer,
  onEdit,
  onComplete,
  onCreateTask,
  activeTimer,
  isLoading,
}: TaskListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div
          className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"
          role="status"
          aria-label="Ładowanie"
        ></div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return <TaskListEmptyState onCreateTask={onCreateTask} />;
  }

  const hasActiveTimer = activeTimer !== null;

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onStartTimer={onStartTimer}
          onEdit={onEdit}
          onComplete={onComplete}
          isTimerActive={hasActiveTimer}
          isCurrentTaskActive={activeTimer?.task_id === task.id}
        />
      ))}
    </div>
  );
}
