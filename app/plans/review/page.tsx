"use client";

import { Suspense, useMemo, useState } from "react";
import { isAddress } from "viem";
import { useRouter, useSearchParams } from "next/navigation";
import { useAccount, useChainId } from "wagmi";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";
import { decodePlanDraft, draftToAccruePlan } from "@/lib/plans/draft";
import { describePlanBudget, describePlanRate, planToContractParams, validatePlanReview } from "@/lib/plans/stream-conversion";
import { extractStreamIdFromReceipt } from "@/lib/plans/events";
import { savePlanMetadata } from "@/lib/plans/metadata";
import { needsApproval } from "@/lib/plans/approval";
import { runPlanSafetyAgent } from "@/lib/agents/plan-safety-agent";
import { formatUsdc, shortAddress } from "@/lib/format";
import { ACCRUE_CONTRACT_ADDRESS, ARC_CHAIN_ID } from "@/lib/env";
import { useStreamActions } from "@/hooks/use-stream-actions";
import { useUserStreams } from "@/hooks/use-streams";
import { useUsdcAccount } from "@/hooks/use-usdc";

type Progress = "idle" | "approval" | "stream" | "metadata";

export default function PlanReviewPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-4xl px-4 py-8"><div className="panel h-48 animate-pulse" /></main>}>
      <PlanReviewContent />
    </Suspense>
  );
}

function PlanReviewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { address } = useAccount();
  const chainId = useChainId();
  const usdc = useUsdcAccount();
  const streams = useUserStreams();
  const actions = useStreamActions();
  const [progress, setProgress] = useState<Progress>("idle");
  const [receiverOverride, setReceiverOverride] = useState("");

  const plan = useMemo(() => {
    try {
      const nextPlan = draftToAccruePlan(decodePlanDraft(searchParams.get("draft")), address);
      if (receiverOverride && isAddress(receiverOverride)) nextPlan.receiver = receiverOverride as `0x${string}`;
      return nextPlan;
    } catch {
      return undefined;
    }
  }, [address, receiverOverride, searchParams]);

  const activeCommitments = streams.streams
    .filter((stream) => address && stream.sender.toLowerCase() === address.toLowerCase() && !stream.cancelled)
    .reduce((sum, stream) => sum + stream.refundable, 0n);

  const params = plan ? planToContractParams(plan) : undefined;
  const analysis = plan ? validatePlanReview(plan, usdc.balance, activeCommitments) : undefined;
  const wrongNetwork = chainId !== ARC_CHAIN_ID;
  const canSubmit = Boolean(plan && params && analysis?.canCreate && address && !wrongNetwork && usdc.balance >= params.depositAmount && progress === "idle");
  const agentInsight = plan && analysis ? runPlanSafetyAgent(plan, analysis) : undefined;

  async function confirm() {
    if (!plan || !params || !address || !ACCRUE_CONTRACT_ADDRESS) return;
    try {
      await usdc.refetch();
      if (chainId !== ARC_CHAIN_ID) throw new Error("Switch your wallet to Arc Testnet.");
      if (usdc.balance < params.depositAmount) throw new Error("Insufficient USDC balance for this Plan.");
      if (!analysis?.canCreate) throw new Error("Resolve blocking Plan warnings first.");
      if (needsApproval(params.depositAmount, usdc.allowance)) {
        setProgress("approval");
        await actions.approveIfNeeded(params.depositAmount, usdc.allowance);
      }
      setProgress("stream");
      const receipt = await actions.createStream(params.receiver, params.depositAmount, params.ratePerSecond, params.startTime, params.endTime);
      const streamId = extractStreamIdFromReceipt(receipt);
      setProgress("metadata");
      savePlanMetadata({
        title: plan.title,
        planType: plan.planType,
        description: plan.description,
        explanation: plan.explanation,
        createdAt: Date.now(),
        chainId: ARC_CHAIN_ID,
        contractAddress: ACCRUE_CONTRACT_ADDRESS,
        streamId: streamId.toString(),
        owner: address
      });
      await Promise.all([streams.refetch(), usdc.refetch()]);
      toast.success("Plan created on Arc");
      router.push(`/plans/${streamId.toString()}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Plan creation failed");
      setProgress("idle");
    }
  }

  if (!plan || !params || !analysis) {
    return <main className="mx-auto max-w-4xl px-4 py-8"><div className="panel p-6">This Plan draft is invalid or expired. Please start again.</div></main>;
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <p className="text-sm font-black uppercase text-[#107c5c]">Plan review</p>
      <h1 className="mt-2 text-4xl font-black">{plan.title}</h1>
      <p className="mt-3 text-[#66736d]">{plan.explanation || plan.description || "Review the financial impact before approving transactions."}</p>

      <section className="panel mt-6 p-5">
        <h2 className="text-xl font-black">Plan summary</h2>
        <Review label="Category" value={plan.planType.replaceAll("_", " ")} />
        <Review label="Receiver" value={shortAddress(params.receiver)} />
        <label className="mt-4 block text-sm font-bold text-[#506058]">Receiver wallet address</label>
        <input className="mt-2 w-full rounded-lg border border-[#dfe7e1] bg-white p-3 outline-[#107c5c]" value={receiverOverride || (plan.receiver === "0x0000000000000000000000000000000000000000" ? "" : plan.receiver || "")} onChange={(event) => setReceiverOverride(event.target.value)} placeholder="0x..." />
        <Review label="Total budget" value={describePlanBudget(plan)} />
        <Review label="Duration" value={params.durationLabel} />
        <Review label="Payment rate" value={describePlanRate(plan)} />
        <Review label="Start date" value={new Date(plan.startTime * 1000).toLocaleString()} />
        <Review label="Estimated completion" value={params.completionDate ? new Date(params.completionDate * 1000).toLocaleString() : "Open ended"} />
      </section>

      <section className="panel mt-5 p-5">
        <h2 className="text-xl font-black">Wallet impact</h2>
        <Review label="Current USDC balance" value={`${formatUsdc(usdc.balance)} USDC`} />
        <Review label="Existing commitments" value={`${formatUsdc(activeCommitments)} USDC`} />
        <Review label="New Plan commitment" value={`${formatUsdc(params.depositAmount)} USDC`} />
        <Review label="Remaining uncommitted" value={`${formatUsdc(analysis.remainingFreeBalance)} USDC`} />
        <Review label="Selected reserve" value={`${formatUsdc(analysis.reserveAmount)} USDC`} />
        <Review label="Monthly outgoing estimate" value={`${formatUsdc(analysis.estimatedMonthlyOutflow)} USDC`} />
      </section>

      <section className="panel mt-5 p-5">
        <h2 className="text-xl font-black">Safety and control</h2>
        <p className="mt-3 text-sm leading-6 text-[#66736d]">This Plan is fully funded upfront. You can pause, resume, add funds, or cancel. The receiver keeps accrued funds, and unused USDC returns to the sender on cancellation. The receiver can claim accrued USDC.</p>
        {wrongNetwork && <Warning text="Switch your wallet to Arc Testnet before creating this Plan." blocking />}
        {usdc.balance < params.depositAmount && <Warning text="Your USDC balance is not enough to fund this Plan." blocking />}
        {analysis.warnings.map((warning) => <Warning key={`${warning.code}-${warning.message}`} text={warning.message} blocking={warning.severity === "blocking"} />)}
      </section>

      {agentInsight && (
        <section className="panel mt-5 p-5">
          <p className="text-sm font-black uppercase text-[#107c5c]">{agentInsight.name}</p>
          <h2 className="mt-2 text-xl font-black">{agentInsight.headline}</h2>
          <p className="mt-3 text-sm leading-6 text-[#66736d]">{agentInsight.message}</p>
          <ul className="mt-4 space-y-2 text-sm text-[#506058]">
            {agentInsight.checks.map((check) => <li key={check}>- {check}</li>)}
          </ul>
        </section>
      )}

      <details className="panel mt-5 p-5">
        <summary className="cursor-pointer font-black">Advanced onchain details</summary>
        <div className="mt-4">
          <Review label="Rate per second" value={`${params.ratePerSecond.toString()} micro-USDC`} />
          <Review label="Start timestamp" value={params.startTime.toString()} />
          <Review label="End timestamp" value={params.endTime.toString()} />
          <Review label="Contract" value={ACCRUE_CONTRACT_ADDRESS || "-"} />
          <Review label="Arc chain ID" value={ARC_CHAIN_ID.toString()} />
        </div>
      </details>

      <button disabled={!canSubmit} onClick={confirm} className="btn btn-primary mt-6 w-full">
        {progress === "idle" ? <Check className="h-4 w-4" /> : <Loader2 className="h-4 w-4 animate-spin" />}
        {progress === "approval" ? "Approving exact USDC" : progress === "stream" ? "Creating Plan on Arc" : progress === "metadata" ? "Saving Plan metadata" : "Confirm and Create Plan"}
      </button>
    </main>
  );
}

function Review({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4 border-b border-[#dfe7e1] py-3 text-sm"><span className="text-[#66736d]">{label}</span><span className="max-w-[60%] break-all text-right font-bold capitalize">{value}</span></div>;
}

function Warning({ text, blocking }: { text: string; blocking?: boolean }) {
  return <p className={`mt-3 rounded-lg border p-3 text-sm ${blocking ? "border-[#efaaa3] bg-[#fff1ef] text-[#8a1f13]" : "border-[#f0d18a] bg-[#fff8e6] text-[#725000]"}`}>{text}</p>;
}
