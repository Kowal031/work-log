import { z } from "zod";

/**
 * Validation schema for creating a new task
 * POST /api/tasks
 */
export const createTaskSchema = z.object({
  name: z.string().trim().min(1, "Task name is required").max(255, "Task name must not exceed 255 characters"),
  description: z.string().max(5000, "Task description must not exceed 5000 characters").optional(),
});

/**
 * Validation schema for updating an existing task
 * PATCH /api/tasks/{taskId}
 */
export const updateTaskSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Task name is required")
    .max(255, "Task name must not exceed 255 characters")
    .optional(),
  description: z.string().max(5000, "Task description must not exceed 5000 characters").optional(),
  status: z.enum(["active", "completed"]).optional(),
});
