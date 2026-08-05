import { z } from "zod";

export const plannerDraftSchema = z.object({
  planType: z.enum(["pay_someone", "support", "allowance", "creator_support", "donation", "savings", "pay_as_you_use", "custom"]).optional(),
  totalAmount: z.string().optional(),
  durationValue: z.number().int().positive().optional(),
  durationUnit: z.enum(["days", "weeks", "months"]).optional(),
  receiver: z.string().optional(),
  description: z.string().optional()
});

export const plannerResponseSchema = z.object({
  status: z.enum(["needs_input", "ready", "unavailable"]),
  message: z.string(),
  missingFields: z.array(z.string()).default([]),
  assumptions: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
  explanation: z.string().default(""),
  draft: plannerDraftSchema.default({})
});

export type PlannerResponse = z.infer<typeof plannerResponseSchema>;
