import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { TaskList } from "./task/TaskList";
import type { TaskViewModel, ActiveTimerViewModel } from "@/types";

interface TaskManagementSectionProps {
  tasks: TaskViewModel[];
  onStartTimer: (taskId: string) => void;
  onEdit: (task: TaskViewModel) => void;
  onComplete: (task: TaskViewModel) => void;
  onCreateTask: () => void;
  activeTimer: ActiveTimerViewModel | null;
  isLoading: boolean;
}

export function TaskManagementSection({
  tasks,
  onStartTimer,
  onEdit,
  onComplete,
  onCreateTask,
  activeTimer,
  isLoading,
}: TaskManagementSectionProps) {
  return (
    <>
      {/* Header with Create Button */}
      <header className="flex items-center justify-between mb-6" role="banner">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Moje zadania</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Zarządzaj swoimi zadaniami i śledź czas pracy
          </p>
        </div>
        <Button onClick={onCreateTask} size="lg" className="hidden sm:flex">
          <Plus className="h-5 w-5 mr-2" />
          Dodaj zadanie
        </Button>
      </header>

      {/* FAB for mobile */}
      <Button
        onClick={onCreateTask}
        size="lg"
        className="sm:hidden fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-lg"
        aria-label="Dodaj nowe zadanie"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Task List */}
      <TaskList
        tasks={tasks}
        onStartTimer={onStartTimer}
        onEdit={onEdit}
        onComplete={onComplete}
        onCreateTask={onCreateTask}
        activeTimer={activeTimer}
        isLoading={isLoading}
      />
    </>
  );
}
