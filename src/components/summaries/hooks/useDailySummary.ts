import { useState, useEffect } from "react";
import type { DailySummaryResponseDto } from "@/types";
import { getDailySummary } from "@/lib/api/summary.api";

interface UseDailySummaryReturn {
  summary: DailySummaryResponseDto | null;
  isLoading: boolean;
  error: string | null;
}

export function useDailySummary(selectedDate: Date): UseDailySummaryReturn {
  const [summary, setSummary] = useState<DailySummaryResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const dateString = formatDateToYYYYMMDD(selectedDate);
        const data = await getDailySummary(dateString, dateString);
        setSummary(data);
      } catch (err) {
        if (err instanceof Error) {
          if (err.message === "Unauthorized") {
            setError("Wymagana autoryzacja. Proszę się zalogować.");
          } else {
            setError("Nie udało się załadować podsumowania. Spróbuj ponownie później.");
          }
        } else {
          setError("Nie udało się załadować podsumowania. Spróbuj ponownie później.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummary();
  }, [selectedDate]);

  return { summary, isLoading, error };
}

function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
