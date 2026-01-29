import { http, HttpResponse } from "msw";

// Example mock handlers for API endpoints
export const handlers = [
  // Example: Mock GET /api/tasks
  http.get("/api/tasks", () => {
    return HttpResponse.json([
      {
        id: "1",
        name: "Test Task",
        description: "Test Description",
        status: "active",
        user_id: "test-user-id",
        created_at: new Date().toISOString(),
      },
    ]);
  }),

  // Example: Mock POST /api/auth/login
  http.post("/api/auth/login", async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      user: {
        id: "test-user-id",
        email: body.email,
      },
    });
  }),
];
