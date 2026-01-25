/**
 * Convert seconds to HH:MM:SS format
 * @param seconds - Total seconds
 * @returns Formatted string in HH:MM:SS format
 */
export function secondsToHMS(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Get start of day (00:00:00.000Z) in UTC
 * @param date - Date string in YYYY-MM-DD format or Date object
 * @returns ISO 8601 timestamp at start of day
 */
export function startOfDay(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

/**
 * Get end of day (23:59:59.999Z) in UTC
 * @param date - Date string in YYYY-MM-DD format or Date object
 * @returns ISO 8601 timestamp at end of day
 */
export function endOfDay(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  d.setUTCHours(23, 59, 59, 999);
  return d.toISOString();
}

/**
 * Get today's date in YYYY-MM-DD format (UTC)
 * @returns Date string in YYYY-MM-DD format
 */
export function getTodayDateString(): string {
  const today = new Date();
  return today.toISOString().split("T")[0];
}
