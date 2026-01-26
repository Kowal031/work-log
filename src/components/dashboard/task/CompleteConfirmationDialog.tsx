import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { TaskViewModel } from "@/types";

interface CompleteConfirmationDialogProps {
  isOpen: boolean;
  task: TaskViewModel | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function CompleteConfirmationDialog({ isOpen, task, onConfirm, onCancel }: CompleteConfirmationDialogProps) {
  if (!task) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Ukończenie zadania</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Czy na pewno chcesz oznaczyć zadanie <strong className="text-foreground">{task.name}</strong> jako
              ukończone?
            </p>
            <p className="text-amber-600 dark:text-amber-500">
              Zadanie zostanie zarchiwizowane i nie będzie widoczne na liście aktywnych zadań.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Anuluj</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Oznacz jako ukończone</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
