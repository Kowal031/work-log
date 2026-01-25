import type { APIRoute } from "astro";
import { getActiveTimer } from "../../../lib/services/time-entry.service";
import type { ErrorResponseDto } from "../../../types";

export const prerender = false;

/**
 * GET /api/tasks/active-timer
 * Check if user has an active timer running
 */
export const GET: APIRoute = async ({ locals }) => {
  // Step 1: Check authentication
  const {
    data: { user },
    error: authError,
  } = await locals.supabase.auth.getUser();

  if (authError || !user) {
    const errorResponse: ErrorResponseDto = {
      error: "Unauthorized",
      message: "Authentication required to check active timer",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Step 2: Get active timer from service
  try {
    const activeTimer = await getActiveTimer(locals.supabase, user.id);

    // Step 3: Handle no active timer (404)
    if (!activeTimer) {
      const errorResponse: ErrorResponseDto = {
        error: "NotFound",
        message: "No active timer found",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 4: Return active timer data (200)
    return new Response(JSON.stringify(activeTimer), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch {
    // Generic server error
    const errorResponse: ErrorResponseDto = {
      error: "InternalServerError",
      message: "An unexpected error occurred while checking active timer",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
