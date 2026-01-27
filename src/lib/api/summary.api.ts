import type { DailySummaryResponseDto } from "@/types";

const API_BASE_URL = "/api";

export async function getDailySummary(dateFrom: string, dateTo: string): Promise<DailySummaryResponseDto> {
  // Calculate timezone offset in minutes from UTC
  // getTimezoneOffset() returns offset in minutes, but with opposite sign
  // e.g., for UTC+1, it returns -60, so we negate it to get +60
  const timezoneOffset = -new Date().getTimezoneOffset();

  const params = new URLSearchParams({
    date_from: dateFrom,
    date_to: dateTo,
    timezone_offset: timezoneOffset.toString(),
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
