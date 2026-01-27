import type { ErrorResponseDto, TimeEntryResponseDto, CreateTimeEntryRequestDto } from "@/types";
import type { APIRoute } from "astro";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import { createTimeEntrySchema } from "@/lib/validation/time-entry.validation";
import { createTimeEntry } from "@/lib/services/time-entry.service";
import { ZodError } from "zod";

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

/**
 * POST /api/tasks/{taskId}/time-entries
 * Create a new time entry manually with start and end times
 */
export const POST: APIRoute = async ({ params, locals, request }) => {
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
      message: "Authentication required to create time entry",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Step 3: Parse and validate request body
  let requestBody: CreateTimeEntryRequestDto;
  try {
    requestBody = await request.json();
  } catch {
    const errorResponse: ErrorResponseDto = {
      error: "BadRequest",
      message: "Invalid JSON in request body",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Validate with Zod schema
  try {
    createTimeEntrySchema.parse(requestBody);
  } catch (err) {
    if (err instanceof ZodError) {
      const errorResponse: ErrorResponseDto = {
        error: "ValidationError",
        message: "Request body validation failed",
        details: {
          errors: err.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    throw err;
  }

  // Step 4: Business logic validation
  const startTime = new Date(requestBody.start_time);
  const endTime = new Date(requestBody.end_time);
  const now = new Date();

  // Validate end_time > start_time
  if (endTime <= startTime) {
    const errorResponse: ErrorResponseDto = {
      error: "BadRequest",
      message: "end_time must be after start_time",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Validate times are not in the future
  if (startTime > now || endTime > now) {
    const errorResponse: ErrorResponseDto = {
      error: "BadRequest",
      message: "Times cannot be in the future",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Step 5: Verify task belongs to user
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

  // Step 6: Create time entry via service
  try {
    const timeEntry = await createTimeEntry(locals.supabase as SupabaseClient<Database>, {
      user_id: user.id,
      task_id: taskId,
      start_time: requestBody.start_time,
      end_time: requestBody.end_time,
    });

    // Step 7: Return created time entry with Location header
    return new Response(JSON.stringify(timeEntry), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
        Location: `/api/tasks/${taskId}/time-entries/${timeEntry.id}`,
      },
    });
  } catch (err) {
    console.error("Error creating time entry:", err);
    const errorResponse: ErrorResponseDto = {
      error: "InternalServerError",
      message: "An unexpected error occurred while creating time entry",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
