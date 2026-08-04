"use client";

import { useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { toast } from "sonner";
import { accrueAbi, erc20Abi } from "@/lib/abi";
import { ACCRUE_CONTRACT_ADDRESS, USDC_ADDRESS } from "@/lib/env";

export function useStreamActions() {
  const { address } = useAccount();
  const { data: hash, writeContractAsync, isPending } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash });

  async function approve(amount: bigint) {
    if (!ACCRUE_CONTRACT_ADDRESS) throw new Error("Missing Accrue contract address");
    toast.info("Approving exact USDC amount");
    return writeContractAsync({
      address: USDC_ADDRESS,
      abi: erc20Abi,
      functionName: "approve",
      args: [ACCRUE_CONTRACT_ADDRESS, amount]
    });
  }

  async function createStream(receiver: `0x${string}`, deposit: bigint, rate: bigint, start: bigint, end: bigint) {
    if (!ACCRUE_CONTRACT_ADDRESS) throw new Error("Missing Accrue contract address");
    toast.info("Creating funded stream");
    return writeContractAsync({
      address: ACCRUE_CONTRACT_ADDRESS,
      abi: accrueAbi,
      functionName: "createStream",
      args: [receiver, deposit, rate, start, end],
      account: address
    });
  }

  async function callStreamAction(action: "claim" | "pauseStream" | "resumeStream" | "cancelStream", streamId: bigint) {
    if (!ACCRUE_CONTRACT_ADDRESS) throw new Error("Missing Accrue contract address");
    return writeContractAsync({
      address: ACCRUE_CONTRACT_ADDRESS,
      abi: accrueAbi,
      functionName: action,
      args: [streamId]
    });
  }

  async function addFunds(streamId: bigint, amount: bigint) {
    if (!ACCRUE_CONTRACT_ADDRESS) throw new Error("Missing Accrue contract address");
    await approve(amount);
    return writeContractAsync({
      address: ACCRUE_CONTRACT_ADDRESS,
      abi: accrueAbi,
      functionName: "addFunds",
      args: [streamId, amount]
    });
  }

  return { approve, createStream, callStreamAction, addFunds, hash, isPending, receipt };
}
