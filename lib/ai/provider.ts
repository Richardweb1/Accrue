import { plannerResponseSchema, type PlannerResponse } from "./schema";

export async function planWithProvider(prompt: string): Promise<PlannerResponse> {
  const provider = process.env.AI_PROVIDER;
  const apiKey = process.env.AI_API_KEY;

  if (!provider || !apiKey) {
    return fallbackPlanner(prompt);
  }

  return {
    status: "unavailable",
    message: "AI Planner is unavailable. You can still create your Plan manually.",
    missingFields: [],
    assumptions: [],
    warnings: ["AI provider integration is configured as a server-side extension point but not enabled in this build."],
    explanation: "",
    draft: {}
  };
}

export function fallbackPlanner(prompt: string): PlannerResponse {
  const lower = prompt.toLowerCase();
  const amount = lower.match(/(\d+(?:\.\d+)?)\s*usdc/)?.[1];
  const durationMatch = lower.match(/over\s+(\d+)\s+(day|days|week|weeks|month|months)/);
  const durationValue = durationMatch ? Number(durationMatch[1]) : undefined;
  const durationUnit = durationMatch?.[2]?.startsWith("day") ? "days" : durationMatch?.[2]?.startsWith("week") ? "weeks" : durationMatch ? "months" : undefined;
  const planType = lower.includes("save") ? "savings" : lower.includes("mother") || lower.includes("family") || lower.includes("support") ? "support" : lower.includes("allowance") || lower.includes("child") ? "allowance" : lower.includes("creator") ? "creator_support" : lower.includes("donat") ? "donation" : "pay_someone";
  const missingFields = [
    !amount ? "amount" : undefined,
    !durationValue ? "duration" : undefined,
    "receiver"
  ].filter(Boolean) as string[];

  return plannerResponseSchema.parse({
    status: missingFields.length ? "needs_input" : "ready",
    message: missingFields.length ? `I need ${missingFields.join(", ")} before preparing the Plan.` : "Plan draft is ready for review.",
    missingFields,
    assumptions: durationUnit === "months" ? ["A month is estimated as 30 days for stream calculations."] : [],
    warnings: [],
    explanation: "Accrue will prepare a capped USDC stream. You must review and approve every transaction.",
    draft: {
      planType,
      totalAmount: amount,
      durationValue,
      durationUnit,
      description: prompt
    }
  });
}
