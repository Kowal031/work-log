import type {
  CreateTaskRequestDto,
  TaskResponseDto,
  UpdateTaskRequestDto,
  ActiveTimerResponseDto,
  TimeEntryResponseDto,
} from "@/types";

/**
 * Fetch all tasks for the current user
 */
export async function getTasks(status?: "active" | "completed"): Promise<TaskResponseDto[]> {
  const url = new URL("/api/tasks", window.location.origin);
  if (status) {
    url.searchParams.set("status", status);
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch tasks");
  }

  return response.json();
}

/**
 * Create a new task
 */
export async function createTask(data: CreateTaskRequestDto): Promise<TaskResponseDto> {
  const response = await fetch("/api/tasks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create task");
  }

  return response.json();
}

/**
 * Update an existing task
 */
export async function updateTask(taskId: string, data: UpdateTaskRequestDto): Promise<TaskResponseDto> {
  const response = await fetch(`/api/tasks/${taskId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update task");
  }

  return response.json();
}

/**
 * Get active timer for the current user
 */
export async function getActiveTimer(): Promise<ActiveTimerResponseDto | null> {
  const response = await fetch("/api/tasks/active-timer");

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch active timer");
  }

  return response.json();
}

/**
 * Start a timer for a task
 */
export async function startTimer(taskId: string): Promise<TimeEntryResponseDto> {
  const response = await fetch(`/api/tasks/${taskId}/time-entries/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to start timer");
  }

  return response.json();
}

/**
 * Stop a timer for a task
 */
export async function stopTimer(taskId: string, timeEntryId: string): Promise<TimeEntryResponseDto> {
  const response = await fetch(`/api/tasks/${taskId}/time-entries/${timeEntryId}/stop`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to stop timer");
  }

  return response.json();
}

/**
 * Delete a time entry (discard without saving)
 */
export async function deleteTimeEntry(taskId: string, timeEntryId: string): Promise<void> {
  const response = await fetch(`/api/tasks/${taskId}/time-entries/${timeEntryId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to delete time entry");
  }
}

/**
 * Get all time entries for a task
 */
export async function getTimeEntries(taskId: string): Promise<TimeEntryResponseDto[]> {
  const response = await fetch(`/api/tasks/${taskId}/time-entries`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch time entries");
  }

  return response.json();
}

/**
 * Update a time entry
 */
export async function updateTimeEntry(
  taskId: string,
  timeEntryId: string,
  data: { start_time?: string; end_time?: string }
): Promise<TimeEntryResponseDto> {
  const response = await fetch(`/api/tasks/${taskId}/time-entries/${timeEntryId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update time entry");
  }

  return response.json();
}
