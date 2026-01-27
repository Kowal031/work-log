import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  StartTimeEntryCommand,
  StopTimeEntryCommand,
  TimeEntryResponseDto,
  UpdateTimeEntryCommand,
  CreateTimeEntryCommand,
} from "../../types";
import { DailyCapacityExceededError } from "../errors/time-entry.errors";

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
 * @param command - Stop time entry command with user_id, time_entry_id, end_time, and timezone_offset
 * @returns TimeEntryResponseDto with the updated time entry data
 * @throws Error if time entry doesn't exist, already stopped, or update fails
 * @throws DailyCapacityExceededError if stopping the timer would exceed 24h limit for any day
 */
export async function stopTimeEntry(
  supabase: SupabaseClient,
  command: StopTimeEntryCommand
): Promise<TimeEntryResponseDto> {
  // Get the current entry to check start_time
  const { data: currentEntry, error: fetchError } = await supabase
    .from("time_entries")
    .select("start_time")
    .eq("id", command.time_entry_id)
    .eq("user_id", command.user_id)
    .is("end_time", null)
    .single();

  if (fetchError) {
    // PGRST116 means no rows found
    if (fetchError.code === "PGRST116") {
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

    throw new Error(`Failed to fetch time entry: ${fetchError.message}`);
  }

  if (!currentEntry) {
    throw new Error("TIME_ENTRY_NOT_FOUND");
  }

  // Split the entry into daily entries (if crosses midnight)
  const splitEntries = splitTimeEntryIntoDays(currentEntry.start_time, command.end_time, command.timezone_offset);

  // Validate daily capacity for all affected days
  await validateDailyTimeCapacity(
    supabase,
    command.user_id,
    splitEntries,
    command.timezone_offset,
    command.time_entry_id // Exclude current entry from validation
  );

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

  // If both start_time and end_time are provided, validate daily capacity
  // We need to get the timezone offset from the command (it should be added to UpdateTimeEntryCommand)
  // For now, we'll fetch the existing entry to get current values
  const { data: existingEntry, error: fetchError } = await supabase
    .from("time_entries")
    .select("start_time, end_time")
    .eq("id", command.time_entry_id)
    .eq("user_id", command.user_id)
    .not("end_time", "is", null)
    .single();

  if (fetchError) {
    if (fetchError.code === "PGRST116") {
      // Check if entry exists to differentiate between 404 and 409
      const { data: checkEntry } = await supabase
        .from("time_entries")
        .select("id, end_time")
        .eq("id", command.time_entry_id)
        .eq("user_id", command.user_id)
        .single();

      if (!checkEntry) {
        throw new Error("TIME_ENTRY_NOT_FOUND");
      }

      if (checkEntry.end_time === null) {
        throw new Error("TIME_ENTRY_IS_ACTIVE");
      }
    }

    throw new Error(`Failed to fetch time entry: ${fetchError.message}`);
  }

  if (!existingEntry) {
    throw new Error("TIME_ENTRY_NOT_FOUND");
  }

  // Determine final start_time and end_time (use updated values or fall back to existing)
  const finalStartTime = command.start_time ?? existingEntry.start_time!;
  const finalEndTime = command.end_time ?? existingEntry.end_time!;

  // If we have timezone_offset in command, validate capacity
  // Note: UpdateTimeEntryCommand needs to be extended with timezone_offset
  if (command.timezone_offset !== undefined) {
    await validateDailyTimeCapacity(
      supabase,
      command.user_id,
      [{ start_time: finalStartTime, end_time: finalEndTime }],
      command.timezone_offset,
      command.time_entry_id // Exclude this entry from existing calculations
    );
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

/**
 * Split a time entry into daily chunks based on user's local timezone
 * @param startTime - ISO 8601 start time (UTC)
 * @param endTime - ISO 8601 end time (UTC)
 * @param timezoneOffsetMinutes - Timezone offset in minutes from UTC
 * @returns Array of time entry chunks, one per day
 */
function splitTimeEntryIntoDays(
  startTime: string,
  endTime: string,
  timezoneOffsetMinutes: number
): { start_time: string; end_time: string }[] {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const chunks: { start_time: string; end_time: string }[] = [];
  let currentStart = new Date(start);

  while (currentStart < end) {
    // Calculate midnight in user's timezone for the current UTC time
    // Step 1: Get UTC timestamp
    const utcTimestamp = currentStart.getTime();

    // Step 2: Calculate what local time this represents
    const localTimestamp = utcTimestamp + timezoneOffsetMinutes * 60 * 1000;
    const localDate = new Date(localTimestamp);

    // Step 3: Get end of local day (23:59:59.999)
    const localYear = localDate.getUTCFullYear();
    const localMonth = localDate.getUTCMonth();
    const localDay = localDate.getUTCDate();
    const endOfLocalDayTimestamp = Date.UTC(localYear, localMonth, localDay, 23, 59, 59, 999);

    // Step 4: Convert back to UTC
    const endOfDayUTC = new Date(endOfLocalDayTimestamp - timezoneOffsetMinutes * 60 * 1000);

    // If session ends before end of day, use actual end time
    const chunkEnd = end <= endOfDayUTC ? end : endOfDayUTC;

    chunks.push({
      start_time: currentStart.toISOString(),
      end_time: chunkEnd.toISOString(),
    });

    // Move to start of next local day
    const nextLocalDayTimestamp = Date.UTC(localYear, localMonth, localDay + 1, 0, 0, 0, 0);
    currentStart = new Date(nextLocalDayTimestamp - timezoneOffsetMinutes * 60 * 1000);
  }

  return chunks;
}

/**
 * Create a new time entry manually with start and end times
 * If the session spans multiple days, it will be automatically split into separate entries for each day
 * @param supabase - Authenticated Supabase client
 * @param command - Create time entry command with user_id, task_id, start_time, and end_time
 * @returns Array of TimeEntryResponseDto with the created time entry data (one or multiple entries)
 * @throws Error if time entry creation fails
 */
export async function createTimeEntry(
  supabase: SupabaseClient,
  command: CreateTimeEntryCommand
): Promise<TimeEntryResponseDto[]> {
  // Split session into daily chunks based on user's local timezone
  const chunks = splitTimeEntryIntoDays(command.start_time, command.end_time, command.timezone_offset);

  // Validate daily time capacity before inserting
  await validateDailyTimeCapacity(supabase, command.user_id, chunks, command.timezone_offset);

  // Insert all chunks
  const results: TimeEntryResponseDto[] = [];

  for (const chunk of chunks) {
    const { data, error } = await supabase
      .from("time_entries")
      .insert({
        user_id: command.user_id,
        task_id: command.task_id,
        start_time: chunk.start_time,
        end_time: chunk.end_time,
      })
      .select("id, task_id, start_time, end_time")
      .single();

    if (error) {
      throw new Error(`Failed to create time entry: ${error.message}`);
    }

    if (!data) {
      throw new Error("No data returned from time entry creation");
    }

    results.push(data);
  }

  return results;
}

/**
 * Helper function to calculate how much time from new entries falls within a specific local day
 * @param newEntries - Array of time entries to check
 * @param targetDay - Target day in YYYY-MM-DD format (local timezone)
 * @param timezoneOffsetMinutes - Timezone offset in minutes from UTC
 * @returns Total seconds that fall within the target day
 */
function sumNewEntriesForDay(
  newEntries: { start_time: string; end_time: string }[],
  targetDay: string,
  timezoneOffsetMinutes: number
): number {
  let totalSeconds = 0;

  // Parse target day to get local start and end timestamps
  const [year, month, day] = targetDay.split("-").map(Number);
  const localDayStart = Date.UTC(year, month - 1, day, 0, 0, 0, 0);
  const localDayEnd = Date.UTC(year, month - 1, day, 23, 59, 59, 999);

  // Convert local day boundaries to UTC
  const utcDayStart = localDayStart - timezoneOffsetMinutes * 60 * 1000;
  const utcDayEnd = localDayEnd - timezoneOffsetMinutes * 60 * 1000;

  for (const entry of newEntries) {
    const entryStart = new Date(entry.start_time).getTime();
    const entryEnd = new Date(entry.end_time).getTime();

    // Find intersection between entry and target day
    const intersectionStart = Math.max(entryStart, utcDayStart);
    const intersectionEnd = Math.min(entryEnd, utcDayEnd);

    // If there's an intersection, add the duration
    if (intersectionStart < intersectionEnd) {
      const durationMs = intersectionEnd - intersectionStart;
      totalSeconds += Math.floor(durationMs / 1000);
    }
  }

  return totalSeconds;
}

/**
 * Validate that adding new time entries won't exceed 24-hour daily capacity
 * @param supabase - Authenticated Supabase client
 * @param userId - User ID
 * @param newEntries - Array of new time entries to validate
 * @param timezoneOffsetMinutes - Timezone offset in minutes from UTC
 * @param excludeEntryId - Optional entry ID to exclude (for updates)
 * @throws DailyCapacityExceededError if adding entries would exceed 24h limit for any day
 */
async function validateDailyTimeCapacity(
  supabase: SupabaseClient,
  userId: string,
  newEntries: { start_time: string; end_time: string }[],
  timezoneOffsetMinutes: number,
  excludeEntryId?: string
): Promise<void> {
  // Extract unique days from new entries (in user's local timezone)
  const affectedDays = new Set<string>();

  for (const entry of newEntries) {
    const startUtc = new Date(entry.start_time);
    const endUtc = new Date(entry.end_time);

    // Convert to local timezone
    const startLocal = new Date(startUtc.getTime() + timezoneOffsetMinutes * 60 * 1000);
    const endLocal = new Date(endUtc.getTime() + timezoneOffsetMinutes * 60 * 1000);

    // Get YYYY-MM-DD for start and end
    const startDay = startLocal.toISOString().split("T")[0];
    const endDay = endLocal.toISOString().split("T")[0];

    affectedDays.add(startDay);
    if (startDay !== endDay) {
      affectedDays.add(endDay);
    }
  }

  // Check each affected day
  for (const day of affectedDays) {
    // Query to get existing time entries for this day
    // Use the same logic as get_daily_summary function
    const [year, month, dayNum] = day.split("-").map(Number);
    const localDayStart = new Date(Date.UTC(year, month - 1, dayNum, 0, 0, 0, 0));
    const localDayEnd = new Date(Date.UTC(year, month - 1, dayNum, 23, 59, 59, 999));

    // Convert to UTC
    const utcDayStart = new Date(localDayStart.getTime() - timezoneOffsetMinutes * 60 * 1000);
    const utcDayEnd = new Date(localDayEnd.getTime() - timezoneOffsetMinutes * 60 * 1000);

    // Build query
    let query = supabase
      .from("time_entries")
      .select("start_time, end_time")
      .eq("user_id", userId)
      .not("end_time", "is", null); // Only check completed entries

    // Exclude the entry being updated
    if (excludeEntryId) {
      query = query.neq("id", excludeEntryId);
    }

    // Filter for entries that touch this day
    // An entry touches the day if:
    // - It starts on or before the day ends AND
    // - It ends on or after the day starts
    query = query.lte("start_time", utcDayEnd.toISOString()).gte("end_time", utcDayStart.toISOString());

    const { data: existingEntries, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch existing time entries: ${error.message}`);
    }

    // Calculate existing time for this day
    let existingSeconds = 0;
    if (existingEntries) {
      existingSeconds = sumNewEntriesForDay(
        existingEntries.map((e) => ({ start_time: e.start_time!, end_time: e.end_time! })),
        day,
        timezoneOffsetMinutes
      );
    }

    // Calculate new time for this day
    const newSeconds = sumNewEntriesForDay(newEntries, day, timezoneOffsetMinutes);

    // Check if total exceeds 24h (86400 seconds)
    const totalSeconds = existingSeconds + newSeconds;
    if (totalSeconds > 86400) {
      throw new DailyCapacityExceededError(day, existingSeconds, newSeconds);
    }
  }
}
