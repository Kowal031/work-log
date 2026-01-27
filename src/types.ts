import type { Database } from "./db/database.types";

// ============================================================================
// Database Entity Types
// ============================================================================

export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type TaskInsert = Database["public"]["Tables"]["tasks"]["Insert"];
export type TaskUpdate = Database["public"]["Tables"]["tasks"]["Update"];

export type TimeEntry = Database["public"]["Tables"]["time_entries"]["Row"];
export type TimeEntryInsert = Database["public"]["Tables"]["time_entries"]["Insert"];
export type TimeEntryUpdate = Database["public"]["Tables"]["time_entries"]["Update"];

export type TaskStatus = Database["public"]["Enums"]["task_status"];

export type ActiveTaskDetails = Database["public"]["Views"]["active_task_details"]["Row"];

// ============================================================================
// Auth DTOs
// ============================================================================

/**
 * Request DTO for user registration
 * POST /api/auth/register
 */
export interface RegisterRequestDto {
  email: string;
  password: string;
}

/**
 * Request DTO for user login
 * POST /api/auth/login
 */
export interface LoginRequestDto {
  email: string;
  password: string;
}

/**
 * User information returned in auth responses
 */
export interface AuthUserDto {
  id: string;
  email: string;
  created_at: string;
}

/**
 * Session information returned in auth responses
 */
export interface AuthSessionDto {
  access_token: string;
  refresh_token: string;
}

/**
 * Response DTO for successful authentication
 * POST /api/auth/register
 * POST /api/auth/login
 */
export interface AuthResponseDto {
  user: AuthUserDto;
  session: AuthSessionDto;
}

// ============================================================================
// Task DTOs
// ============================================================================

/**
 * Response DTO for task data
 * Derived from Task entity but excludes internal user_id
 * GET /api/tasks
 * POST /api/tasks
 * PATCH /api/tasks/{taskId}
 */
export type TaskResponseDto = Omit<Task, "user_id">;

/**
 * Request DTO for creating a new task
 * POST /api/tasks
 */
export interface CreateTaskRequestDto {
  name: string;
  description?: string;
}

/**
 * Request DTO for updating an existing task
 * PATCH /api/tasks/{taskId}
 * All fields are optional for partial updates
 */
export interface UpdateTaskRequestDto {
  name?: string;
  description?: string;
  status?: TaskStatus;
}

/**
 * Query parameters for listing tasks
 * GET /api/tasks
 */
export interface ListTasksQueryDto {
  status?: TaskStatus;
  sortBy?: "created_at" | "name";
  order?: "asc" | "desc";
}

// ============================================================================
// Time Entry DTOs
// ============================================================================

/**
 * Response DTO for time entry data
 * Derived from TimeEntry entity but excludes internal fields
 * POST /api/tasks/{taskId}/time-entries/start
 * POST /api/tasks/{taskId}/time-entries/{timeEntryId}/stop
 * PATCH /api/tasks/{taskId}/time-entries/{timeEntryId}
 */
export type TimeEntryResponseDto = Omit<TimeEntry, "user_id" | "created_at">;

/**
 * Request DTO for updating time entry timestamps
 * PATCH /api/tasks/{taskId}/time-entries/{timeEntryId}
 */
export interface UpdateTimeEntryRequestDto {
  start_time?: string;
  end_time?: string;
  timezone_offset?: number; // Minutes offset from UTC (for capacity validation)
}

/**
 * Request DTO for manually creating a new time entry
 * POST /api/tasks/{taskId}/time-entries
 */
export interface CreateTimeEntryRequestDto {
  start_time: string;
  end_time: string;
  timezone_offset: number; // Minutes offset from UTC (e.g., -60 for UTC+1)
}

/**
 * Response DTO for active timer check
 * GET /api/tasks/active-timer
 * Returns null if no active timer exists
 */
export type ActiveTimerResponseDto = {
  id: string;
  task_id: string;
  start_time: string;
} | null;

// ============================================================================
// Summary DTOs
// ============================================================================

/**
 * Task summary within daily summary
 * Represents aggregated time tracking data for a single task
 */
export interface TaskSummaryDto {
  task_id: string;
  task_name: string;
  task_status: TaskStatus;
  duration_seconds: number;
  duration_formatted: string;
  entries_count: number;
}

/**
 * Response DTO for daily work summary
 * GET /api/summary/daily
 */
export interface DailySummaryResponseDto {
  date_from: string;
  date_to: string;
  total_duration_seconds: number;
  total_duration_formatted: string;
  tasks: TaskSummaryDto[];
}

/**
 * Query parameters for daily summary
 * GET /api/summary/daily
 */
export interface DailySummaryQueryDto {
  date: string; // Format: YYYY-MM-DD
}

// ============================================================================
// Command Models (for service layer operations)
// ============================================================================

/**
 * Command for creating a new task
 * Includes user_id which is added by the service layer
 */
export interface CreateTaskCommand {
  user_id: string;
  name: string;
  description?: string;
}

/**
 * Command for updating a task
 * Includes user_id for authorization check
 */
export interface UpdateTaskCommand {
  user_id: string;
  task_id: string;
  name?: string;
  description?: string;
  status?: TaskStatus;
}

/**
 * Command for starting a time entry
 * Includes user_id which is added by the service layer
 */
export interface StartTimeEntryCommand {
  user_id: string;
  task_id: string;
  start_time: string;
}

/**
 * Command for stopping a time entry
 * Includes user_id for authorization check
 */
export interface StopTimeEntryCommand {
  user_id: string;
  task_id: string;
  time_entry_id: string;
  end_time: string;
  timezone_offset: number; // Minutes offset from UTC (for capacity validation)
}

/**
 * Command for updating a time entry
 * Includes user_id for authorization check
 */
export interface UpdateTimeEntryCommand {
  user_id: string;
  task_id: string;
  time_entry_id: string;
  start_time?: string;
  end_time?: string;
  timezone_offset?: number; // Minutes offset from UTC (for capacity validation)
}

/**
 * Command for manually creating a time entry
 * Includes user_id which is added by the service layer
 */
export interface CreateTimeEntryCommand {
  user_id: string;
  task_id: string;
  start_time: string;
  end_time: string;
  timezone_offset: number; // Minutes offset from UTC (e.g., -60 for UTC+1)
}

/**
 * Command for retrieving daily summary
 */
export interface GetDailySummaryCommand {
  user_id: string;
  date: string;
}

/**
 * Command for checking active timer
 */
export interface GetActiveTimerCommand {
  user_id: string;
}

// ============================================================================
// Error Response DTOs
// ============================================================================

/**
 * Standard error response structure
 * Used across all endpoints for consistent error handling
 */
export interface ErrorResponseDto {
  error: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Validation error details
 * Used when request validation fails
 */
export interface ValidationErrorDto {
  error: "ValidationError";
  message: string;
  details: {
    field: string;
    message: string;
  }[];
}

// ============================================================================
// View Models (for frontend components)
// ============================================================================

/**
 * Task view model for dashboard
 * Extends TaskResponseDto with UI state
 */
export interface TaskViewModel extends TaskResponseDto {
  isBeingEdited: boolean;
  total_time?: string; // Formatted total time (e.g., "2h 45m")
}

/**
 * Active timer view model for dashboard
 * Extends ActiveTimerResponseDto with task name
 */
export interface ActiveTimerViewModel {
  id: string;
  task_id: string;
  start_time: string;
  taskName: string;
}
