import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SummaryHeroCardProps {
  totalDurationFormatted: string | null;
  selectedDate: Date;
  isLoading: boolean;
}

export function SummaryHeroCard({ totalDurationFormatted, selectedDate, isLoading }: SummaryHeroCardProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("pl-PL", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Podsumowanie czasu pracy</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center justify-center py-8">
          {isLoading ? (
            <div className="space-y-3 w-full max-w-xs">
              <div className="h-12 bg-gray-200 rounded animate-pulse" />
              <div className="h-6 bg-gray-200 rounded animate-pulse" />
            </div>
          ) : (
            <>
              <p className="text-5xl font-bold text-primary">{totalDurationFormatted || "0h 0m"}</p>
              <p className="text-sm text-muted-foreground mt-2">{formatDate(selectedDate)}</p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
