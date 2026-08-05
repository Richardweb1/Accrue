import { isAddress, parseUnits } from "viem";
import { parseUsdc, USDC_DECIMALS } from "@/lib/format";
import type { AccruePlan, BudgetAnalysis, BudgetWarning, DisplayRateUnit } from "@/types/plan";

const SECONDS_BY_UNIT: Record<DisplayRateUnit, bigint> = {
  minute: 60n,
  hour: 3600n,
  day: 86400n,
  week: 604800n,
  month: 2592000n
};

export function secondsForUnit(unit: DisplayRateUnit): bigint {
  return SECONDS_BY_UNIT[unit];
}

export function rateAmountToPerSecond(amount: string, unit: DisplayRateUnit): bigint {
  return parseUsdc(amount) / secondsForUnit(unit);
}

export function calculateEndTime(startTime: number, totalBudget: bigint, ratePerSecond: bigint): number | undefined {
  if (ratePerSecond <= 0n || totalBudget <= 0n) return undefined;
  return startTime + Number(totalBudget / ratePerSecond);
}

export function estimateMonthlyOutflow(ratePerSecond: bigint): bigint {
  return ratePerSecond * SECONDS_BY_UNIT.month;
}

export function validatePlanForStream(plan: AccruePlan): BudgetWarning[] {
  const warnings: BudgetWarning[] = [];
  if (!plan.receiver || !isAddress(plan.receiver) || plan.receiver === "0x0000000000000000000000000000000000000000") {
    warnings.push({ code: "invalid_schedule", severity: "blocking", message: "Enter a valid receiver wallet address." });
  }
  if (plan.ratePerSecond <= 0n) {
    warnings.push({ code: "small_rate", severity: "blocking", message: "This payment rate is below the minimum supported USDC precision." });
  }
  if (plan.endTime && plan.endTime <= plan.startTime) {
    warnings.push({ code: "invalid_schedule", severity: "blocking", message: "The selected end date must be later than the start date." });
  }
  return warnings;
}

export function analyzeBudget(input: {
  walletBalance: bigint;
  activeCommitments: bigint;
  newCommitment: bigint;
  reserveAmount?: bigint;
  ratePerSecond: bigint;
  startTime: number;
  endTime?: number;
}): BudgetAnalysis {
  const reserveAmount = input.reserveAmount ?? 0n;
  const remainingFreeBalance = input.walletBalance - input.activeCommitments - input.newCommitment;
  const warnings: BudgetWarning[] = [];

  if (input.activeCommitments > 0n) {
    warnings.push({
      code: "existing_commitments",
      severity: "info",
      message: `You already have ${input.activeCommitments} micro-USDC committed to active Plans.`
    });
  }
  if (remainingFreeBalance < 0n) {
    warnings.push({
      code: "over_commitment",
      severity: "blocking",
      message: "You are trying to commit more USDC than your available balance."
    });
  } else if (remainingFreeBalance < reserveAmount) {
    warnings.push({
      code: "low_reserve",
      severity: "warning",
      message: "This Plan leaves less than your selected reserve outside active commitments."
    });
  }
  if (input.endTime && input.endTime - input.startTime > 183 * 24 * 60 * 60) {
    warnings.push({
      code: "long_term",
      severity: "warning",
      message: "This Plan will remain active for more than six months."
    });
  }
  if (input.ratePerSecond <= 0n) {
    warnings.push({
      code: "small_rate",
      severity: "blocking",
      message: "This payment rate is below the minimum supported precision."
    });
  }

  return {
    walletBalance: input.walletBalance,
    activeCommitments: input.activeCommitments,
    newCommitment: input.newCommitment,
    reserveAmount,
    remainingFreeBalance,
    estimatedMonthlyOutflow: estimateMonthlyOutflow(input.ratePerSecond),
    estimatedCompletionDate: calculateEndTime(input.startTime, input.newCommitment, input.ratePerSecond),
    warnings,
    canCreate: !warnings.some((warning) => warning.severity === "blocking")
  };
}

export function parseReserve(value: string): bigint {
  return parseUnits(value || "0", USDC_DECIMALS);
}
