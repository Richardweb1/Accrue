import { formatUsdc } from "@/lib/format";
import type { AccruePlan, BudgetAnalysis } from "@/types/plan";

export type SafetyAgentInsight = {
  name: "Accrue Safety Agent";
  status: "ready" | "needs_attention" | "blocked";
  headline: string;
  message: string;
  checks: string[];
};

export function runPlanSafetyAgent(plan: AccruePlan, analysis: BudgetAnalysis): SafetyAgentInsight {
  const blocking = analysis.warnings.filter((warning) => warning.severity === "blocking");
  const warnings = analysis.warnings.filter((warning) => warning.severity === "warning");

  if (blocking.length > 0) {
    return {
      name: "Accrue Safety Agent",
      status: "blocked",
      headline: "This Plan is not ready yet",
      message: blocking[0].message,
      checks: [
        "Fix blocking validation issues before creating the Plan.",
        "Accrue will not approve or create a stream until the Plan is valid.",
        "The user must still approve every wallet transaction."
      ]
    };
  }

  if (warnings.length > 0) {
    return {
      name: "Accrue Safety Agent",
      status: "needs_attention",
      headline: "Review this Plan carefully",
      message: warnings[0].message,
      checks: [
        `${formatUsdc(plan.totalBudget)} USDC will be committed upfront.`,
        `${formatUsdc(analysis.remainingFreeBalance)} USDC remains outside this new commitment.`,
        "The sender can pause, resume, add funds, or cancel later."
      ]
    };
  }

  return {
    name: "Accrue Safety Agent",
    status: "ready",
    headline: "This Plan looks ready",
    message: `${plan.title} is fully funded and passes deterministic safety checks.`,
    checks: [
      `${formatUsdc(plan.totalBudget)} USDC will be approved exactly if needed.`,
      "The stream ID will be read from the StreamCreated event after confirmation.",
      "The AI does not control the wallet or sign transactions."
    ]
  };
}
