import type { DailySummaryResponseDto } from "@/types";

const API_BASE_URL = "/api";

export async function getDailySummary(dateFrom: string, dateTo: string): Promise<DailySummaryResponseDto> {
  const params = new URLSearchParams({
    date_from: dateFrom,
    date_to: dateTo,
  });

  const response = await fetch(`${API_BASE_URL}/summary/daily?${params}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized");
    }
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch daily summary");
  }

  return response.json();
}
