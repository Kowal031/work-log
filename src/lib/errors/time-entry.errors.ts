/**
 * Error thrown when adding a time entry would exceed the 24-hour daily capacity
 */
export class DailyCapacityExceededError extends Error {
  public readonly day: string; // YYYY-MM-DD
  public readonly existing: number; // seconds already used
  public readonly new: number; // seconds trying to add
  public readonly total: number; // existing + new
  public readonly limit: number = 86400; // 24 hours in seconds

  constructor(day: string, existing: number, newDuration: number) {
    const total = existing + newDuration;
    const message = `Przekroczono limit czasu dla dnia ${day}. Wykorzystane: ${DailyCapacityExceededError.formatDuration(
      existing
    )} (Limit: 24:00:00)`;

    super(message);
    this.name = "DailyCapacityExceededError";
    this.day = day;
    this.existing = existing;
    this.new = newDuration;
    this.total = total;

    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DailyCapacityExceededError);
    }
  }

  /**
   * Format existing duration in HH:MM:SS format
   */
  get existingFormatted(): string {
    return DailyCapacityExceededError.formatDuration(this.existing);
  }

  /**
   * Format new duration in HH:MM:SS format
   */
  get newFormatted(): string {
    return DailyCapacityExceededError.formatDuration(this.new);
  }

  /**
   * Format total duration in HH:MM:SS format
   */
  get totalFormatted(): string {
    return DailyCapacityExceededError.formatDuration(this.total);
  }

  /**
   * Format duration in seconds to HH:MM:SS
   */
  private static formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }
}
