import { ACCRUE_CONTRACT_ADDRESS, ARC_CHAIN_ID } from "@/lib/env";
import type { PlanType } from "@/types/plan";

export type PlanMetadata = {
  title: string;
  planType: PlanType;
  description?: string;
  explanation?: string;
  templateId?: string;
  createdAt: number;
  chainId: number;
  contractAddress: `0x${string}`;
  streamId: string;
  owner: `0x${string}`;
};

export function metadataKey(chainId: number, contractAddress: string, streamId: string | bigint): string {
  return `accrue:plan:${chainId}:${contractAddress.toLowerCase()}:${streamId.toString()}`;
}

export function fallbackPlanTitle(streamId: string | bigint): string {
  return `Payment Plan #${streamId.toString()}`;
}

export function savePlanMetadata(metadata: PlanMetadata) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(metadataKey(metadata.chainId, metadata.contractAddress, metadata.streamId), JSON.stringify(metadata));
}

export function loadPlanMetadata(streamId: string | bigint): PlanMetadata | undefined {
  if (typeof window === "undefined" || !ACCRUE_CONTRACT_ADDRESS) return undefined;
  const raw = window.localStorage.getItem(metadataKey(ARC_CHAIN_ID, ACCRUE_CONTRACT_ADDRESS, streamId));
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as PlanMetadata;
  } catch {
    return undefined;
  }
}
