import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TaskForm } from "./TaskForm";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; description?: string }) => void;
}

export function CreateTaskModal({ isOpen, onClose, onSave }: CreateTaskModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nowe zadanie</DialogTitle>
          <DialogDescription>Utwórz nowe zadanie do śledzenia czasu pracy</DialogDescription>
        </DialogHeader>
        <TaskForm onSubmit={onSave} onCancel={onClose} />
      </DialogContent>
    </Dialog>
  );
}
