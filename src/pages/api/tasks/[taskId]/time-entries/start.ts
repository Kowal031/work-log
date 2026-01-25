import type { APIRoute } from "astro";
import { startTimeEntry, getActiveTimer } from "../../../../../lib/services/time-entry.service";
import { taskExists } from "../../../../../lib/services/task.service";
import type { StartTimeEntryCommand, TimeEntryResponseDto, ErrorResponseDto } from "../../../../../types";

export const prerender = false;

/**
 * POST /api/tasks/{taskId}/time-entries/start
 * Start a new time entry for a task
 */
export const POST: APIRoute = async ({ params, locals }) => {
  // Step 1: Extract and validate taskId from params
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
    console.error("Authentication error:", authError);
    const errorResponse: ErrorResponseDto = {
      error: "Unauthorized",
      message: "Authentication required to start timer",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Step 3: Check if task exists and belongs to user
  try {
    const exists = await taskExists(locals.supabase, taskId, user.id);
    if (!exists) {
      const errorResponse: ErrorResponseDto = {
        error: "NotFound",
        message: "Task not found or you don't have permission to track time for it",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Error checking task existence:", error);
    const errorResponse: ErrorResponseDto = {
      error: "InternalServerError",
      message: "An unexpected error occurred while checking task",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Step 4: Check if user already has an active timer
  try {
    const activeTimer = await getActiveTimer(locals.supabase, user.id);
    if (activeTimer) {
      const errorResponse: ErrorResponseDto = {
        error: "Conflict",
        message: "You already have an active timer running. Please stop it before starting a new one.",
        details: {
          active_timer_id: activeTimer.id,
          active_task_id: activeTimer.task_id,
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Error checking active timer:", error);
    const errorResponse: ErrorResponseDto = {
      error: "InternalServerError",
      message: "An unexpected error occurred while checking active timer",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Step 5: Create command object with current timestamp
  const command: StartTimeEntryCommand = {
    user_id: user.id,
    task_id: taskId,
    start_time: new Date().toISOString(),
  };

  // Step 6: Call service layer
  try {
    const timeEntry: TimeEntryResponseDto = await startTimeEntry(locals.supabase, command);

    // Step 7: Return success response
    return new Response(JSON.stringify(timeEntry), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
        Location: `/api/tasks/${taskId}/time-entries/${timeEntry.id}`,
      },
    });
  } catch (error) {
    console.error("Error starting time entry:", error);

    // Handle specific database errors
    if (error instanceof Error) {
      // Check for unique constraint violation (should be caught by app logic, but safety net)
      if (error.message.includes("duplicate") || error.message.includes("unique")) {
        const errorResponse: ErrorResponseDto = {
          error: "Conflict",
          message: "You already have an active timer running",
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 409,
          headers: { "Content-Type": "application/json" },
        });
      }

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
      message: "An unexpected error occurred while starting the timer",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
