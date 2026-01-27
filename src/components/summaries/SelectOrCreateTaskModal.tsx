import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import * as tasksApi from "@/lib/api/tasks.api";
import type { TaskResponseDto } from "@/types";

interface SelectOrCreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskSelected: (taskId: string, taskName: string) => void;
  selectedDate: Date;
}

export function SelectOrCreateTaskModal({
  isOpen,
  onClose,
  onTaskSelected,
  selectedDate,
}: SelectOrCreateTaskModalProps) {
  const [mode, setMode] = useState<"select" | "create">("select");
  const [activeTasks, setActiveTasks] = useState<TaskResponseDto[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");

  // Create mode state
  const [taskName, setTaskName] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch active tasks when modal opens
  useEffect(() => {
    if (isOpen && mode === "select") {
      fetchActiveTasks();
    }
  }, [isOpen, mode]);

  const fetchActiveTasks = async () => {
    setIsLoadingTasks(true);
    try {
      const tasks = await tasksApi.getTasks("active");
      setActiveTasks(tasks);
      if (tasks.length > 0) {
        setSelectedTaskId(tasks[0].id);
      }
    } catch (err) {
      toast.error("Błąd", {
        description: "Nie udało się załadować listy zadań",
      });
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const handleSelectTask = () => {
    const selectedTask = activeTasks.find((t) => t.id === selectedTaskId);
    if (selectedTask) {
      onTaskSelected(selectedTask.id, selectedTask.name);
      onClose();
    }
  };

  const handleCreateTask = async () => {
    if (!taskName.trim()) {
      toast.error("Błąd", {
        description: "Nazwa zadania jest wymagana",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const newTask = await tasksApi.createTask({
        name: taskName.trim(),
        description: taskDescription.trim() || undefined,
      });

      toast.success("Sukces", {
        description: "Zadanie zostało utworzone",
      });

      onTaskSelected(newTask.id, newTask.name);
      onClose();

      // Reset form
      setTaskName("");
      setTaskDescription("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nie udało się utworzyć zadania";
      toast.error("Błąd", {
        description: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setMode("select");
    setTaskName("");
    setTaskDescription("");
    setSelectedTaskId("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Dodaj czas pracy</DialogTitle>
          <DialogDescription>Wybierz istniejące zadanie lub utwórz nowe</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Mode Selection */}
          <div className="flex gap-2">
            <Button
              variant={mode === "select" ? "default" : "outline"}
              onClick={() => setMode("select")}
              className="flex-1"
            >
              Wybierz zadanie
            </Button>
            <Button
              variant={mode === "create" ? "default" : "outline"}
              onClick={() => setMode("create")}
              className="flex-1"
            >
              Utwórz nowe
            </Button>
          </div>

          {/* Select Mode */}
          {mode === "select" && (
            <div className="space-y-4">
              {isLoadingTasks ? (
                <div className="text-center py-6 text-muted-foreground">Ładowanie zadań...</div>
              ) : activeTasks.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-4">Brak aktywnych zadań</p>
                  <Button variant="outline" onClick={() => setMode("create")}>
                    Utwórz nowe zadanie
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    <Label htmlFor="task-select">Zadanie</Label>
                    <select
                      id="task-select"
                      value={selectedTaskId}
                      onChange={(e) => setSelectedTaskId(e.target.value)}
                      className="w-full h-11 px-3 rounded-md border border-input bg-background"
                    >
                      {activeTasks.map((task) => (
                        <option key={task.id} value={task.id}>
                          {task.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleClose} className="flex-1">
                      Anuluj
                    </Button>
                    <Button onClick={handleSelectTask} disabled={!selectedTaskId} className="flex-1">
                      Dalej
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Create Mode */}
          {mode === "create" && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="task-name">Nazwa zadania *</Label>
                  <span className="text-xs text-muted-foreground">{taskName.length} / 100</span>
                </div>
                <Input
                  id="task-name"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  placeholder="np. Implementacja nowej funkcji"
                  maxLength={100}
                  required
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="task-description">Opis (opcjonalnie)</Label>
                <Textarea
                  id="task-description"
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Dodatkowe szczegóły..."
                  maxLength={500}
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose} disabled={isSubmitting} className="flex-1">
                  Anuluj
                </Button>
                <Button onClick={handleCreateTask} disabled={isSubmitting || !taskName.trim()} className="flex-1">
                  {isSubmitting ? "Tworzenie..." : "Utwórz i dalej"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
