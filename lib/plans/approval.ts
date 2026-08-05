export function needsApproval(requiredAmount: bigint, allowance: bigint): boolean {
  return allowance < requiredAmount;
}
