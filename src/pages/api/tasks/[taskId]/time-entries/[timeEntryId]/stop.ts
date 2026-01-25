import { stopTimeEntry } from "@/lib/services/time-entry.service";
import type { ErrorResponseDto, StopTimeEntryCommand, TimeEntryResponseDto } from "@/types";
import type { APIRoute } from "astro";

export const prerender = false;

/**
 * POST /api/tasks/{taskId}/time-entries/{timeEntryId}/stop
 * Stop an active time entry
 */
export const POST: APIRoute = async ({ params, locals }) => {
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
    console.error("Authentication error:", authError);
    const errorResponse: ErrorResponseDto = {
      error: "Unauthorized",
      message: "Authentication required to stop timer",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Step 3: Create command object with current timestamp
  const command: StopTimeEntryCommand = {
    user_id: user.id,
    task_id: taskId,
    time_entry_id: timeEntryId,
    end_time: new Date().toISOString(),
  };

  // Step 4: Call service layer to stop the timer
  try {
    const timeEntry: TimeEntryResponseDto = await stopTimeEntry(locals.supabase, command);

    // Step 5: Return success response
    return new Response(JSON.stringify(timeEntry), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error stopping time entry:", error);

    // Handle specific business logic errors
    if (error instanceof Error) {
      if (error.message === "TIME_ENTRY_NOT_FOUND") {
        const errorResponse: ErrorResponseDto = {
          error: "NotFound",
          message: "Time entry not found or you don't have permission to stop it",
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (error.message === "TIME_ENTRY_ALREADY_STOPPED") {
        const errorResponse: ErrorResponseDto = {
          error: "Conflict",
          message: "Time entry is already stopped",
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
      message: "An unexpected error occurred while stopping the timer",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
