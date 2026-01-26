import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { useDashboardState } from "./hooks/useDashboardState";
import { TaskList } from "./task/TaskList";
import { CreateTaskModal } from "./task/CreateTaskModal";
import { EditTaskModal } from "./task/EditTaskModal";
import { CompleteConfirmationDialog } from "./task/CompleteConfirmationDialog";
import { ActiveTimerCard } from "./timer/ActiveTimerCard";
import { RecoveryModal } from "./RecoveryModal";
import * as tasksApi from "@/lib/api/tasks.api";
import type { TaskViewModel } from "@/types";
import {
  setupBeforeUnloadListener,
  cleanupBeforeUnloadListener,
  clearCloseTimestamp,
} from "@/lib/utils/recovery.utils";

export default function DashboardView() {
  const {
    tasks,
    setTasks,
    activeTimer,
    setActiveTimer,
    isLoading,
    setIsLoading,
    setError,
    isCreateModalOpen,
    openCreateModal,
    closeCreateModal,
    isEditModalOpen,
    taskToEdit,
    openEditModal,
    closeEditModal,
    isRecoveryModalOpen,
    openRecoveryModal,
    closeRecoveryModal,
    isCompleteModalOpen,
    taskToComplete,
    openCompleteModal,
    closeCompleteModal,
  } = useDashboardState();

  // Ref for ActiveTimerCard to enable auto-scroll
  const activeTimerRef = useRef<HTMLDivElement>(null);

  // Calculate total time for a task from time entries (memoized)
  const calculateTotalTime = useMemo(
    () =>
      (entries: { start_time: string; end_time: string | null }[]): string => {
        const totalSeconds = entries.reduce((sum, entry) => {
          if (!entry.end_time) return sum; // Skip active entries
          const start = new Date(entry.start_time).getTime();
          const end = new Date(entry.end_time).getTime();
          return sum + Math.floor((end - start) / 1000);
        }, 0);

        if (totalSeconds === 0) return "";

        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);

        if (hours > 0) {
          return `${hours}h ${minutes}m`;
        }
        if (minutes > 0) {
          return `${minutes}m`;
        }
        return "";
      },
    []
  );

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [tasksData, activeTimerData] = await Promise.all([
          tasksApi.getTasks("active"), // Only fetch active tasks
          tasksApi.getActiveTimer(),
        ]);

        // Fetch time entries for all tasks to calculate total time
        const tasksWithTimeEntries = await Promise.all(
          tasksData.map(async (task) => {
            try {
              const entries = await tasksApi.getTimeEntries(task.id);
              const total_time = calculateTotalTime(entries);
              return { ...task, total_time };
            } catch {
              return { ...task, total_time: "" };
            }
          })
        );

        const tasksWithUI: TaskViewModel[] = tasksWithTimeEntries.map((task) => ({
          ...task,
          isBeingEdited: false,
        }));

        setTasks(tasksWithUI);

        if (activeTimerData) {
          const task = tasksWithUI.find((t) => t.id === activeTimerData.task_id);
          setActiveTimer({
            ...activeTimerData,
            taskName: task?.name || "Unknown Task",
          });

          // Open recovery modal if timer was already active
          openRecoveryModal();
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load data";
        setError(message);
        toast.error("Błąd ładowania danych", {
          description: "Nie udało się załadować zadań. Spróbuj odświeżyć stronę.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [setTasks, setActiveTimer, setIsLoading, setError, openRecoveryModal]);

  // Setup beforeunload listener to save timestamp when closing app
  useEffect(() => {
    setupBeforeUnloadListener();
    return () => {
      cleanupBeforeUnloadListener();
    };
  }, []);

  const handleCreateTask = async (data: { name: string; description?: string }) => {
    try {
      const newTask = await tasksApi.createTask(data);
      const taskWithUI: TaskViewModel = { ...newTask, isBeingEdited: false };
      setTasks((prev) => [taskWithUI, ...prev]);
      closeCreateModal();
      toast.success("Sukces", {
        description: "Zadanie zostało utworzone",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create task";
      toast.error("Błąd", {
        description: message,
      });
    }
  };

  const handleEditTask = async (data: { name: string; description?: string }) => {
    if (!taskToEdit) return;

    try {
      const updatedTask = await tasksApi.updateTask(taskToEdit.id, data);
      const taskWithUI: TaskViewModel = { ...updatedTask, isBeingEdited: false };
      setTasks((prev) => prev.map((task) => (task.id === taskWithUI.id ? taskWithUI : task)));
      closeEditModal();
      toast.success("Sukces", {
        description: "Zadanie zostało zaktualizowane",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update task";
      toast.error("Błąd", {
        description: message,
      });
    }
  };

  const handleStartTimer = async (taskId: string) => {
    try {
      const timeEntry = await tasksApi.startTimer(taskId);
      const task = tasks.find((t) => t.id === taskId);

      setActiveTimer({
        id: timeEntry.id,
        task_id: taskId,
        start_time: timeEntry.start_time,
        taskName: task?.name || "Unknown Task",
      });

      toast.success("Licznik uruchomiony", {
        description: `Rozpoczęto śledzenie czasu dla: ${task?.name}`,
      });

      // Auto-scroll to ActiveTimerCard
      setTimeout(() => {
        activeTimerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to start timer";

      // Handle 409 Conflict - another timer is already active
      if (message.includes("409") || message.toLowerCase().includes("already active")) {
        toast.error("Inny licznik jest już aktywny", {
          description: "Zatrzymaj aktywny licznik przed rozpoczęciem nowego",
        });
      } else {
        toast.error("Błąd", {
          description: message,
        });
      }
    }
  };

  const handleStopTimer = async (taskId: string, timeEntryId: string) => {
    try {
      await tasksApi.stopTimer(taskId, timeEntryId);
      setActiveTimer(null);
      toast.success("Licznik zatrzymany", {
        description: "Czas został zapisany",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to stop timer";
      toast.error("Błąd", {
        description: message,
      });
    }
  };

  // Recovery Modal handlers
  const handleRecoverySaveAll = async () => {
    if (!activeTimer) return;
    await handleStopTimer(activeTimer.task_id, activeTimer.id);
    clearCloseTimestamp();
  };

  const handleRecoveryDiscard = async () => {
    if (!activeTimer) return;
    try {
      await tasksApi.deleteTimeEntry(activeTimer.task_id, activeTimer.id);
      setActiveTimer(null);
      clearCloseTimestamp();
      toast.info("Sesja odrzucona", {
        description: "Czas nie został zapisany",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to discard timer";
      toast.error("Błąd", {
        description: message,
      });
    }
  };

  const handleRecoveryManualCorrect = async () => {
    if (!activeTimer) return;

    try {
      // First, stop the timer to end the session
      await tasksApi.stopTimer(activeTimer.task_id, activeTimer.id);
      const stoppedSessionId = activeTimer.id;

      setActiveTimer(null);
      clearCloseTimestamp();

      // Then open edit modal with the task
      const task = tasks.find((t) => t.id === activeTimer.task_id);
      if (task) {
        // Store the session ID to highlight in edit modal
        sessionStorage.setItem("highlightSessionId", stoppedSessionId);
        openEditModal(task);
      }

      toast.info("Timer zatrzymany", {
        description: "Możesz teraz skorygować czas sesji",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to stop timer";
      toast.error("Błąd", {
        description: message,
      });
    }
  };
  const handleCompleteTask = async () => {
    if (!taskToComplete) return;

    try {
      await tasksApi.updateTask(taskToComplete.id, { status: "completed" });

      // Remove task from list with fade-out animation
      setTasks((prev) => prev.filter((task) => task.id !== taskToComplete.id));

      closeCompleteModal();
      toast.success("Zadanie ukończone", {
        description: "Zadanie zostało zarchiwizowane",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to complete task";
      toast.error("Błąd", {
        description: message,
      });
    }
  };
  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl" role="main" aria-label="Dashboard">
      {/* Recovery Modal */}
      <RecoveryModal
        activeTimer={activeTimer}
        isOpen={isRecoveryModalOpen}
        onSaveAll={handleRecoverySaveAll}
        onDiscard={handleRecoveryDiscard}
        onManualCorrect={handleRecoveryManualCorrect}
        onClose={closeRecoveryModal}
      />

      {/* Active Timer Card - Sticky */}
      {activeTimer && (
        <div ref={activeTimerRef}>
          <ActiveTimerCard activeTimer={activeTimer} onStop={handleStopTimer} />
        </div>
      )}

      {/* Header with Create Button */}
      <header className="flex items-center justify-between mb-6" role="banner">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Moje zadania</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Zarządzaj swoimi zadaniami i śledź czas pracy
          </p>
        </div>
        <Button onClick={openCreateModal} size="lg" className="hidden sm:flex">
          <Plus className="h-5 w-5 mr-2" />
          Dodaj zadanie
        </Button>
      </header>

      {/* FAB for mobile */}
      <Button
        onClick={openCreateModal}
        size="lg"
        className="sm:hidden fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-lg"
        aria-label="Dodaj nowe zadanie"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Task List */}
      <TaskList
        tasks={tasks}
        onStartTimer={handleStartTimer}
        onEdit={openEditModal}
        onComplete={openCompleteModal}
        onCreateTask={openCreateModal}
        activeTimer={activeTimer}
        isLoading={isLoading}
      />

      {/* Modals */}
      <CreateTaskModal isOpen={isCreateModalOpen} onClose={closeCreateModal} onSave={handleCreateTask} />

      {taskToEdit && (
        <EditTaskModal
          isOpen={isEditModalOpen}
          onClose={closeEditModal}
          onSave={handleEditTask}
          task={taskToEdit}
          hasActiveTimer={activeTimer?.task_id === taskToEdit.id}
        />
      )}

      <CompleteConfirmationDialog
        isOpen={isCompleteModalOpen}
        task={taskToComplete}
        onConfirm={handleCompleteTask}
        onCancel={closeCompleteModal}
      />
    </main>
  );
}
