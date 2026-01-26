import { useCallback, useState } from "react";
import type { ActiveTimerViewModel, TaskViewModel } from "@/types";

interface UseDashboardStateReturn {
  tasks: TaskViewModel[];
  setTasks: React.Dispatch<React.SetStateAction<TaskViewModel[]>>;
  activeTimer: ActiveTimerViewModel | null;
  setActiveTimer: React.Dispatch<React.SetStateAction<ActiveTimerViewModel | null>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  isCreateModalOpen: boolean;
  openCreateModal: () => void;
  closeCreateModal: () => void;
  isEditModalOpen: boolean;
  taskToEdit: TaskViewModel | null;
  openEditModal: (task: TaskViewModel) => void;
  closeEditModal: () => void;
  isRecoveryModalOpen: boolean;
  openRecoveryModal: () => void;
  closeRecoveryModal: () => void;
  isCompleteModalOpen: boolean;
  taskToComplete: TaskViewModel | null;
  openCompleteModal: (task: TaskViewModel) => void;
  closeCompleteModal: () => void;
}

export function useDashboardState(): UseDashboardStateReturn {
  const [tasks, setTasks] = useState<TaskViewModel[]>([]);
  const [activeTimer, setActiveTimer] = useState<ActiveTimerViewModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<TaskViewModel | null>(null);
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [taskToComplete, setTaskToComplete] = useState<TaskViewModel | null>(null);

  const openCreateModal = useCallback(() => {
    setIsCreateModalOpen(true);
  }, []);

  const closeCreateModal = useCallback(() => {
    setIsCreateModalOpen(false);
  }, []);

  const openEditModal = useCallback((task: TaskViewModel) => {
    setTaskToEdit(task);
    setIsEditModalOpen(true);
  }, []);

  const closeEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setTaskToEdit(null);
  }, []);

  const openRecoveryModal = useCallback(() => {
    setIsRecoveryModalOpen(true);
  }, []);

  const closeRecoveryModal = useCallback(() => {
    setIsRecoveryModalOpen(false);
  }, []);

  const openCompleteModal = useCallback((task: TaskViewModel) => {
    setTaskToComplete(task);
    setIsCompleteModalOpen(true);
  }, []);

  const closeCompleteModal = useCallback(() => {
    setIsCompleteModalOpen(false);
    setTaskToComplete(null);
  }, []);

  return {
    tasks,
    setTasks,
    activeTimer,
    setActiveTimer,
    isLoading,
    setIsLoading,
    error,
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
  };
}
