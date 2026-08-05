import { z } from "zod";
import { isAddress } from "viem";
import { parseUsdc } from "@/lib/format";
import { rateAmountToPerSecond } from "@/lib/plans/calculations";
import type { AccruePlan, DisplayRateUnit, PlanType } from "@/types/plan";

export const planDraftSchema = z.object({
  source: z.enum(["ai", "template", "manual"]).default("manual"),
  templateId: z.string().optional(),
  planType: z.enum(["pay_someone", "support", "allowance", "creator_support", "donation", "savings", "pay_as_you_use", "custom"]),
  title: z.string().min(1).max(80),
  description: z.string().max(240).optional(),
  explanation: z.string().max(500).optional(),
  receiver: z.string().refine((value) => isAddress(value), "Enter a valid receiver wallet address."),
  totalAmount: z.string().regex(/^\d+(\.\d{1,6})?$/, "Enter a USDC amount with up to 6 decimals."),
  displayRateAmount: z.string().regex(/^\d+(\.\d{1,6})?$/, "Enter a rate with up to 6 decimals."),
  displayRateUnit: z.enum(["minute", "hour", "day", "week", "month"]),
  startTime: z.number().int().positive(),
  endTime: z.number().int().positive().optional(),
  reserveAmount: z.string().regex(/^\d+(\.\d{1,6})?$/).optional()
}).refine((draft) => !draft.endTime || draft.endTime > draft.startTime, {
  message: "The selected end date must be later than the start date.",
  path: ["endTime"]
});

export type PlanDraft = z.infer<typeof planDraftSchema>;

export function encodePlanDraft(draft: PlanDraft): string {
  return encodeURIComponent(btoa(JSON.stringify(draft)));
}

export function decodePlanDraft(value: string | null): PlanDraft {
  if (!value) throw new Error("Missing Plan draft.");
  const raw = JSON.parse(atob(decodeURIComponent(value))) as unknown;
  return planDraftSchema.parse(raw);
}

export function draftToAccruePlan(draft: PlanDraft, owner?: `0x${string}`): AccruePlan {
  const totalBudget = parseUsdc(draft.totalAmount);
  const ratePerSecond = rateAmountToPerSecond(draft.displayRateAmount, draft.displayRateUnit as DisplayRateUnit);
  return {
    id: `${draft.source}-${Date.now()}`,
    owner,
    planType: draft.planType as PlanType,
    title: draft.title,
    description: draft.description,
    explanation: draft.explanation,
    receiver: draft.receiver as `0x${string}`,
    totalBudget,
    ratePerSecond,
    displayRateAmount: draft.displayRateAmount,
    displayRateUnit: draft.displayRateUnit as DisplayRateUnit,
    startTime: draft.startTime,
    endTime: draft.endTime,
    reserveAmount: draft.reserveAmount ? parseUsdc(draft.reserveAmount) : 0n,
    status: "ready",
    createdAt: Date.now()
  };
}
