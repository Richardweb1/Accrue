"use client";

import { useState } from "react";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { toast } from "sonner";
import { erc20Abi } from "@/lib/abi";
import { ARC_CHAIN_ID, ARC_EXPLORER_URL, USDC_ADDRESS } from "@/lib/env";
import { saveInstantSendActivity, saveRecentRecipient } from "@/lib/instant-send/storage";

type SendState = "idle" | "awaiting_signature" | "pending" | "success" | "error";

function errorMessage(error: unknown) {
  if (error instanceof Error) {
    const maybeShort = error as Error & { shortMessage?: string };
    return maybeShort.shortMessage || error.message;
  }
  return "Instant Send failed.";
}

export function useInstantSend() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const [state, setState] = useState<SendState>("idle");
  const [hash, setHash] = useState<`0x${string}`>();
  const [error, setError] = useState("");

  async function send(recipient: `0x${string}`, amount: bigint, amountLabel: string, memo?: string) {
    if (!address) throw new Error("Connect your wallet first.");
    if (!publicClient) throw new Error("RPC client is not ready.");
    try {
      setError("");
      setState("awaiting_signature");
      const txHash = await writeContractAsync({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: "transfer",
        args: [recipient, amount],
        account: address,
        chainId: ARC_CHAIN_ID
      });
      setHash(txHash);
      setState("pending");
      await publicClient.waitForTransactionReceipt({ hash: txHash, pollingInterval: 1_000, timeout: 120_000 });
      saveRecentRecipient(address, recipient);
      saveInstantSendActivity({
        id: `${txHash}-${Date.now()}`,
        owner: address,
        recipient,
        amount: amountLabel,
        memo: memo?.trim() || undefined,
        hash: txHash,
        createdAt: Date.now()
      });
      toast.success("Instant Send completed", {
        action: {
          label: "ArcScan",
          onClick: () => window.open(`${ARC_EXPLORER_URL}/tx/${txHash}`, "_blank", "noopener,noreferrer")
        }
      });
      setState("success");
      return txHash;
    } catch (caught) {
      const message = errorMessage(caught);
      setError(message);
      setState("error");
      toast.error(message);
      throw caught;
    }
  }

  function reset() {
    setState("idle");
    setHash(undefined);
    setError("");
  }

  return { send, reset, state, hash, error };
}
