import { updateTimeEntry } from "@/lib/services/time-entry.service";
import { updateTimeEntrySchema } from "@/lib/validation/time-entry.validation";
import type { ErrorResponseDto, TimeEntryResponseDto, UpdateTimeEntryCommand } from "@/types";
import type { APIRoute } from "astro";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import { DailyCapacityExceededError } from "@/lib/errors/time-entry.errors";

import { ZodError } from "zod";

export const prerender = false;

/**
 * PATCH /api/tasks/{taskId}/time-entries/{timeEntryId}
 * Update an existing time entry (only stopped entries can be edited)
 */
export const PATCH: APIRoute = async ({ params, request, locals }) => {
  // Step 1: Extract and validate parameters from path
  const { taskId, timeEntryId } = params;

  if (!taskId || !timeEntryId) {
    const errorResponse: ErrorResponseDto = {
      error: "BadRequest",
      message: "Task ID and time entry ID are required",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Validate UUID format for both parameters
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(taskId) || !uuidRegex.test(timeEntryId)) {
    const errorResponse: ErrorResponseDto = {
      error: "BadRequest",
      message: "Invalid task ID or time entry ID format. Must be valid UUIDs.",
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
      message: "Authentication required to update time entries",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Step 3: Parse and validate request body
  let body;
  try {
    body = await request.json();
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
  let validatedData;
  try {
    validatedData = updateTimeEntrySchema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      const errorResponse: ErrorResponseDto = {
        error: "ValidationError",
        message: "Request validation failed",
        details: {
          errors: error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const errorResponse: ErrorResponseDto = {
      error: "BadRequest",
      message: "Invalid request data",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Step 4: Validate end_time > start_time if both provided
  if (validatedData.start_time && validatedData.end_time) {
    const startTime = new Date(validatedData.start_time);
    const endTime = new Date(validatedData.end_time);

    if (endTime <= startTime) {
      const errorResponse: ErrorResponseDto = {
        error: "BadRequest",
        message: "End time must be after start time",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // Step 5: Create command object
  const command: UpdateTimeEntryCommand = {
    user_id: user.id,
    task_id: taskId,
    time_entry_id: timeEntryId,
    start_time: validatedData.start_time,
    end_time: validatedData.end_time,
    timezone_offset: validatedData.timezone_offset,
  };

  // Step 6: Call service layer to update the time entry
  try {
    const timeEntry: TimeEntryResponseDto = await updateTimeEntry(locals.supabase, command);

    // Step 7: Return success response
    return new Response(JSON.stringify(timeEntry), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Handle specific business logic errors
    if (error instanceof DailyCapacityExceededError) {
      const errorResponse: ErrorResponseDto = {
        error: "DailyCapacityExceeded",
        message: error.message,
        details: {
          day: error.day,
          existing_duration_formatted: error.existingFormatted,
          new_duration_formatted: error.newFormatted,
          total_duration_formatted: error.totalFormatted,
          limit: "24:00:00",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (error instanceof Error) {
      if (error.message === "TIME_ENTRY_NOT_FOUND") {
        const errorResponse: ErrorResponseDto = {
          error: "NotFound",
          message: "Time entry not found or you don't have permission to update it",
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (error.message === "TIME_ENTRY_IS_ACTIVE") {
        const errorResponse: ErrorResponseDto = {
          error: "Conflict",
          message: "Cannot update active time entry. Please stop it first.",
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 409,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Check for database constraint errors
      if (error.message.includes("constraint")) {
        const errorResponse: ErrorResponseDto = {
          error: "BadRequest",
          message: "Time entry data violates database constraints",
          details: { error: error.message },
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Generic server error
    const errorResponse: ErrorResponseDto = {
      error: "InternalServerError",
      message: "An unexpected error occurred while updating the time entry",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * DELETE /api/tasks/{taskId}/time-entries/{timeEntryId}
 * Delete a time entry (discard without saving end_time)
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  // Step 1: Extract and validate parameters from path
  const { taskId, timeEntryId } = params;

  if (!taskId || !timeEntryId) {
    const errorResponse: ErrorResponseDto = {
      error: "BadRequest",
      message: "Task ID and time entry ID are required",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Validate UUID format for both parameters
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(taskId) || !uuidRegex.test(timeEntryId)) {
    const errorResponse: ErrorResponseDto = {
      error: "BadRequest",
      message: "Invalid task ID or time entry ID format. Must be valid UUIDs.",
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
      message: "Authentication required to delete time entries",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Step 3: Verify the time entry belongs to the user and task
  const { data: timeEntry, error: fetchError } = await (locals.supabase as SupabaseClient<Database>)
    .from("time_entries")
    .select("*")
    .eq("id", timeEntryId)
    .eq("task_id", taskId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !timeEntry) {
    const errorResponse: ErrorResponseDto = {
      error: "NotFound",
      message: "Time entry not found or you don't have permission to delete it",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Step 4: Delete the time entry
  const { error: deleteError } = await (locals.supabase as SupabaseClient<Database>)
    .from("time_entries")
    .delete()
    .eq("id", timeEntryId)
    .eq("user_id", user.id);

  if (deleteError) {
    const errorResponse: ErrorResponseDto = {
      error: "InternalServerError",
      message: "Failed to delete time entry",
      details: { error: deleteError.message },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Step 5: Return success response with no content
  return new Response(null, {
    status: 204,
  });
};
