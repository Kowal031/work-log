import type { APIRoute } from "astro";
import { z } from "zod";
import type { ErrorResponseDto, ValidationErrorDto } from "../../../types";

export const prerender = false;

const updatePasswordSchema = z
  .object({
    password: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są zgodne",
    path: ["confirmPassword"],
  });

/**
 * POST /api/auth/update-password
 * Update user password using Supabase session from recovery link
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
    validatedData = updatePasswordSchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Update password validation error:", error.errors);
      const validationError: ValidationErrorDto = {
        error: "ValidationError",
        message: "Invalid password format",
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

  // Step 3: Check if user is authenticated (from recovery link session)
  const {
    data: { user },
  } = await locals.supabase.auth.getUser();

  if (!user) {
    const errorResponse: ErrorResponseDto = {
      error: "Unauthorized",
      message: "Brak sesji użytkownika. Link może być nieprawidłowy lub wygasły.",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Step 4: Update password in Supabase
  const { error } = await locals.supabase.auth.updateUser({
    password: validatedData.password,
  });

  if (error) {
    console.error("Supabase update password error:", error);

    let errorMessage = "Wystąpił błąd podczas zmiany hasła";

    if (error.message.includes("same")) {
      errorMessage = "Nowe hasło nie może być takie samo jak poprzednie";
    } else if (error.message.includes("weak")) {
      errorMessage = "Hasło jest zbyt słabe";
    }

    const errorResponse: ErrorResponseDto = {
      error: "UpdatePasswordFailed",
      message: errorMessage,
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Step 5: Return success response
  return new Response(
    JSON.stringify({
      success: true,
      message: "Hasło zostało pomyślnie zmienione",
      redirectUrl: "/login",
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
};
