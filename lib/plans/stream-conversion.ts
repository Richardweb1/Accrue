import { isAddress } from "viem";
import { ARC_CHAIN_ID, ACCRUE_CONTRACT_ADDRESS } from "@/lib/env";
import { formatUsdc } from "@/lib/format";
import { analyzeBudget, calculateEndTime, validatePlanForStream } from "@/lib/plans/calculations";
import type { AccruePlan, BudgetAnalysis, BudgetWarning } from "@/types/plan";

export type PlanContractParams = {
  receiver: `0x${string}`;
  depositAmount: bigint;
  ratePerSecond: bigint;
  startTime: bigint;
  endTime: bigint;
  durationLabel: string;
  monthlyEstimate: bigint;
  completionDate?: number;
  chainId: number;
  contractAddress?: `0x${string}`;
};

export function planToContractParams(plan: AccruePlan): PlanContractParams {
  if (!plan.receiver || !isAddress(plan.receiver)) throw new Error("Invalid receiver address.");
  if (plan.totalBudget <= 0n) throw new Error("Plan budget must be greater than zero.");
  if (plan.ratePerSecond <= 0n) throw new Error("Payment rate is below supported USDC precision.");
  if (plan.endTime && plan.endTime <= plan.startTime) throw new Error("Invalid Plan schedule.");
  const completionDate = plan.endTime ?? calculateEndTime(plan.startTime, plan.totalBudget, plan.ratePerSecond);
  return {
    receiver: plan.receiver,
    depositAmount: plan.totalBudget,
    ratePerSecond: plan.ratePerSecond,
    startTime: BigInt(plan.startTime),
    endTime: BigInt(plan.endTime ?? 0),
    durationLabel: completionDate ? `${Math.max(1, Math.ceil((completionDate - plan.startTime) / 86400))} days` : "Open ended",
    monthlyEstimate: plan.ratePerSecond * 2592000n,
    completionDate,
    chainId: ARC_CHAIN_ID,
    contractAddress: ACCRUE_CONTRACT_ADDRESS
  };
}

export function validatePlanReview(plan: AccruePlan, walletBalance: bigint, activeCommitments: bigint, sender?: `0x${string}`): BudgetAnalysis {
  const params = planToContractParams(plan);
  const analysis = analyzeBudget({
    walletBalance,
    activeCommitments,
    newCommitment: params.depositAmount,
    reserveAmount: plan.reserveAmount,
    ratePerSecond: params.ratePerSecond,
    startTime: Number(params.startTime),
    endTime: params.endTime > 0n ? Number(params.endTime) : undefined
  });
  const streamWarnings = validatePlanForStream(plan);
  const senderWarnings: BudgetWarning[] = sender && params.receiver.toLowerCase() === sender.toLowerCase()
    ? [{
        code: "self_receiver",
        severity: "blocking" as const,
        message: "Receiver cannot be your connected wallet. Use another wallet address."
      }]
    : [];
  return {
    ...analysis,
    warnings: [...streamWarnings, ...senderWarnings, ...analysis.warnings],
    canCreate: analysis.canCreate && [...streamWarnings, ...senderWarnings].every((warning) => warning.severity !== "blocking")
  };
}

export function describePlanRate(plan: AccruePlan): string {
  return `${plan.displayRateAmount} USDC per ${plan.displayRateUnit}`;
}

export function describePlanBudget(plan: AccruePlan): string {
  return `${formatUsdc(plan.totalBudget)} USDC`;
}
