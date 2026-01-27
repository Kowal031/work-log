import { z } from "zod";

/**
 * Schema for creating a new time entry manually
 * Both fields are required
 */
export const createTimeEntrySchema = z.object({
  start_time: z.string().datetime({ message: "Start time must be a valid ISO 8601 timestamp" }),
  end_time: z.string().datetime({ message: "End time must be a valid ISO 8601 timestamp" }),
  timezone_offset: z.number().int().min(-720).max(840), // Valid timezone offsets in minutes
});

/**
 * Schema for updating a time entry
 * At least one field must be provided
 */
export const updateTimeEntrySchema = z
  .object({
    start_time: z.string().datetime({ message: "Start time must be a valid ISO 8601 timestamp" }).optional(),
    end_time: z.string().datetime({ message: "End time must be a valid ISO 8601 timestamp" }).optional(),
    timezone_offset: z.number().int().min(-720).max(840).optional(), // Valid timezone offsets in minutes
  })
  .refine((data) => data.start_time !== undefined || data.end_time !== undefined, {
    message: "At least one field (start_time or end_time) must be provided",
  });

/**
 * Schema for stopping a time entry
 * Timezone offset is required for capacity validation
 */
export const stopTimeEntrySchema = z.object({
  timezone_offset: z.number().int().min(-720).max(840), // Valid timezone offsets in minutes
});
