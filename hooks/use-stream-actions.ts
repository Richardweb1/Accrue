"use client";

import { useWriteContract, useWaitForTransactionReceipt, useAccount, usePublicClient } from "wagmi";
import { toast } from "sonner";
import { accrueAbi, erc20Abi } from "@/lib/abi";
import { ACCRUE_CONTRACT_ADDRESS, USDC_ADDRESS } from "@/lib/env";

export function useStreamActions() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: hash, writeContractAsync, isPending } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash });

  async function waitFor(hashToWaitFor: `0x${string}`) {
    if (!publicClient) throw new Error("RPC client is not ready");
    return publicClient.waitForTransactionReceipt({ hash: hashToWaitFor });
  }

  async function approve(amount: bigint) {
    if (!ACCRUE_CONTRACT_ADDRESS) throw new Error("Missing Accrue contract address");
    toast.info("Approving exact USDC amount");
    const approvalHash = await writeContractAsync({
      address: USDC_ADDRESS,
      abi: erc20Abi,
      functionName: "approve",
      args: [ACCRUE_CONTRACT_ADDRESS, amount]
    });
    await waitFor(approvalHash);
    return approvalHash;
  }

  async function approveIfNeeded(amount: bigint, allowance: bigint) {
    if (allowance >= amount) return undefined;
    const approvalHash = await approve(amount);
    return waitFor(approvalHash);
  }

  async function createStream(receiver: `0x${string}`, deposit: bigint, rate: bigint, start: bigint, end: bigint) {
    if (!ACCRUE_CONTRACT_ADDRESS) throw new Error("Missing Accrue contract address");
    toast.info("Creating funded stream");
    const streamHash = await writeContractAsync({
      address: ACCRUE_CONTRACT_ADDRESS,
      abi: accrueAbi,
      functionName: "createStream",
      args: [receiver, deposit, rate, start, end],
      account: address
    });
    return waitFor(streamHash);
  }

  async function callStreamAction(action: "claim" | "pauseStream" | "resumeStream" | "cancelStream", streamId: bigint) {
    if (!ACCRUE_CONTRACT_ADDRESS) throw new Error("Missing Accrue contract address");
    const actionHash = await writeContractAsync({
      address: ACCRUE_CONTRACT_ADDRESS,
      abi: accrueAbi,
      functionName: action,
      args: [streamId]
    });
    await waitFor(actionHash);
    return actionHash;
  }

  async function addFunds(streamId: bigint, amount: bigint) {
    if (!ACCRUE_CONTRACT_ADDRESS) throw new Error("Missing Accrue contract address");
    await approve(amount);
    const fundHash = await writeContractAsync({
      address: ACCRUE_CONTRACT_ADDRESS,
      abi: accrueAbi,
      functionName: "addFunds",
      args: [streamId, amount]
    });
    await waitFor(fundHash);
    return fundHash;
  }

  return { approve, approveIfNeeded, createStream, callStreamAction, addFunds, hash, isPending, receipt };
}
