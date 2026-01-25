import type { SupabaseClient } from "@supabase/supabase-js";

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
