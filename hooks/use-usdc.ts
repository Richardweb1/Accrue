"use client";

import { useAccount, useReadContracts } from "wagmi";
import { erc20Abi } from "@/lib/abi";
import { ACCRUE_CONTRACT_ADDRESS, USDC_ADDRESS } from "@/lib/env";

export function useUsdcAccount() {
  const { address } = useAccount();
  const reads = useReadContracts({
    contracts: address && ACCRUE_CONTRACT_ADDRESS ? [
      { address: USDC_ADDRESS, abi: erc20Abi, functionName: "balanceOf", args: [address] },
      { address: USDC_ADDRESS, abi: erc20Abi, functionName: "allowance", args: [address, ACCRUE_CONTRACT_ADDRESS] }
    ] : [],
    query: { enabled: Boolean(address && ACCRUE_CONTRACT_ADDRESS) }
  });

  return {
    balance: (reads.data?.[0]?.result as bigint | undefined) ?? 0n,
    allowance: (reads.data?.[1]?.result as bigint | undefined) ?? 0n,
    isLoading: reads.isLoading,
    refetch: reads.refetch
  };
}
