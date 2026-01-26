/**
 * Utility functions for timer recovery functionality
 */

const CLOSE_TIMESTAMP_KEY = "work-log-close-timestamp";

/**
 * Saves the current timestamp to localStorage when the app is about to close
 */
export function saveCloseTimestamp(): void {
  try {
    localStorage.setItem(CLOSE_TIMESTAMP_KEY, new Date().toISOString());
  } catch (error) {
    console.error("Failed to save close timestamp:", error);
  }
}

/**
 * Gets the saved close timestamp from localStorage
 */
export function getCloseTimestamp(): string | null {
  try {
    return localStorage.getItem(CLOSE_TIMESTAMP_KEY);
  } catch (error) {
    console.error("Failed to get close timestamp:", error);
    return null;
  }
}

/**
 * Clears the saved close timestamp from localStorage
 */
export function clearCloseTimestamp(): void {
  try {
    localStorage.removeItem(CLOSE_TIMESTAMP_KEY);
  } catch (error) {
    console.error("Failed to clear close timestamp:", error);
  }
}

/**
 * Calculates elapsed time in seconds between start time and now
 */
export function calculateElapsedTime(startTime: string): number {
  const start = new Date(startTime).getTime();
  const now = Date.now();
  return Math.floor((now - start) / 1000);
}

/**
 * Formats duration in seconds to human-readable format
 * @example formatDuration(7200) => "2h"
 * @example formatDuration(7260) => "2h 1m"
 * @example formatDuration(172800) => "2d"
 * @example formatDuration(176400) => "2d 1h"
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    const remainingHours = hours % 24;
    const remainingMinutes = minutes % 60;

    if (remainingHours === 0 && remainingMinutes === 0) {
      return `${days}d`;
    } else if (remainingHours > 0 && remainingMinutes === 0) {
      return `${days}d ${remainingHours}h`;
    } else if (remainingHours > 0) {
      return `${days}d ${remainingHours}h ${remainingMinutes}m`;
    } else {
      return `${days}d ${remainingMinutes}m`;
    }
  }

  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${remainingMinutes}m`;
  }

  return `${minutes}m`;
}

/**
 * Checks if the elapsed time is considered "long" (more than 12 hours)
 */
export function isLongDuration(seconds: number): boolean {
  const TWELVE_HOURS = 12 * 60 * 60; // 12 hours in seconds
  return seconds > TWELVE_HOURS;
}

/**
 * Sets up beforeunload event listener to save timestamp before closing
 */
export function setupBeforeUnloadListener(): void {
  if (typeof window !== "undefined") {
    window.addEventListener("beforeunload", saveCloseTimestamp);
  }
}

/**
 * Removes beforeunload event listener
 */
export function cleanupBeforeUnloadListener(): void {
  if (typeof window !== "undefined") {
    window.removeEventListener("beforeunload", saveCloseTimestamp);
  }
}
