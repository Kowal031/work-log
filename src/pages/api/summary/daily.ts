import type { APIRoute } from "astro";
import { getDailySummary } from "../../../lib/services/summary.service";
import { dailySummaryQuerySchema } from "../../../lib/validation/summary.validation";
import { startOfDay, endOfDay, getTodayDateString } from "../../../lib/utils/date.utils";
import type { DailySummaryResponseDto, ErrorResponseDto } from "../../../types";
import { ZodError } from "zod";

export const prerender = false;

/**
 * GET /api/summary/daily
 * Get daily summary of work time grouped by tasks
 */
export const GET: APIRoute = async ({ url, locals }) => {
  // Step 1: Check authentication
  const {
    data: { user },
    error: authError,
  } = await locals.supabase.auth.getUser();

  if (authError || !user) {
    const errorResponse: ErrorResponseDto = {
      error: "Unauthorized",
      message: "Authentication required to view summary",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Step 2: Extract and validate query parameters
  const queryParams = {
    date_from: url.searchParams.get("date_from") || undefined,
    date_to: url.searchParams.get("date_to") || undefined,
    timezone_offset: url.searchParams.get("timezone_offset") || undefined,
  };

  // Validate with Zod schema
  let validatedQuery;
  try {
    validatedQuery = dailySummaryQuerySchema.parse(queryParams);
  } catch (error) {
    if (error instanceof ZodError) {
      const errorResponse: ErrorResponseDto = {
        error: "ValidationError",
        message: "Query validation failed",
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
      message: "Invalid query parameters",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Step 3: Set defaults (today) if not provided
  const todayStr = getTodayDateString();
  const dateFromStr = validatedQuery.date_from || todayStr;
  const dateToStr = validatedQuery.date_to || todayStr;

  // Step 4: Convert to ISO timestamps (start/end of day)
  const dateFrom = startOfDay(dateFromStr);
  const dateTo = endOfDay(dateToStr);

  // Step 5: Validate date_from <= date_to
  if (new Date(dateFrom) > new Date(dateTo)) {
    const errorResponse: ErrorResponseDto = {
      error: "BadRequest",
      message: "date_from must be before or equal to date_to",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Step 6: Call service to get summary
  try {
    const summary: DailySummaryResponseDto = await getDailySummary(
      locals.supabase,
      user.id,
      dateFrom,
      dateTo,
      validatedQuery.timezone_offset
    );

    // Step 7: Return success response
    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch {
    // Generic server error
    const errorResponse: ErrorResponseDto = {
      error: "InternalServerError",
      message: "An unexpected error occurred while generating summary",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
