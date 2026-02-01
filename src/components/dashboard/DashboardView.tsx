import * as tasksApi from "@/lib/api/tasks.api";
import { cleanupBeforeUnloadListener, setupBeforeUnloadListener } from "@/lib/utils/recovery.utils";
import type { TaskViewModel } from "@/types";
import { useEffect } from "react";
import { toast } from "sonner";
import { ActiveTimerSection } from "./ActiveTimerSection";
import { CapacityExceededModal } from "./CapacityExceededModal";
import { useDashboardActions } from "./hooks/useDashboardActions";
import { useDashboardState } from "./hooks/useDashboardState";
import { RecoveryModal } from "./RecoveryModal";
import { CompleteConfirmationDialog } from "./task/CompleteConfirmationDialog";
import { CreateTaskModal } from "./task/CreateTaskModal";
import { EditTaskModal } from "./task/EditTaskModal";
import { TaskManagementSection } from "./TaskManagementSection";

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
    isCapacityExceededModalOpen,
    capacityExceededError,
    openCapacityExceededModal,
    closeCapacityExceededModal,
  } = useDashboardState();

  const {
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
  } = useDashboardActions({
    tasks,
    setTasks,
    activeTimer,
    setActiveTimer,
    closeCreateModal,
    closeEditModal,
    taskToEdit,
    closeRecoveryModal,
    closeCapacityExceededModal,
    openEditModal,
    openCapacityExceededModal,
    taskToComplete,
    closeCompleteModal,
  });

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

        // TODO: Optimize with batch endpoint to get all time entries at once
        // For now, we'll calculate total_time on demand in TaskItem component
        const tasksWithUI: TaskViewModel[] = tasksData.map((task) => ({
          ...task,
          total_time: "", // Will be calculated on demand
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

      {/* Capacity Exceeded Modal */}
      <CapacityExceededModal
        activeTimer={activeTimer}
        isOpen={isCapacityExceededModalOpen}
        errorMessage={capacityExceededError?.message || ""}
        errorDetails={
          capacityExceededError?.details as {
            day: string;
            existing_duration_formatted: string;
            new_duration_formatted: string;
            total_duration_formatted: string;
            limit: string;
          } | null
        }
        onDiscard={handleCapacityExceededDiscard}
        onManualCorrect={handleCapacityExceededManualCorrect}
        onClose={closeCapacityExceededModal}
      />

      {/* Active Timer Section */}
      <ActiveTimerSection activeTimer={activeTimer} onStop={handleStopTimer} />

      {/* Task Management Section */}
      <TaskManagementSection
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
