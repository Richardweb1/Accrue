import assert from "node:assert/strict";
import test from "node:test";
import { parseUnits } from "viem";
import { runPlanSafetyAgent } from "@/lib/agents/plan-safety-agent";
import { analyzeBudget } from "@/lib/plans/calculations";
import type { AccruePlan } from "@/types/plan";

test("safety agent returns ready for a valid funded Plan", () => {
  const plan = samplePlan();
  const analysis = analyzeBudget({
    walletBalance: parseUnits("20", 6),
    activeCommitments: 0n,
    newCommitment: plan.totalBudget,
    ratePerSecond: plan.ratePerSecond,
    startTime: plan.startTime
  });
  assert.equal(runPlanSafetyAgent(plan, analysis).status, "ready");
});

test("safety agent blocks over-committed Plans", () => {
  const plan = samplePlan();
  const analysis = analyzeBudget({
    walletBalance: parseUnits("2", 6),
    activeCommitments: 0n,
    newCommitment: plan.totalBudget,
    ratePerSecond: plan.ratePerSecond,
    startTime: plan.startTime
  });
  assert.equal(runPlanSafetyAgent(plan, analysis).status, "blocked");
});

function samplePlan(): AccruePlan {
  return {
    id: "test",
    planType: "support",
    title: "Mom Support",
    receiver: "0x0000000000000000000000000000000000000002",
    totalBudget: parseUnits("10", 6),
    ratePerSecond: 1n,
    displayRateAmount: "1",
    displayRateUnit: "day",
    startTime: 1000,
    status: "ready",
    createdAt: 1000
  };
}
