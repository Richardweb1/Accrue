import assert from "node:assert/strict";
import test from "node:test";
import { fallbackPlanner } from "@/lib/ai/provider";
import { plannerResponseSchema } from "@/lib/ai/schema";
import { draftToAccruePlan, type PlanDraft } from "@/lib/plans/draft";

test("fallback planner asks for receiver", () => {
  const response = fallbackPlanner("Support my mother with 100 USDC over one month.");
  assert.equal(response.status, "needs_input");
  assert.equal(response.missingFields.includes("receiver"), true);
});

test("planner response schema rejects invalid status", () => {
  assert.equal(plannerResponseSchema.safeParse({ status: "send_money", message: "bad" }).success, false);
});

test("AI draft converts to review Plan shape after missing fields are filled", () => {
  const response = fallbackPlanner("Pay my tutor 60 USDC over 10 days.");
  const draft: PlanDraft = {
    source: "ai",
    planType: response.draft.planType || "pay_someone",
    title: "Tutor Plan",
    receiver: "0x0000000000000000000000000000000000000002",
    totalAmount: response.draft.totalAmount || "60",
    displayRateAmount: "6",
    displayRateUnit: "day",
    startTime: 1000,
    endTime: 1000 + 10 * 86400,
    reserveAmount: "0"
  };
  const plan = draftToAccruePlan(draft);
  assert.equal(plan.totalBudget, 60_000_000n);
});
