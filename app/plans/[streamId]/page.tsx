"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { streamStatus } from "@/components/stream-card";
import { useLiveAccrued, useUserStreams } from "@/hooks/use-streams";
import { useStreamActions } from "@/hooks/use-stream-actions";
import { fallbackPlanTitle, loadPlanMetadata, type PlanMetadata } from "@/lib/plans/metadata";
import { formatUsdc, shortAddress } from "@/lib/format";
import { parseUsdc } from "@/lib/format";
import { ACCRUE_CONTRACT_ADDRESS, ARC_EXPLORER_URL } from "@/lib/env";

export default function PlanDetailsPage() {
  const params = useParams<{ streamId: string }>();
  const id = BigInt(params.streamId);
  const { streams, refetch } = useUserStreams();
  const stream = streams.find((item) => item.id === id);
  const live = useLiveAccrued(stream);
  const actions = useStreamActions();
  const [metadata, setMetadata] = useState<PlanMetadata | undefined>();
  const [fundAmount, setFundAmount] = useState("5");

  useEffect(() => {
    setMetadata(loadPlanMetadata(params.streamId));
  }, [params.streamId]);

  async function run(action: "claim" | "pauseStream" | "resumeStream" | "cancelStream") {
    try {
      if (action === "cancelStream" && stream && !window.confirm(`Cancel Plan? Receiver keeps ${formatUsdc(live - stream.claimedAmount)} USDC accrued. Unused funds return to sender.`)) return;
      await actions.callStreamAction(action, id);
      toast.success("Transaction confirmed");
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Transaction failed");
    }
  }

  async function addFunds() {
    try {
      await actions.addFunds(id, parseUsdc(fundAmount));
      toast.success("Funds added");
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Funding failed");
    }
  }

  if (!stream) {
    return <main className="mx-auto max-w-4xl px-4 py-8"><div className="panel p-6">Connect the related wallet to view {fallbackPlanTitle(params.streamId)}.</div></main>;
  }

  const title = metadata?.title || fallbackPlanTitle(params.streamId);
  const monthlyRate = stream.ratePerSecond * 2592000n;
  const completion = stream.endTime ? new Date(stream.endTime * 1000).toLocaleString() : "When funded balance is depleted";

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <p className="text-sm font-black uppercase text-[#107c5c]">{metadata?.planType?.replaceAll("_", " ") || "Payment Plan"}</p>
      <h1 className="mt-2 text-4xl font-black">{title}</h1>
      <p className="mt-3 text-[#66736d]">{metadata?.explanation || metadata?.description || "This Plan is settled by an Accrue stream on Arc."}</p>

      <section className="panel mt-6 p-6">
        <p className="text-sm text-[#66736d]">Live accrued estimate</p>
        <div className="mt-2 text-5xl font-black text-[#107c5c]">{formatUsdc(live)} USDC</div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Metric label="Status" value={streamStatus(stream)} />
          <Metric label="Total funded" value={`${formatUsdc(stream.depositedAmount)} USDC`} />
          <Metric label="Claimed" value={`${formatUsdc(stream.claimedAmount)} USDC`} />
          <Metric label="Remaining" value={`${formatUsdc(stream.depositedAmount - live)} USDC`} />
          <Metric label="Monthly estimate" value={`${formatUsdc(monthlyRate)} USDC`} />
          <Metric label="Completion" value={completion} />
          <Metric label="Sender" value={shortAddress(stream.sender)} />
          <Metric label="Receiver" value={shortAddress(stream.receiver)} />
        </div>
      </section>

      <section className="mt-6 grid gap-3 sm:grid-cols-4">
        <button className="btn btn-primary" onClick={() => run("claim")}>Claim</button>
        <button className="btn btn-secondary" onClick={() => run("pauseStream")}>Pause</button>
        <button className="btn btn-secondary" onClick={() => run("resumeStream")}>Resume</button>
        <button className="btn btn-secondary" onClick={() => run("cancelStream")}>Cancel</button>
      </section>
      <section className="panel mt-5 p-5">
        <h2 className="text-xl font-black">Add funds</h2>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input className="min-h-11 flex-1 rounded-lg border border-[#dfe7e1] bg-white p-3 outline-[#107c5c]" value={fundAmount} onChange={(event) => setFundAmount(event.target.value)} />
          <button className="btn btn-secondary" onClick={addFunds}>Add USDC</button>
        </div>
      </section>

      <details className="panel mt-6 p-5">
        <summary className="cursor-pointer font-black">Advanced onchain details</summary>
        <div className="mt-4">
          <Metric label="Stream ID" value={params.streamId} />
          <Metric label="Contract" value={ACCRUE_CONTRACT_ADDRESS || "-"} />
          <Metric label="Rate per second" value={`${stream.ratePerSecond.toString()} micro-USDC`} />
          <Metric label="Start timestamp" value={stream.startTime.toString()} />
          <Metric label="End timestamp" value={stream.endTime.toString()} />
          <a className="btn btn-secondary mt-4" href={`${ARC_EXPLORER_URL}/address/${ACCRUE_CONTRACT_ADDRESS}`} target="_blank">View on ArcScan</a>
        </div>
      </details>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="border-b border-[#dfe7e1] py-3"><p className="text-sm text-[#66736d]">{label}</p><p className="mt-1 break-all font-black">{value}</p></div>;
}
