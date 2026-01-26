import type { ErrorResponseDto, TimeEntryResponseDto } from "@/types";
import type { APIRoute } from "astro";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";

export const prerender = false;

/**
 * GET /api/tasks/{taskId}/time-entries
 * Get all time entries for a task
 */
export const GET: APIRoute = async ({ params, locals }) => {
  // Step 1: Extract and validate task ID from path
  const { taskId } = params;

  if (!taskId) {
    const errorResponse: ErrorResponseDto = {
      error: "BadRequest",
      message: "Task ID is required",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(taskId)) {
    const errorResponse: ErrorResponseDto = {
      error: "BadRequest",
      message: "Invalid task ID format. Must be a valid UUID.",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Step 2: Check authentication
  const {
    data: { user },
    error: authError,
  } = await locals.supabase.auth.getUser();

  if (authError || !user) {
    const errorResponse: ErrorResponseDto = {
      error: "Unauthorized",
      message: "Authentication required to access time entries",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Step 3: Verify task belongs to user
  const { data: task, error: taskError } = await (locals.supabase as SupabaseClient<Database>)
    .from("tasks")
    .select("id")
    .eq("id", taskId)
    .eq("user_id", user.id)
    .single();

  if (taskError || !task) {
    const errorResponse: ErrorResponseDto = {
      error: "NotFound",
      message: "Task not found or you don't have permission to access it",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Step 4: Fetch time entries for the task
  const { data: timeEntries, error: fetchError } = await (locals.supabase as SupabaseClient<Database>)
    .from("time_entries")
    .select("id, task_id, start_time, end_time")
    .eq("task_id", taskId)
    .eq("user_id", user.id)
    .order("start_time", { ascending: false });

  if (fetchError) {
    const errorResponse: ErrorResponseDto = {
      error: "InternalServerError",
      message: "Failed to fetch time entries",
      details: { error: fetchError.message },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Step 5: Return time entries
  const responseData: TimeEntryResponseDto[] = timeEntries || [];
  return new Response(JSON.stringify(responseData), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
