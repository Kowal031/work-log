import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

interface TaskFormProps {
  onSubmit: (data: { name: string; description?: string }) => void;
  initialData?: { name: string; description?: string | null };
  onCancel: () => void;
}

export function TaskForm({ onSubmit, initialData, onCancel }: TaskFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [errors, setErrors] = useState<{ name?: string; description?: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const newErrors: { name?: string; description?: string } = {};
    if (!name.trim()) {
      newErrors.name = "Nazwa zadania jest wymagana";
    } else if (name.trim().length < 3) {
      newErrors.name = "Nazwa zadania musi mieć co najmniej 3 znaki";
    }

    if (description.trim().length > 5000) {
      newErrors.description = "Opis nie może być dłuższy niż 5000 znaków";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
    });
  };

  const isValid = name.trim().length >= 3;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="task-name">
          Nazwa zadania <span className="text-destructive">*</span>
        </Label>
        <Input
          id="task-name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setErrors((prev) => ({ ...prev, name: undefined }));
          }}
          placeholder="Wprowadź nazwę zadania"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "task-name-error" : undefined}
        />
        {errors.name && (
          <p id="task-name-error" className="text-sm text-destructive">
            {errors.name}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="task-description">Opis</Label>
          <span className="text-xs text-muted-foreground">{description.length} / 5000</span>
        </div>
        <Textarea
          id="task-description"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            setErrors((prev) => ({ ...prev, description: undefined }));
          }}
          placeholder="Wprowadź opis zadania (opcjonalnie)"
          rows={4}
          maxLength={5000}
          className="whitespace-pre-wrap break-words"
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? "task-description-error" : undefined}
        />
        {errors.description && (
          <p id="task-description-error" className="text-sm text-destructive">
            {errors.description}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Anuluj
        </Button>
        <Button type="submit" disabled={!isValid}>
          Zapisz
        </Button>
      </div>
    </form>
  );
}
