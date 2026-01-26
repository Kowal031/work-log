import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";

interface TaskListEmptyStateProps {
  onCreateTask: () => void;
}

export function TaskListEmptyState({ onCreateTask }: TaskListEmptyStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="text-muted-foreground">
            <p className="text-lg font-medium">Brak zadań</p>
            <p className="text-sm">Utwórz swoje pierwsze zadanie, aby rozpocząć śledzenie czasu</p>
          </div>
          <Button onClick={onCreateTask} size="lg">
            <Plus className="h-5 w-5 mr-2" />
            Dodaj zadanie
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
