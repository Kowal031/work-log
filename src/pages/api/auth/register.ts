import type { APIRoute } from "astro";
import { z } from "zod";
import type { ErrorResponseDto, ValidationErrorDto } from "../../../types";

export const prerender = false;

const registerSchema = z
  .object({
    email: z.string().email("Nieprawidłowy format adresu email"),
    password: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są zgodne",
    path: ["confirmPassword"],
  });

/**
 * POST /api/auth/register
 * Register a new user with email and password
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
    validatedData = registerSchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Registration validation error:", error.errors);
      const validationError: ValidationErrorDto = {
        error: "ValidationError",
        message: "Invalid registration data format",
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

  // Step 3: Attempt to sign up with Supabase
  const { data, error } = await locals.supabase.auth.signUp({
    email: validatedData.email,
    password: validatedData.password,
  });

  if (error) {
    console.error("Supabase registration error:", error);

    // Check for common registration errors
    let errorMessage = "Wystąpił błąd podczas rejestracji";

    if (error.message.includes("already registered")) {
      errorMessage = "Użytkownik z tym adresem email już istnieje";
    } else if (error.message.includes("email")) {
      errorMessage = "Nieprawidłowy adres email";
    } else if (error.message.includes("password")) {
      errorMessage = "Hasło nie spełnia wymagań bezpieczeństwa";
    }

    const errorResponse: ErrorResponseDto = {
      error: "RegistrationFailed",
      message: errorMessage,
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Step 4: Sign out immediately to prevent automatic login
  await locals.supabase.auth.signOut();

  // Step 5: Return success response
  return new Response(
    JSON.stringify({
      success: true,
      message: "Konto zostało utworzone pomyślnie",
      redirectUrl: "/login",
      user: {
        id: data.user?.id,
        email: data.user?.email,
      },
    }),
    {
      status: 201,
      headers: { "Content-Type": "application/json" },
    }
  );
};
