import type { APIRoute } from "astro";
import { z } from "zod";
import type { ErrorResponseDto, ValidationErrorDto } from "../../../types";

export const prerender = false;

const passwordRecoverySchema = z.object({
  email: z.string().email("Nieprawidłowy format adresu email"),
});

/**
 * POST /api/auth/password-recovery
 * Send password recovery email with reset link
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
    validatedData = passwordRecoverySchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Password recovery validation error:", error.errors);
      const validationError: ValidationErrorDto = {
        error: "ValidationError",
        message: "Invalid email format",
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

  // Step 3: Send password recovery email via Supabase
  const { error } = await locals.supabase.auth.resetPasswordForEmail(validatedData.email, {
    redirectTo: `${new URL(request.url).origin}/update-password`,
  });

  if (error) {
    console.error("Supabase password recovery error:", error);

    // For security reasons, we don't expose if the email exists or not
    // Return success anyway to prevent email enumeration attacks
  }

  // Step 4: Always return success response (security best practice)
  return new Response(
    JSON.stringify({
      success: true,
      message: "Jeśli konto o podanym adresie email istnieje, wysłaliśmy link do resetowania hasła",
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
};
