import type { StreamWithId } from "@/hooks/use-streams";

export type PlanHealth = "Draft" | "Ready" | "Scheduled" | "Healthy" | "Ending Soon" | "Low Balance" | "Paused" | "Completed" | "Cancelled";

export function planHealth(stream?: StreamWithId): PlanHealth {
  if (!stream) return "Draft";
  const now = Math.floor(Date.now() / 1000);
  if (stream.cancelled) return "Cancelled";
  if (stream.paused) return "Paused";
  if (now < stream.startTime) return "Scheduled";
  if (stream.claimedAmount >= stream.depositedAmount) return "Completed";
  if (stream.refundable < stream.depositedAmount / 10n) return "Low Balance";
  if (stream.endTime && stream.endTime - now < 7 * 86400) return "Ending Soon";
  return "Healthy";
}
