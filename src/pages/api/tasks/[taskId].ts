import type { APIRoute } from "astro";
import { z } from "zod";
import { updateTaskSchema } from "../../../lib/validation/task.validation";
import { updateTask } from "../../../lib/services/task.service";
import { hasActiveTimer } from "../../../lib/services/time-entry.service";
import type { UpdateTaskCommand, TaskResponseDto, ErrorResponseDto, ValidationErrorDto } from "../../../types";

export const prerender = false;

/**
 * PATCH /api/tasks/{taskId}
 * Update an existing task for the authenticated user
 */
export const PATCH: APIRoute = async ({ params, request, locals }) => {
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
      message: "Authentication required to update tasks",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Step 3: Parse request body
  let requestBody: unknown;
  try {
    requestBody = await request.json();
  } catch (error) {
    console.error("JSON parsing error:", error);
    const errorResponse: ErrorResponseDto = {
      error: "BadRequest",
      message: "Invalid JSON in request body",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Check if body is empty or has no fields
  if (!requestBody || typeof requestBody !== "object" || Object.keys(requestBody).length === 0) {
    const errorResponse: ErrorResponseDto = {
      error: "BadRequest",
      message: "At least one field must be provided for update",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Step 4: Validate request body
  let validatedData: z.infer<typeof updateTaskSchema>;
  try {
    validatedData = updateTaskSchema.parse(requestBody);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.errors);
      const validationError: ValidationErrorDto = {
        error: "ValidationError",
        message: "Request validation failed",
        details: error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      };
      return new Response(JSON.stringify(validationError), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Unexpected validation error
    console.error("Unexpected validation error:", error);
    const errorResponse: ErrorResponseDto = {
      error: "InternalServerError",
      message: "An unexpected error occurred during validation",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Step 5: Check if task has active timer
  try {
    const hasTimer = await hasActiveTimer(locals.supabase, taskId);
    if (hasTimer) {
      const errorResponse: ErrorResponseDto = {
        error: "Forbidden",
        message: "Cannot update task with active timer. Please stop the timer first.",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 403,
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

  // Step 6: Create command object
  const command: UpdateTaskCommand = {
    user_id: user.id,
    task_id: taskId,
    name: validatedData.name,
    description: validatedData.description,
    status: validatedData.status,
  };

  // Step 7: Call service layer
  try {
    const task: TaskResponseDto = await updateTask(locals.supabase, command);

    // Step 8: Return success response
    return new Response(JSON.stringify(task), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating task:", error);

    // Check if task was not found
    if (error instanceof Error && error.message.includes("not found")) {
      const errorResponse: ErrorResponseDto = {
        error: "NotFound",
        message: "Task not found or you don't have permission to update it",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes("constraint")) {
        const errorResponse: ErrorResponseDto = {
          error: "BadRequest",
          message: "Task data violates database constraints",
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
      message: "An unexpected error occurred while updating the task",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
