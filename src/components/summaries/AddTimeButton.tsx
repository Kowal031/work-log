import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface AddTimeButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export function AddTimeButton({ onClick, disabled }: AddTimeButtonProps) {
  return (
    <Button onClick={onClick} disabled={disabled} className="gap-2">
      <Plus className="h-4 w-4" />
      Dodaj czas
    </Button>
  );
}
