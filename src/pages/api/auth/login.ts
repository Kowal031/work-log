import type { APIRoute } from "astro";
import { z } from "zod";
import type { ErrorResponseDto, ValidationErrorDto } from "../../../types";

export const prerender = false;

const loginSchema = z.object({
  email: z.string().email("Nieprawidłowy format adresu email"),
  password: z.string().min(1, "Hasło jest wymagane"),
});

/**
 * POST /api/auth/login
 * Authenticate user with email and password
 */
export const POST: APIRoute = async ({ request, locals }) => {
  // Step 1: Parse request body
  let body;
  try {
    body = await request.json();
  } catch {
    const errorResponse: ErrorResponseDto = {
      error: "InvalidRequest",
      message: "Invalid JSON in request body",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Step 2: Validate input
  let validatedData;
  try {
    validatedData = loginSchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Login validation error:", error.errors);
      const validationError: ValidationErrorDto = {
        error: "ValidationError",
        message: "Invalid login credentials format",
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

  // Step 3: Attempt to sign in with Supabase
  const { error } = await locals.supabase.auth.signInWithPassword({
    email: validatedData.email,
    password: validatedData.password,
  });

  if (error) {
    console.error("Supabase auth error:", error);
    const errorResponse: ErrorResponseDto = {
      error: "AuthenticationFailed",
      message: "Nieprawidłowy email lub hasło",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Step 4: Return success response with redirect URL
  return new Response(
    JSON.stringify({
      success: true,
      redirectUrl: "/",
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
};
