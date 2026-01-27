import type { SupabaseClient } from "@supabase/supabase-js";
import type { DailySummaryResponseDto, TaskSummaryDto, TaskStatus } from "../../types";
import { secondsToHMS } from "../utils/date.utils";

interface TimeEntryWithTask {
  task_id: string;
  task_name: string;
  task_status: TaskStatus;
  start_time: string;
  end_time: string;
}

/**
 * Parse PostgreSQL interval string to seconds
 * Examples: "01:30:00", "2 days 03:45:12", "00:00:00"
 */
function parsePostgresInterval(interval: string): number {
  // PostgreSQL returns intervals in format like "HH:MM:SS" or "X days HH:MM:SS"
  let totalSeconds = 0;

  // Check for days
  const daysMatch = interval.match(/(\d+)\s+days?/);
  if (daysMatch) {
    totalSeconds += parseInt(daysMatch[1], 10) * 24 * 3600;
  }

  // Extract time part (HH:MM:SS)
  const timeMatch = interval.match(/(\d+):(\d+):(\d+)/);
  if (timeMatch) {
    const hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    const seconds = parseInt(timeMatch[3], 10);
    totalSeconds += hours * 3600 + minutes * 60 + seconds;
  }

  return totalSeconds;
}

/**
 * Get daily summary of work time grouped by tasks
 * @param supabase - Authenticated Supabase client
 * @param userId - User ID to get summary for
 * @param dateFrom - Start date (ISO 8601 timestamp)
 * @param dateTo - End date (ISO 8601 timestamp)
 * @param timezoneOffset - Timezone offset in minutes from UTC (e.g., 60 for UTC+1)
 * @returns DailySummaryResponseDto with aggregated data
 * @throws Error if query fails
 */
export async function getDailySummary(
  supabase: SupabaseClient,
  userId: string,
  dateFrom: string,
  dateTo: string,
  timezoneOffset: number
): Promise<DailySummaryResponseDto> {
  // Query time entries with task details in the date range using PostgreSQL function
  // Note: For date ranges, we need to aggregate results from multiple days
  // The function filters by local date, so we extract date from timestamps
  const fromDate = new Date(dateFrom).toISOString().split("T")[0];
  const toDate = new Date(dateTo).toISOString().split("T")[0];

  // For simplicity, if from and to are the same day, call once, otherwise query directly
  if (fromDate === toDate) {
    // Single day - use PostgreSQL function
    const { data: summaryData, error } = await supabase.rpc("get_daily_summary", {
      p_user_id: userId,
      p_date: fromDate,
      p_timezone_offset_minutes: timezoneOffset,
    });

    if (error) {
      throw new Error(`Failed to fetch summary: ${error.message}`);
    }

    // Transform PostgreSQL function result
    interface PostgresSummaryRow {
      task_id: string;
      task_name: string;
      total_duration: string; // PostgreSQL interval as string
    }

    if (!summaryData || summaryData.length === 0) {
      return {
        date_from: dateFrom,
        date_to: dateTo,
        total_duration_seconds: 0,
        total_duration_formatted: "00:00:00",
        tasks: [],
      };
    }

    // Need to get task status separately
    const taskIds = (summaryData as PostgresSummaryRow[]).map((row) => row.task_id);
    const { data: tasksData, error: tasksError } = await supabase.from("tasks").select("id, status").in("id", taskIds);

    if (tasksError) {
      throw new Error(`Failed to fetch task statuses: ${tasksError.message}`);
    }

    const taskStatusMap = new Map<string, TaskStatus>();
    if (tasksData) {
      for (const task of tasksData) {
        taskStatusMap.set(task.id, task.status as TaskStatus);
      }
    }

    // Convert interval to seconds and build task summaries
    const tasks: TaskSummaryDto[] = (summaryData as PostgresSummaryRow[]).map((row) => {
      const durationSeconds = parsePostgresInterval(row.total_duration);
      return {
        task_id: row.task_id,
        task_name: row.task_name,
        task_status: taskStatusMap.get(row.task_id) || "active",
        duration_seconds: durationSeconds,
        duration_formatted: secondsToHMS(durationSeconds),
        entries_count: 1, // PostgreSQL function doesn't return count, approximate
      };
    });

    // Sort by duration descending
    tasks.sort((a, b) => b.duration_seconds - a.duration_seconds);

    const totalDurationSeconds = tasks.reduce((sum, task) => sum + task.duration_seconds, 0);

    return {
      date_from: dateFrom,
      date_to: dateTo,
      total_duration_seconds: totalDurationSeconds,
      total_duration_formatted: secondsToHMS(totalDurationSeconds),
      tasks,
    };
  }

  // Multi-day range - use direct query (existing implementation)
  const { data: entries, error } = await supabase
    .from("time_entries")
    .select(
      `
      task_id,
      start_time,
      end_time,
      tasks!inner(
        name,
        status
      )
    `
    )
    .eq("user_id", userId)
    .gte("start_time", dateFrom)
    .lte("start_time", dateTo)
    .not("end_time", "is", null)
    .order("start_time", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch summary: ${error.message}`);
  }

  // If no entries, return empty summary
  if (!entries || entries.length === 0) {
    return {
      date_from: dateFrom,
      date_to: dateTo,
      total_duration_seconds: 0,
      total_duration_formatted: "00:00:00",
      tasks: [],
    };
  }

  // Transform data to flat structure
  interface SupabaseTimeEntryWithTask {
    task_id: string;
    start_time: string;
    end_time: string;
    tasks: {
      name: string;
      status: TaskStatus;
    } | null;
  }

  const flatEntries: TimeEntryWithTask[] = (entries as unknown as SupabaseTimeEntryWithTask[])
    .filter(
      (entry): entry is SupabaseTimeEntryWithTask & { tasks: NonNullable<SupabaseTimeEntryWithTask["tasks"]> } =>
        entry.tasks !== null
    )
    .map((entry) => ({
      task_id: entry.task_id,
      task_name: entry.tasks.name,
      task_status: entry.tasks.status,
      start_time: entry.start_time,
      end_time: entry.end_time,
    }));

  // Group by task_id and calculate durations
  const taskMap = new Map<string, TaskSummaryDto>();

  for (const entry of flatEntries) {
    // Calculate duration in seconds
    const startMs = new Date(entry.start_time).getTime();
    const endMs = new Date(entry.end_time).getTime();
    const durationSeconds = Math.floor((endMs - startMs) / 1000);

    // Get or create task summary
    let taskSummary = taskMap.get(entry.task_id);
    if (!taskSummary) {
      taskSummary = {
        task_id: entry.task_id,
        task_name: entry.task_name,
        task_status: entry.task_status,
        duration_seconds: 0,
        duration_formatted: "00:00:00",
        entries_count: 0,
      };
      taskMap.set(entry.task_id, taskSummary);
    }

    // Add duration and increment count
    taskSummary.duration_seconds += durationSeconds;
    taskSummary.entries_count += 1;
  }

  // Convert map to array and format durations
  const tasks: TaskSummaryDto[] = Array.from(taskMap.values()).map((task) => ({
    ...task,
    duration_formatted: secondsToHMS(task.duration_seconds),
  }));

  // Sort by duration descending (most time first)
  tasks.sort((a, b) => b.duration_seconds - a.duration_seconds);

  // Calculate total duration
  const totalDurationSeconds = tasks.reduce((sum, task) => sum + task.duration_seconds, 0);

  return {
    date_from: dateFrom,
    date_to: dateTo,
    total_duration_seconds: totalDurationSeconds,
    total_duration_formatted: secondsToHMS(totalDurationSeconds),
    tasks,
  };
}
