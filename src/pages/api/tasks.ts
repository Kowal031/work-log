import type { APIRoute } from "astro";
import { z } from "zod";
import { createTaskSchema } from "../../lib/validation/task.validation";
import { createTask } from "../../lib/services/task.service";
import type { CreateTaskCommand, TaskResponseDto, ErrorResponseDto, ValidationErrorDto } from "../../types";

export const prerender = false;

/**
 * POST /api/tasks
 * Create a new task for the authenticated user
 */
export const POST: APIRoute = async ({ request, locals }) => {
  // Step 0: Verify HTTP method
  if (request.method !== "POST") {
    const errorResponse: ErrorResponseDto = {
      error: "MethodNotAllowed",
      message: "Only POST method is allowed for this endpoint",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 405,
      headers: {
        "Content-Type": "application/json",
        Allow: "POST",
      },
    });
  }
  // Step 1: Check authentication
  const {
    data: { user },
    error: authError,
  } = await locals.supabase.auth.getUser();

  if (authError || !user) {
    console.error("Authentication error:", authError);
    const errorResponse: ErrorResponseDto = {
      error: "Unauthorized",
      message: "Authentication required to create tasks",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Step 2: Parse request body
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

  // Step 3: Validate request body
  let validatedData: z.infer<typeof createTaskSchema>;
  try {
    validatedData = createTaskSchema.parse(requestBody);
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

  // Step 4: Create command object
  const command: CreateTaskCommand = {
    user_id: user.id,
    name: validatedData.name,
    description: validatedData.description,
  };

  // Step 5: Call service layer
  try {
    const task: TaskResponseDto = await createTask(locals.supabase, command);

    // Step 6: Return success response
    return new Response(JSON.stringify(task), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
        Location: `/api/tasks/${task.id}`,
      },
    });
  } catch (error) {
    console.error("Error creating task:", error);

    // Handle specific database errors
    if (error instanceof Error) {
      // Check for specific error patterns
      if (error.message.includes("duplicate key")) {
        const errorResponse: ErrorResponseDto = {
          error: "Conflict",
          message: "A task with this name already exists",
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 409,
          headers: { "Content-Type": "application/json" },
        });
      }

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
      message: "An unexpected error occurred while creating the task",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
