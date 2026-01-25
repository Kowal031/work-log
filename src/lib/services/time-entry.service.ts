import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  StartTimeEntryCommand,
  StopTimeEntryCommand,
  TimeEntryResponseDto,
  UpdateTimeEntryCommand,
} from "../../types";

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

/**
 * Stop an active time entry
 * @param supabase - Authenticated Supabase client
 * @param command - Stop time entry command with user_id, time_entry_id, and end_time
 * @returns TimeEntryResponseDto with the updated time entry data
 * @throws Error if time entry doesn't exist, already stopped, or update fails
 */
export async function stopTimeEntry(
  supabase: SupabaseClient,
  command: StopTimeEntryCommand
): Promise<TimeEntryResponseDto> {
  // Try to update the time entry - only if it's active (end_time IS NULL)
  const { data, error } = await supabase
    .from("time_entries")
    .update({ end_time: command.end_time })
    .eq("id", command.time_entry_id)
    .eq("user_id", command.user_id)
    .is("end_time", null)
    .select("id, task_id, start_time, end_time")
    .single();

  if (error) {
    // PGRST116 means no rows were updated
    if (error.code === "PGRST116") {
      // Check if entry exists to differentiate between 404 and 409
      const { data: existingEntry } = await supabase
        .from("time_entries")
        .select("id, end_time")
        .eq("id", command.time_entry_id)
        .eq("user_id", command.user_id)
        .single();

      if (!existingEntry) {
        throw new Error("TIME_ENTRY_NOT_FOUND");
      }

      if (existingEntry.end_time !== null) {
        throw new Error("TIME_ENTRY_ALREADY_STOPPED");
      }
    }

    throw new Error(`Failed to stop time entry: ${error.message}`);
  }

  if (!data) {
    throw new Error("No data returned from time entry update");
  }

  return data;
}

/**
 * Update an existing time entry (only stopped entries can be updated)
 * @param supabase - Authenticated Supabase client
 * @param command - Update time entry command with user_id, time_entry_id, and optional fields
 * @returns TimeEntryResponseDto with the updated time entry data
 * @throws Error if time entry doesn't exist, is active, or update fails
 */
export async function updateTimeEntry(
  supabase: SupabaseClient,
  command: UpdateTimeEntryCommand
): Promise<TimeEntryResponseDto> {
  // Build update object with only provided fields
  const updateData: { start_time?: string; end_time?: string } = {};
  if (command.start_time !== undefined) {
    updateData.start_time = command.start_time;
  }
  if (command.end_time !== undefined) {
    updateData.end_time = command.end_time;
  }

  // Try to update the time entry - only if it's stopped (end_time IS NOT NULL)
  const { data, error } = await supabase
    .from("time_entries")
    .update(updateData)
    .eq("id", command.time_entry_id)
    .eq("user_id", command.user_id)
    .not("end_time", "is", null)
    .select("id, task_id, start_time, end_time")
    .single();

  if (error) {
    // PGRST116 means no rows were updated
    if (error.code === "PGRST116") {
      // Check if entry exists to differentiate between 404 and 409
      const { data: existingEntry } = await supabase
        .from("time_entries")
        .select("id, end_time")
        .eq("id", command.time_entry_id)
        .eq("user_id", command.user_id)
        .single();

      if (!existingEntry) {
        throw new Error("TIME_ENTRY_NOT_FOUND");
      }

      if (existingEntry.end_time === null) {
        throw new Error("TIME_ENTRY_IS_ACTIVE");
      }
    }

    throw new Error(`Failed to update time entry: ${error.message}`);
  }

  if (!data) {
    throw new Error("No data returned from time entry update");
  }

  return data;
}
