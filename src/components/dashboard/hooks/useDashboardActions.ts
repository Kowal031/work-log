import { toast } from "sonner";
import * as tasksApi from "@/lib/api/tasks.api";
import type { TaskViewModel, ActiveTimerViewModel } from "@/types";
import { clearCloseTimestamp } from "@/lib/utils/recovery.utils";

interface UseDashboardActionsParams {
  tasks: TaskViewModel[];
  setTasks: React.Dispatch<React.SetStateAction<TaskViewModel[]>>;
  activeTimer: ActiveTimerViewModel | null;
  setActiveTimer: React.Dispatch<React.SetStateAction<ActiveTimerViewModel | null>>;
  closeCreateModal: () => void;
  closeEditModal: () => void;
  taskToEdit: TaskViewModel | null;
  closeRecoveryModal: () => void;
  closeCapacityExceededModal: () => void;
  openEditModal: (task: TaskViewModel) => void;
  openCapacityExceededModal: (error: tasksApi.ExtendedError) => void;
  taskToComplete: TaskViewModel | null;
  closeCompleteModal: () => void;
}

export function useDashboardActions({
  tasks,
  setTasks,
  activeTimer,
  setActiveTimer,
  closeCreateModal,
  closeEditModal,
  taskToEdit,
  closeCapacityExceededModal,
  openEditModal,
  openCapacityExceededModal,
  taskToComplete,
  closeCompleteModal,
}: UseDashboardActionsParams) {
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
        // This will be handled in the component
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
      const timezoneOffset = -new Date().getTimezoneOffset();
      await tasksApi.stopTimer(taskId, timeEntryId, timezoneOffset);
      setActiveTimer(null);
      toast.success("Licznik zatrzymany", {
        description: "Czas został zapisany",
      });
    } catch (err) {
      const extendedError = err as tasksApi.ExtendedError;

      if (extendedError.code === "DailyCapacityExceeded" && extendedError.details) {
        // Open capacity exceeded modal instead of showing toast
        openCapacityExceededModal(extendedError);
      } else {
        const message = err instanceof Error ? err.message : "Failed to stop timer";
        toast.error("Błąd", {
          description: message,
        });
      }
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
      const timezoneOffset = -new Date().getTimezoneOffset();
      await tasksApi.stopTimer(activeTimer.task_id, activeTimer.id, timezoneOffset);
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

  // Capacity Exceeded Modal handlers
  const handleCapacityExceededDiscard = async () => {
    if (!activeTimer) return;
    try {
      await tasksApi.deleteTimeEntry(activeTimer.task_id, activeTimer.id);
      setActiveTimer(null);
      closeCapacityExceededModal();
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

  const handleCapacityExceededManualCorrect = async () => {
    if (!activeTimer) return;

    try {
      // Don't stop the timer, just close the modal and open edit modal
      closeCapacityExceededModal();

      const task = tasks.find((t) => t.id === activeTimer.task_id);
      if (task) {
        // Store the active timer ID to highlight in edit modal
        sessionStorage.setItem("highlightSessionId", activeTimer.id);
        openEditModal(task);
      }

      toast.info("Tryb korekty", {
        description: "Timer pozostaje aktywny. Możesz skorygować sesję.",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to open edit";
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

  return {
    handleCreateTask,
    handleEditTask,
    handleStartTimer,
    handleStopTimer,
    handleRecoverySaveAll,
    handleRecoveryDiscard,
    handleRecoveryManualCorrect,
    handleCapacityExceededDiscard,
    handleCapacityExceededManualCorrect,
    handleCompleteTask,
  };
}
