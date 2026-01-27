import { useState } from "react";
import { DateSelector } from "./DateSelector";
import { SummaryHeroCard } from "./SummaryHeroCard";
import { SummaryTaskList } from "./SummaryTaskList";
import { EditTaskModalSummary } from "./EditTaskModalSummary";
import { useDailySummary } from "./hooks/useDailySummary";

export default function SummariesView() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { summary, isLoading, error, refetch } = useDailySummary(selectedDate);

  // Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedTaskName, setSelectedTaskName] = useState<string>("");

  const handleTaskClick = (taskId: string, date: Date) => {
    // Find task name from summary
    const task = summary?.tasks.find((t) => t.task_id === taskId);
    if (task) {
      setSelectedTaskId(taskId);
      setSelectedTaskName(task.task_name);
      setIsEditModalOpen(true);
    }
  };

  const handleModalClose = () => {
    setIsEditModalOpen(false);
    setSelectedTaskId(null);
    setSelectedTaskName("");
  };

  const handleSessionUpdated = () => {
    // Refresh summary data after session is updated
    refetch();
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-destructive/10 border border-destructive rounded-lg p-6 text-center">
            <p className="text-destructive font-semibold mb-2">Wystąpił błąd</p>
            <p className="text-muted-foreground">{error}</p>
            {error.includes("autoryzacja") && (
              <a href="/" className="inline-block mt-4 text-primary hover:underline">
                Przejdź do strony logowania
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Podsumowanie</h1>
        </div>

        <DateSelector selectedDate={selectedDate} onDateChange={setSelectedDate} disabled={isLoading} />

        <SummaryHeroCard
          totalDurationFormatted={summary?.total_duration_formatted || null}
          selectedDate={selectedDate}
          isLoading={isLoading}
        />

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Zadania</h2>
          <SummaryTaskList
            tasks={summary?.tasks || []}
            isLoading={isLoading}
            selectedDate={selectedDate}
            onTaskClick={handleTaskClick}
          />
        </div>
      </div>

      {/* Edit Task Modal for Summaries */}
      {selectedTaskId && (
        <EditTaskModalSummary
          isOpen={isEditModalOpen}
          onClose={handleModalClose}
          taskId={selectedTaskId}
          taskName={selectedTaskName}
          selectedDate={selectedDate}
          onSessionUpdated={handleSessionUpdated}
        />
      )}
    </div>
  );
}
