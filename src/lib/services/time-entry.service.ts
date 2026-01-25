import type { SupabaseClient } from "@supabase/supabase-js";
import type { StartTimeEntryCommand, TimeEntryResponseDto } from "../../types";

/**
 * Check if a task has an active timer (time entry without end_time)
 * @param supabase - Authenticated Supabase client
 * @param taskId - Task ID to check
 * @returns true if task has active timer, false otherwise
 * @throws Error if query fails
 */
export async function hasActiveTimer(supabase: SupabaseClient, taskId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("time_entries")
    .select("id")
    .eq("task_id", taskId)
    .is("end_time", null)
    .single();

  if (error) {
    // PGRST116 means no rows returned, which is fine (no active timer)
    if (error.code === "PGRST116") {
      return false;
    }
    throw new Error(`Failed to check active timer: ${error.message}`);
  }

  return data !== null;
}

/**
 * Get active timer for a user (across all tasks)
 * @param supabase - Authenticated Supabase client
 * @param userId - User ID to check
 * @returns Active time entry or null if no active timer
 * @throws Error if query fails
 */
export async function getActiveTimer(
  supabase: SupabaseClient,
  userId: string
): Promise<{ id: string; task_id: string; start_time: string } | null> {
  const { data, error } = await supabase
    .from("time_entries")
    .select("id, task_id, start_time")
    .eq("user_id", userId)
    .is("end_time", null)
    .single();

  if (error) {
    // PGRST116 means no rows returned, which is fine (no active timer)
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Failed to get active timer: ${error.message}`);
  }

  return data;
}

/**
 * Start a new time entry for a task
 * @param supabase - Authenticated Supabase client
 * @param command - Start time entry command with user_id, task_id, and start_time
 * @returns TimeEntryResponseDto with the created time entry data
 * @throws Error if time entry creation fails
 */
export async function startTimeEntry(
  supabase: SupabaseClient,
  command: StartTimeEntryCommand
): Promise<TimeEntryResponseDto> {
  const { data, error } = await supabase
    .from("time_entries")
    .insert({
      user_id: command.user_id,
      task_id: command.task_id,
      start_time: command.start_time,
      end_time: null,
    })
    .select("id, task_id, start_time, end_time")
    .single();

  if (error) {
    throw new Error(`Failed to start time entry: ${error.message}`);
  }

  if (!data) {
    throw new Error("No data returned from time entry creation");
  }

  return data;
}
