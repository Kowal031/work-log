import { z } from "zod";

/**
 * Schema for daily summary query parameters
 * Both dates are optional and should be in YYYY-MM-DD format
 */
export const dailySummaryQuerySchema = z.object({
  date_from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .optional(),
  date_to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .optional(),
  timezone_offset: z.coerce.number().int().min(-720).max(840),
});
