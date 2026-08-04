"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount, useBlockNumber, useReadContract, useReadContracts } from "wagmi";
import { accrueAbi } from "@/lib/abi";
import { ACCRUE_CONTRACT_ADDRESS, hasContractAddress } from "@/lib/env";

export type Stream = {
  sender: `0x${string}`;
  receiver: `0x${string}`;
  depositedAmount: bigint;
  claimedAmount: bigint;
  ratePerSecond: bigint;
  startTime: number;
  endTime: number;
  lastStateChange: number;
  totalPausedDuration: number;
  pausedAt: number;
  paused: boolean;
  cancelled: boolean;
};

export type StreamWithId = Stream & { id: bigint; accrued: bigint; claimable: bigint; refundable: bigint };

export function useUserStreams() {
  const { address } = useAccount();
  const enabled = Boolean(address && hasContractAddress);
  const contract = ACCRUE_CONTRACT_ADDRESS!;

  const outgoing = useReadContract({
    address: contract,
    abi: accrueAbi,
    functionName: "getSenderStreams",
    args: address ? [address] : undefined,
    query: { enabled }
  });

  const incoming = useReadContract({
    address: contract,
    abi: accrueAbi,
    functionName: "getReceiverStreams",
    args: address ? [address] : undefined,
    query: { enabled }
  });

  const ids = useMemo(() => [...(outgoing.data || []), ...(incoming.data || [])].filter((id, index, arr) => arr.indexOf(id) === index), [outgoing.data, incoming.data]);

  const contracts = ids.flatMap((id) => [
    { address: contract, abi: accrueAbi, functionName: "getStream", args: [id] },
    { address: contract, abi: accrueAbi, functionName: "getAccruedAmount", args: [id] },
    { address: contract, abi: accrueAbi, functionName: "getClaimableAmount", args: [id] },
    { address: contract, abi: accrueAbi, functionName: "getRefundableAmount", args: [id] }
  ] as const);

  const reads = useReadContracts({
    contracts,
    query: { enabled: ids.length > 0 }
  });

  const streams = useMemo<StreamWithId[]>(() => {
    if (!reads.data) return [];
    return ids.map((id, index) => {
      const base = index * 4;
      const stream = reads.data[base]?.result as Stream | undefined;
      return stream
        ? {
            ...stream,
            id,
            startTime: Number(stream.startTime),
            endTime: Number(stream.endTime),
            lastStateChange: Number(stream.lastStateChange),
            totalPausedDuration: Number(stream.totalPausedDuration),
            pausedAt: Number(stream.pausedAt),
            accrued: reads.data[base + 1]?.result as bigint,
            claimable: reads.data[base + 2]?.result as bigint,
            refundable: reads.data[base + 3]?.result as bigint
          }
        : undefined;
    }).filter(Boolean) as StreamWithId[];
  }, [ids, reads.data]);

  return {
    incomingIds: incoming.data || [],
    outgoingIds: outgoing.data || [],
    streams,
    isLoading: outgoing.isLoading || incoming.isLoading || reads.isLoading,
    refetch: async () => {
      await Promise.all([outgoing.refetch(), incoming.refetch(), reads.refetch()]);
    }
  };
}

export function useLiveAccrued(stream?: StreamWithId) {
  const { data: blockNumber } = useBlockNumber({ watch: true });
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return useMemo(() => {
    void blockNumber;
    if (!stream || stream.cancelled || now <= stream.startTime) return stream?.accrued || 0n;
    let until = BigInt(now);
    if (stream.paused) until = BigInt(stream.pausedAt);
    if (stream.endTime && until > BigInt(stream.endTime)) until = BigInt(stream.endTime);
    if (until <= BigInt(stream.startTime)) return 0n;
    const elapsed = until - BigInt(stream.startTime);
    const active = elapsed > BigInt(stream.totalPausedDuration) ? elapsed - BigInt(stream.totalPausedDuration) : 0n;
    const accrued = active * stream.ratePerSecond;
    return accrued > stream.depositedAmount ? stream.depositedAmount : accrued;
  }, [blockNumber, now, stream]);
}
